import { Alert, Flexbox, Text, toast } from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { getOption, patchOption } from '~/api/options'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { FormSkeleton } from '~/ui/placeholders'
import { Button } from '~/ui/site-button'

import { accountQueryKey, oauthProviders } from '../../constants'
import { settingsAccountCopy, settingsCopy } from '../../copy'
import type {
  FlatOauthProvider,
  OauthOptions,
  OauthProviderType,
} from '../../types/settings'
import { flattenOauthOptions } from '../../utils/oauth'
import { getErrorMessage } from '../../utils/settings'
import { useSettingsRouteContext } from '../settings-route-context'
import { useSettingsActionBarSetter } from '../SettingsActionBar'
import type { OauthDraft } from './OauthProviderSection'
import {
  countOauthChanges,
  createOauthDraft,
  OauthProviderSection,
} from './OauthProviderSection'

type Drafts = Record<OauthProviderType, OauthDraft>

function buildDrafts(
  data: Record<OauthProviderType, FlatOauthProvider>,
  previous?: Drafts,
  keepDirty?: (type: OauthProviderType) => boolean,
): Drafts {
  return Object.fromEntries(
    oauthProviders.map((provider) => [
      provider.type,
      previous && keepDirty?.(provider.type)
        ? previous[provider.type]
        : createOauthDraft(provider.fields, data[provider.type]),
    ]),
  ) as Drafts
}

export function OauthSection() {
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const setDirtyAction = useSettingsActionBarSetter()
  const { registerLeaveGuard } = useSettingsRouteContext()
  const [drafts, setDrafts] = useState<Drafts | null>(null)
  const [errors, setErrors] = useState<Record<string, Record<string, string>>>(
    {},
  )
  const [failure, setFailure] = useState<string | null>(null)

  const oauthQuery = useQuery({
    queryFn: () => getOption<OauthOptions>('oauth'),
    queryKey: adminQueryKeys.settings.oauth(),
  })
  const data = useMemo(
    () => flattenOauthOptions(oauthQuery.data),
    [oauthQuery.data],
  )

  const changes = useMemo(
    () =>
      Object.fromEntries(
        oauthProviders.map((provider) => [
          provider.type,
          drafts
            ? countOauthChanges(
                provider.fields,
                data[provider.type],
                drafts[provider.type],
              )
            : 0,
        ]),
      ) as Record<OauthProviderType, number>,
    [data, drafts],
  )
  const changesRef = useRef(changes)
  changesRef.current = changes

  useEffect(() => {
    if (!oauthQuery.data) return
    setDrafts((previous) =>
      buildDrafts(
        data,
        previous ?? undefined,
        (type) => changesRef.current[type] > 0,
      ),
    )
  }, [data, oauthQuery.data])

  const dirtyTypes = oauthProviders
    .map((provider) => provider.type)
    .filter((type) => changes[type] > 0)
  const dirtyCount = dirtyTypes.reduce((sum, type) => sum + changes[type], 0)
  const hasDirty = dirtyCount > 0

  const saveMutation = useMutation({
    mutationFn: async (types: OauthProviderType[]) => {
      const current = drafts!
      return Promise.allSettled(
        types.map((type) => {
          const provider = oauthProviders.find((item) => item.type === type)!
          const draft = current[type]
          const publicValues: Record<string, string> = {}
          const secrets: Record<string, string> = {}
          for (const field of provider.fields) {
            const value = draft.values[field.key]?.trim() ?? ''
            if (field.secret) {
              if (value) secrets[field.key] = value
            } else publicValues[field.key] = value
          }
          return patchOption('oauth', {
            providers: [{ enabled: draft.enabled, type }],
            public: { [type]: publicValues },
            secrets: { [type]: secrets },
          })
        }),
      )
    },
    onSuccess: async (results, types) => {
      const rejected = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === 'rejected',
      )
      if (rejected) {
        const message = getErrorMessage(
          rejected.reason,
          t('settings.oauth.error.save'),
        )
        setFailure(message)
        toast.error(settingsCopy(locale, 'saveFailed'))
      } else {
        setFailure(null)
        toast.success(settingsAccountCopy(locale, 'oauthSaved'))
      }
      const saved = types.filter(
        (_, index) => results[index]?.status === 'fulfilled',
      )
      if (saved.length > 0) {
        setDrafts((current) => {
          if (!current) return current
          const next = { ...current }
          for (const type of saved) {
            next[type] = {
              ...next[type],
              values: Object.fromEntries(
                Object.entries(next[type].values).map(([key, value]) => [
                  key,
                  oauthProviders
                    .find((item) => item.type === type)
                    ?.fields.find((field) => field.key === key)?.secret
                    ? ''
                    : value,
                ]),
              ),
            }
          }
          return next
        })
        await queryClient.invalidateQueries({ queryKey: accountQueryKey })
      }
    },
  })

  const saving = saveMutation.isPending
  const saveMutate = saveMutation.mutate
  const dirtyKey = dirtyTypes.join(',')

  const save = useCallback(() => {
    if (!drafts || !dirtyKey || saving) return
    const types = dirtyKey.split(',') as OauthProviderType[]
    const nextErrors: Record<string, Record<string, string>> = {}
    for (const type of types) {
      const provider = oauthProviders.find((item) => item.type === type)!
      for (const field of provider.fields) {
        if (field.optional) continue
        if (field.secret && data[type].configured) continue
        if (!drafts[type].values[field.key]?.trim()) {
          nextErrors[type] = {
            ...nextErrors[type],
            [field.key]: settingsAccountCopy(locale, 'oauthMissing'),
          }
        }
      }
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setFailure(settingsCopy(locale, 'saveFailedFields'))
      return
    }
    saveMutate(types)
  }, [data, dirtyKey, drafts, locale, saveMutate, saving])

  const discard = useCallback(() => {
    setDrafts(buildDrafts(data))
    setErrors({})
    setFailure(null)
  }, [data])

  useEffect(() => {
    registerLeaveGuard(() => hasDirty)
    return () => registerLeaveGuard(null)
  }, [hasDirty, registerLeaveGuard])

  useEffect(() => {
    setDirtyAction(
      hasDirty || saving
        ? {
            count: dirtyCount,
            error: failure ?? undefined,
            onDiscard: discard,
            onSave: save,
            saving,
          }
        : null,
    )
  }, [dirtyCount, discard, failure, hasDirty, save, saving, setDirtyAction])

  useEffect(() => () => setDirtyAction(null), [setDirtyAction])

  return (
    <Flexbox gap={12}>
      <Flexbox gap={2}>
        <Text strong>{t('settings.oauth.title')}</Text>
        <Text type="secondary">{settingsAccountCopy(locale, 'oauthDesc')}</Text>
      </Flexbox>
      {oauthQuery.isLoading || (oauthQuery.data && !drafts) ? (
        <FormSkeleton label={t('settings.common.loading')} rows={3} />
      ) : oauthQuery.isError || !drafts ? (
        <Alert
          action={
            <Button onClick={() => oauthQuery.refetch()} size="small">
              {settingsCopy(locale, 'retry')}
            </Button>
          }
          description={getErrorMessage(
            oauthQuery.error,
            settingsCopy(locale, 'loadFailedDetail'),
          )}
          showIcon
          title={settingsCopy(locale, 'loadFailed')}
          type="error"
        />
      ) : (
        oauthProviders.map((provider) => (
          <OauthProviderSection
            data={data[provider.type]}
            draft={drafts[provider.type]}
            errors={errors[provider.type] ?? {}}
            fields={provider.fields}
            key={provider.type}
            label={provider.label}
            onChange={(draft) => {
              setDrafts((current) =>
                current ? { ...current, [provider.type]: draft } : current,
              )
              setErrors((current) =>
                current[provider.type]
                  ? { ...current, [provider.type]: {} }
                  : current,
              )
            }}
            type={provider.type}
          />
        ))
      )}
    </Flexbox>
  )
}
