# LobeHub import: open questions

Status 2026-10-23. Things the LobeHub blog import does not get right yet, kept here until each one is decided.

## Component mappings to revisit

The current mappings in `components.json` were picked because a haklex node with a similar shape exists, not because the semantics match. Each one is likely wrong and needs a decision.

| LobeHub component | Current haklex node | Why it is doubtful                                                                                                                                                                                                                                        |
| ----------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Callout`         | `banner`            | LobeHub renders a callout inline in the article flow; `banner` is a page-level notice. A GitHub-style alert (`alert-quote`) or a dedicated callout node may fit better. Its `type` values (`info`, `warning`, `error`, …) are squeezed into banner types. |
| `Steps`           | `nested-doc`        | The content is kept, but the numbered step look is lost. `nested-doc` is a generic embedded document, not a step list. Option discussed: a container style preset (`nested-doc` + `variant: "steps"`, CSS registered in the CMS).                         |
| `Cards`           | `grid-container`    | Layout only; LobeHub cards are a link list with a fixed card look. The grid's `cols`/`gap` are invented (`2`, `16px`).                                                                                                                                    |
| `Card`            | `link-card`         | `link-card` fetches and shows Open Graph data for a URL; LobeHub `Card` shows its own `title`/`desc`/`image` props. The two can disagree.                                                                                                                 |

## Other known gaps

- `LobeEvalLeaderboard` maps to a dynamic component at a placeholder URL (`cdn.example.com`). It renders as a failed block until the component is bundled and the URL updated.
- The post `text` field (markdown from haklex `$toMarkdown`) flattens container nodes: Steps, Cards cells, Callouts and table cells lose structure, links and formatting. Rendering uses the Lexical content and is unaffected; AI summary and insights read `text` and see less. Fix belongs in `@haklex/rich-headless`.
- 6 posts use the same image as the frontmatter `image` and as the first `<Image cover>` in the body. A frontend that shows `post.image` as a hero shows it twice; the landing uses `image` only for Open Graph.

## Source content issues (not import bugs)

- 37 places in translated files contain escaped `\*\*` or misplaced `**` (for example `** 總結：**`). The landing shows literal asterisks there as well.
