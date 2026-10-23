import { createStaticStyles, toast } from '@lobehub/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Key, Plus, Trash2 } from 'lucide-react'

import { deleteToken, getTokens } from '~/api/auth'
import { useI18n } from '~/i18n'
import { adminQueryKeys } from '~/query/keys'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'

import { accountQueryKey } from '../../constants'
import { formatDateTime, getErrorMessage } from '../../utils/settings'
import { presentCreateToken } from '../modals/TokenModals'
import { EmptyState } from '../SettingsPrimitives'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  u36e579c0: css`
    flex: 1 1 0%;
  `,
  uf01b33ec: css`
    padding: 1rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    color: ${cssVar.colorTextSecondary};
  `,
  ucc46d0fa: css`
    width: 1.75rem;
    height: 1.75rem;
  `,
  u80b47be2: css`
    & > :not([hidden]) ~ :not([hidden]) {
      border-top-width: 1px;
      border-top-style: solid;
    }
    border-color: ${cssVar.colorFillSecondary};
    :where(.dark, .dark *) & {
      border-color: ${cssVar.colorText};
    }
  `,
  u8e63407b: css`
    padding: 1rem;
  `,
  u0f1761da: css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
  `,
  u7e0b7cdf: css`
    min-width: 0px;
  `,
  ue43bc276: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
  `,
  u63f95d91: css`
    margin-top: 0.5rem;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ${cssVar.fontFamilyCode};
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u6c9dd3b1: css`
    margin-top: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u5e9cc106: css`
    display: flex;
    gap: 0.25rem;
  `,
}))

export function TokenPanelHeaderAction() {
  const { t } = useI18n()
  return (
    <Button
      onClick={() => {
        void presentCreateToken()
      }}
      type="button"
    >
      <Plus aria-hidden="true" className={lobeStyles.uf7b5fa97} />
      {t('settings.token.action.new')}
    </Button>
  )
}

export function TokenPanel() {
  const { t } = useI18n()
  const queryClient = useQueryClient()

  const tokensQuery = useQuery({
    queryFn: getTokens,
    queryKey: adminQueryKeys.settings.tokens(),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteToken,
    onError: (error: unknown) =>
      toast.error(getErrorMessage(error, t('settings.token.error.delete'))),
    onSuccess: async () => {
      toast.success(t('settings.token.success.delete'))
      await queryClient.invalidateQueries({ queryKey: accountQueryKey })
    },
  })

  return (
    <Scroll className={lobeStyles.u36e579c0}>
      {tokensQuery.isLoading ? (
        <div className={lobeStyles.uf01b33ec}>
          {t('settings.common.loading')}
        </div>
      ) : (tokensQuery.data ?? []).length === 0 ? (
        <EmptyState
          icon={<Key className={lobeStyles.ucc46d0fa} />}
          label={t('settings.token.empty')}
        />
      ) : (
        <div className={lobeStyles.u80b47be2}>
          {tokensQuery.data?.map((token) => {
            return (
              <div className={lobeStyles.u8e63407b} key={token.id}>
                <div className={lobeStyles.u0f1761da}>
                  <div className={lobeStyles.u7e0b7cdf}>
                    <h3 className={lobeStyles.ue43bc276}>{token.name}</h3>
                    <p className={lobeStyles.u63f95d91}>{token.token}</p>
                    <p className={lobeStyles.u6c9dd3b1}>
                      {t('settings.token.createdAt', {
                        time: formatDateTime(token.createdAt),
                      })}
                      {token.expired
                        ? t('settings.token.createdExpireAt', {
                            time: formatDateTime(String(token.expired)),
                          })
                        : t('settings.token.createdNeverExpire')}
                    </p>
                  </div>
                  <div className={lobeStyles.u5e9cc106}>
                    <Button
                      onClick={() => {
                        if (
                          window.confirm(
                            t('settings.token.confirm.delete', {
                              name: token.name,
                            }),
                          )
                        ) {
                          deleteMutation.mutate(token.id)
                        }
                      }}
                      type="button"
                      variant="subtle"
                      aria-label={t('common.delete')}
                    >
                      <Trash2
                        aria-hidden="true"
                        className={lobeStyles.uf7b5fa97}
                      />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Scroll>
  )
}
