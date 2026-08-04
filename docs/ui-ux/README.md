# 知行客户端 UI/UX 确认稿

本目录保存用户逐页确认的客户端设计资产。它们是后续实现和验收的正式视觉参考，不代表客户端代码已经完成。

页面级 UI/UX 总稿以及 App 图标、启动页和统一设计 Token 已于 2026-08-03 获用户批准。客户端 UI/UX 设计阶段已经收口；这不代表 Android 工程或 APK 已经完成。

## 固化规则

- 每个页面在主对话完成需求确认和视觉确认后，保存独立 HTML 页面稿与 PNG 快照。
- 页面规则、状态和交互仍以客户端总设计规格为最终依据；页面稿不得自行扩展业务范围。
- 临时讨论稿位于 `.superpowers/brainstorm/`，不作为正式实现依据。
- 全部页面确认后，再统一更新 `docs/superpowers/specs/2026-08-01-personal-android-apk-client-design.md` 的状态和完整页面规范。
- 后续集中决策表继续使用既有的“编号 / 问题 / A / B / C / 推荐 / 你的选择或意见”格式；推荐草案必须明确标注尚未确认，用户明确确认后才能回填选择。

## 已确认页面

| 页面 | 状态 | HTML | PNG |
|---|---|---|---|
| 今日报告 | 已确认（2026-08-02） | [today-report.html](./screens/today-report.html) | [today-report.png](./screens/today-report.png) |
| 报告库 | 已确认（2026-08-02） | [report-library.html](./screens/report-library.html) | [report-library.png](./screens/report-library.png) |
| 报告详情 | 已确认（2026-08-02） | [report-detail.html](./screens/report-detail.html) | [report-detail.png](./screens/report-detail.png) |
| 研究总览 | 已确认（2026-08-02） | [research-overview.html](./screens/research-overview.html) | [research-overview.png](./screens/research-overview.png) |
| 行业列表 | 已确认（2026-08-02） | [research-industry-list.html](./screens/research-industry-list.html) | [research-industry-list.png](./screens/research-industry-list.png) |
| 行业详情 | 已确认（2026-08-02） | [research-industry-detail.html](./screens/research-industry-detail.html) | [research-industry-detail.png](./screens/research-industry-detail.png) |
| 标的池 | 已确认（2026-08-02） | [research-watchlist.html](./screens/research-watchlist.html) | [research-watchlist.png](./screens/research-watchlist.png) |
| 标的详情 | 已确认（2026-08-02） | [research-watchlist-detail.html](./screens/research-watchlist-detail.html) | [research-watchlist-detail.png](./screens/research-watchlist-detail.png) |
| 我的 / 个人操作页 | 已确认（2026-08-02） | [my-operations.html](./screens/my-operations.html) | [my-operations.png](./screens/my-operations.png) |

## 已确认通用规范

| 规范 | 状态 | 决策表 | HTML | PNG |
|---|---|---|---|---|
| 跨页面状态（正常、加载、空、失败、离线及旧内容叠加） | 已确认（2026-08-02） | [cross-page-states-v1.md](./decision-forms/cross-page-states-v1.md) | [cross-page-states.html](./screens/cross-page-states.html) | [cross-page-states.png](./screens/cross-page-states.png) |
| 品牌视觉基础（图标、启动页、设计 Token） | 已确认（2026-08-03） | [brand-foundation-v1.md](./decision-forms/brand-foundation-v1.md) | [brand-foundation.html](./screens/brand-foundation.html) | [brand-foundation.png](./screens/brand-foundation.png) |

## 工程交接

- 页面地图、导航关系、共享组件、状态模型和工程验收清单见 [client-ui-ux-handoff.md](./client-ui-ux-handoff.md)。
- “今日报告”的完整确认记录见 [today-report-v1.md](./decision-forms/today-report-v1.md)。
- Git/安全边界、客户端技术和 Android 参数见 [2026-08-03-client-engineering-preflight-decisions.md](../superpowers/specs/2026-08-03-client-engineering-preflight-decisions.md)。
- 地基与客户端实施计划见 [2026-08-03-client-foundation-readiness.md](../superpowers/plans/2026-08-03-client-foundation-readiness.md) 和 [2026-08-03-personal-android-client-offline-slice.md](../superpowers/plans/2026-08-03-personal-android-client-offline-slice.md)。
- `.superpowers/brainstorm/` 只保存讨论过程，不作为工程实现依据。

## 已确认的视觉基础

- 正式方向：深海蓝研究院；专业、克制、可信、阅读优先。
- App 图标：折页与路径的 Android 自适应图标，不放文字。
- Android 启动页：浅灰白背景，居中图标、“知行”和“个人市场研究”，不显示伪任务状态。
- 统一 Token：主色、字体、字号、间距、圆角、阴影、描边、状态色和动效均已确认。
- 完整规格见 [2026-08-03-brand-visual-foundation-design.md](../superpowers/specs/2026-08-03-brand-visual-foundation-design.md)。
