#!/usr/bin/env bash
# Builds the Byline image. While pnpm-workspace.yaml links the shared
# @mx-space packages from a local mx-core-shared checkout, that checkout is
# staged (without node_modules) and passed as a named build context.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
image="${BYLINE_IMAGE:-byline:latest}"

shared="$(sed -n "s#^ *'@mx-space/[a-z-]*': link:\(.*\)/packages/[a-z-]*\$#\1#p" "$root/pnpm-workspace.yaml" | awk 'NR == 1')"
shared="${MX_CORE_SHARED_DIR:-$shared}"

args=()
if [ -n "$shared" ]; then
  if [ ! -d "$shared/packages" ]; then
    echo "mx-core-shared checkout not found at $shared (set MX_CORE_SHARED_DIR)" >&2
    exit 1
  fi
  stage="$(mktemp -d)"
  trap 'rm -rf "$stage"' EXIT
  rsync -a --exclude node_modules --exclude .git --exclude dist --exclude .turbo \
    "$shared/" "$stage/"
  args+=(--build-context "mx-core-shared=$stage")
fi

docker build "${args[@]}" -t "$image" "$@" "$root"
