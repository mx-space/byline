import { Avatar } from '@lobehub/ui'

export function UserAvatar(props: {
  avatar?: string | null
  className?: string
  name?: string | null
  size?: number
}) {
  const name = props.name?.trim()
  return (
    <Avatar
      alt=""
      avatar={props.avatar?.trim() || undefined}
      className={props.className}
      shape="circle"
      size={props.size ?? 24}
      title={name || undefined}
    />
  )
}
