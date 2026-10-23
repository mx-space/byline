import { ConfigProvider } from '@lobehub/ui'
import { Form, useForm } from '@lobehub/ui/form'
import * as motion from 'motion/react-m'
import type { ReactNode } from 'react'
import { act, useState } from 'react'
import type { Root } from 'react-dom/client'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { UI_LOCALE_STORAGE_KEY } from '~/constants/keys'
import { I18nProvider } from '~/i18n'

import { SecretInput, SettingRow } from './SettingsPrimitives'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  localStorage.setItem(UI_LOCALE_STORAGE_KEY, 'zh-CN')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  document.body.innerHTML = ''
  localStorage.removeItem(UI_LOCALE_STORAGE_KEY)
})

function FormHarness(props: { children: ReactNode }) {
  const form = useForm()
  return <Form form={form}>{props.children}</Form>
}

function findButton(label: string) {
  return [...document.querySelectorAll('button')].find(
    (button) => button.textContent === label,
  )
}

describe('SecretInput', () => {
  it('masks a stored secret until the user chooses to replace it', async () => {
    const onChange = vi.fn()

    function Harness() {
      const [value, setValue] = useState('')
      return (
        <SecretInput
          onChange={(next) => {
            setValue(next)
            onChange(next)
          }}
          stored
          value={value}
        />
      )
    }

    await act(async () => {
      root.render(
        <ConfigProvider motion={motion}>
          <I18nProvider>
            <Harness />
          </I18nProvider>
        </ConfigProvider>,
      )
    })

    expect(document.querySelector('input')).toBeNull()
    expect(document.body.textContent).toContain('••••••••')

    await act(async () => findButton('替换')?.click())
    expect(document.querySelector('input')).not.toBeNull()

    await act(async () => findButton('取消')?.click())
    expect(document.querySelector('input')).toBeNull()
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('shows the input directly when nothing is stored yet', async () => {
    await act(async () => {
      root.render(
        <ConfigProvider motion={motion}>
          <I18nProvider>
            <SecretInput onChange={() => {}} stored={false} value="" />
          </I18nProvider>
        </ConfigProvider>,
      )
    })

    expect(document.querySelector('input')).not.toBeNull()
    expect(findButton('替换')).toBeUndefined()
  })
})

describe('SettingRow', () => {
  it('offers reset only when a reset handler is passed, and shows the error inline', async () => {
    const onReset = vi.fn()
    await act(async () => {
      root.render(
        <ConfigProvider motion={motion}>
          <I18nProvider>
            <FormHarness>
              <SettingRow desc="每秒最多发送的邮件数。" label="发送速率限制">
                <input readOnly value="10" />
              </SettingRow>
              <SettingRow
                error="Expected number"
                label="SMTP 端口"
                onReset={onReset}
              >
                <input readOnly value="abc" />
              </SettingRow>
            </FormHarness>
          </I18nProvider>
        </ConfigProvider>,
      )
    })

    const resets = document.querySelectorAll<HTMLElement>(
      '[aria-label="恢复默认"]',
    )
    expect(resets).toHaveLength(1)
    expect(document.querySelector('[role="alert"]')?.textContent).toBe(
      'Expected number',
    )

    await act(async () => resets[0]?.click())
    expect(onReset).toHaveBeenCalledOnce()
  })
})
