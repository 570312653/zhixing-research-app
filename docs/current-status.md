# 知行项目当前状态

> 标签：AI写  
> 最后更新：2026-08-11
> 本文件是快速恢复入口，不替代产品需求、架构决策或 `AGENTS.md`。

## 项目目标

知行当前定位为仅供项目所有者本人使用的个人市场研究工具：未来通过 Android APK 提供报告阅读、归档、分类、标的池和个人操作体验；可信云端报告引擎负责生成。Codex 不承担生产定时运行。

## 当前阶段

仍处于离线固定样例原型阶段，页面级 UI/UX 总稿已于 2026-08-03 获用户批准：

- 已确认个人 Android APK 产品路线，推荐 Capacitor 混合 APK；
- 已完成并验收四类离线固定样例：`morning_scan`、`midday_review`、`daily_review`、`industry_tracking`；
- 所有输入仍为本地固定夹具，不代表真实市场数据；
- 已完成今日、报告库、报告详情、研究总览、行业列表/详情、标的池/详情和“我的”的正式 HTML/PNG 页面稿；
- 已确认正常、加载、空、失败、离线及旧内容叠加的跨页面状态规范；
- 已确认“深海蓝研究院”品牌方向、折页与路径 App 图标、浅色 Android 启动页和统一设计 Token；
- 已确认项目根 Git 边界、敏感文件策略、`client-app/` 目录、React/Vite/Capacitor 8、Hash 路由、`com.zhixing.research` 和 Android SDK 参数；
- 历史 `phase1-webhook-test` Vercel 项目已于 2026-08-04 暂停，平台控制面复核为 `paused: true`；本地审计代码保留，不再对外提供服务；
- 项目根本地 Git 已初始化为 `main`，安全基线已推送至 `https://github.com/570312653/zhixing-research-app`；隔离分支 `feature/android-client-offline` 继续承载客户端实现，当前仍有本地提交尚未推送；
- 已在隔离 worktree 的 `feature/android-client-offline` 分支完成 `client-app/` Task 1 工程骨架：Vite、React、Capacitor 8、Hash 路由、四项主导航和默认 `#/today`；测试、构建、lint 与生产依赖审计均通过；
- 已在隔离 worktree 的 `feature/android-client-offline` 分支完成 `client-app/` Task 2：`tokens.css` 是唯一实际视觉值来源，`tokens.ts` 只导出 CSS Custom Property 引用；已实现 `AppShell`、今日/报告库/研究/我的四入口底部导航、Hash 详情前缀激活、Android 安全区与减少动态效果。Vitest 4/4、构建、lint、生产依赖审计及独立审查均为 PASS；“我的”正式路由与交接稿不一致的 `/mine` → `/me` 偏差已在提交 `2934d8f` 修复；
- 已在同一隔离分支完成 `client-app/` Task 3：建立报告、行业研究与标的池领域类型，覆盖 7 类报告；加入 7 份明确虚构报告、4 个虚构行业研究单元、2 个虚构主题和两期完整标的池快照；`FixtureReportRepository` 已实现组合筛选、确定性排序、显式日期的 Today 四槽聚合、周期报告动态聚合、报告/行业/标的双向关联和防御性副本。客户端 Vitest 全量 34/34、构建、lint、生产依赖审计及独立审查均为 PASS；
- 已在同一隔离分支完成 `client-app/` Task 4：交付纯 `resolvePageState`、8 个状态组件（含 `ActionFeedback`）、共享报告卡片/筛选/证据/风险/时间线/文字徽标；完成离线缓存陈旧态、可选重试与提交中防重复触发的 fix round 1。客户端 Vitest 全量 53/53、构建、lint、生产依赖审计及独立复审均为 PASS；
- 已在同一隔离分支完成 `client-app/` Task 5：交付 B2 阅读优先的今日页、支持多类型/日期/行业/主题组合筛选的报告库、沉浸式报告详情、确定性返回路径、禁用 PDF 边界和客户端拒绝式 HTML 白名单；两轮修复关闭跨报告陈旧内容、HTML 实体链接绕过、路由匹配和同报告 stale 保留问题。客户端 Vitest 全量 112/112、构建、lint、生产依赖审计及独立复审均为 PASS；390px Chrome 检查三页无横向溢出；
- 已完成 Task 6 至 Task 8：研究总览、行业列表/详情、标的池列表/详情、“我的”离线个人操作页和 17 条真实浏览器 E2E 已落地；九个批准页面、跨页状态、筛选、交叉导航、390px 与生产不可达的测试状态注入均完成验证；
- 已完成 Task 9：Capacitor Android 平台、`com.zhixing.research`、Android 24/36/36 参数以及由批准 SVG 确定性生成的图标和启动资源均已落地；
- Task 10 当前为“模拟器通过、真机待验收”：Debug APK 已在 API 36 AVD 安装，九页、离线冷启动、页面内返回路径、PDF 与未来操作禁用态均通过；静态检查未发现真实密钥、业务服务端地址或真实市场数据；
- 当前仍没有真实交易日历、真实数据源、模型、业务网络、环境变量、云端调度、用户认证、正式归档/发布/通知或正式 PDF 导出。现有 APK 只是固定样例 Debug APK，不是正式分发包。

## 最近完成的切片

四类报告共用的视觉渲染离线切片已经完成：

- 共享视觉渲染器：`report-engine/src/report-template.ts`
- 样例预览：`report-engine/artifacts/visual/`
- 视觉规范：`docs/superpowers/specs/2026-07-30-report-visual-template-design.md`
- 行业跟踪规格：`docs/superpowers/specs/2026-07-31-industry-tracking-offline-slice-design.md`
- 验证证据：`report-engine/` 内 `npm.cmd test` 124/124 通过，`tsc --noEmit` 通过；桌面和 390px 手机宽度检查无横向溢出。

HTML 是主阅读格式，现有 A4 打印 CSS 不等于正式 PDF 已完成；未配置 Chromium 时 PDF 接口必须失败关闭。

页面级 UI/UX 资产已经收口：

- 页面与视觉索引：`docs/ui-ux/README.md`
- 工程交接总表：`docs/ui-ux/client-ui-ux-handoff.md`
- 客户端总设计：`docs/superpowers/specs/2026-08-01-personal-android-apk-client-design.md`
- 页面级总审阅与品牌视觉基础均已完成；正式品牌规格见 `docs/superpowers/specs/2026-08-03-brand-visual-foundation-design.md`。

## 已确认的产品与架构变更

- 不再做朋友注册、多人阅读、邀请、订阅或对外分享；
- 第一版重点是私有分发的 Android APK，不是 PWA 或应用商店上架；
- Android 客户端是完整可视化产品，不是报告引擎的附属页面；
- 报告引擎仍在未来可信云端运行，APK 不保存任何数据源、模型或管理凭证；
- iFind 是后续个人主数据候选，但尚未验证自动运行方式，也尚未接入任何真实凭证或数据。

## 下一步候选

Android Studio、SDK Platform 36、Build Tools、Platform Tools、Command-line Tools、ADB、Gradle 8.14.3 与 Temurin JDK 21 已完成本机验证；单一 API 36 AVD 已完成 Debug APK 安装和冒烟。客户端 Task 1 至 Task 10 的模拟器范围均已通过；当前最近的人工门槛是在用户自有手机上安装同一 APK 并重复关键冒烟。

当前采用“模拟器先行、真机最终验收”：客户端工程初始化和日常开发不要求立即连接手机；首个调试 APK 可先在模拟器安装，但离线客户端切片完成前仍须在自有手机完成一次安装和关键冒烟。

地基与客户端文件级计划均已形成：

- `docs/superpowers/plans/2026-08-03-client-foundation-readiness.md`
- `docs/superpowers/plans/2026-08-03-personal-android-client-offline-slice.md`

地基计划和客户端 Task 1 至 Task 10 的模拟器范围已通过；`client-app/` 仍只允许按离线固定样例计划推进，任何阶段都不提前接入真实数据、业务网络、密钥、云端调度、用户认证或正式 PDF。验证记录见 `docs/proposals/2026-08-03-client-offline-slice-verification.md`。

后续独立能力：报告引擎对 `holiday_digest`、`month_end_review`、`industry_research` 的正式生成，`watchlist_snapshot` 正式交付、正式 PDF 导出、数据适配器契约和可信云端运行时。

## 不可突破的边界

- 数据、交易日历、来源证据或合规校验不足时必须失败关闭，不得生成或猜测市场事实。
- 不输出个性化持仓、交易、仓位、止损、收益承诺或买卖建议。
- Coze POC 仅作审计证据，不恢复为正式生成路径。
- 不把 Token、API Key、个人数据或完整敏感响应写入代码、文档、日志、截图或测试夹具。

## 恢复工作时的最小阅读顺序

1. `AGENTS.md`
2. `docs/current-status.md`
3. `docs/report-engine-architecture.md`
4. `docs/product-requirements.md`
5. 与当前切片相关的已确认规格与计划。
