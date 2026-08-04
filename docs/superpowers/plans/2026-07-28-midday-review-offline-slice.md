# 午间复盘离线切片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为本地报告引擎增加可追溯、失败关闭的 `midday_review` 固定样例，同时保持既有 `morning_scan` 行为兼容。

**Architecture:** 在 `contract.ts` 中以判别联合类型区分早盘与午间复盘请求/输出；午间复盘通过结构化 `priorAssessments` 显式接收当日早盘和此前复盘的判断验证记录。`index.ts` 根据报告类型生成固定 HTML，并将所有动态文本转义后再交给现有 HTML 策略与输出契约双重校验。

**Tech Stack:** TypeScript（严格模式）、Node 内置测试框架、现有零依赖 HTML 策略。

## Global Constraints

- 仅允许本地固定夹具；不得接入网络、环境变量、真实交易日历、真实数据源、模型、PDF、日程、用户、归档、发布、通知或任何云端服务。
- 内容必须是非个人化市场研究；不得出现交易指令、收益承诺、用户持仓、交易或盈亏信息。
- `midday_review` 只能使用 `priorAssessments` 中传入的模拟记录；不得读取文件或此前运行结果。
- 继续使用 HTML 拒绝策略：仅允许白名单标签，除 `a[href]` 外拒绝所有属性，链接只允许无凭证 HTTPS URL。
- 当前工作目录不是 Git 仓库；不执行 `git add`、`git commit`、推送或部署。每项测试通过后仅更新本计划复选框。

---

## 文件结构

- 修改：`report-engine/src/contract.ts`：定义受支持报告类型、判别联合请求/输出、判断验证类型与运行时校验。
- 修改：`report-engine/src/index.ts`：按报告类型构建安全的固定 HTML，并返回对应判别联合输出。
- 修改：`report-engine/src/html-policy.ts`：增加无属性表格结构标签，保持现有拒绝策略。
- 修改：`report-engine/test/generate-report.test.mjs`：增加午间复盘、判断验证和表格 HTML 的成功/失败测试。
- 修改：`docs/report-engine-architecture.md`：记录午间复盘离线切片的实现与边界。
- 修改：`AGENTS.md`：记录测试结果、未完成边界和下一步。

## 公共接口

```ts
export type PriorAssessmentStatus =
  | '已验证'
  | '部分验证'
  | '未验证'
  | '失效';

export type PriorAssessment = {
  reportId: string;
  reportDate: string;
  reportType: 'morning_scan' | 'daily_review';
  originalJudgement: string;
  status: PriorAssessmentStatus;
  validationEvidence: EvidenceItem[];
};

export type MorningScanRequest = {
  reportType: 'morning_scan';
  reportDate: string;
  evidence: EvidenceItem[];
  draftHtml?: string;
};

export type MiddayReviewRequest = {
  reportType: 'midday_review';
  reportDate: string;
  evidence: EvidenceItem[];
  priorAssessments: PriorAssessment[];
  draftHtml?: string;
};

export type GenerateRequest = MorningScanRequest | MiddayReviewRequest;
export type GeneratedReport = MorningScanReport | MiddayReviewReport;
```

`GenerateError.errorCode` 新增 `PRIOR_ASSESSMENT_INSUFFICIENT`。午间复盘验证记录缺失、引用关系错误、状态非法、原判断为空或证据不满足状态规则时均返回该错误码。

### Task 1: 建立午间复盘的成功契约

**Files:**
- Modify: `report-engine/test/generate-report.test.mjs`
- Modify: `report-engine/src/contract.ts`

**Consumes:** `EvidenceItem`、`generateReport(input: unknown)` 与现有固定来源夹具。

**Produces:** `MiddayReviewRequest`、`MiddayReviewReport`、`PriorAssessment` 和可被 `index.ts` 识别的 `GenerateRequest` 判别联合类型。

- [x] **Step 1: 在测试文件定义午间固定夹具并写成功测试**

```js
const middayPriorAssessments = [
  {
    reportId: 'morning-2026-07-28-v1.0',
    reportDate: '2026-07-28',
    reportType: 'morning_scan',
    originalJudgement: '外围波动需要由 A 股上午表现继续验证。',
    status: '部分验证',
    validationEvidence: evidence,
  },
  {
    reportId: 'daily-2026-07-25-v1.0',
    reportDate: '2026-07-25',
    reportType: 'daily_review',
    originalJudgement: '量能变化仍需下一交易日观察。',
    status: '未验证',
    validationEvidence: [],
  },
];

test('用完整固定证据生成一份午间复盘', () => {
  const result = generateReport({
    reportType: 'midday_review',
    reportDate: '2026-07-28',
    evidence,
    priorAssessments: middayPriorAssessments,
  });

  assert.equal(result.kind, 'success');
  assert.equal(result.report.reportType, 'midday_review');
  assert.equal(result.report.title, '午间小复盘｜2026-07-28｜v1.0');
  assert.equal(result.report.priorAssessments.length, 2);
});
```

- [x] **Step 2: 运行测试，确认当前实现失败**

Run: `npm.cmd test`

Expected: 新测试失败，错误码为 `UNSUPPORTED_REPORT_TYPE`。

- [x] **Step 3: 在 `contract.ts` 定义判别联合类型和受支持报告类型**

```ts
export type SupportedReportType = 'morning_scan' | 'midday_review';

export type BaseReport = {
  reportDate: string;
  title: string;
  version: 'v1.0';
  dataAsOf: string;
  sourceLinks: EvidenceItem[];
  contentHtml: string;
};

export type MorningScanReport = BaseReport & {
  reportType: 'morning_scan';
};

export type MiddayReviewReport = BaseReport & {
  reportType: 'midday_review';
  priorAssessments: PriorAssessment[];
};
```

将当前 `GenerateRequest` 和 `GeneratedReport` 替换为相应联合类型；为 `GenerateError.errorCode` 添加 `PRIOR_ASSESSMENT_INSUFFICIENT`。不要在此步骤实现判断验证规则。

- [x] **Step 4: 调整 `validateGenerateRequest` 的报告类型分支**

保留既有 `morning_scan` 归一化结果。对 `midday_review` 只确认 `priorAssessments` 是数组并返回 `MiddayReviewRequest`；精细校验留给 Task 2。其他类型继续返回：

```ts
failure('UNSUPPORTED_REPORT_TYPE', '当前固定样例原型不支持该报告类型。')
```

- [x] **Step 5: 运行测试，确认类型与基础午间请求可通过契约入口**

Run: `npm.cmd test`

Expected: TypeScript 构建通过；午间成功测试仍因渲染器尚未实现而失败，既有早盘测试继续通过。

### Task 2: 实现判断验证记录的失败关闭校验

**Files:**
- Modify: `report-engine/test/generate-report.test.mjs`
- Modify: `report-engine/src/contract.ts`

**Consumes:** Task 1 中的 `MiddayReviewRequest`、`PriorAssessment`、`EvidenceItem` 和 `isCalendarDate`。

**Produces:** `validatePriorAssessments(value, reportDate)`，只返回通过规则的验证记录或 `PRIOR_ASSESSMENT_INSUFFICIENT`。

- [x] **Step 1: 为验证记录的失败路径写参数化测试**

```js
for (const priorAssessments of [
  [],
  [middayPriorAssessments[0]],
  [middayPriorAssessments[1]],
  [{ ...middayPriorAssessments[0], reportDate: '2026-07-27' }, middayPriorAssessments[1]],
  [middayPriorAssessments[0], { ...middayPriorAssessments[1], reportDate: '2026-07-28' }],
  [{ ...middayPriorAssessments[0], status: '错误状态' }, middayPriorAssessments[1]],
  [{ ...middayPriorAssessments[0], originalJudgement: '' }, middayPriorAssessments[1]],
  [{ ...middayPriorAssessments[0], validationEvidence: [] }, middayPriorAssessments[1]],
]) {
  test('拒绝不完整或不可追溯的午间判断验证记录', () => {
    const result = generateReport({
      reportType: 'midday_review',
      reportDate: '2026-07-28',
      evidence,
      priorAssessments,
    });

    assert.equal(result.kind, 'error');
    assert.equal(result.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
  });
}
```

- [x] **Step 2: 运行测试，确认这些失败场景当前未被完整拦截**

Run: `npm.cmd test`

Expected: 至少一个新测试未返回 `PRIOR_ASSESSMENT_INSUFFICIENT`，或午间请求仍在生成阶段失败。

- [x] **Step 3: 实现 `validatePriorAssessments`**

实现下列精确规则：

```ts
function validatePriorAssessments(
  value: unknown,
  reportDate: string,
): ValidationResult<PriorAssessment[]> {
  // 数组非空；每项必须是对象。
  // reportId、originalJudgement 为非空字符串；reportDate 为实际公历日期。
  // reportType 仅为 morning_scan 或 daily_review。
  // status 仅为 已验证、部分验证、未验证、失效。
  // morning_scan 日期等于 reportDate，daily_review 日期早于 reportDate。
  // 除 未验证 外，validationEvidence 至少一条且每条通过 isEvidenceItem。
  // 未验证 允许空数组；若非空，数组中每条仍必须通过 isEvidenceItem。
  // 最终同时至少存在一条当日 morning_scan 和一条此前 daily_review。
}
```

任一条件失败时返回：

```ts
fail('PRIOR_ASSESSMENT_INSUFFICIENT', '午间复盘必须包含可追溯的当日早盘和此前复盘判断验证记录。')
```

- [x] **Step 4: 将校验接入 `validateGenerateRequest`**

在 `input.reportType === 'midday_review'` 分支调用 `validatePriorAssessments(input.priorAssessments, input.reportDate)`。失败时直接返回其错误；成功时将归一化后的 `priorAssessments` 写入 `MiddayReviewRequest`。

- [x] **Step 5: 运行完整测试，确认失败路径全部通过且早盘兼容**

Run: `npm.cmd test`

Expected: 新增的无效验证记录测试全部通过；午间成功测试仅等待 Task 3 的渲染实现；既有早盘测试继续通过。

### Task 3: 生成安全的午间 HTML 并增强输出契约

**Files:**
- Modify: `report-engine/test/generate-report.test.mjs`
- Modify: `report-engine/src/html-policy.ts`
- Modify: `report-engine/src/index.ts`
- Modify: `report-engine/src/contract.ts`

**Consumes:** 已校验的 `MiddayReviewRequest` 和 `PriorAssessment[]`。

**Produces:** 安全的午间固定 HTML、带 `priorAssessments` 的 `MiddayReviewReport`，以及支持表格标签的 HTML 策略。

- [x] **Step 1: 写 HTML 表格和午间输出的失败测试**

```js
test('允许无属性的判断验证表格', () => {
  const result = validateHtmlPolicy(
    '<article><table><thead><tr><th>状态</th></tr></thead><tbody><tr><td>未验证</td></tr></tbody></table></article>',
  );

  assert.equal(result.ok, true);
});

test('拒绝判断验证表格上的危险属性', () => {
  const result = validateHtmlPolicy(
    '<article><table class="data"><tr><td>正文</td></tr></table></article>',
  );

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'UNSAFE_HTML');
});

test('午间复盘输出缺少判断验证记录时拒绝', () => {
  const result = validateGeneratedReport({
    reportType: 'midday_review',
    reportDate: '2026-07-28',
    title: '午间小复盘｜2026-07-28｜v1.0',
    version: 'v1.0',
    dataAsOf: '2026-07-28T11:30:00+08:00',
    sourceLinks: evidence,
    contentHtml: '<article><p>测试</p></article>',
  });

  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'PRIOR_ASSESSMENT_INSUFFICIENT');
});
```

- [x] **Step 2: 运行测试，确认表格和午间输出当前失败**

Run: `npm.cmd test`

Expected: 表格白名单测试失败，且午间输出仍未被完整构造或校验。

- [x] **Step 3: 扩展 `validateHtmlPolicy` 的无属性标签白名单**

将 `table`、`thead`、`tbody`、`tr`、`th`、`td` 添加至允许标签集合。不得改变 `<a>` 仅允许一个 HTTPS `href` 的规则，也不得为任何表格标签增加属性。

- [x] **Step 4: 在 `index.ts` 添加午间 HTML 构建分支**

新增私有文本转义函数并只对插入 HTML 的动态文本使用：

```ts
function escapeHtmlText(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
```

对 `midday_review` 构建固定正文：使用 `article`、`h1`、`h2`、`p`、`table`、`thead`、`tbody`、`tr`、`th`、`td` 和 `ul`；验证表逐行展示原报告日期、报告 ID、原判断和状态。不要将动态来源 URL 直接拼进 HTML；来源仍通过 `sourceLinks` 与 `priorAssessments.validationEvidence` 的结构化字段追溯。

午间分支必须返回：

```ts
{
  reportType: 'midday_review',
  reportDate: request.reportDate,
  title: `午间小复盘｜${request.reportDate}｜v1.0`,
  version: 'v1.0',
  dataAsOf: request.evidence[0]?.publishedAt ?? '',
  sourceLinks: request.evidence,
  priorAssessments: request.priorAssessments,
  contentHtml,
}
```

构造后继续执行既有 HTML 检查和 `validateGeneratedReport`，不可直接返回对象。

- [x] **Step 5: 扩展 `validateGeneratedReport` 的判别分支**

对 `morning_scan` 保持既有输出规则；对 `midday_review` 额外要求 `priorAssessments` 通过 `validatePriorAssessments(value.priorAssessments, value.reportDate)`，并在成功结果中保留该字段。未知输出类型继续返回 `OUTPUT_CONTRACT_VIOLATION`。

- [x] **Step 6: 运行完整测试，确认午间成功输出、HTML 表格与既有测试全部通过**

Run: `npm.cmd test`

Expected: 午间成功测试通过；合法表格通过；危险属性被拒绝；既有早盘和 PDF 不可用测试继续通过。

### Task 4: 同步文档、更新记录并做最终边界核查

**Files:**
- Modify: `docs/report-engine-architecture.md`
- Modify: `AGENTS.md`
- Modify: `docs/superpowers/specs/2026-07-28-midday-review-offline-slice-design.md`
- Modify: `docs/superpowers/plans/2026-07-28-midday-review-offline-slice.md`

**Consumes:** 已通过的本地测试结果和实际测试数量。

**Produces:** 与代码一致的架构状态、可恢复的项目记录和完成的计划状态。

- [x] **Step 1: 更新架构文档的原型状态**

在 `docs/report-engine-architecture.md` 的“本地固定样例原型”部分，记录 `morning_scan` 与 `midday_review` 均已实现；说明午间复盘使用结构化判断验证记录，并再次标明未接入真实交易日历、数据、模型、PDF 或云端。

- [x] **Step 2: 更新设计规格状态与项目交接记录**

将设计文档状态改为“已确认并实施；已通过本地回归测试”。在 `AGENTS.md` 末尾新增一条记录，写明：实际测试数量、`PRIOR_ASSESSMENT_INSUFFICIENT` 语义、HTML 表格白名单、尚未实现的六类报告与所有外部能力边界。

- [x] **Step 3: 运行最终验证**

Run: `npm.cmd test`

Run: `rg -n "fetch\\(|process\\.env|coze|supabase|vercel|playwright|puppeteer" src test package.json`

Expected: 全部测试通过；边界扫描没有命中。若 `rg` 以退出码 1 表示未命中，将其视为通过而不是失败。

- [x] **Step 4: 将已验证步骤标记完成**

仅在对应步骤已经执行且测试通过后，将本计划的复选框改为 `[x]`。不执行 Git 操作；最终交付必须列出所有修改文件的完整路径、测试结果及未完成边界。
