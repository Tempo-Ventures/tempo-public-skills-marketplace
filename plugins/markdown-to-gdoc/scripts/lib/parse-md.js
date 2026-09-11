// Markdown -> block model. Blocks are the only thing the request generator
// understands, so everything markdown-specific stays in this file.
//
// Block shapes:
//   { type: 'heading', level, runs }
//   { type: 'paragraph', runs, quote? }
//   { type: 'list_item', depth, ordered, listGroup, checked?, runs }
//   { type: 'code_block', text }
//   { type: 'table', rows: [[runs, ...], ...] }   // rows[0] is the header row
//   { type: 'image', url, alt }
// A run is { text, bold?, italic?, code?, link? }.

const MarkdownIt = require('markdown-it');

const md = new MarkdownIt({ html: false, linkify: false });

function cutContent(content, cutAt) {
  if (!cutAt) return content;
  const re = new RegExp('^' + cutAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'm');
  const m = content.match(re);
  return m ? content.slice(0, m.index) : content;
}

function inlineRuns(children) {
  const runs = [];
  const style = { bold: 0, italic: 0, link: null };
  const push = (text) => {
    if (!text) return;
    const run = { text };
    if (style.bold) run.bold = true;
    if (style.italic) run.italic = true;
    if (style.link) run.link = style.link;
    runs.push(run);
  };
  for (const t of children) {
    switch (t.type) {
      case 'text': push(t.content); break;
      case 'softbreak': push(' '); break;
      case 'hardbreak': push(' '); break;
      case 'strong_open': style.bold++; break;
      case 'strong_close': style.bold--; break;
      case 'em_open': style.italic++; break;
      case 'em_close': style.italic--; break;
      case 'link_open': style.link = t.attrGet('href'); break;
      case 'link_close': style.link = null; break;
      case 'code_inline': {
        const run = { text: t.content, code: true };
        if (style.link) run.link = style.link;
        runs.push(run);
        break;
      }
      case 'image': push(t.content); break;
      default: if (t.content) push(t.content);
    }
  }
  return runs;
}

function parseMarkdown(content, { cutAt } = {}) {
  const tokens = md.parse(cutContent(content, cutAt), {});
  const blocks = [];
  const listStack = [];
  let listGroupSeq = 0;
  let quoteDepth = 0;
  let table = null;
  let row = null;
  let pendingItem = null; // list_item_open seen, waiting for its first paragraph

  for (const t of tokens) {
    switch (t.type) {
      case 'heading_open':
        blocks.push({ type: 'heading', level: Number(t.tag.slice(1)), runs: [] });
        break;
      case 'paragraph_open':
        if (pendingItem) {
          blocks.push(pendingItem);
          pendingItem = null;
        } else if (!table) {
          const b = { type: 'paragraph', runs: [] };
          if (quoteDepth) b.quote = true;
          blocks.push(b);
        }
        break;
      case 'inline': {
        if (row) { row.push(inlineRuns(t.children)); break; }
        const target = blocks[blocks.length - 1];
        if (!target) break;
        const runs = inlineRuns(t.children);
        // Paragraph made of a single image -> image block
        if (target.type === 'paragraph' && t.children.length === 1 && t.children[0].type === 'image') {
          blocks[blocks.length - 1] = { type: 'image', url: t.children[0].attrGet('src'), alt: t.children[0].content };
          break;
        }
        if (target.type === 'list_item' && runs.length && /^\[( |x|X)\] /.test(runs[0].text)) {
          target.checked = runs[0].text[1] !== ' ';
          runs[0].text = runs[0].text.slice(4);
        }
        target.runs = runs;
        break;
      }
      case 'bullet_list_open':
      case 'ordered_list_open':
        listStack.push({
          ordered: t.type === 'ordered_list_open',
          group: listStack.length ? listStack[0].group : ++listGroupSeq,
        });
        break;
      case 'bullet_list_close':
      case 'ordered_list_close':
        listStack.pop();
        break;
      case 'list_item_open': {
        const top = listStack[listStack.length - 1];
        pendingItem = { type: 'list_item', depth: listStack.length - 1, ordered: top.ordered, listGroup: top.group, runs: [] };
        break;
      }
      case 'list_item_close':
        if (pendingItem) { blocks.push(pendingItem); pendingItem = null; }
        break;
      case 'fence':
      case 'code_block':
        blocks.push({ type: 'code_block', text: t.content.replace(/\n$/, '') });
        break;
      case 'blockquote_open': quoteDepth++; break;
      case 'blockquote_close': quoteDepth--; break;
      case 'table_open': table = { type: 'table', rows: [] }; break;
      case 'table_close': blocks.push(table); table = null; break;
      case 'tr_open': row = []; break;
      case 'tr_close': table.rows.push(row); row = null; break;
      default: break; // hr, thead/tbody/th/td open/close, *_close
    }
  }
  return blocks;
}

module.exports = { parseMarkdown };
