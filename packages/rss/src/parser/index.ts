import { NotImplementedError } from '../shared';

export * from './xml';
export * from './namespaces';
export * from './mappers';
export * from './core';
export { RssParser } from './rss';
export { AtomParser } from './atom';

export abstract class BaseParser {
  public parse(): Promise<unknown> {
    throw new NotImplementedError();
  }
}
