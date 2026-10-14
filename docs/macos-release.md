# macOS 构建、发布与 Apple 公证

当前提供 Apple 芯片（arm64）预览版。它使用临时签名（ad hoc），**没有 Apple Developer ID 签名，也没有完成 Apple 公证**。公开托管在 GitHub Releases 和通过 Apple 公证是两件独立的事。

## 本地构建

在 Apple 芯片 Mac 上安装 arm64 Node.js 22、npm 和 Git，然后在仓库根目录运行：

```sh
npm ci
npm run build:mac
```

输出为 `dist/Yan.Agent.v<版本>.macOS.arm64.dmg`。脚本检查 DMG 完整性、应用签名、包内资源和内置运行组件，测试 18 种模型服务适配，并使用隔离的数据目录启动实际打包应用。模型接口测试使用本地模拟服务，不会消耗真实模型 API 额度。启动截图保存为 `output/macos-smoke.png`。

单独复核已有应用：

```sh
npm run verify:mac
```

构建需要联网获取 npm、Electron 和 Chromium。Chromium 本体不随安装包发布；安装 Playwright 插件时再下载并校验。不要使用 Intel Node.js 或跨架构安装依赖：当前 OpenCode 补丁只校验了 Windows x64 和 macOS arm64。

## 发布到 GitHub

`.github/workflows/macos-build.yml` 在主分支和 Pull Request 上验证 Mac 构建，在 `macos-v*` 标签上额外发布 GitHub **Pre-release**。只有构建与测试成功后，才上传 DMG 和 `SHA256SUMS`；上传使用 GitHub Actions 的仓库令牌，不需要把个人令牌提交到代码中。

首次发布前，先打开仓库的 **Actions** 页面，确认已启用 Actions。仓库停用 Actions 时，推送标签不会触发构建。启用后若标签已存在，可在 **macOS build → Run workflow** 中选择该标签手动运行。

也可以发布已在本机验证的包：在 `dist` 目录运行 `shasum -a 256 *.dmg > SHA256SUMS`，然后在 **Releases → Draft a new release** 选择对应标签，填写 `docs/releases/macos-preview.md` 中的说明，上传 DMG 与 `SHA256SUMS`，勾选 **Pre-release** 后发布。不要上传本机配置、账号资料或整个工作目录。

维护者在确认要发布的提交已推送后，创建一个尚未使用的标签，例如：

```sh
git tag -a macos-v1.7.0-preview.1 -m "macOS Apple Silicon preview 1"
git push origin macos-v1.7.0-preview.1
```

后续发布请递增预览编号或版本号，保持标签与实际代码对应，不移动已经发布的标签。Mac 标签使用 `macos-v` 前缀，与 Windows 的 `v*` 发布流程分开。下载说明来自 `docs/releases/macos-preview.md`；每次发布前应同步修改实际支持范围。

## 费用与账号

Apple Developer Program 为 **99 美元/会员年**，实际本地币种和价格以 Apple 注册页面为准。Mac 公证属于开发者会员提供的服务，不按每次提交另收公证费。免费 Apple 开发者账号不包含正式分发所需的全部能力；不需要购买 299 美元/年的企业计划，也不需要把应用上架 Mac App Store。

部分符合条件的非营利组织、认证教育机构和政府实体可以申请年费减免，普通开源项目不会仅因开源自动免除年费。[会员费用](https://developer.apple.com/programs/enroll/) · [会员服务](https://developer.apple.com/programs/) · [费用减免条件](https://developer.apple.com/help/account/membership/fee-waivers)

## 正式公证前，本项目还需要改什么

当前 `npm run build:mac` **仅生成未公证预览版**。购买会员或设置 `CSC_NAME` 不会自动把这个脚本变成公证发布流程。

1. 加入 Apple Developer Program，由账号持有人创建 **Developer ID Application** 证书，私钥保存在钥匙串或 CI 的加密机密中。
2. 将 OpenCode 的补丁工作移到正式发布的构建阶段，先应用补丁，再为最终执行文件签名。当前预览版在用户目录中生成和临时签名补丁副本；正式分发需要同时调整运行时查找和哈希清单，避免启动时再次改动已签名、公证的二进制。
3. 为应用、Electron helpers、原生模块以及 OpenCode、CodeGraph、OfficeCLI 等所有分发的可执行组件正确签名；启用 Hardened Runtime，审阅所需 entitlements，使用安全时间戳。不能沿用当前预览版跳过 Resources 内独立运行组件的签名策略。
4. 更新打包校验器，验证签名后的实际运行组件与清单，再重新执行模型、文件工具、浏览器及启动测试。开发者签名会改变二进制字节，不能直接沿用临时签名版的哈希。
5. 将最终签名的应用归档或 DMG 提交到 Apple，等待 `Accepted`，附加公证票据（staple），验证 Gatekeeper 接受后，再上传该最终文件并重新生成校验值。

以上是项目迁移要求，不表示当前包已满足公证条件。Apple 说明：[Developer ID 签名与公证](https://developer.apple.com/developer-id/) · [自定义公证流程](https://developer.apple.com/documentation/security/customizing-the-notarization-workflow)

## 完成正式签名后的提交命令

以下命令只适用于**已完成上述适配且正确签名**的 DMG，不适用于直接提交当前预览包。安装 Xcode 及相关命令行工具后，先把认证资料存入本机钥匙串；跟随提示输入账号、团队 ID 和 App 专用密码，不把密码写入仓库或聊天记录。

```sh
xcrun notarytool store-credentials "yagent-notary"

xcrun notarytool submit "dist/Yan.Agent.v1.7.0.macOS.arm64.dmg" \
  --keychain-profile "yagent-notary" --wait

# 仅在返回 Accepted 后执行：
xcrun stapler staple "dist/Yan.Agent.v1.7.0.macOS.arm64.dmg"
xcrun stapler validate "dist/Yan.Agent.v1.7.0.macOS.arm64.dmg"
spctl --assess --type open --context context:primary-signature --verbose=2 \
  "dist/Yan.Agent.v1.7.0.macOS.arm64.dmg"
```

如果状态为 `Invalid`，使用 `xcrun notarytool log <submission-id> --keychain-profile yagent-notary` 查看原因，修复并重新签名、提交。修改签名后的程序或最终 DMG 后，应重新进行对应签名、公证和校验步骤。
