# 每日复盘离线切片设计

> 状态：已确认并实施；文档仅记录固定样例契约与边界。
>
> 日期：2026-07-30

## 目标与范围

`daily_review` 是报告引擎的第三个本地固定样例切片。它只整理同一报告日期的 A 股市场研究夹具，并在收盘语境下验证当日早盘和午间的可追溯判断。它不输出真实市场结论，也不承担交易日判断、数据采集、模型生成或发布。

本切片不接入网络、真实数据、真实交易日历、模型、密钥、环境变量、PDF、日程、部署、用户、归档、发布或通知。所有输入均由调用方在内存中显式传入；实现不得读取历史文件、此前运行结果或外部服务。

## 已确认的设计

### 受支持类型与兼容性

- 受支持类型扩展为 `morning_scan`、`midday_review` 和 `daily_review`。
- `morning_scan` 与 `midday_review` 的请求、成功输出、验证关系和错误语义保持不变。
- `industry_tracking`、`holiday_digest`、`month_end_review` 与 `industry_research` 仍返回 `UNSUPPORTED_REPORT_TYPE`。

### 请求契约

```ts
type DailyReviewRequest = {
  reportType: 'daily_review';
  reportDate: string;
  evidence: EvidenceItem[];
  dataAsOf: string;
  priorAssessments: PriorAssessment[];
};
```

- `reportDate` 必须是实际存在的 `YYYY-MM-DD` 公历日期；这不是 A 股交易日历校验。
- `evidence` 至少一条；每条须有非空标题、无凭证 HTTPS URL 和带时区、可解析的 ISO-8601 `publishedAt`。
- `dataAsOf` 为调用方显式提供的带时区、可解析 ISO-8601 时间；不得从首条来源、文件、模型或运行时间补造。
- `daily_review` 不接受 `draftHtml`。正文只能由固定模板生成，避免调用方绕过固定栏目与合规路径。

### 前序判断验证

`PriorAssessment` 继续保存 `reportId`、`reportDate`、`reportType`、`originalJudgement`、`status` 和 `validationEvidence`。为每日复盘扩展其可接受的报告类型为 `morning_scan`、`midday_review` 与 `daily_review`。

- 必须至少有一条同日 `morning_scan` 和一条同日 `midday_review`。
- `morning_scan` 与 `midday_review` 的 `reportDate` 必须等于每日复盘的 `reportDate`。
- 可以保留早于 `reportDate` 的 `daily_review` 记录，但禁止同日 `daily_review`，避免自引用。
- `reportId`、`originalJudgement` 必须为非空字符串；状态只允许“已验证”“部分验证”“未验证”“失效”。
- 除“未验证”外，每条记录必须至少有一条合格 `validationEvidence`；“未验证”可以为空数组，但若提供证据，仍必须逐条合格。
- 任一判断关系、日期、状态、正文或证据不合格时，整体失败关闭，不返回部分报告。

### 成功输出与固定 HTML

```ts
type DailyReviewReport = {
  reportType: 'daily_review';
  reportDate: string;
  title: string;
  version: 'v1.0';
  dataAsOf: string;
  sourceLinks: EvidenceItem[];
  marketScopes: ['cn_a'];
  priorAssessments: PriorAssessment[];
  contentHtml: string;
};
```

标题固定为 `每日复盘｜YYYY-MM-DD｜v1.0`，`marketScopes` 必须精确为 `['cn_a']`。固定 HTML 只使用当前拒绝式策略已允许的标签，按以下顺序输出：

1. 一句话总览。
2. 市场表现。
3. 主线与板块。
4. 重要事件与公告。
5. 情绪与结构观察。
6. 当日判断验证表。
7. 次日观察清单。
8. 固定风险提示“仅供信息参考，不构成投资建议”。

动态判断文本必须 HTML 转义；验证证据和来源保留在结构化字段中，不能把动态 URL 直接拼入 HTML。

### 失败关闭语义

| 条件 | 错误码 |
|---|---|
| 请求不是对象，或 `daily_review` 提供 `draftHtml` | `INVALID_REQUEST` |
| 未实现的报告类型 | `UNSUPPORTED_REPORT_TYPE` |
| 无效报告日期 | `INVALID_REPORT_DATE` |
| 请求来源为空或来源结构不合格 | `SOURCE_EVIDENCE_INSUFFICIENT` |
| `dataAsOf` 缺失或不是带时区 ISO-8601 时间 | `INVALID_REQUEST` |
| 前序判断缺失、关系错误、同日自引用、状态/正文/证据不合格 | `PRIOR_ASSESSMENT_INSUFFICIENT` |
| 固定 HTML 不安全 | `UNSAFE_HTML` |
| HTML、判断或固定正文出现违规交易、收益承诺或个人化表述 | `COMPLIANCE_VIOLATION` |
| 已构造对象不满足最终输出契约 | `OUTPUT_CONTRACT_VIOLATION` |

## 验收清单

- [x] 完整固定夹具可生成一份 `daily_review`，且输出类型、标题、`dataAsOf`、`marketScopes`、来源、前序判断和风险提示齐全。
- [x] 缺少同日早盘或同日午间判断时返回 `PRIOR_ASSESSMENT_INSUFFICIENT`。
- [x] 同日前序日期错误、同日 `daily_review` 自引用、非法状态、空原判断或不合格验证证据时失败关闭。
- [x] 缺少或非法 `dataAsOf`，以及提供 `draftHtml` 时失败关闭。
- [x] 固定 HTML 包含全部八个栏目；危险标签、属性、违规动态判断文本和不合格最终输出均被拒绝。
- [x] 既有 `morning_scan` 与 `midday_review` 的行为和测试持续兼容。
- [x] 实现不出现网络、环境变量、模型、Coze、Vercel、Supabase、PDF 渲染器或部署相关引用。

## 后续边界

该设计不授权接入真实交易日历、行情、公告、新闻、模型、调度或应用基础设施。待数据能力与可信运行时单独验证通过后，才可讨论将固定样例替换为正式生产链路。
