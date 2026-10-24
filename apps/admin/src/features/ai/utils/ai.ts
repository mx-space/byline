import { normalizeTargetLang } from '~/lib/lang'

export { getErrorMessage } from '~/features/tasks/utils/tasks'

export function parseLangInput(raw: string): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const segment of raw.split(/[,，]/)) {
    // Fold with the server's own canonicalizer: the chips shown here must name
    // the languages the backend will actually generate, or a typed `jp` reads
    // back as a `ja` row the board can never match to its column.
    const lang = normalizeTargetLang(segment)
    if (!lang || seen.has(lang)) continue
    seen.add(lang)
    result.push(lang)
  }
  return result
}

// Every row the TTS management page can act on already has narration, so
// without `force` planTts reuses each unchanged chunk and the enqueue is a
// no-op.
export function buildTtsRegeneratePayload(row: {
  lang: string
  refId: string
}) {
  return { force: true, langs: [row.lang], refId: row.refId }
}

// An empty blockOrder is the pipeline's "not published yet" sentinel: the run
// was interrupted after committing some chunks but before finalize. Re-running
// without `force` reuses every committed chunk and generates only the rest.
export function isTtsNarrationIncomplete(row: { blockOrder: string[] }) {
  return row.blockOrder.length === 0
}

export function buildTtsResumePayload(row: { lang: string; refId: string }) {
  return { force: false, langs: [row.lang], refId: row.refId }
}

export function firstLine(text: string) {
  return (
    text
      .split('\n')
      .find((line) => line.trim())
      ?.trim() ?? ''
  )
}
