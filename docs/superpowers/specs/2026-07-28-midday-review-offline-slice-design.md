# 午间复盘离线切片设计

> 状态：已确认并实施；已通过本地回归测试。
>
> 日期：2026-07-28

## 目标与范围

为 `report-engine/` 的本地固定样例原型增加 `midday_review`。该报告只复盘 A 股上午盘面，并对当日早盘扫描及此前每日复盘中可验证的市场判断进行非个人化验证。

本切片不接入真实交易日历、数据源、模型、网络、环境变量、PDF 导出、日程、用户、归档、发布或通知。所有内容均由测试夹具传入，不能被解读为真实市场结论。

## 已确认的设计

### 受支持类型

- 本轮将受支持的报告类型扩展为 `morning_scan` 和 `midday_review`。
- `daily_review`、`industry_tracking`、`holiday_digest`、`month_end_review` 与 `industry_research` 仍返回 `UNSUPPORTED_REPORT_TYPE`。
- 既有 `morning_scan` 的输入、成功输出和失败语义保持兼容。

### 请求契约

两个报告类型使用判别联合类型，而不是在同一个请求对象中堆叠无约束的可选字段：

```ts
type MorningScanRequest = {
  reportType: 'morning_scan';
  reportDate: string;
  evidence: EvidenceItem[];
  draftHtml?: string;
};

type MiddayReviewRequest = {
  reportType: 'midday_review';
  reportDate: string;
  evidence: EvidenceItem[];
  priorAssessments: PriorAssessment[];
  draftHtml?: string;
};
```

`EvidenceItem` 沿用现有规则：非空标题、无凭证 HTTPS URL、带时区且可解析的 ISO-8601 时间。

`PriorAssessment` 固定为：

```ts
type PriorAssessment = {
  reportId: string;
  reportDate: string;
  reportType: 'morning_scan' | 'daily_review';
  originalJudgement: string;
  status: '已验证' | '部分验证' | '未验证' | '失效';
  validationEvidence: EvidenceItem[];
};
```

### 判断验证规则

- `priorAssessments` 必须至少包含一条当日的 `morning_scan` 与一条早于午间复盘日期的 `daily_review`。
- `morning_scan.reportDate` 必须等于午间复盘的 `reportDate`；`daily_review.reportDate` 必须早于该日期。
- 非“未验证”状态必须至少包含一条 `validationEvidence`；“未验证”可为空，但不得以空证据输出其他结论。
- `reportId` 和 `originalJudgement` 必须为非空字符串；未知报告类型、未知状态、无效日期或无效来源都必须失败关闭。
- 当前只校验公历日期存在性和日期先后关系，不把它误称为 A 股交易日历校验。
- 验证失败统一返回新的错误码 `PRIOR_ASSESSMENT_INSUFFICIENT`，不生成部分报告。

### 成功输出

输出同样使用判别联合类型。午间复盘的成功报告必须包含原样通过验证的 `priorAssessments`，以便未来的归档层追溯“原判断—验证状态—结构化来源证据”。

固定样例标题为：`午间小复盘｜YYYY-MM-DD｜v1.0`。

默认正文顺序：

1. 上午市场概览。
2. 与早盘扫描的对应关系。
3. 市场判断验证表。
4. 午后观察清单。
5. 固定风险提示“仅供信息参考，不构成投资建议”。

### HTML 策略调整

为支持判断验证表，在现有“拒绝策略”基础上增加表格结构标签：`table`、`thead`、`tbody`、`tr`、`th`、`td`。现有的 `article`、标题、段落、列表、强调与 HTTPS 链接规则保留。

标签白名单不等于属性放宽：除 `a[href]` 外仍拒绝所有属性；事件属性、`class`、`style`、非 HTTPS 链接、危险标签、未知标签、未闭合结构与自闭合标签一律拒绝。合规短语检查继续在 HTML 结构校验通过后执行。

## 测试与验收

实现必须按测试先行进行，至少覆盖：

1. 使用完整固定夹具生成午间复盘。
2. 缺少验证记录、缺少当日早盘引用、缺少此前复盘引用时失败关闭。
3. 引用日期不符合要求时失败关闭。
4. 非“未验证”状态没有结构化来源证据时失败；“未验证”可无证据。
5. 非法验证状态、空原判断、无效引用类型和无效来源时失败关闭。
6. 合法 HTML 表格通过；表格上的危险属性或非法结构仍被拒绝。
7. 既有 21 项测试持续通过。

验证命令：在 `report-engine/` 目录运行 `npm.cmd test`。

## 影响与后续

影响范围仅限 `report-engine/src/`、`report-engine/test/`、架构文档和项目交接记录。不会改变早盘报告的可观察行为，也不会新增外部依赖。

完成后，下一离线切片才考虑 `daily_review`；真实数据、交易日历、模型和部署仍需作为独立阶段决策。
