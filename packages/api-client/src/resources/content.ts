import type { HttpCore } from '../http'
import type {
  Category,
  DynamicComponentCatalog,
  FileType,
  ManualSummaryInput,
  ManualTranslationInput,
  RegisterDynamicComponentInput,
  Summary,
  TaskRef,
  Translation,
  TranslationPatch,
  TranslationTaskInput,
  UpdateDynamicComponentInput,
  UploadedFile,
} from '../types'

const CATALOG_PRESERVE = ['components[].propsSchema']

export class CategoriesResource {
  constructor(private readonly http: HttpCore) {}

  list(options: { lang?: string } = {}) {
    return this.http.request<Category[]>('GET', '/categories', {
      query: { lang: options.lang ?? this.http.lang },
    })
  }

  get(slugOrId: string, options: { lang?: string } = {}) {
    return this.http.request<Category>(
      'GET',
      `/categories/${encodeURIComponent(slugOrId)}`,
      { query: { lang: options.lang ?? this.http.lang } },
    )
  }

  create(input: { name: string; slug?: string }) {
    return this.http.request<Category>('POST', '/categories', { body: input })
  }

  update(id: string, input: { name?: string; slug?: string }) {
    return this.http.request<Category>('PATCH', `/categories/${id}`, {
      body: input,
    })
  }

  delete(id: string) {
    return this.http.request<void>('DELETE', `/categories/${id}`)
  }
}

export class SummariesResource {
  constructor(private readonly http: HttpCore) {}

  writeManual(articleId: string, lang: string, input: ManualSummaryInput) {
    return this.http.request<Summary>(
      'PUT',
      `/ai/summaries/article/${articleId}/lang/${encodeURIComponent(lang)}`,
      { body: input },
    )
  }
}

export class TranslationsResource {
  constructor(private readonly http: HttpCore) {}

  getForArticle(articleId: string, lang: string) {
    return this.http.request<Translation>(
      'GET',
      `/ai/translations/article/${articleId}`,
      { query: { lang } },
    )
  }

  languages(articleId: string) {
    return this.http.request<string[]>(
      'GET',
      `/ai/translations/article/${articleId}/languages`,
    )
  }

  listByRef(articleId: string) {
    return this.http.request<{
      translations: Translation[]
      article: { type: string; document: Record<string, unknown> }
    }>('GET', `/ai/translations/ref/${articleId}`, {
      preserve: ['article.document.meta'],
    })
  }

  writeManual(articleId: string, lang: string, input: ManualTranslationInput) {
    return this.http.request<Translation>(
      'PUT',
      `/ai/translations/article/${articleId}/${encodeURIComponent(lang)}`,
      {
        body: {
          ...input,
          content:
            typeof input.content === 'string'
              ? input.content
              : JSON.stringify(input.content),
        },
      },
    )
  }

  update(id: string, patch: TranslationPatch) {
    return this.http.request<Translation>('PATCH', `/ai/translations/${id}`, {
      body: patch,
    })
  }

  delete(id: string) {
    return this.http.request<void>('DELETE', `/ai/translations/${id}`)
  }

  createTask(input: TranslationTaskInput) {
    return this.http.request<TaskRef>('POST', '/ai/translations/task', {
      body: input,
    })
  }
}

export class DynamicComponentsResource {
  constructor(private readonly http: HttpCore) {}

  list() {
    return this.http.request<DynamicComponentCatalog>(
      'GET',
      '/dynamic-components',
      { preserve: CATALOG_PRESERVE },
    )
  }

  register(input: RegisterDynamicComponentInput) {
    return this.http.request<DynamicComponentCatalog>(
      'POST',
      '/dynamic-components',
      { body: input, preserve: CATALOG_PRESERVE },
    )
  }

  update(id: string, input: UpdateDynamicComponentInput) {
    return this.http.request<DynamicComponentCatalog>(
      'PATCH',
      `/dynamic-components/${encodeURIComponent(id)}`,
      { body: input, preserve: CATALOG_PRESERVE },
    )
  }

  remove(id: string) {
    return this.http.request<DynamicComponentCatalog>(
      'DELETE',
      `/dynamic-components/${encodeURIComponent(id)}`,
      { preserve: CATALOG_PRESERVE },
    )
  }
}

export class FilesResource {
  constructor(private readonly http: HttpCore) {}

  upload(
    file: Blob,
    options: { type?: FileType; filename?: string; immutable?: boolean } = {},
  ) {
    const form = new FormData()
    const filename =
      options.filename ??
      (typeof File !== 'undefined' && file instanceof File
        ? file.name
        : 'upload.bin')
    form.append('file', file, filename)
    return this.http.request<UploadedFile>('POST', '/files/upload', {
      query: {
        type: options.type,
        immutable: options.immutable ? 'true' : undefined,
      },
      body: form,
    })
  }
}
