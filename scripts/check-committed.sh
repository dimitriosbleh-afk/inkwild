#!/usr/bin/env bash
# Runs the typecheck and tests against exactly what is committed, ignoring drafts in the working folder.
# The copy lives inside the project, so Node finds the real node_modules by walking up: no links needed.
set -euo pipefail
root="$(git rev-parse --show-toplevel)"
tmp="$root/.scratch/check-committed"
rm -rf "$tmp"
mkdir -p "$tmp"
git -C "$root" archive HEAD | tar -x -C "$tmp"
status=0
(cd "$tmp" && npx tsc --noEmit && npx vitest run) || status=$?
rm -rf "$tmp"
exit $status
