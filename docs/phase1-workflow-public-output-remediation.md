# 知行 Phase 1：Workflow 真实对外输出修复规格与执行路径

> 目标 Coze 项目：`7663957715756269618`（知行测试工作流）  
> 文档状态：强制修复规格；在下述验收全部通过前，Workflow 仅为隔离实验，不得用于真实报告、正式 API、Webhook、数据库或用户流程。  
> 本文优先级：高于此前该测试项目中任何“已完成”“测试通过”的文字结论；与正式应用架构的最终选择无冲突，但不代表 Workflow 路线已被正式采用。

---

## 1. 本次要解决的唯一核心问题

当前 Workflow 的 Python 内部 `model_dump()` 可以生成符合契约的错误对象，但 Coze 平台的真实 `test_run` 输出仍包含 `GlobalState` 中的大量成功字段，且其值为 `null`。

这意味着以下两类结果不等价：

```text
Python 内部序列化结果：     { schema_version, request_id, status, error_code, retryable }
Coze test_run 实际响应：    { schema_version, request_id, delivery_id: null, title: null, ... }
```

知行应用未来只能依赖**真实平台对外响应**，不能依赖 Coze 工程内部某个 Python 方法的返回值。因此，本次修复的验收对象是：

1. Coze Workflow 的真实 `test_run` 原始 JSON；以及
2. 若平台提供但尚未启用的公开调用入口，则该入口的真实原始 JSON。

任何 `model_dump()`、Python 脚本、单元测试模拟、UI 省略展示或“有效字段只有这些”的解释，都不能替代上述证据。

---

## 2. 既往问题与不可再次违反的规则

以下问题已经发生过，必须在实现和最终回复中逐项避免：

| 已发生问题 | 禁止再次出现的行为 | 本次正确做法 |
|---|---|---|
| 初版使用 `daily/weekly/monthly` | 重新引入旧枚举、自由文本或静默转换 | 只允许四个正式枚举，非法值显式报错。 |
| 初版输出 `checksum`、`metrics`、`details` | 把旧测试骨架字段混入正式测试契约 | 成功与错误对象均只输出本规格列出的字段。 |
| 错误对象含成功字段的 `null` | 声称 `null` 字段“不算有效字段” | 对外 JSON 顶层键集合必须严格匹配契约。 |
| 用 `model_dump()` 证明对外响应 | 将内部执行结果、单元测试或说明文字当成 `test_run` 证据 | 返回完整、未裁剪的真实平台响应和字段集合断言。 |
| test_run 不符合要求但仍声称完成 | 把平台限制隐藏为“已修复” | 立即报告 `BLOCKED`，说明限制、原始响应和不能继续的原因。 |
| 私有 Skill 方案无法上传 | 再次声称已上传/已安装却没有真实 `skill_id` | 本项目不得回退到 Skill/Webhook 方案，也不得声称其已打通。 |
| Windows CLI 发送后报异步断言 | 因 CLI 末尾报错重复发送相同需求 | 以明确的 `Message sent` 和后续状态查询为准，禁止盲目重复发送。 |

**真实性规则：** 最终回复不得使用“实际有效字段”“生产环境应该会”“理论上可”“模型已处理”等措辞替代可复核证据。无法证明即为未通过。

---

## 3. 严格范围与安全边界

本次只能修改该测试 Workflow 的源码、测试和该 Workflow 自身的项目说明。

### 3.1 明确允许

- 重构 Workflow 的状态模型、图编排或平台输出映射。
- 新增不联网的契约测试、`test_run` 测试夹具和脱敏 JSON 断言。
- 删除与本规格冲突的旧测试字段、旧断言和无效序列化逻辑。

### 3.2 明确禁止

- 禁止部署、发布、开放访问、生成线上域名或创建数据库。
- 禁止创建、修改、读取或展示任何 API Key、Token、环境变量、凭证、`SECRET.md` 或 Authorization 头。
- 禁止 HTTP/Webhook、联网搜索、外部 Skill、文件上传、外部存储、通知、图片生成和其他外部工具调用。
- 禁止读取、复制、迁移、修改既有 Calendar Agent、成熟报告模板、私有 Skill、旧 Skill 项目、Vercel、Supabase 或用户数据。
- 禁止生成真实报告正文、真实来源链接、真实投资观点、持仓或用户信息；只允许固定占位测试内容。
- 禁止修改本地知行应用仓库中的代码、文档或环境配置。
- 禁止为了让测试“绿”而在应用端添加字段清洗、容错或特殊解析逻辑；应用端本次不参与修改。

### 3.3 硬停止条件

若需要上述任意禁止行为才能证明结果，必须停止并回复 `BLOCKED`；不得自行扩大权限、另建生产资源或绕过限制。

---

## 4. 对外响应设计：先选路径，再实施

平台的 `test_run` 已证明当前平铺 `GlobalState` 设计会泄露运行状态。必须先验证 Coze 是否支持**平台级公开输出映射**，不能继续依赖 Pydantic 序列化器。

### 路径 A：平台级最终输出映射（首选）

适用条件：Coze Workflow 可定义一个真实对外的最终输出对象，并且 `test_run` 直接展示该对象，而不展示中间 `GlobalState`。

实现要求：

1. 输入状态可以在图内部使用，但不允许自动成为公开输出。
2. 最终节点生成唯一公开对象；平台输出映射只暴露此对象。
3. `test_run` 成功和错误场景均直接返回第 5 节定义的根级 JSON。
4. 不得通过“在最后 Python 节点调用 `model_dump()`”伪造；必须由 Coze 的真实输出机制生效。

优点：契约最干净，应用不依赖平台内部状态。  
风险：需要 Coze 平台确实支持并可从 `test_run` 证明。

### 路径 B：固定版本化包装器（仅当路径 A 被平台证明不可行时）

适用条件：Coze 平台强制返回运行状态，且无法配置为根级最终对象。

包装器必须是稳定、显式、可版本化的唯一结构，例如：

```json
{
  "response_schema_version": "1.0",
  "result": {
    "schema_version": "1.0",
    "delivery_id": "..."
  }
}
```

限制：

- `result` 以外不得出现输入字段、GlobalState 字段、`null` 成功字段、调试字段或平台内部对象。
- 成功时 `result` 使用第 5.1 节；错误时 `result` 使用第 5.2 节。
- 采用此路径前，必须在最终回复中明确提交“路径 A 的真实 `test_run` 不可行”的原始证据和原因；不能悄悄切换。
- 路径 B 需要知行侧后续**显式确认**后才能成为正式契约；本次只能输出候选证据，不得擅自修改应用或宣布正式采用。

优点：如果平台确实强制包装，仍可有稳定边界。  
风险：比路径 A 多一层解析，必须锁定版本且需要应用侧确认。

### 路径 C：应用端从任意 GlobalState 中猜测/清洗字段（明确拒绝）

不得采用。它会把平台内部实现泄露给应用，导致后续节点、字段或平台更新都可能破坏知行归档逻辑，也违背“版本化接口而非自然语言/运行状态”的原则。

### 决策规则

1. 先尝试路径 A，先用真实 `test_run` 证明。
2. 若路径 A 不可行，只能提交路径 B 的候选设计和原始限制证据，等待知行侧确认；不得直接宣告通过。
3. 若路径 B 也无法让真实 `test_run` 隔离运行状态，则回复 `BLOCKED`。不要继续进行 Pydantic、Reducer 或字段置空的重复尝试。

---

## 5. 契约定义

### 5.1 输入对象

所有字段均由调用方显式提供；不得默认、生成、修剪后替换或静默纠正。

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

校验要求：

- `schema_version` 必须严格为字符串 `1.0`。
- `request_id`、`delivery_id`、`report_id` 必须是非空字符串；空白字符串也失败。
- `report_type` 只能为 `morning_scan`、`daily_review`、`holiday_digest`、`industry_research`。
- `report_date` 必须为有效 `YYYY-MM-DD` 日期。
- `version` 必须为 `v` 前缀语义版本，例如 `v1.0`、`v1.2`。
- 两个时间必须是带时区的 ISO-8601 字符串；不得以服务器当前时间补齐。
- 未知输入字段允许被忽略，但绝不能回显到对外响应。

### 5.2 成功结果（路径 A 的根级 `result`；路径 B 的 `result` 子对象）

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
  "summary_points": ["Phase 1 合同测试内容，不构成投资建议。"],
  "content_html": "<p>Phase 1 合同测试内容，不构成投资建议。</p>",
  "market_scopes": ["us_equities", "global_futures"],
  "industry_tags": [],
  "theme_tags": [],
  "source_links": [],
  "data_as_of": "2026-07-19T08:45:00+08:00",
  "generated_at": "2026-07-19T08:46:00+08:00"
}
```

成功结果规则：

- `delivery_type` 固定为 `report`；本次不实现标的池快照。
- 不得出现 `status`、`error_code`、`retryable`、`checksum`、`metrics`、`details`、运行状态、节点名或调试字段。
- `summary_points`、`market_scopes`、`industry_tags`、`theme_tags`、`source_links` 永远是数组。
- `content_html` 是固定、无外链、无脚本、无事件属性、无图片、无样式、无真实报告内容的最小 HTML。
- 早盘范围至少包含 `us_equities`、`global_futures`；复盘至少包含 `cn_a`；产业研究至少一个固定测试行业标签。

### 5.3 错误结果（路径 A 的根级 `result`；路径 B 的 `result` 子对象）

错误结果的**顶层键集合必须完全等于**以下五个键，顺序不重要：

```json
{
  "schema_version": "1.0",
  "request_id": "err-001",
  "status": "validation_error",
  "error_code": "INVALID_REPORT_TYPE",
  "retryable": false
}
```

- 不得含有任何成功字段，即使值为 `null`、空字符串、空数组或缺省占位。
- 当 `request_id` 缺失或无效时仍必须保留键，值为 `null`；其余四键仍必须存在。
- 允许错误码仅为：`MISSING_REQUIRED_FIELD`、`INVALID_SCHEMA_VERSION`、`INVALID_REPORT_TYPE`、`INVALID_REPORT_DATE`、`INVALID_VERSION`、`INVALID_TIMESTAMP`。
- 不得回显完整输入、正文、来源、未知字段、Token、堆栈、Prompt 或内部状态。

---

## 6. 实现要求

1. 先记录当前 `test_run` 的原始错误输出作为基线，再开始改动。
2. 删除或隔离会导致公开输出包含 `GlobalState` 的实现；Pydantic `model_serializer`、Reducer、过滤 `None` 等只能作为内部工具，不能充当对外边界方案。
3. 将输入验证、内部状态和最终公开结果分离为不同概念；不得因为内部状态需要字段，就让这些字段自动暴露。
4. 所有合法/非法路径最终都经过相同的公开输出边界，避免成功、错误的序列化机制不一致。
5. 不修改成功对象的字段语义；只解决其真实可见性与输出边界。
6. 不得把 `test_run` 的平台限制解释为应用端应当使用非公开 Python 方法；知行应用无法在 Coze 运行时调用 `model_dump()`。
7. 若平台没有输出映射能力，先停止并按第 4 节路径 B 的证据要求报告；不要继续无效迭代。

---

## 7. 测试与证据要求

### 7.1 必须新增/保留的内部测试

- 四种合法报告类型均符合成功结果字段集合。
- `daily`、`weekly`、`monthly` 和任意未知类型均返回 `INVALID_REPORT_TYPE`。
- 每个必填 ID 缺失/空白、错误 schema、错误日期、错误版本和无时区时间均返回指定错误码。
- 成功对象不存在任何错误字段；错误对象的键集合严格等于五键。
- 未知输入字段不回显。
- 静态扫描/测试证明没有网络、Webhook、文件上传、数据库、凭证读取、Skill 调用或其他外部副作用。

### 7.2 必须提供的真实平台验证

以下每项必须来自 Coze 的实际 `test_run` 原始响应，不能来自 Python 脚本：

1. 一份 `morning_scan` 成功响应。
2. 一份 `daily_review` 成功响应。
3. 一份 `industry_research` 成功响应。
4. 一份 `daily` 非法类型响应。
5. 一份缺失 `request_id` 的错误响应。

对每份响应必须显示：完整原始 JSON、使用的路径（A 或 B）、顶层键集合、实际运行方式和时间。不得用截图裁剪、UI 摘要或文字转述替代 JSON。

### 7.3 对外 API 验证边界

- 本次禁止部署或配置凭证，因此不能伪称已完成“应用调用 Coze API”。
- 若 Coze 当前没有一个不部署、不配凭证也可调用的官方测试入口，应如实标记为“未验证”，不要制造模拟 HTTP 结果。
- 只有后续由知行侧单独授权、明确 API 入口与认证方式后，才能做真实服务端调用验证。

---

## 8. 最终回复模板（必须遵守）

最终回复只能是以下两种之一。

### 8.1 通过路径 A 的回复

1. 说明采用“路径 A：平台级最终输出映射”。
2. 列出修改文件和变更目的。
3. 附上第 7.2 节五份完整原始 `test_run` JSON 及字段集合断言。
4. 附上内部测试命令、总数、通过数、失败数。
5. 用逐项清单确认所有禁止行为均未发生，并确认没有部署记录。
6. 明确写出：“Workflow 输出契约测试通过；Coze API 调用与认证仍未验证。”

### 8.2 阻塞或路径 B 候选回复

1. 首行写 `BLOCKED` 或 `PATH_B_CANDIDATE`，不得写“完成”或“通过”。
2. 提供路径 A 真实失败/限制的原始 `test_run` 证据。
3. 给出路径 B 的完整稳定包装器 JSON 示例与其真实 `test_run` 证据；若没有，也必须如实说明。
4. 列出未执行的禁止项，确认无部署和无凭证变更。
5. 不得要求知行应用去调用 `model_dump()`，不得建议解析任意 GlobalState。

---

## 9. 最终验收门槛

仅当以下全部满足，知行侧才可将本 Workflow 标记为“输出契约测试通过”：

- 路径 A 被真实 `test_run` 证明，或路径 B 已由知行侧另行明确确认。
- 错误真实响应严格只有五个顶层字段；不接受 `null` 成功字段。
- 成功真实响应不含内部状态、输入回显之外的未知字段、旧骨架或错误字段。
- 所有实测 JSON 与本文件字段、类型、枚举完全一致。
- 无部署记录，且所有安全边界未被突破。
- Coze API 调用/认证的未验证状态被明确保留，不得提前宣布端到端打通。

未满足任何一项即为未通过；不得通过文字解释降低门槛。
