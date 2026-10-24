import { type ClassValue, clsx } from 'clsx'

export function cn(...values: ClassValue[]) {
  return clsx(values)
}
