import {
  $toggleSpoilerSelection,
  collectCommandItems,
} from '@haklex/rich-editor/commands'
import type { BlockType } from '@haklex/rich-plugin-toolbar'
import {
  applyBlockType,
  applyFontFamily,
  FONT_FAMILIES,
  getFontLabel,
  useToolbarState,
} from '@haklex/rich-plugin-toolbar'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { createStaticStyles } from '@lobehub/ui'
import {
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from 'lexical'
import type { LucideIcon } from 'lucide-react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Bug,
  ChevronDown,
  Code,
  EyeOff,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  MoreHorizontal,
  Pilcrow,
  Redo,
  Strikethrough,
  Type,
  Underline,
  Undo,
} from 'lucide-react'
import {
  Fragment,
  type ReactNode,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { DropdownMenu } from '~/ui/overlay/dropdown-menu'
import { Button } from '~/ui/site-button'
import { cn } from '~/utils/cn'

import { EditorDebugDialog } from './EditorDebugDialog'

const lobeStyles = createStaticStyles(({ css, cssVar }) => ({
  u783b0d9d: css`
    width: 14px;
    height: 14px;
  `,
  u90665ca6: css`
    font-style: italic;
  `,
  uc82b67c8: css`
    text-decoration: underline;
  `,
  u2f41b8fa: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;
    border-radius: ${cssVar.borderRadius};

    color: ${cssVar.colorText};

    &:hover {
      background-color: ${cssVar.colorFillTertiary};
    }

    &[data-popup-open] {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  uc79576d9: css`
    &[aria-pressed='true'] {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  debug: css`
    position: absolute;
    inset-block: 0;
    inset-inline-end: 8px;

    height: 32px;
    margin-block: auto;
  `,
  u8ffe2f5b: css`
    flex-shrink: 0;
    width: 1px;
    height: 16px;
    margin-inline: 4px;
    background-color: ${cssVar.colorBorderSecondary};
  `,
  ucd87796a: css`
    display: inline-flex;
    flex-shrink: 0;
    gap: 4px;
    align-items: center;

    height: 32px;
    padding-inline: 8px;
    border-radius: ${cssVar.borderRadius};

    font-size: ${cssVar.fontSize};
    line-height: ${cssVar.lineHeight};
    color: ${cssVar.colorText};

    transition:
      color 0.15s ease,
      background-color 0.15s ease;

    &:hover {
      color: ${cssVar.colorText};
      background-color: ${cssVar.colorFillTertiary};
    }

    &[data-popup-open] {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  ub481f7c2: css`
    flex-shrink: 0;
    width: 14px;
    height: 14px;
  `,
  uf283ea9b: css`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  u1097ae67: css`
    width: 12px;
    height: 12px;
    opacity: 0.6;
  `,
  u85d2070d: css`
    min-width: 10rem;
  `,
  u6a9cae37: css`
    min-width: 8rem;
  `,
  u359090c2: css`
    gap: 8px;
  `,
  ucfc6e672: css`
    font-weight: 500;
    color: ${cssVar.colorText};
  `,
  ue8f85260: css`
    min-width: 11rem;
  `,
  u68f02d14: css`
    position: sticky;
    z-index: 10;
    inset-block-start: 0;

    display: flex;
    flex-wrap: nowrap;
    gap: 2px;
    align-items: center;
    justify-content: center;

    box-sizing: border-box;
    width: 100%;
    height: 48px;
    min-width: 0;
    padding-inline: 8px;
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};

    background-color: ${cssVar.colorBgContainer};
  `,
  u9580bd2e: css`
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 14px;
    height: 14px;

    & > svg {
      width: 14px;
      height: 14px;
    }
  `,
  slot: css`
    display: inline-flex;
    flex: none;
    align-items: center;
  `,
  withDebug: css`
    padding-inline-end: 44px;
  `,
  ub893c6dc: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 14px;
    height: 14px;

    & > svg {
      width: 14px;
      height: 14px;
    }
  `,
}))

interface ToolbarSlot {
  key: string
  bar: ReactNode
  leadingDivider?: boolean
  menu: ReactNode
}

interface BlockOption {
  type: BlockType
  label: string
  icon: LucideIcon
}

const BLOCK_OPTIONS: BlockOption[] = [
  { type: 'paragraph', label: '正文', icon: Pilcrow },
  { type: 'h1', label: '标题 1', icon: Heading1 },
  { type: 'h2', label: '标题 2', icon: Heading2 },
  { type: 'h3', label: '标题 3', icon: Heading3 },
]

const ALIGN_OPTIONS: Array<{
  format: 'left' | 'center' | 'right' | 'justify'
  label: string
  icon: LucideIcon
}> = [
  { format: 'left', label: '左对齐', icon: AlignLeft },
  { format: 'center', label: '居中', icon: AlignCenter },
  { format: 'right', label: '右对齐', icon: AlignRight },
  { format: 'justify', label: '两端对齐', icon: AlignJustify },
]

export function EditorToolbar(props: { className?: string }) {
  const [editor] = useLexicalComposerContext()
  const state = useToolbarState()
  const activeBlock =
    BLOCK_OPTIONS.find((option) => option.type === state.blockType) ??
    BLOCK_OPTIONS[0]
  const ActiveBlockIcon = activeBlock.icon

  const insertItems = useMemo(
    () =>
      collectCommandItems(editor).filter(
        (item) =>
          item.placement?.includes('toolbar') && item.group === 'insert',
      ),
    [editor],
  )
  const slots = useMemo<ToolbarSlot[]>(() => {
    const icon = (entry: {
      key: string
      active?: boolean
      disabled?: boolean
      icon: LucideIcon | null
      iconNode?: ReactNode
      label: string
      leadingDivider?: boolean
      shortcut?: string
      onClick: () => void
    }): ToolbarSlot => ({
      key: entry.key,
      leadingDivider: entry.leadingDivider,
      bar: (
        <ToolbarIconButton
          active={entry.active}
          disabled={entry.disabled}
          icon={entry.icon}
          iconNode={entry.iconNode}
          label={entry.label}
          onClick={entry.onClick}
          shortcut={entry.shortcut}
        />
      ),
      menu: (
        <ToolbarMenuItem onClick={entry.onClick}>
          <SlotIcon icon={entry.icon} iconNode={entry.iconNode} />
          {entry.label}
        </ToolbarMenuItem>
      ),
    })

    return [
      {
        key: 'font',
        bar: <FontFamilyMenu activeValue={state.fontFamily} editor={editor} />,
        menu: FONT_FAMILIES.map((def) => (
          <ToolbarMenuItem
            active={state.fontFamily === def.value}
            key={def.label}
            onClick={() => applyFontFamily(editor, def.value)}
          >
            {def.label}
          </ToolbarMenuItem>
        )),
      },
      {
        key: 'block',
        leadingDivider: true,
        bar: (
          <BlockMenu activeIcon={ActiveBlockIcon} label={activeBlock.label}>
            {BLOCK_OPTIONS.map((option) => {
              const Icon = option.icon
              return (
                <ToolbarMenuItem
                  active={state.blockType === option.type}
                  key={option.type}
                  onClick={() => applyBlockType(editor, option.type)}
                >
                  <Icon aria-hidden className={lobeStyles.u783b0d9d} />
                  {option.label}
                </ToolbarMenuItem>
              )
            })}
          </BlockMenu>
        ),
        menu: BLOCK_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <ToolbarMenuItem
              active={state.blockType === option.type}
              key={option.type}
              onClick={() => applyBlockType(editor, option.type)}
            >
              <Icon aria-hidden className={lobeStyles.u783b0d9d} />
              {option.label}
            </ToolbarMenuItem>
          )
        }),
      },
      icon({
        key: 'undo',
        leadingDivider: true,
        disabled: !state.canUndo,
        icon: Undo,
        label: '撤销',
        onClick: () => editor.dispatchCommand(UNDO_COMMAND, undefined),
        shortcut: '⌘Z',
      }),
      icon({
        key: 'redo',
        disabled: !state.canRedo,
        icon: Redo,
        label: '重做',
        onClick: () => editor.dispatchCommand(REDO_COMMAND, undefined),
        shortcut: '⌘⇧Z',
      }),
      icon({
        key: 'bold',
        leadingDivider: true,
        active: state.isBold,
        icon: Bold,
        label: '粗体',
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold'),
        shortcut: '⌘B',
      }),
      icon({
        key: 'italic',
        active: state.isItalic,
        icon: Italic,
        label: '斜体',
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic'),
        shortcut: '⌘I',
      }),
      icon({
        key: 'underline',
        active: state.isUnderline,
        icon: Underline,
        label: '下划',
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline'),
        shortcut: '⌘U',
      }),
      icon({
        key: 'strike',
        active: state.isStrikethrough,
        icon: Strikethrough,
        label: '删除线',
        onClick: () =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough'),
      }),
      icon({
        key: 'code',
        active: state.isCode,
        icon: Code,
        label: '行内代码',
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),
      }),
      icon({
        key: 'highlight',
        leadingDivider: true,
        active: state.isHighlight,
        icon: Highlighter,
        label: '高亮',
        onClick: () => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight'),
      }),
      icon({
        key: 'spoiler',
        active: state.isSpoiler,
        icon: EyeOff,
        label: '剧透遮罩',
        onClick: () => editor.update($toggleSpoilerSelection),
      }),
      icon({
        key: 'bullet',
        leadingDivider: true,
        active: state.blockType === 'bullet',
        icon: List,
        label: '无序列表',
        onClick: () => applyBlockType(editor, 'bullet'),
      }),
      icon({
        key: 'number',
        active: state.blockType === 'number',
        icon: ListOrdered,
        label: '有序列表',
        onClick: () => applyBlockType(editor, 'number'),
      }),
      icon({
        key: 'check',
        active: state.blockType === 'check',
        icon: ListChecks,
        label: '待办列表',
        onClick: () => applyBlockType(editor, 'check'),
      }),
      {
        key: 'align',
        leadingDivider: true,
        bar: (
          <AlignMenu
            activeFormat={state.elementFormat || 'left'}
            onSelect={(format) =>
              editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format)
            }
          />
        ),
        menu: ALIGN_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <ToolbarMenuItem
              active={(state.elementFormat || 'left') === option.format}
              key={option.format}
              onClick={() =>
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, option.format)
              }
            >
              <Icon aria-hidden className={lobeStyles.u783b0d9d} />
              {option.label}
            </ToolbarMenuItem>
          )
        }),
      },
      ...insertItems.map((item, index) =>
        icon({
          key: `insert:${item.title}`,
          icon: null,
          iconNode: item.icon,
          label: item.title,
          leadingDivider: index === 0,
          onClick: () => item.onSelect(editor, ''),
          shortcut: item.shortcut,
        }),
      ),
    ]
  }, [
    ActiveBlockIcon,
    activeBlock.label,
    editor,
    insertItems,
    state.blockType,
    state.canRedo,
    state.canUndo,
    state.elementFormat,
    state.fontFamily,
    state.isBold,
    state.isCode,
    state.isHighlight,
    state.isItalic,
    state.isSpoiler,
    state.isStrikethrough,
    state.isUnderline,
  ])
  const barRef = useRef<HTMLDivElement>(null)
  const widths = useRef(new Map<string, number>())
  const [visibleCount, setVisibleCount] = useState(slots.length)
  const [debugJson, setDebugJson] = useState<string | null>(null)

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return

    const measure = () => {
      if (bar.clientWidth === 0) {
        setVisibleCount(slots.length)
        return
      }
      for (const el of bar.querySelectorAll<HTMLElement>(
        '[data-toolbar-item]',
      )) {
        const key = el.dataset.toolbarItem
        if (key && el.offsetWidth > 0) widths.current.set(key, el.offsetWidth)
      }
      const style = getComputedStyle(bar)
      const available =
        bar.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight)
      const gap = 2
      const more = 32 + gap
      let used = 0
      let next = slots.length
      for (let index = 0; index < slots.length; index += 1) {
        const width = widths.current.get(slots[index].key)
        if (!width) {
          next = slots.length
          break
        }
        const reserve = index === slots.length - 1 ? 0 : more
        if (used + width > available - reserve) {
          next = index
          break
        }
        used += width + gap
      }
      setVisibleCount((current) => (current === next ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(bar)
    return () => observer.disconnect()
  }, [slots])

  const shown = slots.slice(0, visibleCount)
  const overflow = slots.slice(visibleCount)

  return (
    <>
      <div
        aria-label="编辑器工具栏"
        className={cn(
          lobeStyles.u68f02d14,
          import.meta.env.DEV && lobeStyles.withDebug,
          props.className,
        )}
        ref={barRef}
        role="toolbar"
      >
        {shown.map((slot) => (
          <span
            className={lobeStyles.slot}
            data-toolbar-item={slot.key}
            key={slot.key}
          >
            {slot.leadingDivider ? <ToolbarDivider /> : null}
            {slot.bar}
          </span>
        ))}
        {overflow.length > 0 ? (
          <DropdownMenu>
            <DropdownMenu.Trigger>
              <button
                aria-label="更多"
                className={lobeStyles.u2f41b8fa}
                title="更多"
                type="button"
              >
                <MoreHorizontal aria-hidden size={14} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end" className={lobeStyles.ue8f85260}>
              {overflow.map((slot) => (
                <Fragment key={slot.key}>{slot.menu}</Fragment>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu>
        ) : null}
        {import.meta.env.DEV ? (
          <Button
            aria-label="调试 · 导出 Editor State"
            className={lobeStyles.debug}
            icon={Bug}
            onClick={() => {
              setDebugJson(
                JSON.stringify(editor.getEditorState().toJSON(), null, 2),
              )
            }}
            onMouseDown={(event) => event.preventDefault()}
            title="调试 · 导出 Editor State"
            type="text"
          />
        ) : null}
      </div>
      {import.meta.env.DEV ? (
        <EditorDebugDialog
          json={debugJson}
          onClose={() => setDebugJson(null)}
        />
      ) : null}
    </>
  )
}

function ToolbarIconButton(props: {
  active?: boolean
  disabled?: boolean
  icon: LucideIcon | null
  iconNode?: ReactNode
  label: string
  shortcut?: string
  onClick: () => void
}) {
  const Icon = props.icon
  return (
    <Button
      aria-label={props.label}
      aria-pressed={props.active}
      className={props.active ? lobeStyles.uc79576d9 : undefined}
      disabled={props.disabled}
      icon={
        Icon ?? (
          <span aria-hidden className={lobeStyles.u9580bd2e}>
            {props.iconNode}
          </span>
        )
      }
      onClick={props.onClick}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      title={
        props.shortcut ? `${props.label} (${props.shortcut})` : props.label
      }
      type="text"
    />
  )
}

function ToolbarDivider() {
  return <div aria-hidden="true" className={lobeStyles.u8ffe2f5b} />
}

const toolbarTriggerClass = lobeStyles.ucd87796a

function BlockMenu(props: {
  activeIcon: LucideIcon
  label: string
  children: ReactNode
}) {
  const Icon = props.activeIcon
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger className={toolbarTriggerClass} type="button">
        <Icon aria-hidden="true" className={lobeStyles.ub481f7c2} />
        <span className={lobeStyles.uf283ea9b}>{props.label}</span>
        <ChevronDown aria-hidden="true" className={lobeStyles.u1097ae67} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className={lobeStyles.u85d2070d}>
        {props.children}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

function AlignMenu(props: {
  activeFormat: string
  onSelect: (format: (typeof ALIGN_OPTIONS)[number]['format']) => void
}) {
  const active =
    ALIGN_OPTIONS.find((option) => option.format === props.activeFormat) ??
    ALIGN_OPTIONS[0]
  const Icon = active.icon
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        aria-label={`对齐：${active.label}`}
        className={toolbarTriggerClass}
        title="对齐"
        type="button"
      >
        <Icon aria-hidden="true" className={lobeStyles.ub481f7c2} />
        <ChevronDown aria-hidden="true" className={lobeStyles.u1097ae67} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className={lobeStyles.u85d2070d}>
        {ALIGN_OPTIONS.map((option) => {
          const OptionIcon = option.icon
          return (
            <ToolbarMenuItem
              active={option.format === active.format}
              key={option.format}
              onClick={() => props.onSelect(option.format)}
            >
              <OptionIcon aria-hidden="true" className={lobeStyles.u783b0d9d} />
              {option.label}
            </ToolbarMenuItem>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

function FontFamilyMenu(props: {
  activeValue: string
  editor: ReturnType<typeof useLexicalComposerContext>[0]
}) {
  const label = getFontLabel(props.activeValue)
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        aria-label="字体"
        className={toolbarTriggerClass}
        title="字体"
        type="button"
      >
        <Type aria-hidden="true" className={lobeStyles.ub481f7c2} />
        <span className={lobeStyles.uf283ea9b}>{label}</span>
        <ChevronDown aria-hidden="true" className={lobeStyles.u1097ae67} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content className={lobeStyles.u6a9cae37}>
        {FONT_FAMILIES.map((def) => {
          return (
            <ToolbarMenuItem
              key={def.label}
              active={props.activeValue === def.value}
              onClick={() => applyFontFamily(props.editor, def.value)}
            >
              {def.label}
            </ToolbarMenuItem>
          )
        })}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}

function ToolbarMenuItem(props: {
  active?: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <DropdownMenu.Item
      className={cn(lobeStyles.u359090c2, props.active && lobeStyles.ucfc6e672)}
      onClick={props.onClick}
    >
      {props.children}
    </DropdownMenu.Item>
  )
}

function SlotIcon(props: { icon: LucideIcon | null; iconNode?: ReactNode }) {
  if (props.icon) {
    const Icon = props.icon
    return <Icon aria-hidden className={lobeStyles.u783b0d9d} />
  }
  return (
    <span aria-hidden className={lobeStyles.u9580bd2e}>
      {props.iconNode}
    </span>
  )
}
