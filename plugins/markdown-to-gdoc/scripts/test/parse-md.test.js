const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseMarkdown } = require('../lib/parse-md');

const runs = (block) => block.runs.map(r => r.text).join('');

test('heading levels map to blocks with level', () => {
  const blocks = parseMarkdown('# Titul\n\n## Sekce\n\n##### Pátá');
  assert.deepEqual(blocks.map(b => [b.type, b.level, runs(b)]), [
    ['heading', 1, 'Titul'],
    ['heading', 2, 'Sekce'],
    ['heading', 5, 'Pátá'],
  ]);
});

test('soft-wrapped lines form one paragraph', () => {
  const blocks = parseMarkdown('první řádek\ndruhý řádek');
  assert.equal(blocks.length, 1);
  assert.equal(runs(blocks[0]), 'první řádek druhý řádek');
});

test('inline formatting becomes styled runs, including underscore variants and nesting', () => {
  const [b] = parseMarkdown('a **b** _c_ __d__ `e` [f](https://x.y) ***g***');
  assert.deepEqual(b.runs, [
    { text: 'a ' },
    { text: 'b', bold: true },
    { text: ' ' },
    { text: 'c', italic: true },
    { text: ' ' },
    { text: 'd', bold: true },
    { text: ' ' },
    { text: 'e', code: true },
    { text: ' ' },
    { text: 'f', link: 'https://x.y' },
    { text: ' ' },
    { text: 'g', bold: true, italic: true },
  ]);
});

test('nested bullet and ordered lists carry depth and ordered flag', () => {
  const md = '- a\n  - b\n    - c\n- d\n\n1. x\n2. y\n   1. z';
  const blocks = parseMarkdown(md);
  assert.deepEqual(blocks.map(b => [b.type, b.depth, b.ordered, runs(b)]), [
    ['list_item', 0, false, 'a'],
    ['list_item', 1, false, 'b'],
    ['list_item', 2, false, 'c'],
    ['list_item', 0, false, 'd'],
    ['list_item', 0, true, 'x'],
    ['list_item', 0, true, 'y'],
    ['list_item', 1, true, 'z'],
  ]);
});

test('list items get a listGroup id so separate lists restart numbering', () => {
  const blocks = parseMarkdown('1. a\n2. b\n\ntext\n\n1. c');
  const items = blocks.filter(b => b.type === 'list_item');
  assert.equal(items[0].listGroup, items[1].listGroup);
  assert.notEqual(items[0].listGroup, items[2].listGroup);
});

test('table rows are arrays of run arrays; separator row dropped; header flagged', () => {
  const md = '| A | B |\n|---|---|\n| **x** | [y](https://z) |\n| 1 | |';
  const [t] = parseMarkdown(md);
  assert.equal(t.type, 'table');
  assert.equal(t.rows.length, 3);
  assert.deepEqual(t.rows[0].map(c => c.map(r => r.text).join('')), ['A', 'B']);
  assert.deepEqual(t.rows[1][0], [{ text: 'x', bold: true }]);
  assert.deepEqual(t.rows[1][1], [{ text: 'y', link: 'https://z' }]);
  assert.deepEqual(t.rows[2][1], []);
});

test('fenced code block keeps lines verbatim', () => {
  const [b] = parseMarkdown('```bash\necho "a"\n  indented\n```');
  assert.equal(b.type, 'code_block');
  assert.equal(b.text, 'echo "a"\n  indented');
});

test('blockquote paragraphs are flagged, hr is skipped, images become image blocks', () => {
  const blocks = parseMarkdown('> citace\n\n---\n\n![alt](https://img/x.png)');
  assert.deepEqual(blocks.map(b => b.type), ['paragraph', 'image']);
  assert.equal(blocks[0].quote, true);
  assert.equal(blocks[1].url, 'https://img/x.png');
});

test('task list items carry checked state', () => {
  const blocks = parseMarkdown('- [ ] todo\n- [x] done');
  assert.deepEqual(blocks.map(b => [b.checked, runs(b)]), [[false, 'todo'], [true, 'done']]);
});

test('cutAt drops everything from the given heading line onward', () => {
  const blocks = parseMarkdown('# A\n\ntext\n\n## Přílohy\n\nskryté', { cutAt: '## Přílohy' });
  assert.deepEqual(blocks.map(b => runs(b)), ['A', 'text']);
});
