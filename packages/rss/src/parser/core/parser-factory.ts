import { XmlDocumentFactory } from '../xml/document-factory';
import { NamespaceResolver } from '../namespaces/resolver';
import { DtoMapper } from '../mappers/mapper';
import { ParserRegistry } from './parser-registry';
import { createParserIssue } from './errors';
import {
  countXmlNodes,
  type ParserContract,
  type ParserDiagnostics,
  type ParserMetricsCollector,
  type ParseResult,
  type ParserSelectionContext,
} from './types';
import { DefaultParserDiagnostics } from './types';
import type { XmlDocument } from '../xml';

export class ParserFactory {
  private readonly registry: ParserRegistry;
  private readonly xmlFactory: XmlDocumentFactory;
  private readonly namespaceResolver: NamespaceResolver;
  private readonly mapper: DtoMapper;
  private readonly diagnostics: ParserDiagnostics;
  private readonly metricsCollectors: ParserMetricsCollector[];

  constructor(
    registry: ParserRegistry = new ParserRegistry(),
    xmlFactory: XmlDocumentFactory = new XmlDocumentFactory(),
    namespaceResolver: NamespaceResolver = new NamespaceResolver(),
    mapper: DtoMapper = new DtoMapper(),
    diagnostics: ParserDiagnostics = new DefaultParserDiagnostics(),
    metricsCollectors: ParserMetricsCollector[] = [],
  ) {
    this.registry = registry;
    this.xmlFactory = xmlFactory;
    this.namespaceResolver = namespaceResolver;
    this.mapper = mapper;
    this.diagnostics = diagnostics;
    this.metricsCollectors = metricsCollectors;
  }

  public register(parser: ParserContract): void {
    this.registry.register(parser);
  }

  public async parse(input: string | XmlDocument): Promise<ParseResult> {
    const startedAt = Date.now();
    const selectionStartedAt = Date.now();
    const diagnosticsEvents: Array<import('./types').ParserDiagnosticEvent> = [];
    const parserName = 'none';

    const document = typeof input === 'string' ? await this.xmlFactory.create(input) : input;
    const xmlNodeCount = countXmlNodes(document.root);

    const resolvedDocument = this.namespaceResolver.resolve(document);

    const context: ParserSelectionContext = {
      document,
      resolvedDocument,
      rawText: typeof input === 'string' ? input : undefined,
    };

    const parser = this.registry.select(document, context);
    if (!parser) {
      const issue = createParserIssue({
        code: 'UNSUPPORTED_FEED',
        message: 'No parser could determine support for the supplied feed.',
        category: 'parser',
        severity: 'error',
        parserName,
        stage: 'select',
        recoveryRecommendation: 'Register a compatible parser or provide a supported feed.',
      });
      const result: ParseResult = {
        success: false,
        episodes: [],
        warnings: [],
        errors: [issue],
        metadata: {
          parserName: 'none',
          parserVersion: '0.0.0',
          format: 'unknown',
          diagnostics: {
            selectedParser: 'none',
            events: diagnosticsEvents,
          },
        },
        statistics: {
          xmlNodeCount,
          parsedEpisodeCount: 0,
          warningCount: 0,
          errorCount: 1,
        },
        timings: {
          totalMs: Date.now() - startedAt,
          selectionMs: Date.now() - selectionStartedAt,
          parsingMs: 0,
          mappingMs: 0,
          validationMs: 0,
          namespaceResolutionMs: 0,
        },
      };
      return result;
    }

    const parserStartedAt = Date.now();
    this.diagnostics.emit({
      type: 'parser-selected',
      parserName: parser.name,
      message: 'Parser selected',
      details: { parserName: parser.name },
    });
    diagnosticsEvents.push({
      type: 'parser-selected',
      parserName: parser.name,
      message: 'Parser selected',
    });

    const outcome = await parser.parse(input, context);
    const normalizedFeed = this.normalizeFeed(outcome.feed);
    const normalizedEpisodes = outcome.episodes.map((episode) => this.normalizeEpisode(episode));

    const result: ParseResult = {
      success: outcome.success,
      feed: normalizedFeed,
      episodes: normalizedEpisodes,
      warnings: outcome.warnings,
      errors: outcome.errors,
      metadata: {
        parserName: parser.name,
        parserVersion: parser.version,
        format: outcome.metadata.format,
        diagnostics: {
          selectedParser: parser.name,
          events: diagnosticsEvents,
        },
      },
      statistics: {
        xmlNodeCount,
        parsedEpisodeCount: normalizedEpisodes.length,
        warningCount: outcome.warnings.length,
        errorCount: outcome.errors.length,
      },
      timings: {
        totalMs: Date.now() - startedAt,
        selectionMs: Date.now() - selectionStartedAt,
        parsingMs: Date.now() - parserStartedAt,
        mappingMs: 0,
        validationMs: 0,
        namespaceResolutionMs: 0,
      },
    };

    return result;
  }

  private normalizeFeed(
    feed?:
      | {
          title?: string | undefined;
          description?: string | undefined;
          link?: string | undefined;
          language?: string | undefined;
          copyright?: string | undefined;
          updatedAt?: string | undefined;
          generator?: string | undefined;
          categories?:
            | ReadonlyArray<{
                term: string;
                scheme?: string | undefined;
                label?: string | undefined;
              }>
            | undefined;
          authors?:
            | ReadonlyArray<{ name: string; email?: string | undefined; uri?: string | undefined }>
            | undefined;
          image?:
            | {
                url: string;
                title?: string | undefined;
                link?: string | undefined;
                width?: number | undefined;
                height?: number | undefined;
              }
            | undefined;
          links?:
            | ReadonlyArray<{
                href: string;
                rel?: string | undefined;
                type?: string | undefined;
                title?: string | undefined;
              }>
            | undefined;
          metadata?: Record<string, unknown> | undefined;
        }
      | undefined,
  ) {
    if (!feed) {
      return undefined;
    }

    return {
      title: feed.title,
      description: feed.description,
      link: feed.link,
      language: feed.language,
      copyright: feed.copyright,
      updatedAt: feed.updatedAt,
      generator: feed.generator,
      categories: feed.categories ?? [],
      authors: feed.authors ?? [],
      image: feed.image,
      links: feed.links ?? [],
      metadata: feed.metadata ?? {},
    };
  }

  private normalizeEpisode(episode: {
    id?: string | undefined;
    title?: string | undefined;
    description?: string | undefined;
    link?: string | undefined;
    publishedAt?: string | undefined;
    authors?:
      | ReadonlyArray<{ name: string; email?: string | undefined; uri?: string | undefined }>
      | undefined;
    categories?:
      | ReadonlyArray<{ term: string; scheme?: string | undefined; label?: string | undefined }>
      | undefined;
    image?:
      | {
          url: string;
          title?: string | undefined;
          link?: string | undefined;
          width?: number | undefined;
          height?: number | undefined;
        }
      | undefined;
    duration?: string | undefined;
    explicit?: boolean | undefined;
    mediaUrl?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
  }) {
    return {
      id: episode.id,
      title: episode.title,
      description: episode.description,
      link: episode.link,
      publishedAt: episode.publishedAt,
      authors: episode.authors ?? [],
      categories: episode.categories ?? [],
      image: episode.image,
      duration: episode.duration,
      explicit: episode.explicit,
      mediaUrl: episode.mediaUrl,
      metadata: episode.metadata ?? {},
    };
  }
}
