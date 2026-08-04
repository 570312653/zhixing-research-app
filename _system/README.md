# 知行项目工作系统

本目录只保存“知行投顾报告应用”的工作状态、决策、任务、日志、经验和多 Agent 交接信息。

## 存档边界

- `$save`、`存档`、`保存进展`只写入本目录。
- 不向 `D:\Codex\AI工作系统`同步本项目进度。
- 找不到本目录时停止存档，不使用其他目录兜底。
- 不在工作系统中保存 Token、Cookie、密钥、生产数据或完整报告正文。

## 信息职责

| 内容 | 文件 |
| --- | --- |
| 当前项目摘要 | `context/current-projects.md` |
| 已确认决策 | `context/decisions.md` |
| 当前待办 | `tasks/todo.md` |
| 已完成事项 | `tasks/done.md` |
| 当日工作日志 | `diary/YYYY-MM-DD.md` |
| 可复用纠正与经验 | `lessons/README.md` |
| 稳定协作偏好 | `identity/README.md` |
| 多 Agent 岗位与交接 | `collaboration/` |
| 纠错与迁移备份 | `archive/` |

## 权威来源

1. 项目规则与安全边界：根目录 `AGENTS.md`。
2. 当前工程状态：`docs/current-status.md`。
3. 架构路线：`docs/report-engine-architecture.md`。
4. 本目录保存上述信息的精简恢复摘要，不替代工程文档。

## 更新原则

- 只记录已完成、已确认或用户明确提出的行动项。
- 状态文件做最小修改，日记只追加。
- 同一成果只保留一个主要记录位置，其余文件使用链接或一句摘要。
- 发生误写时先备份和记录哈希，再做最小清理。
