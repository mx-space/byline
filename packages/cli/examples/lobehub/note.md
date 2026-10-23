# LobeHub import: open questions

Status 2026-10-23. Things the LobeHub blog import does not get right yet, kept here until each one is decided.

## Component mappings

Decided 2026-10-23 after comparing each LobeHub component with its haklex rendering. All four are plain configuration in `components.json`; the CLI has no LobeHub-specific code.

| LobeHub component | Mapping                                                             | Why                                                                                                                                                                                                                          |
| ----------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Callout`         | `banner`                                                            | Closest to LobeHub's look in the article flow. `type` values are folded into banner types (`info` → `note`, `error`/`danger` → `caution`).                                                                                   |
| `Steps`           | `steps`, children split at `h3` (`sections` mode)                   | Each `###` heading becomes a step title and the blocks up to the next one its content, so the numbered look and every step's content are kept.                                                                               |
| `Cards`           | `grid-container`, 3 columns, one cell per child                     | LobeHub lays cards out in three columns at article width.                                                                                                                                                                    |
| `Card`            | Markdown template: an image, then a link titled with the card title | `link-card` fetched Open Graph data that overrode the card's own title and image. The template keeps LobeHub's props; a card without `image` keeps only the link (34 cards, reported). The site specializes the grid's look. |

## Other known gaps

- `LobeEvalLeaderboard` maps to a dynamic component at a placeholder URL (`cdn.example.com`). It renders as a failed block until the component is bundled and the URL updated.
- The post `text` field (markdown from haklex `$toMarkdown`) flattens container nodes: Steps, Cards cells, Callouts and table cells lose structure, links and formatting. Rendering uses the Lexical content and is unaffected; AI summary and insights read `text` and see less. Fix belongs in `@haklex/rich-headless`.
- 6 posts use the same image as the frontmatter `image` and as the first `<Image cover>` in the body. A frontend that shows `post.image` as a hero shows it twice; the landing uses `image` only for Open Graph.

## Source content issues (not import bugs)

- 37 places in translated files contain escaped `\*\*` or misplaced `**` (for example `** 總結：**`). The landing shows literal asterisks there as well.
