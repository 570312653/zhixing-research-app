# 知行客户端 UI/UX 工作包

> 状态：**已准备，尚未分发**  
> 日期：2026-08-02  
> 调度门槛：主对话先集中问完关键问题，形成用户确认的结论文档后，才能通过宿主会话工具正式分发。

## 1. 目标

为个人 Android APK 建立完整、可验收的 UI/UX 规格和原型范围，使后续工程初始化有稳定设计输入。当前只做产品和技术边界设计，不写客户端代码、不安装工具链、不接入数据或外部服务。

## 2. 已确认基线

- 仅项目所有者本人使用；第一版为私有分发 Android APK。
- 客户端采用 Capacitor；未来通过受保护应用 API 读取可信云端报告引擎的私有内容。
- 客户端包含今日报告、报告库、报告详情、行业跟踪、核心关注标的池、PDF 与个人操作页。
- 已有四类离线固定样例：`morning_scan`、`midday_review`、`daily_review`、`industry_tracking`。
- 报告详情沿用已确认的桌面表格、手机逐条信息卡和 A4 打印视觉语义。
- 不开放注册、共享阅读、订阅、收费、社交、自动交易或个性化投资建议。

## 3. 主对话需集中确认的问题

1. 主导航：底部导航数量、页面命名、行业与标的池是否独立入口。
2. 今日报告：首页信息密度、四类报告排序、未生成/生成中/失败/过期状态与快捷操作。
3. 报告库：日期、类型、行业/主题筛选，搜索方式，版本历史和 PDF 入口。
4. 行业与标的池：总览层级、详情层级、趋势证据、历史变化和风险提示如何呈现。
5. 个人操作页：任务状态、重试、刷新、应用版本和诊断信息的可见范围。
6. 离线策略：允许阅读的缓存范围、最后同步时间、过期提示和手动刷新行为。
7. 视觉品牌：名称、图标、主色、字号、卡片密度、图表使用原则和深色模式是否后置。
8. 关键交互：返回、筛选、收藏/置顶（若需要）、下载 PDF、失败重试及横竖屏行为。

## 4. 计划中的岗位分工（尚未派发）

| 岗位 | 预期任务 | 可整理文件 | 验收交接 |
|---|---|---|---|
| coordination-handoff | 汇总用户确认、控制范围、生成统一任务与冲突清单 | 本工作包、项目本地协作记录 | 交付唯一确认稿和明确未决项 |
| specification-validation | 输出信息架构、页面/组件清单、状态矩阵和验收标准 | `docs/` 下客户端 UI/UX 规格 | 与产品需求、架构、当前状态一致 |
| report-engine-development | 只读评估固定样例数据可否支撑各页面及未来 API 边界 | 可行性评审或字段差距清单 | 不修改报告引擎，不虚构字段 |
| safety-quality-review | 复核鉴权、离线、空/错/过期状态和敏感信息暴露 | 安全与质量评审清单 | 给出风险等级、反例和验证方法 |

## 5. 写入和范围边界

- 未经用户确认，不创建客户端工程、不修改 `report-engine/`、不初始化 Git、不安装 Android 工具链。
- 不读取、复制、展示或迁移任何环境变量值、Token、API Key 或历史敏感文件内容。
- iFind 仍是候选，不在 UI 中伪装为已接入数据源。
- 任何岗位交付必须先写清输入、允许修改范围、禁止项、输出路径和验收条件。
- 只有宿主会话工具返回可验证结果后，才能把请求状态记录为已送达；否则保持 `prepared_not_dispatched`。

## 6. 正式参考资料

- `AGENTS.md`
- `docs/product-requirements.md`
- `docs/report-engine-architecture.md`
- `docs/current-status.md`
- `docs/superpowers/specs/2026-08-01-personal-android-apk-client-design.md`
- `docs/proposals/2026-08-01-personal-android-apk-change-proposal.md`
- `docs/proposals/2026-08-01-project-work-system-audit-and-master-roadmap.md`
- `docs/proposals/2026-08-01-foundation-readiness-checklist.md`
