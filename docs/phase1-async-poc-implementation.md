# 第 1 阶段：Coze 异步 API POC 实现记录

日期：2026-07-21

## 本次范围

本次仅为隔离的 `phase1-webhook-test` 新增两条管理员手工测试接口：

- `POST /api/coze-agent-poc-async-run`：调用 Coze `/async_run` 提交固定五字段测试请求。
- `POST /api/coze-agent-poc-async-status`：接收 `{ "task_id": "..." }` 并调用 Coze `/task/{task_id}` 查询状态。

不包含 Cron、Calendar、Supabase、用户、真实报告、归档、发布或通知。现有流式 POC 与历史交付测试入口未修改。

## 安全与失败策略

- 两个接口只接受 `POST`，均要求 `Authorization: Bearer <PHASE1_ADMIN_TOKEN>`。
- Coze API Token 与管理员 Token 仅保存在 Vercel Production 环境变量，代码、文档、日志和响应中均不包含真实值。
- 请求白名单沿用既有五个 POC 字段；状态查询仅允许安全格式的 `task_id`。
- Coze 官方文档确认了 `/async_run` 和 `/task/{task_id}`，但未提供可核验的固定响应 JSON 示例。因此当前代码不会猜测、递归搜索或透传响应。
- 只有严格匹配当前受控测试契约的响应才会被裁剪后返回；未知结构、额外字段或非 JSON 响应一律返回 `422 coze_async_response_unrecognized`。
- 日志最多包含事件名、HTTP 状态、耗时、任务 ID 长度和顶层字段名；不得记录 Token、Authorization、Prompt、报告正文或原始 Coze 响应。

## 当前验证状态

- 已完成本地测试先行：新增测试曾因缺少异步实现而失败，补充最小实现后通过。
- 当前本地测试：15/15 通过；所有新增 JavaScript 文件语法检查通过。
- 已通过一次真实、安全的提交请求确认 Coze `/async_run` 的顶层响应严格包含 `task_id`、`status`、`created_at`、`deadline`；四个字段均为字符串，任务 ID 格式安全，两个时间字段均可解析。字段实际值、原始响应、Token 和报告内容均未记录。
- 提交适配器现严格要求上述四个字段，但只向调用方返回 `task_id`、`status`、`deadline`。
- 已通过一次真实、安全的状态查询确认 Coze `/task/{task_id}` 的顶层响应严格包含任务计数、五个任务时间/状态字段、`error`、`result` 与 `task_id` 共十个字段。当前任务为终态，`error` 的嵌套字段为 `code`、`message`，`result` 为空对象；所有实际值均未读取、记录或返回。
- 状态适配器现严格验证这个任务外壳，只向调用方返回任务 ID、状态、截止/开始/完成时间，以及 `has_error`、`has_result` 布尔值。它绝不返回 `error` 的详情或 `result` 的内容。
- 当 `has_error` 为真时，状态适配器额外允许返回受限格式（英文字母开头，后续仅限字母、数字、点、下划线、冒号或连字符）的 `error_code`；绝不返回 Coze 的 `error.message`。不符合该安全格式的代码会被归一化为 `COZE_TASK_FAILED`。
- 尚需对修正后的状态适配器进行一次真实请求验收。因此尚不能宣称完整 Coze 异步链路可用，更不能用于正式报告。

## 下一步受控验收

1. 部署该隔离 POC 到现有 Vercel 测试项目。
2. 用户在 Postman 使用自己保管的 `PHASE1_ADMIN_TOKEN` 发起一次固定异步提交。
3. 若提交返回 `200`，只使用其中裁剪后的 `task_id` 调用状态接口；若状态查询返回 `422`，检查仅包含字段名、类型和布尔校验结果的安全日志并据此更新严格契约。
4. 分别验证未授权请求、提交响应、查询中的状态和最终状态；不发送真实报告或高频请求。
## 复测结论（2026-07-21）

- 已以不同的 `request_id` 创建并查询多个 Coze 异步任务。提交接口每次均返回 `200`、新的安全格式 `task_id`、`pending` 状态和 `deadline`。
- 状态查询接口每次均返回 `200`，因此 Vercel 鉴权、`/async_run` 任务创建、`/task/{task_id}` 轮询和脱敏状态适配均已完成端到端验证。
- 至少两个不同任务最终均返回 `status: failed`、`has_error: true`、`has_result: false` 与 `error_code: NotImplementedError`。这证明当前隔离 Coze Coding Agent 的异步任务执行路径不可用；它不是 Postman、Vercel、Token、请求格式或状态适配器故障。
- 现有 `/stream_run` 固定 POC 此前成功，故后续正式方案可将它作为候选调用机制进行独立架构评估；在完成超时、可靠性和真实报告兼容性验证前，禁止直接升级为正式归档通道。
- 不再对当前 Agent 的 `/async_run` 做无目的重试或高频测试。若需要恢复该路径，只能由 Coze 侧确认并修复 `NotImplementedError` 的能力限制后，再以新的隔离任务复验。
