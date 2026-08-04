# 离线报告引擎原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一个不连接真实数据、模型、Coze 或云端服务的 TypeScript 报告引擎骨架，验证单份早盘扫描从固定证据输入到严格 JSON、受控 HTML 和结构化错误的完整链路。

**Architecture:** `generateReport` 是唯一入口，依次完成请求校验、固定证据完整性校验、正文合规检查和 HTML 渲染。它不负责获取数据、不负责调用模型、不负责调度或存储；这些能力以后通过独立适配器接入。合法结果使用 `kind: "success"`，失败结果使用固定错误码，禁止抛出未处理异常。

**Tech Stack:** Node.js 24、TypeScript、Node 内置 `node:test`、Node 内置 `assert`；无第三方运行时依赖。

## Global Constraints

- 仅允许 `morning_scan` 通过本切片；其他六种类型必须得到 `UNSUPPORTED_REPORT_TYPE`，以避免假装已实现。
- 不联网、不读取环境变量、不接模型、不创建日程、不访问 Vercel、Supabase 或 Coze。
- 输入必须携带至少一条可追溯来源；缺失时返回 `SOURCE_EVIDENCE_INSUFFICIENT`。
- 输出包含一份报告对象和受控 HTML，不包含买卖、仓位、收益承诺或个性化建议。
- 生成 PDF 仅定义后续接口边界；本切片不安装 Chromium、Playwright 或 PDF 依赖。

---

### Task 1: 建立可测试的 TypeScript 包

**Files:**

- Create: `report-engine/package.json`
- Create: `report-engine/tsconfig.json`
- Create: `report-engine/test/generate-report.test.mjs`

**Interfaces:**

- Consumes: 无。
- Produces: `npm.cmd test` 先执行 TypeScript 编译，再执行 Node 测试；测试预期导入 `dist/index.js` 的 `generateReport`。

- [x] **Step 1: 创建最小包配置（不含生产实现）**

```json
{
  "private": true,
  "type": "module",
  "scripts": { "build": "tsc -p tsconfig.json", "test": "npm run build && node --test test/*.test.mjs" }
}
```

- [x] **Step 2: 创建第一个失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateReport } from '../dist/index.js';

test('用完整固定证据生成一份早盘扫描', () => {
  const result = generateReport({
    reportType: 'morning_scan',
    reportDate: '2026-07-28',
    evidence: [{ title: '测试来源', url: 'https://example.com/source', publishedAt: '2026-07-28T08:00:00+08:00' }],
  });

  assert.equal(result.kind, 'success');
  assert.equal(result.report.reportType, 'morning_scan');
  assert.match(result.report.contentHtml, /仅供信息参考，不构成投资建议/);
});
```

- [x] **Step 3: 运行测试并确认失败**

Run: `npm.cmd test`

Expected: 编译失败，原因是 `src/index.ts` 与 `generateReport` 尚不存在。

- [x] **Step 4: 创建最小实现入口**

```ts
export function generateReport() {
  return { kind: 'success' };
}
```

- [x] **Step 5: 运行测试并确认下一项断言失败**

Run: `npm.cmd test`

Expected: 测试不再是模块缺失错误，而是报告字段断言失败。

### Task 2: 实现合法固定样例的严格成功结果

**Files:**

- Modify: `report-engine/src/index.ts`
- Test: `report-engine/test/generate-report.test.mjs`

**Interfaces:**

- Consumes: `GenerateRequest`，包含 `reportType`、`reportDate` 和 `evidence`。
- Produces: `GenerateSuccess`，包含唯一一份 `report`、版本、数据截至时间、来源和受控 `contentHtml`。

- [x] **Step 1: 扩展失败测试，断言只返回一份报告和固定风险提示**

```js
assert.equal(Array.isArray(result.report), false);
assert.equal(result.report.title, '早盘扫描｜2026-07-28｜v1.0');
assert.equal(result.report.sourceLinks.length, 1);
assert.match(result.report.contentHtml, /^<article>/);
```

- [x] **Step 2: 运行测试并确认失败**

Run: `npm.cmd test`

Expected: 标题、来源或 HTML 断言失败，而不是测试配置错误。

- [x] **Step 3: 用最小实现构造成功报告**

```ts
return {
  kind: 'success',
  report: {
    reportType: 'morning_scan',
    reportDate: request.reportDate,
    title: `早盘扫描｜${request.reportDate}｜v1.0`,
    version: 'v1.0',
    contentHtml: '<article>...</article>',
    sourceLinks: request.evidence,
  },
};
```

- [x] **Step 4: 运行测试并确认通过**

Run: `npm.cmd test`

Expected: 合法固定样例通过。

### Task 3: 实现失败关闭与合规校验

**Files:**

- Modify: `report-engine/src/index.ts`
- Modify: `report-engine/test/generate-report.test.mjs`

**Interfaces:**

- Consumes: 不同的报告类型、日期、来源和可选 `draftHtml`。
- Produces: `GenerateError`，格式为 `{ kind: 'error', errorCode: string, message: string }`。

- [x] **Step 1: 新增四个失败测试**

```js
assert.equal(generateReport({ reportType: 'daily_review', reportDate: '2026-07-28', evidence }).errorCode, 'UNSUPPORTED_REPORT_TYPE');
assert.equal(generateReport({ reportType: 'morning_scan', reportDate: '', evidence }).errorCode, 'INVALID_REPORT_DATE');
assert.equal(generateReport({ reportType: 'morning_scan', reportDate: '2026-07-28', evidence: [] }).errorCode, 'SOURCE_EVIDENCE_INSUFFICIENT');
assert.equal(generateReport({ reportType: 'morning_scan', reportDate: '2026-07-28', evidence, draftHtml: '<p>建议买入</p>' }).errorCode, 'COMPLIANCE_VIOLATION');
```

- [x] **Step 2: 运行测试并确认失败**

Run: `npm.cmd test`

Expected: 四个测试至少因尚未实现的校验失败。

- [x] **Step 3: 实现枚举、日期、来源和违规词校验**

```ts
if (request.reportType !== 'morning_scan') return error('UNSUPPORTED_REPORT_TYPE');
if (!/^\d{4}-\d{2}-\d{2}$/.test(request.reportDate)) return error('INVALID_REPORT_DATE');
if (request.evidence.length === 0) return error('SOURCE_EVIDENCE_INSUFFICIENT');
if (/建议买入|建议卖出|满仓|保证收益/.test(html)) return error('COMPLIANCE_VIOLATION');
```

- [x] **Step 4: 运行测试并确认全部通过**

Run: `npm.cmd test`

Expected: 合法与四类失败路径全部通过。

### Task 4: 定义 HTML→PDF 的后续接口边界并同步状态

**Files:**

- Create: `report-engine/src/pdf.ts`
- Modify: `report-engine/src/index.ts`
- Modify: `report-engine/test/generate-report.test.mjs`
- Modify: `docs/report-engine-architecture.md`

**Interfaces:**

- Consumes: 已通过校验的 HTML。
- Produces: `PdfRenderer` 接口；当前 `UnavailablePdfRenderer` 明确返回 `PDF_RENDERER_UNAVAILABLE`，绝不伪造 PDF。

- [x] **Step 1: 写失败测试，期望未配置渲染器时返回确定错误码**

```js
const result = await renderPdf('<article>test</article>');
assert.equal(result.kind, 'error');
assert.equal(result.errorCode, 'PDF_RENDERER_UNAVAILABLE');
```

- [x] **Step 2: 运行测试并确认失败**

Run: `npm.cmd test`

Expected: `renderPdf` 模块或导出不存在。

- [x] **Step 3: 定义无外部依赖的渲染器接口与不可用实现**

```ts
export async function renderPdf() {
  return { kind: 'error', errorCode: 'PDF_RENDERER_UNAVAILABLE', message: '本地原型未配置 Chromium 渲染器。' };
}
```

- [x] **Step 4: 运行全部测试，并将架构文档状态更新为“固定样例原型已完成”**

Run: `npm.cmd test`

Expected: 所有测试通过；文档只更新原型状态与验收结果，不宣称已接入真实数据或 PDF。
