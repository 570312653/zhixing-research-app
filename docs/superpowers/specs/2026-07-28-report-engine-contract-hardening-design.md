# 报告引擎契约加固与文档清理设计

> 状态：已确认并实施；已通过本地回归测试。
>
> 日期：2026-07-28

## 目标

把现有离线 `morning_scan` 原型从“依赖 TypeScript 类型和简单关键词检查”提升为可在运行时失败关闭的契约边界，同时清除当前文档中的活动路线歧义。

本次不新增报告类型、不调用模型、不访问网络、不读取环境变量、不接入真实数据、PDF、Vercel、Supabase、Coze 或用户数据。

## 设计选择

### 方案比较

| 方案 | 做法 | 优点 | 代价与风险 |
|---|---|---|---|
| A. 自包含校验器（采用） | 用小型 TypeScript 函数校验对象、日期、来源、HTML 和输出对象。 | 零运行时依赖、可读、适合当前单类型离线原型。 | 未来契约变大后可能需要迁移到 Schema 库。 |
| B. 立即引入 Zod 与 HTML Sanitizer | 使用第三方 Schema 与净化库。 | 规则复杂后扩展较快。 | 新增依赖与配置；在当前原型阶段超出最小范围。 |

当前采用 A。等模型输出、外部数据源和多份报告类型接入后，重新评估是否迁移到成熟 Schema/HTML Sanitizer 库。

## 运行时契约

### 输入

`generateReport(input: unknown)` 不再假定调用方传入的对象符合 TypeScript 类型。它只接受以下字段：

```ts
{
  reportType: 'morning_scan',
  reportDate: 'YYYY-MM-DD',
  evidence: Array<{
    title: string,
    url: string,
    publishedAt: string
  }>,
  draftHtml?: string
}
```

校验规则：

- `reportType` 不是 `morning_scan` 时返回 `UNSUPPORTED_REPORT_TYPE`。
- `reportDate` 必须是实际存在的公历日期；例如 `2026-02-31` 返回 `INVALID_REPORT_DATE`。它不在本切片判断是否为 A 股交易日。
- `evidence` 必须是非空数组；每项的 `title` 必须为非空字符串，`url` 必须为合法 `https:` URL，`publishedAt` 必须为可解析的 ISO-8601 时间字符串；否则返回 `SOURCE_EVIDENCE_INSUFFICIENT`。
- `draftHtml` 缺失时使用固定 HTML 样例；若提供，必须是字符串。

### HTML

HTML 使用“拒绝而非静默净化”的失败关闭策略。允许标签：`article`、`h1`、`h2`、`p`、`ul`、`ol`、`li`、`strong`、`em`、`a`；允许属性只有 `a[href]`。

以下情况返回 `UNSAFE_HTML`：

- 不在允许列表的标签，例如 `script`、`img`、`style`、`iframe`；
- 任何 `on*` 事件属性；
- `style`、`class`、`id` 或其他未允许属性；
- 链接不是 `https:` 协议；
- 未闭合或无法按限定标签解析的 HTML。

在 HTML 安全检查通过后，继续执行已有的禁止表述检查；命中“建议买入”“建议卖出”“满仓”“保证收益”时返回 `COMPLIANCE_VIOLATION`。

### 输出

成功对象必须在返回前再次通过运行时检查：只包含一份报告，且具备 `reportType`、`reportDate`、`title`、`version`、`dataAsOf`、`sourceLinks` 和 `contentHtml`。输出中的 `sourceLinks` 与已校验输入来源保持一致，`contentHtml` 必须再次通过 HTML 检查。

不满足时返回 `OUTPUT_CONTRACT_VIOLATION`。该错误主要为未来模型或数据适配器接入预留；当前固定样例也必须覆盖其验证路径。

## 模块边界

```text
src/
  contract.ts       输入、来源与输出的运行时校验
  html-policy.ts    允许标签、属性、链接协议与合规词检查
  index.ts          generateReport 编排；不含校验细节
  pdf.ts            保持当前不可用 PDF 边界，不在本次修改
```

`index.ts` 只串联“输入校验 → 生成固定样例或接收草稿 → HTML/合规检查 → 输出校验”。它不得访问网络、环境变量或文件系统。

## 测试与验收

保留现有六项测试，并新增至少以下真实行为测试：

1. `2026-02-31` 被拒绝。
2. HTTP、空 URL、非法 URL、空标题和非法时间的来源被拒绝。
3. `script`、事件属性、非 HTTPS 链接和未允许标签被拒绝。
4. 合法允许标签与 HTTPS 链接可通过。
5. 成功结果仍为单份报告，字段完整，且输出 HTML 再次通过策略检查。

执行命令：在 `report-engine/` 目录运行 `npm.cmd test`。所有测试必须通过，且不得出现网络请求、环境变量读取、Coze、Vercel、Supabase、Playwright 或 Chromium 依赖。

## 文档清理范围

- 修改 `docs/product-requirements.md`：将核心关注标的池字段中的“Coze 提供的关联依据”改为“报告引擎提供的关联依据”。
- 修改 `AGENTS.md`：在最高优先级决定中明确其余 Coze 相关章节均是历史记录；新增一条恢复规则，后续实现只能以报告引擎文档和最新切片记录为准。
- 不删除、不移动旧 Coze POC 文档；它们继续用于审计，而非实施说明。

## 非目标与后续

- 本次不实现 A 股交易日历；真实交易日判断属于数据源能力验证阶段。
- 本次不安装 Chromium/Playwright；真实 PDF 导出属于后续单独切片。
- 本次不添加其余六类报告；它们将在契约加固验收后逐个以固定夹具和测试扩展。
- 本次不引入 Zod 或第三方 HTML Sanitizer；外部模型或不可信 HTML 输入接入前必须重新评估该决定。
