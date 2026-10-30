import {
  ActionIcon,
  Alert,
  Button,
  confirmModal,
  Empty,
  Flexbox,
  Input,
  Switch,
  Tag,
  Text,
  toast,
} from '@lobehub/ui'
import { type ProColumns, ProTable } from '@lobehub/ui/pro-table'
import { cssVar } from '@lobehub/ui/stylex/cssVar.stylex'
import * as stylex from '@stylexjs/stylex'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Copy, Plus, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

import { uploadFile } from '~/api/files'
import { patchOption } from '~/api/options'
import { API_URL } from '~/constants/env'
import { OauthProviderIcon } from '~/features/auth/components/OauthProviderIcon'
import { allowLoginQueryKey } from '~/features/auth/constants'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { Drawer } from '~/ui/feedback/drawer'
import { SelectField } from '~/ui/primitives/select'
import { authClient } from '~/utils/authjs/auth'

import type { CustomOauthClient, OauthOptions } from '../../types/settings'
import { buildOauthValidationReturnUrl } from '../../utils/oauth'
import { getErrorMessage } from '../../utils/settings'
import { FieldShell, SecretInput } from '../SettingsPrimitives'
import { customOauthCopy } from './custom-oauth-copy'

const styles = stylex.create({
  drawer: { width: 'min(100vw, 36rem)' },
  section: { marginBlockEnd: 24 },
  identity: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  details: { minWidth: 0, overflowWrap: 'anywhere' },
  meta: { color: cssVar.colorTextSecondary, fontSize: cssVar.fontSizeSM },
  name: { fontWeight: 500 },
  help: {
    color: cssVar.colorTextSecondary,
    fontSize: cssVar.fontSizeSM,
    lineHeight: cssVar.lineHeightSM,
  },
  fieldError: { color: cssVar.colorErrorText, fontSize: cssVar.fontSizeSM },
  callback: {
    fontFamily: cssVar.fontFamilyCode,
    fontSize: cssVar.fontSizeSM,
    overflowWrap: 'anywhere',
    flexGrow: 1,
    minWidth: 0,
  },
  preview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBlock: 12,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: cssVar.colorBorder,
    borderRadius: cssVar.borderRadius,
  },
})

type Draft = CustomOauthClient & { clientSecret: string; scopesText: string }
type Patch = {
  customClients?: CustomOauthClient[]
  removedCustomClients?: string[]
  secrets?: Record<string, { clientSecret: string }>
}
const reservedIds = new Set([
  'apple',
  'github',
  'google',
  'password',
  'passkey',
  'credential',
])
const urlSchema = z.url({ protocol: /^https?$/ })

function isReady(client: CustomOauthClient, configured: boolean) {
  return Boolean(
    configured &&
    client.clientId &&
    (client.protocol === 'oidc'
      ? client.discoveryUrl
      : client.authorizationUrl && client.tokenUrl && client.userInfoUrl),
  )
}

export function CustomOauthSection({
  options,
  onDirtyChange,
}: {
  options: OauthOptions
  onDirtyChange: (dirty: boolean) => void
}) {
  const { locale } = useI18n()
  const copy = (
    key: Parameters<typeof customOauthCopy>[1],
    values?: Record<string, string>,
  ) => customOauthCopy(locale, key, values)
  const queryClient = useQueryClient()
  const clients = options.customClients ?? []
  const [draft, setDraft] = useState<Draft | null>(null)
  const [baseline, setBaseline] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [advanced, setAdvanced] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const dirty = draft !== null && JSON.stringify(draft) !== baseline

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])
  useEffect(() => () => onDirtyChange(false), [onDirtyChange])

  const mutation = useMutation({
    mutationFn: (patch: Patch) => patchOption('oauth', patch),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: adminQueryKeys.settings.oauth(),
        }),
        queryClient.invalidateQueries({ queryKey: allowLoginQueryKey }),
      ])
    },
  })
  const upload = useMutation({
    mutationFn: (file: File) => uploadFile(file, 'icon'),
    onSuccess: ({ url }) =>
      setDraft((current) => (current ? { ...current, icon: url } : current)),
    onError: (error) =>
      toast.error(getErrorMessage(error, copy('uploadFailed'))),
  })
  const saving = mutation.isPending || upload.isPending

  const open = (client?: CustomOauthClient) => {
    const next: Draft = {
      id: '',
      name: '',
      clientId: '',
      enabled: true,
      protocol: 'oidc',
      authentication: 'post',
      ...client,
      scopesText: (client?.scopes ?? ['openid', 'profile', 'email']).join(' '),
      clientSecret: '',
    }
    setDraft(next)
    setBaseline(JSON.stringify(next))
    setEditingId(client?.id ?? null)
    setAdvanced(false)
    setErrors({})
    setFailure(null)
  }
  const close = () => {
    if (saving) return
    if (dirty) {
      confirmModal({
        title: copy('discardTitle'),
        content: copy('discardBody'),
        okText: copy('discard'),
        cancelText: copy('keepEditing'),
        onOk: () => setDraft(null),
      })
    } else setDraft(null)
  }
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => (current ? { ...current, [key]: value } : current))
    setErrors((current) => ({ ...current, [key]: '' }))
  }
  const configured = Boolean(
    draft && options.configuredProviders?.includes(draft.id),
  )

  const save = async () => {
    if (!draft || saving) return
    const nextErrors: Record<string, string> = {}
    if (
      !/^[a-z][a-z0-9-]{0,63}$/.test(draft.id) ||
      reservedIds.has(draft.id) ||
      (!editingId && clients.some((client) => client.id === draft.id))
    )
      nextErrors.id = copy('invalidId')
    if (!draft.name.trim()) nextErrors.name = copy('required')
    const required = draft.enabled
      ? [
          'clientId',
          ...(draft.protocol === 'oidc'
            ? ['discoveryUrl']
            : ['authorizationUrl', 'tokenUrl', 'userInfoUrl']),
        ]
      : []
    for (const key of required)
      if (!(draft[key as keyof Draft] as string)?.trim())
        nextErrors[key] = copy('required')
    if (draft.enabled && !configured && !draft.clientSecret.trim())
      nextErrors.clientSecret = copy('required')
    for (const key of [
      'icon',
      'discoveryUrl',
      'authorizationUrl',
      'tokenUrl',
      'userInfoUrl',
    ] as const) {
      const value = draft[key]?.trim()
      if (value && !urlSchema.safeParse(value).success)
        nextErrors[key] = copy('invalidUrl')
    }
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      setFailure(copy('invalid'))
      return
    }
    const { clientSecret, scopesText, ...client } = draft
    const payload: CustomOauthClient = {
      ...client,
      name: client.name.trim(),
      clientId: client.clientId.trim(),
      scopes: scopesText.split(/[\s,]+/).filter(Boolean),
      profile: Object.fromEntries(
        Object.entries(client.profile ?? {})
          .filter(([, value]) => value?.trim())
          .map(([key, value]) => [key, value?.trim()]),
      ),
    }
    try {
      await mutation.mutateAsync({
        customClients: [payload],
        ...(clientSecret.trim()
          ? { secrets: { [client.id]: { clientSecret: clientSecret.trim() } } }
          : {}),
      })
      setDraft(null)
      toast.success(copy('saved'))
    } catch (error) {
      setFailure(getErrorMessage(error, copy('saveFailed')))
    }
  }
  const toggle = async (client: CustomOauthClient, enabled: boolean) => {
    try {
      await mutation.mutateAsync({ customClients: [{ ...client, enabled }] })
      toast.success(copy('saved'))
    } catch (error) {
      toast.error(getErrorMessage(error, copy('saveFailed')))
    }
  }
  const remove = (client: CustomOauthClient) =>
    confirmModal({
      title: copy('removeTitle', { name: client.name }),
      content: copy('removeBody'),
      okText: copy('remove'),
      cancelText: copy('cancel'),
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await mutation.mutateAsync({ removedCustomClients: [client.id] })
        } catch (error) {
          toast.error(getErrorMessage(error, copy('saveFailed')))
          throw error
        }
      },
    })
  const verify = async () => {
    if (!draft) return
    try {
      const result = await authClient.linkSocial({
        provider: draft.id,
        callbackURL: buildOauthValidationReturnUrl(draft.id),
      })
      if (result.error) throw new Error(result.error.message)
    } catch (error) {
      toast.error(getErrorMessage(error, copy('verifyFailed')))
    }
  }

  const columns: ProColumns<CustomOauthClient>[] = [
    {
      title: copy('name'),
      dataIndex: 'name',
      render: (_, client) => (
        <div {...stylex.props(styles.identity)}>
          <OauthProviderIcon src={client.icon} />
          <div {...stylex.props(styles.details)}>
            <div {...stylex.props(styles.name)}>{client.name}</div>
            <div {...stylex.props(styles.meta)}>
              {client.id} ·{' '}
              {client.protocol === 'oidc' ? 'OpenID Connect' : 'OAuth 2.0'}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: copy('status'),
      width: 112,
      responsive: ['md'],
      render: (_, client) => {
        const ready = isReady(
          client,
          Boolean(options.configuredProviders?.includes(client.id)),
        )
        return (
          <Tag color={client.enabled && ready ? 'success' : undefined}>
            {!ready
              ? copy('incomplete')
              : client.enabled
                ? copy('enabled')
                : copy('disabled')}
          </Tag>
        )
      },
    },
    {
      title: copy('actions'),
      width: 172,
      render: (_, client) => (
        <Flexbox align="center" gap={8} horizontal justify="flex-end">
          <Switch
            aria-label={`${copy('enable')} ${client.name}`}
            checked={client.enabled}
            title={
              !isReady(
                client,
                Boolean(options.configuredProviders?.includes(client.id)),
              )
                ? copy('completeHint')
                : undefined
            }
            disabled={
              mutation.isPending ||
              (!client.enabled &&
                !isReady(
                  client,
                  Boolean(options.configuredProviders?.includes(client.id)),
                ))
            }
            onChange={(enabled) => void toggle(client, enabled)}
          />
          <Button disabled={saving} onClick={() => open(client)} size="small">
            {copy('edit')}
          </Button>
          <ActionIcon
            aria-label={`${copy('remove')} ${client.name}`}
            danger
            disabled={saving}
            icon={Trash2}
            onClick={() => remove(client)}
            size="small"
            title={copy('remove')}
          />
        </Flexbox>
      ),
    },
  ]

  const input = (
    key:
      | 'id'
      | 'name'
      | 'icon'
      | 'clientId'
      | 'discoveryUrl'
      | 'authorizationUrl'
      | 'tokenUrl'
      | 'userInfoUrl'
      | 'scopesText',
    label: string,
    help?: string,
  ) => (
    <FieldShell label={label}>
      <Input
        aria-invalid={Boolean(errors[key])}
        aria-label={label}
        disabled={saving || (key === 'id' && Boolean(editingId))}
        onChange={(event) => set(key, event.target.value)}
        value={draft?.[key] ?? ''}
      />
      {help ? <span {...stylex.props(styles.help)}>{help}</span> : null}
      {errors[key] ? (
        <span {...stylex.props(styles.fieldError)} role="alert">
          {errors[key]}
        </span>
      ) : null}
    </FieldShell>
  )
  const callback = `${API_URL.replace(/\/+$/, '')}/auth/oauth2/callback/${draft?.id || 'client-id'}`
  const canVerify =
    !dirty &&
    configured &&
    Boolean(clients.find((client) => client.id === editingId)?.enabled)

  return (
    <section {...stylex.props(styles.section)}>
      <Flexbox align="center" gap={16} horizontal justify="space-between">
        <Flexbox gap={4}>
          <Text strong>{copy('title')}</Text>
          <Text type="secondary">{copy('desc')}</Text>
        </Flexbox>
        <Button disabled={saving} icon={Plus} onClick={() => open()}>
          {copy('add')}
        </Button>
      </Flexbox>
      {clients.length ? (
        <ProTable<CustomOauthClient>
          columns={columns}
          dataSource={clients}
          options={false}
          pagination={false}
          rowKey="id"
          search={false}
          tableLayout="fixed"
          variant="outlined"
        />
      ) : (
        <Empty title={copy('empty')} />
      )}
      <Drawer
        footer={
          <Flexbox align="center" gap={8} horizontal justify="space-between">
            <Button
              disabled={!canVerify || saving}
              onClick={() => void verify()}
              title={canVerify ? undefined : copy('verifyHint')}
            >
              {copy('verify')}
            </Button>
            <Flexbox gap={8} horizontal>
              <Button disabled={saving} onClick={close}>
                {copy('cancel')}
              </Button>
              <Button
                loading={mutation.isPending}
                disabled={upload.isPending}
                onClick={() => void save()}
                type="primary"
              >
                {copy('save')}
              </Button>
            </Flexbox>
          </Flexbox>
        }
        onClose={close}
        open={draft !== null}
        title={editingId ? copy('editTitle') : copy('add')}
        widthClassName={stylex.props(styles.drawer).className}
      >
        {draft ? (
          <Flexbox gap={24}>
            {failure ? (
              <Alert
                description={failure}
                title={copy('saveFailed')}
                type="error"
              />
            ) : null}
            <Flexbox align="center" horizontal justify="space-between">
              <Text strong>{copy('enable')}</Text>
              <Switch
                aria-label={copy('enable')}
                checked={draft.enabled}
                disabled={saving}
                onChange={(enabled) => set('enabled', enabled)}
              />
            </Flexbox>
            {input('name', copy('name'))}
            {input('id', copy('id'), copy('idHelp'))}
            <Flexbox gap={12}>
              <Flexbox align="center" gap={12} horizontal>
                <OauthProviderIcon size={40} src={draft.icon} />
                <Button
                  icon={Upload}
                  loading={upload.isPending}
                  onClick={() => fileInput.current?.click()}
                >
                  {copy('upload')}
                </Button>
              </Flexbox>
              <input
                accept="image/*"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) upload.mutate(file)
                }}
                ref={fileInput}
                type="file"
              />
              {input('icon', copy('icon'), copy('iconHelp'))}
              <Text type="secondary">{copy('preview')}</Text>
              <div {...stylex.props(styles.preview)}>
                <OauthProviderIcon src={draft.icon} />
                <span>
                  {locale === 'zh-CN'
                    ? `使用 ${draft.name || copy('name')} 登录`
                    : `Sign in with ${draft.name || copy('name')}`}
                </span>
              </div>
            </Flexbox>
            <FieldShell label={copy('protocol')}>
              <SelectField
                aria-label={copy('protocol')}
                onValueChange={(protocol) => set('protocol', protocol)}
                options={[
                  { value: 'oidc', label: 'OpenID Connect' },
                  { value: 'oauth2', label: 'OAuth 2.0' },
                ]}
                value={draft.protocol}
              />
            </FieldShell>
            {draft.protocol === 'oidc' ? (
              input('discoveryUrl', copy('discovery'))
            ) : (
              <>
                {input('authorizationUrl', copy('authorization'))}
                {input('tokenUrl', copy('token'))}
                {input('userInfoUrl', copy('userInfo'))}
              </>
            )}
            {input('clientId', 'Client ID')}
            <FieldShell label="Client Secret">
              <SecretInput
                aria-label="Client Secret"
                onChange={(value) => set('clientSecret', value)}
                stored={configured}
                value={draft.clientSecret}
              />
              {errors.clientSecret ? (
                <span {...stylex.props(styles.fieldError)} role="alert">
                  {errors.clientSecret}
                </span>
              ) : null}
            </FieldShell>
            {input('scopesText', copy('scopes'), copy('scopesHelp'))}
            <Flexbox gap={8}>
              <Text>{copy('callback')}</Text>
              <Flexbox align="center" gap={8} horizontal>
                <code {...stylex.props(styles.callback)}>{callback}</code>
                <ActionIcon
                  aria-label={copy('copy')}
                  icon={Copy}
                  onClick={() => {
                    void navigator.clipboard.writeText(callback).then(
                      () => toast.success(copy('copied')),
                      (error) =>
                        toast.error(getErrorMessage(error, copy('saveFailed'))),
                    )
                  }}
                  title={copy('copy')}
                />
              </Flexbox>
              <Text type="secondary">{copy('callbackHelp')}</Text>
            </Flexbox>
            <Button
              aria-expanded={advanced}
              icon={ChevronDown}
              onClick={() => setAdvanced(!advanced)}
              type="text"
            >
              {copy('advanced')}
            </Button>
            {advanced ? (
              <Flexbox gap={16}>
                <FieldShell label={copy('authentication')}>
                  <SelectField
                    aria-label={copy('authentication')}
                    onValueChange={(authentication) =>
                      set('authentication', authentication)
                    }
                    options={[
                      { label: 'client_secret_post', value: 'post' },
                      { label: 'client_secret_basic', value: 'basic' },
                    ]}
                    value={draft.authentication ?? 'post'}
                  />
                </FieldShell>
                <Text type="secondary">{copy('profileHelp')}</Text>
                {(
                  [
                    ['id', 'subject'],
                    ['email', 'email'],
                    ['name', 'profileName'],
                    ['image', 'image'],
                    ['emailVerified', 'emailVerified'],
                  ] as const
                ).map(([key, label]) => (
                  <FieldShell key={key} label={copy(label)}>
                    <Input
                      aria-label={copy(label)}
                      onChange={(event) =>
                        set('profile', {
                          ...draft.profile,
                          [key]: event.target.value,
                        })
                      }
                      value={draft.profile?.[key] ?? ''}
                    />
                  </FieldShell>
                ))}
              </Flexbox>
            ) : null}
            <Text type="secondary">{copy('inviteOnly')}</Text>
          </Flexbox>
        ) : null}
      </Drawer>
    </section>
  )
}
