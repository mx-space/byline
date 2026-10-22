import { cn } from '~/utils/cn'

export function UserAvatar(props: {
  avatar?: string | null
  className?: string
  name?: string | null
}) {
  const initial = (props.name?.trim() || '?').slice(0, 1).toUpperCase()
  return (
    <span
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-inset text-xs font-medium text-fg-muted',
        props.className,
      )}
    >
      {props.avatar ? (
        <img
          alt=""
          className="size-full object-cover"
          decoding="async"
          src={props.avatar}
        />
      ) : (
        initial
      )}
    </span>
  )
}
