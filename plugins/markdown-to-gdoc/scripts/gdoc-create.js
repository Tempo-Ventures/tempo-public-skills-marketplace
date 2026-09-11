#!/usr/bin/env node
// Creates a Google Doc from markdown.
//   Without --template: Drive import (text/markdown -> Google Doc). Best fidelity, no tabs, no styling.
//   With --template:    copies the template, then replaces the content of one tab via batchUpdate,
//                       so the template's named styles, header/footer, margins and other tabs survive.
// Usage: gdoc-create.js input.md --title "Název" [--folder FOLDER_ID] [--template DOC_ID [--tab-title "Název tabu"] [--no-spacing]] [--cut-at "## Heading"]
const fs = require('node:fs');
const path = require('node:path');
const { run, args, docUrl } = require('./lib/cli');
const { gws } = require('./lib/gws');
const { writeMarkdown } = require('./lib/write');
const { parseMarkdown } = require('./lib/parse-md');

run(() => {
  const { values, positionals } = args({
    title: { type: 'string' }, folder: { type: 'string' }, template: { type: 'string' }, 'tab-title': { type: 'string' }, 'cut-at': { type: 'string' }, 'no-spacing': { type: 'boolean' },
  });
  const [input] = positionals;
  if (!input) throw new Error('usage: gdoc-create.js input.md --title T [--folder ID] [--template ID [--tab-title T]] [--cut-at H]');
  const markdown = fs.readFileSync(input, 'utf-8');
  const h1 = parseMarkdown(markdown).find(b => b.type === 'heading' && b.level === 1);
  const title = values.title || (h1 && h1.runs.map(r => r.text).join('')) || path.basename(input, '.md');

  let id;
  if (values.template) {
    const meta = { name: title };
    if (values.folder) meta.parents = [values.folder];
    const copy = gws(['drive', 'files', 'copy'], { params: { fileId: values.template, supportsAllDrives: true, fields: 'id' }, json: meta });
    id = copy.id;
    const r = writeMarkdown({ documentId: id, tabTitle: values['tab-title'], markdown, mode: 'replace', cutAt: values['cut-at'], spacing: !values['no-spacing'] });
    console.log(`created from template ${values.template}: ${id} (tab ${r.tabId}, ${r.blocks} blocks)`);
  } else {
    let src = input;
    if (values['cut-at']) {
      const { blocksToMarkdown } = require('./lib/md-out');
      src = path.join(require('node:os').tmpdir(), `md-to-gdoc-${process.pid}.md`);
      fs.writeFileSync(src, blocksToMarkdown(parseMarkdown(markdown, { cutAt: values['cut-at'] })));
    }
    const meta = { name: title, mimeType: 'application/vnd.google-apps.document' };
    if (values.folder) meta.parents = [values.folder];
    const created = gws(['drive', 'files', 'create'], { params: { supportsAllDrives: true, fields: 'id' }, json: meta, upload: src, uploadContentType: 'text/markdown' });
    id = created.id;
    if (src !== input) fs.unlinkSync(src);
    console.log(`created via Drive import: ${id}`);
  }
  console.log(docUrl(id));
});
