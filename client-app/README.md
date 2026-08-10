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
npm.cmd run test:e2e
```

浏览器端 E2E 使用 Playwright 驱动本机已安装的 Google Chrome，并由测试命令在
`127.0.0.1:4173` 启动和回收专用 Vite 服务。运行前请先安装 Google Chrome；当前不依赖
Playwright 下载的 Chromium，是因为该浏览器包在 Windows 开发环境中下载超时，而系统
Chrome 已能稳定覆盖本项目的浏览器回归范围。测试不会复用已有服务，所有非本地请求都会
被阻断。

生产依赖安全检查：

```powershell
npm.cmd audit --omit=dev --audit-level=high
```
