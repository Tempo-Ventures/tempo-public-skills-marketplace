const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseMarkdown } = require('../lib/parse-md');
const { docToBlocks, normalizeBlocks } = require('../lib/doc-model');
const { diffBlocks, affectedComments } = require('../lib/diff');
const { blocksToMarkdown } = require('../lib/md-out');

const fixture = (name) => JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8'));
const sampleMd = fs.readFileSync(path.join(__dirname, 'fixtures', 'sample.md'), 'utf-8');
const docBlocks = () => { const d = fixture('drive-import.json'); return docToBlocks(d.body, d); };
const noImages = (blocks) => blocks.filter(b => b.type !== 'image');

test('identical content yields no changes', () => {
  const d = diffBlocks(noImages(docBlocks()), noImages(parseMarkdown(sampleMd)));
  assert.equal(d.changes.length, 0);
  assert.equal(d.same, true);
});

test('a changed paragraph is reported as remove+add with document indices', () => {
  const md = sampleMd.replace('Odstavec pod H5.', 'Odstavec pod H5 – upraveno.');
  const d = diffBlocks(noImages(docBlocks()), noImages(parseMarkdown(md)));
  assert.deepEqual(d.changes.map(c => [c.kind, c.text]), [
    ['removed', 'Odstavec pod H5.'],
    ['added', 'Odstavec pod H5 – upraveno.'],
  ]);
  assert.equal(d.changes[0].startIndex, 255);
  assert.equal(typeof d.changes[0].endIndex, 'number');
});

test('an added list item and a removed table row are reported individually', () => {
  const md = sampleMd.replace('- třetí položka', '- třetí položka\n- čtvrtá položka').replace('| C | prázdné vedle | |\n', '');
  const d = diffBlocks(noImages(docBlocks()), noImages(parseMarkdown(md)));
  const kinds = d.changes.map(c => `${c.kind}:${c.type}`);
  assert.deepEqual(kinds, ['added:list_item', 'removed:table', 'added:table']);
});

test('affectedComments flags open comments whose quoted text sits in a removed block', () => {
  const md = sampleMd.replace('Odstavec pod H5.', 'jiný text');
  const d = diffBlocks(noImages(docBlocks()), noImages(parseMarkdown(md)));
  const comments = [
    { id: '1', content: 'k odstavci', resolved: false, quotedFileContent: { value: 'pod H5' }, author: { displayName: 'Honza' } },
    { id: '2', content: 'k tabulce', resolved: false, quotedFileContent: { value: 'prázdné vedle' } },
    { id: '3', content: 'vyřešený', resolved: true, quotedFileContent: { value: 'pod H5' } },
    { id: '4', content: 'bez kotvy', resolved: false },
  ];
  const r = affectedComments(comments, d);
  assert.deepEqual(r.map(c => [c.id, c.status]), [['1', 'loses-anchor'], ['2', 'kept'], ['4', 'unanchored']]);
});

test('blocksToMarkdown round-trips through the parser', () => {
  const blocks = noImages(parseMarkdown(sampleMd));
  const md = blocksToMarkdown(blocks);
  assert.deepEqual(normalizeBlocks(parseMarkdown(md)), normalizeBlocks(blocks));
});

test('adjacent lists of the same kind are separated so they do not merge on re-parse', () => {
  const blocks = parseMarkdown('- a\n\ntext\n\n- b');
  const two = [blocks[0], blocks[2]];
  const md = blocksToMarkdown(two);
  const again = parseMarkdown(md);
  assert.equal(again.length, 2);
  assert.notEqual(again[0].listGroup, again[1].listGroup);
});

test('blocksToMarkdown renders headings, nested lists, checkboxes, tables, quotes and code', () => {
  const md = blocksToMarkdown(parseMarkdown('## H\n\n- a\n  - b\n\n- [x] c\n\n| x | y |\n|---|---|\n| 1 | **2** |\n\n> q\n\n```\ncode\n```'));
  assert.equal(md, '## H\n\n- a\n  - b\n- [x] c\n\n| x | y |\n| --- | --- |\n| 1 | **2** |\n\n> q\n\n```\ncode\n```\n');
});
