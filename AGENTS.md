# 投顾报告应用协作指南

## 0. 当前最高优先级决定（2026-07-28）

本文件中凡是将 Coze Agent、Calendar、Workflow、Skill、Webhook 或 Coze API 视为**正式报告生成依赖**的旧表述，均已被本节覆盖。它们只保留为历史 POC 与审计证据，不得据此继续部署、接入、创建日程、配置凭证或生成真实报告。

当前正式候选路线是：由 Codex 协助开发“知行报告引擎”，由 Vercel Cron 或同等可信云端运行时调度；报告引擎必须在交易日历和真实数据来源校验成功后，才可调用模型生成非个人化市场研究内容。数据不足、来源不明或合规校验失败时必须失败关闭，不得编造。

本轮只允许进行无真实数据、无密钥、无日程的固定样例原型。数据供应商、模型供应商、正式 API 契约、Supabase、发布与站内通知均属于后续独立阶段。详见 [docs/report-engine-architecture.md](./docs/report-engine-architecture.md)。

本文件第 0 节之后出现的 Coze 相关内容均为历史调查或 POC 审计记录，不能作为新的实现依据。恢复工作时，优先阅读 `docs/report-engine-architecture.md`、当前已确认的规格文档，以及本文件末尾最新的“报告引擎”记录。

### 0.1 项目本地工作系统与存档边界（2026-07-30）

- 本项目的工作状态、决策、任务、日志和经验只写入项目根目录下的 `_system/`。
- 用户说“存档”“保存进展”或调用 `$save` 时，目标必须是 `D:\Codex\投顾APP\_system`；即使当前工作目录位于项目子目录，也不得改变目标。
- `D:\Codex\AI工作系统` 是独立的全局个人工作系统。除非用户明确将其作为单独任务点名并授权，否则不得读取、同步或写入其中的项目进度。
- 找不到当前项目 `_system/` 时必须停止并说明问题，不得回退到全局工作系统。
- 存档只做最小增量更新；`AGENTS.md` 是规则入口，`docs/current-status.md` 是工程状态入口，`_system/` 只保存便于恢复工作的项目级摘要，不复制完整工程文档。

### 0.2 个人 Android APK 路线（2026-08-01，优先级高于旧的多人 Web 产品描述）

- 项目当前目标是**仅供项目所有者本人使用**的“知行”个人市场研究工具；不开放朋友注册、邀请、共享阅读、订阅、运营统计、对外公开链接或付费。
- 主要客户端是私有分发的 Android APK。推荐以 Capacitor 封装 Web 界面；它是完整的可视化客户端，不是仅用于阅读报告的引擎外壳。
- APK 的首版范围：今日报告、报告库、报告详情、产业与标的池、PDF 下载、个人操作页；不做社交、多人、支付、iOS 安装包或实时行情终端。
- APK 可以被复制，因此不得把“只在我的手机安装”当作权限控制。报告、任务与个人操作接口仍必须由可信服务端验证单一所有者身份；任何数据源、模型或管理凭证绝不进入 APK、前端、二维码、日志或截图。
- 报告引擎仍由未来的可信云端运行时定时执行，Codex 不需要、也不得被当作生产运行时持续在线。
- iFind 被记录为后续个人主数据候选；在单独完成技术适配器契约、运行方式、字段、时效、配额和失败语义验证前，不配置真实凭证、不接入真实数据，也不生成真实报告。
- 旧文中“受邀用户 Web 应用”“多人注册”“邮件/站内通知”“管理员审核”等产品描述均为历史路线，不得据此实现；若未来恢复多人或对外使用，必须单独提出并确认新的产品、数据与权限方案。

## 1. 项目定位

这是一个面向投资者的**市场研究报告订阅与归档 Web 应用**。用户注册后，可以按时收到并查看由 Coze Agent 生成的市场报告，并按日期和报告类型检索历史内容。

核心目标不是做自动交易或个性化荐股，而是稳定完成：

```text
报告生成 → 校验 → 归档 → 发布 → 推送 → 用户阅读与检索
```

第一版建议只覆盖 A 股；其他市场、付费会员、原生 App、小程序、实时行情和个性化荐股均属于后续能力，不能阻塞 MVP 上线。

## 2. 已确认的产品边界

- 报告内容、Prompt 和内容风格由用户在 **Coze Agent** 中维护和迭代。
- 应用不承担 Prompt 编辑器、报告生成策略配置或 Agent 内容调优功能。
- 应用负责用户账号、权限、报告接收、校验、归档、发布、推送、管理后台与运行监控。
- 默认产品形态是响应式 Web App（可在手机浏览器使用）；原生 App、微信小程序后置。
- 第一版报告类型：早盘扫描、每日复盘、产业研究报告。
- 第一版建议推送渠道：站内通知 + 邮件；微信、短信、原生 App Push 后置。
- 第一版所有已发布报告默认可由具备访问权限的用户阅读；付费分层若未明确，不提前实现。

## 3. 责任边界：Coze 与应用

| 领域 | 责任方 | 说明 |
|---|---|---|
| 报告内容、逻辑、Prompt、语气 | Coze Agent + 用户 | 任何内容调整优先在 Coze 完成。 |
| 报告调用、任务重试、状态跟踪 | 应用后端 | 应用统一记录任务状态，不依赖人工记忆。 |
| 用户注册、登录、角色 | Supabase + 应用 | 不交给 Coze。 |
| 报告归档、筛选、阅读权限 | Supabase + 应用 | 支持按日期和报告类型查找。 |
| 定时发布与通知 | Vercel + 应用 | 由应用决定何时生成、发布、推送。 |
| 数据和操作日志 | Supabase + 应用 | 保存任务、发布、重试、通知记录。 |

**架构原则：Coze 是内容生产服务，不是用户和业务数据的唯一系统。**

## 4. 推荐技术栈

- 前端与服务端：Next.js + TypeScript。
- UI：Tailwind CSS 与稳定的组件库；视觉实现以 Open Design 产物为准。
- 认证、数据库、文件存储：Supabase Auth、PostgreSQL、Storage。
- 部署与定时任务：Vercel、Vercel Cron。
- 内容生成：Coze Agent / Workflow，通过 API 或 Webhook 集成。
- 代码协作：GitHub、Pull Request、GitHub Actions。
- 邮件：Resend、Postmark 或用户确认的服务商。
- 异常监控：Sentry（推荐）。
- 测试：Vitest/Jest（单元测试）+ Playwright（端到端测试）。

除非用户明确改变产品形态，否则不要擅自改为原生 App、小程序或多端并行开发。

## 5. 总体架构

```text
Vercel Cron
  → 应用服务创建生成任务
  → 调用 Coze Agent / Workflow
  → 校验报告字段、日期和重复性
  → Supabase 归档报告与任务日志
  → 发布报告
  → 写入通知任务
  → 站内通知 / 邮件
  → 用户端阅读、筛选和订阅管理
```

### 调度决策

默认采用“**应用统一调度**”：Vercel Cron 触发应用后端，再由应用调用 Coze。

- 优点：任务状态、重试、补发和日志集中；避免重复发送；长期维护成本更低。
- 如果 Coze 当前只能主动回调，允许采用 Coze Webhook 推送到应用，但必须校验签名、实现幂等入库并保留补发能力。

不要让 Coze 直接操作用户权限、直接发送用户邮件，除非后续有明确、安全且可审计的授权设计。

## 6. Coze 报告交付契约

应用必须把 Coze 输出视为版本化接口，而不是不受约束的自然语言。新接入或修改 Coze 输出前，先更新契约和样例。

推荐最小 JSON 结构：

```json
{
  "report_id": "coze-unique-id",
  "report_type": "morning_scan",
  "market": "cn_a",
  "title": "A股早盘扫描｜YYYY-MM-DD",
  "summary": "三条核心摘要",
  "content_markdown": "完整报告正文",
  "cover_image_url": null,
  "source_links": [],
  "data_as_of": "ISO-8601 时间",
  "generated_at": "ISO-8601 时间",
  "version": "1.0"
}
```

### 契约要求

- `report_type` 只能使用受支持的枚举值：`morning_scan`、`daily_review`、`industry_research`。
- 每份报告必须有唯一 Coze 标识、市场、标题、正文、数据时间、生成时间和版本号。
- 所有时间统一保存为带时区的 ISO-8601；展示时使用 `Asia/Shanghai`。
- 应用必须校验必填字段、报告日期、报告类型和 JSON 格式，校验失败不能自动发布。
- Coze Prompt 或内容可随时升级，但字段语义或类型变更必须先升级契约版本并兼容旧数据。
- 保留 Coze 任务 ID、原始返回、版本号和生成耗时，用于追溯和补发。

## 7. 数据模型与权限

### 推荐核心表

| 表 | 用途 |
|---|---|
| `profiles` | 用户资料、角色、账号状态。 |
| `reports` | 报告正文、类型、日期、状态、版本和发布时间。 |
| `report_sources` | 报告引用的来源和数据时间。 |
| `subscriptions` | 用户订阅的报告类型。 |
| `notification_preferences` | 用户推送渠道与开关。 |
| `notification_logs` | 每次推送的发送、成功、失败和重试记录。 |
| `generation_jobs` | Coze 调用、任务状态、重试、错误信息。 |
| `market_calendar` | 交易日、休市、特殊交易时间。 |
| `audit_logs` | 发布、撤回、重试和管理员操作记录。 |

### 推荐状态机

```text
generation_job: queued → running → succeeded | failed | retrying
report: draft → validated → scheduled → published
                                      ↘ failed
notification: pending → sending → sent | failed | retrying
```

### 用户角色

- `user`：读取已发布报告，管理自己的订阅偏好。
- `editor`：查看待处理报告并编辑内容（若后续开启）。
- `admin`：发布、撤回、重试、查看任务日志、管理用户。

### 权限规则

- 必须启用 Supabase Row Level Security（RLS）。
- 普通用户只能读取已发布且自己有权限阅读的报告。
- 普通用户只能读取和修改自己的订阅偏好。
- 生成任务、通知日志、原始 Coze 返回和管理操作只允许管理员读取。
- 使用服务角色密钥的接口只能运行在可信服务端，绝不暴露给浏览器。

## 8. 定时生成、发布和推送规则

### 标准任务流程

1. Cron 到达计划时间。
2. 检查 `market_calendar`，非交易日默认不生成。
3. 以 `report_type + market + report_date` 检查是否已经存在已完成任务或已发布报告。
4. 创建 `generation_job` 并获取任务锁。
5. 调用 Coze。
6. 异步轮询或接收回调，直到拿到最终报告结果。
7. 校验报告契约和业务规则。
8. 入库为 `validated`；根据规则自动发布或等待管理员审核。
9. 发布后创建通知任务并发送。
10. 写入审计日志和监控指标。

### 可靠性要求

- 幂等键：`report_type + market + report_date`，防止重复生成、重复发布和重复通知。
- 同一报告同一时刻只能有一个运行中的生成任务。
- Coze 调用应设置超时、错误分类和退避重试；默认最多 3 次，具体值由用户确认后配置。
- 生成失败时不能推送空报告；通知管理员并支持后台手动重试。
- 管理员必须能对指定日期、指定类型进行重新生成、重新发布或补发通知。
- 所有定时任务、回调和管理操作必须可追踪。

### 发布策略

发布策略需要用户明确选择：

- 自动发布：速度快，适合报告格式和质量已经长期稳定的场景。
- 人工审核发布：风险低，适合上线初期或产业深度报告。

推荐 MVP：早盘和复盘可配置为自动发布；产业报告默认人工审核。不得默认假设用户同意自动发布。

## 9. 用户端与管理端范围

### MVP 用户端

- 邮箱注册、登录、退出。
- 首页：今日已发布报告和最近报告。
- 报告详情：标题、摘要、正文、数据时间、来源、风险提示。
- 历史归档：按日期、报告类型筛选。
- 订阅设置：早盘、复盘、产业报告、站内通知与邮件开关。
- 个人中心：资料和通知偏好。

### MVP 管理后台

- 今日任务和报告状态总览。
- 查看 Coze 返回、任务 ID、错误原因和重试次数。
- 手动重新生成、发布、撤回和补发。
- 查看通知发送记录和失败原因。
- 管理员操作审计记录。

### 默认不做

- 自动交易、下单、持仓接入。
- 个性化荐股或收益承诺。
- 原生 App、微信小程序。
- 实时行情终端。
- 社区、评论、复杂社交功能。
- 在应用内编辑 Coze Prompt。
- 未确认前的付费、会员或支付系统。

## 10. 安全、隐私与内容边界

- 每份报告、详情页和推送邮件均应展示适当的风险提示，例如“仅供信息参考，不构成投资建议”。
- 不得承诺收益、保证盈利，或在未完成合规评估前将内容描述为个性化投资建议。
- 商业化、收费、具体证券推荐或面向公众大规模发布前，应寻求适用的专业合规意见。
- 不向 Coze 发送用户邮箱、订阅行为或其他个人信息，除非确有业务必要、已完成最小化处理并取得明确授权。
- Coze 回调必须进行共享密钥或签名校验。
- 所有密钥只能放在 Vercel/Supabase 等受控环境变量；不得提交到 GitHub、设计稿、日志或前端包中。
- 管理员账号应启用多重验证。
- 日志必须脱敏，不能记录 API Key、令牌或完整的敏感个人数据。
- 报告必须保存来源、数据时间、生成时间和版本，避免把历史内容误认为实时内容。

## 11. 文档与代码一致性

所有重要调整都要同步检查 `/docs`。重点包括：报告契约、信息架构、数据库、权限、调度、通知和部署。

建议维护：

```text
/docs/product-requirements.md
/docs/system-architecture.md
/docs/coze-report-contract.md
/docs/database-design.md
/docs/scheduling-and-notification.md
/docs/security-and-compliance.md
/docs/deployment-guide.md
```

出现以下变化时，必须询问用户是否同步更新文档，并说明更新大纲：

- Coze 输出字段、报告类型或版本策略变化。
- 主要页面、用户流程或导航结构变化。
- 数据库表、权限模型或角色变化。
- 调度、推送渠道、发布审核策略变化。
- 新增付费、数据源、外部服务或隐私数据处理。

如果实现与文档不一致，必须明确说明偏离点、原因、影响，并让用户选择：更新代码、更新文档，或记录偏差原因。

## 12. 工程协作规则

### 开始工作前

1. 阅读本文件和相关 `/docs`。
2. 明确本次改动的用户目标、影响范围和验收标准。
3. 涉及架构、状态、数据模型、权限、依赖、路由或主要 UI 调整时，先向用户说明技术判断依据。
4. 存在多种实现路径时，至少列出两种可行方案，比较复杂度、扩展性、风险和开发成本，再给出推荐。

### 实现前说明

每次重要实现前，应简短说明：

- 改动影响范围。
- 可能受影响或被破坏的模块。
- 验证方法。
- 是否需要更新 `/docs`。

### 实现与验证

- 所有数据结构变化通过可回滚的 Supabase migration 管理。
- 新的外部接口必须有输入校验、错误处理、超时和日志。
- 新的 Cron/回调逻辑必须具有幂等控制和重试策略。
- 修改权限逻辑时必须覆盖正向和越权测试。
- 推送逻辑必须测试关闭订阅、重复发送、失败重试和退订。
- 提交前运行与改动相称的 lint、类型检查、单元测试和端到端测试。
- 不以临时绕过方案替代长期设计；若确实需要临时方案，必须标记 `TODO`、写明原因、退出条件和风险。

### 完成后交付

完成每项任务时，用简体中文简要说明：

- 做了什么。
- 关键技术判断。
- 验证结果。
- 生成或修改了哪些文件，以及它们的完整路径。
- 尚未解决的风险或需要用户决策的事项。

## 13. 上线验收基线

首次公开测试前至少满足：

- 用户可注册、登录、阅读已发布报告。
- 可按日期和报告类型查询历史报告。
- 早盘、复盘、产业报告能按规则入库和发布。
- 连续 10 个交易日无漏发、无重复发布、无重复推送。
- Coze 超时或字段错误时不会发布空或错误报告。
- 管理员能查看失败原因并完成重试或补发。
- 普通用户无法访问未发布报告、后台任务或他人数据。
- 风险提示、隐私政策和服务条款已就绪。

## 14. 当前待确认信息

在实现自动化前，必须向用户确认或获取：

- Coze Agent/Workflow 的调用方式、认证方式、任务状态查询和真实输出样例。
- Coze 是否可稳定返回固定 JSON；如不能，如何进行结构化转换。
- 各报告生成时间、发布时间、最晚允许发布时间。
- 交易日、节假日、调休与补发规则。
- 自动发布与人工审核的选择。
- 第一版推送渠道、邮件服务和发送域名。
- Supabase、Vercel、GitHub、Coze 的项目/账号权限。
- Open Design 的设计稿、品牌素材和目标页面。
- 管理员账号、角色设置和用户数据保留策略。
- 数据来源的授权范围、来源展示方式和商业化计划。

## 15. 给协作者的沟通风格

- 默认使用简体中文，表达口语化、清晰、可执行。
- 不为了做功能而做功能；发现用户把实现方案误当需求时，应先区分目标、方案和替代方案。
- 对用户适度解释关键工程判断，帮助其理解“为什么这样做”。
- 不擅自扩大范围；缺少会显著影响产品方向的关键信息时，先提出简洁问题。
- 完成任务后必须说明生成文件及其完整路径。

## 16. 固化实施路线图

以下顺序是当前已达成共识的 MVP 实施计划。除非用户明确调整优先级，后续开发必须按阶段推进；每一阶段通过验收后，才进入下一阶段。

| 阶段 | 目标与主要工作 | 主要工具 | 用户需提供 | 阶段交付与验收门槛 |
|---|---|---|---|---|
| 0. 产品冻结 | 确认市场范围、报告类型、发布时间、审核方式、推送渠道与 MVP 不做项。 | Open Design、GitHub、Coze | 产品定位、报告类型、发布时间、品牌和审核决策。 | `/docs/product-requirements.md`；能清楚说明首版用户、场景和成功标准。 |
| 1. Coze 契约 | 确认 Coze 调用/回调方式，定义版本化 JSON 输出、任务状态、超时和错误处理。 | Coze Agent/Workflow、HTTP API、Postman/Bruno、GitHub | Coze 真实输出样例、调用凭据配置方式、任务查询能力。 | `/docs/coze-report-contract.md`；三类报告都能被应用稳定解析。 |
| 2. 工程基础 | 创建 Next.js 项目、GitHub 仓库、Vercel Preview、Supabase 开发环境和文档目录。 | GitHub、Vercel、Supabase、Open Design | GitHub/Vercel/Supabase 项目权限、设计稿或品牌素材。 | 可访问的预览环境；密钥不进入仓库；基础文档就绪。 |
| 3. 数据与权限 | 通过 migration 创建数据库、RLS、用户角色和核心状态机。 | Supabase PostgreSQL/Auth/RLS、GitHub Actions | 登录方式、管理员名单、内容访问和数据保留规则。 | `/docs/database-design.md`；越权访问测试通过。 |
| 4. 用户端 MVP | 完成注册登录、首页、报告详情、历史归档、订阅设置和移动端适配。 | Next.js、TypeScript、Tailwind、Supabase、Open Design | 页面原型、内容样例、品牌文案。 | 用户可注册并浏览模拟/已发布报告；可按日期和类型筛选。 |
| 5. Coze 自动化 | 接入 Cron、Coze 调用/回调、格式校验、幂等、任务锁、重试、入库与发布。 | Vercel Cron、Coze API/Webhook、Supabase、Sentry | 生成时间、交易日规则、最晚发布时间、自动发布决策。 | `/docs/scheduling-and-notification.md`；失败不会发布空报告，管理员可重试。 |
| 6. 推送与后台 | 接入站内通知和邮件；完成任务监控、重发、撤回、补发和审计后台。 | 邮件服务、Vercel Functions、Supabase、Sentry | 发送域名、邮件模板、告警邮箱、后台角色。 | 用户可管理订阅；同一报告不会重复推送；后台可补发。 |
| 7. 测试与灰度 | 覆盖权限、定时、Coze 失败、通知失败和移动端；内部运行后邀请测试用户。 | GitHub Actions、Playwright、Vercel Preview、Sentry | 首批测试用户名单、反馈渠道、可接受的故障标准。 | 内部运行 5 个交易日后，灰度运行 10 个交易日无漏发、重复或严重权限问题。 |
| 8. 公开测试 | 完善条款、隐私、风险提示、监控、回滚方案后开放注册。 | Vercel、Supabase、Sentry、GitHub | 上线域名、对外文案、合规与运营决策。 | 满足“上线验收基线”，并具备故障定位、补发和回滚能力。 |

### 各阶段不可跳过的关键门槛

- 未确认 Coze 输出契约前，不开发正式的自动入库和发布逻辑。
- 未完成 RLS 和权限测试前，不开放用户注册。
- 未完成幂等、重试和失败告警前，不启用定时自动发布。
- 未测试退订、重复发送和失败重试前，不对真实用户开启邮件推送。
- 未连续稳定运行至少 10 个交易日前，不开放公开注册。

### 当前起点

当前处于 **第 1 阶段安全交付验证进行中** 的状态：已完成 Coze Calendar → Agent Session 的能力调查和交付契约讨论，正在执行“清理后重建”方案。不得接入正式报告、数据库、用户、归档、发布或通知；只有通过本节的安全与端到端验收后，才进入第 2 阶段。

## 17. 第 0 阶段已确认决策（优先级最高）

本节是第 0 阶段的最终确认稿；如与前文的“建议”“待确认”或旧路线图表述冲突，以本节为准。

### 用户、访问与验证

- 首批用户是有一定 A 股投资经验、希望节省每日信息整理时间的个人投资者。
- 核心价值：用 5～10 分钟了解市场变化、主线和风险。
- 灰度期为受邀注册，仅邀请 5～10 位用户；访客仅浏览产品介绍。
- 用户通过邮箱 Magic Link 登录；首版不做收费、会员或支付。
- 首版所有已发布报告面向所有受邀注册用户一致展示，不做个性化内容。
- 灰度反馈通过外部渠道（微信群、问卷或一对一访谈）收集。
- 成功标准：连续 10 个 A 股交易日无漏发、无重复发布、无重复站内通知；至少 60% 测试用户每周阅读 3 次及以上；至少 3 位用户明确愿意继续使用或给出可执行改进建议。

### 内容、市场与时间

| 内容 | 范围 | Coze 整理完成 | 发布/发送 | 审核 |
|---|---|---:|---:|---|
| 早盘扫描 | 美股、期货等外围信息，为 A 股开盘提供背景；具体模板完全由 Coze 管理 | 工作日约 08:45 | A 股交易日 09:00 | 自动 |
| 每日复盘 | 仅 A 股 | 工作日约 17:30 | A 股交易日 18:00 | 自动 |
| 节假日资讯摘要 | 周末、法定假日等连续休市期间的价值新闻与信息 | 由 Coze 模板决定 | 连续休市最后一天 20:00 | 自动 |
| 产业研究 | 按行业与主题归档，不固定频率 | 不固定 | 审核完成后 | 人工 |

- “交易日”必须按 A 股实际交易日历判断，不能简单按周一至周五判断。
- 所有报告正文、栏目、Prompt 和内容修改均在 Coze 完成；应用后台不提供报告正文编辑功能。
- 应用只接收、校验、归档、版本化、发布、通知和审计 Coze 交付内容。
- 报告详情展示数据截至时间和可公开的关键来源链接；不展示 Coze 内部推理、Prompt 或抓取过程。
- 所有报告详情和站内通知固定显示“仅供信息参考，不构成投资建议”。

### 延迟、版本与归档

- 定时报告延迟后继续自动重试；成功后自动延迟补发，同时后台通知管理员并记录、上报延迟原因。
- 用户端必须显示“延迟发布”、原定时间和实际发布时间。
- 报告初版为 `v1.0`，修订后依次为 `v1.1`、`v1.2`；标题包含报告日期和版本号。
- 历史版本永久保留；归档列表默认展示最新版本，详情页可查看版本历史。
- 普通更新不再次通知，仅显示“已更新”；重大更新由管理员手动发送站内通知。
- MVP 阶段永久保留历史报告、报告版本和标的池快照。

### 通知与信息架构

- 首版仅做应用内通知中心和未读角标；不做邮件报告推送、短信、微信、浏览器 Web Push 或 App Push。
- 新用户默认订阅早盘扫描、每日复盘、节假日资讯摘要；产业研究默认不订阅，用户可自行调整。
- 默认首页为“今日报告”，集中展示当天全部已发布内容、未读状态、延迟/更新标识和标的池更新摘要。
- “市场报告库”归档早盘扫描、每日复盘和节假日资讯摘要，后者通过类型筛选查看。
- “产业研究”按申万一级行业浏览，并支持可扩展主题标签和时间排序。
- 首版视觉为浅色、专业克制、阅读优先；不做行情大屏，深色模式后置。

### 核心关注标的池

- 核心关注标的池属于 MVP，定位为可追溯的研究观察清单，不使用“荐股池”或“推荐池”表述。
- 第一版只纳入 A 股标的。
- Coze 独立整理并直接上传完整的结构化标的池快照；应用不从报告正文自动推断标的。
- 应用对比相邻完整快照形成新增、持续关注、已移出的历史轨迹。
- 灰度期标的池快照需管理员审核后才对用户生效。
- 标的池更新默认不单独通知；今日报告仅展示更新、新增和移出数量；重大变化可由管理员手动通知。
- 当前池默认展示新增和持续关注标的；已移出标的不删除，详情保留完整历史和移出原因。
- 标的至少需要证券代码、名称、申万一级行业、状态、首次/最近提及日期、关注原因摘要、风险提示及 Coze 提供的关联依据。

## 18. 第 1 阶段：Coze 交付链路调查记录（优先级最高）

本节记录截至 2026-07-15 已确认的事实、条件性契约和恢复任务。它优先于前文中“默认采用应用统一调度”“Coze 主动回调”等未验证的建议性描述。

### 已验证事实

- 当前所有报告由 **Calendar → Agent Session** 生成，而不是 Coze Workflow。
- 当前 Agent Session 能使用 Bash `curl` 或 Python `requests` 发送 HTTP POST、设置请求头、发送 JSON，并访问运行时变量/文件。
- 当前 Calendar → Agent Session **没有平台托管的 Secrets/环境变量面板**。`SECRET.md` 仅是明文文件，不能用于保存知行 Webhook Token 或任何长期密钥。
- 本地 Coze CLI 已验证授权有效；执行只读 `coze.cmd session list --limit 20 --format json` 返回空列表。因此，现有可查询的 Session API/CLI 路径没有暴露 Calendar 自动触发的 Agent Session，不能将“应用主动拉取 Calendar Session 结果”视为已验证方案。
- Windows 本机执行策略可能阻止 `coze.ps1`；需要只读 CLI 检查时使用 `coze.cmd`。该环境细节不改变 Coze 平台能力。

### 明确禁止的做法

- 禁止将 Bearer Token、API Key 或任何长期密钥写入 Agent Prompt、报告正文、普通变量、`SECRET.md`、代码文本、日志或截图。
- 禁止在未验证 Calendar Session 可读取的前提下，开始开发“应用拉取 Session 报告”的功能。
- 禁止因为当前缺少安全通道而降低为明文 Token 直连、公开 PDF 链接或人工复制密钥。

### 条件性确认的交付契约

以下规则在找到安全交付通道后继续有效；尚未实施：

- 统一交付入口：一个应用 Webhook，根据 `delivery_type` 区分 `report` 和 `watchlist_snapshot`。
- 报告交付：结构化 JSON，包含安全的 `content_html` 正文片段和可选 `pdf_url`；HTML 使用受控标签与样式白名单。
- PDF：应用内 HTML 为默认阅读方式；PDF 为可选下载附件。若转存 PDF 失败，不阻塞 HTML 报告发布，后台重试；最终文件应进入 Supabase 私有 Storage，用户通过短时受控链接下载。
- 身份与去重：每次交付都有唯一 `delivery_id`；同一报告使用稳定 `report_id`，内容版本由 Coze 提供 `version`；应用不自动覆盖相同 `report_id + version` 但内容不同的交付。
- 结构字段：Coze 必须提供 `schema_version`、`report_date`、`version`、`title`、`data_as_of`、`generated_at`、结构化 `source_links`、`summary_points` 和 `market_scopes`。
- 报告类型：`morning_scan`、`daily_review`、`holiday_digest`、`industry_research`；早盘使用 `market_scopes` 数组表达外围市场，复盘至少包含 `cn_a`。
- 产业研究：Coze 交付 `industry_tags`（申万一级行业）和 `theme_tags`。
- 标的池：使用独立 `delivery_type: watchlist_snapshot`，每次传完整当前 A 股标的快照；包含 `snapshot_id`、`snapshot_version`、`snapshot_at` 与 `items`。应用对比快照生成新增、持续和移出历史。
- 接收语义：应用完成验签和基础格式校验后快速返回 `202 Accepted`，再异步处理深度校验、转存、归档、发布和通知。
- 错误和重试：`2xx`（含重复交付）不重试；`400`、`401/403` 不重试并告警；`429/5xx` 或网络超时按 1 分钟、5 分钟、15 分钟退避，最多 3 次。错误响应使用不泄露敏感信息的标准错误码。
- Schema 兼容：新增可选字段不升主版本；删除字段、改含义或改类型必须升级 `schema_version` 主版本。未知字段容忍，关键字段严格校验。

### 已确认的安全交付架构（待完成端到端验证）

用户已确认将 **私有交付 Skill + Coze 托管的开发者凭证变量** 作为知行唯一的安全交付架构。

已由当前 Coze Agent 明确确认的能力边界：

- Calendar → Agent Session 可调用已安装且启用的私有 Skill，包括通过扣子编程开发的自定义私有 Skill。
- 扣子编程 Skill 支持 API Key 类型的开发者凭证变量；Agent 运行时只看到占位符，真实值由平台在 Skill 发起请求时服务端注入。
- Skill 可向被凭证域名白名单允许的外部 HTTPS 地址发起带自定义请求头和 JSON 请求体的 HTTP POST。
- 上述能力不适用于直接在扣子对话中制作的普通 Skill；必须使用扣子编程开发的 Skill。

目标链路：

```text
Calendar → Agent Session 生成报告
→ Agent 调用“报告交付 Skill/插件”
→ Skill/插件使用 Coze 托管凭证调用知行 Webhook
→ 知行验签、归档、发布
```

此方向的优点是保留现有成熟的 Calendar → Agent Session 报告流程，同时避免在 Agent Session 中暴露 Token。

### 已创建的第 1 阶段验证资源

- Vercel 项目：`phase1-webhook-test`，仅用于安全交付验证。
- 受控测试入口：`https://phase1-webhook-test.vercel.app/api/coze-delivery-test`。其当前默认拒绝所有请求；未配置有效凭证时返回 `401`。
- 本地测试接收端目录：`phase1-webhook-test/`。它只接受 POST、校验 Bearer Token、记录不含正文和密钥的交付元数据并返回 `202 Accepted`；不接入数据库、用户、通知或正式归档。
- Coze 私有 Skill 项目：`安全报告交付技能`（项目 ID：`7662775022926463002`）。扣子编程任务现已完成，并生成打包文件 `zhixing-security-report-delivery.skill`（最新已知大小 6.9 KB）；但尚未上传/发布为可安装私有 Skill，尚未挂载到实际 Calendar 报告 Agent。

### 2026-07-16：Skill 生成与安全审查结果（优先级最高）

#### 已完成的事实

- Coze 项目最近一次重构任务状态为 `done`，已完成脚本、`SKILL.md` 与打包产物生成。
- 目标地址已被固定为 `https://phase1-webhook-test.vercel.app/api/coze-delivery-test`；不应再由调用方传入任意 URL。
- Skill 设计为 POST `application/json`，并限制 `delivery_type` 为 `report` 或 `watchlist_snapshot`。
- Coze 任务声明已覆盖 2xx 成功、401/403 不重试、其他 4xx 不重试以及 429/5xx/网络异常重试等基础分支；该声明尚未完成端到端验证。
- Coze CLI 在 Windows 上发送重构指令后曾出现内部异步断言，但同一输出明确显示 `Message sent`，且后续任务状态确认为 `processing` 再到 `done`。遇到此组合时不得盲目重复发送，应先查询项目状态。

#### 安全审查不通过：必须修正后才能继续

Coze 的最终回复虽声称“凭证已配置成功”，但同时明确写出“真实 Token 统一记录在 `SECRET.md` 中”。这与知行规则直接冲突，且说明不能据此认定真正的 Coze 托管凭证变量已经配置成功。

- `SECRET.md` 不能保存、备份、展示或供管理员查阅任何 Token/API Key；此方案必须从 Skill 中删除。
- `ZHIXING_DELIVERY_TOKEN` 必须是 Coze **API Key 类型的开发者凭证变量**，由平台在实际 HTTP 调用时注入；Agent、Prompt、普通环境变量、代码、文件、日志和打包产物均不得获得真实值。
- 凭证变量的域名白名单必须仅允许 `phase1-webhook-test.vercel.app`。仅在 Coze 的凭证配置卡片/管理入口中能确认这一点后，才算凭证配置完成。
- 当前 Skill 反馈的重试间隔为 1 秒、5 秒、15 秒；必须改为 1 分钟、5 分钟、15 分钟，最多 3 次。
- 当前 Skill 将 `delivery_id` 自动生成、将 `schema_version` 默认设为 `1.0`；正式交付契约要求 Coze 显式提供这两个关键字段，应用/Skill 仅校验，不能静默补齐。
- 尚未审查实际脚本是否会记录完整报告正文、来源链接、Authorization 头或响应正文；在代码级审查和 Vercel 日志验证完成前，不得认为日志已脱敏。

#### 当前严格状态

- Vercel 接收端在缺少或错误 Token 时返回 `401`；测试凭证仅以敏感环境变量的形式保存于 Vercel Production，绝不读取、打印、写入文件或复用到其他系统。
- 用户已在 Coze 凭证卡片中人工确认 `ZHIXING_DELIVERY_TOKEN` 已保存为 API Key 开发者变量，且唯一相关域名为 `phase1-webhook-test.vercel.app`；Token 值绝不记录、读取或展示。仍须通过真实 Skill 请求验证运行时注入与 Vercel 值是否匹配。
- Skill 未发布/安装，未接入 Calendar Agent，未发送测试报告，未执行端到端联调。
- 因此当前绝不是“安全交付已打通”。

### 2026-07-16：清理后重建执行记录（优先级最高）

- 已从 Vercel Production 删除旧的 `COZE_DELIVERY_TEST_TOKEN`。旧 Token 必须视为可能暴露，禁止恢复、复用或复制；后续联调只能在新 Skill 的真实凭证变量配置卡片可核验后生成新 Token。
- Vercel 测试接收端已强化并重新部署到生产别名 `https://phase1-webhook-test.vercel.app`：授权成功后仍要求非空 `delivery_id`、`delivery_type`、`schema_version`，且类型只能是 `report` 或 `watchlist_snapshot`。本地单元验证已覆盖无效字段、非法类型、合法请求和错误 Token；生产端在无 Token 时返回 `401`。
- 旧 Coze Skill 项目（`7662775022926463002`）仅保留为问题审计记录，禁止上传、发布、安装、配置密钥或接入 Calendar Agent。未经用户对不可逆删除的单独授权，不删除该项目。
- 已创建全新独立的 Coze Skill 项目 `Zhixing Secure Delivery Clean`（项目 ID：`7663136465890738214`），并提交了附件化安全规格。Coze 声称已生成 `zhixing.skill`（8.3 KB）及 46 个 mock 测试；该代码和打包产物尚未获得独立源码审计。
- 已同步更新 `docs/product-requirements.md` 的阶段状态，并新建 `docs/coze-report-contract.md` 与 `docs/clean-skill-build-brief.md`。文档明确记录：真实 Token 只允许存在于 Coze 开发者凭证变量与 Vercel Production 环境变量，`SECRET.md` 永久禁止。

### 2026-07-16：测试凭证轮换与平台状态复核（优先级最高）

- 已轮换一次仅用于第 1 阶段的测试 Token，并仅写入 Vercel Production 的敏感变量 `COZE_DELIVERY_TEST_TOKEN`；旧测试 Token 已失效。真实值不得读取、输出、记录到文件、消息、日志或截图。
- 测试 Token 已于 2026-07-17 再次轮换；Vercel 测试接收端已重新部署到生产别名 `https://phase1-webhook-test.vercel.app`（当前部署 ID：`dpl_6ZBDm5RpMDqokGevFUfiCQfmZBwQ`）。当前 Token 的最小合法 POST 已实测返回 `202`；无凭证请求仍应返回 `401`。
- 新 Coze 项目声称生成了 `zhixing.skill`（8.3 KB）、46 个 mock 测试通过。CLI 无法读取其实际源码或打包内容，故这些仍是 Coze 自述，尚未构成独立代码审计证据。
- Coze Agent 曾声称已修改项目元数据，但 `coze code project get` 仍返回旧项目名称 `智行技能` 及“出行规划、票务查询”等旧描述。项目真实展示元数据尚未修正；不得将目录内 `.coze` 文件修改误判为平台项目元数据更新。
- 用户已于 2026-07-17 在 Coze 凭证卡片中人工确认：与 Vercel 相同的测试 Token 已保存为 `ZHIXING_DELIVERY_TOKEN` 的 API Key 开发者变量，且相关域名仅为 `phase1-webhook-test.vercel.app`。Token 值未记录、不得读取或展示。后续仍须以实际 Skill → Vercel `202` 请求验证运行时注入是否正确。

### 2026-07-17：私有 Skill 上传能力复核与架构结论（优先级最高）

- Coze Agent 多次声称已将 `zhixing.skill` 上传为 Private 个人 Skill，但未提供平台生成的 `skill_id`，仅回传了项目 ID `7663136465890738214`。本地执行 `coze.cmd code skill list -p 7663136465890738214 --my --page 1 --size 50 --format json` 持续返回 `items: []`、`total: 0`。因此**没有可安装的私有 Skill**，不得把“打包完成”或“上传提交”认定为上传成功。
- Coze Agent 已明确说明：其编程沙箱无法执行平台私有 Skill 上传，原因是上传所需 `cozeDevboxToken` 在沙箱中不可用、`coze code` CLI 不能安装，且 Coze OpenAPI 没有对应上传接口。此为当前自动化末端的已知平台能力边界；禁止反复要求该 Agent 重试上传。
- 核心目标“安全地将 Coze 报告投递到知行 Webhook”仍可实现；但具体路径“Calendar Agent → 私有交付 Skill → Webhook”目前只是**待验证假设**，不是已打通能力。它只有在用户账号的 Coze 网页端存在可用的手工导入/上传私有 Skill 入口、上传后获得真实 `skill_id` 且个人列表可见时才成立。
- 不得降级为 Calendar Agent 直接 `requests.post` 并把 Token 放入 Prompt、脚本、`SECRET.md`、普通环境变量或文件；也不得采用浏览器模拟登录网页上传。这两种做法分别破坏密钥隔离或可靠性、可审计性。
- 若网页端不存在可验证的手工私有 Skill 上传入口，正式备选架构是“知行应用（Vercel Cron）主动调用 Coze 可验证 API/Workflow，再由应用归档与发布”。是否可复用现有成熟 Calendar 报告模板、Agent 是否存在可调用 API 或是否需要迁移 Workflow，必须先向 Coze 确认，不能假设。
- 项目真实展示元数据仍可能保留旧的“出行/票务”描述；修改项目目录内 `.coze` 文件不等于修改 Coze 平台项目记录。此项应在 Coze 网页项目设置中手工修正，但不影响当前上传能力验证。

### 尚未完成，禁止误判为已打通

- 尚未获得真实私有 `skill_id`，个人 Skill 列表为空；尚未证明 Coze 网页端存在可用的手工上传入口。
- 尚未将任何 Skill 启用到测试或实际 Calendar Agent，尚未执行真实或模拟的 Calendar 交付。
- 仅 Vercel 接收端已独立验证 `202`；尚未完成真实 Skill → Vercel `202` 的端到端测试，尚未检查运行时重试、错误码和无敏感日志。
- 未完成上述验收前，仍不得接入正式报告、数据库、用户、归档、发布或通知。

后续按以下顺序继续：

1. 在 Coze 网页端查验是否存在“上传/导入私有 Skill”入口；只有上传后返回真实 `skill_id` 且个人列表出现 `zhixing` 条目，才能继续私有 Skill 路线。
2. 若第 1 步成功，先挂载到测试范围并发送不含真实报告正文的最小 JSON；不得直接接入正式 Calendar 报告。
3. 验证 Vercel 收到 `202`、没有敏感日志、重复/4xx/5xx 行为符合契约后，才允许将其接入实际 Calendar Agent。
4. 若第 1 步失败，向 Coze 确认现有 Agent 的 API 调用/Workflow 迁移能力，并在确认后设计“应用统一调度 Coze”的备选方案；不得使用明文 Token 直连作为替代。
5. 安全交付通道验证成功后，补充 `/docs/system-architecture.md`，随后才进入工程基础和数据库阶段。

### 文档同步状态

- 用户已授权处理遗留问题，已同步更新 `docs/product-requirements.md` 并新建 `docs/coze-report-contract.md` 与 `docs/clean-skill-build-brief.md`。
- `docs/system-architecture.md` 仍待安全交付通道端到端验证成功后创建；其大纲为：现状、已否决方案、推荐方案、契约字段、安全模型、重试与验证计划。

### 2026-07-19：Workflow 路径 B 候选接口（用户已确认，优先级最高）

- 用户确认：保留 Coze Workflow 的**路径 B 包装器**作为下一阶段候选接口，但它不是正式生产接口，也不代表已经接入应用。
- Coze 已用真实 `test_run` 证明路径 A（根级业务对象）不可行：平台强制返回完整 `GlobalState`，内部 `model_dump()`、Pydantic serializer、Reducer 或置空字段都无法控制实际平台响应。
- 路径 B 的真实 `test_run` 结构为：`{ response_schema_version: "1.0", result: { ... }, run_id: "..." }`。知行未来只能读取并校验 `result`；`run_id` 仅作平台追踪元数据，不得展示、入报告表、作为业务 ID/幂等键或与敏感数据同日志记录。
- `result` 成功对象已覆盖四种正式报告枚举；错误对象在真实 `test_run` 中严格只有 `schema_version`、`request_id`、`status`、`error_code`、`retryable` 五键。Coze 16 项内部测试通过，但源码仍未由本地独立读取。
- 本地执行 `coze.cmd code deploy list 7663957715756269618 --page-size 20 --format json` 返回空记录；测试 Workflow 未部署。
- 仍未验证：Coze 官方 Workflow API 的地址、认证、实际 HTTP 响应是否保持路径 B 包装器、超时/限流/错误语义；因此不得接入 Vercel、Supabase、正式报告、用户、归档、发布或通知。
- 2026-07-19 依据 Coze Workflow API 文档与官方 SDK 类型补充：官方运行 API 要求 Workflow 已发布，并需服务端 PAT；响应还会有 HTTP 传输层包装。发布测试 Workflow 与创建 PAT 都是新的外部资源/敏感凭证操作，必须在下一阶段取得用户单独确认，未确认前不得执行。
- 任何未来 API 返回与上述外层结构不同，必须停止接入、更新 `docs/coze-report-contract.md` 并重新评审；禁止让应用解析任意 `GlobalState` 或猜测字段。
- 当前正式参考文档：`docs/coze-report-contract.md`；完整修复规格与历史问题：`docs/phase1-workflow-public-output-remediation.md`。

### 2026-07-19：Coze Coding 测试服务部署与鉴权边界复核（优先级最高）

- 已在用户明确授权后，仅发布隔离测试项目 `7663957715756269618`。部署历史 ID 为 `7664067161958121498`，状态为 `Succeeded`；它不包含正式报告、用户、Supabase、归档、发布或通知集成。
- 重要纠偏：该项目是 **Coze Coding Workflow 项目**，部署产物是受 Coze 平台网关保护的 HTTP 服务，不是 Coze 原生 Workflow。因此它不会生成可用于 `POST /v1/workflow/run` 的原生 `workflow_id`，也不得再使用“原生 Workflow + workflow_id + PAT”作为本项目当前实现路线。
- 项目方只读核查说明：同步调用入口为 `POST /run`；但其关于平台网关鉴权头、凭证类型、最小权限、限流和超时的答复均为“无法确认”。不得把这类未证实说明当成接口文档。
- 已独立执行不含正文、Token 或用户数据的 HTTP 检查：部署域名的 `GET /` 和 `POST /run`（空 JSON）均返回 `401`。这证明服务没有裸露给未认证访问，**不**证明已知如何安全成功调用。
- 严禁读取、导出、打印或复用本机 Coze CLI 的登录 Token，即使 CLI 显示已登录。该 Token 不是知行的隔离服务端凭证，也不能出现在本机环境、代码、`.env`、日志、Prompt、聊天、截图或文档中。
- 后续仅允许的验证顺序：先在 Coze「部署历史」的正式 API/访问凭证页面取得可核验的认证方式与撤销路径；再在用户授权下创建可撤销、最小权限、仅面向此测试服务的专用凭证；用户直接将它写入未来隔离 Vercel 调用端的受控环境变量；最后用无真实正文的最小请求验证 `POST /run` 的成功响应。任何步骤无法证明时停止，不得猜测或绕过。
- Coze 平台运行时日志可能显示内部遥测或内部持久化初始化；这不是知行项目创建或连接外部数据库的证据，但后续若发现测试代码主动接入任何外部数据库、Webhook 或真实数据，必须立即停止并审查。
- 已同步修订 `docs/coze-report-contract.md`。此前“未部署、原生 Workflow API + PAT 待验证”的记录已被本节覆盖；路径 B 仍只是候选接口，尚未打通、尚未接入 Calendar。

### 2026-07-19：正式集成路线复核与普通 Agent 定位待办（优先级最高）

#### 当前推荐的正式方案

- 正式架构应采用“**知行应用统一调度**”：`Vercel Cron → 知行可信服务端 → Coze 已发布且具官方调用接口的 Agent 或原生 Workflow → 结构化 JSON → 知行校验、归档、发布、站内通知`。
- 用户继续在 Coze 维护报告内容、Prompt 与成熟模板；知行负责交易日判断、触发、幂等、失败重试、延迟补发、版本、归档、权限与站内通知。
- 这与旧的 `Calendar → Agent Session → 私有 Skill → 知行 Webhook` 不同：后者依赖无法验证成功的私有 Skill 上传/安装能力，且交付、重试和审计分散在 Coze 与知行两侧；当前不得继续以它作为正式方案。
- 当前已部署的 Coze Coding 测试服务仅用于验证路径 B 输出包装与平台网关，不是成熟报告 Agent 的替身，也**不是**正式报告生成入口。不得把它直接接入用户、报告归档或通知。

#### 已完成的只读确认

- 执行 `coze.cmd code project list --type agent --size 50 --format json` 返回空数组；这表明当前“知行投顾”很可能是 Coze 主站的普通 Agent，而不是 Coze Coding 的 `agent` 项目。
- `coze agent info` 命令需要普通 Agent 的真实 `project_id`；不能通过名称、Calendar Session 名称或 Coze Coding 项目列表可靠反查。
- 曾将主站会话 URL 中的 `7646841757216309530` 作为候选 ID 做只读查询，返回“无权限”；它不能被认定为普通 Agent 的项目 ID，也不得继续猜测其他 ID。
- 浏览器自动化在读取 Coze 主站页面时发生连接超时，未进行页面修改、未读取 Cookie、密码、Token 或其他敏感内容。该工具状态不是平台能力结论；后续优先使用真实 Agent 链接/ID 与只读 CLI/API 核查。

#### 当前唯一阻塞信息与后续验收

- 用户需提供“知行投顾”的 **完整 Agent/Bot 链接** 或 **Agent/Bot/项目 ID**；绝不需要、也不得提供 Token、API Key、密码或任何密钥。
- 获得 ID 后，只做只读验收，必须逐项确认：
  1. 是否存在官方、可审计的外部调用入口；
  2. 是否可保留现有成熟报告模板而不迁移；
  3. 是否能稳定返回版本化结构化 JSON；
  4. 认证方式、最小权限、限流、超时、异步结果查询与撤销路径；
  5. 最终结论为“可直接接入”“需迁移为原生 Workflow”或“当前不建议使用”。
- 在上述 5 项未完成前，不得创建/复制任何新凭证，不得将当前 CLI 的个人登录 Token 用于调用，不得接入 Vercel、Supabase、真实报告、用户、归档、发布或通知。

### 2026-07-20：Coze Coding Agent API POC 已完成首个端到端成功调用（优先级最高）

#### 已验证通过的范围

- 已创建并部署隔离的 Coze Coding Agent POC：项目 ID `7664606700401541129`，部署 ID `7664628207622029375`，部署域名为 `https://fbgyk4m8c3.coze.site`。它仅产生固定测试报告，不连接现有 Calendar、真实报告、用户、数据库、Webhook、通知或外部数据源。
- 已确认当前可用入口为 `POST /stream_run`。这是 Coze 的流式聊天接口；请求携带专用 API Token 的行为只发生在知行 Vercel 服务端，浏览器/Postman 不接触该 Token。
- 知行 POC 服务端入口为 `POST https://phase1-webhook-test.vercel.app/api/coze-agent-poc-run`。该入口额外要求 `PHASE1_ADMIN_TOKEN`；它与 Coze API Token 分离，且两者均只保存于 Vercel Production 环境变量，真实值不得读取、记录、截图或发送到聊天。
- 当前 Vercel 生产部署 ID 为 `dpl_4bFFxwWRTKQfunSvoaJbiJsELG15`，生产别名仍是 `https://phase1-webhook-test.vercel.app`。该项目同时保留旧的 `/api/coze-delivery-test`，两条 POC 路由互不替代。
- 服务端对业务输入只白名单转发 `schema_version`、`request_id`、`report_type`、`report_date`、`target_publish_at`；未知字段会丢弃且不写日志。每次 Coze 调用使用新的会话 ID，防止历史提示污染。

#### 已验证的实际 Coze SSE 包装方式

- 合法测试请求的首轮解析曾返回 `422 coze_result_not_strict_json`，不是鉴权、Token、Vercel 配置或业务字段失败。
- 通过一次性、无正文/无密钥的结构诊断确认：Coze 返回了 301 个有效 JSON SSE 事件，Agent 已调用 `validate_report_request` 工具；最终的完整业务 JSON 位于固定路径 `content.tool_response.result`，而不是普通 `answer` 文本。
- 知行解析器现仅额外读取这个明确、已验证的工具返回路径；它不递归猜测任意嵌套 JSON，也不从自然语言中提取 JSON。拿到候选对象后，仍必须通过既有的“外层和 `result` 字段完全匹配”的严格校验，才会返回成功。
- 临时结构诊断代码与其响应字段已在修复后删除；正式 POC 日志不会记录 SSE 正文、报告正文、请求头或任何凭证。

#### 成功验收证据

- Postman 使用新的 `request_id` 发起合法早盘 POC 请求，返回 `200 OK`、`accepted: true`、`kind: "success"`。
- 返回的 `response_schema_version`、`delivery_id`、`report_type`、`report_date`、`version`、标题、固定正文、市场范围、数据截至时间、生成时间和 `run_id` 均通过知行的严格校验；回显的 `request_id` 与请求一致。
- 本次实际端到端耗时约 14.36 秒；该数值仅是一次 POC 观测，不可直接作为正式生产排期依据。
- 本地回归验证命令为 `npm.cmd test`（目录：`phase1-webhook-test/`），当前 8/8 测试通过。其中包含 Coze 实际 `content.tool_response.result` SSE 包装路径的回归用例。Windows 环境中使用 `npm.cmd`，不要修改系统执行策略。

#### 当前结论与严禁误判项

- 结论：隔离 POC 已证明“知行服务端可使用专用 Coze API Token 调用已部署 Agent，并稳定取得经严格校验的固定 JSON”。此结果支持后续“应用统一调度 → Coze Agent API”的方向。
- 该成功**不代表**现有成熟 Calendar 报告 Agent 已能直接被 API 调用，也不代表真实报告模板、交易日调度、Supabase 归档、用户权限、发布、站内通知或正式 Cron 已接入。
- 当前验证使用的是 `/stream_run` 流式接口，不是已验证的异步归档型接口。`/async_run` 的实际可用性、提交/轮询语义、限流、超时和取消方式仍未验证；在确认前，禁止把 `/stream_run` 作为正式归档报告的生产通道。
- 此 POC 尚未证明重复 `request_id` 的平台级幂等语义；当前服务端每次使用新会话，正式幂等必须以后续知行数据库任务锁和唯一约束实现，不能依赖该 POC Agent 记忆。
- 曾出现在聊天中的任何 Coze API Token 都必须视为已暴露，不得复用；后续只允许由用户在受控平台页面轮换并写入 Vercel 环境变量，Codex 不得请求或读取其真实值。

#### 第 1 阶段剩余验收顺序

1. 用同一入口测试缺少 `request_id`、非法 `report_type`、非法日期，确认只返回约定的无敏感业务错误；
2. 测试重复 `request_id` 的实际行为，并记录“平台返回”与“正式应用应保证的幂等”之间的差异；
3. 连续执行至少 3 次合法请求，记录成功率、字段稳定性和耗时；
4. 测试超时/限流或确认平台可核验的相关行为；
5. 审查 Vercel 日志，确认其中没有 API Token、Authorization、完整 SSE 正文、Prompt 或用户数据；
6. 完成以上测试后，更新 `docs/coze-report-contract.md` 和 `docs/phase1-coze-agent-api-poc-spec.md`，记录真实 `/stream_run` 包装路径、已验证范围与未验证边界，再决定是否进入正式报告 Agent 的迁移/复用评估。

### 2026-07-21：Agent API POC 流式验收与文档同步（优先级最高）

#### 本轮新增通过项

- T3 已通过：缺少 `request_id` 时，当前部署 Agent 交付严格五键错误对象，`request_id` 为保留键且值为空字符串 `""`，错误码为 `MISSING_REQUIRED_FIELD`。这是已实测平台行为；不得再将 `null` 作为当前 POC 的验收预期。
- T4、T5 已通过：非法 `report_type` 返回 `INVALID_REPORT_TYPE`；非法日期返回 `INVALID_REPORT_DATE`；均为 `200` + `kind: validation_error`，且不泄露内部信息。
- T6 已通过：同一 `request_id` 首次调用成功，后续调用返回严格 `DUPLICATE_REQUEST`。知行适配器已新增这一**唯一且严格**的合法运行时错误分支；正式幂等仍必须由数据库任务锁和唯一约束实现，不能依赖 Coze。
- T7 已通过：三次不同 `request_id` 的合法调用均返回 `200 success`，回显 ID 正确、无串号；耗时为 13.34 秒、12.45 秒、13.54 秒。该样本量不足以推导正式报告 P95 或容量。
- T8 部分通过：官方文档确认 `POST /async_run`、`/task/{task_id}`、最长 24 小时 `deadline`、约 1 小时空闲实例回收、重新部署终止运行中异步任务及长时间 `pending` 的处理建议。未找到当前可核验的限流、并发或取消语义；未对异步路径做项目实测，也未做高频压测。
- T9 样本通过：对最新 Vercel 部署最多 100 条范围内实际返回的 4 条 JSON 日志进行不输出原文的扫描，未命中 Token、Authorization、Prompt、Cookie、API Key、`content_html`、`summary_points` 或 `source_links`。这是当前样本审查，不是长期日志安全保证。

#### 本轮修复与安全结论

- 曾为定位 T3 临时部署仅输出事件数、候选键名和布尔匹配结果的安全诊断；根因确认后已完全删除。回归检查未发现 `describeSseResultShape`、`candidate_key_sets` 或 `error_candidate_comparisons` 残留。
- 当前 Vercel 最新生产部署 ID 为 `dpl_GEgLbuVee36JY2GqucLSvo5tcLKd`，别名仍为 `https://phase1-webhook-test.vercel.app`。它仍是隔离 POC，不是正式应用。
- 本地 POC 回归命令 `npm.cmd test` 当前 10/10 通过；Windows 环境继续使用 `npm.cmd`，不要修改执行策略。
- 当前 POC 解析器只接受已验证的 `content.tool_response.result` 路径和严格对象；没有启用自然语言 JSON 提取或递归猜测。

#### 已同步文档

- `docs/phase1-coze-agent-api-t8-research.md`：记录官方异步行为与未验证项。
- `docs/phase1-coze-agent-api-poc-spec.md`：从“待创建/异步假设”更新为实际流式 POC 范围、T1–T9 结果和异步待办。
- `docs/coze-report-contract.md`：替换旧 Workflow `/run` 候选路线，记录当前 Agent `/stream_run` 真实包装、错误语义、通过项与正式门槛。
- `docs/product-requirements.md` 与 `phase1-webhook-test/README.md`：移除“私有 Skill 为当前路线”的过期状态，明确当前仅为隔离 Agent API POC。

#### 下一步（不得跳过）

1. 不将当前 `/stream_run` POC 升级为正式归档通道。
2. 在固定测试内容、隔离环境下设计并实测 `/async_run + /task/{task_id}`，验证提交、轮询、`pending`、`deadline`、重部署中断与错误语义；不进行无目的高频压测。
3. 用户提供成熟“知行投顾”的完整 Agent/Bot 链接或项目 ID 后，仅做只读兼容性评估：官方调用入口、模板复用、结构化 JSON、认证/撤销、限流/超时、异步能力。
4. 仅在异步路线与成熟 Agent 兼容性明确后，才决定是否创建正式 Next.js/GitHub/Supabase 工程。

### 2026-07-21：Agent API 流式 POC 验收收口与暂停检查点（优先级最高）

本节是在用户要求“先记录当前成果、回头再继续”时写入的暂停快照。下次继续本项目时，应先阅读本节及 `docs/coze-report-contract.md`、`docs/phase1-coze-agent-api-poc-spec.md`，不得从旧的私有 Skill 或 Calendar 主动回调路线恢复开发。

#### 本轮最终验收结果

- 流式 POC 连续三次合法调用均返回 `200 OK` 和 `accepted: true`、`kind: "success"`；三个不同 `request_id` 均原样回显，未发现会话串扰。三次观察耗时依次为约 13.34 秒、12.45 秒、13.54 秒。
- 缺少 `request_id`、非法报告类型、非法日期及重复请求均已返回约定的、无敏感信息的结构化业务错误。重复请求首次成功、再次请求返回严格的 `DUPLICATE_REQUEST`；这只证明当前 POC Agent 行为，正式系统仍必须由数据库任务锁和唯一约束实现幂等。
- 本地验证已重新执行：`phase1-webhook-test/` 内的 `npm.cmd test` 为 10/10 通过；`lib/coze-agent-poc.js` 和 `api/coze-agent-poc-run.js` 的 Node 语法检查通过。
- 对最新 POC 部署的可获取 Vercel 日志做过不输出原文的样本扫描，未命中 Token、Authorization、Prompt、Cookie、API Key、报告正文或来源字段。该结果仅是样本审查，不能替代长期日志脱敏规则和正式安全审计。

#### 已得到的结论与严格边界

- 已证明：知行的受控 Vercel 服务端可使用独立的 Coze API 凭证调用隔离 Agent，并从已验证的 SSE 路径 `content.tool_response.result` 取得严格校验后的固定 JSON。浏览器与 Postman 不接触 Coze API 凭证。
- 未证明：现有成熟“知行投顾”报告 Agent 可被 API 直接调用；真实报告模板可返回该契约；异步 API 可实际提交和轮询；交易日调度、Supabase 归档、用户权限、发布、站内通知、正式重试或幂等已就绪。
- 当前 `POST /stream_run` 只可作为隔离 POC，不得直接升级为正式报告归档通道。正式长任务方案仍以应用统一调度和可验证的异步调用为目标。
- 任何曾出现在聊天、截图或其他非受控位置的 API Token 都必须视为已暴露，不得读取、打印、复用或写入文档；只能由用户在受控平台自行轮换并保存为 Vercel 敏感环境变量。

#### 资料与现状

- Coze Coding Agent POC：项目 ID `7664606700401541129`；已部署域名为 `https://fbgyk4m8c3.coze.site`；当前仅使用已验证的 `POST /stream_run`。
- 知行 Vercel POC：`https://phase1-webhook-test.vercel.app/api/coze-agent-poc-run`；最新已知部署 ID 为 `dpl_GEgLbuVee36JY2GqucLSvo5tcLKd`。它仅包含固定测试内容，不连接真实 Calendar、报告、用户、数据库、归档、发布或通知。
- 官方资料调研已记录 `POST /async_run`、`/task/{task_id}`、最长 24 小时、实例闲置回收和重新部署中断异步任务等结论；当前仍未对异步路径做项目实测，也未验证限流、并发或取消语义。

#### 暂停后的唯一推荐续办顺序

1. 在现有隔离 POC 中实现并实测 `/async_run → task_id → /task/{task_id}`，只使用固定测试数据；验证提交、轮询、`pending`、`deadline`、错误语义和重新部署中断边界，不进行无目的高频压测。
2. 用户提供成熟“知行投顾” Agent/Bot 的完整链接或项目 ID 后，仅做只读兼容性评估；不得索取或使用 Token。
3. 仅当异步链路和成熟 Agent 的正式调用能力均明确后，才评估并创建正式 Next.js、GitHub、Supabase 工程，并进入后续数据库、权限与产品开发阶段。
### 2026-07-21：Coze Agent API 异步 POC 最终结论（优先级最高）

- 隔离 Vercel POC 已新增并部署两个管理员手工测试入口：`POST /api/coze-agent-poc-async-run` 与 `POST /api/coze-agent-poc-async-status`。二者均只使用 Vercel Production 的服务端环境变量和 `PHASE1_ADMIN_TOKEN`，不连接 Cron、Calendar、Supabase、用户、真实报告、归档、发布或通知。
- 真实端到端测试已确认：`/async_run` 可创建任务并返回 `task_id`、`pending`、`created_at`、`deadline`；`/task/{task_id}` 可查询任务状态。状态适配器严格校验已观察到的十字段任务外壳，只返回任务元数据、`has_error`、`has_result` 和受限格式 `error_code`，从不返回 Coze `error.message`、`result` 正文、Prompt、原始 JSON 或 Token。
- 无凭证访问两个异步入口均返回 `401`；本地回归命令为 `npm.cmd test`（目录 `phase1-webhook-test/`），当前 18/18 通过。最新异步 POC Vercel Production 部署为 `dpl_6j4XGjR1bUxxQkwvijhBS8VStBq1`，别名仍为 `https://phase1-webhook-test.vercel.app`。
- 已用至少两个不同 `request_id` / `task_id` 复测。提交均为 `200 pending`，状态查询均为 `200`，但不同 Coze 任务最终一致为 `status: failed`、`has_error: true`、`has_result: false`、`error_code: NotImplementedError`。因此根因是当前隔离 Coze Coding Agent 的异步任务执行路径未实现或不兼容；不是 Postman、Vercel、鉴权、请求 JSON 或应用适配器问题。
- 结论：**当前 Agent 的 `/async_run` 禁止作为知行正式报告通道**。不得继续无目的重试、压测或接入真实报告。仅当 Coze 侧确认并修复该 `NotImplementedError` 后，才允许重新以隔离测试任务复验。
- 已验证的 `/stream_run` 固定 POC 仍仅是候选机制，不能直接升级为正式归档通道。若后续选择它，必须先单独设计应用侧超时、任务状态、重试、幂等、真实报告契约和长期运行可靠性；或改用经 Coze 证实可工作的 API/Workflow 异步能力。

### 2026-07-22：正式 Coze 报告内容标准与暂停恢复点（优先级最高）

#### 本轮完成的成果

- 用户确认应先回到第 1 阶段的内容与交付契约确认，不因当前缺少成熟 Coze 报告 Agent 而直接创建正式应用工程。
- 当前不存在成熟的“知行投顾”Coze 报告 Agent。现有 Coze Coding Agent 仅是固定测试内容的隔离 API POC，不能被误认为真实报告 Agent，也不应接入真实报告、用户、数据库、发布或通知。
- 已新建 `docs/coze-report-output-standard.md`（v0.1）。该文档与 `docs/coze-report-contract.md` 分工：前者定义内容质量、报告结构和业务字段语义；后者保留 API 外层包装、调用、安全和错误契约。

#### 内容标准已固化的要求

- 覆盖早盘扫描、每日复盘、节假日资讯摘要、产业研究，以及独立的核心关注标的池快照。
- 早盘扫描覆盖美股、期货等外围信息，并说明与 A 股开盘的关联；每日复盘仅以 A 股为主体；节假日摘要只筛选连续休市最后一天前的高价值事项；产业研究必须含申万一级行业、证据、反例/风险与跟踪指标。
- 每份报告必须带报告日期、版本号、数据截至时间、生成时间、3～5 条摘要、完整 HTML 正文、真实来源和固定风险提示“仅供信息参考，不构成投资建议”。
- 禁止虚构来源、收益承诺、个性化交易指令、将标的池称为“荐股池/推荐池”、泄露 Token、Prompt 或个人数据。
- 标的池由 Coze 独立交付完整快照，且仅包含 A 股。Coze 只标识 `active` 或首次 `removed`；应用负责通过相邻快照推导 `new` 和 `ongoing`，以避免历史状态不一致。移出项必须提供 `removal_reason`。
- 首轮样例包必须含四类完整报告、一个至少含 3 个测试标的的标的池快照、每类输入/生成失败的安全错误样例，以及报告栏目到字段的映射说明。

#### 当前阶段与下一步

1. 用户将 `docs/coze-report-output-standard.md` 与 Coze 讨论，先确认内容模板、口径、来源和样例是否可稳定生成；此阶段不要求 Coze 接入 API、Token、Cron、用户数据或数据库。
2. Coze 提交首轮样例包后，知行先做内容验收：报告结构、时效、来源、风险提示、标的池字段与版本语义。
3. 内容样例通过后，再将样例映射到 `docs/coze-report-contract.md`，确认真实 Agent 的输入、严格 JSON、错误对象和 API 调用能力。
4. 只有成熟 Agent 的正式调用能力与长期运行路线明确后，才评估正式 Next.js、GitHub、Supabase 工程；当前禁止提前接入正式数据、用户、归档、发布、通知或 Vercel Cron。

#### 继续时的注意事项

- 当前 `/async_run` 在隔离 POC 中稳定返回 `NotImplementedError`，不得继续无目的重试，也不得用作正式报告通道。
- 已验证的 `/stream_run` 只证明固定内容 POC 可用；在真实报告契约、超时、重试、任务状态和幂等方案完成独立设计与验收前，不得升级为正式归档通道。
- 不得索取、读取、粘贴、记录或复用任何 Token。聊天、截图等非受控位置出现过的 Token 一律视为已暴露，后续只能由用户在受控平台页面轮换。
- 后续恢复本项目时，先阅读本节、`docs/coze-report-output-standard.md` 和 `docs/coze-report-contract.md`，再开始任何 Coze 或应用侧动作。

### 2026-07-23：多报告 Coze Agent 创建启动（优先级最高）

#### 已完成

- 用户已审阅并确认 `docs/coze-market-research-agent-build-plan.md` 中的搭建方案：单一多报告、非个人化的“知行市场研究 Agent”；六个拟验证日程为早盘 08:30、午间 12:00、每日复盘 17:30、行业跟踪 20:00、连续休市最后一天节假日摘要 20:00、月末最后交易日 20:30（均为 `Asia/Shanghai`）。产业深度研究为按需 `industry_research`，不单列日程。
- 已将新增 `midday_review`、`industry_tracking`、`month_end_review` 同步进 `docs/coze-report-output-standard.md` 和 `docs/coze-report-contract.md`。内容标准现要求：HTML 校验后使用 Playwright + Chromium 导出 PDF、午间/月末判断验证可追溯、所有新报告类型严格失败关闭；技术契约同时纠正了当前 POC `/async_run` 最终 `NotImplementedError` 的事实。
- 已通过 Coze CLI 创建一个**未部署**的 Coze Coding `agent` 项目：项目 ID `7665732280798920731`，项目链接 `https://code.coze.cn/p/7665732280798920731`。创建时已明确禁止创建 API Token、部署、真实 Calendar、用户/持仓/交易/通知/数据库/正式交付；没有读取、写入或记录任何密钥。

#### 当前状态与下一步

- 创建后的首次 Coze 开发任务当前状态为 `processing`（查询时间 2026-07-23）；这不是完成验收，也不代表已部署、已创建 Calendar 或已生成真实报告。
- 下一次继续时，先只读执行 `coze.cmd code message status -p 7665732280798920731 --format json`。状态为 `done` 后，读取其回答并按计划核验：可用 Skill、A 股交易日历、持久化判断台账、Calendar/并发、Playwright/Chromium、六类 HTML/PDF 草稿和安全边界。
- 在上述能力核验和样例内容验收通过前，禁止部署、禁止创建真实运行日程、禁止接入正式知行应用、Vercel、Supabase、用户、归档、发布或通知。

#### 2026-07-23 暂停记录：初始化对话错误

- 用户在 Coze 项目界面看到“对话错误，初始化失败”。按用户要求，本轮**不诊断、不修复、不重试**该问题。
- 已知项目资源仍是已创建但未部署的 Coze Coding `agent` 项目 `7665732280798920731`；初始化失败不应被误读为项目、日程、Skill、PDF、API 或任何正式交付能力已完成。
- 下次恢复时先确认用户仍希望处理该问题，然后只做只读检查：`coze.cmd code message status -p 7665732280798920731 --format json`，必要时读取项目消息历史与平台错误信息。确认根因和修复范围后，再请求用户授权进行任何 Coze 侧修改或重试。
- 继续有效的禁止项：不部署、不创建真实 Calendar、不创建/粘贴/读取 Token，不接入正式应用、Vercel、Supabase、用户、归档、发布或通知。

### 2026-07-27：本地客户端入口核验与正式报告 Agent 重建启动（优先级最高）

#### 已确认的入口与根因边界

- 本地 Coze 客户端的侧边栏明确区分“新建 Agent”（普通对话 Agent）与“项目 → 新建编程项目”。前者不能替代知行未来需要的可部署 API 内容服务。
- 本地客户端的“新编程项目”页面当前只直接展示网页应用、移动应用、小程序和 Skill 模板，未展示可选择的 `agent` 项目类型。不得为了绕过这一限制把正式报告服务误建为网页应用。
- 因此，本轮改由本机已经登录的 Coze CLI 创建 `--type agent` 项目；它使用与本地客户端相同的 Coze 账号，后续可在客户端项目列表中查看。网页端“对话错误，初始化失败”的具体平台根因尚未获得可复现错误码，不能声称已在源码层定位；但之前创建入口/项目形态不匹配和泛化模板错误均已被隔离，不再复用。

#### 已完成

- 已创建新的、未部署的 Coze Coding `agent` 项目：`知行市场研究报告 Agent`，项目 ID `7667217475204841523`，项目链接 `https://code.coze.cn/p/7667217475204841523`。
- 创建说明已明确锁定：仅建立非个人化市场研究报告服务与代码/配置骨架；只允许 `morning_scan`、`midday_review`、`daily_review`、`industry_tracking`、`holiday_digest`、`month_end_review`、`industry_research` 七种报告类型；未知类型失败关闭；必须使用严格 JSON、受控 HTML、HTML + Playwright/Chromium 的 PDF 设计、可审计来源与数据截至时间。
- 创建说明已明确禁止：部署、API Token、Calendar/真实日程、用户/持仓/交易/账户数据、外部 Webhook、数据库、`SECRET.md`、个性化荐股/买卖指令、收益承诺和编造事实。
- 2026-07-27 首次只读状态查询为 `processing`（session ID `66294988836610`）。这只表示 Coze 正在生成初始项目，尚未构成能力验收。

#### 2026-07-27 首轮结果与规格文档同步

- 首轮初始化后来返回 `done`，但验收**不通过**：Coze 自行改用“行业关键词 → 联网搜索 → SWOT → Markdown”的泛化行业研究默认方案，并声称只支持 `industry_research`、`company_research`、`market_trend`、`competitive_analysis`、`macro_research` 等类型。这与知行七类报告、严格 JSON、HTML→PDF、非个人化市场研究和应用统一调度的要求相冲突；不得部署、使用或对外称为知行正式 Agent。
- 两份关键规格文件已作为同一 Coze Coding 项目消息附件同步：`docs/coze-market-research-agent-build-plan.md` 与 `docs/coze-report-output-standard.md`。修正指令明确要求两份附件为最高优先级、替换泛化默认方案、仅保留七种受控 `report_type`、严格 JSON/HTML/PDF/失败关闭及全部既有安全禁止项。
- 附件消息已收到 Coze 确认回执 `status: sent`，随后只读查询显示项目重新进入 `processing`。CLI 在回执之后打印的 Windows `UV_HANDLE_CLOSING` 断言不等同于发送失败；在已获得 `status: sent` 时不得重复发送，后续仅查询状态。

### 2026-07-28：正式 Agent 首轮重构验收失败与数据能力审计（优先级最高）

#### 已核验事实

- 项目 `7667217475204841523` 的规格重构任务已到 `done`，但 Coze 自己的测试记录明确承认：没有先调用交易日校验、没有调用搜索工具取得真实数据、会编造市场数据、会输出仓位/操作建议、会输出 Markdown 而非 HTML、甚至会在单一请求中生成多份报告。因此该任务不能标记为“重构完成”或用于部署。
- 通过只读 `coze.cmd code skill list -p 7667217475204841523 --format json` 复核，项目当前可见/已挂载的只有通用内建能力（包括“联网搜索”“文档生成”等），没有文档第 6 节列出的券商、行情、期货、宏观或调研金融数据 Skill；`coze.cmd code skill list --my` 返回空列表。
- 因而目前不能得出“某个金融数据 Skill 调用失败”的结论。更准确的结论是：**这些 Skill 目前未出现在该 Coze Coding 项目的可用/已挂载清单中，尚未安装、授权或实测。** 文档本身已要求对每个 Skill 单独核验，禁止因交接文档列出就假设可用。

#### 根因与禁止的错误修复

- 根因一：数据采集被实现为模型可选择调用的自写工具，而不是有真实数据适配器、强制执行和来源回执的确定性流程；调整系统提示词或单纯换模型不能构成可靠修复。
- 根因二：模型输出没有在服务端经过 JSON Schema、HTML 白名单、禁止语句、来源完整性、单报告和交易日/台账前置条件校验；测试失败后仍被错误称为完成。
- 禁止将当前“联网搜索”或模型生成内容伪装为已验证的券商/行情数据；禁止以搜索不足或工具缺失时继续编造报告；禁止先部署再补救。

#### 推荐修复顺序（待用户选择真实数据来源路线）

1. 先建立数据能力矩阵：逐项记录目标数据、所需来源、候选 Skill/API、是否在 Coze Coding 可挂载、认证方式、一次真实调用的结果、许可与降级策略。
2. 将 Agent 改成确定性编排：请求校验 → A 股交易日历适配器 → 明确调用数据适配器 → 保存来源/数据时间 → LLM 仅根据已收集证据生成受控 HTML → 服务端 JSON/合规/单报告校验 → 可选 Playwright/Chromium PDF。任何前置步骤失败均返回结构化错误，不调用生成模型补写事实。
3. 数据来源若选择 Coze Marketplace/低代码 Skill，须先由用户确认可安装的具体 Skill 和授权；若选择正式外部数据 API，须由用户在受控环境配置授权，Agent 代码只读取环境变量，不得接触明文。没有明确数据源前，只允许做固定样例/错误路径测试，不得生成伪实时市场报告。

#### 下一步与门槛

1. 只读查询 `coze.cmd code message status -p 7667217475204841523 --format json`，等状态为 `done` 后读取首轮实现说明；不得自动部署。
2. 首轮验收必须逐项确认项目真实类型为 `agent`，没有泛化 `company_research` / `market_trend` 等额外类型，没有个人化数据或日程/Token/数据库副作用，并检查七类请求的严格 JSON、错误对象、HTML→PDF 方案与来源不足时失败语义。
3. 只有 Agent 内容与输出样例验收通过后，才讨论数据源 Skill、A 股交易日历、跨日报告验证、API 部署和隔离调用测试；仍不得接入正式知行应用、Vercel、Supabase、用户、归档、发布或通知。

### 2026-07-28：正式报告生产路线切换（优先级最高）

#### 决策与依据

- 用户确认：先归档本次失败的 Coze 尝试并同步现有文档，再讨论新的实现；本轮不部署、不创建日程、不接真实数据，也不继续修改或测试 Coze 项目。
- 基于同日验收失败的事实，Coze Agent、Calendar、Skill 与已部署 POC 不再是知行的正式报告生产路线。它们仅保留为问题审计证据，未经新的独立决策不得删除、恢复、部署或接入应用。
- 正式候选路线调整为：**由 Codex 协助开发“知行报告引擎”，由 Vercel Cron 或同等可信云端运行时触发**。Codex 桌面客户端只用于开发、测试和维护，不能充当生产环境的每日定时器。

#### 已同步文档

- 新建 `docs/report-engine-architecture.md`：定义迁移原因、目标架构、不可突破的非个人化研究边界、数据能力矩阵、失败关闭语义与分段验收。
- 更新 `docs/product-requirements.md`：正式状态改为 Coze 路线已归档，明确下一步是无真实数据的报告引擎固定样例原型。
- 更新 `docs/coze-report-output-standard.md`：保留内容质量、字段和格式标准，但生成责任改为报告引擎，不再依赖 Coze 的 API、SSE 或异步路径。
- 更新 `docs/coze-report-contract.md` 与 `docs/coze-market-research-agent-build-plan.md`：均标记为历史归档，仅用于追溯失败 POC。

#### 当前后续门槛

1. 先在本地实现不连外网、无密钥的固定样例报告引擎骨架；首个 `morning_scan` 切片已完成，后续逐类扩展其余六种报告类型，并持续验证严格 JSON、受控 HTML、违规表述和来源不足的失败路径。
2. 用户确认真实数据供应商与模型供应商后，再单独验证交易日历、行情、公告/新闻和行业研究的授权、字段、时效、来源展示与失败语义。
3. 只有数据能力验证通过后，才能讨论 Vercel 调度、Supabase 归档、PDF 存储、发布和站内通知；不得用模型猜测替代缺失的数据。

### 2026-07-28：离线报告引擎首个切片完成（优先级最高）

- 已新建独立目录 `report-engine/`，与历史 `phase1-webhook-test/` 完全隔离；它不联网、不读取环境变量、不含 Token、不调用模型、Coze、Vercel、Supabase 或真实数据源。
- 已实现并验收 `morning_scan` 的固定证据输入 → 单份结构化报告 → 受控 HTML 输出。初版包含标题、日期、版本、数据截至时间、来源链接和固定风险提示。
- 已实现失败关闭：未实现报告类型返回 `UNSUPPORTED_REPORT_TYPE`；日期非法返回 `INVALID_REPORT_DATE`；来源为空返回 `SOURCE_EVIDENCE_INSUFFICIENT`；草稿含“建议买入/建议卖出/满仓/保证收益”返回 `COMPLIANCE_VIOLATION`。
- PDF 当前只定义接口边界，未配置 Chromium 时确定返回 `PDF_RENDERER_UNAVAILABLE`；没有生成或伪造 PDF。
- 使用 TypeScript 与 Node 内置测试框架按测试先行完成验证。`report-engine/` 内执行 `npm.cmd test` 当前结果为 6/6 通过；其中确认过实现前的预期失败，再写入最小实现。
- 新增计划文档 `docs/superpowers/plans/2026-07-28-report-engine-fixture-prototype.md`，全部步骤已标记完成；`docs/report-engine-architecture.md` 已同步当前原型范围。

#### 下一步门槛

1. 继续离线阶段时，优先补齐其余六种报告类型的固定夹具与逐类测试；仍不接真实数据或模型。
2. 在用户确认模型供应商与真实数据供应商前，禁止把此原型用于任何市场结论、定时运行、HTML 实际 PDF 导出或用户展示。

#### 当前暂停点与恢复方式

- 当前工作已停在“离线固定样例原型完成、尚未扩展其余报告类型”的位置；没有未完成的部署、Coze 操作、数据源调用或密钥配置。
- 下次恢复时，先阅读本节、`docs/report-engine-architecture.md` 与 `docs/superpowers/plans/2026-07-28-report-engine-fixture-prototype.md`；再在 `report-engine/` 执行 `npm.cmd test`，应看到 6/6 通过。
- 后续优先级：先为 `midday_review`、`daily_review`、`industry_tracking`、`holiday_digest`、`month_end_review`、`industry_research` 增加固定夹具、成功样例和失败样例；每增加一种类型都必须先写失败测试，再扩展实现。
- 禁止将 `dist/` 的编译产物、`node_modules/`、测试夹具或当前固定样例误认为真实市场报告；它们仅用于工程验证。

### 2026-07-28：离线报告引擎契约加固完成（优先级最高）

- 已为 `morning_scan` 固定样例补齐运行时输入校验：入口接受 `unknown`，仅允许当前实现的报告类型；`reportDate` 必须是实际存在的 `YYYY-MM-DD` 日期；每条来源证据必须具备非空标题、无凭证的 HTTPS 链接和带时区、可解析的 ISO-8601 时间。
- 已实现最终输出契约校验：报告类型、日期、标题、精确版本 `v1.0`、数据截至时间、来源和正文均不合格时失败关闭；`GenerateError` 当前包含 `INVALID_REQUEST`、`UNSUPPORTED_REPORT_TYPE`、`INVALID_REPORT_DATE`、`SOURCE_EVIDENCE_INSUFFICIENT`、`COMPLIANCE_VIOLATION`、`UNSAFE_HTML` 与 `OUTPUT_CONTRACT_VIOLATION`。
- 已实现 HTML 拒绝策略并在生成前和输出契约中双重执行：仅允许 `article`、`h1`、`h2`、`p`、`ul`、`ol`、`li`、`strong`、`em` 和仅含 HTTPS `href` 的 `a`；危险标签、属性、非 HTTPS 链接、畸形/未闭合结构和违规交易表述都会失败关闭，不做静默清洗或修复。
- 已执行 `report-engine/` 下的 `npm.cmd test`，结果为 21/21 通过；测试覆盖合法与不真实日期、来源完整性、禁止报告类型、合规短语、HTML 安全与结构、成功输出契约、危险输出 HTML 和未配置 PDF 渲染器。
- 本轮仍未接入真实交易日历、真实数据源、模型、网络、环境变量、Coze、Vercel、Supabase、PDF 导出、日程、用户、归档、发布或通知。当前“日期存在性”只是公历格式校验，不能等同于 A 股交易日校验。
- 后续离线优先级：逐类为 `midday_review`、`daily_review`、`industry_tracking`、`holiday_digest`、`month_end_review`、`industry_research` 增加固定夹具、成功样例与失败测试；每类都必须先测试，再扩展实现，并继续保持无真实数据和失败关闭边界。

### 2026-07-29：午间复盘离线切片完成（优先级最高）

- 本地报告引擎的固定样例现支持 `morning_scan` 与 `midday_review`。午间复盘只能消费调用方内联传入的结构化 `priorAssessments`，不会读取文件、历史运行结果或任何外部服务。
- 午间判断验证要求至少有一条同日 `morning_scan` 和一条此前 `daily_review`；每条记录包含原判断、验证状态和结构化来源证据。当前仅校验证据的标题、无凭证 HTTPS URL 与带时区 ISO 时间字段，不校验 URL 可达性、来源真实性或真实市场数据。记录为空、引用日期或类型错误、状态非法、原判断为空，或除“未验证”外缺少证据时，统一失败关闭并返回 `PRIOR_ASSESSMENT_INSUFFICIENT`。
- HTML 白名单新增无属性表格结构标签 `table`、`thead`、`tbody`、`tr`、`th`、`td`；除 `a[href]` 外拒绝所有属性。动态判断文本会转义；统一内容合规同时拒绝个性化持仓/交易/盈亏语境、直接加仓减仓清仓指令、收益承诺和既有违规交易表述。数值字符实体（十进制、十六进制、带或不带分号）按浏览器一次解析语义纳入检查，`&amp;#...;` 不会二次解码。
- `validateGeneratedReport` 会对午间 `priorAssessments.originalJudgement` 执行同一内容合规校验，避免直接输出契约校验绕过；结构化记录校验和内容校验均须通过。
- 已在 `report-engine/` 执行最终本地回归，结果为 **54/54 通过**。边界扫描未发现 `fetch(`、`process.env`、`coze`、`supabase`、`vercel`、`playwright` 或 `puppeteer` 在引擎源码、测试及包配置中的引用。
- 尚未实现的报告类型：`daily_review`、`industry_tracking`、`holiday_digest`、`month_end_review`、`industry_research`；尚未实现的独立能力：`watchlist_snapshot`、正式 PDF 导出。真实交易日历、真实数据源、模型、网络、环境变量、Coze、Vercel、Supabase、云端调度、用户、归档、发布和通知仍全部未接入；不得将固定夹具视作真实市场报告或生产能力。

## 19. StarWork 协作补充规则

### 恢复上下文

需要使用多 AI 协作时，先读取：

1. `AGENTS.md`
2. `_system/context/current-projects.md`
3. `_system/tasks/todo.md`
4. `.starwork/rules/index.md`（如存在）

如上述内容与 `AGENTS.md` 冲突，以 `AGENTS.md` 为准。

### 文件职责与写入边界

- `docs/`：已确认的正式设计、架构与规范。
- `.superpowers/sdd/`：实现过程中的设计、计划、审计与中间产物。
- `.starwork/drafts/`：待审阅的协作草稿，不得自动提升为正式规则。
- `.starwork/handoff/`：AI 岗位之间的任务交接记录，不存放密钥、真实用户数据或业务源代码。
- 未经用户确认，不新增顶层业务目录，不修改稳定偏好、身份信息或正式规范。

### 多 AI 岗位启用规则

- 对包含两个及以上可独立验收子任务的工作，主协作者默认主动拆分并分配给规格、开发、质量、安全或协调岗位，避免把全部调查、实现和复核堆在主对话中。
- 主协作者负责明确每个岗位的输入、写入范围、验收标准和交接方式，并负责解决冲突、汇总结论和向用户交付；不得把关键决策责任转交给岗位 Agent。
- 岗位只处理边界清晰、可独立验收的子任务；涉及架构、数据模型、权限、密钥、真实数据、调度或发布时，必须由主协作者汇总并取得用户确认。
- 每个岗位交接时必须写明：输入、产出文件、验证结果、未解决风险和下一步建议。
- 不得让不同岗位同时修改同一业务文件；发生重叠时先由主协作者拆分或串行处理。
- 小型、单文件或强串行任务若拆分成本明显高于收益，可以由主协作者直接处理，但应在进度说明中简要说明原因。

### 草稿升级

将 `.starwork/drafts/` 内容写入 `AGENTS.md` 或 `docs/` 前，必须先向用户展示差异并获得确认。
