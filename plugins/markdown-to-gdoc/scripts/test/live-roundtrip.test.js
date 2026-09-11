// Live tests against the real Docs API. Run with GDOC_LIVE=1. Each test creates
// a document named md-to-gdoc-test-* in Drive root and deletes it afterwards.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseMarkdown } = require('../lib/parse-md');
const { generateRequests } = require('../lib/requests');
const { docToBlocks, tabContext, normalizeBlocks } = require('../lib/doc-model');
const { gws, getDocument, batchUpdate, deleteFile } = require('../lib/gws');

const live = process.env.GDOC_LIVE === '1';
const sampleMd = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.md'), 'utf-8');

function withDoc(name, fn) {
  const doc = gws(['docs', 'documents', 'create'], { json: { title: `md-to-gdoc-test-${name}` } });
  try { return fn(doc.documentId); }
  finally { deleteFile(doc.documentId); }
}

const expected = (md) => normalizeBlocks(parseMarkdown(md).filter(b => b.type !== 'image'));
const readBack = (documentId, tabId) => {
  const ctx = tabContext(getDocument(documentId), tabId);
  return normalizeBlocks(docToBlocks(ctx.body, ctx));
};

test('live: sample markdown written into a fresh document reads back identically', { skip: !live }, () => {
  withDoc('root', (id) => {
    const blocks = parseMarkdown(sampleMd).filter(b => b.type !== 'image');
    const { requests } = generateRequests(blocks, { index: 1, atEnd: true });
    batchUpdate(id, requests);
    assert.deepEqual(readBack(id), expected(sampleMd));
  });
});

test('live: sample markdown written into a new named tab reads back identically', { skip: !live }, () => {
  withDoc('tab', (id) => {
    const [reply] = batchUpdate(id, [{ addDocumentTab: { tabProperties: { title: 'Zápis', iconEmoji: '📝' } } }]);
    const tabId = reply.addDocumentTab.tabProperties.tabId;
    const blocks = parseMarkdown(sampleMd).filter(b => b.type !== 'image');
    const { requests } = generateRequests(blocks, { index: 1, tabId, atEnd: true });
    batchUpdate(id, requests);
    assert.deepEqual(readBack(id, tabId), expected(sampleMd));
  });
});

test('live: appending after existing content keeps both parts', { skip: !live }, () => {
  withDoc('append', (id) => {
    const first = generateRequests(parseMarkdown('# A\n\nprvní'), { index: 1 });
    batchUpdate(id, first.requests);
    const doc = getDocument(id);
    const end = tabContext(doc).body.content.at(-1).endIndex - 1;
    const second = generateRequests(parseMarkdown('## B\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\n- z'), { index: end, atEnd: true });
    batchUpdate(id, second.requests);
    assert.deepEqual(readBack(id), expected('# A\n\nprvní\n\n## B\n\n| x | y |\n|---|---|\n| 1 | 2 |\n\n- z'));
  });
});

test('live: document that starts with a table and has two adjacent tables', { skip: !live }, () => {
  const md = '| a |\n|---|\n| 1 |\n\n| b |\n|---|\n| 2 |\n\nkonec';
  withDoc('tables', (id) => {
    const { requests } = generateRequests(parseMarkdown(md), { index: 1, atEnd: true });
    batchUpdate(id, requests);
    assert.deepEqual(readBack(id), expected(md));
  });
});

test('live: image from a public URL round-trips; an unreachable image is skipped and reported', { skip: !live }, () => {
  const { writeMarkdown } = require('../lib/write');
  const ok = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';
  withDoc('image', (id) => {
    const r = writeMarkdown({ documentId: id, markdown: `před\n\n![logo](${ok})\n\n- po`, mode: 'replace' });
    assert.deepEqual(r.skippedImages, []);
    const got = readBack(id);
    assert.equal(got[1].type, 'image');
    assert.equal(got[1].url, ok);
    assert.deepEqual(got.map(b => b.type), ['paragraph', 'image', 'list_item']);
    const r2 = writeMarkdown({ documentId: id, markdown: 'x\n\n![bad](https://example.invalid/no.png)\n\ny', mode: 'replace' });
    assert.deepEqual(r2.skippedImages, ['https://example.invalid/no.png']);
    assert.deepEqual(readBack(id), normalizeBlocks(parseMarkdown('x\n\ny')));
  });
});
