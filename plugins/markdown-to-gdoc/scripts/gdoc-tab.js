#!/usr/bin/env node
// Tab operations.
// Usage:
//   gdoc-tab.js DOC_ID list
//   gdoc-tab.js DOC_ID create --title "Název" [--emoji 📝] [--parent TAB_ID] [--index N]
//   gdoc-tab.js DOC_ID update TAB_ID [--title "Nový"] [--emoji 📌] [--parent TAB_ID] [--index N]
//   gdoc-tab.js DOC_ID delete TAB_ID
const { run, args, docUrl } = require('./lib/cli');
const tabs = require('./lib/tabs');

run(() => {
  const { values, positionals } = args({
    title: { type: 'string' }, emoji: { type: 'string' }, parent: { type: 'string' }, index: { type: 'string' },
  });
  const [documentId, cmd, tabId] = positionals;
  if (!documentId || !cmd) throw new Error('usage: gdoc-tab.js DOC_ID list|create|update|delete ...');
  const props = {};
  if (values.title !== undefined) props.title = values.title;
  if (values.emoji !== undefined) props.iconEmoji = values.emoji;
  if (values.parent !== undefined) props.parentTabId = values.parent;
  if (values.index !== undefined) props.index = Number(values.index);

  switch (cmd) {
    case 'list':
      for (const t of tabs.listTabs(documentId)) {
        console.log(`${'  '.repeat(t.nestingLevel)}${t.iconEmoji ? t.iconEmoji + ' ' : ''}${t.title}\t${t.tabId}\t${docUrl(documentId, t.tabId)}`);
      }
      return;
    case 'create': {
      if (!props.title) throw new Error('create needs --title');
      const id = tabs.createTab(documentId, props);
      console.log(`created ${id}\t${docUrl(documentId, id)}`);
      return;
    }
    case 'update':
      if (!tabId) throw new Error('update needs TAB_ID');
      tabs.updateTab(documentId, tabId, props);
      console.log(`updated ${tabId}`);
      return;
    case 'delete':
      if (!tabId) throw new Error('delete needs TAB_ID');
      tabs.deleteTab(documentId, tabId);
      console.log(`deleted ${tabId}`);
      return;
    default:
      throw new Error(`unknown command ${cmd}`);
  }
});
