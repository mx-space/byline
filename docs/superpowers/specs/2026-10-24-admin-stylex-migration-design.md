# Admin StyleX migration

Status: draft, 2026-10-24

## Why

The admin was redesigned onto `@lobehub/ui` with `createStaticStyles` (emotion, zero-runtime) and Tailwind removed. Twelve files that came in through a merge conflict still use Tailwind class names, so `/dynamic-components`, the user permissions card and the editor's dynamic-component panel render unstyled. Fixing them is the trigger; the owner decided the whole admin moves to StyleX instead of `createStaticStyles`, the same direction LobeHub took in `lobe-chat`.

## Goals

- Every style in `apps/admin/src` is written with `stylex.create`, reading theme values from `@lobehub/ui/stylex/cssVar.stylex` and breakpoints from `@lobehub/ui/stylex/media.stylex`.
- The 12 Tailwind leftovers are rebuilt in StyleX first and shipped on their own.
- No `createStaticStyles`, `createStyles`, `css`, `keyframes`, `createGlobalStyle` or `injectGlobal` imports from `@lobehub/ui` remain in admin source, and a lint rule keeps it that way.

## Non-goals

- No visual redesign. Migrated pages must look the same as before in light and dark (the 12 Tailwind leftovers are the exception: they get the redesign look of their sibling pages, e.g. Webhooks).
- No change to `@lobehub/ui` components or how they are themed; classes passed to lobe-ui components keep working (lobe-ui CSS sits in `@layer lobe-ui`).
- No server or api-client changes.

## Anti-goals

- A page that type-checks but looks different. Shorthands such as `border`, `background`, `animation` compile to nothing in StyleX without an error, so a silent visual regression is the main risk.
- Half-migrated files. StyleX longhands outrank emotion classes on the same element but shorthands do not, so a file moves completely or not at all.

## Approach

Port LobeHub's migration kit from `~/git/work/lobe-chat` (pinned versions `@stylexjs/stylex`, `@stylexjs/unplugin`, `@stylexjs/eslint-plugin` 0.19.1; Byline already has `@lobehub/ui` 6.7.0, which ships the `.stylex` token modules):

1. **Build** — `apps/admin/vite-plugins/stylex.ts`, adapted from `lobe-chat/plugins/vite/stylex.ts` with its `stylexEntryCss` and `stylexDevCss` helpers: class prefix, `~/*` alias pointing at `apps/admin/src`, the config/configureServer hook removal, and a Vitest variant that inlines the token modules. An entry stylesheet (`src/styles/stylex.css` with the anchor custom property) is imported by the SPA bootstrap so production CSS lands in a boot-time asset.
2. **Helper** — `~/styles/sx` (`stylex.props` plus an outside `className` / `style`), as in lobe-chat. Components callers restyle take `xstyle?: StyleXStyles`.
3. **Tooling** — `apps/admin/scripts/stylex-migration/`: classifier (tiers A–D), codemod for A and B, `legacyFiles.json` allowlist that only shrinks, and the ESLint guard (`no-emotion-styles` plus `@stylexjs/eslint-plugin` valid-styles / no-conflicting-props) wired into the admin ESLint config. A `pnpm -C apps/admin stylex:migration` script mirrors lobe-chat's flags (`--list`, `--codemod --tier --path --dry`, `--prune-legacy`).
4. **Docs** — `.agents/ux/components.md` and `lobe-design-rules.md` switch their styling guidance from `createStaticStyles` + `cssVar` to StyleX, with the shorthand and whole-file rules above.

Current inventory (lobe-chat classifier run on Byline): 135 files — A 52, B 25 (codemod), C 44, D 14 (by hand).

## Decisions

- The owner holds the rights to the lobe-chat kit and approved copying it into this MIT repo. Copied files keep a one-line note naming their lobe-chat origin.
- The 12 Tailwind leftovers are first rebuilt with `createStaticStyles` in the Webhooks look and shipped as an interim fix (v0.2.7), so production stops showing unstyled pages. That version is the visual target and the starting point for phase 1. (Builder's call: reuse it rather than rebuild from the Tailwind code.)

## Phases

| Phase | Scope | Ships as |
| --- | --- | --- |
| interim | The 12 leftovers on `createStaticStyles`, every state screenshotted in light and dark | v0.2.7 |
| 0 | Build, helper, tooling, docs; one small file converted to prove dev, build and Vitest | together with phase 1 |
| 1 | The 12 leftovers converted to StyleX (their two `styles.ts` files plus `UserPermissionsCard`, `SchemaPropsForm`, `PropsEditor`); the facts grid's nested `dt`/`dd` selector moves onto the elements, the source panel keeps its `@container` query | release |
| 2 | Codemod tiers A and B, one feature area per batch, each batch reviewed and screenshotted | one or more releases |
| 3 | Tier C (`stylex.defaultMarker()` + `stylex.when.ancestor()` or `xstyle`) and tier D (tag / third-party selectors as scoped plain CSS) by hand | one or more releases |
| 4 | Allowlist empty, guard on for all files, docs final | release |

## Verification

Per batch: `tsc`, ESLint (including the StyleX rules), Prettier and Vitest on the touched files; `lint-lobe` on changed UI; every changed route opened in the local admin and screenshotted in light and dark, compared with a screenshot of the same route taken before the change. Production build checked once in phase 0 (StyleX rules land in the entry CSS). Tests that query emotion class names move with their source file.

## Left to the builder

Class name prefix, exact batch boundaries in phase 2, how tier D's third-party selectors are scoped, and whether phase 2 and 3 ship as one release or several.
