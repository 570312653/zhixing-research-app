# 待办

## 当前优先：Git 安全地基

- [ ] 确认历史 `phase1-webhook-test` POC 是否仍在使用；若可能有效，先在对应平台轮换凭证，不打开本地 `.env.local` 验证。
- [ ] 用户明确授权后初始化本地 Git，重新检查忽略规则、暂存候选和不输出匹配值的敏感标记，再创建本地基线提交；暂不连接 GitHub。

## Android 工程门槛

- [ ] 使用 Google 官方安装器安装 Android Studio 2025.2.1+、SDK 36、Platform Tools 与 Command-line Tools，并验证 Android Studio JDK。
- [ ] 提供首轮测试手机型号和 Android 版本，启用 USB 调试并通过 ADB 验证；地基验收后才创建 `client-app/`。

## 后续独立阶段

- [ ] 设计 iFind 数据适配器契约并验证个人凭证能否在可信云端稳定调用；未通过前不接入真实数据或密钥。
- [ ] 设计受保护应用 API、单一所有者鉴权、私有归档、云端调度和正式 HTML→PDF 流程。
