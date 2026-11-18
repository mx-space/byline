import { parseArgs } from 'node:util'

import type {
  BylineClient,
  DraftBranch,
  UrlOptions,
} from '@mx-space/byline-api-client'

import {
  connect,
  CONNECTION_HELP,
  CONNECTION_OPTIONS,
  createConnectedClient,
  requireConnection,
} from '../auth/client'
import { checkDraft, formatCheckResult } from '../writing/check'
import { resolveCover } from '../writing/cover'
import {
  applyPatch,
  Directory,
  hasFields,
  toWriteData,
} from '../writing/fields'
import {
  formatDiscarded,
  formatDraft,
  formatDraftRow,
  formatPost,
  printJson,
} from '../writing/format'
import { readWriteInput, WRITE_HELP, WRITE_OPTIONS } from '../writing/input'
import {
  describePublicLink,
  draftAdminUrl,
  type PublicLink,
  publicPostLink,
} from '../writing/urls'
import { canUseMxs, createMxsPublishJob } from './mxs'

export const DRAFT_HELP = `Usage: byline draft <command> [options]

Commands:
  list                     list post drafts (--page, --size, --new for unpublished ones)
  get <id>                 show a draft (admin and public URLs included)
  url <id>                 print the admin edit URL and public URL if published
  update <id>              append a revision; fields and body not given are kept
  check <id>               report quality issues (SEO length, summary, translations)
  publish <id>             publish this draft; does not run unless you call it
  delete <id>              delete a new draft, or discard unpublished changes to a post

Create drafts with "byline post create". "draft update" and "post create" never publish.

${WRITE_HELP}
Publish options:
  --at, --public-at <iso>  schedule visibility at this ISO 8601 time (not immediate)
  --strict                 run "draft check" first and refuse to publish on issues
Options:
  --url                    with get, print only the URLs
  --json                   print the raw API response
${CONNECTION_HELP}`

const loadSiteUrls = async (client: BylineClient): Promise<UrlOptions> =>
  (await client.options.url()).data

const publicLinkForDraft = async (
  client: BylineClient,
  urls: UrlOptions,
  draft: DraftBranch,
): Promise<PublicLink> => {
  if (!draft.document.refId) return { status: 'unavailable' }
  try {
    const { data: post } = await client.posts.get(draft.document.refId)
    return publicPostLink(urls, post)
  } catch {
    return { status: 'unavailable' }
  }
}

const draftLinks = async (client: BylineClient, draft: DraftBranch) => {
  const urls = await loadSiteUrls(client)
  return {
    adminUrl: draftAdminUrl(urls, draft),
    publicLink: await publicLinkForDraft(client, urls, draft),
    urls,
  }
}

export const showDraft = async (
  client: BylineClient,
  draft: DraftBranch,
  options: { heading?: string; json: boolean; urlsOnly?: boolean },
) => {
  if (options.json) return printJson(draft)
  const links = await draftLinks(client, draft)
  if (options.urlsOnly) {
    process.stdout.write(
      `Admin     ${links.adminUrl}\nURL       ${describePublicLink(links.publicLink)}\n`,
    )
    return 0
  }
  const directory = new Directory(client)
  const data = draft.headRevision.typeSpecificData ?? {}
  const [authors, category] = await Promise.all([
    directory.authorNames(data.authors),
    directory.categoryName(data.categoryId),
  ])
  process.stdout.write(
    `${options.heading ? `${options.heading}\n` : ''}${formatDraft(draft, {
      adminUrl: links.adminUrl,
      authors,
      category,
      publicLink: links.publicLink,
    })}\n`,
  )
  return 0
}

export const parsePublicAt = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Invalid --at / --public-at datetime "${value}" (use ISO 8601)`,
    )
  }
  return date.toISOString()
}

export const runDraft = async (argv: string[]): Promise<number> => {
  const [command, ...rest] = argv
  const { values, positionals } = parseArgs({
    args: rest,
    allowPositionals: true,
    options: {
      ...WRITE_OPTIONS,
      ...CONNECTION_OPTIONS,
      page: { type: 'string' },
      size: { type: 'string' },
      new: { type: 'boolean', default: false },
      json: { type: 'boolean', default: false },
      url: { type: 'boolean', default: false },
      strict: { type: 'boolean', default: false },
      at: { type: 'string' },
      'public-at': { type: 'string' },
      help: { type: 'boolean', short: 'h', default: false },
    },
  })
  if (!command || values.help || command === '--help' || command === '-h') {
    process.stdout.write(DRAFT_HELP)
    return 0
  }
  const [id] = positionals
  if (command !== 'list' && !id) {
    throw new Error(`Usage: byline draft ${command} <id>`)
  }

  switch (command) {
    case 'list': {
      const client = (await connect(values, { required: true }))!
      const { data, meta } = await client.drafts.list({
        refType: 'post',
        page: values.page ? Number(values.page) : undefined,
        size: values.size ? Number(values.size) : undefined,
        hasRef: values.new ? false : undefined,
      })
      if (values.json) return printJson({ data, meta })
      const urls = await loadSiteUrls(client)
      const pagination = meta?.pagination
      const rows = await Promise.all(
        data.map(async (draft) => {
          const publicLink = await publicLinkForDraft(client, urls, draft)
          return formatDraftRow(draft, {
            admin: draftAdminUrl(urls, draft),
            public: describePublicLink(publicLink),
          })
        }),
      )
      process.stdout.write(
        `${rows.join('\n') || 'No drafts'}\n${pagination ? `page ${pagination.page}/${pagination.totalPages}, ${pagination.total} drafts\n` : ''}`,
      )
      return 0
    }
    case 'get': {
      const client = (await connect(values, { required: true }))!
      const { data } = await client.drafts.get(id!)
      return showDraft(client, data, {
        json: values.json,
        urlsOnly: values.url,
      })
    }
    case 'url': {
      const client = (await connect(values, { required: true }))!
      const { data } = await client.drafts.get(id!)
      return showDraft(client, data, { json: values.json, urlsOnly: true })
    }
    case 'check': {
      const client = (await connect(values, { required: true }))!
      const { data } = await client.drafts.get(id!)
      const result = await checkDraft(client, data)
      if (values.json) return printJson(result)
      process.stdout.write(`${formatCheckResult(data, result)}\n`)
      return result.issues.length > 0 ? 1 : 0
    }
    case 'update': {
      const input = await readWriteInput(values)
      if (!input.body && !hasFields(input.fields) && !input.coverSpec) {
        throw new Error(
          'Nothing to update: pass --file, --content, --cover/--image, --source-lang or field flags',
        )
      }
      const client = (await connect(values, { required: true }))!
      if (input.coverSpec) {
        input.fields.image = await resolveCover(input.coverSpec, client)
      }
      const { data: current } = await client.drafts.get(id!)
      const patch = await toWriteData(
        input.fields,
        input.body,
        new Directory(client),
      )
      const { data } = await client.drafts.update(id!, {
        data: applyPatch(current.headRevision, patch),
        expectedHeadRevisionId: current.headRevisionId,
      })
      return showDraft(client, data, {
        json: values.json,
        heading: 'Updated draft',
      })
    }
    case 'publish': {
      const at = values.at ?? values['public-at']
      if (
        values.at &&
        values['public-at'] &&
        values.at !== values['public-at']
      ) {
        throw new Error('Pass only one of --at or --public-at')
      }
      const connection = await requireConnection(values)
      const client = createConnectedClient(connection)
      let { data: current } = await client.drafts.get(id!)
      if (values.strict) {
        const result = await checkDraft(client, current)
        if (result.issues.length > 0) {
          process.stdout.write(`${formatCheckResult(current, result)}\n`)
          throw new Error(
            'Refusing to publish because --strict found issues; fix them or omit --strict',
          )
        }
      }
      const scheduled = at !== undefined
      const publicAt = scheduled ? parsePublicAt(at!) : null
      const currentPublicAt =
        (current.headRevision.typeSpecificData?.publicAt as
          string | null | undefined) ?? null
      if (scheduled || currentPublicAt) {
        const { data: updated } = await client.drafts.update(id!, {
          data: applyPatch(current.headRevision, {
            contentFormat: 'lexical',
            typeSpecificData: { publicAt },
          }),
          expectedHeadRevisionId: current.headRevisionId,
        })
        current = updated
      }
      const publishedRevisionId = current.document.publishedRevisionId
      let task
      if (
        canUseMxs(connection) &&
        current.headRevision.contentFormat === 'lexical'
      ) {
        const taskId = await createMxsPublishJob(connection, {
          headRevisionId: current.headRevisionId,
          id: current.id,
          publishedRevisionId,
        })
        task = await client.publishJobs.wait(taskId)
      } else {
        task = await client.publishJobs.run({
          branchId: current.id,
          revisionId: current.headRevisionId,
          expectedPublishedRevisionId: publishedRevisionId,
        })
      }
      const { data: post } = await client.posts.get(task.result.articleId)
      if (values.json) return printJson({ draft: current, post, task })
      const urls = await loadSiteUrls(client)
      const heading = scheduled
        ? `Scheduled draft (public at ${publicAt})`
        : 'Published draft'
      process.stdout.write(
        `${heading}\n${formatPost(post, publicPostLink(urls, post))}\n`,
      )
      return 0
    }
    case 'delete': {
      const client = (await connect(values, { required: true }))!
      const { data: draft } = await client.drafts.get(id!)
      await client.drafts.delete(id!)
      process.stdout.write(`${formatDiscarded(draft)}\n`)
      return 0
    }
    default: {
      process.stderr.write(
        `Unknown draft command "${command}"\n\n${DRAFT_HELP}`,
      )
      return 2
    }
  }
}
