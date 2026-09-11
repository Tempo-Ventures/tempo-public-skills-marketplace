// Google Docs JSON (documents.get) -> block model, plus tab helpers.
// Blocks additionally carry startIndex/endIndex so callers can target edits.

const { LINE_SEP, CHECK } = require('./requests');

const MONO_RE = /mono|courier|consolas|menlo/i;
const PUA_RE = /[\uE000-\uF8FF]/g;

function runsFromElements(elements) {
  const runs = [];
  for (const el of elements) {
    if (!el.textRun) continue;
    // Docs marks building blocks (code block, hr) with private-use chars; they carry no content
    const text = el.textRun.content.replace(/\n$/, '').replace(PUA_RE, '');
    if (!text) continue;
    const s = el.textRun.textStyle || {};
    const run = { text };
    if (s.bold) run.bold = true;
    if (s.italic) run.italic = true;
    if (s.weightedFontFamily && MONO_RE.test(s.weightedFontFamily.fontFamily)) run.code = true;
    if (s.link && s.link.url) run.link = s.link.url;
    runs.push(run);
  }
  return runs;
}

function sameStyle(a, b) {
  return !!a.bold === !!b.bold && !!a.italic === !!b.italic && !!a.code === !!b.code && (a.link || null) === (b.link || null);
}

function mergeRuns(runs) {
  const out = [];
  for (const r of runs) {
    const last = out[out.length - 1];
    if (last && sameStyle(last, r)) last.text += r.text;
    else out.push({ ...r });
  }
  return out;
}

function isOrdered(lists, bullet) {
  const list = lists && lists[bullet.listId];
  if (!list) return false;
  const lvl = (list.listProperties.nestingLevels || [])[bullet.nestingLevel || 0] || {};
  return !!lvl.glyphType && lvl.glyphType !== 'GLYPH_TYPE_UNSPECIFIED';
}

function paragraphBlock(el, ctx) {
  const p = el.paragraph;
  const style = p.paragraphStyle || {};
  const img = p.elements.find(e => e.inlineObjectElement);
  if (img) {
    const obj = ctx.inlineObjects && ctx.inlineObjects[img.inlineObjectElement.inlineObjectId];
    const props = obj && obj.inlineObjectProperties.embeddedObject;
    const url = props && props.imageProperties && (props.imageProperties.sourceUri || props.imageProperties.contentUri);
    return { type: 'image', url: url || null, alt: (props && props.description) || '' };
  }
  if (p.elements.some(e => e.horizontalRule)) return null;
  const runs = runsFromElements(p.elements);
  const named = style.namedStyleType || 'NORMAL_TEXT';
  if (p.bullet) {
    const b = { type: 'list_item', depth: p.bullet.nestingLevel || 0, ordered: isOrdered(ctx.lists, p.bullet), listGroup: p.bullet.listId, runs };
    const first = runs[0];
    for (const [checked, prefix] of Object.entries(CHECK)) {
      if (first && first.text.startsWith(prefix)) {
        b.checked = checked === 'true';
        first.text = first.text.slice(prefix.length);
        if (!first.text) runs.shift();
      }
    }
    return b;
  }
  const m = named.match(/^HEADING_(\d)$/);
  if (m) return { type: 'heading', level: Number(m[1]), runs };
  if (named === 'TITLE') return { type: 'heading', level: 1, runs };
  if (named === 'SUBTITLE') return { type: 'heading', level: 2, runs };
  const allCode = runs.length > 0 && runs.every(r => r.code);
  if (style.shading || allCode) {
    return { type: 'code_block', text: runs.map(r => r.text).join('').split(LINE_SEP).join('\n') };
  }
  if (!runs.length) return null;
  const b = { type: 'paragraph', runs };
  if (style.indentStart && style.indentStart.magnitude >= 30) b.quote = true;
  return b;
}

function tableBlock(el) {
  const rows = el.table.tableRows.map(row => row.tableCells.map(cell => {
    const runs = [];
    cell.content.forEach((c, i) => {
      if (!c.paragraph) return;
      if (i > 0 && runs.length) runs.push({ text: ' ' });
      runs.push(...runsFromElements(c.paragraph.elements));
    });
    return mergeRuns(runs);
  }));
  return { type: 'table', rows };
}

// body: a Body (doc.body or tab.documentTab.body); ctx: object holding lists/inlineObjects
function docToBlocks(body, ctx = {}) {
  const blocks = [];
  for (const el of body.content || []) {
    let block = null;
    if (el.paragraph) block = paragraphBlock(el, ctx);
    else if (el.table) block = tableBlock(el);
    if (!block) continue;
    if (block.runs) block.runs = mergeRuns(block.runs);
    block.startIndex = el.startIndex;
    block.endIndex = el.endIndex;
    const prev = blocks[blocks.length - 1];
    if (block.type === 'code_block' && prev && prev.type === 'code_block' && prev.endIndex === block.startIndex) {
      prev.text += '\n' + block.text;
      prev.endIndex = block.endIndex;
      continue;
    }
    blocks.push(block);
  }
  return blocks;
}

function listTabs(doc) {
  const out = [];
  const walk = (tabs) => {
    for (const t of tabs || []) {
      const p = t.tabProperties;
      out.push({ tabId: p.tabId, title: p.title, iconEmoji: p.iconEmoji, index: p.index, parentTabId: p.parentTabId, nestingLevel: p.nestingLevel || 0 });
      walk(t.childTabs);
    }
  };
  walk(doc.tabs);
  return out;
}

function findTab(doc, tabId) {
  const walk = (tabs) => {
    for (const t of tabs || []) {
      if (t.tabProperties.tabId === tabId) return t;
      const c = walk(t.childTabs);
      if (c) return c;
    }
    return null;
  };
  return walk(doc.tabs);
}

// Returns { body, lists, inlineObjects } for a tab, or the root document when tabId is omitted.
function tabContext(doc, tabId) {
  if (!tabId) {
    if (doc.body) return { body: doc.body, lists: doc.lists, inlineObjects: doc.inlineObjects };
    const first = (doc.tabs || [])[0];
    return first ? first.documentTab : null;
  }
  const t = findTab(doc, tabId);
  return t ? t.documentTab : null;
}

function tabBody(doc, tabId) {
  const c = tabContext(doc, tabId);
  return c ? c.body : null;
}

// Comparable form: no positions, adjacent same-style runs merged, header row
// bold dropped (the generator always bolds it, markdown never marks it).
function normalizeBlocks(blocks) {
  return blocks.map(b => {
    const { startIndex, endIndex, listGroup, ...rest } = b;
    if (rest.runs) rest.runs = mergeRuns(rest.runs).filter(r => r.text);
    if (rest.rows) {
      rest.rows = rest.rows.map((row, r) => row.map(cell => {
        const runs = r === 0 ? cell.map(({ bold, ...x }) => x) : cell;
        return mergeRuns(runs).filter(x => x.text);
      }));
    }
    return rest;
  });
}

module.exports = { docToBlocks, listTabs, findTab, tabContext, tabBody, normalizeBlocks, mergeRuns };
