# YTT-TS

A TypeScript library for parsing and stringifying YTT (YAML Templating Tool) templates.

## Installation

```bash
npm install ytt-ts
```

## Usage

### Basic Usage

```typescript
import { YTT } from 'ytt-ts';

// Parse YTT string to AST
const yttString = `
#@ load("@ytt:data", "data")
---
name: #@ data.values.app_name
port: 8080
`;

const ast = YTT.parse(yttString);

// Stringify AST back to YTT
const output = YTT.stringify(ast);
```

### TypeScript Support

The library is written in TypeScript and provides full type definitions:

```typescript
import {
  YTT,
  DocumentNode,
  NodeType,
  AnnotationType,
  ParseOptions,
  StringifyOptions
} from 'ytt-ts';

// With options
const parseOptions: ParseOptions = {
  strict: true,
  preserveComments: false
};

const stringifyOptions: StringifyOptions = {
  indent: 4,
  preserveEmptyLines: false
};

const ast: DocumentNode = YTT.parse(yttString, parseOptions);
const output: string = YTT.stringify(ast, stringifyOptions);
```

### Working with AST

```typescript
import { DocumentNode, NodeType, MapNode, AnnotationType } from 'ytt-ts';

const ast = YTT.parse(yttString);

// Access document annotations
ast.annotations.forEach(annotation => {
  if (annotation.type === AnnotationType.LOAD) {
    console.log('Load statement:', annotation.value);
  }
});

// Navigate the content tree
if (ast.content?.type === NodeType.MAP) {
  const mapNode = ast.content as MapNode;
  mapNode.entries.forEach(entry => {
    console.log(`Key: ${entry.key}`);

    // Check for inline expressions
    const expr = entry.annotations.find(a => a.type === AnnotationType.EXPRESSION);
    if (expr) {
      console.log(`Expression: ${expr.value}`);
    }
  });
}
```

### Creating AST Programmatically

```typescript
import { DocumentNode, NodeType, AnnotationType } from 'ytt-ts';

const ast: DocumentNode = {
  type: NodeType.DOCUMENT,
  annotations: [
    {
      type: AnnotationType.LOAD,
      value: 'load("@ytt:data", "data")'
    }
  ],
  content: {
    type: NodeType.MAP,
    entries: [
      {
        key: 'name',
        value: null,
        annotations: [
          {
            type: AnnotationType.EXPRESSION,
            value: 'data.values.app_name'
          }
        ]
      },
      {
        key: 'port',
        value: {
          type: NodeType.SCALAR,
          value: 8080
        },
        annotations: []
      }
    ]
  }
};

const yttString = YTT.stringify(ast);
```

## API Reference

### Main Functions

- `YTT.parse(input: string, options?: ParseOptions): DocumentNode` - Parse YTT string to AST
- `YTT.stringify(ast: DocumentNode, options?: StringifyOptions): string` - Convert AST to YTT string

### Types

#### Node Types
- `NodeType.DOCUMENT` - Root document node
- `NodeType.MAP` - Key-value map (object)
- `NodeType.ARRAY` - Array of items
- `NodeType.SCALAR` - Primitive value (string, number, boolean, null)

#### Annotation Types
- `AnnotationType.LOAD` - Load statements (`#@ load(...)`)
- `AnnotationType.EXPRESSION` - Inline expressions (`#@ data.values.name`)
- `AnnotationType.BLOCK` - Block statements (`#@ if/for/end`)
- `AnnotationType.SCHEMA` - Schema definitions
- `AnnotationType.CODE` - Generic code annotations

## Features

- ✅ Parse YTT templates with `#@` annotations
- ✅ Support document-level annotations (load statements)
- ✅ Handle inline expressions
- ✅ Process conditional blocks
- ✅ Maintain YAML structure integrity
- ✅ Full TypeScript support with type definitions
- ✅ Round-trip capability (parse → stringify → parse)

## License

MIT