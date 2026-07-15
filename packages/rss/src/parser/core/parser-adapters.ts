import { RssParser } from '../rss';
import { AtomParser } from '../atom';
import type { XmlDocument } from '../xml';
import { createParserIssue } from './errors';
import type { ParserContract, ParserOutcome, ParserSelectionContext } from './types';

function mapIssue(
  issue: {
    code: string;
    message: string;
    stage?: string | undefined;
    location?: string | undefined;
    context?: Record<string, unknown> | undefined;
  },
  parserName: string,
  category:
    | 'loader'
    | 'validation'
    | 'parser'
    | 'normalization'
    | 'mapping'
    | 'internal'
    | 'unexpected' = 'parser',
): ReturnType<typeof createParserIssue> {
  const stage = issue.stage ?? 'parse';
  const severity = stage === 'xml-load' ? 'error' : 'warning';
  return createParserIssue({
    code: issue.code,
    message: issue.message,
    category,
    severity,
    parserName,
    stage: stage as
      'parse' | 'normalize' | 'map' | 'validate' | 'load' | 'select' | 'namespace' | 'finalize',
    context: issue.context,
    recoveryRecommendation:
      'Review the feed payload and ensure the document structure matches the selected format.',
  });
}

export class RssParserAdapter implements ParserContract {
  public readonly name = 'RssParser';
  public readonly version = '1.0.0';
  public readonly priority = 100;

  constructor(private readonly parser: RssParser = new RssParser()) {}

  public canParse(document: XmlDocument): boolean {
    return (
      document.root?.name.toLowerCase() === 'rss' || document.root?.name.toLowerCase() === 'rdf'
    );
  }

  public supports(document: XmlDocument): boolean {
    return this.canParse(document);
  }

  public async parse(
    input: string | XmlDocument,
    context?: ParserSelectionContext,
  ): Promise<ParserOutcome> {
    const rawText = typeof input === 'string' ? input : (context?.rawText ?? '');
    const result = await this.parser.parse(rawText);

    return {
      success: result.errors.length === 0,
      feed: {
        title: result.channel.title,
        description: result.channel.description,
        link: result.channel.link,
        language: result.channel.language,
        copyright: result.channel.copyright,
        updatedAt: result.channel.lastBuildDate ?? result.channel.pubDate,
        generator: result.channel.generator,
        categories: result.channel.categories.map((term) => ({ term })),
        authors: [],
        image: result.channel.image
          ? {
              url: result.channel.image.url,
              title: result.channel.image.title ?? undefined,
              link: result.channel.image.link ?? undefined,
              width: result.channel.image.width ?? undefined,
              height: result.channel.image.height ?? undefined,
            }
          : undefined,
        links: result.channel.link ? [{ href: result.channel.link, rel: 'alternate' }] : [],
        metadata: { source: 'rss' },
      },
      episodes: result.items.map((item) => ({
        id: item.guid?.value ?? undefined,
        title: item.title ?? undefined,
        description: item.description ?? undefined,
        link: item.link ?? undefined,
        publishedAt: item.pubDate ?? undefined,
        authors: item.author ? [{ name: item.author }] : [],
        categories: item.categories.map((term) => ({ term })),
        metadata: { source: 'rss' },
      })),
      warnings: result.warnings.map((warning) => mapIssue(warning, this.name, 'normalization')),
      errors: result.errors.map((issue) => mapIssue(issue, this.name, 'validation')),
      metadata: {
        parserName: this.name,
        parserVersion: this.version,
        format: 'rss',
      },
    };
  }
}

export class AtomParserAdapter implements ParserContract {
  public readonly name = 'AtomParser';
  public readonly version = '1.0.0';
  public readonly priority = 90;

  constructor(private readonly parser: AtomParser = new AtomParser()) {}

  public canParse(document: XmlDocument): boolean {
    const rootName = document.root?.name.toLowerCase();
    const namespace = document.root?.namespaceUri;
    return rootName === 'feed' && namespace === 'http://www.w3.org/2005/Atom';
  }

  public supports(document: XmlDocument): boolean {
    return this.canParse(document);
  }

  public async parse(
    input: string | XmlDocument,
    context?: ParserSelectionContext,
  ): Promise<ParserOutcome> {
    const rawText = typeof input === 'string' ? input : (context?.rawText ?? '');
    const result = await this.parser.parse(rawText);

    return {
      success: result.errors.length === 0,
      feed: {
        title: result.feed.title?.value,
        description: result.feed.subtitle?.value,
        link: result.feed.links.find((link) => link.href)?.href,
        language: undefined,
        copyright: result.feed.rights?.value,
        updatedAt: result.feed.updated,
        generator: result.feed.generator?.name,
        categories: result.feed.categories.map((category) => ({
          term: category.term ?? '',
          scheme: category.scheme ?? undefined,
          label: category.label ?? undefined,
        })),
        authors: result.feed.authors.map((author) => ({
          name: author.name ?? '',
          email: author.email ?? undefined,
          uri: author.uri ?? undefined,
        })),
        image: undefined,
        links: result.feed.links.map((link) => ({
          href: link.href ?? '',
          rel: link.rel ?? undefined,
          type: link.type ?? undefined,
          title: link.title ?? undefined,
        })),
        metadata: { source: 'atom' },
      },
      episodes: result.entries.map((entry) => ({
        id: entry.id,
        title: entry.title?.value,
        description: entry.summary?.value,
        link: entry.links.find((link) => link.href)?.href,
        publishedAt: entry.published,
        authors: entry.authors.map((author) => ({
          name: author.name ?? '',
          email: author.email ?? undefined,
          uri: author.uri ?? undefined,
        })),
        categories: entry.categories.map((category) => ({
          term: category.term ?? '',
          scheme: category.scheme ?? undefined,
          label: category.label ?? undefined,
        })),
        metadata: { source: 'atom' },
      })),
      warnings: result.warnings.map((warning) => mapIssue(warning, this.name, 'normalization')),
      errors: result.errors.map((issue) => mapIssue(issue, this.name, 'validation')),
      metadata: {
        parserName: this.name,
        parserVersion: this.version,
        format: 'atom',
      },
    };
  }
}
