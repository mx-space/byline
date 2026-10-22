import type { ReactNode } from 'react'

import {
  authBackdropClassName,
  authBackdropStyle,
  authCardClassName,
  authDescriptionClassName,
  authIconTileClassName,
  authTitleClassName,
} from '~/lib/auth-backdrop'
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
      <section
        className={cn(authCardClassName, 'flex max-w-sm flex-col items-center')}
      >
        <div className={authIconTileClassName}>
          <img
            alt=""
            className="size-full object-cover"
            decoding="async"
            src={faviconUrl}
          />
        </div>
        <h1 className={cn(authTitleClassName, 'mt-4 text-center')}>
          {props.title}
        </h1>
        {props.subtitle ? (
          <p className={cn(authDescriptionClassName, 'mt-1 text-center')}>
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

export const authFormClassName = 'flex w-full flex-col gap-3'

export const authLinkClassName =
  'text-sm text-accent transition-colors hover:text-accent-hover focus-visible:outline-hidden focus-visible:underline'
