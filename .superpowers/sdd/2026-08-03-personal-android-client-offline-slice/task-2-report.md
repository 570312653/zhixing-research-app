# Task 2 实现报告：单一视觉 Token 与应用外壳

## 范围与提交

- 需求来源：`task-2-brief.md`；仅完成 Task 2。
- 实现提交：`45a5245139e9120390f92bb9dc09f4d0b063d71f`（`feat: add offline client visual shell`）。
- 未创建 `client-app/android/`，未实现 Task 3 页面正文、原生 Android 平台、网络请求、真实数据或凭证。

## TDD 记录

### RED 1：Token 注入与详情路由激活

命令：

```powershell
npm.cmd test -- --run src/layout/AppShell.test.tsx
```

实际结果：失败（2 个测试失败）。根元素的 `--color-brand-primary` 实际为 `''`，而预期为 `#1E3A8A`；`#/reports/example` 被通配路由重定向到“今日”，未激活“报告库”。这是预期的功能缺失，不是测试拼写或运行错误。

### GREEN 1：Token、壳层与导航

实现 CSS Token、`tokens.ts` 引用、全局样式、`AppShell`、内联 SVG 底部导航和详情前缀路由后，命令：

```powershell
npm.cmd test -- --run src/layout/AppShell.test.tsx
```

实际结果：通过（2/2）。为让 Vitest 处理应用实际导入的 CSS 并通过注入后的计算样式验证，`vite.config.ts` 设置了 `test.css: true`；测试未用正则或文本匹配断言 CSS 源码。

### RED 2：壳层内滚动

命令：

```powershell
npm.cmd test -- --run src/layout/AppShell.test.tsx
```

实际结果：失败（1 个测试失败）。`.app-shell` 的计算 `height` 为 `auto`，但预期 `100dvh`，因此尚不能保证主体滚动区域和底栏始终固定在视口内。

### GREEN 2：视口高度约束

为 `.app-shell` 加入 `height: 100dvh` 后，命令：

```powershell
npm.cmd test -- --run src/layout/AppShell.test.tsx
```

实际结果：通过（3/3）。

## 最终验证

在 `client-app/` 运行：

```powershell
npm.cmd test -- --run
npm.cmd run build
npm.cmd run lint
npm.cmd audit --omit=dev --audit-level=high
```

实际结果：Vitest 2 个文件、4 个测试全部通过；TypeScript 与 Vite 构建通过；OXLint 通过；高危及以上生产依赖审计为 `found 0 vulnerabilities`。

390px 浏览器核验使用本地 Vite 服务、已安装的本机 Chrome 和 Playwright（未访问外网），打开 `#/reports/example`。结果：

- 视口 `390px`、文档 `scrollWidth` 为 `390px`，无横向滚动。
- 壳层实际高度 `844px`，主内容 `overflow-y: auto`。
- 底部导航最小高度 `90px`，顺序为“今日、报告库、研究、我的”。
- 详情路径激活“报告库”；没有 Vite 错误覆盖层。
- `prefers-reduced-motion: reduce` 下导航过渡时长为 `1e-05s`，非必要动效关闭。
- 安全区规则使用 `env(safe-area-inset-top/bottom, 0px)`；桌面核验中的安全区为零值回退。

## 文件

新增：

- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\styles\tokens.css`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\styles\tokens.ts`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\styles\global.css`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\layout\AppShell.tsx`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\layout\BottomNavigation.tsx`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\layout\AppShell.test.tsx`

修改：

- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\App.tsx`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\src\main.tsx`
- `D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\vite.config.ts`

## 自审与风险

- `tokens.css` 是色彩、字体、间距、圆角、描边、阴影、动效与 90px 底栏高度的唯一实际值来源；`tokens.ts` 仅产生 `var(--...)` 引用。
- 组件样式只消费 CSS 自定义属性；导航采用真实 `NavLink`、可读文本、`aria-current="page"` 与 `aria-hidden` 内联 SVG 状态。
- 没有触及 `report-engine/src/`，没有引入数据源、密钥、服务端地址或业务网络请求。
- 风险：本机浏览器只能验证安全区的 `0px` 回退；后续真机 Android 验收应复核带刘海或手势导航设备上的 `env(safe-area-inset-*)` 实际值。这不阻塞本任务的离线 Web 壳层交付。
