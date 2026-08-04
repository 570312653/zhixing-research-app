# 知行第 1 阶段：Coze 交付安全验证接收端

这是一个只用于第 1 阶段 Coze 集成验证的临时 Vercel 工程，不是正式应用后端。

## 边界

- 只接受 `POST /api/coze-delivery-test`。
- 校验 `Authorization: Bearer <token>`，并要求非空的 `delivery_id`、`delivery_type`、`schema_version`。
- `delivery_type` 仅允许 `report` 或 `watchlist_snapshot`。
- 只记录交付元数据，不记录报告正文、来源链接或任何密钥。
- 成功后立即返回 `202 Accepted`。
- 不接入数据库、用户、通知或正式报告归档。

### Agent API POC 调用器

`POST /api/coze-agent-poc-run` 是新建的、仅用于已部署 Coze Agent 的服务端测试调用器。

- 必须使用 `Authorization: Bearer <PHASE1_ADMIN_TOKEN>` 保护；它不是用户登录，也不面向浏览器。
- 只把五个 POC 业务字段放入 Coze `prompt.text`；未知字段会被丢弃且不记录。
- 调用 Coze `/stream_run` 后完整读取 SSE，但不记录或返回原始 SSE、请求头或凭证。
- 只有 SSE 中存在**唯一、完整、严格符合 POC 契约**的 JSON 对象时才返回 `200`；模型增加解释文字、包装字段、多个不同结果或字段不匹配时一律返回 `422`，不会产生任何归档或通知副作用。
- 每次调用生成新的 Coze `session_id`，避免先前 POC 会话污染当前请求。
- 该路由只用于手工测试 T2–T8；不配置 Cron，不连接 Supabase，不生成真实报告。

## 环境变量

- `COZE_DELIVERY_TEST_TOKEN`：仅在完成新的 Skill 审查后，配置到 Vercel Production 环境与 Coze Skill 的开发者凭证变量中；禁止写入仓库、日志、`SECRET.md` 或普通环境变量。
- `PHASE1_ADMIN_TOKEN`：仅用于保护 `/api/coze-agent-poc-run` 的测试入口。由用户直接配置到 Vercel，绝不发送给 Codex 或写入本地 `.env`。
- `COZE_AGENT_API_TOKEN`：新建、可撤销、仅用于 Coze Agent POC 的 API Token。只配置在 Vercel 的服务端环境变量中。
- `COZE_AGENT_BASE_URL`：已部署 Agent 的 HTTPS 域名，例如 `https://<deployment>.coze.site`。
- `COZE_AGENT_PROJECT_ID`：已部署 Agent 的项目 ID；仅为非敏感标识。

不要把上述任何 Token 填进本机 `.env.local`、代码、Git、聊天或截图。需要真实联调时，只能由用户在 Vercel 的环境变量页面填写新 Token。

## 验收

旧的 Calendar → Agent Session → 私有 Skill 路线仅保留为历史审计，未获得可安装私有 Skill 的验证；不得据此继续接入。

Agent API POC 的本地逻辑测试可运行：

```powershell
npm test
```

当前已验证：无凭证请求被拒绝；合法请求、缺少 ID、非法类型、非法日期、重复 ID 与连续三次合法调用均能经严格契约处理。真实 SSE 输出若不能被严格解析，测试即失败，不得重试为“宽松解析”。

`/async_run + /task/{task_id}` 是 Coze 官方文档列出的长任务路径，但尚未在本 POC 实测；不得把 `/stream_run` 直接用作正式报告归档通道。
