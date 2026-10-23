<!-- lobe-design-init: version=5.7.0 fingerprint=c683ffd78899 -->

# 组件盘点（项目层 · Byline admin）

> 05-init Round 2。只写场景和注意点。新界面的原子层从 `@lobehub/ui` 取，控制台骨架从 `@lobehub/ui/dashboard` 取，取值用 `cssVar`。下面是现有项目组件，迁移完成前仍会被旧页面用到。

## 薄包装（优先用上游件）

| 项目组件 | 对应 |
| --- | --- |
| 控制台壳 | `@lobehub/ui/dashboard` 的 `ConsoleShell`、`ConsoleNav`、`ConsoleBrand`、`Breadcrumb`。不要再包一层侧栏。 |

## 与 lobe-ui 重复（改用 lobe-ui，不要扩写）

| 项目组件 | 改用 |
| --- | --- |
| Button、TextInput、TextArea、Select、Checkbox、Switch | 已接到 `@lobehub/ui` 同名件。调用处仍用原来的 props，新代码直接从 `@lobehub/ui` 导入 |
| Tag、Badge | `Tag` |
| EmptyState | `Empty` |
| SegmentedControl | `Segmented` |
| Scroll | `ScrollArea` |
| CompactPagination | `Pagination` |
| 表格 | 记录列表一律用 `@lobehub/ui/pro-table` 的 `ProTable`（`variant="outlined"`），不要手写行网格。批量操作走 `rowSelection` + `tableAlertRender`，行操作放最后一列、悬停显示，右键用 `showContextMenu`。样板：博文页、用户页 |
| DateTimePicker | `DatePicker` |
| Modal、Drawer、Dropdown、Popover | 壳已接到 `@lobehub/ui` 同名件。命令式确认走 `createModal` |
| 提示 | `toast`（`ToastHost` 已挂在主题里） |
| 右键菜单 | `@lobehub/ui` 的 `ContextMenuHost`。模型建议用 `AutoComplete` |
| 窄屏 BottomSheet、图片灯箱 | 灯箱壳已接到 `Modal`。窄屏分档仍是自建拖拽 |
| Monaco 代码编辑器 | 保留。`CodeEditor` 是高亮文本框，盖不住配置编辑需要的 Monaco |

旧件还挂在现有列表和表单上。改某一页时顺手换成上游件，不要在旧件上加新变体。

## 页面层（`~/ui/page`）

| 组件 | 场景 |
| --- | --- |
| `Page` | 集合页、仪表盘、设置的外框：标题（可带计数）、说明、右侧主操作、`tabs`、宽度档位 `default/wide/narrow/full`。 |
| `RouteTabs` | 把同一件事的几个路由合成一页的标签（AI 内容、文件/孤立文件）。被合并的路由 meta 设 `hidden: true`，仍可在 ⌘K 和面包屑里找到。 |
| `ListPane` / `DetailPane` / `DetailPlaceholder` | 主从页的两栏。旧的 `AppPage`、`detail-header` 不再用于新页面。 |

写作页是独立外壳：顶栏放返回、发布状态、保存状态、修订/AI/设置面板开关、保存和发布；编辑器工具栏经 `EditorToolbarSlotContext` 传送到顶栏下方；画布里是大标题 + 署名·分类·路径一行 + 正文；右侧「文章设置」用 `Accordion` 分组，可收起并记住状态。全局顶栏已有「写博文」，页面里不要再放同样的主按钮。

## 业务组件

| 组件 | 场景 | 注意 |
| --- | --- | --- |
| 主从布局（列表 + 详情） | 草稿、文件、Webhooks、AI 产物 | `~/ui/page` 的 `ListPane` + `DetailPane`，切分沿用 `MasterDetailShell`。详情必须展示行里看不到的东西（预览、历史、关联、配置），不能把行字段竖着再排一遍。桌面端自动打开第一项，不留空白详情栏。 |
| 命令面板、快捷键 | 跨页跳转和列表快捷键 | 保留。不要做成第二套导航。 |
| 写作页、修订树、发布坞、AI 对话 | 写和发布 | 必须自建。编辑器继续用 haklex，不要换成 Markdown 文本框。 |
| 各资源的列表行 | 博文、草稿、分类、文件、任务、webhook | 行内信息按该对象的决定来排，不要抽成一个万能行。状态用 `Tag`。 |

表单新代码走 `@lobehub/ui/form`。图表若以后要上仪表盘，用 `@lobehub/charts`，颜色跟 `data-theme`。
