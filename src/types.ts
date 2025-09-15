export enum NodeType {
  DOCUMENT = 'document',
  MAP = 'map',
  ARRAY = 'array',
  SCALAR = 'scalar'
}

export enum AnnotationType {
  LOAD = 'load',
  EXPRESSION = 'expression',
  BLOCK = 'block',
  SCHEMA = 'schema',
  CODE = 'code'
}

export interface Annotation {
  type: AnnotationType;
  value: string;
  keyword?: string;
}

export interface ScalarNode {
  type: NodeType.SCALAR;
  value: string | number | boolean | null;
}

export interface MapEntry {
  key: string;
  value: ASTNode | null;
  annotations: Annotation[];
}

export interface MapNode {
  type: NodeType.MAP;
  entries: MapEntry[];
}

export interface ArrayNode {
  type: NodeType.ARRAY;
  items: ASTNode[];
}

export interface DocumentNode {
  type: NodeType.DOCUMENT;
  annotations: Annotation[];
  content: ASTNode | null;
}

export type ASTNode = ScalarNode | MapNode | ArrayNode | DocumentNode;

export interface ParseOptions {
  preserveComments?: boolean;
  strict?: boolean;
}

export interface StringifyOptions {
  indent?: number;
  preserveEmptyLines?: boolean;
}