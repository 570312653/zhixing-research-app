# 知行客户端工程开工前决策

> 状态：已确认。  
> 确认日期：2026-08-03。  
> 范围：版本控制、安全边界、客户端技术、Android 参数和第一工程切片。  
> 注意：本文件记录决策，不代表 Git、Android 工具链、客户端工程或 APK 已经完成。

## 1. 决策背景

页面级 UI/UX、跨页面状态与品牌视觉基础已经完成并获用户批准。只读检查确认：

- `D:\Codex\投顾APP` 尚未初始化 Git；
- 存在 `phase1-webhook-test/.env.local` 和 Obsidian 插件配置等敏感候选路径，本次未读取或输出任何值；
- Node.js `v24.18.0` 已安装，满足 Capacitor 8 的 Node.js 22+ 要求；
- Android Studio、Android SDK、ADB、Java 与 Gradle 尚未安装或尚不可用；
- 当前电脑为 Windows 11 64 位、Ryzen 7 7800X3D、约 15.1 GB 内存，虚拟化已启用；可运行 Android Studio，首轮优先真机测试。

## 2. 已确认决策

用户于 2026-08-03 明确回复“全部按推荐项确认”，以下 28 项全部采用 A。

| 编号 | 决策 | 确认结果 |
|---|---|---|
| 1 | Git 仓库边界 | 在 `D:\Codex\投顾APP` 建立一个项目级仓库 |
| 2 | GitHub 连接时机 | 先完成本地 Git、安全审计和干净提交，再连接私有 GitHub |
| 3 | GitHub 可见性 | 私有仓库 |
| 4 | `.gitignore` | 根目录统一严格规则，子工程可补充 |
| 5 | 环境文件 | 所有 `.env*` 默认忽略，只允许不含值的 `.env.example` |
| 6 | 历史 `.env.local` | 不读取、不提交；确认服务用途，可能有效则在平台侧轮换 |
| 7 | 历史 Coze POC | 保留安全源码和文档作只读审计，不作为新客户端依赖 |
| 8 | Obsidian | 提交 `docs/obsidian/` Markdown；忽略根目录 `.obsidian/` 插件、缓存和本机配置 |
| 9 | 临时目录 | 忽略 `.superpowers/`、临时截图、PDF 审阅缓存和运行缓存；正式成果进入 `docs/` |
| 10 | 项目工作系统 | 提交不含密钥的 `_system/` 项目摘要 |
| 11 | Android 敏感文件 | 永久忽略 `local.properties`、签名文件、签名口令和本机 SDK 路径 |
| 12 | 首次提交门槛 | 先生成提交候选清单并做路径和类型审计，不打印敏感值 |
| 13 | 客户端目录 | `client-app/` |
| 14 | Web 技术 | React + TypeScript + Vite |
| 15 | 路由 | React Router Hash 路由 |
| 16 | 状态管理 | React 内置状态 + 数据仓库接口，首切片不引入全局状态库 |
| 17 | Capacitor | Capacitor 8 当前稳定版 |
| 18 | Android 显示名 | `知行` |
| 19 | Android 应用 ID | `com.zhixing.research`，首次安装前固定 |
| 20 | Android SDK | `minSdk 24 / compileSdk 36 / targetSdk 36` |
| 21 | Android 环境 | Google 官方 Windows EXE + Setup Wizard；由 Android Studio 安装 SDK 与合适 JDK |
| 22 | 首轮设备 | 个人 Android 真机优先，模拟器补充 |
| 23 | 首个 APK | 只构建调试 APK，不创建正式签名证书 |
| 24 | 第一工程切片 | 九个已确认页面、统一视觉 Token、离线导航、图标与启动页 |
| 25 | 数据 | 只使用仓库内固定、去敏的样例数据 |
| 26 | 测试 | Vitest + Playwright Web 回归 + Gradle 调试构建 + 真机冒烟 |
| 27 | 网络 | 不发起业务网络请求，不接真实 API、认证、同步或云端 PDF |
| 28 | 正式签名 | 首切片验收后另开决策；证书离线备份并由所有者保管 |

## 3. 工程边界

```text
D:\Codex\投顾APP
├─ report-engine/          # 既有离线报告引擎；本切片只做回归，不改业务逻辑
├─ client-app/             # 待创建的 React/Vite/Capacitor 客户端
├─ phase1-webhook-test/    # 历史 POC；只读审计，不进入正式依赖
├─ docs/                   # 正式规格、计划和验收记录
└─ _system/                # 项目本地恢复摘要；不是完整工程规格
```

`client-app/` 的固定样例仓库是第一切片唯一数据实现。未来 API 只能先定义类型，不得硬编码服务端地址、读取环境变量或发起请求。

## 4. 执行门槛

以下动作必须按独立计划执行，不能把本次确认解释成已经完成：

1. 建立 `.gitignore` 并完成不读取值的提交候选审计；
2. 单独确认后初始化本地 Git；连接 GitHub 前再次检查敏感文件；
3. 用户通过 Google 官方安装器安装 Android Studio，完成 SDK Setup Wizard；
4. 验证 SDK、ADB、Android Studio JDK 和真机调试链路；
5. 记录测试手机型号、Android 版本和 WebView 版本；
6. 通过地基门槛后，才创建 `client-app/` 并执行离线客户端计划。

## 5. 官方依据

- Capacitor 8 环境要求：<https://capacitorjs.com/docs/getting-started/environment-setup>
- Capacitor Android 支持：<https://capacitorjs.com/docs/android>
- Capacitor 8 Android 参数：<https://capacitorjs.com/docs/updating/8-0>
- Android Studio Windows 安装与系统要求：<https://developer.android.com/studio/install>

