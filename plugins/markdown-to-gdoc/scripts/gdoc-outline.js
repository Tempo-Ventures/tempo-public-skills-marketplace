#!/usr/bin/env node
// Prints the tabs of a document and the structure of one tab with indices,
// or the tab content as markdown.
// Usage: gdoc-outline.js DOC_ID [--tab TAB_ID | --tab-title "Název"] [--markdown | --json]
const { run, args, docUrl } = require('./lib/cli');
const { getDocument } = require('./lib/gws');
const { docToBlocks, listTabs, tabContext } = require('./lib/doc-model');
const { resolveTab } = require('./lib/tabs');
const { blocksToMarkdown } = require('./lib/md-out');
const { blockText } = require('./lib/diff');

run(() => {
  const { values, positionals } = args({
    tab: { type: 'string' }, 'tab-title': { type: 'string' }, markdown: { type: 'boolean' }, json: { type: 'boolean' },
  });
  const [documentId] = positionals;
  if (!documentId) throw new Error('usage: gdoc-outline.js DOC_ID [--tab ID|--tab-title T] [--markdown|--json]');
  const doc = getDocument(documentId);
  const tab = resolveTab(doc, { tabId: values.tab, tabTitle: values['tab-title'] });
  const ctx = tabContext(doc, tab && tab.tabId);
  const blocks = docToBlocks(ctx.body, ctx);

  if (values.json) { console.log(JSON.stringify({ tabs: listTabs(doc), tab: tab && tab.tabId, blocks }, null, 2)); return; }
  if (values.markdown) { process.stdout.write(blocksToMarkdown(blocks)); return; }

  console.log(`# ${doc.title}  ${docUrl(documentId)}`);
  console.log('## Tabs');
  for (const t of listTabs(doc)) {
    const mark = tab && t.tabId === tab.tabId ? '*' : ' ';
    console.log(`${mark} ${'  '.repeat(t.nestingLevel)}${t.iconEmoji ? t.iconEmoji + ' ' : ''}${t.title}\t${t.tabId}`);
  }
  const end = ctx.body.content[ctx.body.content.length - 1].endIndex;
  console.log(`## Blocks (tab ${tab ? tab.tabId : '-'}; content range 1-${end - 1}, segment end ${end})`);
  for (const b of blocks) {
    const label = b.type === 'heading' ? `h${b.level}` : b.type === 'list_item' ? `${b.ordered ? 'ol' : 'ul'}${b.depth}` : b.type === 'table' ? `table ${b.rows.length}x${b.rows[0].length}` : b.type;
    const text = blockText(b).replace(/\n/g, ' ⏎ ');
    console.log(`[${b.startIndex}-${b.endIndex}] ${label}${b.quote ? ' quote' : ''}: ${text.length > 100 ? text.slice(0, 100) + '…' : text}`);
  }
});
