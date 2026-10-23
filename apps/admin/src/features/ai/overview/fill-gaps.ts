import type { CreateTaskResponse } from '~/api/ai'
import {
  createInsightsTask,
  createSummaryTask,
  createTranslationBatchTask,
  createTranslationTask,
  createTtsTask,
} from '~/api/ai'

import type { FillJob } from './coverage'

const CONCURRENCY = 4

function runJob(job: FillJob): Promise<CreateTaskResponse> {
  const [refId] = job.refIds
  switch (job.capability) {
    case 'translation': {
      return job.refIds.length > 1
        ? createTranslationBatchTask({
            refIds: job.refIds,
            targetLanguages: job.langs,
          })
        : createTranslationTask({ refId, targetLanguages: job.langs })
    }
    case 'summary': {
      return createSummaryTask({ refId, targetLanguages: job.langs })
    }
    case 'insights': {
      return createInsightsTask({ refId, targetLanguages: job.langs })
    }
    case 'tts': {
      return createTtsTask({ langs: job.langs, refId })
    }
  }
}

export async function runFillJobs(jobs: FillJob[]) {
  let created = 0
  let existing = 0
  let failed = 0
  for (let index = 0; index < jobs.length; index += CONCURRENCY) {
    const results = await Promise.allSettled(
      jobs.slice(index, index + CONCURRENCY).map(runJob),
    )
    for (const result of results) {
      if (result.status === 'rejected') failed++
      else if (result.value.created) created++
      else existing++
    }
  }
  return { created, existing, failed }
}
