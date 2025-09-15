# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run build` - Compile TypeScript to JavaScript (outputs to `dist/`)
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode during development
- `npm run test:coverage` - Run tests with coverage report

### Testing Specific Files
- `npx jest test/parser.test.ts` - Run parser tests only
- `npx jest test/stringifier.test.ts` - Run stringifier tests only
- `npx jest test/integration.test.ts` - Run integration tests only
- `npx jest --testNamePattern="should parse"` - Run tests matching a pattern

## Architecture

### Core Concept
YTT-TS is a parser/stringifier library for YTT (YAML Templating Tool) format. It converts between YTT text format and an Abstract Syntax Tree (AST), similar to how `JSON.parse()` and `JSON.stringify()` work.

### YTT Format
YTT is YAML with special comment-based annotations:
- `#@` marks YTT annotations (expressions, blocks, loads)
- `#!` marks regular comments (ignored)
- Annotations can be document-level (before `---`) or inline (on YAML lines)

### Data Flow
1. **Parsing**: YTT string → Extract annotations → Parse YAML → Merge into AST
2. **Stringifying**: AST → Generate annotations → Generate YAML → Combine into YTT string

### Key Components

**Parser (`src/parser.ts`)**
- Separates YTT annotations from YAML content
- Uses `js-yaml` for YAML parsing with fallback manual parser
- Attaches annotations to appropriate AST nodes
- Handles both document-level and inline annotations

**Stringifier (`src/stringifier.ts`)**
- Recursively traverses AST nodes
- Generates proper indentation for nested structures
- Places annotations in correct positions (document-level vs inline)
- Preserves null values and special scalar types

**Type System (`src/types.ts`)**
- AST nodes: `DocumentNode`, `MapNode`, `ArrayNode`, `ScalarNode`
- Annotation types: `LOAD`, `EXPRESSION`, `BLOCK`, `SCHEMA`, `CODE`
- Each map entry can have multiple annotations
- Strict TypeScript typing throughout

**Utils (`src/utils.ts`)**
- Shared annotation parsing logic
- Pattern matching for YTT syntax
- Indentation helpers

### AST Structure
```
DocumentNode
├── annotations[] (document-level like #@ load)
└── content (ASTNode)
    └── MapNode/ArrayNode/ScalarNode
        └── entries[]/items[] with their own annotations
```

### Annotation Handling
- **Document annotations**: Applied before `---` separator (loads, imports)
- **Inline expressions**: Replace YAML values (`name: #@ data.values.name`)
- **Block annotations**: Control structures (`#@ if`, `#@ for`, `#@ end`)

### Testing Strategy
- **Parser tests**: Various YTT patterns and edge cases
- **Stringifier tests**: AST to YTT conversion verification
- **Integration tests**: Round-trip parsing/stringifying to ensure data preservation