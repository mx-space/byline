#!/usr/bin/env bash
# The lockfile records `link:` overrides relative to the repo (for example
# ../../../mx-core-shared from apps/server), so the staged checkout is linked
# next to the repo root where those relative links land. A no-op once the
# shared @mx-space packages come from the npm registry.
set -euo pipefail

staged="${1:?usage: link-shared-packages.sh <staged mx-core-shared dir>}"
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
workspace="$repo_root/pnpm-workspace.yaml"

link_root="$(sed -n "s#^ *'@mx-space/[a-z-]*': link:\(.*\)/packages/[a-z-]*\$#\1#p" "$workspace" | awk 'NR == 1')"

if [ -z "$link_root" ]; then
  echo "[shared] no link: overrides, using registry packages"
  exit 0
fi

if [ ! -d "$staged/packages" ]; then
  echo "[shared] pnpm-workspace.yaml links $link_root but no mx-core-shared build context was given." >&2
  echo "[shared] Build with scripts/docker-build.sh, or pass --build-context mx-core-shared=<path>." >&2
  exit 1
fi

sibling="$(dirname "$repo_root")/$(basename "$link_root")"
ln -sfn "$staged" "$sibling"

packages=()
while IFS= read -r name; do
  packages+=(--filter "$name")
done < <(sed -n "s#^ *'\(@mx-space/[a-z-]*\)': link:.*#\1#p" "$workspace")

echo "[shared] linked $sibling -> $staged; installing ${packages[*]}"
(cd "$staged" && pnpm install --ignore-scripts "${packages[@]}")
