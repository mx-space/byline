#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
image="${BYLINE_IMAGE:-byline:latest}"

docker build -t "$image" "$@" "$root"
