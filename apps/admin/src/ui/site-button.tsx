import { Button as LobeButton, type ButtonProps } from '@lobehub/ui'

export type { ButtonProps }

type ButtonType = NonNullable<ButtonProps['type']>

export function Button({ shape = 'round', type, ...props }: ButtonProps) {
  const resolved: ButtonType =
    type === undefined || type === 'default' ? 'fill' : type
  return <LobeButton {...props} shape={shape} type={resolved} />
}
