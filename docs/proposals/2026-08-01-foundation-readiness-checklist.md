# 知行项目地基清理与开工准备清单

> 状态：批次 A、B、客户端 UI/UX、品牌视觉、工程参数、Git 安全基线、Android 工具链、离线客户端 Task 1 至 Task 10 模拟器范围均已完成；历史 POC 已暂停，真机最终验收待完成。
> 日期：2026-08-01  
> 依据：[项目工作系统审计与后续总路线](./2026-08-01-project-work-system-audit-and-master-roadmap.md)

## 一、现在必须先清理的地基事项

以下事项记录地基收口全过程；已完成项保留为审计证据，当前只以未勾选门槛和“建议的当前执行范围”为后续入口。

### 1. 同步项目本地工作系统

- [x] 更新 `_system/context/current-projects.md`：改为个人 Android APK 路线，记录四类离线报告已完成、iFind 为后续个人数据候选。
- [x] 更新 `_system/tasks/todo.md`：移除 Wind/iFinD/Choice 多人应用询价任务，改为“工作系统收口 → UI/UX 设计 → 客户端规格确认”。
- [x] 更新 `_system/context/decisions.md`：新增个人 APK、单一所有者、Capacitor、云端引擎和不开放注册的已确认决定；旧数据源决策保留日期和历史语境，不覆盖历史。
- [x] 新增 2026-08-01 项目日志，记录产品路线变化、正式文档更新、审计结果和当时工程初始化仍未开始的事实（后续已完成）。
- [x] 保持 `_system/tasks/current-work.md` 继续只指向唯一待办来源，不建立第二套任务清单。

验收：`AGENTS.md`、`docs/current-status.md`、`_system/context/current-projects.md` 与 `_system/tasks/todo.md` 对“当前阶段和下一步”的表述一致。

### 2. 修正已确认提案的状态

- [x] 将 `docs/proposals/2026-08-01-personal-android-apk-change-proposal.md` 从“待确认/尚未生效”改为“已确认并同步正式文档”。
- [x] 勾选该提案第 9 节已经确认的七项结论。
- [x] 保留提案原始决策内容，不把后续 UI 或实现细节倒填成当时已确认事项。

验收：变更提案、正式产品需求和正式架构之间没有状态冲突。

### 3. 更新辅助阅读导航

- [x] 更新 `docs/obsidian/项目导航.md`：从多人 Web 应用改为个人 Android APK + 云端报告引擎。
- [x] 更新 `docs/obsidian/决策与风险.md`：四类离线报告、124/124 回归、APK 路线和当时尚未设计 UI 的状态（后续已完成）。
- [x] 更新 `docs/obsidian/开发日志.md`：补充 2026-07-31 行业跟踪与 2026-08-01 产品路线变化。
- [x] 检查 `docs/obsidian/首页.md` 的当前阶段描述仍与正式状态一致。

验收：Obsidian 只承担导航作用，不再显示旧测试数、旧报告数量或多人 Web 目标。

### 4. 收口多 Agent 协作入口

- [x] 保留现有四个长期岗位，不重新创建、不升级 StarWork。
- [x] 在 `_system/collaboration/shared.md` 标记旧请求为历史完成记录，清理无意义的空模板行。
- [x] 将四个 lane 的 `worklog.md` 明确标记为“当前无活动任务”，不伪造过去产出。
- [x] 由协调岗位准备一个“客户端信息架构与 UI/UX 设计”工作包，但在用户问题集中确认完成前不逐条派发。
- [x] 工作包明确四个岗位的新职责：规格整理、原型实现建议、安全复核、任务交接；报告引擎开发岗位暂不修改业务代码。

验收：StarWork 只有一个当前工作包，所有岗位知道输入、产出、写入边界和交接位置。

## 二、工程初始化前必须完成的事项

这些不是当前的文档清理，但必须在创建 Android/Capacitor 工程前完成。

### 5. 完成客户端信息架构和 UI/UX

- [x] 确认一级导航与页面层级。
- [x] 确认今日报告、报告库、详情、行业、标的池和个人操作页的布局。
- [x] 定义加载、空数据、失败、离线和正常状态。
- [x] 确认 App 图标、启动页、主色、字体、间距、卡片和状态色。
- [x] 生成手机端低保真线框和高保真原型并逐页确认。
- [x] 将确认结果合并到 `docs/superpowers/specs/2026-08-01-personal-android-apk-client-design.md`，并新增品牌视觉基础正式规格。

验收：页面和交互不存在歧义，用户已确认原型，规格中没有未解决项。

### 6. 处理版本控制和敏感文件风险

- [x] 确认在当前项目根目录建立本地 Git；安全基线通过后再连接私有 GitHub。
- [x] 制定 `.gitignore`：排除 `node_modules`、构建产物、临时截图、`.env*`、Android 本地配置与签名文件。
- [x] 不读取值地检查 `phase1-webhook-test` 平台状态；确认项目此前仍启用，并于 2026-08-04 在 Vercel 暂停生产服务。
- [x] 确认 `.env.local` 及 `.vercel/` 均被 Git 忽略；历史源码保留审计，任何未来恢复都必须重新签发凭证，不得直接沿用旧值。
- [x] 确认历史 Coze POC 保留为只读审计目录，不进入新客户端依赖。

验收：Git 初始提交前的候选文件清单不含密钥、环境文件、签名证书或大体积临时产物。

### 7. 确认 Android 工程参数与环境

- [x] 确认 Android 应用显示名“知行”和应用 ID `com.zhixing.research`。
- [x] 确认 `minSdk 24 / compileSdk 36 / targetSdk 36`，首轮使用单一 API 36 模拟器；具体手机型号在最终真机验收前记录。
- [x] 确认客户端目录为 `client-app/`，与 `report-engine/` 独立。
- [x] 安装并验证 JDK、Android Studio/SDK 36、Platform Tools、Command-line Tools 与 ADB；Gradle 优先由 Android 工程包装器管理。
- [x] 创建并启动一个 API 36 AVD，确认可通过 ADB 识别；真机连接延后至首个调试 APK 的最终验收。
- [x] 确认首轮只构建调试 APK，正式证书暂不创建。

验收：模拟器开发门槛通过后即可初始化客户端工程；首个调试 APK 先在 API 36 AVD 安装，最终仍须在自有真机完成一次安装和冒烟。此时仍未接入真实数据或网络。

### 8. 生成文件级实施计划

- [x] 在 UI 规格与工程参数获批后，使用正式规划流程生成详细实施计划。
- [x] 计划列出每个任务的文件、测试、验证命令和交接顺序。
- [x] 首个实现切片严格限定为固定样例客户端，不接 iFind、云端、模型、认证或正式 PDF。

验收：实施人员不需要自行猜测页面、接口、错误状态或写入边界。

已生成：

- `docs/superpowers/plans/2026-08-03-client-foundation-readiness.md`
- `docs/superpowers/plans/2026-08-03-personal-android-client-offline-slice.md`

## 三、后续阶段处理，不阻塞当前 UI 工作

以下项目真实存在，但现在不应为了“清空待办”而提前实施。

- [ ] iFind MCP/接口的云端定时调用、字段、配额、时区和失败语义验证。
- [ ] 单一所有者登录方式和受保护 API。
- [ ] Vercel/Supabase 或替代云端组合的最终确认。
- [ ] 模型供应商与严格证据输入契约。
- [ ] 真实交易日历和真实数据适配器。
- [ ] `holiday_digest`、`month_end_review`、`industry_research`。
- [ ] `watchlist_snapshot` 与真实标的池历史。
- [ ] Playwright/Chromium 正式 PDF 导出和私有存储。
- [ ] 云端定时任务、幂等、重试、延迟告警和任务恢复。
- [ ] 正式 APK 签名证书、HTTPS 下载页、二维码和升级流程。
- [ ] Android 系统通知是否需要启用。
- [ ] 连续 10 个 A 股交易日的个人稳定运行验收。

## 四、可以保留、不需要现在清理的内容

- `phase1-webhook-test/` 的历史代码：保留审计，不继续扩展；仅单独处理潜在有效凭证。
- `.starwork/handoff/archived/`：历史交接备份，不迁移、不删除。
- `_system/archive/`：此前全局工作系统纠错备份，不修改。
- `tmp/pdf-review-20260730/`：目前是历史视觉证据；是否清理放到 Git 初始化前决定。
- `AGENTS.md` 的历史 Coze 章节：顶部 0.2 已覆盖，短期不阻塞 UI；以后如要精简，必须先生成无损迁移预览。

## 五、当前剩余顺序

```text
已完成：API 36 AVD 与 ADB
  → 已完成：Git、安全与报告引擎基线
  → 已完成：client-app Task 1 至 Task 9
  → 已完成：Debug APK 模拟器安装、离线与九页冒烟
  → 当前门槛：最终真机安装与关键冒烟
  → 后续独立阶段：真实数据、认证、云端、PDF 与调度
```

## 六、建议的当前执行范围

当前 Debug APK 的 API 36 模拟器验收已通过；不读取密钥、不接入真实数据或业务网络、不修改报告引擎业务代码。真机连接仍延后至用户方便时完成最终验收。
