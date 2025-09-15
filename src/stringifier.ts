import {
  DocumentNode,
  ASTNode,
  NodeType,
  Annotation,
  MapNode,
  ArrayNode,
  ScalarNode,
  MapEntry,
  StringifyOptions,
  AnnotationType
} from './types';

export class YTTStringifier {
  private options: StringifyOptions;

  constructor(options: StringifyOptions = {}) {
    this.options = {
      indent: 2,
      preserveEmptyLines: false,
      ...options
    };
  }

  stringify(ast: DocumentNode): string {
    const lines: string[] = [];

    if (ast.annotations && ast.annotations.length > 0) {
      for (const annotation of ast.annotations) {
        lines.push(`#@ ${annotation.value}`);
      }
    }

    lines.push('---');

    if (ast.content) {
      const contentLines = this.stringifyNode(ast.content, 0);
      lines.push(...contentLines);
    }

    return lines.join('\n');
  }

  private stringifyNode(node: ASTNode, indentLevel: number): string[] {
    const lines: string[] = [];
    const indent = ' '.repeat(indentLevel);

    switch (node.type) {
      case NodeType.SCALAR:
        return this.stringifyScalar(node);

      case NodeType.MAP:
        return this.stringifyMap(node, indentLevel);

      case NodeType.ARRAY:
        return this.stringifyArray(node, indentLevel);

      case NodeType.DOCUMENT:
        if (node.content) {
          return this.stringifyNode(node.content, indentLevel);
        }
        return [];

      default:
        return [];
    }
  }

  private stringifyScalar(node: ScalarNode): string[] {
    if (node.value === null) {
      return ['null'];
    }
    if (typeof node.value === 'string' && node.value.includes('\n')) {
      return ['|', ...node.value.split('\n').map(line => '  ' + line)];
    }
    return [String(node.value)];
  }

  private stringifyMap(node: MapNode, indentLevel: number): string[] {
    const lines: string[] = [];
    const indent = ' '.repeat(indentLevel);

    for (const entry of node.entries) {
      const blockAnnotations = entry.annotations.filter(a => a.type === AnnotationType.BLOCK);
      for (const annotation of blockAnnotations) {
        lines.push(`${indent}#@ ${annotation.value}`);
      }

      let keyLine = `${indent}${entry.key}:`;

      const expressionAnnotation = entry.annotations.find(a => a.type === AnnotationType.EXPRESSION);
      if (expressionAnnotation) {
        keyLine += ` #@ ${expressionAnnotation.value}`;
        lines.push(keyLine);
      } else if (entry.value) {
        if (entry.value.type === NodeType.SCALAR) {
          const scalarValue = (entry.value as ScalarNode).value;
          if (scalarValue !== null && scalarValue !== undefined && String(scalarValue) !== '') {
            if (typeof scalarValue === 'string' && scalarValue.includes('\n')) {
              lines.push(keyLine + ' |');
              const valueLines = scalarValue.split('\n');
              for (const valueLine of valueLines) {
                lines.push(`${indent}${' '.repeat(this.options.indent!)}${valueLine}`);
              }
            } else {
              keyLine += ` ${scalarValue}`;
              lines.push(keyLine);
            }
          } else if (scalarValue === null) {
            keyLine += ' null';
            lines.push(keyLine);
          } else {
            lines.push(keyLine);
          }
        } else {
          lines.push(keyLine);
          const childLines = this.stringifyNode(entry.value, indentLevel + this.options.indent!);
          lines.push(...childLines);
        }
      } else {
        lines.push(keyLine);
      }

      const endAnnotations = entry.annotations.filter(
        a => a.type === AnnotationType.BLOCK && a.keyword === 'end'
      );
      for (const annotation of endAnnotations) {
        lines.push(`${indent}#@ end`);
      }
    }

    return lines;
  }

  private stringifyArray(node: ArrayNode, indentLevel: number): string[] {
    const lines: string[] = [];
    const indent = ' '.repeat(indentLevel);

    for (const item of node.items) {
      if (item.type === NodeType.SCALAR) {
        const value = (item as ScalarNode).value;
        lines.push(`${indent}- ${value !== null ? value : ''}`);
      } else if (item.type === NodeType.MAP) {
        lines.push(`${indent}-`);
        const mapLines = this.stringifyMap(item as MapNode, indentLevel + this.options.indent!);
        lines.push(...mapLines);
      } else if (item.type === NodeType.ARRAY) {
        lines.push(`${indent}-`);
        const arrayLines = this.stringifyArray(item as ArrayNode, indentLevel + this.options.indent!);
        lines.push(...arrayLines);
      }
    }

    return lines;
  }
}