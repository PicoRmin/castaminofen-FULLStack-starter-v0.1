export type AtomUnknownElementDto = import('../rss/dto').UnknownElementDto;

export interface AtomParserIssueDto {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly location?: string | undefined;
  readonly line?: number | undefined;
  readonly column?: number | undefined;
  readonly context?: Record<string, unknown> | undefined;
}

export interface AtomTextDto {
  readonly type: string;
  readonly value: string;
  readonly xmlBase?: string | undefined;
  readonly xmlLang?: string | undefined;
}

export interface AtomContentDto extends AtomTextDto {
  readonly src?: string | undefined;
}

export interface AtomLinkDto {
  readonly href: string | undefined;
  readonly rel: string | undefined;
  readonly type: string | undefined;
  readonly hreflang: string | undefined;
  readonly title: string | undefined;
  readonly length: string | undefined;
  readonly xmlBase?: string | undefined;
  readonly xmlLang?: string | undefined;
}

export interface AtomCategoryDto {
  readonly term: string | undefined;
  readonly scheme: string | undefined;
  readonly label: string | undefined;
  readonly xmlLang?: string | undefined;
}

export interface AtomPersonDto {
  readonly name: string | undefined;
  readonly uri: string | undefined;
  readonly email: string | undefined;
  readonly xmlLang?: string | undefined;
}

export interface AtomGeneratorDto {
  readonly name: string | undefined;
  readonly uri: string | undefined;
  readonly version: string | undefined;
}

export interface AtomSourceDto {
  readonly id: string | undefined;
  readonly title: AtomTextDto | undefined;
  readonly subtitle: AtomTextDto | undefined;
  readonly updated: string | undefined;
  readonly rights: AtomTextDto | undefined;
  readonly generator: AtomGeneratorDto | undefined;
  readonly icon: string | undefined;
  readonly logo: string | undefined;
  readonly categories: readonly AtomCategoryDto[];
  readonly links: readonly AtomLinkDto[];
  readonly authors: readonly AtomPersonDto[];
  readonly contributors: readonly AtomPersonDto[];
  readonly unknownElements: readonly AtomUnknownElementDto[];
  readonly xmlBase?: string | undefined;
  readonly xmlLang?: string | undefined;
}

export interface AtomFeedDto {
  readonly id: string | undefined;
  readonly title: AtomTextDto | undefined;
  readonly subtitle: AtomTextDto | undefined;
  readonly updated: string | undefined;
  readonly rights: AtomTextDto | undefined;
  readonly generator: AtomGeneratorDto | undefined;
  readonly icon: string | undefined;
  readonly logo: string | undefined;
  readonly categories: readonly AtomCategoryDto[];
  readonly links: readonly AtomLinkDto[];
  readonly authors: readonly AtomPersonDto[];
  readonly contributors: readonly AtomPersonDto[];
  readonly xmlBase?: string | undefined;
  readonly xmlLang?: string | undefined;
  readonly unknownElements: readonly AtomUnknownElementDto[];
}

export interface AtomEntryDto {
  readonly id: string | undefined;
  readonly title: AtomTextDto | undefined;
  readonly summary: AtomTextDto | undefined;
  readonly content: AtomContentDto | undefined;
  readonly updated: string | undefined;
  readonly published: string | undefined;
  readonly rights: AtomTextDto | undefined;
  readonly authors: readonly AtomPersonDto[];
  readonly contributors: readonly AtomPersonDto[];
  readonly categories: readonly AtomCategoryDto[];
  readonly links: readonly AtomLinkDto[];
  readonly source: AtomSourceDto | undefined;
  readonly xmlBase?: string | undefined;
  readonly xmlLang?: string | undefined;
  readonly unknownElements: readonly AtomUnknownElementDto[];
}

export interface AtomParseResultDto {
  readonly feed: AtomFeedDto;
  readonly entries: readonly AtomEntryDto[];
  readonly errors: readonly AtomParserIssueDto[];
  readonly warnings: readonly AtomParserIssueDto[];
  readonly unknownElements: readonly AtomUnknownElementDto[];
}
