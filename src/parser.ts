import * as yaml from 'js-yaml';
import {
  DocumentNode,
  ASTNode,
  NodeType,
  Annotation,
  AnnotationType,
  MapNode,
  ArrayNode,
  ScalarNode,
  MapEntry,
  ParseOptions
} from './types';
import {
  isYTTAnnotation,
  isDocumentSeparator,
  parseAnnotation,
  parseInlineAnnotation
} from './utils';

export class YTTParser {
  private options: ParseOptions;

  constructor(options: ParseOptions = {}) {
    this.options = {
      preserveComments: false,
      strict: false,
      ...options
    };
  }

  parse(input: string): DocumentNode {
    const lines = input.split('\n');
    const { documentAnnotations, yamlContent, inlineAnnotations } = this.extractAnnotations(lines);

    const content = yamlContent ? this.parseYAMLContent(yamlContent, inlineAnnotations) : null;

    return {
      type: NodeType.DOCUMENT,
      annotations: documentAnnotations,
      content
    };
  }

  private extractAnnotations(lines: string[]): {
    documentAnnotations: Annotation[];
    yamlContent: string;
    inlineAnnotations: Map<number, Annotation>;
  } {
    const documentAnnotations: Annotation[] = [];
    const inlineAnnotations = new Map<number, Annotation>();
    let yamlStartIndex = 0;
    let inYAMLSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (isDocumentSeparator(line)) {
        yamlStartIndex = i + 1;
        inYAMLSection = true;
        continue;
      }

      if (!inYAMLSection && isYTTAnnotation(line)) {
        // Check if this starts a multi-line block
        const multiLineAnnotation = this.extractMultiLineAnnotation(lines, i);
        if (multiLineAnnotation) {
          documentAnnotations.push(multiLineAnnotation.annotation);
          // Clear the lines and skip ahead
          for (let j = i; j <= multiLineAnnotation.endIndex; j++) {
            lines[j] = '';
          }
          i = multiLineAnnotation.endIndex;
        } else {
          const annotation = parseAnnotation(line);
          if (annotation) {
            documentAnnotations.push(annotation);
          }
          lines[i] = '';
        }
      } else if (inYAMLSection && isYTTAnnotation(line)) {
        const annotation = parseAnnotation(line);
        if (annotation) {
          inlineAnnotations.set(i - yamlStartIndex, annotation);
          lines[i] = '';
        }
      }
    }

    const yamlContent = lines.slice(yamlStartIndex).join('\n');

    return {
      documentAnnotations,
      yamlContent,
      inlineAnnotations
    };
  }

  private extractMultiLineAnnotation(lines: string[], startIndex: number): { annotation: Annotation; endIndex: number } | null {
    const firstLine = lines[startIndex];
    const match = firstLine.match(/^\s*#@\s+(.+)$/);
    if (!match) return null;

    const content = match[1];

    // Check if this line starts a multi-line block (ends with { or has = { pattern)
    if (!content.includes('=') || (!content.endsWith('{') && !content.includes('= {'))) {
      return null;
    }

    // Find the end of the block by counting braces
    let braceCount = (content.match(/\{/g) || []).length - (content.match(/\}/g) || []).length;
    let endIndex = startIndex;
    const blockLines = [content];

    // If braces are balanced on first line, it's not a multi-line block
    if (braceCount === 0 && content.includes('}')) {
      return null;
    }

    // Look for continuation lines
    for (let i = startIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      // Stop if we hit a non-annotation line or document separator
      if (!isYTTAnnotation(line) || isDocumentSeparator(line)) {
        break;
      }

      const lineMatch = line.match(/^\s*#@\s?(.*)$/);
      if (lineMatch) {
        const lineContent = lineMatch[1];
        blockLines.push(lineContent);
        braceCount += (lineContent.match(/\{/g) || []).length - (lineContent.match(/\}/g) || []).length;
        endIndex = i;

        if (braceCount === 0) {
          break;
        }
      }
    }

    // Only treat as multi-line if we found multiple lines
    if (blockLines.length > 1) {
      return {
        annotation: {
          type: AnnotationType.CODE,
          value: blockLines.join('\n')
        },
        endIndex
      };
    }

    return null;
  }

  private parseYAMLContent(yamlContent: string, inlineAnnotations: Map<number, Annotation>): ASTNode | null {
    if (!yamlContent.trim()) {
      return null;
    }

    try {
      const parsed = yaml.load(yamlContent);
      return this.convertToAST(parsed, yamlContent, inlineAnnotations);
    } catch (error) {
      if (this.options.strict) {
        throw new Error(`Failed to parse YAML: ${error}`);
      }
      return this.fallbackParse(yamlContent, inlineAnnotations);
    }
  }

  private convertToAST(
    value: any,
    originalYaml: string,
    inlineAnnotations: Map<number, Annotation>
  ): ASTNode {
    if (value === null || value === undefined) {
      return {
        type: NodeType.SCALAR,
        value: null
      };
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return {
        type: NodeType.SCALAR,
        value
      };
    }

    if (Array.isArray(value)) {
      return {
        type: NodeType.ARRAY,
        items: value.map(item => this.convertToAST(item, originalYaml, inlineAnnotations))
      };
    }

    if (typeof value === 'object') {
      const entries: MapEntry[] = [];
      const yamlLines = originalYaml.split('\n');

      for (const [key, val] of Object.entries(value)) {
        const entry: MapEntry = {
          key,
          value: this.convertToAST(val, originalYaml, inlineAnnotations),
          annotations: []
        };

        for (let i = 0; i < yamlLines.length; i++) {
          const line = yamlLines[i];
          if (line.includes(key + ':')) {
            const { annotation, cleanValue } = parseInlineAnnotation(line);
            if (annotation) {
              entry.annotations.push(annotation);
              if (!cleanValue || cleanValue === key + ':') {
                entry.value = null;
              }
            }

            const blockAnnotation = inlineAnnotations.get(i);
            if (blockAnnotation) {
              entry.annotations.push(blockAnnotation);
            }
            break;
          }
        }

        entries.push(entry);
      }

      return {
        type: NodeType.MAP,
        entries
      };
    }

    return {
      type: NodeType.SCALAR,
      value: String(value)
    };
  }

  private fallbackParse(yamlContent: string, inlineAnnotations: Map<number, Annotation>): ASTNode {
    const lines = yamlContent.split('\n');
    const entries: MapEntry[] = [];
    const stack: { node: MapNode | ArrayNode; indent: number }[] = [];
    const root: MapNode = { type: NodeType.MAP, entries };

    stack.push({ node: root, indent: -1 });

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const indent = line.search(/\S/);

      while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
        stack.pop();
      }

      const kvMatch = trimmed.match(/^([\w-]+):\s*(.*)$/);
      if (kvMatch) {
        const [, key, value] = kvMatch;
        const { annotation, cleanValue } = parseInlineAnnotation(value);

        const entry: MapEntry = {
          key,
          value: cleanValue ? { type: NodeType.SCALAR, value: cleanValue } : null,
          annotations: annotation ? [annotation] : []
        };

        const blockAnnotation = inlineAnnotations.get(i);
        if (blockAnnotation) {
          entry.annotations.push(blockAnnotation);
        }

        const parent = stack[stack.length - 1].node;
        if (parent.type === NodeType.MAP) {
          parent.entries.push(entry);

          if (!cleanValue && i + 1 < lines.length) {
            const nextLine = lines[i + 1];
            const nextIndent = nextLine.search(/\S/);
            if (nextIndent > indent) {
              const newMap: MapNode = { type: NodeType.MAP, entries: [] };
              entry.value = newMap;
              stack.push({ node: newMap, indent });
            }
          }
        }
      }

      const arrayMatch = trimmed.match(/^-\s+(.*)$/);
      if (arrayMatch) {
        const value = arrayMatch[1];
        const parent = stack[stack.length - 1].node;

        if (parent.type === NodeType.MAP && parent.entries.length > 0) {
          const lastEntry = parent.entries[parent.entries.length - 1];
          if (!lastEntry.value) {
            const newArray: ArrayNode = { type: NodeType.ARRAY, items: [] };
            lastEntry.value = newArray;
            stack.push({ node: newArray, indent: indent - 2 });
          }
        }

        const currentParent = stack[stack.length - 1].node;
        if (currentParent.type === NodeType.ARRAY) {
          currentParent.items.push({ type: NodeType.SCALAR, value });
        }
      }
    }

    return root;
  }
}