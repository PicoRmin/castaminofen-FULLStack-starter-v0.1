import type { XmlAttribute, XmlElement, XmlDocument } from '../xml';

export type NamespaceKind = 'default' | 'prefixed' | 'unknown';

export interface NamespaceMetadata {
  readonly prefix?: string;
  readonly uri: string;
  readonly declaredAt?: string;
  readonly kind: NamespaceKind;
  readonly elements: readonly string[];
  readonly attributes: readonly string[];
}

export interface ResolvedXmlAttribute extends XmlAttribute {
  readonly localName: string;
  readonly qualifiedName: string;
  readonly effectiveNamespace?: NamespaceMetadata;
}

export interface ResolvedXmlElement extends XmlElement {
  readonly localName: string;
  readonly qualifiedName: string;
  readonly effectiveNamespace?: NamespaceMetadata;
  readonly inheritedNamespaces: readonly NamespaceMetadata[];
}

export interface ResolvedXmlDocument {
  readonly document: XmlDocument;
  readonly root?: ResolvedXmlElement;
  readonly namespaces: readonly NamespaceMetadata[];
  readonly lookupByPrefix: (prefix: string) => NamespaceMetadata | undefined;
  readonly lookupByUri: (uri: string) => NamespaceMetadata | undefined;
  readonly lookupByElement: (element: XmlElement) => NamespaceMetadata | undefined;
  readonly lookupByAttribute: (attribute: XmlAttribute) => NamespaceMetadata | undefined;
}

export interface NamespaceResolverContract {
  resolve(document: XmlDocument): ResolvedXmlDocument;
}
