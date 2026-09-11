// Block-level diff between a document tab and a markdown file, plus the
// comments a rewrite would detach.

const { normalizeBlocks } = require('./doc-model');

function blockText(b) {
  if (b.runs) return b.runs.map(r => r.text).join('');
  if (b.type === 'code_block') return b.text;
  if (b.type === 'table') return b.rows.map(r => r.map(c => c.map(x => x.text).join('')).join(' | ')).join('\n');
  if (b.type === 'image') return b.url || '';
  return '';
}

// Checkbox state is not readable from documents created outside this tool; ignore it.
const keyOf = (b) => { const { checked, ...rest } = normalizeBlocks([b])[0]; return JSON.stringify(rest); };

// Longest common subsequence over block keys -> list of removed/added blocks.
function diffBlocks(docBlocks, mdBlocks) {
  const a = docBlocks.map(keyOf);
  const b = mdBlocks.map(keyOf);
  const n = a.length, m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const changes = [];
  let i = 0, j = 0;
  while (i < n || j < m) {
    if (i < n && j < m && a[i] === b[j]) { i++; j++; continue; }
    if (i < n && (j >= m || lcs[i + 1][j] >= lcs[i][j + 1])) {
      const blk = docBlocks[i];
      changes.push({ kind: 'removed', type: blk.type, text: blockText(blk), docIndex: i, startIndex: blk.startIndex, endIndex: blk.endIndex });
      i++;
    } else {
      const blk = mdBlocks[j];
      changes.push({ kind: 'added', type: blk.type, text: blockText(blk), mdIndex: j, afterDocIndex: i - 1 });
      j++;
    }
  }
  return { same: changes.length === 0, changes, docCount: n, mdCount: m };
}

// comments: Drive API comment resources. Returns open comments with a status:
//   loses-anchor  quoted text lives in a block the diff removes
//   kept          quoted text is outside changed blocks
//   unanchored    comment has no quoted text (already detached or document-level)
function affectedComments(comments, diff) {
  const removedText = diff.changes.filter(c => c.kind === 'removed').map(c => c.text).join('\n');
  return (comments || []).filter(c => !c.resolved && !c.deleted).map(c => {
    const quote = c.quotedFileContent && c.quotedFileContent.value;
    let status = 'unanchored';
    if (quote) status = removedText.includes(quote) ? 'loses-anchor' : 'kept';
    return { id: c.id, author: c.author && c.author.displayName, content: c.content, quote: quote || null, status };
  });
}

module.exports = { diffBlocks, affectedComments, blockText };
