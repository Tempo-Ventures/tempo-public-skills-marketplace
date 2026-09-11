#!/usr/bin/env node
// Writes a markdown file into a document tab via batchUpdate.
// Usage: gdoc-write.js input.md --doc DOC_ID (--replace | --append)
//          [--tab TAB_ID | --tab-title "Název"] [--cut-at "## Heading"] [--no-spacing] [--dry-run] [--requests out.json]
const fs = require('node:fs');
const { run, args, docUrl } = require('./lib/cli');
const { writeMarkdown } = require('./lib/write');
const { listComments } = require('./lib/comments');

run(() => {
  const { values, positionals } = args({
    doc: { type: 'string' }, tab: { type: 'string' }, 'tab-title': { type: 'string' },
    replace: { type: 'boolean' }, append: { type: 'boolean' }, 'cut-at': { type: 'string' },
    'dry-run': { type: 'boolean' }, requests: { type: 'string' }, 'no-spacing': { type: 'boolean' },
  });
  const [input] = positionals;
  if (!input || !values.doc) throw new Error('usage: gdoc-write.js input.md --doc DOC_ID (--replace|--append) [--tab ID|--tab-title T] [--cut-at H] [--dry-run]');
  if (values.replace === values.append) throw new Error('choose exactly one of --replace or --append');
  const mode = values.replace ? 'replace' : 'append';

  const open = mode === 'replace' ? listComments(values.doc).filter(c => c.anchored) : [];
  const result = writeMarkdown({
    documentId: values.doc, tabId: values.tab, tabTitle: values['tab-title'],
    markdown: fs.readFileSync(input, 'utf-8'), mode, cutAt: values['cut-at'], dryRun: !!values['dry-run'], spacing: !values['no-spacing'],
  });
  if (values.requests) fs.writeFileSync(values.requests, JSON.stringify({ requests: result.requests }, null, 2));

  console.log(`${values['dry-run'] ? 'dry-run: would write' : 'wrote'} ${result.blocks} block(s) (${result.requests.length} requests), mode ${mode}, tab ${result.tabId}`);
  if (result.deleted) console.log(`replaced content ${result.deleted.startIndex}-${result.deleted.endIndex}`);
  if (result.skippedImages.length) console.log(`SKIPPED ${result.skippedImages.length} image(s) Google could not fetch: ${result.skippedImages.join(', ')}`);
  if (open.length) {
    console.log(`open anchored comments before replace: ${open.length} – they stay in "All comments" as "Original content deleted"`);
    for (const c of open) console.log(`  ${c.author}\t"${c.quote || ''}"\t${c.content.replace(/\n/g, ' ')}`);
  }
  console.log(docUrl(values.doc, result.tabId));
});
