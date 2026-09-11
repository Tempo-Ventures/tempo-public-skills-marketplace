const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseMarkdown } = require('../lib/parse-md');
const { docToBlocks, listTabs, tabBody, normalizeBlocks } = require('../lib/doc-model');

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8'));
const sampleMd = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.md'), 'utf-8');

const summary = (blocks) => blocks.map(b => {
  const text = b.runs ? b.runs.map(r => r.text).join('') : (b.text || '');
  if (b.type === 'table') return ['table', b.rows.map(r => r.map(c => c.map(x => x.text).join('')))];
  if (b.type === 'list_item') return ['list_item', b.depth, b.ordered, text];
  if (b.type === 'heading') return ['heading', b.level, text];
  return [b.type, text];
});

test('Drive-imported document reads back as the same headings, paragraphs, lists and table as the markdown', () => {
  const doc = fixture('drive-import.json');
  const got = summary(docToBlocks(doc.body, doc)).filter(b => b[0] !== 'image');
  const want = summary(parseMarkdown(sampleMd)).filter(b => b[0] !== 'image');
  // Drive renders code blocks as its own building block and hr as nothing; compare everything else
  const skip = new Set(['code_block']);
  assert.deepEqual(got.filter(b => !skip.has(b[0])), want.filter(b => !skip.has(b[0])));
});

test('inline styles survive: bold, italic, code, link inside a paragraph', () => {
  const doc = fixture('drive-import.json');
  const [, intro] = docToBlocks(doc.body, doc);
  const styled = intro.runs.filter(r => r.bold || r.italic || r.code || r.link);
  assert.deepEqual(styled, [
    { text: 'tučným', bold: true },
    { text: 'kurzívou', italic: true },
    { text: 'podtržítkovou kurzívou', italic: true },
    { text: 'podtržítkovým tučným', bold: true },
    { text: 'inline kódem', code: true },
    { text: 'odkazem', link: 'https://example.com' },
  ]);
});

test('table cell keeps inline styles', () => {
  const doc = fixture('drive-import.json');
  const table = docToBlocks(doc.body, doc).find(b => b.type === 'table');
  assert.deepEqual(table.rows[2][1], [{ text: 'odkaz', link: 'https://tempo.ooo' }, { text: ' a ' }, { text: 'kurzíva', italic: true }]);
});

test('blocks carry startIndex/endIndex of their paragraph or table', () => {
  const doc = fixture('drive-import.json');
  const blocks = docToBlocks(doc.body, doc);
  const table = blocks.find(b => b.type === 'table');
  assert.equal(table.startIndex, 457);
  assert.equal(table.endIndex, 560);
  assert.equal(blocks[0].startIndex, 1);
});

test('listTabs returns flat list with id, title, emoji and nesting; tabBody picks a tab by id', () => {
  const doc = fixture('two-tabs.json');
  assert.deepEqual(listTabs(doc), [
    { tabId: 't.0', title: 'Tab 1', iconEmoji: undefined, index: 0, parentTabId: undefined, nestingLevel: 0 },
    { tabId: 't.yipbadpza39c', title: 'Druhý tab', iconEmoji: '📊', index: 1, parentTabId: undefined, nestingLevel: 0 },
  ]);
  const body = tabBody(doc, 't.yipbadpza39c');
  assert.equal(body.content.length, 2);
});

test('normalizeBlocks merges adjacent runs with identical style and drops positional fields', () => {
  const blocks = normalizeBlocks([
    { type: 'paragraph', startIndex: 1, endIndex: 5, runs: [{ text: 'a' }, { text: 'b' }, { text: 'c', bold: true }] },
    { type: 'list_item', depth: 0, ordered: false, listGroup: 'kix.x', runs: [{ text: 'x' }] },
  ]);
  assert.deepEqual(blocks, [
    { type: 'paragraph', runs: [{ text: 'ab' }, { text: 'c', bold: true }] },
    { type: 'list_item', depth: 0, ordered: false, runs: [{ text: 'x' }] },
  ]);
});
