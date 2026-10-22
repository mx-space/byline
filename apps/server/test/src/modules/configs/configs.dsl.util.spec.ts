import { generateFormDSL } from '~/modules/configs/configs.dsl.util'

describe('generateFormDSL', () => {
  test('keeps media features inside the unified AI section instead of exposing duplicate credential sections', () => {
    const dsl = generateFormDSL()
    const aiSections =
      dsl.groups.find((group) => group.key === 'ai')?.sections ?? []

    expect(aiSections.map((section) => section.key)).toEqual(['ai'])
    expect(
      aiSections[0]?.fields.some((field) => field.key === 'providers'),
    ).toBe(true)
  })
})
