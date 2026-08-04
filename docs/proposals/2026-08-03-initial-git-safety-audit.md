# 知行初始 Git 安全审计

> 状态：执行中；历史 POC 已暂停，本地 Git 已初始化，正在进行暂存后安全审计。  
> 日期：2026-08-04。  
> 边界：本审计只记录路径、扩展名、文件大小与风险分类，不读取、复制或展示凭证值和敏感文件内容。

## 1. 审计目标

在 `D:\Codex\投顾APP` 建立本地 Git 前，验证初始提交候选中不包含环境文件、凭证、签名材料、本机 Android 路径、插件配置、构建产物或会话级临时文件。

本审计不授权：

- 执行 `git init`、`git add` 或 `git commit`；
- 创建、连接或推送 GitHub 仓库；
- 打开 `.env`、密钥、证书、签名文件或插件私有配置；
- 删除历史 POC 或轮换平台凭证；
- 安装 Android Studio 或创建客户端工程。

## 2. 忽略规则验收清单

### 必须被忽略

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

补充要求：

- 忽略 Android/Gradle 构建目录、本机 SDK 路径、签名属性和 APK/AAB 构建物；
- 保守忽略未来可能由 Firebase 生成的 `google-services.json`；当前切片不使用 Firebase，正式接入时必须另行评估其配置与提交方式；
- 忽略 Vite、Playwright、Vercel、Python、IDE 和操作系统本机缓存；
- 不使用会误伤正式 PNG、PDF 或 Markdown 设计资产的全局扩展名规则。

### 必须保持可提交

```text
AGENTS.md
docs/
_system/
report-engine/src/
report-engine/test/
report-engine/package.json
report-engine/package-lock.json
phase1-webhook-test/ 中不含敏感信息的历史源码与文档
.starwork/ 中项目级协作定义和历史交接记录
```

## 3. 忽略规则验证结果

项目尚无 Git 元数据，直接运行计划中的 `git check-ignore --no-index` 会返回“不是 Git 仓库”。为避免提前执行 `git init`，本次在系统临时目录创建了仅含 Git 元数据的一次性审计仓库，并把项目根作为工作树执行同等验证。

### 必须忽略的抽查

| 路径类别 | 抽查路径 | 结果 |
|---|---|---|
| 历史环境文件 | `phase1-webhook-test/.env.local` | 已忽略 |
| Obsidian 插件数据 | `.obsidian/plugins/copilot/data.json` | 已忽略 |
| Superpowers 会话产物 | `.superpowers/brainstorm/example.md` | 已忽略 |
| Android 本机 SDK 路径 | `client-app/android/local.properties` | 已忽略 |
| Android 签名文件 | `client-app/release-key.jks` | 已忽略 |
| Node 依赖 | `client-app/node_modules/example.txt` | 已忽略 |
| Vite 构建物 | `client-app/dist/index.html` | 已忽略 |
| Android 构建物 | `client-app/android/app/build/outputs/apk/debug/app-debug.apk` | 已忽略 |
| 临时 PDF 审阅物 | `tmp/pdf-review/example.png` | 已忽略 |

根规则对未来目录的 `.env`、`.env.local` 和 `.env.production` 均生效；`.env.example` 通过反向规则保持可提交。

### 必须保持可提交的抽查

| 路径 | 结果 |
|---|---|
| `AGENTS.md` | 可提交 |
| `docs/current-status.md` | 可提交 |
| `report-engine/src/index.ts` | 可提交 |
| `_system/tasks/todo.md` | 可提交 |
| `.starwork/workspace.json` | 可提交 |

结论：9 个必须忽略样例和 5 个必须保留样例全部符合预期。

## 4. 路径级敏感候选

扫描只使用文件名、相对路径、扩展名和大小；未打开候选内容。

| 相对路径 | 大小 | 是否忽略 | 分类与处置 |
|---|---:|---|---|
| `phase1-webhook-test/.env.local` | 1,196 B | 是 | 历史环境文件；不读取、不提交，是否轮换取决于 POC 是否仍使用 |
| `.superpowers/brainstorm/.last-token` | 64 B | 是 | 本地会话令牌文件；由整个 `.superpowers/` 规则排除 |
| `.obsidian/plugins/copilot/data.json` | 11,907 B | 是 | 本机插件配置；由整个 `.obsidian/` 规则排除 |

文件名扫描另命中 8 个 TypeScript 依赖中的 `tokenFlags` 文件；它们位于已忽略的 `report-engine/node_modules/`，属于文件名误报，不是项目凭证。

未发现 `.jks`、`.keystore`、`local.properties`、私钥、证书或签名属性文件进入候选清单。

## 5. 大文件与生成物

| 路径 | 文件数 | 大小 | 是否忽略 | 分类 |
|---|---:|---:|---|---|
| `report-engine/node_modules/` | 533 | 29.44 MB | 是 | 依赖目录 |
| `report-engine/dist/` | 18 | 0.08 MB | 是 | 构建输出 |
| `phase1-webhook-test/.vercel/` | 2 | 小于 0.01 MB | 是 | Vercel 本机元数据 |
| `.obsidian/` | 13 | 6.65 MB | 是 | 本机应用和插件数据 |
| `.superpowers/` | 53 | 0.77 MB | 是 | 会话与审阅运行产物 |
| `.docx-review/` | 0 | 0 MB | 是 | 文档审阅临时目录 |
| `tmp/` | 19 | 3.69 MB | 是 | PDF 视觉检查缓存 |
| `report-engine/artifacts/` | 4 | 0.04 MB | 否 | 已确认的固定样例视觉证据，保留提交 |

大于 10 MB 的文件只有 `report-engine/node_modules/` 中的 TypeScript 可执行文件（23.38 MB），已被 `node_modules` 规则排除。

## 6. 提交候选预审

使用系统临时 Git 元数据生成了等价的 `status` 与 `ls-files --others --exclude-standard` 候选列表，未在项目内创建 `.git`，也未执行暂存。

| 顶层范围 | 候选文件数 | 候选大小 |
|---|---:|---:|
| 根文件 | 5 | 0.099 MB |
| `.agents/` | 1 | 小于 0.001 MB |
| `.claude/` | 1 | 小于 0.001 MB |
| `.starwork/` | 25 | 0.013 MB |
| `_system/` | 32 | 0.045 MB |
| `copilot/` | 15 | 0.008 MB |
| `docs/` | 75 | 2.172 MB |
| `phase1-webhook-test/` | 10 | 0.043 MB |
| `report-engine/` | 21 | 0.184 MB |

- 候选总数：185 个文件；总大小约 2.564 MB。
- 禁止类别候选：0。
- `phase1-webhook-test/` 候选只有安全源码、测试、说明、包清单和 Vercel 配置；不包含 `.env.local` 或 `.vercel/`。
- `report-engine/` 候选不包含 `node_modules/`、`dist/` 或覆盖率目录。
- `.starwork/`、`.agents/`、`.claude/` 与 `copilot/` 作为项目 AI 工作空间定义保留；它们不属于运行缓存。连接远端前仍需在暂存阶段执行不输出匹配值的文本敏感标记扫描。

临时审计目录位于系统 Temp，只包含约 26.6 KB Git 元数据，不包含项目文件内容。工具安全策略阻止了本轮自动删除；它不在项目目录、不会进入提交候选，可由系统临时文件清理机制或后续获准的安全清理步骤移除。

## 7. 历史 `.env.local` 门槛

| 项目 | 状态 |
|---|---|
| 文件是否被 Git 忽略 | 是 |
| 是否读取或输出值 | 否 |
| 对应历史 POC 是否仍使用 | 否；2026-08-04 已按历史审计项目停用 |
| Vercel 生产服务状态 | 已暂停；平台控制面返回 `paused: true` |
| 平台侧环境变量 | 仍保留 5 个生产作用域变量；未读取值，项目暂停后不可对外执行 |
| 外部凭证是否已轮换 | 未执行；若未来恢复或复用任一历史服务，必须先重新签发，不得直接沿用 |
| 是否允许进入提交候选 | 否 |

## 8. 当前结论

- Task 1 已完成：根 `.gitignore` 已创建，必须忽略和必须保留的样例全部通过验证。
- Task 2 的路径扫描、大文件扫描和临时候选预审已完成：185 个候选中禁止类别为 0。
- 尚未读取或输出任何敏感文件值。
- 2026-08-04 只读检查确认 `phase1-webhook-test` 仍有 20 个 `READY` 生产部署和 5 个生产环境变量；随后通过 Vercel 官方暂停接口停用，复核结果为 `paused: true`。本地历史源码和部署记录未删除。
- 用户已明确授权继续地基任务；项目根本地 Git 已初始化为 `main`，未添加 remote、未连接 GitHub、未推送。
- 暂存后敏感标记扫描已通过，本地安全基线提交已建立；未连接 GitHub、未添加 remote、未推送。

## 9. 本地 Git 与暂存后审计（2026-08-04）

| 检查项 | 结果 |
|---|---|
| 当前分支 | `main` |
| GitHub remote | 0；未连接、未推送 |
| 必须忽略样例 | 9/9 通过 |
| 必须保留样例 | 5/5 通过 |
| 暂存文件 | 186 个，约 2.57 MB |
| 暂存禁止路径 | 0 |
| 大于 10 MB 的暂存文件 | 0 |
| 高置信密钥模式 | 0 |
| 通用赋值型密钥候选 | 0 |
| 带凭证 URL 候选 | 1 个；位于测试文件且使用 `example.com`，确认为安全的负向测试样例 |

审计只输出命中文件与规则类别，不输出可能的匹配值。`git diff --cached --check` 对历史 Markdown 的双空格换行和文件末尾空行给出格式提示；这些不是密钥、安全或构建风险，本轮不对 186 个历史文件做无关的批量格式改写。

用户已提供 Git 作者信息，并且只写入本仓库的本地配置；全局 Git 作者配置保持未设置。安全基线提交说明为 `chore: establish secure project baseline`。
