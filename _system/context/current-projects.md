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
- 当前地基进度：已生成地基与客户端文件级实施计划；根 `.gitignore` 和路径级安全预审已完成，185 个提交候选中禁止类别为 0，项目仍未初始化 Git。
- 当前下一步：确认历史 `phase1-webhook-test` POC 是否仍使用；若可能有效先在平台侧轮换凭证，再明确授权 `git init`。随后安装并验证 Android Studio/SDK/ADB 与真机链路，地基验收通过后才创建客户端工程。
