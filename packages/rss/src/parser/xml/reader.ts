import sax from 'sax';
import {
  XmlDocument,
  XmlElement,
  XmlAttribute,
  XmlNamespace,
  XmlText,
  XmlComment,
  XmlCData,
} from './document';
import { XmlErrorFactory } from './error-factory';
import { XmlUtilities } from './utilities';
import type { XmlLoadResult } from './types';

export class XmlReader {
  public read(loadResult: XmlLoadResult): XmlDocument {
    const document = new XmlDocument();
    const parser = sax.createStream(true, {
      trim: false,
      normalize: false,
      xmlns: true,
    });

    const stack: XmlElement[] = [];
    let currentParent: XmlElement | undefined;

    parser.on('opentag', (node: any) => {
      const attributes = Object.entries((node.attributes as Record<string, any>) ?? {}).map(
        ([name, value]) => {
          const normalizedValue = typeof value === 'string' ? value : (value?.value ?? '');
          const namespaceUri =
            typeof value === 'object' && value !== null ? (value as any).uri : undefined;
          const prefix =
            typeof value === 'object' && value !== null ? (value as any).prefix : undefined;
          return new XmlAttribute(name, normalizedValue, namespaceUri, prefix);
        },
      );
      const namespaces = node.ns
        ? Object.entries(node.ns as Record<string, string>).map(
            ([prefix, uri]) => new XmlNamespace(prefix, uri),
          )
        : [];
      const element = new XmlElement(node.name, attributes, namespaces, node.uri, node.prefix);
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(element);
        element.parent = parent;
      } else {
        document.children.push(element);
      }
      stack.push(element);
    });

    parser.on('text', (text) => {
      if (XmlUtilities.isWhitespace(text)) {
        return;
      }
      const node = new XmlText(text, undefined, undefined, stack[stack.length - 1]);
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
      } else {
        document.children.push(node);
      }
    });

    parser.on('comment', (comment) => {
      const node = new XmlComment(comment, undefined, undefined, stack[stack.length - 1]);
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
      } else {
        document.children.push(node);
      }
    });

    parser.on('cdata', (cdata) => {
      const node = new XmlCData(cdata, undefined, undefined, stack[stack.length - 1]);
      const parent = stack[stack.length - 1];
      if (parent) {
        parent.children.push(node);
      } else {
        document.children.push(node);
      }
    });

    parser.on('closetag', () => {
      if (stack.length > 0) {
        stack.pop();
      }
    });

    parser.on('error', (error) => {
      document.errors.push(XmlErrorFactory.syntax(error.message, { cause: error }));
    });

    parser.on('end', () => {
      if (stack.length > 0) {
        document.errors.push(XmlErrorFactory.malformedDocument('Unclosed XML element.'));
      }
    });

    parser.write(loadResult.text);
    parser.end();

    if (document.errors.length > 0) {
      return document;
    }

    const root = document.children.find((child): child is XmlElement => child.kind === 'element');
    if (root) {
      document.root = root;
    }

    return document;
  }
}
