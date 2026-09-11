#!/usr/bin/env node
// Lists comments on a document (open by default).
// Usage: gdoc-comments.js DOC_ID [--all]
const { run, args } = require('./lib/cli');
const { listComments } = require('./lib/comments');

run(() => {
  const { values, positionals } = args({ all: { type: 'boolean' } });
  const [documentId] = positionals;
  if (!documentId) throw new Error('usage: gdoc-comments.js DOC_ID [--all]');
  const comments = listComments(documentId, { all: values.all });
  if (!comments.length) { console.log('no comments'); return; }
  for (const c of comments) {
    const flags = [c.resolved ? 'resolved' : 'open', c.deleted ? 'deleted' : null].filter(Boolean).join(',');
    console.log(`${c.id}\t${flags}\t${c.author}\t"${c.quote || ''}"\t${c.content.replace(/\n/g, ' ')}`);
    for (const r of c.replies) console.log(`\t↳ ${r.author}: ${r.content.replace(/\n/g, ' ')}`);
  }
});
