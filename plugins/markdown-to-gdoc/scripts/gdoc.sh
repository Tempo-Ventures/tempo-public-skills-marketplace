#!/usr/bin/env bash
# Entry point for the markdown-to-gdoc scripts. Finds node (PATH or nvm),
# installs the one dependency (markdown-it) on first use, then runs the command.
#
# Usage:
#   gdoc.sh create  input.md [--title ...] [--folder ID] [--template ID [--tab-title ...]]
#   gdoc.sh write   input.md --doc ID (--replace|--append) [--tab ID|--tab-title ...]
#   gdoc.sh diff    DOC_ID input.md [--tab ID|--tab-title ...]
#   gdoc.sh outline DOC_ID [--tab ID|--tab-title ...] [--markdown|--json]
#   gdoc.sh tab     DOC_ID list|create|update|delete ...
#   gdoc.sh comments DOC_ID [--all]
#   gdoc.sh test    [--live]
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

NODE="$(command -v node || true)"
if [ -z "$NODE" ]; then
  NODE="$(ls -d "$HOME"/.nvm/versions/node/*/bin/node 2>/dev/null | sort -V | tail -1)"
fi
[ -n "$NODE" ] || { echo "node not found (PATH or ~/.nvm)" >&2; exit 1; }
export PATH="$(dirname "$NODE"):$PATH"   # npm's shebang needs node on PATH
NPM="$(dirname "$NODE")/npm"

if [ ! -d "$DIR/node_modules/markdown-it" ]; then
  echo "installing dependencies into $DIR" >&2
  "$NPM" install --prefix "$DIR" --omit=dev --no-audit --no-fund --loglevel=error
fi

cmd="${1:-}"; shift || true
case "$cmd" in
  create|write|diff|outline|tab|comments) exec "$NODE" "$DIR/gdoc-$cmd.js" "$@" ;;
  test)
    if [ "${1:-}" = "--live" ]; then GDOC_LIVE=1 exec "$NODE" --test "$DIR"/test/*.test.js; fi
    exec "$NODE" --test "$DIR"/test/*.test.js ;;
  *) sed -n '2,13p' "$0" >&2; exit 1 ;;
esac
