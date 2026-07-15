import type { XmlError } from './errors';

export type XmlNodeKind = 'document' | 'element' | 'text' | 'comment' | 'cdata' | 'declaration';

export abstract class XmlNode {
  public readonly kind: XmlNodeKind;
  public readonly name: string;
  public readonly value: string | undefined;
  public readonly line: number | undefined;
  public readonly column: number | undefined;
  public readonly children: XmlNode[];
  public parent: XmlElement | undefined;

  protected constructor(
    kind: XmlNodeKind,
    name: string,
    value?: string,
    line?: number,
    column?: number,
    parent?: XmlElement,
  ) {
    this.kind = kind;
    this.name = name;
    this.value = value;
    this.line = line;
    this.column = column;
    this.children = [];
    this.parent = parent;
  }
}

export class XmlAttribute {
  public readonly name: string;
  public readonly value: string;
  public readonly namespaceUri: string | undefined;
  public readonly prefix: string | undefined;

  constructor(name: string, value: string, namespaceUri?: string, prefix?: string) {
    this.name = name;
    this.value = value;
    this.namespaceUri = namespaceUri;
    this.prefix = prefix;
  }
}

export class XmlNamespace {
  public readonly prefix: string | undefined;
  public readonly uri: string | undefined;

  constructor(prefix?: string, uri?: string) {
    this.prefix = prefix;
    this.uri = uri;
  }
}

export class XmlDeclaration {
  public readonly version: string;
  public readonly encoding: string | undefined;
  public readonly standalone: string | undefined;

  constructor(version: string, encoding?: string, standalone?: string) {
    this.version = version;
    this.encoding = encoding;
    this.standalone = standalone;
  }
}

export class XmlElement extends XmlNode {
  public readonly attributes: XmlAttribute[];
  public readonly namespaces: XmlNamespace[];
  public readonly namespaceUri: string | undefined;
  public readonly prefix: string | undefined;

  constructor(
    name: string,
    attributes: XmlAttribute[] = [],
    namespaces: XmlNamespace[] = [],
    namespaceUri?: string,
    prefix?: string,
    line?: number,
    column?: number,
    parent?: XmlElement,
  ) {
    super('element', name, undefined, line, column, parent);
    this.attributes = attributes;
    this.namespaces = namespaces;
    this.namespaceUri = namespaceUri;
    this.prefix = prefix;
  }
}

export class XmlText extends XmlNode {
  constructor(value: string, line?: number, column?: number, parent?: XmlElement) {
    super('text', '#text', value, line, column, parent);
  }
}

export class XmlComment extends XmlNode {
  constructor(value: string, line?: number, column?: number, parent?: XmlElement) {
    super('comment', '#comment', value, line, column, parent);
  }
}

export class XmlCData extends XmlNode {
  constructor(value: string, line?: number, column?: number, parent?: XmlElement) {
    super('cdata', '#cdata', value, line, column, parent);
  }
}

export class XmlDocument {
  public declaration: XmlDeclaration | undefined;
  public root: XmlElement | undefined;
  public readonly children: XmlNode[];
  public readonly errors: XmlError[];
  public readonly namespaces: XmlNamespace[];

  constructor() {
    this.children = [];
    this.errors = [];
    this.namespaces = [];
  }
}
