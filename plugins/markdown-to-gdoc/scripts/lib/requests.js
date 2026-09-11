// Block model -> Google Docs batchUpdate requests.
//
// Index model (all indices are UTF-16 code units, like JS string length):
//   - Every paragraph ends with "\n"; the segment always keeps one trailing "\n".
//   - insertTable at P puts "\n" at P and the table at P+1. Cell [r][c]
//     paragraph starts at P+4 + r*(2C+1) + 2c. An empty R x C table plus its
//     leading "\n" spans 1 + 2 + R*(1+2C) indices.
//   - createParagraphBullets removes the leading tabs used for nesting, which
//     shifts everything after the list. It therefore runs last, in reverse.
//
// Request order:
//   1. one insertText with all non-table text (block before a table has no
//      "\n"; the table insert supplies it)
//   2. tables in reverse document order, cells filled in reverse
//   3. paragraph + text styles in final coordinates (tables accounted for)
//   4. createParagraphBullets per list group, last group first

const HEADING = { 1: 'HEADING_1', 2: 'HEADING_2', 3: 'HEADING_3', 4: 'HEADING_4', 5: 'HEADING_5', 6: 'HEADING_6' };
const MONO = { weightedFontFamily: { fontFamily: 'Roboto Mono', weight: 400 } };
const CODE_BG = { color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } } };
const LINE_SEP = '\u000b'; // Docs line break inside one paragraph
const CHECK = { false: '☐ ', true: '☑ ' };

const runsText = (runs) => runs.map(r => r.text).join('');
const runsLength = (runs) => runsText(runs).length;

function blockText(block) {
  switch (block.type) {
    case 'heading':
    case 'paragraph': return runsText(block.runs);
    case 'list_item': return '\t'.repeat(block.depth) + (block.checked === undefined ? '' : CHECK[block.checked]) + runsText(block.runs);
    case 'code_block': return block.text.split('\n').join(LINE_SEP);
    case 'image': return '';
    default: return '';
  }
}

function tableSpan(table) {
  const R = table.rows.length;
  const C = Math.max(...table.rows.map(r => r.length));
  const text = table.rows.reduce((n, row) => n + row.reduce((m, cell) => m + runsLength(cell), 0), 0);
  return 1 + 2 + R * (1 + 2 * C) + text;
}

function textStyleRequests(runs, start, rng) {
  const out = [];
  let pos = start;
  for (const r of runs) {
    const end = pos + r.text.length;
    if (r.text.length) {
      const style = {};
      const fields = [];
      if (r.bold) { style.bold = true; fields.push('bold'); }
      if (r.italic) { style.italic = true; fields.push('italic'); }
      if (r.code) { Object.assign(style, MONO); fields.push('weightedFontFamily'); }
      if (r.link) { style.link = { url: r.link }; fields.push('link'); }
      if (fields.length) out.push({ updateTextStyle: { range: rng(pos, end), textStyle: style, fields: fields.join(',') } });
    }
    pos = end;
  }
  return out;
}

function generateRequests(blocks, { index = 1, tabId = null, atEnd = false, spacing = true } = {}) {
  const loc = (i) => tabId ? { index: i, tabId } : { index: i };
  const rng = (s, e) => tabId ? { startIndex: s, endIndex: e, tabId } : { startIndex: s, endIndex: e };

  // 1. Lay out text-only coordinates
  let text = '';
  const placed = []; // { block, start, len, terminated } in text-only coords (relative to `index`)
  const tables = []; // { block, pos } text-only coords
  const images = []; // { block, pos } text-only coords (pos = start of its own empty paragraph)
  const lastTextIdx = blocks.reduce((last, b, i) => (b.type === 'table' ? last : i), -1);
  blocks.forEach((block, i) => {
    if (block.type === 'table') { tables.push({ block, pos: text.length }); return; }
    if (block.type === 'image') images.push({ block, pos: text.length });
    const next = blocks[i + 1];
    const beforeTable = next && next.type === 'table';
    const isLast = i === lastTextIdx && !blocks.slice(i + 1).some(b => b.type === 'table');
    const t = blockText(block);
    const newline = beforeTable ? '' : (atEnd && isLast ? '' : '\n');
    placed.push({ block, start: text.length, len: t.length, viaTable: beforeTable });
    text += t + newline;
  });

  const requests = [];
  if (text) {
    requests.push({ insertText: { location: loc(index), text } });
    // Inserted text inherits the style of the paragraph it lands in; wipe it
    // before tables go in (their cells get styled on insert).
    const textEnd = index + text.length + (atEnd ? 1 : 0);
    requests.push({ updateParagraphStyle: { range: rng(index, textEnd), paragraphStyle: { namedStyleType: 'NORMAL_TEXT' }, fields: 'namedStyleType,shading,indentStart,indentFirstLine,indentEnd' } });
    requests.push({ deleteParagraphBullets: { range: rng(index, textEnd) } });
    requests.push({ updateTextStyle: { range: rng(index, textEnd), textStyle: {}, fields: 'bold,italic,link,weightedFontFamily,backgroundColor' } });
  }

  // 2. Tables, reverse order
  for (const { block, pos } of [...tables].reverse()) {
    const R = block.rows.length;
    const C = Math.max(...block.rows.map(r => r.length));
    const P = index + pos;
    requests.push({ insertTable: { rows: R, columns: C, location: loc(P) } });
    for (let r = R - 1; r >= 0; r--) {
      for (let c = C - 1; c >= 0; c--) {
        const runs = block.rows[r][c] || [];
        const cellText = runsText(runs);
        if (!cellText) continue;
        const cellIdx = P + 4 + r * (2 * C + 1) + 2 * c;
        requests.push({ insertText: { location: loc(cellIdx), text: cellText } });
        if (r === 0) requests.push({ updateTextStyle: { range: rng(cellIdx, cellIdx + cellText.length), textStyle: { bold: true }, fields: 'bold' } });
        requests.push(...textStyleRequests(runs, cellIdx, rng));
      }
    }
  }

  // 2b. Images, reverse order (each occupies one index in its own paragraph)
  const tableShift = (pos) => tables.reduce((s, t) => (t.pos <= pos ? s + tableSpan(t.block) : s), 0);
  for (const { block, pos } of [...images].reverse()) {
    requests.push({ insertInlineImage: { uri: block.url, location: loc(index + pos + tableShift(pos)) } });
  }

  // 3. Styles in final coordinates
  const shiftAt = (pos) => tableShift(pos) + images.filter(im => im.pos < pos).length;
  const final = placed.map(p => {
    const start = index + p.start + shiftAt(p.start);
    return { ...p, start, end: start + p.len + 1 }; // +1 = paragraph "\n" (own or table-supplied)
  });
  const lastFinal = final[final.length - 1];
  if (atEnd && lastFinal && !lastFinal.viaTable) lastFinal.end = lastFinal.start + lastFinal.len; // trailing "\n" belongs to the segment

  const endIndex = index + text.length + tables.reduce((s, t) => s + tableSpan(t.block), 0) + images.length;

  for (const p of final) {
    const { block, start, end } = p;
    const paraEnd = Math.max(end, start + 1);
    if (block.type === 'heading') {
      requests.push({ updateParagraphStyle: { range: rng(start, paraEnd), paragraphStyle: { namedStyleType: HEADING[Math.min(block.level, 6)] }, fields: 'namedStyleType' } });
    }
    if (block.type === 'paragraph' && block.quote) {
      requests.push({ updateParagraphStyle: { range: rng(start, paraEnd), paragraphStyle: { indentStart: { magnitude: 36, unit: 'PT' }, indentFirstLine: { magnitude: 36, unit: 'PT' } }, fields: 'indentStart,indentFirstLine' } });
    }
    if (block.type === 'code_block') {
      requests.push({ updateParagraphStyle: { range: rng(start, paraEnd), paragraphStyle: { shading: { backgroundColor: CODE_BG } }, fields: 'shading' } });
      if (p.len) requests.push({ updateTextStyle: { range: rng(start, start + p.len), textStyle: MONO, fields: 'weightedFontFamily' } });
    }
    if (spacing && (block.type === 'paragraph' || block.type === 'code_block' || block.type === 'image')) {
      requests.push({ updateParagraphStyle: { range: rng(start, paraEnd), paragraphStyle: { spaceBelow: { magnitude: 8, unit: 'PT' } }, fields: 'spaceBelow' } });
    }
    if (block.runs) {
      const prefix = block.type === 'list_item' ? blockText(block).length - runsLength(block.runs) : 0;
      requests.push(...textStyleRequests(block.runs, start + prefix, rng));
    }
  }

  // 4. Bullets, last group first
  const groups = [];
  for (const p of final) {
    if (p.block.type !== 'list_item') continue;
    const g = groups[groups.length - 1];
    if (g && g.id === p.block.listGroup) g.end = p.end;
    else groups.push({ id: p.block.listGroup, ordered: p.block.ordered, start: p.start, end: p.end });
  }
  for (const g of groups.reverse()) {
    requests.push({ createParagraphBullets: { range: rng(g.start, g.end), bulletPreset: g.ordered ? 'NUMBERED_DECIMAL_ALPHA_ROMAN' : 'BULLET_DISC_CIRCLE_SQUARE' } });
  }

  return { requests, endIndex };
}

module.exports = { generateRequests, tableSpan, blockText, LINE_SEP, CHECK };
