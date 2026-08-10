# Task 8 浏览器端 E2E 回归实施报告

## 结果

- 状态：完成，存在一项测试浏览器可移植性说明，见“关注事项”。
- 分支：`feature/android-client-offline`。
- 基线：`5ac8efc96a6d74ab3bda27531764dd41151cee43`。
- 范围：只新增浏览器 E2E、测试专用状态夹具入口和必要的测试/构建配置；未改变已批准 IA、领域语义或默认生产行为，未接入真实网络、API、数据、环境变量或密钥。
- 文档判断：本任务未调整主要页面、路由层级、数据模型、权限或正式交互，因此未修改 `/docs` 正式规范。

## 实现摘要

1. 新增 Playwright 配置与 14 项浏览器 E2E，覆盖：
   - 九个批准页面及 `/#/...` Hash 深链；
   - 底部四入口顺序、未知路由回退和报告详情沉浸式导航；
   - 报告、行业、标的和关联报告的交叉导航及受控返回路径；
   - 报告库搜索、类型/行业筛选、空结果与清除筛选；
   - 行业、标的池搜索筛选；
   - 加载、空、失败、离线缓存和过期内容状态；
   - 390px 九页无横向溢出、底部导航与视口安全边界；
   - 不存在分享、交易、成员、订阅或编辑入口。
2. Playwright Web Server 只绑定 `127.0.0.1:4173`，`reuseExistingServer: false`；共享 fixture 对所有非本地请求执行 `route.abort('blockedbyclient')`。
3. 新增测试状态夹具层：
   - 默认模块 `e2eState.ts` 永远返回 `null`；
   - 仅 `vite serve --mode e2e` alias 到 `e2eState.enabled.ts`，读取 Playwright 在页面初始化前写入的固定状态；
   - `__ZHIXING_E2E__` 是 Vite 编译期常量，只有 `command === 'serve' && mode === 'e2e'` 时为真；普通 production build 和 `vite build --mode e2e` 都会裁掉整个测试分支。
4. Vitest 收窄到 `src/**/*.test.{ts,tsx}`，避免把 Playwright `e2e/*.spec.ts` 错交给 Vitest。

## RED → GREEN 证据

### RED

- 首次 `npm.cmd run test:e2e` 未进入行为断言，因为缺少 Playwright Chromium；这次只视为环境错误，不作为有效 RED。
- 两次 `npx.cmd playwright install chromium` 均因本机 Playwright 缓存锁/无下载输出而超时；随后按 Playwright 官方 `channel: 'chrome'` 使用本机已安装 Chrome。
- 使用系统 Chrome 后的有效 RED：11 项中 6 项通过、5 项失败。
  - 3 项状态用例按预期因测试状态注入尚不存在而失败；
  - 2 项分别暴露测试标签歧义和研究页面异步稳定等待问题，修正测试本身后再进入 GREEN。
- 首次 production `dist` 标记扫描发现 `E2E_FIXED_*` 字符串仍被打包；该审计作为生产隔离的 RED，随后改为编译期整段裁剪。

### GREEN

- 状态 focused E2E：6/6 通过。
- 研究 focused E2E：2/2 通过。
- 全量 E2E：14/14 通过。
- production 默认构建和 `vite build --mode e2e` 均不含 `__ZHIXING_E2E_STATE__`、`E2E_FIXED_FAILURE`、`E2E_FIXED_STALE` 或测试模块标记。

## 最终验证

工作目录均为本 worktree 内对应子目录。

| 验证 | 结果 |
|---|---|
| `client-app: npm.cmd run test:e2e` | PASS，14/14 |
| `client-app: npm.cmd test -- --run` | PASS，149/149 |
| `client-app: npm.cmd run build` | PASS |
| `client-app: npm.cmd run lint` | PASS |
| `client-app: npm.cmd audit --omit=dev` | PASS，0 vulnerabilities |
| `client-app: npx.cmd vite build --mode e2e` + production marker scan | PASS，测试夹具仍不可达且无标记泄漏 |
| `report-engine: npm.cmd test` | PASS，124/124 |
| `report-engine: npm.cmd run build` | PASS |
| 客户端生产边界扫描 | PASS，无网络、环境变量、凭证、Coze、Supabase、Vercel 标记 |
| 报告引擎边界扫描 | PASS，无 `fetch`、环境变量、Coze、Supabase、Vercel、Playwright、Puppeteer 标记 |
| E2E 来源扫描 | PASS，运行时地址只有 `http://127.0.0.1:4173` |
| `git diff --check` | PASS |

## 生成或修改文件

- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\playwright.config.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\e2e\fixtures.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\e2e\navigation.spec.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\e2e\report-library.spec.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\e2e\research.spec.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\e2e\states.spec.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\test-fixtures\e2eState.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\test-fixtures\e2eState.enabled.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\vite-env.d.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\App.tsx`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\vite.config.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\package.json`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\.superpowers\sdd\2026-08-03-personal-android-client-offline-slice\task-8-report.md`

## 关注事项

- Playwright 1.62.1 对应的自带 Chromium 未成功安装；当前配置使用本机系统 Chrome 通道并已完成全部验证。若在没有 Chrome 的新环境运行，需要先安装 Playwright Chromium，并将 `channel: 'chrome'` 调整为项目统一的浏览器策略，或确保该环境提供 Chrome。
- 未推送、未创建 PR、未修改 `main`。
