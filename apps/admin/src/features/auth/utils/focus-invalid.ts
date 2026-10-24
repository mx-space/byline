export function focusInvalid(root: HTMLElement | null) {
  window.setTimeout(() => {
    root?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, 0)
}
