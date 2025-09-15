import { YTTParser } from './parser';
import { YTTStringifier } from './stringifier';
import { DocumentNode, ParseOptions, StringifyOptions } from './types';

export * from './types';

export class YTT {
  static parse(input: string, options?: ParseOptions): DocumentNode {
    const parser = new YTTParser(options);
    return parser.parse(input);
  }

  static stringify(ast: DocumentNode, options?: StringifyOptions): string {
    const stringifier = new YTTStringifier(options);
    return stringifier.stringify(ast);
  }
}

export const parse = YTT.parse;
export const stringify = YTT.stringify;

export default YTT;