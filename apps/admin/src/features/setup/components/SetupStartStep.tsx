import { useI18n } from '~/i18n'
import { authDescriptionClassName } from '~/lib/auth-backdrop'
import { Button } from '~/ui/primitives/button'

export function SetupStartStep(props: { onNext: () => void }) {
  const { t } = useI18n()

  return (
    <div>
      <p className={authDescriptionClassName}>{t('setup.start.description')}</p>

      <div className="mt-6 flex justify-end">
        <Button onClick={props.onNext} type="button">
          {t('setup.start.beginButton')}
        </Button>
      </div>
    </div>
  )
}
