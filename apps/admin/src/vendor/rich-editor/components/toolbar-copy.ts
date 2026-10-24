import { createFeatureCopy } from '~/i18n/feature-copy'

export const toolbarCopy = createFeatureCopy({
  align: { 'en-US': 'Align', 'zh-CN': '对齐' },
  alignActive: { 'en-US': 'Align: {label}', 'zh-CN': '对齐：{label}' },
  alignCenter: { 'en-US': 'Center', 'zh-CN': '居中' },
  alignJustify: { 'en-US': 'Justify', 'zh-CN': '两端对齐' },
  alignLeft: { 'en-US': 'Align left', 'zh-CN': '左对齐' },
  alignRight: { 'en-US': 'Align right', 'zh-CN': '右对齐' },
  blockH1: { 'en-US': 'Heading 1', 'zh-CN': '标题 1' },
  blockH2: { 'en-US': 'Heading 2', 'zh-CN': '标题 2' },
  blockH3: { 'en-US': 'Heading 3', 'zh-CN': '标题 3' },
  blockParagraph: { 'en-US': 'Text', 'zh-CN': '正文' },
  bold: { 'en-US': 'Bold', 'zh-CN': '粗体' },
  bullet: { 'en-US': 'Bulleted list', 'zh-CN': '无序列表' },
  check: { 'en-US': 'To-do list', 'zh-CN': '待办列表' },
  code: { 'en-US': 'Inline code', 'zh-CN': '行内代码' },
  debug: {
    'en-US': 'Debug · Export editor state',
    'zh-CN': '调试 · 导出 Editor State',
  },
  font: { 'en-US': 'Font', 'zh-CN': '字体' },
  fontDefault: { 'en-US': 'Default', 'zh-CN': '默认' },
  fontHei: { 'en-US': 'Sans (CJK)', 'zh-CN': '黑体' },
  fontKai: { 'en-US': 'Kai (CJK)', 'zh-CN': '楷体' },
  fontSong: { 'en-US': 'Serif (CJK)', 'zh-CN': '宋体' },
  highlight: { 'en-US': 'Highlight', 'zh-CN': '高亮' },
  italic: { 'en-US': 'Italic', 'zh-CN': '斜体' },
  more: { 'en-US': 'More', 'zh-CN': '更多' },
  number: { 'en-US': 'Numbered list', 'zh-CN': '有序列表' },
  redo: { 'en-US': 'Redo', 'zh-CN': '重做' },
  spoiler: { 'en-US': 'Spoiler', 'zh-CN': '剧透遮罩' },
  strike: { 'en-US': 'Strikethrough', 'zh-CN': '删除线' },
  toolbar: { 'en-US': 'Editor toolbar', 'zh-CN': '编辑器工具栏' },
  underline: { 'en-US': 'Underline', 'zh-CN': '下划线' },
  undo: { 'en-US': 'Undo', 'zh-CN': '撤销' },
})

export type ToolbarCopyKey = Parameters<typeof toolbarCopy>[1]

// haklex ships its font labels in Chinese only; map them by label so the
// remaining Latin labels (Sans, Serif, Mono) pass through unchanged.
const FONT_LABEL_KEYS: Record<string, ToolbarCopyKey> = {
  宋体: 'fontSong',
  楷体: 'fontKai',
  默认: 'fontDefault',
  黑体: 'fontHei',
}

export function fontLabelKey(label: string): ToolbarCopyKey | undefined {
  return FONT_LABEL_KEYS[label]
}
