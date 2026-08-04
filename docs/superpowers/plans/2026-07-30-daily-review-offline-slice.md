# 每日复盘离线切片 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为本地报告引擎增加可追溯、失败关闭且仅使用固定夹具的 `daily_review`，同时保持 `morning_scan` 与 `midday_review` 的既有行为不变。

**Architecture:** 在 `contract.ts` 用判别联合类型引入每日复盘请求/输出，并为前序判断提供按报告类型区分的验证规则。`daily_review` 必须显式获得 `dataAsOf`，并由 `index.ts` 生成固定 HTML；所有动态文本转义后，仍须通过 HTML、合规和最终输出契约校验。

**Tech Stack:** TypeScript（严格模式）、Node 内置测试框架、现有零依赖 HTML 拒绝策略。

## Global Constraints

- 仅允许内存中的本地固定夹具；不得接入网络、真实数据、真实交易日历、模型、密钥、环境变量、PDF、日程、部署、用户、归档、发布、通知或任何云端服务。
- 内容只能是非个人化市场研究；不得输出交易指令、收益承诺、用户持仓、交易或盈亏信息。
- `daily_review` 只能消费显式传入的 `evidence`、`dataAsOf` 和 `priorAssessments`；不得读取文件或此前运行结果，也不接受 `draftHtml`。
- HTML 继续采用拒绝策略：仅允许既有白名单标签，除 `a[href]` 外拒绝所有属性，链接只允许无凭证 HTTPS URL。
- 不执行 Git、部署或外部配置操作；测试只在本地 `report-engine/` 目录执行。

---

## 文件结构

- 修改：`report-engine/src/contract.ts`，新增每日复盘判别类型、显式 `dataAsOf`、`marketScopes` 与按报告类型校验的前序判断规则。
- 修改：`report-engine/src/index.ts`，生成每日复盘的固定 HTML，并将输入、HTML 与最终输出按既有顺序校验。
- 修改：`report-engine/test/generate-report.test.mjs`，补充每日复盘的成功、失败与兼容回归测试。
- 修改：`report-engine/src/prior-assessment.types.test.ts`，锁定扩展后的前序类型联合。
- 修改：`docs/report-engine-architecture.md`、`docs/coze-report-output-standard.md`，同步固定样例范围与内容标准。
- 新增：`docs/superpowers/specs/2026-07-30-daily-review-offline-slice-design.md`，保存已确认的设计与验收边界。

## 公共接口

```ts
export type PriorAssessment = {
  reportId: string;
  reportDate: string;
  reportType: 'morning_scan' | 'midday_review' | 'daily_review';
  originalJudgement: string;
  status: '已验证' | '部分验证' | '未验证' | '失效';
  validationEvidence: EvidenceItem[];
};

export type DailyReviewRequest = {
  reportType: 'daily_review';
  reportDate: string;
  evidence: EvidenceItem[];
  dataAsOf: string;
  priorAssessments: PriorAssessment[];
};

export type DailyReviewReport = BaseReport & {
  reportType: 'daily_review';
  marketScopes: ['cn_a'];
  priorAssessments: PriorAssessment[];
};
```

### Task 1: 建立每日复盘请求与前序判断测试

**Files:**
- Modify: `report-engine/test/generate-report.test.mjs`
- Modify: `report-engine/src/prior-assessment.types.test.ts`

**Consumes:** 既有固定 `EvidenceItem` 夹具、早盘与午间复盘的结构化判断。

**Produces:** 可验证的每日复盘成功夹具，以及覆盖前序判断关系的失败测试。

- [x] **Step 1: 添加每日复盘成功夹具**

```ts
const dailyPriorAssessments = [
  {
    reportId: 'morning-2026-07-30-v1.0',
    reportDate: '2026-07-30',
    reportType: 'morning_scan',
    originalJudgement: '外围风险仍需由 A 股全天表现验证。',
    status: '部分验证',
    validationEvidence: evidence,
  },
  {
    reportId: 'midday-2026-07-30-v1.0',
    reportDate: '2026-07-30',
    reportType: 'midday_review',
    originalJudgement: '午后量能与板块分化仍需收盘确认。',
    status: '已验证',
    validationEvidence: evidence,
  },
];
```

- [x] **Step 2: 添加成功断言**

```ts
const result = generateReport({
  reportType: 'daily_review',
  reportDate: '2026-07-30',
  evidence,
  dataAsOf: '2026-07-30T15:30:00+08:00',
  priorAssessments: dailyPriorAssessments,
});

assert.equal(result.kind, 'success');
assert.deepEqual(result.report.marketScopes, ['cn_a']);
```

- [x] **Step 3: 添加失败路径**

分别覆盖缺少同日早盘、缺少同日午间、错误日期、同日 `daily_review` 自引用、空原判断、非法状态、非“未验证”状态缺少证据、非法 `dataAsOf` 与提供 `draftHtml`。所有前序判断失败断言为 `PRIOR_ASSESSMENT_INSUFFICIENT`；非法 `dataAsOf` 与 `draftHtml` 断言为 `INVALID_REQUEST`。

### Task 2: 实现判别契约与失败关闭校验

**Files:**
- Modify: `report-engine/src/contract.ts`

**Consumes:** `DailyReviewRequest`、`PriorAssessment`、既有日期、来源、HTML 与合规校验器。

**Produces:** 受支持的每日复盘请求/输出和类型感知的 `validatePriorAssessments`。

- [x] **Step 1: 扩展报告类型联合**

将 `daily_review` 加入 `SupportedReportType`、`GenerateRequest` 与 `GeneratedReport`，同时为每日复盘输出加入 `marketScopes: ['cn_a']`。

- [x] **Step 2: 校验每日复盘输入**

要求 `dataAsOf` 为带时区 ISO-8601 时间；拒绝任何 `draftHtml`。每天的前序判断必须同时有同日 `morning_scan` 与 `midday_review`；`daily_review` 若存在只能早于当前日期，不能同日自引用。

- [x] **Step 3: 保持午间规则不变**

午间复盘继续要求同日 `morning_scan` 与此前 `daily_review`。前序验证器根据目标报告类型选择规则，而不是以每日复盘规则覆盖午间行为。

- [x] **Step 4: 复用既有错误码**

前序关系与证据失败返回 `PRIOR_ASSESSMENT_INSUFFICIENT`；最终输出不合格返回 `OUTPUT_CONTRACT_VIOLATION`，不创建新错误码。

### Task 3: 构建固定 HTML 与最终输出

**Files:**
- Modify: `report-engine/src/index.ts`
- Modify: `report-engine/test/generate-report.test.mjs`

**Consumes:** 已归一化的 `DailyReviewRequest`。

**Produces:** 含 `marketScopes: ['cn_a']` 和前序判断表的 `DailyReviewReport`。

- [x] **Step 1: 固定编排每日复盘 HTML**

按“总览、市场表现、主线与板块、重要事件与公告、情绪与结构观察、当日判断验证表、次日观察清单、风险提示”的顺序生成 HTML；不允许调用方覆盖该模板。

- [x] **Step 2: 转义动态判断字段**

对报告 ID、日期、原判断和状态应用既有文本转义；来源与验证证据仅保留在结构化字段中，不把动态 URL 拼入 HTML。

- [x] **Step 3: 双重校验后返回**

固定 HTML 先经过 `validateHtmlPolicy`，构造报告后再由 `validateGeneratedReport` 复核；任一失败直接返回结构化错误，不返回部分成功结果。

### Task 4: 回归验证与文档同步

**Files:**
- Modify: `report-engine/test/generate-report.test.mjs`
- Modify: `docs/report-engine-architecture.md`
- Modify: `docs/coze-report-output-standard.md`
- Create: `docs/superpowers/specs/2026-07-30-daily-review-offline-slice-design.md`

**Consumes:** 每日复盘成功/失败测试和已确认的固定样例边界。

**Produces:** 可复核的本地测试结果与一致的规格文档。

- [x] **Step 1: 运行本地回归**

Run: `npm.cmd test`（工作目录：`report-engine/`）

Expected: 每日复盘新增测试、既有早盘与午间测试均通过。

- [x] **Step 2: 执行边界扫描**

Run: `rg -n "fetch\\(|process\\.env|coze|supabase|vercel|playwright|puppeteer" src test package.json`（工作目录：`report-engine/`）

Expected: 无命中；`rg` 的退出码 `1` 代表没有匹配，应视为通过。

- [x] **Step 3: 同步文档**

记录每日复盘只使用固定夹具、显式 `dataAsOf`、同日早盘和午间判断验证、`['cn_a']` 市场范围、固定风险提示，以及仍未接入的真实数据和交易日历边界。

## 自检结论

- 规格覆盖：四个任务分别覆盖测试、契约、固定渲染及文档同步。
- 兼容性：每日规则与午间规则分支处理，避免改变既有 `morning_scan`、`midday_review` 的可观察行为。
- 范围：没有新增外部依赖、真实数据能力或生产运行时设计。
