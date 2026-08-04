# 知行：Coze 报告调用与结果契约（第 1 阶段，历史归档）

> 状态：**历史 POC 记录，非正式实施契约。**隔离 Coze Coding Agent 的流式 POC 曾通过固定数据验证；异步 POC 返回 `NotImplementedError`，而 2026-07-28 的真实多报告 Agent 又未通过真实性、合规和格式验收。因此不得将本文件中的 Coze API 路线用于正式报告。  
> 最后更新：2026-07-28

## 1. 当前架构决定

本文件记录的、现已弃用的目标架构曾是：

```text
Vercel Cron
  → 知行可信服务端
  → Coze 已发布 Agent API
  → 严格 JSON 校验
  → （后续）Supabase 归档、发布、站内通知
```

当前正式候选架构改为“Vercel Cron → 知行报告引擎 → 严格 JSON 校验 → 应用归档/发布/通知”，详见 [知行报告引擎架构](./report-engine-architecture.md)。正式契约将在报告引擎固定样例验收通过后另行建立；不得从本文件复制 Coze Token、端点或 SSE 解析方式进入新引擎。

旧的 `Calendar → Agent Session → 私有 Skill → Webhook` 路线没有获得可安装私有 Skill 的独立证据，不是当前正式方案；严禁用 `SECRET.md`、Prompt、普通文件或明文 Token 绕过。

当前隔离 POC 的 Agent 项目 ID 为 `7664606700401541129`，部署历史 ID 为 `7664628207622029375`，部署域名为 `https://fbgyk4m8c3.coze.site`。它只生成固定测试报告，不连接现有 Calendar、真实报告、外部数据、用户、数据库、Webhook、通知或 PDF。

## 2. 已实测的调用边界

- 知行 Vercel POC 服务端通过 `POST /stream_run` 调用隔离 Agent；Coze API Token 仅存在于 Vercel Production 服务端环境变量，浏览器/Postman 不接触它。
- POC 入口另由 `PHASE1_ADMIN_TOKEN` 保护，且与 Coze API Token 分离。
- 知行只转发 `schema_version`、`request_id`、`report_type`、`report_date`、`target_publish_at` 五个业务字段；未知字段不转发、不记录。
- 每次调用使用新的 Coze `session_id`，防止历史提示污染。
- Coze 返回 SSE。最终业务对象已实测位于精确路径 `content.tool_response.result`；知行不得递归猜测 JSON，也不得从自然语言中提取 JSON。

## 3. 严格结果契约

成功结果必须严格为：

```json
{
  "response_schema_version": "1.0",
  "result": {
    "schema_version": "1.0",
    "delivery_id": "poc-delivery-001",
    "delivery_type": "report",
    "request_id": "poc-request-001",
    "report_id": "poc-morning-2026-07-21",
    "report_type": "morning_scan",
    "report_date": "2026-07-21",
    "version": "v1.0",
    "title": "知行测试｜早盘扫描｜2026-07-21｜v1.0",
    "summary_points": ["这是 API 契约验证用的固定测试内容。"],
    "content_html": "<p>这是 API 契约验证用的固定测试内容，不构成投资建议。</p>",
    "market_scopes": ["us_equities", "global_futures"],
    "industry_tags": [],
    "theme_tags": [],
    "source_links": [],
    "data_as_of": "2026-07-21T08:45:00+08:00",
    "generated_at": "2026-07-21T09:00:00+08:00"
  },
  "run_id": "coze-platform-run-id"
}
```

- 外层只允许 `response_schema_version`、`result`、`run_id` 三键。
- `result` 是唯一业务对象；`run_id` 仅用于受控排障，不得作为报告 ID、版本、幂等键或用户可见字段。
- POC 仅接受固定早盘测试内容。真实报告的字段、版本策略、来源和 HTML 安全策略必须另行评审；本 POC 尚不支持本文件第 5 节的正式报告枚举。

错误结果必须严格为：

```json
{
  "schema_version": "1.0",
  "request_id": "poc-request-001",
  "status": "validation_error",
  "error_code": "INVALID_REPORT_TYPE",
  "retryable": false
}
```

- 已实测错误码：`MISSING_REQUIRED_FIELD`、`INVALID_REPORT_TYPE`、`INVALID_REPORT_DATE`、`DUPLICATE_REQUEST`。
- 缺少 `request_id` 时，当前 Agent 保留键并返回空字符串 `""`；这是当前 POC 的严格行为。
- `DUPLICATE_REQUEST` 必须回显原 `request_id`，且 `retryable` 为 `false`。
- 错误对象不得包含完整输入、Prompt、SSE 原文、Token、请求头、堆栈、来源或正文。

## 4. 已完成验收

| 编号 | 结论 | 记录 |
|---|---|---|
| T1 | 通过 | 无凭证请求被拒绝。 |
| T2 | 部分通过 | `stream_run` 合法请求返回严格成功对象；`async_run` 可提交和查询但执行最终为 `NotImplementedError`。 |
| T3 | 通过 | 缺少 ID 返回空字符串 ID 与 `MISSING_REQUIRED_FIELD`。 |
| T4 | 通过 | 非法类型返回 `INVALID_REPORT_TYPE`。 |
| T5 | 通过 | 非法日期返回 `INVALID_REPORT_DATE`。 |
| T6 | 通过 | 同一 ID 首次成功，后续返回 `DUPLICATE_REQUEST`。 |
| T7 | 通过 | 连续三次成功，耗时 13.34s、12.45s、13.54s，无串号。 |
| T8 | 已完成但不通过 | `/async_run → task` 可提交和查询，但多个隔离任务最终为 `NotImplementedError`；当前 Agent 禁止使用该路径。限流、并发、取消仍未核验。 |
| T9 | 样本通过 | 最新部署 4 条 JSON 日志的无原文扫描未命中凭证、Prompt 或完整报告字段。 |

完整 T8 记录见 [phase1-coze-agent-api-t8-research.md](./phase1-coze-agent-api-t8-research.md)。

## 5. 未完成与正式门槛

- 当前 `/stream_run` 只适合交互/POC，不得作为正式归档报告通道。
- 当前 `/async_run` 与 `/task/{task_id}` 已在隔离 POC 实测：可提交、可查询，但任务最终为 `NotImplementedError`。在 Coze 侧确认并修复前，禁止继续无目的重试、压测或接入真实报告。
- 官方文档未在本次核验中给出可用于本项目的限流、并发或取消语义；不得根据少量样本估计容量。
- 正式幂等必须由知行数据库任务锁和唯一约束保证，不能只依赖 Agent 的 `DUPLICATE_REQUEST`。
- 真实成熟“知行投顾”Agent 是否可直接 API 调用、能否保留模板、能否稳定输出结构化 JSON仍未评估；用户只需提供完整 Agent/Bot 链接或项目 ID，绝不提供 Token。
- 新建的多报告 Agent 在内容验收前只生成 Coze 内部草稿；Supabase、Cron、用户权限、归档、发布、站内通知、审计与真实报告均未接入。

## 6. 正式多报告契约扩展（待真实 Agent 样例验收）

下列枚举是“知行市场研究 Agent”的正式目标，不代表现有固定内容 POC 已支持。真实 API 接入前，必须为每个类型提供一份严格 JSON 样例和一份安全错误样例，并更新服务端校验器。

| `report_type` | 生成时机 | 最低业务要求 |
|---|---|---|
| `morning_scan` | A 股实际交易日早盘 | 外围市场与 A 股开盘观察。 |
| `midday_review` | A 股实际交易日中午 | 上午 A 股复盘，引用并验证早盘/前一日判断。 |
| `daily_review` | A 股实际交易日收盘后 | A 股复盘与次日观察。 |
| `industry_tracking` | A 股实际交易日晚上 | 十五五赛道变化与版本化研究更新。 |
| `holiday_digest` | 连续休市最后一天晚上 | 非个人化假期高价值信息摘要。 |
| `month_end_review` | 每月最后一个 A 股实际交易日 | 非个人化月度市场、行业和风格复盘。 |
| `industry_research` | 按需触发 | 重大变化触发的完整行业深度研究。 |

共享要求：

- 报告业务对象必须包含 `schema_version`、`delivery_id`、`delivery_type: "report"`、`request_id`、`report_id`、`report_type`、`report_date`、`version`、`title`、`summary_points`、`content_html`、`market_scopes`、`industry_tags`、`theme_tags`、`source_links`、`data_as_of` 与 `generated_at`。
- 可选 `pdf_artifact` 只报告 PDF 的 `status`、文件名和 MIME 类型；不得传递本地绝对路径、Token 或不受控链接。正式应用存储由知行负责。
- `midday_review` 和 `month_end_review` 的 HTML 必须含可追溯判断验证表，引用原 `report_id`、日期、原判断、状态与公开证据；不得覆盖原判断。
- 新报告类型未知、字段缺失或类型不匹配时必须失败关闭并返回无敏感错误；不得由应用或 Agent 静默猜测补齐。

## 7. 安全底线

- 不向 Coze 发送用户邮箱、订阅行为、持仓或其他个人数据。
- Token 只允许由用户直接写入受控服务端环境变量；不得进入 Git、浏览器、Prompt、代码、本机 `.env`、日志、截图、聊天、`SECRET.md` 或报告正文。
- 已在聊天中出现过的 Token 必须视为暴露并轮换；Codex 不得读取、索取或回显其值。
- 日志只允许记录最小事件元数据、状态码、耗时和非敏感追踪 ID；不得记录 SSE 原文、正文、请求头或凭证。
