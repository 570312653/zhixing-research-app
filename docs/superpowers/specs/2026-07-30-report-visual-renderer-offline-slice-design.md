# 知行报告视觉渲染器离线切片设计

> 状态：已确认执行；实现必须保持离线、无真实数据、无模型、无网络、无正式 PDF 渲染器。
>
> 日期：2026-07-30

## 1. 目标

把已经确认的视觉模板规范落实为可测试、可复用的 HTML 文档渲染器，使现有 `morning_scan`、`midday_review` 和 `daily_review` 三类固定样例报告能够共享同一套桌面、手机和 A4 打印样式。

本切片解决的是“视觉规范只有文档、代码仍只输出基础 `<article>` 片段”的差距，不增加新的报告类型。

## 2. 范围

本切片包含：

- 新增完整 HTML 文档渲染器。
- 使用固定 CSS 变量落实深蓝、浅色、状态色和阅读排版。
- 统一渲染品牌页眉、报告元数据、正文、来源和固定风险页脚。
- 允许受控的 `td[data-label]`，在小于 768px 时把表格行转换为字段卡片。
- 增加 A4 `@page` 与打印分页样式。
- 为三类现有报告生成本地 HTML 预览。

本切片不包含：

- Chromium、Playwright 或真实 PDF 文件。
- 真实数据、交易日历、模型、网络、环境变量或外部服务。
- `industry_tracking` 等新报告类型。
- 用户端应用、数据库、归档、发布或通知。
- PDF 总页数与“第 X 页 / 共 Y 页”；该能力依赖后续正式 PDF 渲染器。

## 3. 架构决策

### 3.1 正文与页面外壳分离

现有 `GeneratedReport.contentHtml` 继续是经过白名单校验的语义正文片段。新增：

```ts
renderReportDocument(value: unknown): ReportDocumentResult
```

渲染器先调用 `validateGeneratedReport`，再把已校验正文放进应用控制的完整 HTML 页面。CSS、页面 class、meta 标签和布局结构只能由渲染器生成，不能由调用方或报告正文提供。

这样不会为了视觉实现而开放正文中的 `class`、`style`、`script` 或任意属性。

### 3.2 手机端表格卡片

复杂表格仍保留原始 `table`、`thead`、`tbody`、`tr`、`th` 和 `td` 语义。数据单元格可使用：

```html
<td data-label="原报告日期">2026-07-30</td>
```

HTML 策略只允许 `td` 使用一个带引号的 `data-label` 属性；值必须为 1–32 个安全文本字符，不允许 `<`、`>`、引号、控制字符或额外属性。其他标签的属性规则保持不变。

手机 CSS 使用 `content: attr(data-label)`显示字段名，不维护第二份移动端正文。

### 3.3 打印边界

渲染器提供 A4 页面大小、页边距、避免表格行和提示卡被切开的打印规则。当前 `renderPdf` 继续失败关闭并返回 `PDF_RENDERER_UNAVAILABLE`，不得把打印 CSS 声称为真实 PDF 导出。

### 3.4 视觉方向

采用专业研究简报式的编辑排版：

- 主色 `#1E3A8A`。
- 白色页面和低饱和灰色信息区。
- 系统中文无衬线字体，优先保证 Windows 与未来 PDF 环境可用。
- 长文单列、最大阅读宽度 1120px。
- 不使用动画、行情大屏、渐变装饰或营销型卡片。

## 4. 运行时接口

```ts
export type ReportDocumentResult =
  | { kind: 'success'; html: string }
  | GenerateError;

export function renderReportDocument(value: unknown): ReportDocumentResult;
```

成功结果必须是完整文档，包含：

- `<!doctype html>`与`<html lang="zh-CN">`。
- UTF-8 与移动端 viewport。
- 固定样式。
- 品牌“知行”。
- 报告标题、日期、版本和数据截至时间。
- 已校验的正文。
- 公开来源列表。
- 固定风险提示和打印页脚。

元数据中的动态文本必须 HTML 转义。来源 URL 只能来自已经通过契约校验的 HTTPS URL。

## 5. 失败关闭规则

- 传入对象未通过报告输出契约时，原样返回对应结构化错误。
- 正文危险 HTML、非法报告类型、无来源或错误时间不得生成完整文档。
- `td[data-label]` 之外的新增属性继续返回 `UNSAFE_HTML`。
- 渲染器不得读取文件、网络、环境变量、系统时间或此前运行结果。

## 6. 验收标准

- 原有 85 项测试保持通过。
- 新测试覆盖完整文档、视觉令牌、元数据转义、来源、手机卡片、A4 打印和非法属性。
- 三类固定样例均可生成独立 HTML 预览。
- 390px 手机视口下判断表格按字段卡片显示，字段名不丢失。
- 桌面端保留完整表格和不超过 1120px 的阅读宽度。
- 打印样式包含 A4 页面与合理分页规则，但 `renderPdf` 仍明确不可用。
- 静态扫描不出现网络请求、环境变量、Coze、Vercel、Supabase 或真实数据接入。

## 7. 已知延后项

- 当前 `GeneratedReport` 没有独立 `generatedAt` 字段；本切片只展示已有的 `dataAsOf`，不得把它冒充生成时间。`generatedAt` 需要在后续契约升级中单独确认。
- PDF 页码总数、字体嵌入和真实分页效果必须在正式 Chromium 渲染器切片中验证。
