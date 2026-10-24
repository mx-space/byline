import { toast } from '@lobehub/ui'
import { useNavigate } from 'react-router'

import type { AiOverviewCapability, AiOverviewDetail } from '~/api/ai-overview'
import { useI18n } from '~/i18n'

import { buildAssetRows } from '../components/article-overview/asset-rows'
import { coverageColumns } from '../components/article-overview/coverage-cells'
import { OverviewMatrix } from '../components/article-overview/OverviewMatrix'
import { useOverviewActions } from '../components/article-overview/useOverviewActions'
import { useAiCopy } from '../copy'
import { confirmTranslationRewrite } from './confirm-rewrite'

export function ProductCapabilityMatrix(props: {
  capability: AiOverviewCapability
  lockedLangs?: string[]
  overview: AiOverviewDetail
  postId: string
}) {
  const navigate = useNavigate()
  const { locale } = useI18n()
  const copy = useAiCopy()
  const actions = useOverviewActions(props.postId)
  const lockedLangs = props.lockedLangs ?? []

  const generate = async (
    capability: AiOverviewCapability,
    lang: string,
    force: boolean,
  ) => {
    let langs: string[] | undefined = [lang]
    let regenerateLocked = false
    if (capability === 'translation' && force) {
      const confirmed = await confirmTranslationRewrite({
        locale,
        lockedLangs,
        targetLangs: langs,
      })
      if (confirmed.cancelled) {
        if (confirmed.skippedLocked) toast.info(copy('skippedLocked'))
        return
      }
      langs = confirmed.langs
      regenerateLocked = confirmed.regenerateLocked
    }
    actions.generate(capability, langs, props.overview, force, regenerateLocked)
  }

  return (
    <OverviewMatrix
      activeTasks={props.overview.activeTasks}
      assets={buildAssetRows(props.overview)}
      busy={actions.isMutating}
      capability={props.capability}
      coverage={props.overview.coverage}
      langs={coverageColumns(props.overview.coverage)}
      lockedLangs={lockedLangs}
      onGenerate={(capability, lang, force) =>
        void generate(capability, lang, force)
      }
      onOpen={(path) => navigate(path)}
      refId={props.postId}
    />
  )
}
