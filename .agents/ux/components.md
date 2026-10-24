<!-- lobe-design-init: version=5.8.0 fingerprint=c683ffd78899 -->

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
| 表格 | 记录列表一律用 `@lobehub/ui/pro-table` 的 `ProTable`（`variant="outlined"`），不要手写行网格。批量操作走 `rowSelection` + `tableAlertRender`，行操作放最后一列并一直显示，右键用 `showContextMenu`。样板：博文页、用户页、任务页 |
| DateTimePicker | `DatePicker` |
| Modal、Drawer、Dropdown、Popover | 壳已接到 `@lobehub/ui` 同名件。命令式确认走 `createModal` |
| 提示 | `toast`（`ToastHost` 已挂在主题里） |
| 右键菜单 | `@lobehub/ui` 的 `ContextMenuHost`。模型建议用 `AutoComplete` |
| 窄屏 BottomSheet、图片灯箱 | 灯箱壳已接到 `Modal`。窄屏分档仍是自建拖拽 |
| Monaco 代码编辑器 | 保留。`CodeEditor` 是高亮文本框，盖不住配置编辑需要的 Monaco |
| 只读代码块 | `Highlighter`。JSON、源码、对话里的代码围栏、文章里的代码块都用它。点进写作页的代码块才换成 haklex 编辑器；多文件代码片段的编辑弹层仍是 haklex |

旧件还挂在现有列表和表单上。改某一页时顺手换成上游件，不要在旧件上加新变体。

## 页面层（`~/ui/page`）

| 组件 | 场景 |
| --- | --- |
| `Page` | 集合页、仪表盘的外框：标题（可带计数）、说明、右侧主操作、`tabs`。没有左侧列表的页面和已发布列表一样，内容最大宽度是 `PAGE_CONTENT_MAX_WIDTH`（1440px），滚动条留在铺满的外层上。写作页文章区和草稿右侧内容用 `ARTICLE_MAX_WIDTH`（740px）。 |
| `RouteTabs` | 把同一件事的几个路由合成一页的标签（产物、文件/孤立文件）。被合并的路由 meta 设 `hidden: true`，仍可在 ⌘K 和面包屑里找到。 |
| `ListPane` / `DetailPane` / `DetailPlaceholder` | 主从页的两栏。旧的 `AppPage`、`detail-header` 不再用于新页面。 |

页面留白只由 `Page` 负责：控制台外壳的内容区不加内边距，功能页里也不要再包一层带 padding 的容器。整页加载占位用 `PageLoadingFrame`：外层铺满主区域，骨架内容最大宽度与 `Page` 相同（1440px），居中，留白也与 `Page` 相同。

### 记录列表（`ProTable`）的写法

- 工具栏：搜索、筛选放进一个 `flex: 1; flex-wrap: wrap; gap: 8px` 的容器；搜索框弹性宽度、上限约 24rem；`Select` 按内容取宽；工具只留刷新（`options` 关掉密度、全屏、列设置和自带搜索）。
- 状态筛选用 `Segmented`，「全部」也是一个选项。带计数、用来切换工作集的状态（任务状态、用户状态）留在工具栏，不在表头再做一遍。
- 表头排序和筛选只覆盖全集。整表已在客户端时，排序用比较函数（时间、数量第一次点击为从新到旧、从多到少），枚举筛选用 `onFilter`。服务端分页且接口有对应参数时，用 `sorter: true` 或 `filters` 配受控的 `sortOrder` / `filteredValue`，`onFilter: false`，写回现有查询。只给当前页重排的列不加。自由文本留在搜索框。操作列不加。
- 加载遮罩：`loading={query.isFetching && query.isPlaceholderData}`。首屏用 `TableSkeleton`，后台刷新不盖遮罩（`LOBE-REFETCH-OVERLAY`）。
- 身份列不设 `width`，吃掉表格里多出来的宽度。其余列按内容定宽，宽屏下不再按比例拉长。`scroll.x` 是这些定宽列加上身份列的 220px 底线（多选列、展开列另加），表用 `tableLayout="fixed"`，表头不换行。容器更窄时在表格内部横滚。
- 身份列 `fixed: 'left'`、操作列 `fixed: 'right'` 只在桌面壳（视口 ≥ 1024px）打开。更窄时不固定：固定的左右列会盖住手机宽度。次要列用 `responsive` 收起（`md` 768、`lg` 992）。
- 一个对象多条子记录（一篇 × N 种语言）用树形行：父行 `key` 加前缀避免和子行冲突，`expandable={{ indentSize: 0 }}`，子行只放和父行不同的信息。
- 语言、能力这类集合在单元格里写「已齐 16/16」「缺 3 种」，明细放 `Tooltip`。
- 只有一页时 `pagination.hideOnSinglePage`。

### 设置与仪表盘

- 设置字段用 `features/settings/components/SettingsPrimitives`：控件宽 360px，恢复默认是控件旁的 `ActionIcon`（`RotateCcw`，`aria-label` / `title` 写「恢复默认」），底栏只在出错时出现。
- 功能型设置（AI 的翻译、摘要、洞察、配图、朗读）一个功能一个 `Form.Group`：`desc` 写功能做什么，`extra` 放开关，开启后才渲染配置项。
- 仪表盘区块用 `@lobehub/ui/dashboard` 的 `Section variant="card"`，指标用 `MetricStrip`。两栏用 3fr / 2fr 网格，`lg` 以下收成一栏。

写作页是独立外壳，和工作区顶栏合成一行：左侧面包屑（「博文」链回列表，当前页是文章标题）紧跟着发布标签和保存状态，右侧是修订、AI、设置、保存和发布，换掉搜索，不再另放返回。编辑器工具栏经 `EditorToolbarSlotContext` 传送到顶栏下方；画布里是大标题 + 署名·分类·路径一行 + 正文；右侧「文章设置」第一屏是路径、发布日期、分类、置顶、摘要、署名、标签和原文语言，封面、搜索引擎、高级是点进去的子面板，可收起并记住状态。其它页的全局顶栏仍有「写博文」，写作页里不要再放同样的主按钮。

## 业务组件

| 组件 | 场景 | 注意 |
| --- | --- | --- |
| 主从布局（列表 + 详情） | 草稿、文件、Webhooks、AI 产物 | `~/ui/page` 的 `ListPane` + `DetailPane`，切分沿用 `MasterDetailShell`。详情必须展示行里看不到的东西（预览、历史、关联、配置），不能把行字段竖着再排一遍。桌面端自动打开第一项，不留空白详情栏。一条记录都没有时整页渲染 `Page` + `Empty` + 创建按钮，不渲染两栏（样板：Webhooks）。 |
| 命令面板、快捷键 | 跨页跳转和列表快捷键 | 保留。不要做成第二套导航。 |
| 写作页、修订树、发布坞、AI 对话 | 写和发布 | 必须自建。编辑器继续用 haklex，不要换成 Markdown 文本框。 |
| 各资源的列表行 | 博文、草稿、分类、文件、任务、webhook | 行内信息按该对象的决定来排，不要抽成一个万能行。状态用 `Tag`。 |

表单新代码走 `@lobehub/ui/form`。图表若以后要上仪表盘，用 `@lobehub/charts`，颜色跟 `data-theme`。
