// Drive comments on a document.

const { gws } = require('./gws');

function listComments(fileId, { all = false } = {}) {
  const res = gws(['drive', 'comments', 'list'], {
    params: { fileId, includeDeleted: false, pageSize: 100, fields: 'comments(id,content,resolved,deleted,anchor,quotedFileContent/value,author/displayName,replies(content,author/displayName))' },
  });
  return ((res && res.comments) || [])
    .filter(c => all || (!c.resolved && !c.deleted))
    .map(c => ({
      id: c.id, content: c.content, resolved: !!c.resolved, deleted: !!c.deleted,
      author: c.author && c.author.displayName, quote: c.quotedFileContent && c.quotedFileContent.value,
      anchored: !!c.anchor, quotedFileContent: c.quotedFileContent,
      replies: (c.replies || []).map(r => ({ content: r.content, author: r.author && r.author.displayName })),
    }));
}

module.exports = { listComments };
