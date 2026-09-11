// Write markdown into a document tab via batchUpdate (replace or append).

const { parseMarkdown } = require('./parse-md');
const { generateRequests } = require('./requests');
const { getDocument, batchUpdate } = require('./gws');
const { tabContext } = require('./doc-model');
const { resolveTab } = require('./tabs');

// Returns { tabId, mode, deleted, requests, endIndex }. Nothing is sent when dryRun.
function writeMarkdown({ documentId, tabId, tabTitle, markdown, mode, cutAt, dryRun = false, spacing = true }) {
  if (mode !== 'replace' && mode !== 'append') throw new Error("mode must be 'replace' or 'append'");
  const doc = getDocument(documentId);
  const tab = resolveTab(doc, { tabId, tabTitle });
  const resolvedTabId = tab ? tab.tabId : null;
  const ctx = tabContext(doc, resolvedTabId);
  const content = ctx.body.content;
  const segmentEnd = content[content.length - 1].endIndex; // index after the trailing "\n"

  const requests = [];
  let deleted = null;
  let index;
  if (mode === 'replace') {
    if (segmentEnd - 1 > 1) {
      deleted = { startIndex: 1, endIndex: segmentEnd - 1 };
      requests.push({ deleteContentRange: { range: resolvedTabId ? { ...deleted, tabId: resolvedTabId } : deleted } });
    }
    index = 1;
  } else if (segmentEnd - 1 === 1) {
    index = 1; // empty segment
  } else {
    // Terminate the current last paragraph, then write into the fresh trailing one.
    const at = segmentEnd - 1;
    requests.push({ insertText: { location: resolvedTabId ? { index: at, tabId: resolvedTabId } : { index: at }, text: '\n' } });
    index = segmentEnd;
  }

  const blocks = parseMarkdown(markdown, { cutAt });
  const build = (list) => [...requests, ...generateRequests(list, { index, tabId: resolvedTabId, atEnd: true, spacing }).requests];
  let all = build(blocks);
  let used = blocks;
  const skippedImages = [];
  if (!dryRun) {
    try {
      batchUpdate(documentId, all);
    } catch (e) {
      // Google could not fetch an image URL: the whole batch is rejected. Retry without images.
      const images = blocks.filter(b => b.type === 'image');
      if (!images.length || !/image/i.test(e.message)) throw e;
      skippedImages.push(...images.map(b => b.url));
      used = blocks.filter(b => b.type !== 'image');
      all = build(used);
      batchUpdate(documentId, all);
    }
  }
  const endIndex = generateRequests(used, { index, tabId: resolvedTabId, atEnd: true, spacing }).endIndex;
  return { tabId: resolvedTabId, mode, deleted, requests: all, endIndex, blocks: used.length, skippedImages };
}

module.exports = { writeMarkdown };
