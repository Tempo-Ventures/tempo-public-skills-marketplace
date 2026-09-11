const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMarkdown } = require('../lib/parse-md');
const { generateRequests, tableSpan } = require('../lib/requests');

const gen = (md, opts = {}) => generateRequests(parseMarkdown(md), { index: 1, ...opts });
const ofType = (requests, key) => requests.filter(r => r[key]).map(r => r[key]);

test('all text blocks go into one insertText at the start index; each block ends with newline', () => {
  const { requests } = gen('# A\n\ntext\n\n- x');
  const inserts = ofType(requests, 'insertText');
  assert.equal(inserts.length, 1);
  assert.equal(inserts[0].location.index, 1);
  assert.equal(inserts[0].text, 'A\ntext\nx\n');
});

test('atEnd drops the final newline so the segment keeps a single trailing paragraph', () => {
  const { requests } = gen('a\n\nb', { atEnd: true });
  assert.equal(ofType(requests, 'insertText')[0].text, 'a\nb');
});

test('nested list items are prefixed with one tab per depth', () => {
  const { requests } = gen('- a\n  - b\n    - c');
  assert.equal(ofType(requests, 'insertText')[0].text, 'a\n\tb\n\t\tc\n');
});

test('heading paragraph style covers exactly the heading paragraph', () => {
  const { requests } = gen('intro\n\n## Nadpis\n\nafter');
  const [h] = ofType(requests, 'updateParagraphStyle').filter(p => /^HEADING/.test(p.paragraphStyle.namedStyleType));
  // "intro\n" = 6 chars from index 1 -> heading starts at 7, "Nadpis\n" ends at 14
  assert.deepEqual(h.range, { startIndex: 7, endIndex: 14 });
  assert.equal(h.paragraphStyle.namedStyleType, 'HEADING_2');
});

test('bold range is computed after list tab prefix', () => {
  const { requests } = gen('- a **b**');
  const [b] = ofType(requests, 'updateTextStyle').filter(t => t.textStyle.bold);
  // text "a b\n" at 1: 'b' at index 3
  assert.deepEqual(b.range, { startIndex: 3, endIndex: 4 });
});

test('block before a table loses its newline; table is inserted right after its text', () => {
  const { requests } = gen('Před\n\n| A |\n|---|\n| 1 |\n\nPo');
  assert.equal(ofType(requests, 'insertText')[0].text, 'PředPo\n');
  const [t] = ofType(requests, 'insertTable');
  assert.deepEqual(t, { rows: 2, columns: 1, location: { index: 5 } });
});

test('table cells are filled in reverse order at P+4 + r*(2C+1) + 2c', () => {
  const { requests } = gen('| A | B |\n|---|---|\n| 1 | 2 |');
  const tIdx = requests.findIndex(r => r.insertTable);
  const P = requests[tIdx].insertTable.location.index;
  const cellInserts = requests.slice(tIdx + 1).filter(r => r.insertText).map(r => [r.insertText.location.index, r.insertText.text]);
  assert.deepEqual(cellInserts, [
    [P + 4 + 1 * 5 + 2, '2'],
    [P + 4 + 1 * 5 + 0, '1'],
    [P + 4 + 0 * 5 + 2, 'B'],
    [P + 4 + 0 * 5 + 0, 'A'],
  ]);
});

test('header row cells are bold', () => {
  const { requests } = gen('| A |\n|---|\n| 1 |');
  const tIdx = requests.findIndex(r => r.insertTable);
  const bolds = requests.slice(tIdx + 1).filter(r => r.updateTextStyle && r.updateTextStyle.textStyle.bold);
  assert.equal(bolds.length, 1);
});

test('tableSpan counts the leading newline, structure and cell text', () => {
  // 2 rows x 1 col, cells "A" and "1": 1 (\n) + 2 + 2*(1+2) + 2 chars = 11
  const [t] = parseMarkdown('| A |\n|---|\n| 1 |');
  assert.equal(tableSpan(t), 11);
});

test('paragraph styles after a table are shifted by the table span', () => {
  const md = '| A |\n|---|\n| 1 |\n\n## Po';
  const { requests, endIndex } = gen(md);
  const [h] = ofType(requests, 'updateParagraphStyle').filter(p => /^HEADING/.test(p.paragraphStyle.namedStyleType));
  // table at text index 1 spans 11 -> "Po\n" starts at 12
  assert.deepEqual(h.range, { startIndex: 12, endIndex: 15 });
  assert.equal(endIndex, 15);
});

test('tables are inserted in reverse document order', () => {
  const { requests } = gen('| A |\n|---|\n\nx\n\n| B |\n|---|');
  const positions = ofType(requests, 'insertTable').map(t => t.location.index);
  assert.deepEqual(positions, [...positions].sort((a, b) => b - a));
});

test('list bullets are created last, one per list group, in reverse order', () => {
  const { requests } = gen('- a\n\ntext\n\n1. b\n2. c');
  const idx = requests.map((r, i) => r.createParagraphBullets ? i : -1).filter(i => i >= 0);
  assert.equal(idx.length, 2);
  assert.equal(idx[1], requests.length - 1);
  const bullets = ofType(requests, 'createParagraphBullets');
  assert.equal(bullets[0].bulletPreset, 'NUMBERED_DECIMAL_ALPHA_ROMAN');
  assert.equal(bullets[1].bulletPreset, 'BULLET_DISC_CIRCLE_SQUARE');
  assert.ok(bullets[0].range.startIndex > bullets[1].range.startIndex);
});

test('tabId is propagated into every location and range', () => {
  const { requests } = gen('# A\n\n- b **c**\n\n| x |\n|---|\n| 1 |', { tabId: 't.1' });
  for (const r of requests) {
    const body = Object.values(r)[0];
    const loc = body.location || body.range;
    assert.equal(loc.tabId, 't.1', JSON.stringify(r));
  }
});

test('code block text uses vertical tabs as line separators and gets shading', () => {
  const { requests } = gen('```\na\nb\n```');
  assert.equal(ofType(requests, 'insertText')[0].text, 'a\u000bb\n');
  const shaded = ofType(requests, 'updateParagraphStyle').filter(p => p.paragraphStyle.shading);
  assert.equal(shaded.length, 1);
});

test('inserted range is reset to NORMAL_TEXT, no bullets and plain text style before specific styles apply', () => {
  const { requests, endIndex } = gen('# A\n\ntext');
  const reset = requests.slice(1, 4); // right after insertText, before tables
  assert.deepEqual(reset[0].updateParagraphStyle.range, { startIndex: 1, endIndex });
  assert.equal(reset[0].updateParagraphStyle.paragraphStyle.namedStyleType, 'NORMAL_TEXT');
  assert.ok(reset[0].updateParagraphStyle.fields.includes('shading'));
  assert.deepEqual(reset[1].deleteParagraphBullets.range, { startIndex: 1, endIndex });
  assert.deepEqual(reset[2].updateTextStyle, { range: { startIndex: 1, endIndex }, textStyle: {}, fields: 'bold,italic,link,weightedFontFamily,backgroundColor' });
});

test('image block becomes an empty paragraph plus insertInlineImage at its final position, before styles', () => {
  const { requests, endIndex } = gen('a\n\n![alt](https://x/y.png)\n\n## B');
  assert.equal(ofType(requests, 'insertText')[0].text, 'a\n\nB\n');
  const imgIdx = requests.findIndex(r => r.insertInlineImage);
  assert.ok(imgIdx > 0);
  assert.deepEqual(requests[imgIdx].insertInlineImage, { uri: 'https://x/y.png', location: { index: 3 } });
  const [h] = ofType(requests, 'updateParagraphStyle').filter(p => /^HEADING/.test(p.paragraphStyle.namedStyleType));
  // "a\n" (1-3), image paragraph: image at 3 + "\n" -> "B\n" starts at 5
  assert.deepEqual(h.range, { startIndex: 5, endIndex: 7 });
  assert.ok(requests.findIndex(r => r.updateParagraphStyle && /^HEADING/.test(r.updateParagraphStyle.paragraphStyle.namedStyleType)) > imgIdx);
  assert.equal(endIndex, 7);
});

test('paragraphs, quotes, code blocks and images get spaceBelow by default; spacing:false disables it', () => {
  const md = '# H\n\ntext\n\n- li\n\n```\nc\n```';
  const spaced = ofType(gen(md).requests, 'updateParagraphStyle').filter(p => p.paragraphStyle.spaceBelow);
  assert.equal(spaced.length, 2); // text + code block, not heading, not list item
  assert.deepEqual(spaced[0].range, { startIndex: 3, endIndex: 8 });
  const none = ofType(gen(md, { spacing: false }).requests, 'updateParagraphStyle').filter(p => p.paragraphStyle.spaceBelow);
  assert.equal(none.length, 0);
});
