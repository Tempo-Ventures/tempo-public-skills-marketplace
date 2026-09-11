// Thin wrapper over the gws CLI. Every call shells out; output is parsed JSON.

const { execFileSync } = require('node:child_process');

const MAX_ARG_BYTES = 700 * 1024; // macOS ARG_MAX is 1 MiB for args + env

function gws(args, { params, json, upload, uploadContentType, output } = {}) {
  const argv = [...args];
  if (params) argv.push('--params', JSON.stringify(params));
  if (json) argv.push('--json', JSON.stringify(json));
  if (upload) argv.push('--upload', upload);
  if (uploadContentType) argv.push('--upload-content-type', uploadContentType);
  if (output) argv.push('--output', output);
  let stdout;
  try {
    stdout = execFileSync('gws', argv, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 256 * 1024 * 1024 });
  } catch (e) {
    const body = (e.stdout || '').toString().trim();
    let msg = body || (e.stderr || '').toString().trim();
    try { const j = JSON.parse(body); msg = j.error ? `${j.error.code || ''} ${j.error.message || ''}`.trim() : body; } catch (_) { /* keep raw */ }
    throw new Error(`gws ${args.join(' ')} failed: ${msg}`);
  }
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch (_) { return trimmed; }
}

const getDocument = (documentId, { includeTabsContent = true } = {}) =>
  gws(['docs', 'documents', 'get'], { params: { documentId, includeTabsContent } });

// Splits requests into consecutive chunks that fit into argv; order is preserved,
// so index arithmetic that assumes sequential application stays valid.
function batchUpdate(documentId, requests) {
  const replies = [];
  let chunk = [];
  let size = 0;
  const flush = () => {
    if (!chunk.length) return;
    const res = gws(['docs', 'documents', 'batchUpdate'], { params: { documentId }, json: { requests: chunk } });
    replies.push(...((res && res.replies) || []));
    chunk = []; size = 0;
  };
  for (const r of requests) {
    const len = JSON.stringify(r).length + 1;
    if (size + len > MAX_ARG_BYTES) flush();
    chunk.push(r); size += len;
  }
  flush();
  return replies;
}

// files.delete returns an empty body that gws saves as ./download.html; remove that artefact.
function deleteFile(fileId) {
  const fs = require('node:fs');
  const path = require('node:path');
  gws(['drive', 'files', 'delete'], { params: { fileId, supportsAllDrives: true } });
  const stray = path.join(process.cwd(), 'download.html');
  try { if (fs.statSync(stray).size === 0) fs.unlinkSync(stray); } catch (_) { /* nothing to clean */ }
}

module.exports = { gws, getDocument, batchUpdate, deleteFile };
