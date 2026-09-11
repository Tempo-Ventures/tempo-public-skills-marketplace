// Shared CLI helpers.

const { parseArgs } = require('node:util');

function run(main) {
  try {
    const code = main();
    process.exit(typeof code === 'number' ? code : 0);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

function args(options, { allowPositionals = true } = {}) {
  return parseArgs({ options, allowPositionals, strict: true });
}

const docUrl = (id, tabId) => `https://docs.google.com/document/d/${id}/edit${tabId ? `?tab=${tabId}` : ''}`;

module.exports = { run, args, docUrl };
