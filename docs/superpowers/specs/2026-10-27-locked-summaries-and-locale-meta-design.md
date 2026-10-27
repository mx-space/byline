# Locked AI summaries and the per-locale meta table

Status: approved direction, 2026-10-27.

## Why

The LobeHub blog import put each locale's human-written `seo.description` into that translation's `summary` and `seo.description`, and nothing into `ai_summaries`. In the admin this reads as broken:

- AI → Summaries shows nothing for 72 posts that do have a summary in every language.
- Per-locale SEO is only visible by opening one translation at a time; nowhere shows all 17 languages of a post side by side.

The owner decided to keep SEO and the AI summary as separate fields, mapped the way the source has them, and to make the per-locale state visible in one place.

## Goals

1. Imported per-locale descriptions live in `ai_summaries`, one row per language, and AI never overwrites them unless someone explicitly asks.
2. Per-locale `seo` keeps mapping to each translation's `seo`, as today.
3. One view per post lists every language's SEO title, SEO description and AI summary, each with where it came from.

## Non-goals

- No change to the post detail response. `buildPublicDetail` (`modules/post/post.controller.ts`) already returns the requested language's `ai_summaries` row as `meta.summary` via `getSummaryForPublicMeta`; locked rows come through unchanged. Consumers read SEO from `post.seo` and the summary from `meta.summary` in one call.
- No change to the v0.2.5 AI SEO description feature (`document.aiSeo`, `publish.service.ts`).
- No consumer-specific code (AGENTS.md scope rules). Nothing in this work names LobeHub; the CLI mapping is generic frontmatter handling.

## Anti-goals

- A regeneration path that silently replaces a human summary.
- The new table becoming a second editor. It is read-only; editing stays in the existing translation and summary editors.

## Constraints

- Migrations are expand-only and must work with the previous release's code (AGENTS.md, Database Migrations).
- Response envelope, views and case rules from AGENTS.md apply to every new endpoint and field.
- Admin UI goes through lobe-design (`.agents/ux/*`, `lint-lobe.mjs` on changed paths).

## Decided

### Data

- `ai_summaries` gains `is_locked boolean not null default false`. Migration adds the column only.
- A locked row is the valid summary for its `(ref_id, lang)` no matter what its `hash` is. The AI overview never marks a locked summary stale (same rule as locked translations, `translation-consistency.service.ts:128`).

### Lock enforcement

- Every generation path must leave a locked row alone unless the caller passes `regenerateLocked`: publish-time summary (`publish.service.ts`, `case 'summary'`), the summary task, summary translation (`translateSummary`), streaming (`streamSummaryForArticle`), and on-demand `getOrGenerateSummaryForArticle`.
- Check the lock before calling the model, so no tokens are spent on a result that would be thrown away: `findValidSummary` and the task's language list return or skip locked languages first.
- `ai-summary.repository.ts` `upsert` also refuses to overwrite a locked row unless told to, as a safety net for any path that forgets.
- The batch task logs `Skipping locked summaries: <langs>` the way translations log skipped locked languages (`ai-translation.service.ts:250`), and puts the skipped list in its result.
- A regeneration with `regenerateLocked` writes an AI row with `is_locked = false`.
- `regenerateLocked` applies only to the languages the request names. The admin "Regenerate" button runs a multilang task with `force` and one target language (`use-artefact-actions.ts` → `executeMultilangTask`), and `force` rebuilds the base first: when the base (source-language) row is locked, it is used as is and never rebuilt, unless the source language is itself the named target. The target is then translated from that human base. Lock handling therefore sits in the summary adapter's base and target steps, not in the shared multilang engine that insights also use. (Designer's call.)
- Publish never regenerates a locked summary. The publish request gets no new field; `regenerateLockedTranslations` keeps covering translations only. Regenerating a locked summary is done from AI → Summaries. This leaves the publish contract that `mxs` depends on unchanged. (Designer's call.)
- Staleness of translations of a locked base: a locked base is authoritative regardless of content edits, so an unlocked translated row is stale only when its `hash` differs from its base's `hash`, matching `runTranslation`'s `view.hash === base.hash` rule. The overview uses that rule for rows whose base is locked. (Designer's call.)

### Writing human summaries

- New authenticated endpoint that writes one language's summary for an article: `is_locked = true`, `is_translation = false`, `source_lang` = the post's source language, `hash` = the current content hash (`multilang.computeContentHash` of the post text). It upserts, so re-running an import is safe. Requires `EditPost`, like the existing summary `PATCH /:id`.
- The existing `PATCH /:id` (admin "Edit summary") also sets `is_locked = true`: a summary a person edited is human-maintained.
- `@mx-space/byline-api-client` gets a matching method next to `translations.writeManual`.

### CLI import (`packages/cli/src/importer`)

- For the source post and every translation, write an AI summary through the new endpoint when the frontmatter has one. Source chain, first non-empty: `summary`, `description`, `seo.description` (the chain `extractMeta` uses today).
- `extractSeo` is unchanged: `seo` → the post's and each translation's `seo`.
- The post's and translations' `summary` field is no longer filled from `description` or `seo.description`; only from an explicit frontmatter `summary`. With `--force` this clears the existing `summary` values on re-import; consumers that fall back from `seo.description` to `summary` are unaffected because every imported locale has `seo.description`. (Designer's call, flagged to the owner.)
- Re-importing unchanged posts needs `--force`, because the importer skips posts whose import hash matches.

### Admin

- **AI → Summaries** (`features/ai/product/SummaryGallery.tsx`): a locked entry shows a "已锁定" tag. "Regenerate" on a locked entry sends `regenerateLocked` and the result is unlocked. Copy in en-US and zh-CN.
- **AI post overview** (`features/ai/components/article-overview/OverviewDetailPane.tsx`): new section "SEO 与摘要" under the coverage matrix, a read-only table with one row per language. The rows are the union of: the source language, `translationTargetLanguages`, `summaryTargetLanguages`, and every language that has a translation or summary row for the post, so imported languages missing from the config still show. Source first, then the rest alphabetically. (Designer's call.) and columns 语言 / SEO 标题 / SEO 描述 / AI 摘要. Show the first 5 rows and an "expand the other N" control. Clicking a row opens that language's existing editor (source: post editor; target: translation editor).
- Every cell carries a source tag:
  - **人工**: SEO from the source post typed by the author, or from a locked translation.
  - **人工 · 已锁定**: a locked AI-summary row, imported or edited by hand. The two are not told apart, so the migration stays a single boolean; the mockup's "导入 · 已锁定" label is replaced by this one. (Designer's call.)
  - **AI**: an unlocked AI summary; a source SEO description equal to `document.aiSeo.description`; an unlocked translation's SEO.
  - **沿用原文**: the translation has no value for that SEO field, so `mergeTranslatedSeo` serves the source's.
  - **空**: nothing for this language, source included.
- The data comes from the article overview endpoint (`ai-overview.service.ts`), extended with a per-language list of SEO title, SEO description, AI summary and the provenance of each. Add it to the overview view and the api-client types.
- The post editor's SEO panel gets a "查看全部语言" link to this section.

### Production backfill

After release, run the new CLI against production for the LobeHub content tree with `--force`. Confirm with the owner right before running it.

## Left to the builder

- The exact endpoint path and request shape for the human-summary write (suggestion: `PUT /ai/summaries/article/:id/lang/:lang` with `{ summary }`).
- The field names and shape of the overview's per-language list, and how provenance is encoded (an enum string is enough).
- How to thread `regenerateLocked` through each generation path's existing payload type.
- Test layout. Required coverage: each generation path skips a locked row; `regenerateLocked` overwrites and unlocks; regenerating one locked target leaves a locked base untouched; publish leaves locked summaries alone; `PATCH /:id` locks; the human-summary endpoint is idempotent; the overview reports provenance for each tag case; the CLI chain picks `summary` → `description` → `seo.description`.

## Artifacts

- Design canvas "Post locale meta", https://claude.ai/artifact/MnL2n5WZhjPMQukVqwaDyp, round 1:
  - Q1 (where to see all languages at once): **q1-b**, a table in the AI post overview. Rejected: q1-a, a language switcher in the editor's SEO panel; q1-c, a side panel opened from the editor.
  - Q2 (how a language row looks): **q2-a**, a table with a source tag on every cell. Rejected: q2-b, a search-result preview card per language.
  - Both choices are the recommendations, accepted by the owner. The mockups approximate lobe-ui; the build uses the real components.
