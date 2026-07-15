import { XmlDocumentFactory } from '../xml/document-factory';
import { XmlElement, XmlNode } from '../xml/document';
import { AtomValidators } from './validators';
import type {
  AtomFeedDto,
  AtomEntryDto,
  AtomLinkDto,
  AtomParserIssueDto,
  AtomParseResultDto,
  AtomPersonDto,
  AtomSourceDto,
  AtomTextDto,
  AtomContentDto,
  AtomCategoryDto,
  AtomGeneratorDto,
  AtomUnknownElementDto,
} from './dto';
import { NamespaceValidationError } from './errors';

export * from './dto';
export * from './errors';
export * from './validators';

const ATOM_NAMESPACE_URI = 'http://www.w3.org/2005/Atom';
const XML_BASE = 'http://www.w3.org/XML/1998/namespace';
const XML_LANG = 'http://www.w3.org/XML/1998/namespace';

export class AtomParser {
  private readonly xmlFactory: XmlDocumentFactory;
  private readonly validators: AtomValidators;

  constructor(xmlFactory: XmlDocumentFactory = new XmlDocumentFactory()) {
    this.xmlFactory = xmlFactory;
    this.validators = new AtomValidators();
  }

  public async parse(input: string): Promise<AtomParseResultDto> {
    const document = await this.xmlFactory.create(input);
    const errors: AtomParserIssueDto[] = document.errors.map((error) => {
      const base: {
        code: string;
        message: string;
        stage: string;
        line?: number;
        column?: number;
        context?: Record<string, unknown>;
      } = {
        code: error.code,
        message: error.message,
        stage: 'xml-load',
      };

      if (error.line !== undefined) {
        base.line = error.line;
      }

      if (error.column !== undefined) {
        base.column = error.column;
      }

      if (error.cause !== undefined) {
        base.context = { cause: String(error.cause) };
      }

      return base as AtomParserIssueDto;
    });

    if (!document.root) {
      return this.createEmptyResult(errors, []);
    }

    const root = document.root;
    const structuralIssues = this.validators.validateRoot(
      root.name.toLowerCase(),
      root.namespaceUri,
    );
    if (structuralIssues.length > 0) {
      return this.createEmptyResult([...errors, ...structuralIssues], []);
    }

    const feed = this.parseFeed(root);
    const entries = this.parseEntries(root, feed);
    const warnings = [...feed.warnings, ...entries.warnings];
    const allErrors = [...errors, ...feed.issues, ...entries.issues];

    return {
      feed: feed.result,
      entries: entries.result,
      errors: allErrors,
      warnings,
      unknownElements: feed.result.unknownElements,
    };
  }

  private parseFeed(root: XmlElement): {
    result: AtomFeedDto;
    issues: AtomParserIssueDto[];
    warnings: AtomParserIssueDto[];
  } {
    const xmlBase = this.getXmlBase(root);
    const xmlLang = this.getXmlLang(root);

    const id = this.getTextValue(root, 'id');
    const title = this.parseTextElement(root, 'title');
    const subtitle = this.parseTextElement(root, 'subtitle');
    const updated = this.normalizeDate(this.getTextValue(root, 'updated'), 'feed.updated');
    const rights = this.parseTextElement(root, 'rights');
    const generator = this.parseGenerator(root);
    const icon = this.getTextValue(root, 'icon');
    const logo = this.getTextValue(root, 'logo');
    const categories = this.parseCategories(root);
    const links = this.parseLinks(root);
    const authors = this.parsePersons(root, 'author');
    const contributors = this.parsePersons(root, 'contributor');
    const unknownElements = this.collectUnknownElements(root);

    const issues = [...this.validators.validateLink(this.findPrimaryHref(links), 'feed-link')];
    const warnings = [...this.validators.validateDate(updated, 'feed.updated')];

    return {
      result: {
        id,
        title,
        subtitle,
        updated,
        rights,
        generator,
        icon,
        logo,
        categories,
        links,
        authors,
        contributors,
        xmlBase,
        xmlLang,
        unknownElements,
      },
      issues,
      warnings,
    };
  }

  private parseEntries(
    root: XmlElement,
    feed: { result: AtomFeedDto; warnings: AtomParserIssueDto[] },
  ): {
    result: AtomEntryDto[];
    issues: AtomParserIssueDto[];
    warnings: AtomParserIssueDto[];
  } {
    const entryElements = root.children.filter((child): child is XmlElement => {
      const element = child as XmlElement;
      return (
        element.kind === 'element' &&
        element.namespaceUri === ATOM_NAMESPACE_URI &&
        element.name.toLowerCase() === 'entry'
      );
    });

    const issues: AtomParserIssueDto[] = [];
    const warnings: AtomParserIssueDto[] = [];
    const results = entryElements.map((entry) => {
      const xmlBase = this.resolveXmlBase(entry);
      const xmlLang = this.resolveXmlLang(entry);

      const id = this.getTextValue(entry, 'id');
      const title = this.parseTextElement(entry, 'title');
      const summary = this.parseTextElement(entry, 'summary');
      const content = this.parseContent(entry);
      const updated = this.normalizeDate(this.getTextValue(entry, 'updated'), 'entry.updated');
      const published = this.normalizeDate(
        this.getTextValue(entry, 'published'),
        'entry.published',
      );
      const rights = this.parseTextElement(entry, 'rights');
      const entryAuthors = this.parsePersons(entry, 'author');
      const authors = entryAuthors.length > 0 ? entryAuthors : feed.result.authors;
      const contributors = this.parsePersons(entry, 'contributor');
      const categories = this.parseCategories(entry);
      const links = this.parseLinks(entry);
      const source = this.parseSource(entry);
      const unknownElements = this.collectUnknownElements(entry);

      issues.push(...this.validators.validateLink(this.findPrimaryHref(links), 'entry-link'));
      warnings.push(...this.validators.validateDate(updated, 'entry.updated'));
      warnings.push(...this.validators.validateDate(published, 'entry.published'));

      return {
        id,
        title,
        summary,
        content,
        updated,
        published,
        rights,
        authors,
        contributors,
        categories,
        links,
        source,
        xmlBase,
        xmlLang,
        unknownElements,
      } as AtomEntryDto;
    });

    return { result: results, issues, warnings };
  }

  private parseGenerator(parent: XmlElement): AtomGeneratorDto | undefined {
    const element = this.findChild(parent, 'generator');
    if (!element) {
      return undefined;
    }

    return {
      name: this.getTextContent(element),
      uri: this.getAttribute(element, 'uri'),
      version: this.getAttribute(element, 'version'),
    };
  }

  private parseSource(parent: XmlElement): AtomSourceDto | undefined {
    const sourceElement = this.findChild(parent, 'source');
    if (!sourceElement) {
      return undefined;
    }

    const xmlBase = this.resolveXmlBase(sourceElement);
    const xmlLang = this.resolveXmlLang(sourceElement);
    const id = this.getTextValue(sourceElement, 'id');
    const title = this.parseTextElement(sourceElement, 'title');
    const subtitle = this.parseTextElement(sourceElement, 'subtitle');
    const updated = this.normalizeDate(
      this.getTextValue(sourceElement, 'updated'),
      'source.updated',
    );
    const rights = this.parseTextElement(sourceElement, 'rights');
    const generator = this.parseGenerator(sourceElement);
    const icon = this.getTextValue(sourceElement, 'icon');
    const logo = this.getTextValue(sourceElement, 'logo');
    const categories = this.parseCategories(sourceElement);
    const links = this.parseLinks(sourceElement);
    const authors = this.parsePersons(sourceElement, 'author');
    const contributors = this.parsePersons(sourceElement, 'contributor');
    const unknownElements = this.collectUnknownElements(sourceElement);

    return {
      id,
      title,
      subtitle,
      updated,
      rights,
      generator,
      icon,
      logo,
      categories,
      links,
      authors,
      contributors,
      unknownElements,
      xmlBase,
      xmlLang,
    };
  }

  private parseTextElement(parent: XmlElement, name: string): AtomTextDto | undefined {
    const element = this.findChild(parent, name);
    if (!element) {
      return undefined;
    }

    return {
      type: this.getAttribute(element, 'type') ?? 'text',
      value: this.getTextContent(element),
      xmlBase: this.resolveXmlBase(element),
      xmlLang: this.resolveXmlLang(element),
    };
  }

  private parseContent(parent: XmlElement): AtomContentDto | undefined {
    const element = this.findChild(parent, 'content');
    if (!element) {
      return undefined;
    }

    return {
      type: this.getAttribute(element, 'type') ?? 'text',
      value: this.getTextContent(element),
      src: this.getAttribute(element, 'src'),
      xmlBase: this.getXmlBase(element),
      xmlLang: this.getXmlLang(element),
    };
  }

  private parseCategories(parent: XmlElement): AtomCategoryDto[] {
    return parent.children
      .filter((child): child is XmlElement => child.kind === 'element')
      .filter(
        (child) =>
          child.namespaceUri === ATOM_NAMESPACE_URI && child.name.toLowerCase() === 'category',
      )
      .map((element) => ({
        term: this.getAttribute(element, 'term'),
        scheme: this.getAttribute(element, 'scheme'),
        label: this.getAttribute(element, 'label'),
        xmlLang: this.resolveXmlLang(element),
      }));
  }

  private parseLinks(parent: XmlElement): AtomLinkDto[] {
    return parent.children
      .filter((child): child is XmlElement => {
        if (child.kind !== 'element') {
          return false;
        }

        const element = child as XmlElement;
        return element.namespaceUri === ATOM_NAMESPACE_URI && element.name.toLowerCase() === 'link';
      })
      .map((element) => ({
        href: this.getAttribute(element, 'href'),
        rel: this.getAttribute(element, 'rel'),
        type: this.getAttribute(element, 'type'),
        hreflang: this.getAttribute(element, 'hreflang'),
        title: this.getAttribute(element, 'title'),
        length: this.getAttribute(element, 'length'),
        xmlBase: this.resolveXmlBase(element),
        xmlLang: this.resolveXmlLang(element),
      }));
  }

  private parsePersons(parent: XmlElement, elementName: 'author' | 'contributor'): AtomPersonDto[] {
    return parent.children
      .filter((child): child is XmlElement => {
        if (child.kind !== 'element') {
          return false;
        }

        const element = child as XmlElement;
        return (
          element.namespaceUri === ATOM_NAMESPACE_URI && element.name.toLowerCase() === elementName
        );
      })
      .map((element) => ({
        name: this.getTextValue(element, 'name'),
        uri: this.getTextValue(element, 'uri'),
        email: this.getTextValue(element, 'email'),
        xmlLang: this.resolveXmlLang(element),
      }));
  }

  private resolveXmlBase(element: XmlElement): string | undefined {
    let current: XmlElement | undefined = element;
    while (current) {
      const value = this.getAttributeByNamespace(current, 'base', XML_BASE);
      if (value) {
        return value;
      }
      current = current.parent;
    }
    return undefined;
  }

  private resolveXmlLang(element: XmlElement): string | undefined {
    let current: XmlElement | undefined = element;
    while (current) {
      const value = this.getAttributeByNamespace(current, 'lang', XML_LANG);
      if (value) {
        return value;
      }
      current = current.parent;
    }
    return undefined;
  }

  private getXmlBase(element: XmlElement): string | undefined {
    return this.getAttributeByNamespace(element, 'base', XML_BASE);
  }

  private getXmlLang(element: XmlElement): string | undefined {
    return this.getAttributeByNamespace(element, 'lang', XML_LANG);
  }

  private getTextValue(parent: XmlElement, childName: string): string | undefined {
    const child = this.findChild(parent, childName);
    if (!child) {
      return undefined;
    }
    return this.getTextContent(child);
  }

  private getTextContent(element: XmlElement): string {
    return element.children
      .map((child) => this.serializeNode(child))
      .join('')
      .trim();
  }

  private serializeNode(node: XmlNode): string {
    if (node.kind === 'text' || node.kind === 'cdata') {
      return node.value ?? '';
    }

    if (node.kind === 'element') {
      return this.serializeElement(node as XmlElement);
    }

    return '';
  }

  private serializeElement(element: XmlElement): string {
    const attributes = element.attributes
      .map((attribute) => {
        const escaped = this.escapeAttribute(attribute.value);
        return `${attribute.name}="${escaped}"`;
      })
      .join(' ');
    const openingTag = attributes ? `<${element.name} ${attributes}>` : `<${element.name}>`;
    const innerXml = element.children.map((child) => this.serializeNode(child)).join('');
    return `${openingTag}${innerXml}</${element.name}>`;
  }

  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private findChild(parent: XmlElement, childName: string): XmlElement | undefined {
    return parent.children.find((child): child is XmlElement => {
      if (child.kind !== 'element') {
        return false;
      }

      const element = child as XmlElement;
      return (
        element.name.toLowerCase() === childName && element.namespaceUri === ATOM_NAMESPACE_URI
      );
    });
  }

  private getAttribute(element: XmlElement, name: string): string | undefined {
    return element.attributes.find(
      (attribute) => attribute.name.toLowerCase() === name.toLowerCase(),
    )?.value;
  }

  private getAttributeByNamespace(
    element: XmlElement,
    name: string,
    namespaceUri: string,
  ): string | undefined {
    return element.attributes.find(
      (attribute) =>
        attribute.name.toLowerCase() === name.toLowerCase() &&
        attribute.namespaceUri === namespaceUri,
    )?.value;
  }

  private normalizeDate(value: string | undefined, fieldName: string): string | undefined {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    const parsed = Date.parse(trimmed);
    if (Number.isNaN(parsed)) {
      return trimmed;
    }

    return new Date(parsed).toISOString();
  }

  private findPrimaryHref(links: AtomLinkDto[]): string | undefined {
    if (links.length === 0) {
      return undefined;
    }

    const preferred =
      links.find((link) => link.rel === 'self') ?? links.find((link) => link.rel === 'alternate');
    return preferred?.href ?? links[0]?.href;
  }

  private collectUnknownElements(parent: XmlElement): AtomUnknownElementDto[] {
    return parent.children
      .filter((child): child is XmlElement => child.kind === 'element')
      .filter((child) => !this.isKnownAtomElement(child))
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

  private isKnownAtomElement(element: XmlElement): boolean {
    const known = new Set([
      'feed',
      'id',
      'title',
      'subtitle',
      'updated',
      'rights',
      'generator',
      'icon',
      'logo',
      'category',
      'link',
      'author',
      'contributor',
      'entry',
      'summary',
      'content',
      'published',
      'source',
      'name',
      'uri',
      'email',
    ]);

    return element.namespaceUri === ATOM_NAMESPACE_URI && known.has(element.name.toLowerCase());
  }

  private createEmptyResult(
    errors: AtomParserIssueDto[],
    warnings: AtomParserIssueDto[],
  ): AtomParseResultDto {
    return {
      feed: {
        id: undefined,
        title: undefined,
        subtitle: undefined,
        updated: undefined,
        rights: undefined,
        generator: undefined,
        icon: undefined,
        logo: undefined,
        categories: [],
        links: [],
        authors: [],
        contributors: [],
        xmlBase: undefined,
        xmlLang: undefined,
        unknownElements: [],
      },
      entries: [],
      errors,
      warnings,
      unknownElements: [],
    };
  }
}
