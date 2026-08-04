# 知行项目文档地图

> 标签：协同  
> 最后更新：2026-08-01  
> 用途：帮助人和 AI 快速找到当前有效的事实、实施计划和历史审计资料。

## 先读什么

开始任何项目任务前，按以下顺序阅读：

1. ../AGENTS.md：长期协作规则、当前最高优先级决定与安全边界。
2. current-status.md：当前阶段、已完成切片、下一步和明确禁止项。
3. report-engine-architecture.md：正式候选技术路线与外部能力门槛。
4. 与任务直接相关的规格或计划，例如 docs/superpowers/specs/ 和 docs/superpowers/plans/。

涉及报告内容、字段或格式时，还必须阅读 coze-report-output-standard.md。文件名保留历史名称，但它是生成引擎无关的当前内容标准，不要求 Coze 参与。

## 当前有效文档

| 文件或目录 | 标签 | 作用 | 维护规则 |
|---|---|---|---|
| AGENTS.md | 协同 | 项目长期规则、已确认决定、恢复说明 | 仅在用户确认的重大进展或规则变化后更新；不要把日常初始化日志写入其中。 |
| docs/product-requirements.md | 协同 | 个人 Android APK 的产品定位、内容节奏与客户端范围 | 产品决策变化时先确认，再同步更新。 |
| docs/report-engine-architecture.md | 协同 | 个人 Android APK、报告引擎、数据与安全边界 | 架构、外部能力或阶段状态变化后同步更新。 |
| docs/proposals/2026-08-01-personal-android-apk-change-proposal.md | 协同 | 已确认的产品路线变更依据 | 保留为变更审计记录；后续正式事实以产品需求与架构文档为准。 |
| docs/coze-report-output-standard.md | 协同 | 报告内容、字段语义、格式与验收标准 | 变更报告类型或输出字段前先更新并确认。 |
| docs/current-status.md | AI写 | 项目级短状态页 | 每个已确认切片收尾后更新；不得替代产品或架构事实源。 |
| docs/superpowers/specs/2026-07-30-report-visual-template-design.md | 协同 | 已确认的早盘、午间与每日复盘视觉模板规范 | 修改三端版式、视觉令牌或 HTML→PDF 映射前先确认。 |
| docs/superpowers/specs/2026-07-30-report-visual-renderer-offline-slice-design.md | 协同 | 共享完整 HTML 渲染器的安全边界和实现设计 | 修改页面外壳、动态正文属性边界或打印策略前先确认。 |
| docs/superpowers/plans/2026-07-30-report-visual-renderer-offline-slice.md | AI写 | 共享视觉渲染器的已执行计划和验收证据 | 只按实际完成情况勾选，不把打印 CSS 写成 PDF 已完成。 |
| docs/superpowers/specs/ | 协同 | 已确认的切片设计 | 先出草案、确认后再作为实施依据。 |
| docs/superpowers/plans/ | AI写 | 可执行实施计划与验收步骤 | 只在步骤实际完成并验证后勾选。 |
| .superpowers/sdd/ | AI写 | 切片任务简报、实施报告与复审证据 | 过程账本；不作为产品事实或最终架构的唯一来源。 |

## 历史审计资料

以下资料保留用于追溯，不得作为新功能的实现依据：

- docs/coze-report-contract.md
- docs/coze-market-research-agent-build-plan.md
- docs/phase1-*.md
- docs/clean-skill-build-brief.md
- docs/coze-skill-correction-brief.md
- phase1-webhook-test/

它们当前不移动、不删除。若未来要归档迁移，必须先检查链接和审计需求，再单独确认。

## 文件职责与流转

### 人填

- 真实数据供应商、模型供应商、商业授权、管理员名单、对外合规决定。
- 用户提供的原始资料、外部账号信息、密钥和值。

AI 不得编造、猜测、读取或记录上述敏感或事实性内容。

### AI写

- 经用户确认的实施计划、测试报告、任务账本和项目状态摘要。
- report-engine/ 内已获确认切片的代码与测试。

### 协同

- AGENTS.md、产品需求、架构、内容输出标准、设计规格。
- AI 先给出影响范围和变更草案；用户确认后再写入。

### 草稿到确认再到定稿

1. 涉及架构、数据、权限、外部服务、报告类型或主要 UI 的内容，先在对话中说明方案、影响和验收方式。
2. 用户确认后，才修改正式文档或代码。
3. 实现完成后，记录验证证据、未解决风险和下一步。
4. 过期的 POC、旧方案和历史记录保留审计价值；不删除、不覆盖，先在本文档中标明其状态。

## 写入边界

- report-engine/：只处理当前获确认的离线切片；禁止接入真实数据、模型、网络、环境变量、Coze、Vercel、Supabase、日程、用户、归档、发布或通知。
- phase1-webhook-test/：历史隔离 POC，禁止继续扩展为正式能力。
- docs/：重要变更必须与代码和当前架构一致；无法确定时先询问。
- 不得把 Token、API Key、用户个人数据或完整敏感响应写入代码、文档、日志、截图或测试夹具。
