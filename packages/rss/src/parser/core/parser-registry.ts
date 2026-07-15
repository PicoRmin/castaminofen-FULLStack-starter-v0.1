import type { ParserContract, ParserSelectionContext } from './types';
import type { XmlDocument } from '../xml';
import { AtomParserAdapter, RssParserAdapter } from './parser-adapters';
import { AtomParser } from '../atom';
import { RssParser } from '../rss';

export class ParserRegistry {
  private readonly parsers: ParserContract[] = [];

  public register(parser: ParserContract | { parse: (input: string) => Promise<unknown> }): void {
    const normalized = this.normalizeParser(parser);
    const existing = this.parsers.findIndex((candidate) => candidate.name === normalized.name);
    if (existing >= 0) {
      this.parsers[existing] = normalized;
      return;
    }

    this.parsers.push(normalized);
    this.parsers.sort((left, right) => right.priority - left.priority);
  }

  public unregister(name: string): void {
    const index = this.parsers.findIndex((parser) => parser.name === name);
    if (index >= 0) {
      this.parsers.splice(index, 1);
    }
  }

  public getAll(): readonly ParserContract[] {
    return this.parsers.slice();
  }

  public select(
    document: XmlDocument,
    context?: ParserSelectionContext,
  ): ParserContract | undefined {
    return this.parsers.find((parser) => parser.canParse(document, context));
  }

  private normalizeParser(
    parser: ParserContract | { parse: (input: string) => Promise<unknown> },
  ): ParserContract {
    if (this.isParserContract(parser)) {
      return parser;
    }

    if (parser instanceof RssParser) {
      return new RssParserAdapter(parser);
    }

    if (parser instanceof AtomParser) {
      return new AtomParserAdapter(parser);
    }

    throw new TypeError(
      'Unsupported parser type. Register a ParserContract or an RSS/Atom parser instance.',
    );
  }

  private isParserContract(
    parser: ParserContract | { parse: (input: string) => Promise<unknown> },
  ): parser is ParserContract {
    return (
      typeof (parser as ParserContract).canParse === 'function' &&
      typeof (parser as ParserContract).supports === 'function'
    );
  }
}
