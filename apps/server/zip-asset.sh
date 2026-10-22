#!/bin/sh
set -e
# Copy server/out to $root/out
cp -r ./apps/server/out ./out

# Copy server ecosystem.config.cjs to $root/out
cp ./apps/server/ecosystem.config.cjs out

# Build the admin SPA locally and place it under out/admin.
# The layout contract is: index.html sits at the root of the admin asset dir
# (out/admin/index.html, out/admin/assets/..., out/admin/js/...), NOT under a dist/ subdir.
pnpm --filter @mx-space/byline-admin run build
rm -rf out/admin
mkdir -p out/admin
cp -R ./apps/admin/dist/. out/admin/
# Stamp the built-in admin version so the runtime can compare it against
# runtime-downloaded copies (mirrors the updater's `version` file).
node -p "require('./apps/admin/package.json').version" > out/admin/version

cd out
zip -r ../release.zip ./*

rm -rf out
