import type { ReactNode } from 'react'

import { authBackdropClassName, authBackdropStyle } from '~/lib/auth-backdrop'
import { cn } from '~/utils/cn'

import faviconUrl from '../../../../favicon.png'

export function AuthScreen(props: {
  children: ReactNode
  subtitle?: ReactNode
  title: ReactNode
}) {
  return (
    <main
      className={cn(authBackdropClassName, 'flex items-center justify-center')}
      style={authBackdropStyle}
    >
      <section className="flex w-full max-w-sm flex-col items-center">
        <img
          alt=""
          className="mb-4 size-16 rounded-xl shadow-brand"
          decoding="async"
          src={faviconUrl}
        />
        <h1 className="text-xl font-medium tracking-wide">{props.title}</h1>
        {props.subtitle ? (
          <p className="mt-1 text-center text-sm text-fg-muted">
            {props.subtitle}
          </p>
        ) : null}
        <div className="mt-6 flex w-full flex-col items-center">
          {props.children}
        </div>
      </section>
    </main>
  )
}

export const authInputClassName =
  'h-[38px] rounded-full px-4 text-center text-sm focus-visible:ring-accent/25'

export const authPrimaryButtonClassName =
  'h-[38px] w-full rounded-full bg-accent text-sm font-medium text-white shadow-xs transition-colors hover:bg-accent-hover focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-accent/30 disabled:opacity-60'

export const authLinkClassName =
  'text-center text-xs text-fg-muted transition-colors hover:text-fg'
