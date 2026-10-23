import { Alert, Button, SkeletonText, toast } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { sendTestEmail } from '~/api/health'
import type {
  ConfigFormField,
  ConfigFormGroup,
  ConfigFormSchema,
} from '~/api/options'
import { getAllOptions, patchOption } from '~/api/options'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'

import { settingsQueryKey } from '../constants'
import { settingsCopy } from '../copy'
import {
  cloneJson,
  getErrorMessage,
  normalizeAIConfig,
  setPathImmutable,
} from '../utils/settings'
import {
  countChanges,
  parseConfigValidationMessage,
} from '../utils/settings-form'
import { AIConfigEditor } from './ai/AIConfigEditor'
import { ConfigSection } from './config/ConfigSection'
import { useSettingsRouteContext } from './settings-route-context'
import { useSettingsActionBarSetter } from './SettingsActionBar'

type Options = Record<string, unknown>

function normalizeOptions(data: Options): Options {
  const next = cloneJson(data)
  if ('ai' in next) next.ai = normalizeAIConfig(next.ai)
  return next
}

function collectLeafPaths(prefix: string, fields: ConfigFormField[]) {
  const paths: string[] = []
  for (const field of fields) {
    const path = `${prefix}.${field.key}`
    if (field.fields?.length)
      paths.push(...collectLeafPaths(path, field.fields))
    else paths.push(path)
  }
  return paths
}

export function SystemSettings(props: {
  activeGroup: ConfigFormGroup
  schema?: ConfigFormSchema
}) {
  const { locale, t } = useI18n()
  const queryClient = useQueryClient()
  const setDirtyAction = useSettingsActionBarSetter()
  const { registerLeaveGuard } = useSettingsRouteContext()
  const [configs, setConfigs] = useState<Options>({})
  const [origin, setOrigin] = useState<Options>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const [resetKey, setResetKey] = useState(0)
  const configsRef = useRef(configs)
  configsRef.current = configs
  const originRef = useRef(origin)
  originRef.current = origin

  const sections = useMemo(
    () => props.activeGroup.sections.filter((section) => !section.hidden),
    [props.activeGroup.sections],
  )
  const sectionKeys = useMemo(
    () => sections.map((section) => section.key),
    [sections],
  )
  const fieldPaths = useMemo(
    () =>
      new Set(
        sections.flatMap((section) =>
          collectLeafPaths(section.key, section.fields),
        ),
      ),
    [sections],
  )

  const optionsQuery = useQuery({
    enabled: Boolean(props.schema),
    queryFn: getAllOptions,
    queryKey: adminQueryKeys.settings.options(),
  })

  useEffect(() => {
    if (!optionsQuery.data) return
    const next = normalizeOptions(optionsQuery.data)
    const pending = Object.keys(configsRef.current).filter(
      (key) =>
        countChanges(originRef.current[key], configsRef.current[key]) > 0,
    )
    const merged = cloneJson(next)
    for (const key of pending) merged[key] = configsRef.current[key]
    setOrigin(next)
    setConfigs(merged)
  }, [optionsQuery.data])

  const changesBySection = useMemo(
    () =>
      Object.fromEntries(
        sectionKeys.map((key) => [
          key,
          countChanges(origin[key], configs[key]),
        ]),
      ) as Record<string, number>,
    [configs, origin, sectionKeys],
  )
  const dirtyKeys = sectionKeys.filter((key) => changesBySection[key]! > 0)
  const dirtyCount = dirtyKeys.reduce(
    (sum, key) => sum + changesBySection[key]!,
    0,
  )
  const hasDirty = dirtyCount > 0

  const saveMutation = useMutation({
    mutationFn: async (keys: string[]) => {
      const values = keys.map((key) => configsRef.current[key] ?? {})
      const results = await Promise.allSettled(
        keys.map((key, index) => patchOption(key, values[index])),
      )
      return keys.map((key, index) => ({
        key,
        result: results[index]!,
        value: values[index],
      }))
    },
    onSuccess: async (outcomes) => {
      const saved = outcomes.filter(
        (outcome) => outcome.result.status === 'fulfilled',
      )
      const failed = outcomes.flatMap((outcome) =>
        outcome.result.status === 'rejected'
          ? [{ key: outcome.key, reason: outcome.result.reason as unknown }]
          : [],
      )

      if (saved.length > 0) {
        setOrigin((current) => {
          const next = { ...current }
          for (const outcome of saved)
            next[outcome.key] = cloneJson(outcome.value)
          return next
        })
      }

      const nextErrors: Record<string, string> = {}
      const general: string[] = []
      for (const { key, reason } of failed) {
        const message = getErrorMessage(
          reason,
          t('settings.common.error.savedFailed'),
        )
        for (const issue of parseConfigValidationMessage(message)) {
          const path = issue.path ? `${key}.${issue.path}` : null
          if (path && fieldPaths.has(path)) nextErrors[path] = issue.message
          else general.push(issue.message)
        }
      }
      setErrors(nextErrors)

      if (failed.length > 0) {
        setFailure(
          general.length > 0
            ? general.join(' ')
            : settingsCopy(locale, 'saveFailedFields'),
        )
        toast.error(settingsCopy(locale, 'saveFailed'))
      } else {
        setFailure(null)
        toast.success(
          settingsCopy(locale, 'saved', {
            count: saved.reduce(
              (sum, outcome) => sum + (changesBySection[outcome.key] ?? 0),
              0,
            ),
          }),
        )
      }

      if (saved.length > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: settingsQueryKey }),
          queryClient.invalidateQueries({
            queryKey: adminQueryKeys.ai.imageGenerationOptions(),
          }),
          queryClient.invalidateQueries({
            queryKey: adminQueryKeys.ai.ttsOptions(),
          }),
          queryClient.invalidateQueries({
            queryKey: adminQueryKeys.ai.ttsVoicesRoot,
          }),
        ])
      }
    },
  })

  const testEmailMutation = useMutation({
    mutationFn: sendTestEmail,
    onError: (error: unknown) =>
      toast.error(
        getErrorMessage(error, t('settings.common.error.sendTestEmailFailed')),
      ),
    onSuccess: (result) => {
      if (result.message) {
        toast.error(
          t('settings.system.section.testEmailFailed', {
            message: result.message,
          }),
        )
      } else toast.success(t('settings.system.section.testEmailSent'))
    },
  })

  const updateValue = useCallback((path: string, value: unknown) => {
    setConfigs((current) => setPathImmutable(current, path, value))
    setErrors((current) => {
      if (!(path in current)) return current
      const { [path]: _removed, ...rest } = current
      return rest
    })
  }, [])

  const handleFieldAction = useCallback(
    (actionId: string) => {
      toast.warning(
        t('settings.common.section.unknownAction', { action: actionId }),
      )
    },
    [t],
  )

  const discardChanges = useCallback(() => {
    setConfigs(cloneJson(originRef.current))
    setErrors({})
    setFailure(null)
    setResetKey((key) => key + 1)
  }, [])

  const saving = saveMutation.isPending
  const saveMutate = saveMutation.mutate
  const dirtyKeysKey = dirtyKeys.join('\0')
  const save = useCallback(() => {
    if (!dirtyKeysKey || saving) return
    saveMutate(dirtyKeysKey.split('\0'))
  }, [dirtyKeysKey, saveMutate, saving])

  const form = useForm({ onSubmit: save })

  useEffect(() => {
    registerLeaveGuard(() => hasDirty)
    return () => registerLeaveGuard(null)
  }, [hasDirty, registerLeaveGuard])

  useEffect(() => {
    if (!hasDirty) return
    const onLeave = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onLeave)
    return () => window.removeEventListener('beforeunload', onLeave)
  }, [hasDirty])

  useEffect(() => {
    setDirtyAction(
      hasDirty || saving
        ? {
            count: dirtyCount,
            error: failure ?? undefined,
            onDiscard: discardChanges,
            onSave: save,
            saving,
          }
        : null,
    )
  }, [
    dirtyCount,
    discardChanges,
    failure,
    hasDirty,
    save,
    saving,
    setDirtyAction,
  ])

  useEffect(() => () => setDirtyAction(null), [setDirtyAction])

  if (!props.schema || optionsQuery.isLoading) {
    return <SkeletonText rows={8} />
  }

  if (optionsQuery.isError && !optionsQuery.data) {
    return (
      <Alert
        action={
          <Button onClick={() => optionsQuery.refetch()} size="small">
            {settingsCopy(locale, 'retry')}
          </Button>
        }
        description={getErrorMessage(
          optionsQuery.error,
          settingsCopy(locale, 'loadFailedDetail'),
        )}
        showIcon
        title={settingsCopy(locale, 'loadFailed')}
        type="error"
      />
    )
  }

  return (
    <Form form={form} gap={24} variant="outlined">
      {sections.map((section) =>
        section.key === 'ai' ? (
          <AIConfigEditor
            key={section.key}
            modelCacheKey={adminQueryKeys.settings.aiModels()}
            onChange={(value) => updateValue(section.key, value)}
            value={normalizeAIConfig(configs[section.key])}
          />
        ) : (
          <ConfigSection
            defaults={props.schema?.defaults}
            errors={errors}
            extra={
              section.key === 'mailOptions' ? (
                <Button
                  icon={Mail}
                  loading={testEmailMutation.isPending}
                  onClick={() => testEmailMutation.mutate()}
                  size="small"
                >
                  {settingsCopy(locale, 'sendTestEmail')}
                </Button>
              ) : null
            }
            formData={configs}
            key={`${section.key}-${resetKey}`}
            onAction={handleFieldAction}
            section={section}
            updateValue={updateValue}
          />
        ),
      )}
    </Form>
  )
}
