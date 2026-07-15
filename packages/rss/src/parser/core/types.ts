import type { XmlDocument, XmlNode } from '../xml';
import type { ResolvedXmlDocument } from '../namespaces';

export type ParserErrorCategory =
  | 'loader'
  | 'validation'
  | 'namespace'
  | 'parser'
  | 'mapping'
  | 'normalization'
  | 'internal'
  | 'unexpected';

export type ParserSeverity = 'warning' | 'error' | 'fatal';
export type ParserStage =
  'load' | 'validate' | 'namespace' | 'select' | 'parse' | 'map' | 'normalize' | 'finalize';

export interface ParserIssueLike {
  readonly code: string;
  readonly message: string;
  readonly category: ParserErrorCategory;
  readonly severity: ParserSeverity;
  readonly parserName: string;
  readonly stage: ParserStage;
  readonly line?: number | undefined;
  readonly column?: number | undefined;
  readonly context?: Record<string, unknown> | undefined;
  readonly originalCause?: unknown;
  readonly recoveryRecommendation?: string | undefined;
}

export interface ParserSelectionContext {
  readonly document: XmlDocument;
  readonly resolvedDocument?: ResolvedXmlDocument | undefined;
  readonly rawText?: string | undefined;
}

export interface ParserFeedShape {
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly link?: string | undefined;
  readonly language?: string | undefined;
  readonly copyright?: string | undefined;
  readonly updatedAt?: string | undefined;
  readonly generator?: string | undefined;
  readonly categories?:
    | ReadonlyArray<{ term: string; scheme?: string | undefined; label?: string | undefined }>
    | undefined;
  readonly authors?:
    | ReadonlyArray<{ name: string; email?: string | undefined; uri?: string | undefined }>
    | undefined;
  readonly image?:
    | {
        url: string;
        title?: string | undefined;
        link?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
      }
    | undefined;
  readonly links?:
    | ReadonlyArray<{
        href: string;
        rel?: string | undefined;
        type?: string | undefined;
        title?: string | undefined;
      }>
    | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface ParserEpisodeShape {
  readonly id?: string | undefined;
  readonly title?: string | undefined;
  readonly description?: string | undefined;
  readonly link?: string | undefined;
  readonly publishedAt?: string | undefined;
  readonly authors?:
    | ReadonlyArray<{ name: string; email?: string | undefined; uri?: string | undefined }>
    | undefined;
  readonly categories?:
    | ReadonlyArray<{ term: string; scheme?: string | undefined; label?: string | undefined }>
    | undefined;
  readonly image?:
    | {
        url: string;
        title?: string | undefined;
        link?: string | undefined;
        width?: number | undefined;
        height?: number | undefined;
      }
    | undefined;
  readonly duration?: string | undefined;
  readonly explicit?: boolean | undefined;
  readonly mediaUrl?: string | undefined;
  readonly metadata?: Record<string, unknown> | undefined;
}

export interface ParserOutcome {
  readonly success: boolean;
  readonly feed?: ParserFeedShape | undefined;
  readonly episodes: readonly ParserEpisodeShape[];
  readonly warnings: readonly ParserIssueLike[];
  readonly errors: readonly ParserIssueLike[];
  readonly metadata: {
    readonly parserName: string;
    readonly parserVersion: string;
    readonly format: string;
  };
}

export interface ParserStatistics {
  readonly xmlNodeCount: number;
  readonly parsedEpisodeCount: number;
  readonly warningCount: number;
  readonly errorCount: number;
}

export interface ParserTimings {
  readonly totalMs: number;
  readonly selectionMs: number;
  readonly parsingMs: number;
  readonly mappingMs: number;
  readonly validationMs: number;
  readonly namespaceResolutionMs: number;
}

export interface ParserMetrics extends ParserStatistics, ParserTimings {
  readonly parserName?: string;
}

export interface ParserMetricsCollector {
  onMetrics(metrics: ParserMetrics): void;
}

export interface ParserDiagnosticEvent {
  readonly type:
    'parser-selected' | 'validation' | 'namespace-resolution' | 'mapping' | 'warning' | 'error';
  readonly parserName?: string;
  readonly message?: string;
  readonly details?: Record<string, unknown>;
}

export interface ParserDiagnostics {
  emit(event: ParserDiagnosticEvent): void;
}

export class DefaultParserDiagnostics implements ParserDiagnostics {
  private readonly hooks: Array<(event: ParserDiagnosticEvent) => void> = [];

  public addHook(hook: (event: ParserDiagnosticEvent) => void): () => void {
    this.hooks.push(hook);
    return () => {
      const index = this.hooks.indexOf(hook);
      if (index >= 0) {
        this.hooks.splice(index, 1);
      }
    };
  }

  public emit(event: ParserDiagnosticEvent): void {
    for (const hook of this.hooks) {
      hook(event);
    }
  }
}

export interface ParseResult {
  readonly success: boolean;
  readonly feed?: ParserFeedShape | undefined;
  readonly episodes: readonly ParserEpisodeShape[];
  readonly warnings: readonly ParserIssueLike[];
  readonly errors: readonly ParserIssueLike[];
  readonly metadata: {
    readonly parserName: string;
    readonly parserVersion: string;
    readonly format: string;
    readonly diagnostics?:
      | {
          readonly selectedParser: string;
          readonly events: readonly ParserDiagnosticEvent[];
        }
      | undefined;
  };
  readonly statistics: ParserStatistics;
  readonly timings: ParserTimings;
}

export interface ParserContract {
  readonly name: string;
  readonly version: string;
  readonly priority: number;
  canParse(document: XmlDocument, context?: ParserSelectionContext | undefined): boolean;
  supports(document: XmlDocument, context?: ParserSelectionContext | undefined): boolean;
  parse(
    input: string | XmlDocument,
    context?: ParserSelectionContext | undefined,
  ): Promise<ParserOutcome>;
}

export function countXmlNodes(node: XmlNode | undefined): number {
  if (!node) {
    return 0;
  }

  let total = 1;
  for (const child of node.children) {
    total += countXmlNodes(child);
  }

  return total;
}
