---
name: markdown-to-gdoc
description: Use when creating or updating a Google Doc from markdown via gws CLI, including documents with tabs and documents based on a template, reading a doc or tab back as markdown, comparing a doc with a markdown source before overwriting, or making targeted batchUpdate edits. Triggers on "vytvoř google doc", "aktualizuj dokument", "zapiš do tabu", "přepiš tab", "markdown to google docs", "push to gdoc", "gdoc".
---

# Markdown to Google Doc

All commands go through one wrapper that finds node and installs its single dependency on first use:

```bash
G="${CLAUDE_PLUGIN_ROOT}/scripts/gdoc.sh"
```

It calls `gws` (Google Workspace CLI) with the `documents` and `drive` scopes.

## Pick the workflow

| Situation | Command |
|---|---|
| New plain document (no template, no tabs) | `$G create doc.md --title "…" --folder FOLDER_ID` |
| New document from a template (styles, header, tabs) | `$G create doc.md --template TEMPLATE_ID --tab-title "…" --folder FOLDER_ID` |
| Rewrite a tab or a whole doc from an updated `.md` | `$G diff` → resolve differences → `$G write --replace` |
| Add content at the end of a tab | `$G write doc.md --doc ID --tab-title "…" --append` |
| Small text change, formatting untouched | `batchUpdate` with `replaceAllText` (below) |
| Change one section that has formatting | `$G outline --markdown` → edit the `.md` → `$G write --replace` |
| List, create, rename, nest, delete tabs | `$G tab ID list\|create\|update\|delete` |
| See what is in a doc, with indices | `$G outline ID [--tab-title "…"]` |
| Comments on the doc | `$G comments ID [--all]` |

Every write command prints the document URL (with `?tab=`) — put it in the report together with the mode, the number of blocks written, skipped images and comments that lost their anchor.

## Rules

- **Never `gws drive files update --upload` on a document that has tabs or comes from a template.** Drive upload replaces the whole file: named styles, margins, header/footer and every tab but the first are gone. Use `$G write`.
- **Run `$G diff` before `--replace`.** Blocks marked `-` exist only in the document: someone edited it after the last push. Merge them into the `.md` or ask; do not overwrite silently. Exit code 0 = identical, 2 = differences.
- `$G write` needs an explicit `--replace` or `--append`. Say which one you used.
- Target tabs by `--tab-title` (exact) or `--tab TAB_ID`. Without either, the first tab is used. Unknown title fails and lists the tabs.
- Drive-imported docs put `# H1` into `HEADING_1`, not `TITLE`; the batchUpdate engine does the same, so both engines give the same structure.

## Commands

### create

```
$G create input.md [--title "…"] [--folder FOLDER_ID] [--cut-at "## Heading"]
$G create input.md --template DOC_ID [--tab-title "…"] [--no-spacing] [--title "…"] [--folder FOLDER_ID]
```

Without `--template`: Drive import (`text/markdown` → Google Doc). Google renders everything, including its code-block building block; no tabs, default styles. Title defaults to the first H1, then the file name.
With `--template`: `files copy` of the template, then the content of one tab is replaced through batchUpdate. Named styles, margins, header/footer and the other tabs survive. `--no-spacing` when the template defines paragraph spacing itself.

### write

```
$G write input.md --doc DOC_ID (--replace | --append) [--tab TAB_ID | --tab-title "…"] [--cut-at "## Heading"] [--no-spacing] [--dry-run] [--requests out.json]
```

`--replace` deletes the tab content (1 … end-1) and writes the markdown; `--append` terminates the last paragraph and writes after it. `--dry-run` builds the requests without sending (`--requests` saves them). Before a replace the script lists open anchored comments — they end up under "All comments → Original content deleted", not lost. Images Google cannot fetch are skipped and reported; the rest of the document is written.

### diff

```
$G diff DOC_ID input.md [--tab TAB_ID | --tab-title "…"] [--cut-at "## Heading"]
```

Block-level diff (headings, paragraphs, list items, tables, code, images). `-` lines carry document indices, `+` lines the markdown block number. Then every open comment with its status: `loses-anchor` (its quoted text sits in a block the rewrite removes), `kept`, `unanchored`.

### outline

```
$G outline DOC_ID [--tab TAB_ID | --tab-title "…"] [--markdown | --json]
```

Default: tab list (active tab marked `*`) and one line per block: `[start-end] type: text`. `--markdown` prints the tab as markdown (edit it, then `$G write --replace` — this is the safe way to change one section). `--json` dumps the block model with indices.

Whole document including all tabs as markdown: `gws drive files export --params '{"fileId":"ID","mimeType":"text/markdown"}' -o doc.md` (run in the target directory; `-o` must stay inside cwd). Each tab starts with `# **emoji Title**`.

### tab

```
$G tab DOC_ID list
$G tab DOC_ID create --title "Zápis" [--emoji 📝] [--parent TAB_ID] [--index N]
$G tab DOC_ID update TAB_ID [--title "…"] [--emoji …] [--parent TAB_ID] [--index N]
$G tab DOC_ID delete TAB_ID
```

A new tab is empty; write into it with `$G write --tab TAB_ID --replace`.

### Targeted edits with batchUpdate

Plain text substitution keeps comments anchored even on the replaced text:

```bash
gws docs documents batchUpdate --params '{"documentId":"ID"}' --json '{"requests":[
  {"replaceAllText":{"containsText":{"text":"starý text","matchCase":true},"replaceText":"nový text"}}]}'
```

Index-based edits (`deleteContentRange`, `insertText`, `updateParagraphStyle`, …): take indices from `$G outline`, add `"tabId"` to every `range`/`location` when the doc has more than one tab, and order the requests from the end of the document to the start so earlier indices stay valid. After `deleteContentRange` + `insertText` into a paragraph, re-apply its `namedStyleType` — the inserted text inherits whatever the paragraph became. For anything larger than a sentence, prefer the markdown round-trip (`--markdown` → edit → `--replace`).

Index model: positions are UTF-16 code units; every paragraph ends with `\n`; the segment always ends with one empty paragraph; a table inserted at `P` puts `\n` at `P` and the table at `P+1`, cell `[r][c]` text starts at `P+4 + r*(2C+1) + 2c`; an empty R×C table spans `2 + R*(1+2C)`; `createParagraphBullets` strips the leading tabs used for nesting and shifts everything after it.

## Comments

`replaceAllText` keeps them anchored. Deleting the anchored range (by `--replace`, `deleteContentRange` or Drive upload) does not delete the comment: it moves to "All comments → Original content deleted" and `gws drive comments list` still returns it with `quotedFileContent`. Re-anchoring through the API is not possible. So: diff first, `replaceAllText` for small changes, and report the comments listed as `loses-anchor`.

## Markdown support (batchUpdate engine)

| Markdown | Google Docs |
|---|---|
| `#` … `######` | HEADING_1 … HEADING_6 |
| `**b**`, `__b__`, `*i*`, `_i_`, `***bi***` | bold / italic |
| `` `code` `` | Roboto Mono |
| `[text](url)` | link |
| `- `, `* `, `1. `, nested by indentation | bullets / numbering with nesting; a new list restarts numbering |
| `- [ ]`, `- [x]` | bullet with ☐ / ☑ |
| tables with inline formatting | table, header row bold |
| ` ``` ` fenced code | one shaded paragraph, mono, lines kept |
| `> quote` | indented paragraph |
| `![alt](https://…)` | inline image (public URL only) |
| soft-wrapped lines | one paragraph |
| `---` | skipped |

## Tests

```bash
$G test           # offline: parser, generator, doc model, diff
$G test --live    # against the real API; creates and deletes md-to-gdoc-test-* docs in Drive root
```

Run the live suite after touching `lib/requests.js` or `lib/doc-model.js`.
