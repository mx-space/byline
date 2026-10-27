# TL;DR: locked AI summaries + per-locale meta table

## What gets built

Imported per-locale descriptions go into the AI summary as locked rows that AI won't overwrite, plus one table in the AI post overview that shows every language's SEO and summary at once.

## What you'll see

1. AI → Summaries: the 72 LobeHub posts each show summaries in 17 languages, tagged "已锁定".
2. AI → Post overview: a new "SEO 与摘要" table, one row per language, with a source tag on every cell (人工 / 人工·已锁定 / AI / 沿用原文 / 空).
3. In the editor, the SEO panel has a "查看全部语言" link that jumps to that table.
4. Click "Regenerate" on a locked summary: AI rewrites it, and the row unlocks.
5. Publishing or batch generation skips locked languages, and the log says which ones were skipped.

## Decisions

| Item | Decision | Whose |
|---|---|---|
| Where the imported descriptions go | `ai_summaries`, one locked row per language | yours |
| SEO mapping | unchanged, per-locale `seo` → the translation's `seo` | yours |
| Lock | add `is_locked`, AI skips locked rows by default | yours |
| Where to see all languages at once | table in the AI post overview (q1-b) | yours (took the recommendation) |
| Row style | table with source tags (q2-a) | yours (took the recommendation) |
| Post detail API | unchanged, `meta.summary` already returns it | confirmed in the code |

## Check these (my calls)

- Editing a summary by hand in the admin locks it too. Imported and hand-edited summaries both show "人工 · 已锁定" with no distinction, so the migration adds only one boolean column.
- When you regenerate a single language, the locked source-language summary isn't rebuilt; the target language is translated straight from that human-written source.
- Publishing never touches locked summaries, and the publish API gets no new parameter, so the mxs contract stays the same. To regenerate one, click it on the AI → Summaries page.
- Table rows = the source language + both target-language configs + every language this post already has a translation or summary in, so imported languages missing from the config still show up.
- Editing the body after the source summary is locked doesn't mark the summaries translated from it as stale.
- On import, the translation's `summary` field no longer gets `seo.description`; a re-import with `--force` clears the old values. The landing reads `seo.description` first, so it's unaffected.
- The table is read-only; clicking a row jumps to that language's existing editor.
- The production backfill runs `import mdx --force`, and I'll check with you right before running it.

## Time

About 1 to 1.5 days: server (lock + endpoint + overview data + tests) half a day, admin table and tags half a day, CLI + release + backfill 2–3 hours.
