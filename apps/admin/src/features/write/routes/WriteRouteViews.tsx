import { useSearchParams } from 'react-router'

import { ArtefactTextWritePage } from '~/features/ai/product/ArtefactTextWritePage'
import { TranslationWritePage } from '~/features/ai/product/TranslationWritePage'

import { PostWritePageContent } from '../components/WriteRouteViewsContent'

export function PostWritePage() {
  const [searchParams] = useSearchParams()
  if (searchParams.get('translationId')) return <TranslationWritePage />
  if (searchParams.get('summaryId') || searchParams.get('insightsId')) {
    return <ArtefactTextWritePage />
  }
  return <PostWritePageContent />
}
