import { BaseProvider } from '../core';
import type {
  ProviderCapability,
  ProviderContract,
  ProviderContext,
  ProviderHealth,
  ProviderMetadata,
  ProviderStatistics,
  ProviderValidationResult,
} from '../types';
import type {
  ParserDiagnostics,
  ParserDiagnosticEvent,
  ParseResult,
} from '../../parser/core/types';
import { ParserFactory } from '../../parser/core/parser-factory';
import { ParserRegistry } from '../../parser/core/parser-registry';
import type { IXmlDownloader } from '../../interfaces';
import { HttpDownloadService } from '../../network';
import { DefaultParserDiagnostics } from '../../parser/core/types';
import { XmlDocumentFactory } from '../../parser/xml/document-factory';
import { NamespaceResolver } from '../../parser/namespaces/resolver';
import { DtoMapper } from '../../parser/mappers/mapper';
import { RssParser } from '../../parser/rss';
import { AtomParser } from '../../parser/atom';
import {
  InvalidFeedUrlError,
  UnsupportedProtocolError,
  DownloadFailedError,
  EmptyResponseError,
  UnsupportedContentTypeError,
} from './errors';
import type { ProviderResult } from '../../types';

export interface GenericProviderOptions {
  readonly downloader?: IXmlDownloader;
  readonly parserFactory?: ParserFactory;
  readonly diagnostics?: ParserDiagnostics;
  readonly context?: ProviderContext;
}

interface GenericProviderDependencies {
  readonly downloader: IXmlDownloader;
  readonly parserFactory: ParserFactory;
  readonly diagnostics: ParserDiagnostics;
}

export class GenericProvider extends BaseProvider implements ProviderContract {
  private readonly dependencies: GenericProviderDependencies;
  private readonly context: ProviderContext | undefined;
  private readonly capabilityModel: readonly ProviderCapability[];
  private readonly diagnosticsHooks: Array<(event: ParserDiagnosticEvent) => void> = [];
  private readonly statistics: ProviderStatistics;
  private invocationCount = 0;

  public constructor(options: GenericProviderOptions = {}) {
    super(createMetadata());
    this.capabilityModel = createCapabilities();
    this.context = options.context;
    this.dependencies = {
      downloader: options.downloader ?? createDefaultDownloader(),
      parserFactory: options.parserFactory ?? createDefaultParserFactory(options.diagnostics),
      diagnostics: options.diagnostics ?? new DefaultParserDiagnostics(),
    };
    this.statistics = {
      invocationCount: 0,
      initializedAt: new Date().toISOString(),
    };
  }

  public override supports(url: string): boolean {
    return this.isSupportedUrl(url);
  }

  public override priority(): number {
    return this.metadata.priority;
  }

  public override capabilities(): readonly ProviderCapability[] {
    return this.capabilityModel;
  }

  public override ready(): boolean {
    return this.metadata.enabled !== false;
  }

  public override health(): ProviderHealth {
    if (this.metadata.enabled === false) {
      return { status: 'disabled', message: 'Provider disabled by configuration.' };
    }

    return { status: 'ready', message: 'Provider ready.' };
  }

  public async validate(input: unknown): Promise<ProviderValidationResult> {
    if (typeof input !== 'string' || input.trim().length === 0) {
      return {
        valid: false,
        errors: ['A feed URL is required.'],
        warnings: [],
      };
    }

    const normalized = input.trim();
    try {
      const parsed = new URL(normalized);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return {
          valid: false,
          errors: [
            new UnsupportedProtocolError(`Unsupported protocol: ${parsed.protocol}`, {
              url: normalized,
            }).message,
          ],
          warnings: [],
        };
      }

      if (!parsed.hostname) {
        return {
          valid: false,
          errors: [
            new InvalidFeedUrlError('The feed URL must include a valid hostname.', {
              url: normalized,
            }).message,
          ],
          warnings: [],
        };
      }

      return {
        valid: true,
        errors: [],
        warnings: [],
      };
    } catch {
      return {
        valid: false,
        errors: [
          new InvalidFeedUrlError('The feed URL is malformed.', { url: normalized }).message,
        ],
        warnings: [],
      };
    }
  }

  public async download(url: string): Promise<string> {
    const validation = await this.validate(url);
    if (!validation.valid) {
      throw new InvalidFeedUrlError('The feed URL failed validation.', { url });
    }

    try {
      const content = await this.dependencies.downloader.download(url);
      if (!content || content.trim().length === 0) {
        throw new EmptyResponseError('Downloaded response body was empty.', { url });
      }

      const contentType = this.detectContentType(content);
      if (contentType && !/xml|rss|atom/i.test(contentType)) {
        throw new UnsupportedContentTypeError(`Unsupported content type: ${contentType}`, {
          url,
          contentType,
        });
      }

      const xmlDeclaration = /<\?xml/i.test(content);
      if (!xmlDeclaration && !/<rss|<feed|<rdf/i.test(content)) {
        throw new UnsupportedContentTypeError(
          'The response does not appear to contain an XML feed.',
          { url },
        );
      }

      return content;
    } catch (error) {
      if (
        error instanceof InvalidFeedUrlError ||
        error instanceof EmptyResponseError ||
        error instanceof UnsupportedContentTypeError
      ) {
        throw error;
      }

      throw new DownloadFailedError('The feed download failed.', { url, cause: error });
    }
  }

  public async parse(input: string): Promise<ParseResult> {
    const parseResult = await this.dependencies.parserFactory.parse(input);
    return parseResult;
  }

  public async execute(url: string): Promise<ProviderResult> {
    const startedAt = Date.now();
    this.invocationCount += 1;

    const validation = await this.validate(url);
    if (!validation.valid) {
      return {
        provider: this.metadata.id,
        success: false,
        data: {
          warnings: validation.warnings,
          errors: validation.errors,
          metadata: {
            provider: this.metadata,
            statistics: this.getStatistics(startedAt),
            timings: {
              totalMs: Date.now() - startedAt,
            },
          },
        },
      };
    }

    try {
      const content = await this.download(url);
      const parseResult = await this.parse(content);
      return {
        provider: this.metadata.id,
        success: parseResult.success,
        data: {
          feed: parseResult.feed,
          episodes: parseResult.episodes,
          warnings: parseResult.warnings,
          errors: parseResult.errors,
          metadata: {
            provider: this.metadata,
            statistics: this.getStatistics(startedAt),
            timings: {
              totalMs: Date.now() - startedAt,
            },
          },
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown provider execution error.';
      return {
        provider: this.metadata.id,
        success: false,
        data: {
          warnings: [],
          errors: [message],
          metadata: {
            provider: this.metadata,
            statistics: this.getStatistics(startedAt),
            timings: {
              totalMs: Date.now() - startedAt,
            },
          },
        },
      };
    }
  }

  public override dispose(): void {
    this.diagnosticsHooks.length = 0;
  }

  public addDiagnosticHook(hook: (event: ParserDiagnosticEvent) => void): () => void {
    this.dependencies.diagnostics.emit({
      type: 'validation',
      message: 'Diagnostic hook registered.',
    });
    this.diagnosticsHooks.push(hook);
    return () => {
      const index = this.diagnosticsHooks.indexOf(hook);
      if (index >= 0) {
        this.diagnosticsHooks.splice(index, 1);
      }
    };
  }

  private isSupportedUrl(url: string): boolean {
    if (!url || url.trim().length === 0) {
      return false;
    }

    try {
      const parsed = new URL(url.trim());
      return ['http:', 'https:'].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  private detectContentType(content: string): string | undefined {
    const match = content.match(/<\?xml[^>]*encoding=["']?([^"'\s>]+)["']?/i);
    if (match?.[1]) {
      return `application/xml; charset=${match[1]}`;
    }

    if (/<rss/i.test(content) || /<feed/i.test(content) || /<rdf/i.test(content)) {
      return 'application/xml';
    }

    return undefined;
  }

  private getStatistics(startedAt: number): ProviderStatistics {
    const initializedAt = this.statistics.initializedAt;
    const lastError = this.statistics.lastError;

    return {
      invocationCount: this.invocationCount,
      ...(initializedAt ? { initializedAt } : {}),
      lastHealthCheck: new Date().toISOString(),
      ...(lastError ? { lastError } : {}),
    };
  }
}

function createMetadata(): ProviderMetadata {
  return {
    id: 'generic-rss-provider',
    name: 'GenericRSSProvider',
    version: '1.0.0',
    description: 'Generic RSS and Atom feed provider for XML-based feeds.',
    priority: 100,
    formats: ['rss', 'atom', 'xml'],
    domains: ['*'],
    capabilities: createCapabilities(),
    author: 'Castaminofen',
    documentationUrl: 'https://example.com/docs/rss-provider',
    experimental: false,
    enabled: true,
  };
}

function createCapabilities(): readonly ProviderCapability[] {
  return [
    { name: 'rss', enabled: true, description: 'Supports RSS 2.0 and RDF feeds.' },
    { name: 'atom', enabled: true, description: 'Supports Atom feeds.' },
    {
      name: 'podcast-namespace',
      enabled: true,
      description: 'Supports podcast-related namespaces when present.',
    },
    { name: 'redirects', enabled: true, description: 'Supports redirected feed URLs.' },
    {
      name: 'compression',
      enabled: true,
      description: 'Supports compressed responses when the environment exposes them.',
    },
    { name: 'streaming', enabled: true, description: 'Supports streaming-ready downloads.' },
  ];
}

function createDefaultDownloader(): IXmlDownloader {
  const service = new HttpDownloadService();

  return {
    async download(url: string): Promise<string> {
      const result = await service.download(url);
      if (!result.ok || !result.response) {
        throw result.error ?? new DownloadFailedError('The feed download failed.', { url });
      }

      return result.response.body;
    },
  };
}

function createDefaultParserFactory(diagnostics?: ParserDiagnostics): ParserFactory {
  const registry = new ParserRegistry();
  registry.register(new RssParser());
  registry.register(new AtomParser());

  return new ParserFactory(
    registry,
    new XmlDocumentFactory(),
    new NamespaceResolver(),
    new DtoMapper(),
    diagnostics ?? new DefaultParserDiagnostics(),
  );
}
