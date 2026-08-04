# Agent Lanes

## Lanes

| lane | purpose | current_session | write_scope | worklog | workspace |
|---|---|---|---|---|---|
| report-engine-development | 扩展离线报告引擎的固定样例、契约实现与测试；禁止真实数据、联网、模型、密钥和部署。 | codex:019fae9b-974d-7972-9072-2f9fdc67fe80 | report-engine/**,.superpowers/sdd/** | lanes/report-engine-development/worklog.md | lanes/report-engine-development/workspace |
| specification-validation | 维护规格、架构与实现一致性；只整理已确认文档并提交验收结论。 | codex:019fae9b-9ba7-71f1-bd11-b3b2c0c23402 | docs/** | lanes/specification-validation/worklog.md | lanes/specification-validation/workspace |
| safety-quality-review | 只读审查合规边界、测试覆盖与风险；不修改业务代码或外部服务配置。 | codex:019fae9b-9fe9-7231-97be-d070280f32e2 | _system/collaboration/lanes/safety-quality-review/** | lanes/safety-quality-review/worklog.md | lanes/safety-quality-review/workspace |
| coordination-handoff | 拆分任务、汇总结果并维护交接；不替代专业岗位修改业务实现。 | codex:019fae9b-a455-7bd0-be2a-57d30bf56086 | .starwork/handoff/**,_system/collaboration/agent-lanes.md,_system/collaboration/shared.md,_system/collaboration/lanes/coordination-handoff/** | lanes/coordination-handoff/worklog.md | lanes/coordination-handoff/workspace |
