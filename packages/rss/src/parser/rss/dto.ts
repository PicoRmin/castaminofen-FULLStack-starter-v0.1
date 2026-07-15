export interface ParserIssueDto {
  readonly code: string;
  readonly message: string;
  readonly stage: string;
  readonly location?: string;
  readonly context?: Record<string, unknown>;
}

export interface UnknownElementDto {
  readonly name: string;
  readonly attributes: Record<string, string>;
  readonly value?: string;
  readonly children: readonly string[];
}

export interface ChannelDto {
  readonly title: string | undefined;
  readonly link: string | undefined;
  readonly description: string | undefined;
  readonly language: string | undefined;
  readonly copyright: string | undefined;
  readonly managingEditor: string | undefined;
  readonly webMaster: string | undefined;
  readonly pubDate: string | undefined;
  readonly lastBuildDate: string | undefined;
  readonly categories: readonly string[];
  readonly generator: string | undefined;
  readonly docs: string | undefined;
  readonly cloud: CloudDto | undefined;
  readonly ttl: number | undefined;
  readonly image: ImageDto | undefined;
  readonly rating: string | undefined;
  readonly textInput: TextInputDto | undefined;
  readonly skipHours: readonly string[];
  readonly skipDays: readonly string[];
  readonly unknownElements: readonly UnknownElementDto[];
}

export interface CloudDto {
  readonly domain: string;
  readonly port: number;
  readonly path: string;
  readonly registerProcedure: string;
  readonly protocol: string;
}

export interface ImageDto {
  readonly url: string;
  readonly title: string | undefined;
  readonly link: string | undefined;
  readonly width: number | undefined;
  readonly height: number | undefined;
  readonly description: string | undefined;
}

export interface TextInputDto {
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly name: string | undefined;
  readonly link: string | undefined;
}

export interface GuidDto {
  readonly value: string;
  readonly isPermaLink: boolean | undefined;
}

export interface EnclosureDto {
  readonly url: string;
  readonly type: string | undefined;
  readonly length: number | undefined;
}

export interface SourceDto {
  readonly url: string;
  readonly value: string | undefined;
}

export interface ItemDto {
  readonly guid: GuidDto | undefined;
  readonly title: string | undefined;
  readonly description: string | undefined;
  readonly link: string | undefined;
  readonly author: string | undefined;
  readonly categories: readonly string[];
  readonly comments: string | undefined;
  readonly enclosure: EnclosureDto | undefined;
  readonly pubDate: string | undefined;
  readonly source: SourceDto | undefined;
  readonly unknownElements: readonly UnknownElementDto[];
}

export interface RssParseResultDto {
  readonly channel: ChannelDto;
  readonly items: readonly ItemDto[];
  readonly errors: readonly ParserIssueDto[];
  readonly warnings: readonly ParserIssueDto[];
  readonly unknownElements: readonly UnknownElementDto[];
}
