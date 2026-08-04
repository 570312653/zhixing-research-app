# 知行：Coze 编程 Agent API 最小验证规格（Phase 1 POC）

> 状态：隔离 Agent 已部署；`/stream_run` 端到端严格 JSON 验证已完成，`/async_run` 尚未项目实测。  
> 最后更新：2026-07-21  
> 范围：仅验证“可部署、可鉴权、可返回稳定 JSON”的 Agent API；不接入真实报告生产。

## 1. 背景与决策

原计划 `Calendar → Agent Session → 私有 Skill → 知行 Webhook` 无法获得真实可安装的私有 Skill，不能作为正式交付方案。

知行采用“应用统一调度”的目标架构：

```text
Vercel Cron
  → 知行可信服务端
  → Coze 已部署 Agent API
  → 严格 JSON 校验
  → （后续）Supabase 归档、发布和站内通知
```

本 POC 不证明正式报告已经迁移。它仅验证 Coze 编程 Agent 能否成为上图中的“内容生成 API”。

## 2. 严格范围

### 2.1 本 POC 必须做

- 创建一个**全新、隔离**的 Coze 编程 `agent` 项目。
- 将该 Agent 部署为 API 服务，并记录平台生成的项目 ID、部署历史 ID、API 域名和可撤销凭证的配置入口；不得记录真实 Token。
- 接收一个早盘扫描测试请求，通过实际可用的部署入口返回固定、可验证的 JSON 结果。
- 对缺失字段、非法枚举、非法日期和重复 `request_id` 给出明确、无敏感信息的响应。
- 证明没有凭证的请求会被平台或服务拒绝。

### 2.2 本 POC 明确不做

- 不修改、迁移、停用或触发现有的 Calendar Agent、成熟报告模板、现有 Skill 或现有定时任务。
- 不生成真实股票报告，不抓取行情、新闻或研报，不调用联网搜索、浏览器、第三方数据源、Webhook 或邮件。
- 不创建或连接知行的 Supabase、Vercel、GitHub、用户、订阅、通知、PDF 或标的池。
- 不接收用户邮箱、身份、订阅、持仓、行为或其他个人数据。
- 不向任意外部地址发起 HTTP 请求。
- 不写入或读取 `SECRET.md`，不使用 Agent Prompt、普通文件、日志、截图或代码保存 Token/API Key。
- 不修改既有测试 Workflow 项目 `7663957715756269618`，它只保留为历史契约测试记录。

## 3. 职责边界

| 角色 | 职责 | 禁止事项 |
|---|---|---|
| Coze POC Agent | 校验输入、生成固定测试结果、按平台 API 语义返回任务状态与最终结果。 | 调度、用户管理、数据库、通知、外部投递、真实内容生成。 |
| 知行服务端（后续） | 触发、鉴权、轮询、超时、重试、幂等、校验、归档、发布和通知。 | 将 Token 暴露给浏览器或传给 Coze。 |
| Codex | 编写规格、实现知行侧测试/校验、进行不含密钥的验收。 | 获取、打印、保存或转发 Token。 |
| 用户 | 仅在 Coze/Vercel 受控页面创建或填写专用凭证，并决定正式迁移。 | 通过聊天、截图、Prompt 或文件传递 Token。 |

## 4. 调度原则

- POC 阶段仅允许手工 API 调用，**不配置任何 Calendar 任务**。
- 正式阶段由知行 Vercel Cron 触发，Coze 不再承担正式调度。
- 正式排期暂定：早盘生成任务约 08:30，目标发布 09:00；复盘任务约 17:15，目标发布 18:00；节假日摘要约 19:15，目标发布 20:00。实际提前量必须根据至少 5 次真实运行的 P95 耗时调整。

## 5. API 与调用方式：已验证与待实测的平台契约

已验证的隔离 Agent 项目 ID 为 `7664606700401541129`，部署历史 ID 为 `7664628207622029375`，部署域名为 `https://fbgyk4m8c3.coze.site`。

- 已实测：`POST /stream_run` 可接受专用 API Token 并返回 SSE；最终严格业务对象位于事件的 `content.tool_response.result`。
- 已实测：知行受保护的 Vercel POC 可调用该入口，并只接受严格的成功或允许的错误对象。
- 官方文档已说明：`POST /async_run` 适用于 24 小时以内的长任务，先返回任务 ID；`/task/{task_id}` 可查询任务状态、结果或错误信息。
- 尚未实测：`/async_run` 的请求/响应字段、查询方法和状态枚举、实际 `deadline`、限流、并发、取消与冷启动行为。

后续独立异步 POC 必须从部署页与真实测试中记录下列事实：

1. API 域名和最终调用路径；
2. 所需认证头名称、格式和专用凭证的创建/撤销入口；
3. 异步提交响应内的任务标识字段；
4. 查询任务状态和获取最终结果的路径、方法、状态枚举；
5. 同步/异步调用的最大执行时间、限流、并发和冷启动行为；
6. 平台响应包装层与业务 JSON 的边界。

正式报告优先使用异步调用；流式接口仅适合交互展示，**不作为归档型报告的正式通道**。

## 6. 业务请求契约

知行向 Agent 提交的业务载荷必须为：

```json
{
  "schema_version": "1.0",
  "request_id": "poc-morning-20260720-001",
  "report_type": "morning_scan",
  "report_date": "2026-07-20",
  "target_publish_at": "2026-07-20T09:00:00+08:00"
}
```

规则：

- `schema_version` 当前严格等于 `1.0`。
- `request_id` 必填、非空、由知行生成；相同 ID 的重复请求必须可识别，不能造成不受控重复执行。
- POC 的 `report_type` 严格只接受 `morning_scan`；不得沿用旧的 `daily/weekly/monthly` 枚举。
- `report_date` 必须是有效 `YYYY-MM-DD` 日期。
- `target_publish_at` 必须是带 `+08:00` 的 ISO-8601 时间。
- 未知字段可以忽略，但不得回显或写日志。

## 7. 最终业务结果契约

无论 Coze 的 HTTP 平台外层如何包装，业务最终对象必须能解析为下面的路径 B：

```json
{
  "response_schema_version": "1.0",
  "result": {
    "schema_version": "1.0",
    "delivery_id": "poc-delivery-001",
    "delivery_type": "report",
    "request_id": "poc-morning-20260720-001",
    "report_id": "poc-morning-2026-07-20",
    "report_type": "morning_scan",
    "report_date": "2026-07-20",
    "version": "v1.0",
    "title": "知行测试｜早盘扫描｜2026-07-20｜v1.0",
    "summary_points": ["这是 API 契约验证用的固定测试内容。"],
    "content_html": "<p>这是 API 契约验证用的固定测试内容，不构成投资建议。</p>",
    "market_scopes": ["us_equities", "global_futures"],
    "industry_tags": [],
    "theme_tags": [],
    "source_links": [],
    "data_as_of": "2026-07-20T08:45:00+08:00",
    "generated_at": "2026-07-20T08:46:00+08:00"
  },
  "run_id": "coze-platform-run-id"
}
```

约束：

- `result` 是唯一业务对象；`run_id` 只用于受控排障，不能作为报告 ID、版本、幂等键或用户可见字段。
- `content_html` 为受控静态 HTML 片段；POC 不生成 PDF。
- 正文必须固定为测试文本，不得包含真实金融信息或真实来源。
- 不得返回完整输入、Prompt、内部状态、节点名、堆栈、Token、请求头、调试 URL、用户数据或外部调用日志。

### 错误结果

业务错误必须严格只包含：

```json
{
  "schema_version": "1.0",
  "request_id": "poc-morning-20260720-001",
  "status": "validation_error",
  "error_code": "INVALID_REPORT_TYPE",
  "retryable": false
}
```

允许错误码：`MISSING_REQUIRED_FIELD`、`INVALID_SCHEMA_VERSION`、`INVALID_REPORT_TYPE`、`INVALID_REPORT_DATE`、`INVALID_TARGET_PUBLISH_AT`、`DUPLICATE_REQUEST`、`INTERNAL_ERROR`。

缺少 `request_id` 时，当前已部署 Agent 会保留该键并返回空字符串 `""`；知行 POC 必须严格接受这一已实测行为。正式契约升级时如需改为 `null`，必须先同步修改 Agent、适配器和测试。

## 8. 鉴权与密钥规则

- API Token 必须是为本 POC 单独创建、可撤销、最小权限的凭证。
- Token 的真实值只能由用户在受控页面直接填入未来隔离的 Vercel 服务端环境变量；POC 初期可先只验证“无 Token 被拒绝”。
- 不得把 Token 交给 Codex，不得放入聊天、文档、代码、Git、`.env`、本机终端输出、日志、截图、Prompt 或 `SECRET.md`。
- 若平台无法提供专用、可撤销的服务端凭证，POC 判定不通过，不得以个人 CLI Token 替代。

## 9. 测试矩阵

| 编号 | 场景 | 预期 |
|---|---|---|
| T1 | 无 Token 调用 | 被拒绝（401/403 或平台明确等价错误）。 |
| T2 | 合法流式请求 | 已通过：获得严格路径 B 结果；异步提交/轮询另列为未完成项。 |
| T3 | 缺少 `request_id` | 标准业务错误，不泄露输入或内部状态。 |
| T4 | `report_type=weekly` | `INVALID_REPORT_TYPE`。 |
| T5 | 非法日期 | `INVALID_REPORT_DATE`。 |
| T6 | 重复同一 `request_id` | 明确的幂等/重复语义，不产生不受控的第二份结果。 |
| T7 | 连续 3 次合法调用 | 结果字段稳定、无串号、无会话污染。 |
| T8 | 超时/限流信息 | 记录平台实际行为，尚不接入正式重试。 |
| T9 | 日志审查 | 不出现 Token、Authorization、完整正文、Prompt、输入对象或用户信息。 |

## 10. 通过与失败判定

### 当前通过范围

- 已获得真实 Agent 项目 ID、部署历史 ID、API 域名、官方调用说明位置和可撤销凭证配置入口。
- T1、T3–T7 已通过；T2 已完成流式成功调用。T8 有官方行为记录，T9 有不输出原文的日志样本审查。
- 最终结果可被独立 JSON 校验器严格解析。
- 未触碰现有 Calendar、正式报告、用户、数据库、通知或任何旧凭证。

### 仍未通过正式生产门槛

- `/async_run + /task/{task_id}` 未做项目实测；不能将当前 POC 的 `/stream_run` 视为正式归档通道。
- 官方文档中未找到当前可核验的限流、并发或取消语义；不得根据少量成功样本推断容量。
- 正式应用的数据库任务锁、幂等、重试、权限、归档、发布与站内通知均未开始。

### 失败或停止条件

- 只能使用个人 CLI Token、明文文件、Prompt 或 `SECRET.md` 调用。
- Agent 无法输出稳定结构化结果，或必须解析自然语言正文。
- API 调用会自动触发现有 Calendar、真实报告、外部 Webhook 或用户通知。
- 平台 API 的认证、任务查询或最终结果路径无法获得可核验的说明。

## 11. POC 通过后的下一步

1. 用固定测试内容建立独立 `/async_run + /task/{task_id}` POC，先验证提交、轮询、`pending`、`deadline`、重部署中断与错误语义。
2. 获取现有成熟“知行投顾”Agent 的完整链接或项目 ID，仅做只读兼容性评估；不得提供任何 Token。
3. 确认可保留模板并能稳定结构化输出后，再建立正式应用的服务端调用器、任务表、幂等锁、超时、退避重试和结构校验。
4. 后续才依次评估早盘、复盘、节假日资讯、产业研究和标的池迁移；不得停用旧 Calendar 正式链路。

## 12. 已确认的异步 API POC 设计（待实现）

> 确认日期：2026-07-21  
> 范围：仅验证已部署 Coze Coding Agent 的异步 API；只发送固定测试请求；不接触真实报告、Calendar、用户、数据库、归档、发布、通知或 Cron。

### 12.1 设计选择

采用两个新的、相互独立的受保护 POST 接口，而不是在既有 `/api/coze-agent-poc-run` 上增加模式开关：

- `POST /api/coze-agent-poc-async-run`：提交固定 POC 业务请求至 Coze `/async_run`，只返回经过严格校验和脱敏后的任务标识、初始状态与截止时间。
- `POST /api/coze-agent-poc-async-status`：接收任务标识并调用 Coze `/task/{task_id}`；只返回经过严格校验的进行中状态、最终固定测试结果或结构化错误。

两个接口均继续要求 `Authorization: Bearer <PHASE1_ADMIN_TOKEN>`。状态查询使用 POST JSON Body，而非 URL 查询参数，避免把任务标识写入 URL、浏览器历史或常见访问日志。既有流式 POC 接口保持不变。

### 12.2 输入与响应边界

提交接口的业务输入沿用当前五字段白名单：`schema_version`、`request_id`、`report_type`、`report_date`、`target_publish_at`。未知字段必须丢弃且不得记录。

Coze 异步 API 的实际提交和轮询包裹字段尚未由本项目实测确认。因此实现不得猜测字段或把原始 Coze 响应返回给调用方。若平台响应无法从受控、已记录的路径提取唯一 `task_id`，接口只能返回不含原文和密钥的 `422 coze_async_response_unrecognized`；如需定位差异，只允许临时记录字段名、事件数量和布尔匹配结果，确认后必须删除诊断代码。

最终成功结果继续沿用本 POC 的严格固定 JSON 契约；不得从自然语言、`answer` 文本或任意递归位置提取 JSON。

### 12.3 本轮验收

1. 先为提交与轮询适配器编写失败测试，再写最小实现。
2. 验证无效管理凭证、无效输入、异步提交成功、任务标识缺失、进行中状态、最终成功、最终结构化错误和不识别包裹的拒绝行为。
3. 通过 Vercel 部署后，由 Postman 使用固定测试内容完成异步提交与轮询；不进行高频压测、故意长时间占用或真实内容生成。
4. 记录实际请求/响应字段、状态枚举、`deadline`、错误语义与重新部署中断边界；未证实的限流、并发和取消能力继续标记为未验证。

## 13. 给 Coze 的执行指令

请严格按本文创建隔离测试 Agent。不得自行增加 Calendar、Webhook、数据库、外部 HTTP、真实报告内容、用户数据、PDF、通知或任何凭证文件。若 Coze 平台的实际部署 API 与本文假设不同，请停止修改并用“平台实际页面/字段 + 差异说明 + 可验证路径”的形式报告；不得编造或以模拟成功代替真实部署/API 证据。
