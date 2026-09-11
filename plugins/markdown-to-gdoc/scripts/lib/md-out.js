// Block model -> markdown. Inverse of parse-md for everything the model carries.

function escapeText(text) {
  return text.replace(/([\\`*_[\]<>])/g, '\\$1');
}

function runsToMd(runs) {
  return runs.map(r => {
    let t = r.code ? '`' + r.text + '`' : escapeText(r.text);
    if (r.bold && r.italic) t = '***' + t + '***';
    else if (r.bold) t = '**' + t + '**';
    else if (r.italic) t = '*' + t + '*';
    if (r.link) t = '[' + t + '](' + r.link + ')';
    return t;
  }).join('');
}

const cellToMd = (runs) => runsToMd(runs).replace(/\|/g, '\\|');

function blocksToMarkdown(blocks) {
  const chunks = []; // { text, list: bool }
  let prevGroup = null;
  let bulletToggle = 0;   // alternate "-" / "*" so adjacent bullet lists stay separate
  let orderedToggle = 0;  // alternate "1." / "1)" for adjacent ordered lists
  let counters = [];
  let indents = []; // indent string for items at each depth (children sit under the parent's content)
  blocks.forEach((b, i) => {
    const last = chunks[chunks.length - 1];
    switch (b.type) {
      case 'heading':
        chunks.push({ text: '#'.repeat(b.level) + ' ' + runsToMd(b.runs) });
        break;
      case 'paragraph':
        chunks.push({ text: (b.quote ? '> ' : '') + runsToMd(b.runs) });
        break;
      case 'list_item': {
        const prevBlock = blocks[i - 1];
        if (b.listGroup !== prevGroup) {
          if (prevBlock && prevBlock.type === 'list_item' && prevBlock.ordered === b.ordered) {
            if (b.ordered) orderedToggle ^= 1; else bulletToggle ^= 1;
          }
          counters = [];
          indents = [];
        }
        prevGroup = b.listGroup;
        counters.length = b.depth + 1;
        counters[b.depth] = (counters[b.depth] || 0) + 1;
        const marker = b.ordered ? `${counters[b.depth]}${orderedToggle ? ')' : '.'}` : (bulletToggle ? '*' : '-');
        const check = b.checked === undefined ? '' : (b.checked ? '[x] ' : '[ ] ');
        const indent = b.depth ? (indents[b.depth - 1] || '') : '';
        indents[b.depth] = indent + ' '.repeat(marker.length + 1);
        const line = indent + marker + ' ' + check + runsToMd(b.runs);
        if (last && last.list) last.text += '\n' + line;
        else chunks.push({ text: line, list: true });
        break;
      }
      case 'code_block':
        chunks.push({ text: '```\n' + b.text + '\n```' });
        break;
      case 'table': {
        const cols = Math.max(...b.rows.map(r => r.length));
        const row = (cells) => '| ' + Array.from({ length: cols }, (_, c) => cellToMd(cells[c] || [])).join(' | ') + ' |';
        const sep = '| ' + Array(cols).fill('---').join(' | ') + ' |';
        chunks.push({ text: [row(b.rows[0]), sep, ...b.rows.slice(1).map(row)].join('\n') });
        break;
      }
      case 'image':
        chunks.push({ text: `![${b.alt || ''}](${b.url || ''})` });
        break;
      default:
        break;
    }
  });
  return chunks.map(c => c.text).join('\n\n') + (chunks.length ? '\n' : '');
}

module.exports = { blocksToMarkdown, runsToMd };
