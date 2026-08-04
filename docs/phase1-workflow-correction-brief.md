# 知行：Phase 1 测试 Workflow 修正与验收规格

> 范围：仅适用于 Coze 项目 `7663957715756269618`（知行测试工作流）。
>
> 目标：建立一个不含任何外部副作用的、可被应用服务端调用的结构化 JSON 契约骨架。它不是正式报告生成流程，也不得替代现有 Calendar Agent。

## 1. 强制范围限制

- 只修改该测试 Workflow 的源码和其测试文件。
- 禁止部署、发布、创建数据库、添加或配置环境变量/凭证、调用 HTTP/Webhook、发送通知、上传文件或写入外部存储。
- 禁止读取、复制、迁移或修改已有 Calendar Agent、报告模板、私有 Skill、旧项目、用户数据和正式端点。
- 不调用任何 Skill、联网搜索、图片生成或其他外部工具；不新增项目级 Skill 配置。
- 日志和测试输出不得包含 Token、Authorization、个人信息、真实报告正文、来源链接或任何内部 Prompt。

## 2. 输入契约

工作流只接受以下字段；所有字段均必须由调用方显式提供，不得自动补齐、默认赋值或静默改写：

```json
{
  "schema_version": "1.0",
  "request_id": "phase1-request-001",
  "delivery_id": "phase1-delivery-001",
  "report_id": "phase1-morning-2026-07-19",
  "report_type": "morning_scan",
  "report_date": "2026-07-19",
  "version": "v1.0",
  "data_as_of": "2026-07-19T08:45:00+08:00",
  "generated_at": "2026-07-19T08:46:00+08:00"
}
```

### 校验规则

- `schema_version` 必须严格等于 `1.0`。
- `request_id`、`delivery_id`、`report_id` 均为去除首尾空格后非空字符串；工作流不得生成、替换或默认这些 ID。
- `report_type` 只能是：`morning_scan`、`daily_review`、`holiday_digest`、`industry_research`。严禁使用 `daily`、`weekly`、`monthly` 或自由文本。
- `report_date` 必须为 `YYYY-MM-DD` 合法日期。
- `version` 必须满足 `v` 加数字语义版本格式，例如 `v1.0`、`v1.2`。
- `data_as_of` 与 `generated_at` 必须为带时区的 ISO-8601 时间；不得使用服务器当前时间自动填充。
- 未知的额外字段应被忽略，不能改变已知字段的值，也不能导致成功结果中泄露这些字段。

## 3. 成功输出契约

合法输入返回根级 JSON 对象，字段必须完整、类型稳定，且所有可回显字段与输入严格一致：

```json
{
  "schema_version": "1.0",
  "delivery_id": "phase1-delivery-001",
  "delivery_type": "report",
  "request_id": "phase1-request-001",
  "report_id": "phase1-morning-2026-07-19",
  "report_type": "morning_scan",
  "report_date": "2026-07-19",
  "version": "v1.0",
  "title": "知行测试｜早盘扫描｜2026-07-19｜v1.0",
  "summary_points": [
    "Phase 1 合同测试内容，不构成投资建议。"
  ],
  "content_html": "<p>Phase 1 合同测试内容，不构成投资建议。</p>",
  "market_scopes": ["us_equities", "global_futures"],
  "industry_tags": [],
  "theme_tags": [],
  "source_links": [],
  "data_as_of": "2026-07-19T08:45:00+08:00",
  "generated_at": "2026-07-19T08:46:00+08:00"
}
```

### 输出规则

- `delivery_type` 固定为 `report`；本次不实现 `watchlist_snapshot`。
- `content_html` 必须是固定、安全的最小 HTML 片段，不含脚本、事件属性、外链、图片、样式或真实内容。
- `summary_points`、`source_links`、`industry_tags`、`theme_tags` 必须始终是数组。
- `industry_research` 可以返回非空 `industry_tags`，其余测试类型可为空数组；本次不得伪造真实研究内容。
- `market_scopes` 至少遵守：`morning_scan` 包含 `us_equities` 与 `global_futures`，`daily_review` 包含 `cn_a`。其他测试类型使用固定、明确的安全占位范围。
- 不得保留或输出旧的 `checksum`、`status`、`metrics`、`details` 等非契约字段，除非放入明确的 `test_metadata` 且不影响正式解析；本次推荐完全删除。

## 4. 错误输出契约

输入不合法时不得抛出未处理异常，不得返回半成品报告，不得默认修复输入。统一返回：

```json
{
  "schema_version": "1.0",
  "request_id": "原请求 ID；缺失时为 null",
  "status": "validation_error",
  "error_code": "INVALID_REPORT_TYPE",
  "retryable": false
}
```

允许的错误码：`MISSING_REQUIRED_FIELD`、`INVALID_SCHEMA_VERSION`、`INVALID_REPORT_TYPE`、`INVALID_REPORT_DATE`、`INVALID_VERSION`、`INVALID_TIMESTAMP`。错误中不得回显完整输入、正文、未知字段或敏感信息。

## 5. 必须覆盖的自动化测试

1. 四种合法 `report_type` 分别得到符合成功契约的 JSON。
2. `daily`、`weekly`、`monthly` 与任意未知类型得到 `INVALID_REPORT_TYPE`。
3. 缺少每一个必填 ID、缺少 `schema_version`、空白 ID 均失败，且没有默认值。
4. 非法日期、无时区时间、错误版本号失败。
5. 未知字段不影响成功输出，且不被回显。
6. 断言没有网络请求、Webhook、数据库、文件上传、通知、凭证读取或 Skill 调用。
7. 成功输出不含旧骨架字段 `checksum`、`metrics`、`details`。

## 6. 完成时必须返回的验收证据

- 修改文件清单及每个文件的用途。
- 测试命令和完整测试结果摘要：总数、通过数、失败数。
- 四种合法输入各一份脱敏输出示例，以及一份非法类型错误示例。
- 明确逐项确认本规格第 1 节的所有禁止项均未发生。
- 明确声明：未部署、未发布、未创建/修改凭证、未接入正式报告链路。

## 7. 通过条件

只有完成本文件的全部要求，且随后由知行应用侧独立复核通过，才允许进入“确认 Coze API 调用方式与鉴权”的下一步。通过前不得接入 Vercel、Supabase、正式 Webhook 或用户流程。
