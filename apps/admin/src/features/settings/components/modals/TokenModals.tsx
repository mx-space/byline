import { createStaticStyles, toast } from '@lobehub/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { useState } from 'react'

import { createToken } from '~/api/auth'
import { useI18n } from '~/i18n'
import type { TokenModel } from '~/models/token'
import { ModalHeader } from '~/ui/feedback/modal'
import { present, useModal } from '~/ui/feedback/modal-imperative'
import { Button } from '~/ui/primitives/button'
import { DateTimePicker } from '~/ui/primitives/datetime-picker'
import { FormSwitch } from '~/ui/primitives/switch'
import { TextInput } from '~/ui/primitives/text-field'

import { accountQueryKey } from '../../constants'
import {
  formatDateTime,
  formatDateTimeInputValue,
  getErrorMessage,
} from '../../utils/settings'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ued384759: css`
    display: flex;
    width: 100%;
    flex-direction: column;
  `,
  u9064cfd6: css`
    & > :not([hidden]) ~ :not([hidden]) {
      margin-top: 1rem;
    }
    padding-inline: 1.25rem;
    padding-block: 1rem;
  `,
  u6efbbc71: css`
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  `,
  u1880b83a: css`
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorSuccessBg};
    background-color: ${cssVar.colorSuccessBg};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorSuccess};
    :where(.dark, .dark *) & {
      border-color: color-mix(in srgb, ${cssVar.colorSuccess} 60%, transparent);
    }
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorSuccess} 30%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorSuccess};
    }
  `,
  udf2bf02a: css`
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  u622ab10e: css`
    color: ${cssVar.colorTextSecondary};
  `,
  u2689f395: css`
    font-weight: 500;
  `,
  uc8b83ca7: css`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorFillSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding: 0.75rem;
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
    :where(.dark, .dark *) & {
      background-color: ${cssVar.colorText};
    }
  `,
  u31b73105: css`
    min-width: 0px;
    flex: 1 1 0%;
    word-break: break-all;
    font-size: 0.625rem;
    line-height: 0.875rem;
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u6bd7f10a: css`
    border-radius: 0.25rem;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorWarningBg};
    background-color: ${cssVar.colorWarningBg};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorWarning};
    :where(.dark, .dark *) & {
      border-color: color-mix(in srgb, ${cssVar.colorWarning} 60%, transparent);
    }
    :where(.dark, .dark *) & {
      background-color: color-mix(
        in srgb,
        ${cssVar.colorWarning} 30%,
        transparent
      );
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorWarning};
    }
  `,
  ub75f6e07: css`
    display: flex;
    justify-content: flex-end;
  `,
}))

function CreateTokenModal() {
  const { t } = useI18n()
  const modal = useModal<TokenModel>()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [expires, setExpires] = useState(formatDateTimeInputValue(new Date()))
  const [expiresEnabled, setExpiresEnabled] = useState(false)

  const mutation = useMutation({
    mutationFn: () =>
      createToken({
        expired: expiresEnabled ? new Date(expires).toISOString() : undefined,
        name,
      }),
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.token.error.create'))),
    onSuccess: async (token) => {
      try {
        await navigator.clipboard.writeText(token.token)
        toast.success(t('settings.token.success.create'))
      } catch {
        toast.success(t('settings.token.success.createNoCopy'))
      }
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
      modal.close(token)
    },
  })

  return (
    <div className={lobeStyles.ued384759}>
      <ModalHeader title={t('settings.token.modal.create')} />
      <form
        className={lobeStyles.u9064cfd6}
        onSubmit={(event) => {
          event.preventDefault()
          if (!name.trim()) {
            toast.warning(t('settings.token.validation.needName'))
            return
          }
          if (expiresEnabled && Number.isNaN(new Date(expires).getTime())) {
            toast.warning(t('settings.token.validation.invalidExpire'))
            return
          }
          mutation.mutate()
        }}
      >
        <TextInput
          label={t('settings.token.field.name')}
          onChange={setName}
          placeholder={t('settings.token.createTokenInputPlaceholder')}
          required
          value={name}
        />
        <FormSwitch
          checked={expiresEnabled}
          label={t('settings.token.field.expireSwitch')}
          onCheckedChange={setExpiresEnabled}
        />
        <DateTimePicker
          disabled={!expiresEnabled}
          label={t('settings.token.field.expire')}
          onChange={setExpires}
          placeholder={t('settings.token.expirePlaceholder')}
          value={expires}
        />
        <div className={lobeStyles.u6efbbc71}>
          <Button
            onClick={() => modal.dismiss()}
            type="button"
            variant="subtle"
          >
            {t('common.cancel')}
          </Button>
          <Button disabled={mutation.isPending} type="submit">
            {t('common.create')}
          </Button>
        </div>
      </form>
    </div>
  )
}

function CreatedTokenModal(props: { token: TokenModel }) {
  const { t } = useI18n()
  const modal = useModal<void>()
  const token = props.token

  return (
    <div className={lobeStyles.ued384759}>
      <ModalHeader title={t('settings.token.modal.createdTitle')} />
      <div className={lobeStyles.u9064cfd6}>
        <div className={lobeStyles.u1880b83a}>
          {t('settings.token.created.success')}
        </div>
        <div className={lobeStyles.udf2bf02a}>
          <span className={lobeStyles.u622ab10e}>
            {t('settings.token.created.nameLabel')}
          </span>
          <span className={lobeStyles.u2689f395}>{token.name}</span>
        </div>
        <div className={lobeStyles.uc8b83ca7}>
          <code className={lobeStyles.u31b73105}>{token.token}</code>
          <Button
            onClick={() => {
              void navigator.clipboard.writeText(token.token)
              toast.success(t('settings.token.created.copyConfirm'))
            }}
            type="button"
            variant="subtle"
          >
            <Copy aria-hidden="true" className={lobeStyles.uf7b5fa97} />
          </Button>
        </div>
        {token.expired ? (
          <div className={lobeStyles.udf2bf02a}>
            <span className={lobeStyles.u622ab10e}>
              {t('settings.token.created.expireAt')}
            </span>
            <span className={lobeStyles.u2689f395}>
              {formatDateTime(String(token.expired))}
            </span>
          </div>
        ) : null}
        <p className={lobeStyles.u6bd7f10a}>
          {t('settings.token.created.hiddenWarning')}
        </p>
        <div className={lobeStyles.ub75f6e07}>
          <Button onClick={() => modal.close()} type="button">
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export async function presentCreateToken() {
  const created = await present<{}, TokenModel>(
    CreateTokenModal,
    {},
    { modalProps: { popupStyle: { width: 'min(92vw, 32rem)' } } },
  )
  if (created) {
    await present(
      CreatedTokenModal,
      { token: created },
      { modalProps: { popupStyle: { width: 'min(92vw, 32rem)' } } },
    )
  }
  return created
}
