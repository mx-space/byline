export type TranslationEntryKeyPath = 'category.name' | 'post.tag'

export type TranslationEntryKeyType = 'entity' | 'dict'

export interface TranslationEntryModel {
  id?: string
  keyPath: TranslationEntryKeyPath
  lang: string
  keyType: TranslationEntryKeyType
  lookupKey: string
  sourceText: string
  translatedText: string
  sourceUpdatedAt?: Date | null
  created?: Date
}
