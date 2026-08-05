# 知行客户端

这是“知行”个人市场研究工具的客户端工程。目前只包含可测试、可构建的离线 Web 应用壳，以及供后续 Capacitor 封装使用的基础配置。

当前范围：

- React、Vite、TypeScript 和 Hash 路由骨架。
- “今日 / 报告库 / 研究 / 我的”四个固定导航入口。
- 固定、去敏的占位内容。

当前不包含：

- Android 原生平台目录、应用图标或启动页；这些属于实施计划的 Task 9。
- 网络请求、真实市场数据、服务端地址、认证信息或任何密钥。
- 正式报告页面和后续业务功能。

## 本地验证

```powershell
npm.cmd test -- --run
npm.cmd run build
npm.cmd run lint
```

生产依赖安全检查：

```powershell
npm.cmd audit --omit=dev --audit-level=high
```
