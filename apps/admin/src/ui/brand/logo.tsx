// lobe-design-ignore-file LOBE-RAW-COLOR: brand mark paints (gradient, eyes, pupils) are the supplied asset
import { type SVGProps, useId } from 'react'

import { sx } from '~/styles/sx'

import { styles } from './style'

export type LogoProps = SVGProps<SVGSVGElement> & {
  size?: number | string
}

export function LogoColor({
  size = '1em',
  className,
  style,
  ...rest
}: LogoProps) {
  const uid = useId().replaceAll(':', '')
  const ear = `byline-logo-a-${uid}`
  const body = `byline-logo-b-${uid}`

  return (
    <svg
      aria-hidden
      {...sx(styles.logo, className, style)}
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M8.46 13.226c-2.237.219-4.233-1.084-4.79-2.641-.467-1.286.035-2.423 1.132-2.908.78-.357.972-1.082.473-1.637-.566-.608-1.408-.478-2.075-.09C1.244 7.09.658 9.154 1.392 11.11c.873 2.346 3.604 3.773 6.227 3.62.45-.022.703-.977.842-1.504"
        fill={`url(#${ear})`}
      />
      <ellipse
        cx="12.549"
        cy="15.858"
        fill="currentColor"
        rx="11.451"
        ry="2.831"
      />
      <path
        d="M3.822 14.028C4.43 9.34 6.335 5.814 8.22 6.022c.848.094 1.555.929 2.05 2.248a9 9 0 0 1 2.318-.296c.787 0 1.548.099 2.264.282.498-1.309 1.21-2.137 2.06-2.23 1.905-.211 3.823 3.324 4.421 8.015l.016.005q.04.315.07.64c.1 1.02.128 2.007.094 2.936-2.098.65-5.331 1.068-8.958 1.068-3.6 0-6.813-.411-8.912-1.054a22.6 22.6 0 0 1 .178-3.608"
        fill={`url(#${body})`}
      />
      <path
        d="M11.756 10.608a1.93 1.93 0 0 0-1.12.435c-.846.694-1.108 1.797-1.147 2.743-.058 1.413.86 3.87 2.88 3.89.416.004.913-.224 1.194-.477.832-.751 1.105-1.803 1.083-2.8-.03-1.328-.54-2.985-2.032-3.653-.277-.125-.547-.143-.858-.138m4.826-.525c-1.155.05-1.954 1.205-2.08 2.07.025.25.176.554.245.789.196.673.355 1.89.1 2.562.26.4.357.646.76.997.523.455.88.635 1.628.654 1.753-.199 2.257-2.094 2.261-3.334.005-1.362-.917-3.794-2.915-3.738"
        fill="#fff"
      />
      <path
        d="M12.441 12.186c.771-.084 1.511.687 1.652 1.722.14 1.035-.37 1.942-1.142 2.026-.76.083-1.49-.665-1.645-1.676l1.396-.153-1.318-.935c.18-.543.565-.93 1.057-.984m4.789-.52c.74-.08 1.454.693 1.595 1.728.14 1.035-.346 1.94-1.086 2.02-.73.08-1.433-.67-1.589-1.682l1.34-.146-1.27-.941c.169-.541.537-.928 1.01-.98"
        fill="#000"
      />
      <defs>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={ear}
          x1="6"
          x2="4.93"
          y1="4.238"
          y2="13.983"
        >
          <stop stopColor="#ffc7a8" />
          <stop offset=".32" stopColor="#fa9ba8" />
          <stop offset=".61" stopColor="#ee7099" />
          <stop offset=".84" stopColor="#d1508f" />
          <stop offset="1" stopColor="#a64283" />
        </linearGradient>
        <linearGradient
          gradientUnits="userSpaceOnUse"
          id={body}
          x1="4.624"
          x2="14.779"
          y1="8.197"
          y2="19.592"
        >
          <stop stopColor="#ffc7a8" />
          <stop offset=".32" stopColor="#fa9ba8" />
          <stop offset=".61" stopColor="#ee7099" />
          <stop offset=".84" stopColor="#d1508f" />
          <stop offset="1" stopColor="#a64283" />
        </linearGradient>
      </defs>
    </svg>
  )
}
