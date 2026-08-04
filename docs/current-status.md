# 知行项目当前状态

> 标签：AI写  
> 最后更新：2026-08-04  
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
- 项目根本地 Git 已初始化为 `main`，暂存安全审计通过并已建立本地安全基线提交；未添加远端、未连接 GitHub、未推送；
- 当前没有真实交易日历、真实数据源、模型、网络、环境变量、云端调度、APK、用户认证、归档、发布、通知或正式 PDF 导出。

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

下一步继续客户端地基计划：由用户安装 Android Studio/SDK，并验证 ADB 真机链路。

地基与客户端文件级计划均已形成：

- `docs/superpowers/plans/2026-08-03-client-foundation-readiness.md`
- `docs/superpowers/plans/2026-08-03-personal-android-client-offline-slice.md`

在地基计划验收前，不初始化客户端工程；任何阶段都不提前接入真实数据、网络、密钥、云端调度、用户认证或正式 PDF。

后续独立能力：`holiday_digest`、`month_end_review`、`industry_research`、`watchlist_snapshot`、正式 PDF 导出、`generatedAt` 字段、数据适配器契约和可信云端运行时。

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
