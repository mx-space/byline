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
import type { ReactNode } from 'react'
import { useMemo } from 'react'

import { DropdownMenu } from '~/ui/overlay/dropdown-menu'
import { cn } from '~/utils/cn'

import { presentEditorDebugDialog } from './EditorDebugDialog'

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
  ufb56d9cf: css`
    margin-inline-start: auto;
  `,
  u2f41b8fa: css`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;

    width: 28px;
    height: 28px;
    border-radius: ${cssVar.borderRadiusSM};

    color: ${cssVar.colorTextSecondary};

    transition:
      color 0.15s ease,
      background-color 0.15s ease;

    &:hover {
      color: ${cssVar.colorText};
      background-color: ${cssVar.colorFillTertiary};
    }

    &:disabled {
      pointer-events: none;
      opacity: 0.4;
    }

    &[data-popup-open] {
      background-color: ${cssVar.colorFillSecondary};
    }
  `,
  uc79576d9: css`
    color: ${cssVar.colorText};
    background-color: ${cssVar.colorFillSecondary};
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

    height: 28px;
    padding-inline: 6px;
    border-radius: ${cssVar.borderRadiusSM};

    font-size: ${cssVar.fontSizeSM};
    font-weight: 500;
    line-height: ${cssVar.lineHeightSM};
    color: ${cssVar.colorTextSecondary};

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
    flex-wrap: wrap;
    gap: 2px;
    align-items: center;

    width: 100%;
    padding-block: 6px;
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

const MAX_INLINE_INSERT_ITEMS = 5

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
  const inlineInsertItems = insertItems.slice(0, MAX_INLINE_INSERT_ITEMS)
  const overflowInsertItems = insertItems.slice(MAX_INLINE_INSERT_ITEMS)

  return (
    <div
      aria-label="编辑器工具栏"
      className={cn(lobeStyles.u68f02d14, props.className)}
      role="toolbar"
    >
      <FontFamilyMenu activeValue={state.fontFamily} editor={editor} />

      <ToolbarDivider />

      <BlockMenu activeIcon={ActiveBlockIcon} label={activeBlock.label}>
        {BLOCK_OPTIONS.map((option) => {
          const Icon = option.icon
          return (
            <ToolbarMenuItem
              key={option.type}
              active={state.blockType === option.type}
              onClick={() => applyBlockType(editor, option.type)}
            >
              <Icon aria-hidden="true" className={lobeStyles.u783b0d9d} />
              {option.label}
            </ToolbarMenuItem>
          )
        })}
      </BlockMenu>

      <ToolbarDivider />

      <ToolbarIconButton
        disabled={!state.canUndo}
        icon={Undo}
        label="撤销"
        shortcut="⌘Z"
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      />
      <ToolbarIconButton
        disabled={!state.canRedo}
        icon={Redo}
        label="重做"
        shortcut="⌘⇧Z"
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      />

      <ToolbarDivider />

      <ToolbarIconButton
        active={state.isBold}
        icon={Bold}
        label="粗体"
        shortcut="⌘B"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
      />
      <ToolbarIconButton
        active={state.isItalic}
        icon={Italic}
        label="斜体"
        shortcut="⌘I"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
      />
      <ToolbarIconButton
        active={state.isUnderline}
        icon={Underline}
        label="下划"
        shortcut="⌘U"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
      />
      <ToolbarIconButton
        active={state.isStrikethrough}
        icon={Strikethrough}
        label="删除线"
        onClick={() =>
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')
        }
      />
      <ToolbarIconButton
        active={state.isCode}
        icon={Code}
        label="行内代码"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
      />

      <ToolbarDivider />

      <ToolbarIconButton
        active={state.isHighlight}
        icon={Highlighter}
        label="高亮"
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'highlight')}
      />
      <ToolbarIconButton
        active={state.isSpoiler}
        icon={EyeOff}
        label="剧透遮罩"
        onClick={() => editor.update($toggleSpoilerSelection)}
      />

      <ToolbarDivider />

      <ToolbarIconButton
        active={state.blockType === 'bullet'}
        icon={List}
        label="无序列表"
        onClick={() => applyBlockType(editor, 'bullet')}
      />
      <ToolbarIconButton
        active={state.blockType === 'number'}
        icon={ListOrdered}
        label="有序列表"
        onClick={() => applyBlockType(editor, 'number')}
      />
      <ToolbarIconButton
        active={state.blockType === 'check'}
        icon={ListChecks}
        label="待办列表"
        onClick={() => applyBlockType(editor, 'check')}
      />

      <ToolbarDivider />

      <AlignMenu
        activeFormat={state.elementFormat || 'left'}
        onSelect={(format) =>
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format)
        }
      />

      {insertItems.length > 0 ? (
        <>
          <ToolbarDivider />
          {inlineInsertItems.map((item) => (
            <ToolbarIconButton
              key={item.title}
              icon={null}
              iconNode={item.icon}
              label={item.title}
              shortcut={item.shortcut}
              onClick={() => item.onSelect(editor, '')}
            />
          ))}
          {overflowInsertItems.length > 0 ? (
            <InsertOverflowMenu
              items={overflowInsertItems.map((item) => ({
                icon: item.icon,
                label: item.title,
                onClick: () => item.onSelect(editor, ''),
              }))}
            />
          ) : null}
        </>
      ) : null}

      {import.meta.env.DEV ? (
        <>
          <div aria-hidden="true" className={lobeStyles.ufb56d9cf} />
          <button
            aria-label="调试 · 导出 Editor State"
            className={lobeStyles.u2f41b8fa}
            onClick={() => {
              const json = JSON.stringify(
                editor.getEditorState().toJSON(),
                null,
                2,
              )
              presentEditorDebugDialog(json)
            }}
            title="调试 · 导出 Editor State"
            type="button"
          >
            <Bug aria-hidden="true" className={lobeStyles.u783b0d9d} />
          </button>
        </>
      ) : null}
    </div>
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
    <button
      aria-label={props.label}
      aria-pressed={props.active}
      className={cn(lobeStyles.u2f41b8fa, props.active && lobeStyles.uc79576d9)}
      disabled={props.disabled}
      onMouseDown={(event) => {
        event.preventDefault()
      }}
      onClick={props.onClick}
      title={
        props.shortcut ? `${props.label} (${props.shortcut})` : props.label
      }
      type="button"
    >
      {Icon ? (
        <Icon aria-hidden="true" className={lobeStyles.u783b0d9d} />
      ) : (
        <span aria-hidden="true" className={lobeStyles.u9580bd2e}>
          {props.iconNode}
        </span>
      )}
    </button>
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

function InsertOverflowMenu(props: {
  items: Array<{ icon?: ReactNode; label: string; onClick: () => void }>
}) {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger
        aria-label="更多插入"
        className={lobeStyles.u2f41b8fa}
        title="更多"
        type="button"
      >
        <MoreHorizontal aria-hidden="true" className={lobeStyles.u783b0d9d} />
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="end" className={lobeStyles.ue8f85260}>
        {props.items.map((item) => (
          <ToolbarMenuItem key={item.label} onClick={item.onClick}>
            {item.icon ? (
              <span aria-hidden="true" className={lobeStyles.ub893c6dc}>
                {item.icon}
              </span>
            ) : null}
            {item.label}
          </ToolbarMenuItem>
        ))}
      </DropdownMenu.Content>
    </DropdownMenu>
  )
}
