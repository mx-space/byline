import { createStaticStyles } from '@lobehub/ui'
import { GitCompare, Trash2 } from 'lucide-react'

import { MarkdownDraftDiffPanel } from '~/features/drafts/components/MarkdownDraftDiffPanel'
import { RichDraftDiffPanel } from '~/features/drafts/components/RichDraftDiffPanel'
import { useI18n } from '~/i18n'
import { Drawer } from '~/ui/feedback/drawer'
import { Button } from '~/ui/primitives/button'
import { Scroll } from '~/ui/primitives/scroll'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  ue6f9e383: css`
    background-color: ${cssVar.colorBgLayout};
  `,
  uff93a1b1: css`
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  `,
  u42ba6474: css`
    color: ${cssVar.colorError};
    &:hover {
      color: ${cssVar.colorError};
    }
    :where(.dark, .dark *) & {
      color: ${cssVar.colorError};
    }
  `,
  uf7b5fa97: css`
    width: 1rem;
    height: 1rem;
  `,
  ue9e5f444: css`
    width: 100%;
    @media (min-width: 640px) {
      width: min(92vw, 68rem);
    }
  `,
  u2b5fa9a9: css`
    min-height: 0px;
    flex: 1 1 0%;
  `,
  u5fa36126: css`
    margin-inline: auto;
    display: flex;
    width: 100%;
    max-width: 64rem;
    flex-direction: column;
    gap: 1.5rem;
    padding: 1rem;
    @media (min-width: 640px) {
      padding: 1.5rem;
    }
  `,
  ue94b0810: css`
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
    padding: 1rem;
  `,
  ufa2251b6: css`
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u49976468: css`
    margin-top: 0.25rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u22f13c98: css`
    margin-bottom: 0.5rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  u2ee7eb51: css`
    overflow: hidden;
    border-radius: 12px;
    border-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorBgContainer};
  `,
  u51eb3793: css`
    display: grid;
    grid-template-columns: minmax(7rem, 0.7fr) _repeat(3, minmax(0, 1fr));
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  ue48f419d: css`
    display: grid;
    grid-template-columns: minmax(7rem, 0.7fr) _minmax(0, 1fr) _minmax(0, 1fr);
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    background-color: ${cssVar.colorFillSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.5rem;
    font-size: 0.625rem;
    line-height: 0.875rem;
    font-weight: 500;
    color: ${cssVar.colorTextSecondary};
  `,
  u41c7b4f4: css`
    display: grid;
    grid-template-columns: minmax(7rem, 0.7fr) _repeat(3, minmax(0, 1fr));
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    &:last-child {
      border-bottom-width: 0px;
      border-style: solid;
    }
  `,
  u54bce6c5: css`
    display: grid;
    grid-template-columns: minmax(7rem, 0.7fr) _minmax(0, 1fr) _minmax(0, 1fr);
    border-bottom-width: 1px;
    border-style: solid;
    border-color: ${cssVar.colorBorderSecondary};
    padding-inline: 0.75rem;
    padding-block: 0.75rem;
    font-size: 0.75rem;
    line-height: 1.125rem;
    &:last-child {
      border-bottom-width: 0px;
      border-style: solid;
    }
  `,
  u61324a98: css`
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  uf37a9b73: css`
    min-width: 0px;
    overflow-wrap: break-word;
    padding-right: 0.75rem;
    color: ${cssVar.colorTextSecondary};
  `,
  u3edd0de0: css`
    min-width: 0px;
    overflow-wrap: break-word;
    color: ${cssVar.colorText};
  `,
  u440b6d1a: css`
    display: grid;
    gap: 1rem;
    @media (min-width: 1024px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  `,
}))

export interface DraftRecoveryField {
  ancestor?: string
  current: string
  draft: string
  label: string
}

export interface DraftRecoveryReviewData {
  ancestorContent?: string
  ancestorText?: string
  bodyChanged: boolean
  currentContent?: string
  currentText: string
  draftContent?: string
  draftText: string
  fields: DraftRecoveryField[]
  diverged: boolean
  rich: boolean
  savedAt: string
}

export function DraftRecoveryReview(props: {
  data: DraftRecoveryReviewData | null
  onClose: () => void
  onContinue: () => void
  onDelete: () => void
  open: boolean
}) {
  const { t } = useI18n()
  const data = props.data

  return (
    <Drawer
      bodyClassName={lobeStyles.ue6f9e383}
      footer={
        <div className={lobeStyles.uff93a1b1}>
          <Button
            className={lobeStyles.u42ba6474}
            onClick={props.onDelete}
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" className={lobeStyles.uf7b5fa97} />
            {t('write.recovery.deleteAction')}
          </Button>
          <Button onClick={props.onContinue} type="button">
            {t('write.recovery.continueAction')}
          </Button>
        </div>
      }
      icon={GitCompare}
      onClose={props.onClose}
      open={props.open}
      title={t('write.recovery.review.title')}
      widthClassName={lobeStyles.ue9e5f444}
    >
      {data ? (
        <Scroll className={lobeStyles.u2b5fa9a9}>
          <div className={lobeStyles.u5fa36126}>
            <section className={lobeStyles.ue94b0810}>
              <p className={lobeStyles.ufa2251b6}>
                {t('write.recovery.review.summary', {
                  body: data.bodyChanged
                    ? t('write.recovery.review.bodyChanged')
                    : t('write.recovery.review.bodyUnchanged'),
                  count: data.fields.length,
                })}
              </p>
              <p className={lobeStyles.u49976468}>
                {t('write.recovery.review.savedAt', { time: data.savedAt })}
              </p>
            </section>

            {data.fields.length ? (
              <section>
                <h3 className={lobeStyles.u22f13c98}>
                  {t('write.recovery.review.fieldsTitle')}
                </h3>
                <div className={lobeStyles.u2ee7eb51}>
                  <div
                    className={
                      data.diverged
                        ? lobeStyles.u51eb3793
                        : lobeStyles.ue48f419d
                    }
                  >
                    <span>{t('write.recovery.review.field')}</span>
                    {data.diverged ? (
                      <span>{t('write.recovery.review.ancestor')}</span>
                    ) : null}
                    <span>{t('write.recovery.review.current')}</span>
                    <span>{t('write.recovery.review.draft')}</span>
                  </div>
                  {data.fields.map((field) => (
                    <div
                      className={
                        data.diverged
                          ? lobeStyles.u41c7b4f4
                          : lobeStyles.u54bce6c5
                      }
                      key={field.label}
                    >
                      <span className={lobeStyles.u61324a98}>
                        {field.label}
                      </span>
                      {data.diverged ? (
                        <span className={lobeStyles.uf37a9b73}>
                          {field.ancestor || '—'}
                        </span>
                      ) : null}
                      <span className={lobeStyles.uf37a9b73}>
                        {field.current || '—'}
                      </span>
                      <span className={lobeStyles.u3edd0de0}>
                        {field.draft || '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {data.bodyChanged ? (
              <section>
                <h3 className={lobeStyles.u22f13c98}>
                  {t('write.recovery.review.bodyTitle')}
                </h3>
                {data.diverged && data.ancestorText !== undefined ? (
                  <div className={lobeStyles.u440b6d1a}>
                    {data.rich &&
                    data.ancestorContent &&
                    data.currentContent &&
                    data.draftContent ? (
                      <>
                        <RichDraftDiffPanel
                          comparisonLabel={t(
                            'write.recovery.review.ancestorToOnline',
                          )}
                          currentContent={data.currentContent}
                          selectedContent={data.ancestorContent}
                        />
                        <RichDraftDiffPanel
                          comparisonLabel={t(
                            'write.recovery.review.ancestorToDraft',
                          )}
                          currentContent={data.draftContent}
                          selectedContent={data.ancestorContent}
                        />
                      </>
                    ) : (
                      <>
                        <MarkdownDraftDiffPanel
                          comparisonLabel={t(
                            'write.recovery.review.ancestorToOnline',
                          )}
                          currentLabel={t('write.recovery.review.currentFile')}
                          currentText={data.currentText}
                          selectedLabel={t(
                            'write.recovery.review.ancestorFile',
                          )}
                          selectedText={data.ancestorText}
                        />
                        <MarkdownDraftDiffPanel
                          comparisonLabel={t(
                            'write.recovery.review.ancestorToDraft',
                          )}
                          currentLabel={t('write.recovery.review.draftFile')}
                          currentText={data.draftText}
                          selectedLabel={t(
                            'write.recovery.review.ancestorFile',
                          )}
                          selectedText={data.ancestorText}
                        />
                      </>
                    )}
                  </div>
                ) : data.rich && data.currentContent && data.draftContent ? (
                  <RichDraftDiffPanel
                    comparisonLabel={t('write.recovery.review.direction')}
                    currentContent={data.draftContent}
                    selectedContent={data.currentContent}
                  />
                ) : (
                  <MarkdownDraftDiffPanel
                    comparisonLabel={t('write.recovery.review.direction')}
                    currentLabel={t('write.recovery.review.draftFile')}
                    currentText={data.draftText}
                    selectedLabel={t('write.recovery.review.currentFile')}
                    selectedText={data.currentText}
                  />
                )}
              </section>
            ) : null}
          </div>
        </Scroll>
      ) : null}
    </Drawer>
  )
}
