import { Rocket } from 'lucide-react'

import { useI18n } from '~/i18n'

import { primaryButtonClassName } from '../constants'

export function SetupStartStep(props: { onNext: () => void }) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="mb-4 flex size-24 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md">
        <Rocket aria-hidden="true" className="size-12" />
      </div>

      <p className="mb-4 text-center text-sm text-white/80">
        {t('setup.start.description')}
      </p>

      <div className="flex w-full max-w-xs gap-3">
        <button
          className={`${primaryButtonClassName} flex-1`}
          onClick={props.onNext}
          type="button"
        >
          {t('setup.start.beginButton')}
        </button>
      </div>
    </div>
  )
}
