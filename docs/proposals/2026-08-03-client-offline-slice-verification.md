# 知行个人 Android 离线客户端切片验证记录

> 验证日期：2026-08-11～2026-08-12
>
> 当前结论：**模拟器与真机验收通过**
>
> 产物性质：仅供开发验收的 Android Debug APK，不是正式分发包。

## 1. 验证范围

本记录覆盖离线固定样例客户端的 Android 构建、API 36 模拟器安装、用户自有真机安装、九个批准页面、页面内返回路径、离线冷启动、禁用操作、APK 静态安全检查，以及客户端和报告引擎全量回归。

本轮没有接入真实数据、认证、云端 API、调度、PDF、通知或任何生产密钥；也没有生成 release keystore。

## 2. 构建环境

| 项目 | 结果 |
|---|---|
| 分支 | `feature/android-client-offline` |
| Android SDK | `C:\Users\Admin\AppData\Local\Android\Sdk` |
| 模拟器 | `Zhixing_API_36` |
| 模拟设备 | `sdk_gphone64_x86_64` |
| Android | Android 16 / API 36 |
| Gradle | 8.14.3 `bin` 官方发行包 |
| 构建 JDK | Eclipse Temurin 21.0.12 LTS |
| 本地 JDK 路径 | `C:\Users\Admin\.gradle\jdks\temurin-21.0.12+8` |

Android Studio 自带 JBR 25，当前 Gradle/Groovy 构建链不能用它执行项目构建，因此命令行构建显式使用项目验证过的便携 JDK 21。该 JDK 未注册为系统 Java，也未修改全局 `PATH`。

项目位于包含中文字符的 Windows 路径中。Android Gradle Plugin 的旧路径保护会主动拒绝构建，因此项目使用官方提供的 `android.overridePathCheck=true`。实际完整构建已经通过；若未来工具链再次出现路径编码问题，再迁移到纯英文 worktree，不提前维护第二份工程目录。

## 3. APK 产物

| 项目 | 值 |
|---|---|
| 文件 | `client-app/android/app/build/outputs/apk/debug/app-debug.apk` |
| 大小 | 4,764,935 bytes |
| SHA-256 | `781b9cd5d56fc0e2a3a3e1fae4ff7c32ab61d0a2b8e47bdd5cfb1f17cb6ac637` |
| 应用 ID | `com.zhixing.research` |
| 签名 | Android Debug |

构建命令：

```powershell
$env:JAVA_HOME = 'C:\Users\Admin\.gradle\jdks\temurin-21.0.12+8'
$env:ANDROID_HOME = 'C:\Users\Admin\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
Set-Location 'D:\Codex\投顾APP\.worktrees\android-client-offline\client-app\android'
.\gradlew.bat assembleDebug --no-daemon
```

## 4. 模拟器验收结果

以下九个 Hash 深链均在安装后的真实 Capacitor WebView 中逐一打开，并使用页面唯一结构标识断言成功：

1. 今日：`#/today`
2. 报告库：`#/reports`
3. 报告详情：`#/reports/demo-morning-2099-06-18`
4. 研究总览：`#/research`
5. 行业列表：`#/research/industries`
6. 行业详情：`#/research/industries/industry-orbit-materials`
7. 核心关注标的池：`#/research/watchlist`
8. 标的详情：`#/research/watchlist/DEMO-A01`
9. 我的：`#/me`

同时确认：

- 关闭模拟器 Wi-Fi 与移动数据后，彻底停止并重新启动应用，今日报告仍由 APK 本地资源完整加载。
- 报告库可在离线状态进入报告详情。
- 报告详情顶部返回按钮能确定性返回报告库。
- PDF 下载按钮保持禁用，并常驻说明未接入原因。
- “我的”页四个未来在线操作全部为原生禁用按钮。
- 390px 等效阅读宽度的九页无横向溢出 E2E 测试通过。

已知限制：Android 系统返回键当前由原生 Activity 处理，会退出应用，而不是退回上一条 Web 历史；首版页面内返回按钮和底部主导航可完成已批准返回路径。若后续要求系统返回键遵循页面历史，应作为独立原生交互任务接入并测试，不能用临时脚本绕过。

无窗口模拟器在离线冷启动后的第一次系统截图没有立即刷新正文帧，但 WebView DOM 已经完整加载；触发一次绘制后截图和内容均正常。这是本轮 headless AVD 截图现象，不是内容缺失。

## 5. 真机验收结果

用户于 2026-08-11 通过同一局域网的临时二维码下载并安装了与模拟器验收相同 SHA-256 的 Debug APK，2026-08-12 再次打开应用正常。仅记录验收所需的最小设备信息，不记录设备序列号、IMEI 或其他持久设备标识：

| 项目 | 结果 |
|---|---|
| 设备型号代码 | `V2408A` |
| Android | Android 15 |
| 安装与隔日重新打开 | 通过，无白屏或闪退 |
| 用户结论 | 未发现阻断使用的问题 |

用户提供的五张真机截图覆盖今日、报告库、报告详情、研究总览和“我的”页面；四项底部导航、报告阅读、页面滚动、固定样例标识、离线操作禁用说明及系统安全区均正常。截图只用于当前人工验收，没有复制进仓库，避免持久保存个人手机界面信息。

非阻断视觉观察：较窄设备上“本地样例模式”徽标发生两行换行；今日主卡底部版本与数据截至时间的文字对比度偏低。两项不影响本轮功能与安全验收，留待未来独立视觉优化；若修改客户端样式，必须重新构建 APK 并补相应回归，不能沿用本次真机证据宣称新包已验收。

## 6. APK 静态安全检查

- APK 未声明 `android.permission.INTERNET`。
- 未发现 Bearer Token、JWT 形态值、私钥、`.env` 文件或已知服务端凭证变量名。
- 未发现真实业务服务端地址；应用自有资产只包含 `localhost` 与 Capacitor、React、React Router、W3C 等框架文档域名。
- APK 使用 Android Debug 证书签名，未创建或使用 release keystore。
- APK 只包含 2099 年固定去敏样例，不包含真实报告、真实证券行情或用户数据。

## 7. 全量回归

以下结果已于 2026-08-12 在记录真机证据后重新完整运行，不沿用此前会话中的测试结论：

| 检查 | 结果 |
|---|---|
| 客户端 Vitest | 10 files / 149 tests passed |
| 客户端 E2E | 17 / 17 passed |
| 客户端 production build | passed |
| 客户端 lint | passed |
| 报告引擎 | 124 / 124 passed |
| 报告引擎 build | passed |
| 生产依赖审计 | 0 vulnerabilities |

全量开发依赖审计另有 3 个中等风险，来自 `@capacitor/cli -> xcode -> uuid@7.0.3`。它属于未打包进 APK 的 macOS/Xcode 开发辅助链；当前 `npm audit fix --force` 会强制改变 Capacitor CLI 版本，与 `@capacitor/android`、`@capacitor/core` 的 8.5.0 对齐关系冲突，因此本轮不执行破坏性自动修复。后续升级 Capacitor 时必须重新审计并优先关闭该项。

## 8. 后续独立范围与已知限制

- 尚未生成正式签名 APK/AAB。
- 尚未接入真实服务端、认证、真实报告、PDF、同步、调度或数据源。
- Android 系统返回键的 Web 历史接管尚未实现。
