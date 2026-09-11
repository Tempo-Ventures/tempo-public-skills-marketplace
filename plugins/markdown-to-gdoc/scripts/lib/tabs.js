// Tab operations over documents.batchUpdate.

const { getDocument, batchUpdate } = require('./gws');
const model = require('./doc-model');

function listTabs(documentId) {
  return model.listTabs(getDocument(documentId));
}

// Resolves a tab by id or exact title. Throws with the available tabs listed.
function resolveTab(doc, { tabId, tabTitle } = {}) {
  const all = model.listTabs(doc);
  if (!tabId && !tabTitle) return all[0] || null;
  const hit = all.find(t => (tabId && t.tabId === tabId) || (tabTitle && t.title === tabTitle));
  if (!hit) {
    const names = all.map(t => `${t.title} (${t.tabId})`).join(', ');
    throw new Error(`Tab ${tabId || JSON.stringify(tabTitle)} not found. Available: ${names}`);
  }
  return hit;
}

function createTab(documentId, { title, iconEmoji, parentTabId, index } = {}) {
  const tabProperties = {};
  if (title) tabProperties.title = title;
  if (iconEmoji) tabProperties.iconEmoji = iconEmoji;
  if (parentTabId) tabProperties.parentTabId = parentTabId;
  if (index !== undefined) tabProperties.index = index;
  const [reply] = batchUpdate(documentId, [{ addDocumentTab: { tabProperties } }]);
  return reply.addDocumentTab.tabProperties.tabId;
}

function updateTab(documentId, tabId, { title, iconEmoji, parentTabId, index } = {}) {
  const tabProperties = { tabId };
  const fields = [];
  if (title !== undefined) { tabProperties.title = title; fields.push('title'); }
  if (iconEmoji !== undefined) { tabProperties.iconEmoji = iconEmoji; fields.push('iconEmoji'); }
  if (parentTabId !== undefined) { tabProperties.parentTabId = parentTabId; fields.push('parentTabId'); }
  if (index !== undefined) { tabProperties.index = index; fields.push('index'); }
  if (!fields.length) throw new Error('updateTab: nothing to change');
  batchUpdate(documentId, [{ updateDocumentTabProperties: { tabProperties, fields: fields.join(',') } }]);
}

function deleteTab(documentId, tabId) {
  batchUpdate(documentId, [{ deleteTab: { tabId } }]);
}

module.exports = { listTabs, resolveTab, createTab, updateTab, deleteTab };
