import { YTT } from '../src';
import { DocumentNode, NodeType, AnnotationType } from '../src/types';

describe('YTTStringifier', () => {
  describe('stringify', () => {
    it('should stringify a simple document with annotations', () => {
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

      const result = YTT.stringify(ast);
      const expected = `#@ load("@ytt:data", "data")
---
name: #@ data.values.app_name
port: 8080`;

      expect(result).toBe(expected);
    });

    it('should stringify nested maps', () => {
      const ast: DocumentNode = {
        type: NodeType.DOCUMENT,
        annotations: [],
        content: {
          type: NodeType.MAP,
          entries: [
            {
              key: 'metadata',
              value: {
                type: NodeType.MAP,
                entries: [
                  {
                    key: 'name',
                    value: {
                      type: NodeType.SCALAR,
                      value: 'my-app'
                    },
                    annotations: []
                  },
                  {
                    key: 'namespace',
                    value: {
                      type: NodeType.SCALAR,
                      value: 'default'
                    },
                    annotations: []
                  }
                ]
              },
              annotations: []
            }
          ]
        }
      };

      const result = YTT.stringify(ast);
      const expected = `---
metadata:
  name: my-app
  namespace: default`;

      expect(result).toBe(expected);
    });

    it('should stringify arrays', () => {
      const ast: DocumentNode = {
        type: NodeType.DOCUMENT,
        annotations: [],
        content: {
          type: NodeType.MAP,
          entries: [
            {
              key: 'containers',
              value: {
                type: NodeType.ARRAY,
                items: [
                  {
                    type: NodeType.SCALAR,
                    value: 'app'
                  },
                  {
                    type: NodeType.SCALAR,
                    value: 'sidecar'
                  }
                ]
              },
              annotations: []
            }
          ]
        }
      };

      const result = YTT.stringify(ast);
      const expected = `---
containers:
  - app
  - sidecar`;

      expect(result).toBe(expected);
    });

    it('should stringify empty document', () => {
      const ast: DocumentNode = {
        type: NodeType.DOCUMENT,
        annotations: [],
        content: null
      };

      const result = YTT.stringify(ast);
      expect(result).toBe('---');
    });

    it('should stringify document with only annotations', () => {
      const ast: DocumentNode = {
        type: NodeType.DOCUMENT,
        annotations: [
          {
            type: AnnotationType.LOAD,
            value: 'load("@ytt:data", "data")'
          },
          {
            type: AnnotationType.LOAD,
            value: 'load("@ytt:overlay", "overlay")'
          }
        ],
        content: null
      };

      const result = YTT.stringify(ast);
      const expected = `#@ load("@ytt:data", "data")
#@ load("@ytt:overlay", "overlay")
---`;

      expect(result).toBe(expected);
    });

    it('should handle null values', () => {
      const ast: DocumentNode = {
        type: NodeType.DOCUMENT,
        annotations: [],
        content: {
          type: NodeType.MAP,
          entries: [
            {
              key: 'nullValue',
              value: {
                type: NodeType.SCALAR,
                value: null
              },
              annotations: []
            }
          ]
        }
      };

      const result = YTT.stringify(ast);
      const expected = `---
nullValue: null`;

      expect(result).toBe(expected);
    });

    it('should handle custom indentation', () => {
      const ast: DocumentNode = {
        type: NodeType.DOCUMENT,
        annotations: [],
        content: {
          type: NodeType.MAP,
          entries: [
            {
              key: 'parent',
              value: {
                type: NodeType.MAP,
                entries: [
                  {
                    key: 'child',
                    value: {
                      type: NodeType.SCALAR,
                      value: 'value'
                    },
                    annotations: []
                  }
                ]
              },
              annotations: []
            }
          ]
        }
      };

      const result = YTT.stringify(ast, { indent: 4 });
      const expected = `---
parent:
    child: value`;

      expect(result).toBe(expected);
    });

    it('should stringify complex nested structures', () => {
      const ast: DocumentNode = {
        type: NodeType.DOCUMENT,
        annotations: [],
        content: {
          type: NodeType.MAP,
          entries: [
            {
              key: 'spec',
              value: {
                type: NodeType.MAP,
                entries: [
                  {
                    key: 'containers',
                    value: {
                      type: NodeType.ARRAY,
                      items: [
                        {
                          type: NodeType.MAP,
                          entries: [
                            {
                              key: 'name',
                              value: {
                                type: NodeType.SCALAR,
                                value: 'app'
                              },
                              annotations: []
                            },
                            {
                              key: 'image',
                              value: null,
                              annotations: [
                                {
                                  type: AnnotationType.EXPRESSION,
                                  value: 'data.values.image'
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    },
                    annotations: []
                  }
                ]
              },
              annotations: []
            }
          ]
        }
      };

      const result = YTT.stringify(ast);
      const expected = `---
spec:
  containers:
    -
      name: app
      image: #@ data.values.image`;

      expect(result).toBe(expected);
    });
  });
});