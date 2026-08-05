# Client Foundation Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to execute this plan task-by-task. Do not combine this plan with client feature implementation.

**Goal:** 在不暴露历史凭证、不改动报告引擎和不创建正式签名资产的前提下，建立可审计的本地版本控制边界与可构建 Capacitor 8 Android 调试 APK 的工具链。

**Architecture:** 项目根目录作为单一仓库；敏感、本机与会话级文件由根 `.gitignore` 排除。Android Studio 管理 SDK 与 JDK，Gradle 由未来客户端工程的 Wrapper 管理。地基验收只证明环境可用，不接入任何业务网络或真实数据。

**Tech Stack:** Git for Windows、Node.js 24、Android Studio 2025.2.1+、Android SDK 36、ADB、Android Studio 自带 JDK。

## Global Constraints

- 不读取、打印、复制或提交任何 `.env` 值、Token、API Key、签名口令或凭证内容。
- 不删除历史 POC；`phase1-webhook-test/` 只保留为审计，不进入新依赖。
- 不写入全局个人工作系统；项目状态只按明确存档指令写入 `_system/`。
- 本计划不创建 `client-app/`、不修改 `report-engine/`、不连接真实 API、不生成正式签名 APK。
- 初始化 Git、安装软件和连接 GitHub 都是独立外部状态变更；执行对应步骤前再次向用户说明影响并确认。

---

### Task 1: 建立根级忽略规则

**Files:**
- Create: `.gitignore`
- Create: `docs/proposals/2026-08-03-initial-git-safety-audit.md`

**Produces:** 一套覆盖 Node、Vite、Capacitor、Android、本机编辑器、历史敏感文件和临时审阅产物的忽略规则，以及不含密钥值的审计记录模板。

- [x] **Step 1: 写忽略规则测试清单**

在审计文档中列出必须被忽略的路径类别：

```text
**/.env
**/.env.*
!**/.env.example
**/node_modules/
**/dist/
**/coverage/
**/local.properties
**/*.jks
**/*.keystore
.obsidian/
.superpowers/
.docx-review/
tmp/
```

同时列出必须可提交的正式路径：`AGENTS.md`、`docs/`、`_system/`、`report-engine/src/`、`report-engine/test/`。

- [x] **Step 2: 创建最小 `.gitignore`**

除上述规则外加入 Android 构建目录、Gradle 本机缓存、Vite 缓存、日志、系统文件和 IDE 本机文件。不得忽略整个 `report-engine/`、`docs/` 或 `_system/`。

- [x] **Step 3: 无仓库条件下验证规则**

运行：

```powershell
git check-ignore --no-index -v phase1-webhook-test/.env.local
git check-ignore --no-index -v .obsidian/plugins/copilot/data.json
git check-ignore --no-index -v .superpowers/brainstorm/example.md
git check-ignore --no-index -v client-app/android/local.properties
git check-ignore --no-index -v client-app/release-key.jks
```

预期：五个路径都命中明确规则。

再运行：

```powershell
git check-ignore --no-index AGENTS.md
git check-ignore --no-index docs/current-status.md
git check-ignore --no-index report-engine/src/index.ts
```

预期：三条命令均以状态码 1 表示未被忽略。

---

### Task 2: 生成提交候选安全审计

**Files:**
- Modify: `docs/proposals/2026-08-03-initial-git-safety-audit.md`

**Produces:** 只记录路径、扩展名、文件大小和风险分类的审计，不保存内容或敏感值。

- [x] **Step 1: 路径级敏感候选扫描**

使用 `rg --files -uu` 结合文件名规则查找：`.env*`、`*secret*`、`*credential*`、`*.jks`、`*.keystore`、`local.properties`、证书和私钥扩展名。只输出相对路径，不读取内容。

- [x] **Step 2: 大文件与生成物扫描**

列出超过 10 MB 的文件及 `node_modules`、`dist`、`coverage`、临时截图、PDF 审阅缓存和工具运行目录；确认它们被忽略或有明确保留理由。

- [x] **Step 3: 检查提交候选**

在临时 Git 索引或完成用户授权后的本地 Git 中运行：

```powershell
git status --short --untracked-files=all
git ls-files --others --exclude-standard
```

预期：候选列表不含 `.env*`、Obsidian 插件配置、签名材料、Android 本机路径、构建目录或临时会话产物。

- [x] **Step 4: 处理历史 `.env.local` 门槛**

只向用户确认对应 Vercel/Coze POC 是否仍使用。若可能有效，由用户在对应平台轮换；不在本地打开该文件验证。审计文档只记录“已忽略 / 是否完成平台侧轮换 / 日期”，不记录值。

---

### Task 3: 初始化本地 Git 并建立干净基线

**Files:**
- No new application files.
- Modify only if needed: `docs/proposals/2026-08-03-initial-git-safety-audit.md`

**Gate:** 执行 `git init` 前必须再次获得用户明确确认。

- [x] **Step 1: 初始化本地仓库**

```powershell
git init
git branch -M main
```

- [x] **Step 2: 再次审计候选文件**

运行 Task 2 的提交候选检查，并使用 `git check-ignore -v` 抽查所有敏感类别。

- [x] **Step 3: 暂存并核对**

```powershell
git add --all
git diff --cached --name-status
```

预期：仅显示可提交的源码、正式文档、固定去敏夹具和项目本地摘要。

- [x] **Step 4: 敏感标记扫描**

只对暂存的文本文件运行密钥模式扫描；输出命中文件路径和规则名，不输出匹配值。任何高置信命中都必须取消暂存并处理，不能带风险提交。

- [x] **Step 5: 创建本地基线提交**

只有审计通过并经用户确认后执行：

```powershell
git commit -m "chore: establish secure project baseline"
```

本计划不创建 GitHub 仓库、不添加 remote、不推送。

---

### Task 4: 安装 Android Studio 与 SDK

**Files:**
- No project file changes.

**Gate:** 软件安装由用户确认后通过 Google 官方 Windows EXE 进行；不使用第三方镜像或静默安装脚本。

- [x] **Step 1: 下载并运行官方安装器**

从 <https://developer.android.com/studio/install> 下载当前稳定版 Windows EXE。安装 Android Studio、Android SDK、Platform Tools 和一个 API 36 SDK Platform；接受 Setup Wizard 推荐的 Android Studio JDK。

- [x] **Step 2: 验证 Android Studio 版本**

在 Android Studio 的 About 页面确认版本不低于 2025.2.1。

- [x] **Step 3: 验证 SDK 组件**

在 SDK Manager 确认：

```text
Android SDK Platform 36
Android SDK Build-Tools
Android SDK Platform-Tools
Android SDK Command-line Tools (latest)
```

- [x] **Step 4: 记录本机路径但不提交**

未来 `client-app/android/local.properties` 由 Android Studio 写入并被 `.gitignore` 排除。不得把 SDK 路径硬编码进项目文档或源码。

---

### Task 5: 验证 ADB 与模拟器开发条件

**Files:**
- Modify: `docs/proposals/2026-08-03-initial-git-safety-audit.md`

**Produces:** 不含设备序列号或本机 SDK 路径的环境验收记录。

- [x] **Step 1: 验证命令行工具**

在 Android Studio Terminal 或已配置路径的 PowerShell 中运行：

```powershell
adb version
```

预期：返回 Android Debug Bridge 版本，不出现“命令不存在”。

- [x] **Step 2: 创建单一 API 36 模拟器**

在 Device Manager 中只创建一个 API 36 AVD，作为客户端工程初始化和日常开发门槛；避免同时运行多个 AVD。当前约 15 GB 内存达到官方最低线，但不是推荐的 32 GB。

- [x] **Step 3: 验证模拟器连接**

```powershell
adb devices
```

预期：启动 AVD 后至少一个模拟器状态为 `device`。审计文档只记录“API 36 模拟器可用”和验证日期，不记录模拟器序列号。

- [x] **Step 4: 延后真机最终验收**

客户端工程初始化不再以真机连接为前置条件。首个调试 APK 可先在 API 36 模拟器安装和冒烟；但离线客户端切片最终完成前，仍须由用户在自有手机上授权 USB 调试并完成一次真机安装与冒烟。未完成时必须明确标注“模拟器通过、真机待验收”。

---

### Task 6: 地基验收与实施放行

**Files:**
- Modify: `docs/proposals/2026-08-01-foundation-readiness-checklist.md`
- Modify: `docs/current-status.md`

- [x] **Step 1: 验收版本控制边界**

确认 `.gitignore` 测试、提交候选审计和本地基线提交全部通过；没有 GitHub remote 或外部推送。

- [x] **Step 2: 验收 Android 环境**

确认 Android Studio 2025.2.1+、SDK 36、Platform Tools、ADB、Android Studio JDK 和一个 API 36 AVD 可用。真机只作为离线客户端切片的最终验收门槛，不阻塞工程初始化。

- [x] **Step 3: 回归现有报告引擎**

```powershell
Set-Location D:\Codex\投顾APP\report-engine
npm.cmd test
npm.cmd run build
```

预期：现有全部测试与 TypeScript 构建继续通过。

- [x] **Step 4: 更新状态**

只有上述门槛全部通过，才把“客户端工程初始化”标为可执行，并转入 `2026-08-03-personal-android-client-offline-slice.md`。
