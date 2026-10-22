import type { ReactNode } from 'react'

import { authBackdropStyle } from '~/lib/auth-backdrop'

import faviconUrl from '../../../../favicon.png'

export function AuthScreen(props: {
  children: ReactNode
  subtitle?: ReactNode
  title: ReactNode
}) {
  return (
    <main
      className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-neutral-950 p-4 text-white"
      style={authBackdropStyle}
    >
      <section className="flex w-full max-w-sm flex-col items-center">
        <img
          alt=""
          className="mb-4 size-16 rounded-xl shadow-2xl ring-4 ring-white/20"
          decoding="async"
          src={faviconUrl}
        />
        <h1 className="text-xl font-medium tracking-wide drop-shadow-lg">
          {props.title}
        </h1>
        {props.subtitle ? (
          <p className="mt-1 text-center text-sm text-white/70">
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
  'h-[38px] rounded-full border-0 bg-white/20 px-4 text-center text-sm text-white backdrop-blur-md placeholder:text-white/60 focus:bg-white/25 focus:ring-2 focus:ring-white/50 dark:border-0 dark:bg-white/20 dark:text-white'

export const authPrimaryButtonClassName =
  'h-[38px] w-full rounded-full bg-white/90 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-60'
