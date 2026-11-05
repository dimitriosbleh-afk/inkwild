#!/usr/bin/env bash
# Runs the typecheck and tests against exactly what is committed, ignoring drafts in the working folder.
# node_modules is linked in, then the link is removed with rmdir BEFORE the folder is deleted:
# deleting a folder that still holds the link would follow it and delete the real node_modules.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
tmp="$(mktemp -d)"
git -C "$root" archive HEAD | tar -x -C "$tmp"
cmd //c "mklink /J $(cygpath -w "$tmp")\node_modules $(cygpath -w "$root")\node_modules" > /dev/null
status=0
(cd "$tmp" && npx tsc --noEmit && npx vitest run) || status=$?
cmd //c "rmdir $(cygpath -w "$tmp")\node_modules"
rm -rf "$tmp"
exit $status
