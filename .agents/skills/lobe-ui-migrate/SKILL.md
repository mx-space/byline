---
name: lobe-ui-migrate
description: >-
  Migrates a React web app from Tailwind, a custom design system, or direct
  @base-ui/react onto @lobehub/ui. Use when the user says 换成 lobe-ui, 去掉
  tailwind, 去掉 base-ui, createStaticStyles, cssVar, ConsoleShell, or asks to
  swap admin atoms, tables, overlays, or toasts to the Lobe stack.
---

# Lobe UI 迁移

把原子层换成 `@lobehub/ui`。业务组合（主从列表、编辑器、修订树、命令面板）留在项目里。

视觉规范走项目已有的 lobe-design。本 skill 只负责换栈时的顺序、对应关系和已经踩过的坑。

## 顺序

1. 装 `@lobehub/ui`，接上主题和 Host，先让应用能开。
2. 控制台壳换成 `ConsoleShell`。路由和页面先不动。
3. 原子用薄包装接上，保留旧 props，页面调用不用逐个改。
4. 样式改成 `createStaticStyles` + `cssVar`。删掉 Tailwind 和任何生成的工具类样式表。
5. 弹层、表格、提示按下面的对应表换。
6. 删掉没人引用的旧组件，并从应用的 `package.json` 去掉直接依赖 `@base-ui/react`。

`@lobehub/ui` 自己依赖 `@base-ui/react`，锁文件里可以留下。应用源码不能再 `import '@base-ui/react/...'`。

## 主题

应用根导入一次：

```ts
import '@lobehub/ui/theme.css'
import '@lobehub/ui/style.css'
import '@lobehub/ui/global.css'
```

`ConfigProvider` 包住应用，显式传入 `motion`（`motion/react-m`）和 `LazyMotion`（`domMax`）。`ModalHost` 和 `ToastHost` 放在 `LazyMotion` 里面，否则确认框和提示会停在 `opacity: 0` 并挡住点击。

React Router 的 `Link` 要 `to`，lobe 的 `aAs` 传的是 `href`。做一个适配：`to={to ?? href}`。

外观用 `data-theme`。只有旧选择器还写着 `.dark` 时才同步 `.dark`。登录页若必须保持浅色，在登录根节点设 `data-theme="light"`。

## 样式

只写：

```ts
const styles = createStaticStyles(({ css, cssVar }) => ({
  root: css`
    background: ${cssVar.colorBgLayout};
    border-block-end: 1px solid ${cssVar.colorBorderSecondary};
    box-shadow: ${cssVar.boxShadow};
  `,
}))
```

- 颜色、阴影、圆角用 `cssVar`。新代码不写 hex / rgb。
- 模板里的间距可以用数字。状态色用 `colorError*`、`colorSuccess*`、`colorWarning*`、`colorInfo*`。
- 去掉 Tailwind 的 reset 后，在 base 层补上 `box-sizing: border-box`、`border-style: solid`、`border-width: 0`。否则只写了 `border-width` 的边框不会出现。
- `group-hover` 生成的选择器是 `.group:hover &`。父元素必须保留字面类名 `group`，不能只留哈希类名。
- 自由 JSON（`meta`、动态节点 `props`）不要被样式或大小写转换改写。

批量把 `className` 字符串改成 `createStaticStyles` 时，只改 `className` 和 `cn()` 里的类名字符串。下面这些一旦像工具类，就必须跳过：

- 对象键、类型联合、请求头（`content-type` 会被当成 `content-*`）
- i18n、提示词、CSS 模板、`style` 属性值
- 单词 `hidden`、`block`、`inline`、`italic`、`underline`、`absolute`、`fixed`、`visible`、`contents`、`outline`、`table`

改完用类型检查抓 `TS1005`，再搜 `lobeStyles` 是否出现在非 `className` 的位置。

## 对应

| 旧原子 | 用 |
| --- | --- |
| Button、Input、TextArea、Select、Checkbox、Switch | 同名组件。包装层可保留 `variant`、`onCheckedChange`、`onChange(value: string)` |
| Tag、Badge | `Tag` |
| Empty | `Empty` |
| Segmented | `Segmented`（`fill` → `block`，`onValueChange` → `onChange`） |
| Scroll | `ScrollArea`。`ref` 给 viewport，内容类名给 `contentProps` |
| Pagination | `Pagination`（`simple`、`showSizeChanger`） |
| 数据表、`<table>` | `Table`，`pagination={false}` 如果翻页仍在外面。请求驱动的新表用 `@lobehub/ui/pro-table` |
| DateTime | `DatePicker` + `showTime`。对外仍可收 `YYYY-MM-DDTHH:mm` 字符串 |
| Modal、Drawer、Dropdown、Popover | 同名组件或它们的 atoms。命令式确认用 `createModal` |
| 右键菜单 | `ContextMenuHost` + `showContextMenu`。在边界把旧菜单项映射过去 |
| 可搜索选择 | `AutoComplete`。受控文本是 `value`，不是 `inputValue`。`filter` 和 `options[].label`（可以是节点）能表达名称加 id |
| Slider | `Slider`，`onChange(value: number)` |
| 提示 | `toast`。删掉 Sonner 的 `Toaster` 和 `sonner` 依赖 |
| 设置页单列条目 | `List`（标题、说明、头像、extra、一次一项选中） |

包装只为迁移旧调用。新代码直接从 `@lobehub/ui` 导入。

## 不要换

- 主从列表行。需要勾选、Shift 连选、⌘ 切换、键盘光标、当前详情、右键菜单、一行多段信息时，保留项目自己的行。`List` 和 `Table` 盖不住这套。
- 编辑器、修订树、发布流程、命令面板。
- Monaco。lobe 的 `CodeEditor` 是高亮文本框。
- 窄屏详情若依赖拖拽分档和「空节点当传送门目标」，先核对 `FloatingSheet` 的 `snapPoints` 单位和 children 是否能当锚点。对不上就留着自建层。

## 弹层和提示

- `confirmModal` 点遮罩关闭时不会走 `onCancel`，包成 `Promise` 会挂住。要在取消和遮罩关闭都结算时，用 `createModal`，在按钮里 `resolve` 再 `close()`，并用 `onOpenChange(false)` 结算遮罩关闭。先置位再关闭，避免遮罩回调把结果覆盖掉。
- 受控 Modal 要阻止关闭时，继续把 `eventDetails.cancel()` 传给底层 `ModalRoot`。只把 `open` 保持 `true` 而不 cancel，Base UI 会和动画根节点打架。
- `toast.success` / `error` / `info` / `warning` 接受字符串，或一个 `{ title, description, actions }`。没有 `(message, options)` 第二个参数。`toast.loading` 返回 `{ id, close }`，`toast.dismiss(id)` 用来收起。
- `Modal` 高阶组件：`footer={null}`、`title={false}`、`closable={false}` 可以藏掉自带顶栏和底栏，让原有的 `ModalHeader` 留在 children 里。`draggable` 默认是开的，迁移期设成 `false`。

## 收尾

删掉没有引用的旧原子和只被它们用到的测试。侧栏换成 `ConsoleShell` 之后，旧侧栏主体、导航项、拖拽宽度可以删；若顶栏按钮还读折叠状态，只留那个 atom。

类型检查必须通过。改过的界面在浏览器里点通主路径。登录墙挡住时，说明没验到的页面。
