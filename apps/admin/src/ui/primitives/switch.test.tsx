import { act, createElement, useState } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { FormSwitch, Switch } from './switch'

interface Harness {
  container: HTMLDivElement
  root: Root
  unmount: () => void
}

function mount(): Harness {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  return {
    container,
    root,
    unmount: () => {
      act(() => {
        root.unmount()
      })
      container.remove()
    },
  }
}

function stubReducedMotion() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      onchange: null,
      dispatchEvent: vi.fn(),
    })),
  )
}

let harness: Harness

beforeEach(() => {
  stubReducedMotion()
  harness = mount()
})

afterEach(() => {
  harness.unmount()
  vi.unstubAllGlobals()
})

describe('Switch', () => {
  it('notifies on click', () => {
    const onCheckedChange = vi.fn()
    act(() => {
      harness.root.render(
        createElement(Switch, {
          checked: false,
          onCheckedChange,
        }),
      )
    })

    act(() => {
      harness.container
        .querySelector('[role="switch"]')
        ?.dispatchEvent(
          new MouseEvent('click', { bubbles: true, cancelable: true }),
        )
    })

    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
  })
})

describe('FormSwitch', () => {
  it('toggles from the labeled row', () => {
    function Probe() {
      const [checked, setChecked] = useState(false)
      return createElement(FormSwitch, {
        checked,
        label: 'Public',
        onCheckedChange: setChecked,
      })
    }

    act(() => {
      harness.root.render(createElement(Probe))
    })

    const control = harness.container.querySelector('[role="switch"]')
    expect(control?.getAttribute('aria-checked')).toBe('false')

    act(() => {
      harness.container.querySelector('label')?.click()
    })

    expect(
      harness.container
        .querySelector('[role="switch"]')
        ?.getAttribute('aria-checked'),
    ).toBe('true')
  })
})
