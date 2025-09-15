import { Annotation, AnnotationType } from './types';

export function isYTTAnnotation(line: string): boolean {
  return /^\s*#@\s+/.test(line);
}

export function isDocumentSeparator(line: string): boolean {
  return line.trim() === '---';
}

export function extractIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

export function parseAnnotation(line: string): Annotation | null {
  const match = line.match(/^\s*#@\s+(.+)$/);
  if (!match) return null;

  const content = match[1].trim();

  if (content.startsWith('load(')) {
    return {
      type: AnnotationType.LOAD,
      value: content
    };
  }

  if (content.includes('data/values')) {
    return {
      type: AnnotationType.SCHEMA,
      value: content
    };
  }

  const blockMatch = content.match(/^(if|for|def|end|else|elif)\s*(.*)$/);
  if (blockMatch) {
    return {
      type: AnnotationType.BLOCK,
      value: content,
      keyword: blockMatch[1]
    };
  }

  return {
    type: AnnotationType.CODE,
    value: content
  };
}

export function parseInlineAnnotation(value: string): { annotation: Annotation | null; cleanValue: string } {
  const match = value.match(/^(.*?)\s*#@\s+(.+)$/);

  if (match) {
    return {
      annotation: {
        type: AnnotationType.EXPRESSION,
        value: match[2].trim()
      },
      cleanValue: match[1].trim()
    };
  }

  return {
    annotation: null,
    cleanValue: value
  };
}