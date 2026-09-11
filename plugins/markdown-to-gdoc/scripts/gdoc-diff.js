#!/usr/bin/env node
// Compares a document tab with a markdown file, block by block, and lists the
// open comments a rewrite would detach.
// Usage: gdoc-diff.js DOC_ID input.md [--tab TAB_ID | --tab-title "Název"] [--cut-at "## Heading"]
// Exit code 0 = identical, 2 = differences.
const fs = require('node:fs');
const { run, args } = require('./lib/cli');
const { getDocument } = require('./lib/gws');
const { docToBlocks, tabContext } = require('./lib/doc-model');
const { resolveTab } = require('./lib/tabs');
const { parseMarkdown } = require('./lib/parse-md');
const { diffBlocks, affectedComments } = require('./lib/diff');
const { listComments } = require('./lib/comments');

run(() => {
  const { values, positionals } = args({ tab: { type: 'string' }, 'tab-title': { type: 'string' }, 'cut-at': { type: 'string' } });
  const [documentId, input] = positionals;
  if (!documentId || !input) throw new Error('usage: gdoc-diff.js DOC_ID input.md [--tab ID|--tab-title T] [--cut-at H]');
  const doc = getDocument(documentId);
  const tab = resolveTab(doc, { tabId: values.tab, tabTitle: values['tab-title'] });
  const ctx = tabContext(doc, tab && tab.tabId);
  const docBlocks = docToBlocks(ctx.body, ctx);
  const mdBlocks = parseMarkdown(fs.readFileSync(input, 'utf-8'), { cutAt: values['cut-at'] });
  const d = diffBlocks(docBlocks, mdBlocks);
  const comments = affectedComments(listComments(documentId), d);

  console.log(`tab ${tab ? `${tab.title} (${tab.tabId})` : '-'}: ${d.docCount} blocks in doc, ${d.mdCount} in markdown`);
  if (d.same) console.log('SAME – document matches the markdown');
  else {
    console.log(`DIFFERENT – ${d.changes.filter(c => c.kind === 'removed').length} block(s) only in doc, ${d.changes.filter(c => c.kind === 'added').length} only in markdown`);
    for (const c of d.changes) {
      const where = c.kind === 'removed' ? `[${c.startIndex}-${c.endIndex}]` : `(md block ${c.mdIndex})`;
      const text = c.text.replace(/\n/g, ' ⏎ ');
      console.log(`${c.kind === 'removed' ? '-' : '+'} ${where} ${c.type}: ${text.length > 120 ? text.slice(0, 120) + '…' : text}`);
    }
  }
  if (comments.length) {
    console.log(`open comments: ${comments.length}`);
    for (const c of comments) console.log(`  ${c.status}\t${c.author}\t"${c.quote || ''}"\t${c.content.replace(/\n/g, ' ')}`);
  } else console.log('open comments: none');
  return d.same ? 0 : 2;
});
