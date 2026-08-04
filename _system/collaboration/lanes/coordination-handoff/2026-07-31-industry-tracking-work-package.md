# industry_tracking 离线切片：工作包与交接顺序

> 状态：用户已批准最终设计；尚未派发实施任务。
>
> 设计唯一依据：[2026-07-31-industry-tracking-offline-slice-design.md](../../../../docs/superpowers/specs/2026-07-31-industry-tracking-offline-slice-design.md)
>
> 本文件用途：供四个长期岗位安排交接，不替代正式规格、实施计划或业务代码。

## 1. 已固定的结论

- 每个报告日只生成 **1 份** `industry_tracking` 汇总报告，不按行业拆成多份报告。
- 报告同时包含固定核心关注单元与最多 3 个每日特别关注单元；同一 `focusId` 不得在同一报告中重复成章。核心单元突出时仍保持 `core` 身份，只填 `highlightReason`。
- 报告级 `industryTags` 是全部章节申万一级行业标签的去重并集。主题选择仅由 `selectedThemeIds` 输入驱动，并单向派生为结构化 `themes[]`（`themeId`、`displayName`、`focusIds`、`industryTags`）；赛道展示名不是归档行业标签。
- 当前代表性 fixture 完整覆盖固定核心 8 项：`ai_plus` 为 `warming`、`advanced_chips` 为 `diverging`、`new_energy_equipment` 为 `insufficient`、`embodied_intelligence` 为 `continuing`，其余四项可为合规的 `insufficient`；每日特别关注固定为候选池中的 `robotics`。fixture 不代表真实市场事实或真实 A 股交易日。
- 趋势只依据调用方显式提供的当期/对比期变化与来源编号。前期判断仅可审计展示；引擎不得读文件、读取历史结果、计算市场趋势或调用模型补写结论。
- 行业级证据不足应降级展示；遗漏核心章节、无任何有效行业证据或来源不合格必须整份报告失败关闭。
- 本切片不实现 `watchlist_snapshot`、标的池更新、`industry_research` 生成、正式 PDF/Chromium、`generatedAt`、交易日历、调度、归档、发布、通知或外部接入。
- 已验收的 `morning_scan`、`midday_review`、`daily_review` 与共享视觉渲染器必须保持行为不变。

## 2. 不可突破的实施边界

- 不接真实数据、网络、模型、环境变量、Coze、Vercel、Supabase、日程、用户、归档、发布、通知或 PDF 生成。
- 不读取文件、此前运行结果、系统时间或任何外部服务来补充输入；所有数据只能来自调用方内存中的固定夹具。
- 不输出个性化持仓、买卖、仓位、目标价、止损、收益承诺或“荐股池”表述。
- HTML 正文只能由固定模板生成，继续采用受控语义标签、既有 `td[data-label]` 规则和共享视觉外壳；不得接收 `draftHtml`。

## 3. 实施前必须汇总的四项产物

| 编号 | 产物 | 责任岗位 | 验收要点 |
|---|---|---|---|
| A | 已批准最终设计快照 | coordination-handoff | 引用唯一设计稿；固定结论与边界无二义性。 |
| B | 实施计划与文档变更清单 | specification-validation | 只在 `docs/**` 建立实施计划，列明输入契约、测试矩阵、后续文档同步点；不重写已批准设计。 |
| C | 代码改动面与回归基线报告 | report-engine-development | 只读运行既有测试并列出拟改模块/测试文件、基线测试数和无外部能力边界；尚不实现。 |
| D | 实施前安全与质量检查表 | safety-quality-review | 只读确认失败关闭、行业级降级、双层输出、HTML/合规、兼容性和静态扫描口径。 |

协调岗位只有在 A–D 均已回传、且没有需用户裁决的规范冲突时，才派发实施任务。B、C、D 可并行完成，但不得修改同一业务文件。

## 4. 阶段与依赖顺序

```text
用户已批准最终设计
  → 阶段 0：coordination-handoff 发布本工作包
  → 阶段 1：specification-validation / report-engine-development / safety-quality-review 并行完成 A–D 的准备产物
  → 协调汇总：确认设计、计划、基线与预检没有冲突
  → 阶段 2：report-engine-development 单独实施并测试
  → 阶段 3：safety-quality-review 只读复审；发现问题时串行返还开发岗位修正
  → 阶段 4：specification-validation 在实现验收后同步 docs/current-status 与架构/输出标准
  → 阶段 5：coordination-handoff 汇总最终证据与剩余风险
```

阶段 2 与阶段 4 串行，避免代码实现和正式文档同时改变同一契约语义。任何涉及真实数据源、交易日历、正式 PDF、调度、发布、用户或 `watchlist_snapshot` 的诉求都超出本工作包，必须由主协作者另行取得用户确认。

## 5. 后续岗位写入范围与交接要求

| 岗位 | 后续允许写入 | 不得写入 | 交接必须包含 |
|---|---|---|---|
| coordination-handoff | `.starwork/handoff/**`、`_system/collaboration/agent-lanes.md`、`_system/collaboration/shared.md`、本 lane 目录 | 业务代码、正式设计、外部配置 | 派单证据、依赖状态、冲突、最终汇总。 |
| specification-validation | `docs/**` | `report-engine/**`、外部配置 | 计划/文档清单、核对结果、与设计稿的偏差（如有）。 |
| report-engine-development | `report-engine/**`、`.superpowers/sdd/**` | `docs/**`、外部配置 | 改动文件、修复前后测试数、静态边界扫描、风险。 |
| safety-quality-review | 仅本 lane 审查记录 | 业务代码、正式文档、外部配置 | 已解决/未解决发现、严重级别、复审范围、是否引入回归。 |

每次跨岗位消息必须在宿主线程工具真实送达后，再记录 StarWork 请求。消息送达不等于任务完成；完成结论必须来自目标岗位的明确回传。

## 6. 实施任务的最小验收门槛

- 仅支持 `industry_tracking`，单请求只返回一份报告；未知类型失败关闭。
- 核心/每日特别关注分区、结构化章节、来源编号、`industryTags`、由 `selectedThemeIds` 单向派生的结构化 `themes[]`、固定栏目、风险提示和安全 HTML 相互可追溯。
- 覆盖设计稿第 11 节的成功与失败场景，且既有三类报告与共享视觉渲染器回归不退化。
- 测试和静态扫描不出现网络、环境变量、模型、Coze、Vercel、Supabase、调度或 PDF 渲染调用。
- 任何实现期发现的设计缺口先由协调岗位汇总；不得用临时默认值、伪造来源或模型推断绕过。
