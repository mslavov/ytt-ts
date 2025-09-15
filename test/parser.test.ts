import { YTT } from '../src';
import { NodeType, AnnotationType } from '../src/types';

describe('YTTParser', () => {
  describe('parse', () => {
    it('should parse a simple YTT template with data value', () => {
      const input = `#@ load("@ytt:data", "data")
---
name: #@ data.values.app_name
port: 8080`;

      const result = YTT.parse(input);

      expect(result.type).toBe(NodeType.DOCUMENT);
      expect(result.annotations).toHaveLength(1);
      expect(result.annotations[0].type).toBe(AnnotationType.LOAD);
      expect(result.annotations[0].value).toBe('load("@ytt:data", "data")');

      expect(result.content?.type).toBe(NodeType.MAP);
      const mapContent = result.content as any;
      expect(mapContent.entries).toHaveLength(2);

      const nameEntry = mapContent.entries[0];
      expect(nameEntry.key).toBe('name');
      expect(nameEntry.annotations).toHaveLength(1);
      expect(nameEntry.annotations[0].type).toBe(AnnotationType.EXPRESSION);
      expect(nameEntry.annotations[0].value).toBe('data.values.app_name');

      const portEntry = mapContent.entries[1];
      expect(portEntry.key).toBe('port');
      expect(portEntry.value.type).toBe(NodeType.SCALAR);
      expect(portEntry.value.value).toBe(8080);
    });

    it('should parse a template without document separator', () => {
      const input = `apiVersion: v1
kind: Service
metadata:
  name: my-app`;

      const result = YTT.parse(input);

      expect(result.type).toBe(NodeType.DOCUMENT);
      expect(result.annotations).toHaveLength(0);
      expect(result.content?.type).toBe(NodeType.MAP);
    });

    it('should parse nested maps', () => {
      const input = `---
metadata:
  name: my-app
  labels:
    app: web
    tier: frontend`;

      const result = YTT.parse(input);

      expect(result.content?.type).toBe(NodeType.MAP);
      const rootMap = result.content as any;
      const metadataEntry = rootMap.entries[0];
      expect(metadataEntry.key).toBe('metadata');
      expect(metadataEntry.value.type).toBe(NodeType.MAP);

      const metadataMap = metadataEntry.value;
      expect(metadataMap.entries).toHaveLength(2);
      expect(metadataMap.entries[0].key).toBe('name');
      expect(metadataMap.entries[1].key).toBe('labels');

      const labelsMap = metadataMap.entries[1].value;
      expect(labelsMap.type).toBe(NodeType.MAP);
      expect(labelsMap.entries).toHaveLength(2);
    });

    it('should parse arrays', () => {
      const input = `---
containers:
  - name: app
  - name: sidecar`;

      const result = YTT.parse(input);

      const rootMap = result.content as any;
      const containersEntry = rootMap.entries[0];
      expect(containersEntry.key).toBe('containers');
      expect(containersEntry.value.type).toBe(NodeType.ARRAY);

      const array = containersEntry.value;
      expect(array.items).toHaveLength(2);
    });

    it('should parse multiple annotations', () => {
      const input = `#@ load("@ytt:data", "data")
#@ load("@ytt:overlay", "overlay")
---
name: test`;

      const result = YTT.parse(input);

      expect(result.annotations).toHaveLength(2);
      expect(result.annotations[0].value).toBe('load("@ytt:data", "data")');
      expect(result.annotations[1].value).toBe('load("@ytt:overlay", "overlay")');
    });

    it('should handle empty input', () => {
      const result = YTT.parse('');

      expect(result.type).toBe(NodeType.DOCUMENT);
      expect(result.annotations).toHaveLength(0);
      expect(result.content).toBeNull();
    });

    it('should handle only annotations without content', () => {
      const input = `#@ load("@ytt:data", "data")
---`;

      const result = YTT.parse(input);

      expect(result.annotations).toHaveLength(1);
      expect(result.content).toBeNull();
    });

    it('should parse block annotations', () => {
      const input = `---
metadata:
  #@ if data.values.enabled:
  name: my-app
  #@ end`;

      const result = YTT.parse(input);
      const rootMap = result.content as any;
      const metadataEntry = rootMap.entries[0];

      expect(metadataEntry.value.type).toBe(NodeType.MAP);
    });

    it('should handle scalar values with different types', () => {
      const input = `---
string: hello
number: 42
float: 3.14
boolean: true
null_value: null`;

      const result = YTT.parse(input);
      const rootMap = result.content as any;

      expect(rootMap.entries[0].value.value).toBe('hello');
      expect(rootMap.entries[1].value.value).toBe(42);
      expect(rootMap.entries[2].value.value).toBe(3.14);
      expect(rootMap.entries[3].value.value).toBe(true);
      expect(rootMap.entries[4].value.value).toBeNull();
    });
  });
});