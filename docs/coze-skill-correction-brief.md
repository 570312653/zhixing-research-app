# 知行：Coze 私有报告交付 Skill 修正与复验要求

> 状态：必须完成本文件全部要求并重新打包后，才允许进入代码审查；本轮**不得**发布、上传、安装、接入 Calendar Agent、配置真实 Token，或发送真实报告。
> 目标项目：`7663136465890738214`
> 固定测试接收端：`https://phase1-webhook-test.vercel.app/api/coze-delivery-test`

## 0. 先修正项目与产物定位

- 项目名称、Skill 名称、项目描述、`SKILL.md` 和打包产物说明必须全部明确为“知行安全报告交付”。
- 删除任何“出行规划、票务查询、智能出行”等无关描述、能力、示例、依赖与文案。
- 该 Skill 只做一件事：接收已生成的结构化交付 JSON，校验后安全投递到固定知行测试 Webhook。
- 它不得生成、改写、存储、归档、发布报告；不得调度任务、读取用户信息、发送通知；不得自行安装或接入 Agent。

## 1. 凭证模型：必须是 API Key 开发者凭证变量

必须创建并在代码中实际使用 Coze 平台托管的 API Key 类型**开发者凭证变量**：

```text
name: ZHIXING_DELIVERY_TOKEN
type: API Key
owner: developer
allowed domain: phase1-webhook-test.vercel.app （且仅此一个域名）
```

严格要求：

1. HTTP 请求必须在运行时实际使用该平台注入的值，发送：

   ```text
   Authorization: Bearer <ZHIXING_DELIVERY_TOKEN>
   ```

2. 不接受 `coze_workload_identity`、普通环境变量、普通配置变量、Prompt、文件或代码常量作为对外 Webhook 的鉴权替代方案。
3. 如果平台内部需要某种机制来取得托管凭证，该机制只能是实现细节；最终对外请求仍必须是上述 Bearer API Key，且不得把真实值暴露给 Agent、日志、文件或打包产物。
4. 严禁创建、读取、保留或引用下列任何 Token 存储位置：`SECRET.md`、`.env`、`.env.*`、普通环境变量、源代码、测试样例、Prompt、日志、截图、README、打包文件。
5. 本轮**不填写真实 Token 值**。只完成凭证变量定义、平台托管注入接线和域名白名单配置；不得将占位符当作真实密钥。

## 2. 固定请求目标与输入契约

- 目标 URL 必须是代码常量：`https://phase1-webhook-test.vercel.app/api/coze-delivery-test`。
- 仅允许 HTTPS `POST`；请求头必须包含 `Content-Type: application/json` 与上述 `Authorization`。
- 禁止调用方通过参数、普通变量、Prompt、文件或任意 payload 覆盖 URL。
- 禁止跟随 HTTP 重定向。
- Skill 接收一个 JSON 对象，且在进行任何 HTTP 请求前必须校验以下非空字符串：
  - `delivery_id`
  - `delivery_type`，只允许 `report` 或 `watchlist_snapshot`
  - `schema_version`
- 不得为以上字段自动生成、默认补齐、改写或删除；校验通过后，HTTP Body 必须与调用方传入的完整 JSON 等值。

## 3. 响应、重试与日志

- `2xx`：立即成功，不重试；返回仅含安全状态和 `delivery_id`，不得返回上游响应正文。
- `400`、`401`、`403` 和其他所有非 `429` 的 `4xx`（包括 `408`）：立即失败，不重试。
- 仅 `429`、`5xx` 和网络连接/读取超时可重试：首次失败后依次等待 **1 分钟、5 分钟、15 分钟**。
- 明确计数：首次请求 + 最多 3 次自动重试，即最多 4 次 HTTP 请求。测试中必须 mock 等待，不能真的等待 21 分钟。
- 出错时只返回安全错误码、HTTP 状态和 `delivery_id`（如可用）；不得回传响应正文、请求头、Token 或报告正文。
- 日志只允许：时间、`delivery_id`、`delivery_type`、`schema_version`、尝试次数、结果状态和安全错误码。
- 日志、异常栈、测试输出均不得包含报告正文、来源链接、完整 payload、`Authorization` 头、Token、上游响应正文。

## 4. 必须新增或更新的自动化测试

测试必须使用 mock HTTP 客户端和 mock sleep；不得发送真实网络请求，不得需要真实 Token。至少覆盖：

1. 合法 payload：确认固定 URL、POST、JSON Content-Type、Bearer 凭证接线和原样 Body；安全返回。
2. 缺少或空的每个必填字段：请求前失败，HTTP 客户端未被调用。
3. 不支持的 `delivery_type`：请求前失败。
4. `2xx`：不重试。
5. `400`、`401`、`403`、`408` 与其他非 `429` 4xx：不重试。
6. `429`、`500` 和网络超时：恰好按 1 分钟、5 分钟、15 分钟重试，最多共 4 次请求。
7. 失败和异常日志：断言不包含正文、来源链接、请求头、Token、完整 payload 或上游响应正文。
8. 不存在 `SECRET.md`、`.env*` 或任何硬编码 Token 文件；打包前执行一次敏感文件/字符串检查。

## 5. 完成后必须返回的可验收证据

完成修改后，不要发布或安装。请返回以下内容：

1. 修改后的项目与 Skill 名称/描述，证明已去除“出行”相关内容。
2. 凭证配置卡片的文字化信息：变量名、API Key 类型、开发者变量、唯一域名白名单；不得展示 Token 值。
3. 代码级说明：使用何处将平台托管 `ZHIXING_DELIVERY_TOKEN` 注入 `Authorization: Bearer`，并明确说明未使用 `coze_workload_identity` 作为外部 Webhook 鉴权。
4. 文件清单与关键文件内容摘要，明确确认不存在 `SECRET.md`、`.env*` 或普通 Token 变量。
5. 自动化测试的命令、通过数量和覆盖结论；不得贴出任何敏感值或完整报告内容。
6. 新生成的 `.skill` 文件名、大小、打包时间，以及其尚未发布/上传/安装/接入 Agent 的确认。

## 6. 本轮禁止事项

- 不配置真实 Token，也不要求提供真实 Token。
- 不上传、发布或安装 Skill。
- 不接入 Calendar Agent。
- 不调用正式报告，不写入数据库，不创建用户、归档、发布或通知。
- 不修改知行 Vercel 接收端。

