export type ParserErrorCode =
  | 'XML_LOAD_ERROR'
  | 'XML_VALIDATION_ERROR'
  | 'NAMESPACE_ERROR'
  | 'PARSER_SELECTION_ERROR'
  | 'PARSER_IMPLEMENTATION_ERROR'
  | 'DTO_MAPPING_ERROR'
  | 'NORMALIZATION_ERROR'
  | 'UNSUPPORTED_FEED'
  | 'INTERNAL_ERROR'
  | 'UNEXPECTED_ERROR';

import type { ParserErrorCategory, ParserSeverity, ParserStage, ParserIssueLike } from './types';

export class ParserIssue implements ParserIssueLike {
  public readonly code: string;
  public readonly message: string;
  public readonly category: ParserErrorCategory;
  public readonly severity: ParserSeverity;
  public readonly parserName: string;
  public readonly stage: ParserStage;
  public readonly line?: number | undefined;
  public readonly column?: number | undefined;
  public readonly context?: Record<string, unknown> | undefined;
  public readonly originalCause?: unknown;
  public readonly recoveryRecommendation?: string | undefined;

  constructor(init: ParserIssueLike) {
    this.code = init.code;
    this.message = init.message;
    this.category = init.category;
    this.severity = init.severity;
    this.parserName = init.parserName;
    this.stage = init.stage;
    this.line = init.line;
    this.column = init.column;
    this.context = init.context;
    this.originalCause = init.originalCause;
    this.recoveryRecommendation = init.recoveryRecommendation;
  }
}

export function createParserIssue(init: ParserIssueLike): ParserIssue {
  return new ParserIssue(init);
}
