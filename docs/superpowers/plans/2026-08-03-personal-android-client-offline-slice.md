# Personal Android Client Offline Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement task-by-task. Use `superpowers:test-driven-development` for every behavior change and `superpowers:verification-before-completion` before claiming completion.

**Goal:** 创建可安装在个人 Android 真机上的“知行”调试 APK，用固定去敏样例完整实现九个已批准页面、跨页面状态、品牌视觉、离线导航和受控报告阅读。

**Architecture:** `client-app/` 是独立 React/Vite/Capacitor 8 客户端。Hash 路由承载页面导航，`FixtureReportRepository` 是唯一数据实现；领域类型与仓库接口为未来服务端预留边界，但本切片不含网络实现。Android 原生目录只负责 WebView 外壳、图标、启动页与构建。

**Tech Stack:** React、TypeScript、Vite、React Router、Vitest、Testing Library、Playwright、Capacitor 8、Android SDK 36、Gradle Wrapper。

## Global Constraints

- 开始前必须通过 `2026-08-03-client-foundation-readiness.md` 中的工程初始化门槛：版本控制边界、Android Studio/SDK/JDK/ADB、单一 API 36 AVD 与报告引擎回归。真机验收只作为本切片 Task 10/Task 11 的完成门槛，不阻塞 Task 1。
- 工程初始化和日常开发先使用单一 API 36 AVD；首个调试 APK 的模拟器安装通过后仍须保留真机最终验收，未通过真机冒烟前不得将本切片标为完成。
- 只使用固定、去敏、可提交的样例；不使用真实市场数据、真实报告、Token、API Key、环境变量或服务端地址。
- 不发起业务网络请求；不接 iFind、Coze、Vercel、Supabase、认证、云端 PDF、日程或通知。
- 不修改 `report-engine/src/` 的业务行为；只运行其现有回归测试。
- 不创建 release 签名证书，不发布 APK，不连接应用商店。
- 实现必须以 `docs/ui-ux/` 正式稿和已确认规格为依据，不以 `.superpowers/brainstorm/` 为依据。

---

### Task 1: 创建 Vite/React/Capacitor 工程骨架

**Files:**
- Create: `client-app/package.json`
- Create: `client-app/package-lock.json`
- Create: `client-app/index.html`
- Create: `client-app/tsconfig.json`
- Create: `client-app/tsconfig.app.json`
- Create: `client-app/tsconfig.node.json`
- Create: `client-app/vite.config.ts`
- Create: `client-app/capacitor.config.ts`
- Create: `client-app/src/main.tsx`
- Create: `client-app/src/App.tsx`
- Create: `client-app/src/test/setup.ts`
- Create: `client-app/src/App.test.tsx`

**Interfaces:**

```ts
appId: 'com.zhixing.research'
appName: '知行'
webDir: 'dist'
```

- [x] **Step 1: 创建最小 Vite React TypeScript 工程**

使用 npm 创建项目并安装 React Router、Vitest、Testing Library、Playwright 与 Capacitor core/cli/android。Capacitor 包限定主版本 8，实际精确版本由 `package-lock.json` 固定。

本任务不安装 `@capacitor/assets`。已验证其当前候选版本 `3.0.5` 固定依赖 `sharp@0.32.6`，在项目当前 Node.js 24 环境中无法完成安装。不得使用 `--ignore-scripts`、强制覆盖传递依赖或临时安装 Python 来绕过；品牌资产工具的选择与兼容性验证统一延后到 Task 9。

- [x] **Step 2: 先写 App 壳失败测试**

断言应用显示“知行”、四个固定底部导航入口“今日 / 报告库 / 研究 / 我的”，并且默认进入 `/today` 语义页面。

- [x] **Step 3: 运行测试确认 RED**

```powershell
Set-Location D:\Codex\投顾APP\client-app
npm.cmd test -- --run
```

预期：导航壳尚未实现，测试失败。

- [x] **Step 4: 实现最小 App 壳与 Hash 路由入口**

创建仅含路由出口和四个导航入口的结构，不提前实现页面内容。

- [x] **Step 5: 运行测试和类型检查确认 GREEN**

```powershell
npm.cmd test -- --run
npm.cmd run build
```

---

### Task 2: 建立单一视觉 Token 与应用外壳

**Files:**
- Create: `client-app/src/styles/tokens.css`
- Create: `client-app/src/styles/tokens.ts`
- Create: `client-app/src/styles/global.css`
- Create: `client-app/src/layout/AppShell.tsx`
- Create: `client-app/src/layout/BottomNavigation.tsx`
- Create: `client-app/src/layout/AppShell.test.tsx`
- Modify: `client-app/src/App.tsx`
- Modify: `client-app/src/main.tsx`

**Produces:** 与品牌规格一致的主色、文字、间距、圆角、描边、阴影、状态色和动效 Token；390px 安全区适配。

- [x] **Step 1: 写 Token 与导航失败测试**

通过渲染后的计算样式断言根元素提供 `#1E3A8A`、`#102B44`、`#2F6C9E`、页面 `#F4F7FA`、成功/观察/风险/信息状态色，不以读取或匹配 CSS 源码代替行为验证；底部入口顺序固定，详情路由不改变顺序。

- [x] **Step 2: 运行测试确认 RED**

- [x] **Step 3: 实现 CSS Token、系统字体、安全区和减少动态效果**

`tokens.css` 是所有实际视觉值的唯一来源；`tokens.ts` 只导出 `var(--token-name)` 形式的 CSS Custom Property 引用，不重复颜色、间距、圆角、阴影或动效数值。组件不得重新硬编码品牌色和间距。

- [x] **Step 4: 实现 `AppShell` 与底部导航**

支持 Android 安全区、页面主体滚动、固定底部导航和当前入口文字/图标双重状态。

- [x] **Step 5: 运行测试与构建确认 GREEN**

---

### Task 3: 定义领域模型和固定样例仓库

**Files:**
- Create: `client-app/src/domain/report.ts`
- Create: `client-app/src/domain/research.ts`
- Create: `client-app/src/domain/watchlist.ts`
- Create: `client-app/src/repositories/ReportRepository.ts`
- Create: `client-app/src/repositories/FixtureReportRepository.ts`
- Create: `client-app/src/repositories/FixtureReportRepository.test.ts`
- Create: `client-app/src/fixtures/reports.ts`
- Create: `client-app/src/fixtures/industries.ts`
- Create: `client-app/src/fixtures/watchlist.ts`
- Create: `client-app/src/fixtures/states.ts`

**Interfaces:**

```ts
export interface ReportRepository {
  listReports(filter?: ReportFilter): Promise<ReportSummary[]>;
  getReport(reportId: string): Promise<ReportDetail | null>;
  getToday(date: string): Promise<TodayReportSet>;
  listIndustries(): Promise<IndustrySummary[]>;
  getIndustry(industryId: string): Promise<IndustryDetail | null>;
  listWatchlist(): Promise<WatchlistItem[]>;
  getWatchlistItem(symbol: string): Promise<WatchlistDetail | null>;
}
```

- [x] **Step 1: 写仓库行为失败测试**

覆盖日期倒序、报告类型/行业/主题筛选、未知 ID 返回 `null`、今日四类日常报告固定位置、周期报告有内容才出现、行业与标的双向关联。

- [x] **Step 2: 运行测试确认 RED**

- [x] **Step 3: 创建去敏固定样例**

样例只使用明确的虚构标识和研究文字，不复用真实日期行情、真实证券结论或真实服务端返回。标的池由完整快照夹具提供，不从报告正文推断。

- [x] **Step 4: 实现 `FixtureReportRepository`**

所有方法只读取静态模块；不得读取 `fetch`、环境变量、当前网络或系统时间。

- [x] **Step 5: 运行测试确认 GREEN**

---

### Task 4: 实现通用状态和共享组件

**Files:**
- Create: `client-app/src/components/states/PageSkeleton.tsx`
- Create: `client-app/src/components/states/SectionSkeleton.tsx`
- Create: `client-app/src/components/states/ContextualEmptyState.tsx`
- Create: `client-app/src/components/states/BlockingFailureState.tsx`
- Create: `client-app/src/components/states/InlineFailureNotice.tsx`
- Create: `client-app/src/components/states/OfflineBanner.tsx`
- Create: `client-app/src/components/states/StaleContentNotice.tsx`
- Create: `client-app/src/components/states/ActionFeedback.tsx`
- Create: `client-app/src/components/states/resolvePageState.ts`
- Create: `client-app/src/components/states/states.test.tsx`
- Create: `client-app/src/components/ReportCard.tsx`
- Create: `client-app/src/components/FilterBar.tsx`
- Create: `client-app/src/components/EvidenceCard.tsx`
- Create: `client-app/src/components/RiskCard.tsx`
- Create: `client-app/src/components/Timeline.tsx`
- Create: `client-app/src/components/Badges.tsx`

- [x] **Step 1: 写状态优先级失败测试**

先为纯 `resolvePageState()` 写失败测试。它接收彼此独立的访问、内容可用性、连接、请求和空内容事实，并输出页面唯一的阻断状态与可叠加提示；不得在页面内分散判断或访问网络。

固定优先级为：所有者访问/安全阻断 > 无可用内容的失败 > 离线无缓存 > 加载 > 空内容 > 可读内容。可读内容上的“离线但有缓存”与“同步失败但有旧内容”是非阻断叠加提示，二者不得清空或伪装旧内容为最新。覆盖安全阻断、无内容失败、离线无缓存、加载、空内容、离线有缓存、旧内容、离线与旧内容同时叠加；状态必须包含文字和图标语义，不能只靠颜色。

- [x] **Step 2: 运行测试确认 RED**

- [x] **Step 3: 实现最小状态组件**

实现 `PageSkeleton`、`SectionSkeleton`、`ContextualEmptyState`、`BlockingFailureState`、`InlineFailureNotice`、`OfflineBanner`、`StaleContentNotice` 与 `ActionFeedback`。骨架约 300ms 后显示、超过 10s 只提示加载较慢的时序由调用方传入，不在组件内启动计时器。`SectionSkeleton` 不阻断其他已完成区块；失败组件只接受脱敏错误码、时间和受控恢复动作。

关键状态同时提供文字、图标和颜色；阻断/局部失败可被读屏立即识别，加载、离线和旧内容提示具有可读状态语义。离线、未接入、进行中或不可用的刷新、同步、重试、检查更新与下载动作必须使用真实禁用态并说明原因，不保留会伪成功的点击处理。离线固定样例不得接入或模拟真实重试。

- [x] **Step 4: 实现共享卡片与徽标**

实现 `ReportCard`、`FilterBar`、`EvidenceCard`、`RiskCard`、`Timeline` 与 `Badges`。`Badges` 导出版本、阅读状态和时效三个有文字语义的徽标；`Timeline` 只渲染已归一化的历史条目，不推导或改写历史。

`ReportCard` 本轮仅展示现有 `ReportSummary` 可验证的类型、标题、日期、版本、数据截至时间和阅读状态；不得展示或伪造任务状态。正式任务模型、任务夹具和任务状态展示留待后续独立设计。所有模块不提供分享、交易、订阅或编辑入口，不调用仓库或网络，不从报告正文推导标的、行业、趋势或证据。

新增样式只能使用既有 Token；390px 宽度不得产生横向滚动，筛选和卡片内容必须可换行/截断。不得新增持续闪烁、弹跳或强加载动效，且须保持系统“减少动态效果”下的静态/最小动效行为。

- [x] **Step 5: 运行测试确认 GREEN**

运行状态与共享组件测试、全部现有客户端测试和构建，确认固定夹具路径下没有业务网络请求、真实数据、密钥或伪造成功反馈。

---

### Task 5: 实现今日、报告库与报告详情

**Files:**
- Create: `client-app/src/screens/TodayPage.tsx`
- Create: `client-app/src/screens/ReportLibraryPage.tsx`
- Create: `client-app/src/screens/ReportDetailPage.tsx`
- Create: `client-app/src/screens/reports.test.tsx`
- Create: `client-app/src/components/ReportHtmlRenderer.tsx`
- Create: `client-app/src/security/reportHtmlPolicy.ts`
- Create: `client-app/src/security/reportHtmlPolicy.test.ts`
- Modify: `client-app/src/App.tsx`

- [ ] **Step 1: 写三页失败测试**

覆盖 B2 今日阅读优先、四类日常卡固定位置、周期报告动态区、组合筛选、清除筛选、详情版本与数据时间、PDF 不可用状态和返回路径。

- [ ] **Step 2: 写 HTML 安全失败测试**

接受已知安全标签；拒绝 `script`、事件属性、任意样式、iframe、表单、远程图片和危险 URL。恶意样例必须返回阻断状态，不能直接传给 `dangerouslySetInnerHTML`。

- [ ] **Step 3: 运行测试确认 RED**

- [ ] **Step 4: 实现三页与受控渲染器**

严格对照 `today-report.html`、`report-library.html` 和 `report-detail.html`；不新增顶部异常看板，不显示不存在的 PDF。

- [ ] **Step 5: 运行测试确认 GREEN**

---

### Task 6: 实现研究、行业与标的池页面

**Files:**
- Create: `client-app/src/screens/ResearchOverviewPage.tsx`
- Create: `client-app/src/screens/IndustryListPage.tsx`
- Create: `client-app/src/screens/IndustryDetailPage.tsx`
- Create: `client-app/src/screens/WatchlistPage.tsx`
- Create: `client-app/src/screens/WatchlistDetailPage.tsx`
- Create: `client-app/src/screens/research.test.tsx`
- Modify: `client-app/src/App.tsx`

- [ ] **Step 1: 写五页失败测试**

覆盖研究总览、行业/标的池顶部分段入口、行业趋势与反向证据、关联报告、完整标的快照、移出原因、行业与标的双向导航。

- [ ] **Step 2: 运行测试确认 RED**

- [ ] **Step 3: 实现五页**

严格对照五份正式页面稿；不得加入综合评分、买卖建议、手动趋势编辑或从正文自动提取标的。

- [ ] **Step 4: 运行测试确认 GREEN**

---

### Task 7: 实现“我的”与禁用的未来操作

**Files:**
- Create: `client-app/src/screens/MyOperationsPage.tsx`
- Create: `client-app/src/screens/MyOperationsPage.test.tsx`
- Create: `client-app/src/api/FutureApiClient.ts`
- Modify: `client-app/src/App.tsx`

**Interfaces:**

```ts
export interface FutureApiClient {
  readonly configured: false;
}
```

- [ ] **Step 1: 写失败测试**

断言页面显示所有者状态、最后同步、今日任务、本机缓存、脱敏诊断和客户端版本；刷新、重试、检查更新和未缓存 PDF 均禁用并解释原因。

- [ ] **Step 2: 运行测试确认 RED**

- [ ] **Step 3: 实现页面与不可调用的 API 边界**

`FutureApiClient` 不提供 URL、Token、`fetch` 或模拟成功方法。页面不得显示原始响应和设备序列号。

- [ ] **Step 4: 运行测试确认 GREEN**

---

### Task 8: 加入浏览器端端到端回归

**Files:**
- Create: `client-app/playwright.config.ts`
- Create: `client-app/e2e/navigation.spec.ts`
- Create: `client-app/e2e/report-library.spec.ts`
- Create: `client-app/e2e/research.spec.ts`
- Create: `client-app/e2e/states.spec.ts`
- Modify: `client-app/package.json`

- [ ] **Step 1: 编写 E2E 测试**

覆盖九个页面、报告/行业/标的交叉导航、搜索筛选、离线/空/失败状态入口、390px 无横向滚动、底部导航安全区和不存在分享/交易/成员入口。

- [ ] **Step 2: 运行测试确认 RED 或缺失实现**

```powershell
npm.cmd run test:e2e
```

- [ ] **Step 3: 只修正真实差异**

不得为了通过测试改变已确认的信息架构；如正式稿与实现要求冲突，停止并报告偏离点。

- [ ] **Step 4: 运行全量 Web 验证**

```powershell
npm.cmd test -- --run
npm.cmd run build
npm.cmd run test:e2e
```

---

### Task 9: 添加 Capacitor Android 平台和品牌资产

**Files:**
- Create: `client-app/android/` via Capacitor CLI
- Create: `client-app/assets/icon-only.png`
- Create: `client-app/assets/icon-foreground.png`
- Create: `client-app/assets/icon-background.png`
- Create: `client-app/assets/splash.png`
- Modify generated Android resources under: `client-app/android/app/src/main/res/`
- Modify: `client-app/package.json`

- [ ] **Step 1: 选择并验证 Node.js 24 兼容的资产生成方案**

先在隔离分支中验证候选工具是否支持当前 Node.js 24、Capacitor 8 和 Android 36。`@capacitor/assets@3.0.5` 因固定依赖 `sharp@0.32.6`，不得作为默认方案；也不得通过 `--ignore-scripts`、强制覆盖传递依赖或补装与项目无关的本机编译链来绕过。若没有安全兼容的工具，应改为可审计的 SVG/PNG 到 Android `res/` 的确定性生成脚本，并补充测试与生成说明。

- [ ] **Step 2: 从已批准 SVG 生成源资产**

输入只来自：

```text
docs/ui-ux/brand/app-icon-master.svg
docs/ui-ux/brand/splash-screen-preview.svg
```

图标源至少 1024×1024，启动图源至少 2732×2732；不得自行改变图形、文字和颜色。

- [ ] **Step 3: 添加 Android 平台**

```powershell
npm.cmd run build
npx.cmd cap add android
npx.cmd cap sync android
```

- [ ] **Step 4: 验证 Android 参数**

确认应用 ID `com.zhixing.research`、显示名“知行”、`minSdk 24 / compileSdk 36 / targetSdk 36`，并确认 `local.properties` 被 Git 忽略。

- [ ] **Step 5: 生成自适应图标与启动页资源**

执行 Step 1 已验证并锁定版本的资产生成命令；若采用项目内确定性脚本，则运行对应的 `npm.cmd run assets:android`。不得在此步骤临时切换未经验证的工具。

检查 Android 12+ 启动页使用品牌图标和浅色背景，不显示伪加载进度。

- [ ] **Step 6: 运行 Web 回归**

确保添加原生外壳没有改变 Web 页面和测试。

---

### Task 10: 构建并安装调试 APK

**Files:**
- Build artifact: `client-app/android/app/build/outputs/apk/debug/app-debug.apk`
- Create: `docs/proposals/2026-08-03-client-offline-slice-verification.md`

- [ ] **Step 1: 构建调试 APK**

```powershell
Set-Location D:\Codex\投顾APP\client-app\android
.\gradlew.bat assembleDebug
```

预期：生成调试 APK；不生成 release keystore。

- [ ] **Step 2: 安装到 API 36 模拟器**

```powershell
adb install -r .\app\build\outputs\apk\debug\app-debug.apk
```

- [ ] **Step 3: 模拟器冒烟测试**

验证启动页、图标、九个页面、返回路径、390px 等效阅读宽度、离线启动、PDF 不可用提示和所有禁用操作。记录 AVD 的 API 级别，不记录模拟器序列号。

- [ ] **Step 4: 真机最终验收**

在用户方便时，将同一调试 APK 安装到已授权的自有手机并重复关键冒烟测试。只记录手机型号、Android 版本和结果，不记录设备序列号；未完成时明确标记“模拟器通过、真机待验收”。

- [ ] **Step 5: APK 静态安全检查**

检查源码、构建日志和 APK 解包字符串中不存在真实服务端 URL、Token、API Key、`.env` 值、真实报告或签名口令。命中只报告类别和文件，不输出疑似秘密本身。

- [ ] **Step 6: 写验证记录**

记录构建命令、测试结果、APK SHA-256、测试设备信息和已知限制。明确这是调试 APK，不可作为正式分发包。

---

### Task 11: 全量回归与文档收口

**Files:**
- Modify: `docs/proposals/2026-08-01-foundation-readiness-checklist.md`
- Modify: `docs/current-status.md`
- Modify: `docs/ui-ux/client-ui-ux-handoff.md`
- Modify: `docs/superpowers/specs/2026-08-01-personal-android-apk-client-design.md`

- [ ] **Step 1: 客户端全量验证**

```powershell
Set-Location D:\Codex\投顾APP\client-app
npm.cmd test -- --run
npm.cmd run build
npm.cmd run test:e2e
Set-Location .\android
.\gradlew.bat assembleDebug
```

- [ ] **Step 2: 报告引擎回归**

```powershell
Set-Location D:\Codex\投顾APP\report-engine
npm.cmd test
npm.cmd run build
```

预期：现有报告引擎回归保持通过，无业务代码改动。

- [ ] **Step 3: 文档一致性检查**

用 `rg` 检查正式文档中不存在“客户端尚未创建”“Android 参数待确认”等过期状态；保留真实未完成项：正式签名、真实数据、认证、云端、PDF 和调度。

- [ ] **Step 4: 最终验收**

只有 Web 测试、E2E、Android 调试构建、真机冒烟、安全扫描和报告引擎回归都通过，才能将离线客户端切片标为完成。

