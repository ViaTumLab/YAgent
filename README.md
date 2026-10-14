# YAgent

[中文](README.md) · [English](README.en.md)

**YAgent 是由 ViaTumLab 维护的开源桌面 AI 智能体工作区。** 连接你选择的模型，在真实项目中理解需求、编辑代码、执行任务并审阅结果。

![桌面工作区](.github/readme/desktop.png)

## 主要能力

- **项目与代码：** 阅读文件、检索符号、分析项目结构、修改代码与运行测试。
- **任务协作：** 组织多个智能体处理任务，查看执行进度与交付结果。
- **浏览器与工具：** 操作内置浏览器，连接桌面工具、插件、技能与 MCP 服务。
- **模型接入：** 配置不同模型服务，并为任务选择合适的模型。
- **变更审阅：** 查看文件差异，通过 Git 与工作区管理开发过程。

## 本地开发

当前源码主要面向 **Windows x64**。准备 Git、Node.js 22 和 npm：

```powershell
git clone https://github.com/ViaTumLab/YAgent.git
cd YAgent
npm ci
npm run dev
```

| 命令 | 用途 |
| --- | --- |
| `npm start` | 启动应用 |
| `npm test` | 运行单元测试 |
| `npm run build` | 构建 Windows 安装包 |
| `npm run build:release` | 构建安装包与便携版 |

部分功能需要准备额外运行时，可参考 `package.json` 中的 `build:desktop-bridge`、`build:cua-driver` 与 `build:playwright` 命令。构建产物位于 `dist/`。

本仓库尚未发布安装包，后续版本以 [Releases](https://github.com/ViaTumLab/YAgent/releases) 为准。

## 参与项目

欢迎通过 Pull Request 参与模型适配、工具接入、体验优化、测试和文档建设。提交改动时请说明使用场景、变更范围与验证结果。

## 鸣谢

感谢 **[Yan-Agent](https://github.com/666-gy/Yan-Agent)**、**[Yanxi / 666-gy](https://github.com/666-gy)** 及所有贡献者的开源工作与贡献。感谢 OpenCode、Electron 及其他开源项目提供的基础能力。

## 许可证

本项目采用 [MIT License](LICENSE)。相关版权声明与许可文本予以保留。第三方组件、技能和素材遵循各自许可证，详见 [第三方声明](lib/THIRD_PARTY_NOTICES.md) 和 [技能声明](lib/skills/THIRD_PARTY_NOTICES.md)。
