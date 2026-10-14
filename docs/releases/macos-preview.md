macOS Apple 芯片（arm64）预览版。下载下方的 `.dmg`，打开后将 **Yan Agent** 拖入 **Applications / 应用程序**。

**此版本使用临时签名，尚未获得 Apple Developer ID 签名和公证。** 如 macOS 阻止启动，请先确认来源与 `SHA256SUMS` 校验值，再按 [Apple 官方说明](https://support.apple.com/102445) 在「系统设置 → 隐私与安全性」中允许打开。请勿关闭整个系统的 Gatekeeper。

本版本包含 macOS 内置运行组件、经过校验的 OpenCode 内核补丁、Playwright 运行组件，以及打包后的应用启动与模型接口适配测试。模型测试使用本地模拟服务，不代表已连接或认证任何用户的真实模型账号。

已知限制：

- 适用于 M 系列 Mac；Intel Mac 暂不支持。
- Windows 专属桌面控制、应用快照和语音识别暂不支持 macOS。
- 自动更新尚未接入 Mac 发布源，请手动下载新版本替换应用。
- Chromium 在安装 Playwright 插件时下载，不包含在 DMG 内。
- Harness 管理、对话路由和 RSI 持续改进仍属于 README 中的规划。

下载 `.dmg` 和 `SHA256SUMS` 到同一个目录，可运行 `shasum -a 256 -c SHA256SUMS` 检查下载是否完整。

安装、开发和公证说明见 [README](https://github.com/ViaTumLab/YAgent#下载安装) 与 [macOS 发布指南](https://github.com/ViaTumLab/YAgent/blob/main/docs/macos-release.md)。

---

Apple Silicon (arm64) preview. Open the DMG and drag **Yan Agent** into **Applications**. This build is **ad hoc signed and not Apple-notarized**. Verify the download checksum before following [Apple's opening instructions](https://support.apple.com/102445).

Intel Macs, Windows desktop automation/snapshots, and speech recognition are not supported by this macOS preview. Updates are manual. Chromium is downloaded when installing the Playwright plugin. Provider compatibility checks use local mock services, not live user accounts.
