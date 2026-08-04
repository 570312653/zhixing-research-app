# Report Visual Renderer Offline Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为现有三类离线报告实现共享的完整 HTML 视觉渲染器，覆盖桌面、手机卡片和 A4 打印样式，同时保持现有安全与失败关闭边界。

**Architecture:** `contentHtml` 继续作为受限语义正文；新增 `renderReportDocument` 在正文校验成功后包装应用控制的 HTML 外壳和 CSS。移动表格通过严格允许的 `td[data-label]` 与响应式 CSS 转卡片，不开放任意 class、style 或脚本。

**Tech Stack:** TypeScript 7、Node.js 20+ 内置测试运行器、固定 HTML/CSS、无新增运行时依赖。

## Global Constraints

- 仅允许本地固定夹具。
- 不接网络、真实数据、交易日历、模型、密钥、环境变量、Coze、Vercel、Supabase、日程、用户、归档、发布或通知。
- 不安装 Chromium 或 Playwright，不生成真实 PDF。
- 动态报告正文不得获得 `class`、`style`、`script` 或任意属性能力。
- 所有代码步骤必须先看到对应测试按预期失败。
- 当前目录不是 Git 仓库，不执行提交步骤；每个任务以测试通过和文件清单作为检查点。

---

### Task 1: 受控移动表格标签

**Files:**
- Modify: `report-engine/test/generate-report.test.mjs`
- Modify: `report-engine/src/html-policy.ts`
- Modify: `report-engine/src/index.ts`

**Interfaces:**
- Consumes: `validateHtmlPolicy(html: string): HtmlPolicyResult`
- Produces: 仅允许 `td` 使用一个安全的 `data-label` 属性；午间和每日复盘判断表自动携带对应标签。

- [x] **Step 1: 写入失败测试**

新增测试：

```js
test('允许 td 使用安全的 data-label 供手机卡片显示', () => {
  const result = validateHtmlPolicy(
    '<table><tbody><tr><td data-label="状态">未验证</td></tr></tbody></table>',
  );
  assert.equal(result.ok, true);
});
```

同时测试拒绝：

```html
<td data-label="状态" onclick="alert(1)">未验证</td>
<td data-label="<script>">未验证</td>
<th data-label="状态">状态</th>
```

并断言午间与每日复盘成功输出包含 `data-label="原报告日期"`、`data-label="报告 ID"`、`data-label="原判断"`和`data-label="状态"`。

- [x] **Step 2: 运行测试确认 RED**

运行：

```powershell
npm.cmd test
```

预期：新安全标签测试失败，原有测试仍可运行。

- [x] **Step 3: 最小实现属性校验**

在 `validateAttributes` 中增加 `td` 分支：

- 只匹配一个带单引号或双引号的 `data-label`。
- 标签长度为 1–32 个字符。
- 拒绝控制字符、`<`、`>`、单双引号和多余属性。
- `a[href]`与无属性标签逻辑保持不变。

- [x] **Step 4: 给判断表单元格添加固定标签**

修改 `priorAssessmentsTable` 的四个 `td`，标签值由代码常量提供，单元格动态文本继续使用 `escapeHtmlText`。

- [x] **Step 5: 运行测试确认 GREEN**

运行：

```powershell
npm.cmd test
```

预期：全部测试通过。

---

### Task 2: 完整 HTML 文档渲染器

**Files:**
- Create: `report-engine/src/report-template.ts`
- Modify: `report-engine/src/index.ts`
- Create: `report-engine/test/report-template.test.mjs`

**Interfaces:**
- Consumes: `validateGeneratedReport(value: unknown)`
- Produces:

```ts
export type ReportDocumentResult =
  | { kind: 'success'; html: string }
  | GenerateError;

export function renderReportDocument(value: unknown): ReportDocumentResult;
```

- [x] **Step 1: 写入失败测试**

覆盖：

- `<!doctype html>`、`lang="zh-CN"`、UTF-8、viewport。
- CSS变量`--brand-navy: #1e3a8a`和最大宽度`1120px`。
- 页眉包含“知行”、报告标题、日期、版本和数据截至时间。
- 正文只出现一次，末尾包含来源和固定风险提示。
- 标题中的`<`、`>`、`&`和引号被转义。
- 不合法报告对象返回结构化错误，不生成 HTML。

- [x] **Step 2: 运行指定测试确认 RED**

运行：

```powershell
npm.cmd run build
node --test test/report-template.test.mjs
```

预期：由于模块或导出不存在而失败。

- [x] **Step 3: 实现最小渲染器**

`report-template.ts`：

- 调用 `validateGeneratedReport`。
- 使用本地 `escapeHtmlText` 处理标题和来源标题。
- 使用固定映射显示报告类型中文名。
- 构建受信任的页面外壳、元数据栏、正文区、来源区和页脚。
- 将固定 CSS 放在模块常量中。
- 不读取系统时间、文件、环境变量或网络。

- [x] **Step 4: 从入口导出渲染器**

在 `src/index.ts` 增加：

```ts
export { renderReportDocument } from './report-template.js';
```

- [x] **Step 5: 运行测试确认 GREEN**

运行：

```powershell
npm.cmd test
```

预期：原有与新增测试全部通过。

---

### Task 3: 响应式与 A4 打印样式

**Files:**
- Modify: `report-engine/src/report-template.ts`
- Modify: `report-engine/test/report-template.test.mjs`

**Interfaces:**
- Consumes: 固定页面外壳和`td[data-label]`
- Produces: 桌面表格、390px手机信息卡和 A4 打印规则。

- [x] **Step 1: 写入失败测试**

断言样式包含：

```css
@media (max-width: 767px)
content: attr(data-label)
@page
size: A4
break-inside: avoid
```

并断言固定颜色、字体栈、章节间距、表头和风险提示样式存在。

- [x] **Step 2: 运行指定测试确认 RED**

```powershell
node --test test/report-template.test.mjs
```

预期：响应式或打印规则断言失败。

- [x] **Step 3: 增加最小 CSS**

- 桌面正文最大宽度 1120px。
- 深蓝表头、浅灰斑马行、长文本换行。
- 小于 768px 时隐藏表头并把每个 `tr` 变成卡片。
- `td::before` 使用 `data-label`。
- 打印时使用 A4、固定页边距、隐藏屏幕阴影，避免标题、表格行和风险提示被切开。

- [x] **Step 4: 运行全量测试确认 GREEN**

```powershell
npm.cmd test
```

预期：全部通过且无警告。

---

### Task 4: 三类本地视觉预览

**Files:**
- Create: `report-engine/scripts/generate-visual-previews.mjs`
- Modify: `report-engine/package.json`
- Create at runtime: `report-engine/artifacts/visual/morning-scan.html`
- Create at runtime: `report-engine/artifacts/visual/midday-review.html`
- Create at runtime: `report-engine/artifacts/visual/daily-review.html`

**Interfaces:**
- Consumes: `generateReport`与`renderReportDocument`
- Produces: 三份只含固定样例的完整 HTML 预览。

- [x] **Step 1: 写入失败测试**

在`report-template.test.mjs`中确认三种`GeneratedReport`都能由`renderReportDocument`渲染成功。

- [x] **Step 2: 运行测试确认 RED**

预期：尚未满足三类预览断言。

- [x] **Step 3: 创建预览脚本**

脚本只使用 Node 内置`fs/promises`和固定夹具：

- 先调用`generateReport`。
- 失败时设置非零退出码。
- 成功后调用`renderReportDocument`。
- 输出到`artifacts/visual/`。
- 不读取环境变量或网络。

- [x] **Step 4: 增加 package script**

```json
"preview:visual": "npm run build && node scripts/generate-visual-previews.mjs"
```

- [x] **Step 5: 生成预览**

```powershell
npm.cmd run preview:visual
```

预期：三份 HTML 文件生成成功。

- [x] **Step 6: 视觉检查**

检查桌面约 1440px、手机约 390px和打印预览：

- 页眉、元数据、正文、来源和风险提示完整。
- 手机判断表转换为字段卡且字段名不丢失。
- A4打印无明显横向溢出。

---

### Task 5: 文档、边界与最终验证

**Files:**
- Modify: `docs/current-status.md`
- Modify: `docs/report-engine-architecture.md`
- Modify: `docs/README.md`
- Modify: `_system/context/current-projects.md`
- Modify: `_system/tasks/done.md`
- Append: `_system/diary/2026-07-30.md`

**Interfaces:**
- Consumes: 实际测试和视觉检查结果
- Produces: 与代码一致的状态、边界和下一步记录。

- [x] **Step 1: 运行全量测试**

```powershell
npm.cmd test
```

记录实际测试数量，不能预写通过结论。

- [x] **Step 2: 扫描外部能力**

```powershell
rg -n --glob '!node_modules/**' "fetch\\(|axios|https?\\.request|process\\.env|COZE|SUPABASE|VERCEL" src test scripts
```

预期：没有可执行外部能力接入。

- [x] **Step 3: 同步文档**

记录：

- 三类报告已有共享视觉渲染器。
- 手机表格卡与 A4 打印 CSS 已实现。
- 正式 PDF、`generatedAt`、真实数据和外部服务仍未实现。
- 下一候选切片为`industry_tracking`。

- [x] **Step 4: 自审计划覆盖**

- 检查本计划没有未处理的占位项。
- 检查接口名在设计、实现和测试中一致。
- 检查文档没有把打印 CSS 误写成 PDF 已完成。

- [x] **Step 5: 最终回归**

再次运行：

```powershell
npm.cmd test
npm.cmd run preview:visual
```

预期：测试全部通过，三份预览可重新生成。
