import { createE2EApp } from '@/helper/create-e2e-app'
import { authPassHeader } from '@/mock/guard/auth.guard'
import { AiSummaryController } from '~/modules/ai/ai-summary/ai-summary.controller'
import { AiSummaryService } from '~/modules/ai/ai-summary/ai-summary.service'
import { AiTaskService } from '~/modules/ai/ai-task/ai-task.service'

const service = {
  writeManualSummary: vi.fn(async () => ({
    id: '1',
    refId: '42',
    lang: 'zh-CN',
    summary: 'human',
    isLocked: true,
  })),
}
const ctx = createE2EApp({
  controllers: [AiSummaryController],
  providers: [
    { provide: AiSummaryService, useValue: service },
    { provide: AiTaskService, useValue: {} },
  ],
})

it('writes a locked manual summary for one language', async () => {
  const res = await ctx.app.inject({
    method: 'PUT',
    url: '/ai/summaries/article/42/lang/zh-CN',
    headers: authPassHeader,
    payload: { summary: 'human' },
  })

  expect(res.statusCode).toBe(200)
  expect(service.writeManualSummary).toHaveBeenCalledWith(
    '42',
    'zh-CN',
    'human',
  )
  expect(res.json()).toMatchObject({
    data: { is_locked: true, summary: 'human' },
  })
})

it('refuses manual summary writes without edit permission', async () => {
  const res = await ctx.app.inject({
    method: 'PUT',
    url: '/ai/summaries/article/42/lang/zh-CN',
    headers: { ...authPassHeader, 'test-permissions': 0 },
    payload: { summary: 'human' },
  })

  expect(res.statusCode).toBe(403)
})

it('rejects an empty manual summary', async () => {
  const res = await ctx.app.inject({
    method: 'PUT',
    url: '/ai/summaries/article/42/lang/zh-CN',
    headers: authPassHeader,
    payload: { summary: '   ' },
  })

  expect(res.statusCode).toBe(422)
  expect(service.writeManualSummary).not.toHaveBeenCalledWith(
    '42',
    'zh-CN',
    '   ',
  )
})
