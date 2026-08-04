# 报告引擎契约加固 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为离线 `morning_scan` 原型建立运行时输入、来源、HTML 和输出校验，使不可信输入在生成前失败关闭，并同步清理活动文档中的 Coze 路线歧义。

**Architecture:** 新增 `contract.ts` 处理未知输入、日期、来源与成功输出的运行时校验；新增 `html-policy.ts` 处理允许标签、属性、链接协议和合规词。`index.ts` 只负责按固定顺序编排校验与构造报告；不访问网络、环境变量或文件系统。

**Tech Stack:** Node.js 24、TypeScript 7.0.2、Node 内置 `node:test` 与 `assert`；不新增运行时依赖。

## Global Constraints

- 本切片只接受 `morning_scan`；其余六种报告类型继续返回 `UNSUPPORTED_REPORT_TYPE`。
- `generateReport` 的入参必须改为 `unknown`，不能仅依赖编译时类型。
- HTML 发现不安全内容时必须返回错误，不得静默删除或改写正文。
- 不联网、不读取环境变量、不调用模型、不配置 PDF/Chromium、不修改 Coze、Vercel、Supabase 或用户资源。
- 测试命令固定为在 `report-engine/` 目录执行 `npm.cmd test`。

---

### Task 1: 建立运行时输入、来源与输出契约

**Files:**

- Create: `report-engine/src/contract.ts`
- Modify: `report-engine/src/index.ts`
- Modify: `report-engine/test/generate-report.test.mjs`

**Interfaces:**

- Produces `validateGenerateRequest(input: unknown): ValidationResult<GenerateRequest>`。
- Produces `validateGeneratedReport(value: unknown): ValidationResult<GeneratedReport>`。
- `ValidationResult<T>` 为 `{ ok: true, value: T } | { ok: false, error: GenerateError }`。
- `GenerateError.errorCode` 需要包含既有错误码，以及 `OUTPUT_CONTRACT_VIOLATION`。

- [x] **Step 1: 写失败测试，要求拒绝不真实日期和无效来源**

```js
test('拒绝不存在的公历日期', () => {
  const result = generateReport({ reportType: 'morning_scan', reportDate: '2026-02-31', evidence });
  assert.deepEqual(result, {
    kind: 'error',
    errorCode: 'INVALID_REPORT_DATE',
    message: 'reportDate 必须是实际存在的 YYYY-MM-DD 日期。',
  });
});

test('拒绝 HTTP 来源和非法来源时间', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence: [{ title: '来源', url: 'http://example.com', publishedAt: 'not-a-time' }],
  });
  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'SOURCE_EVIDENCE_INSUFFICIENT');
});
```

- [x] **Step 2: 运行测试并确认失败**

Run: `npm.cmd test`

Expected: `2026-02-31` 当前被错误接受，HTTP/非法时间来源当前被错误接受。

- [x] **Step 3: 创建 `contract.ts` 的最小运行时校验器**

```ts
export function validateGenerateRequest(input: unknown): ValidationResult<GenerateRequest> {
  if (!isRecord(input)) return fail('INVALID_REQUEST', '请求必须是对象。');
  if (input.reportType !== 'morning_scan') return fail('UNSUPPORTED_REPORT_TYPE', '当前固定样例原型只实现 morning_scan。');
  if (!isCalendarDate(input.reportDate)) return fail('INVALID_REPORT_DATE', 'reportDate 必须是实际存在的 YYYY-MM-DD 日期。');
  if (!Array.isArray(input.evidence) || input.evidence.length === 0 || !input.evidence.every(isEvidenceItem)) {
    return fail('SOURCE_EVIDENCE_INSUFFICIENT', '每条来源都必须包含标题、HTTPS URL 和 ISO-8601 时间。');
  }
  if (input.draftHtml !== undefined && typeof input.draftHtml !== 'string') return fail('INVALID_REQUEST', 'draftHtml 必须是字符串。');
  return { ok: true, value: { reportType: input.reportType, reportDate: input.reportDate, evidence: input.evidence, draftHtml: input.draftHtml } };
}
```

`isCalendarDate` 必须使用 `Date.UTC(year, month - 1, day)` 回写比较年月日；`isEvidenceItem` 必须使用 `new URL(url).protocol === 'https:'` 和 ISO 时间格式加 `Date.parse` 双重判断。

- [x] **Step 4: 让 `generateReport(input: unknown)` 先调用输入校验，并运行测试**

Run: `npm.cmd test`

Expected: 新增日期和来源测试通过，现有六项测试继续通过。

- [x] **Step 5: 写失败测试，要求错误输出不会被当作合格报告**

```js
test('拒绝缺少标题的成功报告对象', () => {
  const result = validateGeneratedReport({ reportType: 'morning_scan' });
  assert.equal(result.ok, false);
  assert.equal(result.error.errorCode, 'OUTPUT_CONTRACT_VIOLATION');
});
```

- [x] **Step 6: 实现 `validateGeneratedReport` 并在 `index.ts` 返回成功前调用它**

`validateGeneratedReport` 必须检查 `reportType`、实际日期、非空 `title`、精确 `version: 'v1.0'`、可解析 `dataAsOf`、非空来源和字符串 HTML。固定报告对象校验失败时，`generateReport` 必须返回同一个结构化错误，而不是返回部分成功对象。

- [x] **Step 7: 运行测试并确认全部通过**

Run: `npm.cmd test`

Expected: 新增输出契约测试和此前所有测试通过。

### Task 2: 建立拒绝式 HTML 与合规策略

**Files:**

- Create: `report-engine/src/html-policy.ts`
- Modify: `report-engine/src/index.ts`
- Modify: `report-engine/test/generate-report.test.mjs`

**Interfaces:**

- Produces `validateHtmlPolicy(html: string): ValidationResult<string>`。
- 允许标签：`article`、`h1`、`h2`、`p`、`ul`、`ol`、`li`、`strong`、`em`、`a`。
- 唯一允许属性：`a[href]`；其值必须是 HTTPS URL。
- `GenerateError.errorCode` 新增 `UNSAFE_HTML`，原 `COMPLIANCE_VIOLATION` 保留。

- [x] **Step 1: 写失败测试，覆盖不安全标签、属性和链接**

```js
for (const draftHtml of [
  '<article><script>alert(1)</script></article>',
  '<article><p onclick="alert(1)">正文</p></article>',
  '<article><a href="http://example.com">来源</a></article>',
  '<article><img src="https://example.com/a.png"></article>',
]) {
  const result = generateReport({ reportType: 'morning_scan', reportDate: '2026-07-28', evidence, draftHtml });
  assert.equal(result.kind, 'error');
  assert.equal(result.errorCode, 'UNSAFE_HTML');
}
```

- [x] **Step 2: 运行测试并确认失败**

Run: `npm.cmd test`

Expected: 四个 HTML 输入当前被错误接受。

- [x] **Step 3: 实现有限标签解析与拒绝策略**

`validateHtmlPolicy` 必须按标签顺序扫描，维护打开标签栈，拒绝未知标签、未闭合标签、自闭合标签、空标签名、事件属性和未允许属性。对 `<a>` 仅接受单个带引号的 `href`，并使用 `new URL(href).protocol === 'https:'` 检查协议。对其余标签拒绝所有属性。扫描完成时栈必须为空。

在 HTML 安全检查通过后，用 `/建议买入|建议卖出|满仓|保证收益/u` 检查正文；命中时返回 `COMPLIANCE_VIOLATION`。

- [x] **Step 4: 将 HTML 策略接入生成与输出校验**

`index.ts` 必须在构造报告前校验 `draftHtml` 或固定 HTML；`validateGeneratedReport` 必须再次调用 `validateHtmlPolicy`。`contentHtml` 只在两次检查均通过后才出现在成功结果中。

- [x] **Step 5: 写合法 HTML 测试并运行全部测试**

```js
test('允许限定标签和 HTTPS 来源链接', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence,
    draftHtml: '<article><h1>早盘</h1><p><a href="https://example.com/source">来源</a></p></article>',
  });
  assert.equal(result.kind, 'success');
});
```

Run: `npm.cmd test`

Expected: 所有安全、合规和既有测试通过。

### Task 3: 同步活动文档与验收状态

**Files:**

- Modify: `docs/product-requirements.md`
- Modify: `AGENTS.md`
- Modify: `docs/report-engine-architecture.md`

**Interfaces:**

- `docs/product-requirements.md` 的标的池字段使用“报告引擎提供的关联依据”。
- `AGENTS.md` 顶部明确旧 Coze 章节仅可作历史审计；恢复工作必须以报告引擎文档和最新引擎记录为准。

- [x] **Step 1: 修改产品需求中的单个责任归属字段**

将“Coze 提供的关联依据”替换为“报告引擎提供的关联依据”，不改动字段含义或标的池业务规则。

- [x] **Step 2: 修改 AGENTS 顶部的恢复规则**

增加一条明确规则：在第 0 节之后的 Coze 内容只用于历史审计；所有新的实现、测试和决策必须以 `docs/report-engine-architecture.md`、当前规格和最新引擎记录为准。

- [x] **Step 3: 更新架构文档的首个切片状态**

将“受控 HTML/严格 JSON”改为“运行时输入、输出和 HTML 策略校验已完成（待测试验证）”，并保留“PDF、数据源、模型和调度未实现”的边界。

- [x] **Step 4: 运行回归测试与文本核查**

Run: `npm.cmd test`

Run: `rg -n "Coze 提供的关联依据|Coze.*正式报告生成依赖" docs/product-requirements.md AGENTS.md`

Expected: 测试全部通过；产品需求不再出现旧字段；AGENTS 顶部存在历史审计和恢复依据说明。

### Task 4: 更新执行记录与最终边界扫描

**Files:**

- Modify: `AGENTS.md`
- Modify: `docs/superpowers/plans/2026-07-28-report-engine-contract-hardening.md`

**Interfaces:**

- `AGENTS.md` 记录实际测试数量、错误码和未完成边界。

- [x] **Step 1: 将每个已完成计划步骤标记为 `[x]`**

仅在相应测试通过后修改该步骤；不得把未执行步骤提前标记完成。

- [x] **Step 2: 写入报告引擎契约加固的完成记录**

记录实际实现的错误码、运行命令、测试结果，以及“尚未接入真实交易日历、数据源、模型、PDF 或云端”的边界。

- [x] **Step 3: 执行最终边界扫描**

Run: `rg -n "fetch\(|process\.env|coze|supabase|vercel|playwright|puppeteer" src test package.json`

Expected: 原型代码、测试和包配置中没有网络、密钥、Coze、Vercel、Supabase 或浏览器 PDF 集成。
