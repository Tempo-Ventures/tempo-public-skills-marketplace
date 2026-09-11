// Live tests for the write flow and tab helpers. Run with GDOC_LIVE=1.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMarkdown } = require('../lib/parse-md');
const { docToBlocks, tabContext, normalizeBlocks, listTabs } = require('../lib/doc-model');
const { gws, getDocument, batchUpdate, deleteFile } = require('../lib/gws');
const { writeMarkdown } = require('../lib/write');
const tabs = require('../lib/tabs');

const live = process.env.GDOC_LIVE === '1';

function withDoc(name, fn) {
  const doc = gws(['docs', 'documents', 'create'], { json: { title: `md-to-gdoc-test-${name}` } });
  try { return fn(doc.documentId); }
  finally { deleteFile(doc.documentId); }
}
const expected = (md) => normalizeBlocks(parseMarkdown(md));
const readBack = (documentId, tabId) => {
  const ctx = tabContext(getDocument(documentId), tabId);
  return normalizeBlocks(docToBlocks(ctx.body, ctx));
};

test('live: replace wipes previous styled content (list, bold, table) and writes plain markdown cleanly', { skip: !live }, () => {
  withDoc('replace', (id) => {
    writeMarkdown({ documentId: id, markdown: '# Staré\n\n- **odrážka**\n\n| a |\n|---|\n| 1 |\n\n```\nkod\n```', mode: 'replace' });
    const result = writeMarkdown({ documentId: id, markdown: 'jen text\n\ndruhý', mode: 'replace' });
    assert.deepEqual(readBack(id), expected('jen text\n\ndruhý'));
    assert.ok(result.deleted, 'reports deleted range');
  });
});

test('live: append keeps existing content and adds after it', { skip: !live }, () => {
  withDoc('append', (id) => {
    writeMarkdown({ documentId: id, markdown: '# A\n\nprvní', mode: 'replace' });
    writeMarkdown({ documentId: id, markdown: '## B\n\n- x', mode: 'append' });
    assert.deepEqual(readBack(id), expected('# A\n\nprvní\n\n## B\n\n- x'));
  });
});

test('live: writing into a template keeps its named styles and header', { skip: !live }, () => {
  withDoc('template', (id) => {
    batchUpdate(id, [
      { updateNamedStyle: { namedStyle: { namedStyleType: 'HEADING_1', textStyle: { weightedFontFamily: { fontFamily: 'Georgia', weight: 400 } } }, fields: 'namedStyleType,textStyle,textStyle.weightedFontFamily' } },
      { createHeader: { type: 'DEFAULT' } },
    ]);
    writeMarkdown({ documentId: id, markdown: '# Nadpis\n\ntext', mode: 'replace' });
    const ctx = tabContext(getDocument(id));
    const h1 = ctx.namedStyles.styles.find(s => s.namedStyleType === 'HEADING_1');
    assert.equal(h1.textStyle.weightedFontFamily.fontFamily, 'Georgia');
    assert.equal(Object.keys(ctx.headers || {}).length, 1);
    assert.deepEqual(readBack(id), expected('# Nadpis\n\ntext'));
  });
});

test('live: cutAt is honoured and dryRun sends nothing', { skip: !live }, () => {
  withDoc('dry', (id) => {
    const r = writeMarkdown({ documentId: id, markdown: 'a\n\n## Skrýt\n\nb', mode: 'replace', cutAt: '## Skrýt', dryRun: true });
    assert.ok(r.requests.length > 0);
    assert.deepEqual(readBack(id), []);
  });
});

test('live: tab helpers create, rename, nest, list and delete tabs; write targets a tab by title', { skip: !live }, () => {
  withDoc('tabs', (id) => {
    const t1 = tabs.createTab(id, { title: 'Zápis', iconEmoji: '📝' });
    const t2 = tabs.createTab(id, { title: 'Pod', parentTabId: t1 });
    tabs.updateTab(id, t1, { title: 'Zápis 2', iconEmoji: '📌' });
    const list = tabs.listTabs(id);
    assert.deepEqual(list.map(t => [t.title, t.iconEmoji, t.parentTabId || null]), [
      ['Tab 1', undefined, null], ['Zápis 2', '📌', null], ['Pod', undefined, t1],
    ]);
    const r = writeMarkdown({ documentId: id, tabTitle: 'Pod', markdown: '# V podtabu', mode: 'replace' });
    assert.equal(r.tabId, t2);
    assert.deepEqual(readBack(id, t2), expected('# V podtabu'));
    tabs.deleteTab(id, t2);
    assert.equal(tabs.listTabs(id).length, 2);
  });
});

test('live: writing to an unknown tab title fails with the list of available tabs', { skip: !live }, () => {
  withDoc('unknown', (id) => {
    assert.throws(() => writeMarkdown({ documentId: id, tabTitle: 'Neexistuje', markdown: 'x', mode: 'replace' }), /Tab 1/);
  });
});
