import { XmlDocumentFactory } from '../xml/document-factory';
import { XmlElement } from '../xml/document';
import { RssValidators } from './validators';
import type {
  ChannelDto,
  EnclosureDto,
  GuidDto,
  ItemDto,
  ParserIssueDto,
  RssParseResultDto,
  UnknownElementDto,
} from './dto';
import { InvalidRssDocumentError, UnsupportedVersionError } from './errors';

export * from './dto';
export * from './errors';
export * from './validators';

export class RssParser {
  private readonly xmlFactory: XmlDocumentFactory;
  private readonly validators: RssValidators;

  constructor(xmlFactory: XmlDocumentFactory = new XmlDocumentFactory()) {
    this.xmlFactory = xmlFactory;
    this.validators = new RssValidators();
  }

  public async parse(input: string): Promise<RssParseResultDto> {
    const document = await this.xmlFactory.create(input);
    const errors = document.errors.map((error) => ({
      code: error.code,
      message: error.message,
      stage: 'xml-load',
      location: error.line ? `line ${error.line}` : undefined,
      context: error.cause ? { cause: String(error.cause) } : undefined,
    }));

    if (!document.root) {
      return this.createResult(this.createEmptyChannel(), [], errors, []);
    }

    const root = document.root;
    const rootName = root.name.toLowerCase();
    const version = this.getAttribute(root, 'version');
    const channel = this.findChild(root, 'channel');

    const structuralIssues = this.validators.validateRoot(rootName, version, channel);

    if (structuralIssues.length > 0) {
      return this.createResult(this.createEmptyChannel(), [], [...errors, ...structuralIssues], []);
    }

    if (!channel) {
      return this.createResult(this.createEmptyChannel(), [], [...errors, ...structuralIssues], []);
    }

    const {
      channel: parsedChannel,
      issues: channelIssues,
      warnings: channelWarnings,
    } = this.parseChannel(channel);
    const {
      items: parsedItems,
      issues: itemIssues,
      warnings: itemWarnings,
    } = this.parseItems(channel);
    const warnings = [...channelWarnings, ...itemWarnings];
    const allErrors = [...errors, ...channelIssues, ...itemIssues];

    return this.createResult(parsedChannel, parsedItems, allErrors, warnings);
  }

  private parseChannel(channel: XmlElement): {
    channel: ChannelDto;
    issues: ParserIssueDto[];
    warnings: ParserIssueDto[];
  } {
    const title = this.getTextValue(channel, 'title');
    const link = this.getTextValue(channel, 'link');
    const description = this.getTextValue(channel, 'description');
    const language = this.getTextValue(channel, 'language');
    const copyright = this.getTextValue(channel, 'copyright');
    const managingEditor = this.getTextValue(channel, 'managingEditor');
    const webMaster = this.getTextValue(channel, 'webMaster');
    const pubDate = this.getTextValue(channel, 'pubDate');
    const lastBuildDate = this.getTextValue(channel, 'lastBuildDate');
    const categories = this.getAllTextValues(channel, 'category');
    const generator = this.getTextValue(channel, 'generator');
    const docs = this.getTextValue(channel, 'docs');
    const cloud = this.parseCloud(channel);
    const ttl = this.parseOptionalNumber(channel, 'ttl');
    const image = this.parseImage(channel);
    const rating = this.getTextValue(channel, 'rating');
    const textInput = this.parseTextInput(channel);
    const skipHours = this.parseDelimitedValues(channel, 'skipHours', 'hour');
    const skipDays = this.parseDelimitedValues(channel, 'skipDays', 'day');
    const unknownElements = this.collectUnknownElements(channel);

    const warnings: ParserIssueDto[] = [];
    const normalizedPubDate = this.normalizeDate(pubDate, 'pubDate', warnings);
    const normalizedLastBuildDate = this.normalizeDate(lastBuildDate, 'lastBuildDate', warnings);
    const validationIssues = [
      ...this.validators.validateUrl(link, 'channel-link'),
      ...this.validators.validateImageUrl(image?.url),
    ];

    const result: Partial<ChannelDto> = {
      title,
      link,
      description,
      language,
      copyright,
      managingEditor,
      webMaster,
      pubDate: normalizedPubDate,
      lastBuildDate: normalizedLastBuildDate,
      categories,
      generator,
      docs,
      cloud,
      ttl,
      image,
      rating,
      textInput,
      skipHours,
      skipDays,
      unknownElements,
    };

    return { channel: result as ChannelDto, issues: validationIssues, warnings };
  }

  private parseItems(channel: XmlElement): {
    items: ItemDto[];
    issues: ParserIssueDto[];
    warnings: ParserIssueDto[];
  } {
    const items = channel.children.filter(
      (child): child is XmlElement =>
        child.kind === 'element' && child.name.toLowerCase() === 'item',
    );
    const issues: ParserIssueDto[] = [];
    const warnings: ParserIssueDto[] = [];
    const parsedItems = items.map((item) => {
      const guid = this.parseGuid(item);
      const title = this.getTextValue(item, 'title');
      const description = this.getTextValue(item, 'description');
      const link = this.getTextValue(item, 'link');
      const author = this.getTextValue(item, 'author');
      const categories = this.getAllTextValues(item, 'category');
      const comments = this.getTextValue(item, 'comments');
      const enclosure = this.parseEnclosure(item);
      const pubDate = this.getTextValue(item, 'pubDate');
      const source = this.parseSource(item);
      const unknownElements = this.collectUnknownElements(item);
      const normalizedPubDate = this.normalizeDate(pubDate, 'item pubDate', warnings);
      const linkValidation = this.validators.validateUrl(link, 'item-link');
      issues.push(...linkValidation);

      const result: Partial<ItemDto> = {
        guid,
        title,
        description,
        link,
        author,
        categories,
        comments,
        enclosure,
        pubDate: normalizedPubDate,
        source,
        unknownElements,
      };

      return result as ItemDto;
    });

    return { items: parsedItems, issues, warnings };
  }

  private parseGuid(item: XmlElement): GuidDto | undefined {
    const guidElement = this.findChild(item, 'guid');
    if (!guidElement) {
      return undefined;
    }

    const value = this.getTextContent(guidElement);
    if (!value) {
      return undefined;
    }

    const isPermaLinkAttr = this.getAttribute(guidElement, 'isPermaLink');
    const isPermaLink = isPermaLinkAttr ? isPermaLinkAttr === 'true' : undefined;

    const result: Partial<GuidDto> = {
      value,
      isPermaLink,
    };

    return result as GuidDto;
  }

  private parseEnclosure(item: XmlElement): EnclosureDto | undefined {
    const enclosure = this.findChild(item, 'enclosure');
    if (!enclosure) {
      return undefined;
    }

    const url = this.getAttribute(enclosure, 'url');
    const type = this.getAttribute(enclosure, 'type');
    const length = this.getAttribute(enclosure, 'length');

    const validationIssues = this.validators.validateEnclosure(url, type, length);
    if (validationIssues.length > 0) {
      return undefined;
    }

    const result: Partial<EnclosureDto> = {
      url: url ?? '',
      type,
      length: length ? Number(length) : undefined,
    };

    return result as EnclosureDto;
  }

  private parseCloud(channel: XmlElement): ChannelDto['cloud'] {
    const cloud = this.findChild(channel, 'cloud');
    if (!cloud) {
      return undefined;
    }

    return {
      domain: this.getAttribute(cloud, 'domain') ?? '',
      port: Number(this.getAttribute(cloud, 'port') ?? 0),
      path: this.getAttribute(cloud, 'path') ?? '',
      registerProcedure: this.getAttribute(cloud, 'registerProcedure') ?? '',
      protocol: this.getAttribute(cloud, 'protocol') ?? '',
    };
  }

  private parseTextInput(channel: XmlElement): ChannelDto['textInput'] {
    const input = this.findChild(channel, 'textInput');
    if (!input) {
      return undefined;
    }

    const result: Partial<ChannelDto['textInput']> = {
      title: this.getTextValue(input, 'title'),
      description: this.getTextValue(input, 'description'),
      name: this.getTextValue(input, 'name'),
      link: this.getTextValue(input, 'link'),
    };

    return result as ChannelDto['textInput'];
  }

  private parseImage(channel: XmlElement): ChannelDto['image'] {
    const image = this.findChild(channel, 'image');
    if (!image) {
      return undefined;
    }

    const url = this.getTextValue(image, 'url');
    const title = this.getTextValue(image, 'title');
    const link = this.getTextValue(image, 'link');
    const width = this.parseOptionalNumber(image, 'width');
    const height = this.parseOptionalNumber(image, 'height');
    const description = this.getTextValue(image, 'description');

    if (!url) {
      return undefined;
    }

    const result: Partial<ChannelDto['image']> = {
      url,
      title,
      link,
      width,
      height,
      description,
    };

    return result as ChannelDto['image'];
  }

  private parseSource(item: XmlElement): ItemDto['source'] {
    const source = this.findChild(item, 'source');
    if (!source) {
      return undefined;
    }

    return {
      url: this.getAttribute(source, 'url') ?? '',
      value: this.getTextContent(source),
    };
  }

  private parseOptionalNumber(parent: XmlElement, tagName: string): number | undefined {
    const value = this.getTextValue(parent, tagName);
    if (!value) {
      return undefined;
    }

    const numeric = Number(value);
    return Number.isNaN(numeric) ? undefined : numeric;
  }

  private parseDelimitedValues(parent: XmlElement, tagName: string, valueType: string): string[] {
    const element = this.findChild(parent, tagName);
    if (!element) {
      return [];
    }

    const text = this.getTextContent(element);
    if (!text) {
      return [];
    }

    return text
      .split(/\s+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private getTextValue(parent: XmlElement, childName: string): string | undefined {
    const child = this.findChild(parent, childName);
    if (!child) {
      return undefined;
    }

    return this.getTextContent(child);
  }

  private getAllTextValues(parent: XmlElement, childName: string): string[] {
    return parent.children
      .filter(
        (child): child is XmlElement =>
          child.kind === 'element' && child.name.toLowerCase() === childName.toLowerCase(),
      )
      .map((child) => this.getTextContent(child).trim())
      .filter(Boolean);
  }

  private getTextContent(element: XmlElement): string {
    return element.children
      .map((child) => {
        if (child.kind === 'text' || child.kind === 'cdata') {
          return child.value ?? '';
        }
        return '';
      })
      .join('')
      .trim();
  }

  private findChild(parent: XmlElement, childName: string): XmlElement | undefined {
    return parent.children.find(
      (child): child is XmlElement =>
        child.kind === 'element' && child.name.toLowerCase() === childName.toLowerCase(),
    );
  }

  private getAttribute(element: XmlElement, name: string): string | undefined {
    return element.attributes.find(
      (attribute) => attribute.name.toLowerCase() === name.toLowerCase(),
    )?.value;
  }

  private collectUnknownElements(parent: XmlElement): UnknownElementDto[] {
    return parent.children
      .filter((child): child is XmlElement => child.kind === 'element')
      .filter((child) => !this.isKnownElement(child.name))
      .map((child) => ({
        name: child.name,
        attributes: Object.fromEntries(
          child.attributes.map((attribute) => [attribute.name, attribute.value]),
        ),
        value: this.getTextContent(child),
        children: child.children
          .filter((grandChild): grandChild is XmlElement => grandChild.kind === 'element')
          .map((grandChild) => grandChild.name),
      }));
  }

  private isKnownElement(name: string): boolean {
    const normalized = name.toLowerCase();
    return [
      'channel',
      'title',
      'link',
      'description',
      'language',
      'copyright',
      'managingeditor',
      'webmaster',
      'pubdate',
      'lastbuilddate',
      'category',
      'generator',
      'docs',
      'cloud',
      'ttl',
      'image',
      'rating',
      'textinput',
      'skiphours',
      'skipdays',
      'item',
      'guid',
      'author',
      'comments',
      'enclosure',
      'source',
      'url',
      'name',
      'height',
      'width',
      'port',
      'path',
      'registerprocedure',
      'protocol',
      'domain',
      'ispermalink',
    ].includes(normalized);
  }

  private normalizeDate(
    value: string | undefined,
    fieldName: string,
    warnings: ParserIssueDto[],
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) {
      warnings.push({
        code: 'DATE_PARSE_WARNING',
        message: `Unable to normalize ${fieldName}.`,
        stage: 'date-normalization',
        context: { value: trimmed },
      });
      return trimmed;
    }

    return new Date(parsed).toISOString();
  }

  private createEmptyChannel(): ChannelDto {
    return {
      title: undefined,
      link: undefined,
      description: undefined,
      language: undefined,
      copyright: undefined,
      managingEditor: undefined,
      webMaster: undefined,
      pubDate: undefined,
      lastBuildDate: undefined,
      categories: [],
      generator: undefined,
      docs: undefined,
      cloud: undefined,
      ttl: undefined,
      image: undefined,
      rating: undefined,
      textInput: undefined,
      skipHours: [],
      skipDays: [],
      unknownElements: [],
    };
  }

  private createResult(
    channel: ChannelDto,
    items: ItemDto[],
    errors: readonly unknown[],
    warnings: readonly unknown[],
  ): RssParseResultDto {
    return {
      channel,
      items,
      errors: errors as readonly {
        code: string;
        message: string;
        stage: string;
        location?: string;
        context?: Record<string, unknown>;
      }[],
      warnings: warnings as readonly {
        code: string;
        message: string;
        stage: string;
        location?: string;
        context?: Record<string, unknown>;
      }[],
      unknownElements: channel.unknownElements,
    };
  }
}
