# 当前项目

## 知行投顾报告应用

- 当前产品定位：仅供项目所有者本人使用的 Android 市场研究客户端，第一版以 Capacitor 打包私有 APK；不开放朋友注册、共享阅读、订阅或运营体系。
- 当前工程阶段：本地报告引擎固定样例原型；已完成并验收 `morning_scan`、`midday_review`、`daily_review`、`industry_tracking` 四个报告切片。
- 已有能力：结构化报告数据、受控 HTML、桌面表格、手机信息卡与 A4 打印样式；最近一次完整本地回归为 124/124，`tsc --noEmit` 和视觉预览已通过。
- 严格边界：尚未接入网络、真实数据、交易日历、模型、密钥、正式 PDF、云端调度、用户系统、归档、发布或通知；固定夹具不能视为真实市场报告。
- 客户端路线：未来采用“Capacitor Android APK + 受保护应用 API + 可信云端报告引擎”；Codex 只负责开发和维护，不承担生产定时运行。
- 数据源方向：iFind 仅是未来个人使用场景的候选主数据源，尚未验证接口形态、云端可调用性、字段、时效、凭证或真实数据。
- 当前 UI/UX 进度：页面级总稿、跨页面状态和品牌视觉基础已于 2026-08-03 获用户批准；九个页面均有正式 HTML/PNG，“深海蓝研究院”Token、折页与路径 App 图标及浅色启动页已固化。
- 已确认工程参数：项目根单仓库、私有 GitHub 后置、`client-app/`、React + TypeScript + Vite、Capacitor 8、Hash 路由、应用 ID `com.zhixing.research`、`minSdk 24 / compileSdk 36 / targetSdk 36`，首轮只构建调试 APK。
- 当前地基进度：历史 `phase1-webhook-test` Vercel 项目已暂停；项目根本地 Git 已初始化为 `main`，安全基线提交为 `5d9c320`，并新增 `.worktrees/` 忽略提交 `6c4a6c3`。Android Studio、SDK Platform 36、Build Tools、Platform Tools、Command-line Tools、内置 JDK、WHPX 与单一 API 36 AVD 均已验收；报告引擎回归 124/124 通过。未添加 remote、未连接 GitHub、未推送。
- 当前客户端进度：隔离 worktree `.worktrees/android-client-offline` 的 `feature/android-client-offline` 分支已完成 Task 1～7。Task 6 已交付研究总览、行业列表/详情与标的池列表/详情，采用 repository-first 快照投影、异常状态返回路径、历史折叠、双向导航和移动端无障碍规则；经两轮审查修复全部关闭。Task 7 已交付“我的”页面和只读未配置 `FutureApiClient`，刷新、重试、检查更新和未缓存 PDF 均保持真实禁用且原因可见。最新提交为 `5ac8efc`，尚未合并 `main`、连接远端或上传 GitHub。
- 当前验证：客户端测试 149/149、构建、lint 和生产依赖审计通过；报告引擎回归 124/124 与构建通过；Task 6、Task 7 独立复审均为 PASS。390px Chrome 检查覆盖五个研究页面且无横向溢出，摘要、变化和证据网格保持正式稿密度。`client-app/android/` 尚未创建，未接入网络、真实数据、系统时间、密钥、认证或真实 PDF。
- 当前下一步：按离线客户端正式计划执行 Task 8，加入 Playwright 浏览器端到端回归，覆盖导航、筛选、报告阅读、研究页面、状态分支和 390px 布局；Task 9 再单独验证品牌资产工具的 Node 24 兼容性，不使用安装脚本绕过或传递依赖强制覆盖。
