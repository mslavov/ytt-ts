import { YTT } from '../src';

describe('Integration Tests', () => {
  describe('Round-trip tests', () => {
    it('should preserve simple YTT template through parse and stringify', () => {
      const input = `#@ load("@ytt:data", "data")
---
name: #@ data.values.app_name
port: 8080`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);

      expect(output).toBe(input);
    });

    it('should handle complex nested structures', () => {
      const input = `#@ load("@ytt:data", "data")
---
apiVersion: v1
kind: Service
metadata:
  name: #@ data.values.service_name
  namespace: default
  labels:
    app: web
    tier: frontend
spec:
  ports:
    - 80
    - 443`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);
      const reparsed = YTT.parse(output);

      expect(reparsed.annotations).toEqual(ast.annotations);
      expect(reparsed.content).toEqual(ast.content);
    });

    it('should preserve empty values', () => {
      const input = `---
emptyString: ""
emptyMap:
emptyArray:`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);
      const reparsed = YTT.parse(output);

      const content = ast.content as any;
      const reparsedContent = reparsed.content as any;

      expect(reparsedContent.entries).toHaveLength(content.entries.length);
    });

    it('should handle multiple annotations', () => {
      const input = `#@ load("@ytt:data", "data")
#@ load("@ytt:overlay", "overlay")
#@ load("@ytt:struct", "struct")
---
app: test`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);
      const lines = output.split('\n');

      expect(lines[0]).toBe('#@ load("@ytt:data", "data")');
      expect(lines[1]).toBe('#@ load("@ytt:overlay", "overlay")');
      expect(lines[2]).toBe('#@ load("@ytt:struct", "struct")');
      expect(lines[3]).toBe('---');
      expect(lines[4]).toBe('app: test');
    });

    it('should handle mixed scalar types', () => {
      const input = `---
string: hello world
integer: 42
float: 3.14
boolean: true
null_value: null`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);
      const reparsed = YTT.parse(output);

      expect(reparsed).toEqual(ast);
    });

    it('should handle inline expressions in nested structures', () => {
      const input = `---
deployment:
  metadata:
    name: #@ data.values.name
    labels:
      app: #@ data.values.app
  spec:
    replicas: #@ data.values.replicas`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);

      expect(output).toContain('name: #@ data.values.name');
      expect(output).toContain('app: #@ data.values.app');
      expect(output).toContain('replicas: #@ data.values.replicas');
    });

    it('should handle arrays of maps', () => {
      const input = `---
services:
  -
    name: web
    port: 80
  -
    name: api
    port: 8080`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);
      const reparsed = YTT.parse(output);

      const services = (reparsed.content as any).entries[0].value;
      expect(services.type).toBe('array');
      expect(services.items).toHaveLength(2);
    });

    it('should preserve document structure without content', () => {
      const input = `#@ load("@ytt:data", "data")
---`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);

      expect(output).toBe(input);
    });

    it('should handle special characters in strings', () => {
      const input = `---
special: "quotes: 'single' and \\"double\\""
path: /usr/local/bin
regex: ^[a-z]+$`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);
      const reparsed = YTT.parse(output);

      const entries = (reparsed.content as any).entries;
      expect(entries[0].value.value).toContain('quotes');
      expect(entries[1].value.value).toBe('/usr/local/bin');
      expect(entries[2].value.value).toBe('^[a-z]+$');
    });
  });

  describe('Error handling', () => {
    it('should handle malformed YAML gracefully', () => {
      const input = `---
key1: value1
  key2: value2
    key3: value3`;

      const ast = YTT.parse(input);
      expect(ast.type).toBe('document');
      expect(ast.content).toBeDefined();
    });

    it('should parse YTT annotations even with invalid YAML', () => {
      const input = `#@ load("@ytt:data", "data")
---
invalid yaml {
  but annotations work`;

      const ast = YTT.parse(input);
      expect(ast.annotations).toHaveLength(1);
      expect(ast.annotations[0].value).toBe('load("@ytt:data", "data")');
    });
  });

  describe('Edge cases', () => {
    it('should handle very deeply nested structures', () => {
      const ast = YTT.parse(`---
level1:
  level2:
    level3:
      level4:
        level5:
          value: deep`);

      const output = YTT.stringify(ast);
      expect(output).toContain('level5:');
      expect(output).toContain('value: deep');
    });

    it('should handle empty arrays and maps', () => {
      const ast = YTT.parse(`---
emptyArray: []
emptyMap: {}`);

      const output = YTT.stringify(ast);
      const reparsed = YTT.parse(output);

      expect(reparsed.content).toBeDefined();
    });

    it('should handle unicode characters', () => {
      const input = `---
emoji: 🚀
chinese: 你好
arabic: مرحبا`;

      const ast = YTT.parse(input);
      const output = YTT.stringify(ast);

      expect(output).toContain('🚀');
      expect(output).toContain('你好');
      expect(output).toContain('مرحبا');
    });
  });
});