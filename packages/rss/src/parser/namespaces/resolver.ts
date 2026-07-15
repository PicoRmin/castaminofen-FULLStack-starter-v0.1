import { XmlAttribute, XmlDocument, XmlElement } from '../xml';
import type {
  NamespaceMetadata,
  NamespaceResolverContract,
  ResolvedXmlAttribute,
  ResolvedXmlDocument,
  ResolvedXmlElement,
} from './types';

export class NamespaceResolver implements NamespaceResolverContract {
  private readonly namespaceMap = new Map<string, NamespaceMetadata>();
  private readonly uriMap = new Map<string, NamespaceMetadata>();

  public resolve(document: XmlDocument): ResolvedXmlDocument {
    const root = document.root;
    if (!root) {
      return this.createDocumentView(document, []);
    }

    const metadata = this.collectNamespaceMetadata(document, root);
    const resolvedRoot = this.resolveElement(root, metadata, undefined);

    return this.createDocumentView(document, metadata, resolvedRoot);
  }

  private createDocumentView(
    document: XmlDocument,
    metadata: readonly NamespaceMetadata[],
    root?: ResolvedXmlElement,
  ): ResolvedXmlDocument {
    const lookupByPrefix = (prefix: string) =>
      metadata.find((item) => item.prefix === prefix || (prefix === '' && item.kind === 'default'));
    const lookupByUri = (uri: string) => metadata.find((item) => item.uri === uri);
    const lookupByElement = (element: XmlElement) => {
      const resolved = root?.children.find((child) => child === element) as
        ResolvedXmlElement | undefined;
      return resolved?.effectiveNamespace ?? lookupByUri(element.namespaceUri ?? '');
    };
    const lookupByAttribute = (attribute: XmlAttribute) => {
      return metadata.find((item) => item.uri === attribute.namespaceUri);
    };

    const resolvedDocument: ResolvedXmlDocument = {
      document,
      namespaces: metadata,
      lookupByPrefix,
      lookupByUri,
      lookupByElement,
      lookupByAttribute,
    };

    if (root) {
      return { ...resolvedDocument, root };
    }

    return resolvedDocument;
  }

  private collectNamespaceMetadata(document: XmlDocument, root: XmlElement): NamespaceMetadata[] {
    const metadata: NamespaceMetadata[] = [];

    const capture = (element: XmlElement, inherited: readonly NamespaceMetadata[] = []) => {
      const localNamespaces = element.namespaces.map((ns) =>
        this.normalizeNamespace(ns, element, inherited),
      );
      const allNamespaces = [...inherited, ...localNamespaces];
      if (element.namespaces.length > 0) {
        for (const namespace of localNamespaces) {
          metadata.push(namespace);
        }
      }
      const elementMetadata = this.resolveElementNamespace(element, allNamespaces);
      metadata.push(elementMetadata);

      for (const child of element.children.filter(
        (child): child is XmlElement => child.kind === 'element',
      )) {
        capture(child, allNamespaces);
      }
    };

    capture(root);

    return metadata;
  }

  private normalizeNamespace(
    namespace: { prefix?: string | undefined; uri?: string | undefined },
    element: XmlElement,
    inherited: readonly NamespaceMetadata[],
  ): NamespaceMetadata {
    const prefix = this.normalizePrefix(namespace.prefix);
    const uri = namespace.uri ?? '';
    const id = `${prefix ?? ''}:${uri}`;

    if (this.namespaceMap.has(id)) {
      const existing = this.namespaceMap.get(id);
      if (existing) {
        return existing;
      }
    }

    const normalized: NamespaceMetadata = {
      uri,
      declaredAt: element.name,
      kind: this.classifyNamespaceKind(prefix, uri),
      elements: [element.name],
      attributes: [],
    };

    if (prefix) {
      Object.assign(normalized, { prefix });
    }

    this.namespaceMap.set(id, normalized);
    if (uri) {
      this.uriMap.set(uri, normalized);
    }
    return normalized;
  }

  private resolveElementNamespace(
    element: XmlElement,
    inherited: readonly NamespaceMetadata[],
  ): NamespaceMetadata {
    const defaultNamespace = inherited.find((item) => item.kind === 'default' && item.uri);
    const effectiveUri = element.namespaceUri ?? defaultNamespace?.uri ?? '';
    const prefix = this.normalizePrefix(element.prefix);
    const namespace = this.findNamespaceByUri(effectiveUri, prefix);

    if (!namespace) {
      const unknown: NamespaceMetadata = {
        uri: effectiveUri,
        declaredAt: element.name,
        kind: this.classifyNamespaceKind(prefix, effectiveUri),
        elements: [element.name],
        attributes: [],
      };
      if (prefix) {
        Object.assign(unknown, { prefix });
      }
      this.namespaceMap.set(`${prefix ?? ''}:${effectiveUri}`, unknown);
      if (effectiveUri) {
        this.uriMap.set(effectiveUri, unknown);
      }
      return unknown;
    }

    return namespace;
  }

  private resolveElement(
    element: XmlElement,
    metadata: readonly NamespaceMetadata[],
    inherited: readonly NamespaceMetadata[] | undefined,
  ): ResolvedXmlElement {
    const inheritedNamespaces = inherited ? [...inherited] : [];
    const currentNamespace = this.resolveElementNamespace(element, inheritedNamespaces);
    const resolvedChildren = element.children
      .filter((child): child is XmlElement => child.kind === 'element')
      .map((child) =>
        this.resolveElement(child, metadata, [...inheritedNamespaces, currentNamespace]),
      );

    const attributes = element.attributes.map((attribute) =>
      this.resolveAttribute(attribute, inheritedNamespaces),
    );

    return {
      ...element,
      prefix: this.normalizePrefix(element.prefix),
      localName: this.localName(element.name),
      qualifiedName: element.name,
      effectiveNamespace: currentNamespace,
      inheritedNamespaces,
      children: [...resolvedChildren],
      attributes,
    } as ResolvedXmlElement;
  }

  private resolveAttribute(
    attribute: XmlAttribute,
    inherited: readonly NamespaceMetadata[],
  ): ResolvedXmlAttribute {
    const normalizedPrefix = this.normalizePrefix(
      attribute.prefix ?? this.extractPrefix(attribute.name),
    );
    const effectiveNamespace =
      inherited.find((item) => item.prefix === normalizedPrefix) ??
      this.findNamespaceByUri(attribute.namespaceUri ?? '');
    const namespace =
      effectiveNamespace ?? this.createUnknownNamespace(attribute, normalizedPrefix);

    return {
      ...attribute,
      localName: this.localName(attribute.name),
      qualifiedName: attribute.name,
      effectiveNamespace: namespace,
    } as ResolvedXmlAttribute;
  }

  private createUnknownNamespace(attribute: XmlAttribute, prefix?: string): NamespaceMetadata {
    const uri = attribute.namespaceUri ?? '';
    const namespace: NamespaceMetadata = {
      uri,
      declaredAt: attribute.name,
      kind: this.classifyNamespaceKind(prefix, uri),
      elements: [],
      attributes: [attribute.name],
    };
    if (prefix) {
      Object.assign(namespace, { prefix });
    }
    this.namespaceMap.set(`${prefix ?? ''}:${uri}`, namespace);
    if (uri) {
      this.uriMap.set(uri, namespace);
    }
    return namespace;
  }

  private findNamespaceByUri(uri: string, prefix?: string): NamespaceMetadata | undefined {
    const existing = this.uriMap.get(uri);
    if (existing) {
      return existing;
    }
    return prefix ? this.namespaceMap.get(`${prefix}:${uri}`) : undefined;
  }

  private localName(name: string): string {
    const index = name.indexOf(':');
    return index >= 0 ? name.slice(index + 1) : name;
  }

  private extractPrefix(name: string): string | undefined {
    const index = name.indexOf(':');
    return index >= 0 ? name.slice(0, index) : undefined;
  }

  private normalizePrefix(prefix?: string): string | undefined {
    if (prefix === undefined || prefix === null) {
      return undefined;
    }

    const trimmed = prefix.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private classifyNamespaceKind(prefix?: string, uri?: string): NamespaceMetadata['kind'] {
    if (!uri) {
      return 'unknown';
    }

    if (!prefix) {
      return 'default';
    }

    const knownUris = new Set([
      'http://www.w3.org/2005/Atom',
      'http://purl.org/rss/1.0/',
      'http://search.yahoo.com/mrss/',
      'http://purl.org/dc/elements/1.1/',
      'http://purl.org/rss/1.0/modules/content/',
      'http://www.georss.org/georss',
      'http://a9.com/-/spec/opensearch/1.1/',
      'http://creativecommons.org/ns#',
      'https://podcastindex.org/namespace/1.0',
    ]);

    return knownUris.has(uri) ? 'prefixed' : 'unknown';
  }
}
