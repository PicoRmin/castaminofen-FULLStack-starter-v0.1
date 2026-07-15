import test from 'node:test';
import assert from 'node:assert/strict';
import { XmlDocumentFactory } from '../xml/document-factory';
import { NamespaceResolver } from './resolver';

test('NamespaceResolver resolves inherited and unknown namespaces', async () => {
  const xml = `<?xml version="1.0"?>
    <feed xmlns="https://example.com/feed" xmlns:media="https://example.com/media" xmlns:custom="https://example.com/custom" xmlns:atom="http://www.w3.org/2005/Atom">
      <entry>
        <title xml:lang=" EN "> Hello </title>
        <media:content custom:source="demo" atom:updated="2024-01-01T00:00:00Z" />
      </entry>
    </feed>`;

  const document = await new XmlDocumentFactory().create(xml);
  const resolved = new NamespaceResolver().resolve(document);

  assert.equal(resolved.root?.namespaceUri, 'https://example.com/feed');
  assert.equal(resolved.root?.prefix, undefined);
  assert.equal(resolved.root?.localName, 'feed');
  assert.equal(resolved.root?.effectiveNamespace?.uri, 'https://example.com/feed');

  const entry = resolved.root?.children[0] as any;
  assert.ok(entry);
  assert.equal(entry.localName, 'entry');
  assert.equal(entry.effectiveNamespace?.uri, 'https://example.com/feed');

  const title = entry.children[0] as any;
  assert.ok(title);
  assert.equal(title.namespaceUri, 'https://example.com/feed');
  assert.equal(title.localName, 'title');

  const content = entry.children[1] as any;
  assert.ok(content);
  assert.equal(content.namespaceUri, 'https://example.com/media');
  assert.equal(content.localName, 'content');
  assert.equal(content.prefix, 'media');

  const custom = resolved.lookupByUri('https://example.com/custom');
  assert.ok(custom);
  assert.equal(custom?.kind, 'unknown');

  const attr = content.attributes[0];
  assert.ok(attr);
  assert.equal(attr.namespaceUri, 'https://example.com/custom');
  assert.equal(attr.localName, 'source');
  assert.equal(attr.prefix, 'custom');
});
