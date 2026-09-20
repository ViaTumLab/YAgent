<div align="center">
  <img src="docs/assets/yagent-logo.svg" width="120" height="120" alt="YAgent Y 字形 Logo">
  <h1>YAgent</h1>
  <p><strong>让想法，真正运行起来。</strong></p>
  <p>面向真实工作区的开源桌面 Agent · An open-source project by ViaTum Lab</p>
  <p>
    <a href="https://github.com/ViaTumLab/Yan-Agent/releases">下载安装</a> ·
    <a href="https://viatumlab.inkmindspace.com">ViaTum Lab</a> ·
    <a href="https://viatumlab.inkmindspace.com/product-intro.html">产品介绍</a> ·
    <a href="https://viatumlab.inkmindspace.com/yagent/">技术文档</a> ·
    <a href="https://github.com/ViaTumLab/Yan-Agent/issues">反馈问题</a>
  </p>
  <p>
    <img src="https://img.shields.io/badge/version-1.6.0-2563eb" alt="Version 1.6.0">
    <img src="https://img.shields.io/badge/platform-Windows_x64-475569" alt="Windows x64">
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-475569" alt="MIT License"></a>
  </p>
</div>

---

**YAgent（Yan-Agent）是 [ViaTum Lab](https://viatumlab.inkmindspace.com) 的开源客户端。** 它连接你选择的模型、本地代码、工具与多 Agent 协作，让任务从理解、规划、执行走到可审阅的交付。

你可以让它探索项目、实现功能、诊断测试失败，也可以连接 Skills、MCP 和内置浏览器，处理研究与文档工作流。执行过程、文件变化与任务状态集中在同一个桌面工作区中。

**模型负责推理，YAgent 负责执行，ViaHarness 负责选择。** ViaHarness 正在开发中，未来将与 YAgent 配套使用，发挥 **MAX** 效果。

[快速开始](#start) · [核心能力](#features) · [与 ViaHarness 配合](#viaharness) · [技术文档](https://viatumlab.inkmindspace.com/yagent/) · [参与开发](#development)

<a id="start"></a>
## 快速开始

### 下载客户端

前往 [Releases](https://github.com/ViaTumLab/Yan-Agent/releases)，选择已发布的 **Windows x64 安装包或便携包**。本文对应源码版本 `1.6.0`，可下载版本以发布页为准。

1. **连接模型**：在 API 配置中填写 Base URL 和 API Key，选择服务实际支持的协议、适配预设与模型，测试连接。
2. **打开工作区**：选择一个本地项目；不涉及项目文件的问答和网页阅读可以从 Blank 任务开始。
3. **发起任务**：选择工作模式与访问权限，描述你希望完成的事情。
4. **查看交付**：跟踪工具调用与子代理进度，在审阅面板检查文件差异和验证结果。

可以从这条请求开始：

> 先梳理这个项目的入口、主要模块和测试方式，再给我一份带源码依据的说明。

YAgent 目前支持直接连接兼容的模型服务。ViaHarness 尚未对外开放，现阶段无需配置 ViaHarness；API 协议、模型能力与额度以你实际连接的服务为准。

<a id="features"></a>
## 从任务到交付

| 能力 | 你可以怎样使用 |
| --- | --- |
| **理解真实项目** | 通过仓库地图、代码大纲、符号检索与调用关系，定位需要阅读和修改的代码。 |
| **执行与工具** | 读取和编辑文件、执行命令、运行测试，通过工具结果推进任务。 |
| **多 Agent 协作** | 将探索、实现、研究、测试与审查交给不同角色，跟踪依赖、进度和交付。 |
| **长任务与上下文** | 保存任务状态、执行日志与快照，管理上下文预算，为中断后的恢复提供依据。 |
| **变更审阅** | 在工作区内查看文件差异，结合 Git 与任务级 worktree 组织和审阅修改。 |
| **浏览器与网页注释** | 阅读网页、操作内置浏览器，并把页面上的反馈转化为具体任务。 |
| **Skills 与 MCP** | 接入领域知识、执行规范和外部工具，扩展到不同工作流。 |
| **多模型适配** | 支持 Chat Completions、Messages、Responses 兼容链，以及 DeepSeek、GLM、GPT、Qwen、Kimi 专用适配。 |

客户端基于 **Electron + OpenCode** 构建，Yan Core 管理任务状态与持久化。桌面中还提供云顶天宫 Work GUI，将任务和协作状态呈现在可交互场景中。

### 按任务选择工作方式

| 模式 | 适用方式 |
| --- | --- |
| 常规 | 日常问答、代码修改与工具执行。 |
| 计划 | 先做只读调查，整理方案和实施步骤。 |
| 目标（Goal） | 围绕明确目标持续推进，在适用条件下进行有界验收与修复。 |
| 自进化 | 使用相关经验，记录有执行证据支持的规则与策略改进。 |
| AGI（实验性） | 探索轨迹学习、经验整理、协作拓扑与评估等研究能力。 |

更多实现细节见 [YAgent 技术文档](https://viatumlab.inkmindspace.com/yagent/)，包括权限边界、模型协议、任务恢复与故障排查。

<a id="viaharness"></a>
## YAgent × ViaHarness（开发中）

> **状态：开发中，尚未对外开放。** 本节介绍 ViaHarness 的产品定位与配合方式，不代表当前已提供 API 或接入名额。

ViaTum Lab 致力于**构建跨场景智能基础设施**。YAgent 是已开源的桌面客户端；ViaHarness 是正在开发的智能中间层。

| | YAgent | ViaHarness |
| --- | --- | --- |
| 定位 | 开源桌面客户端 | 多场景统一 Harness 中间层 / 基础设施 |
| 关注点 | 如何把任务执行并交付 | 为当前任务与阶段选择什么能力 |
| 核心职责 | 本地工作区、工具调用、多 Agent 协作、任务状态与变更审阅 | 任务与阶段识别、模型与 Skill 策略选择、成本与质量控制 |
| 使用入口 | 桌面应用 | 统一 API 接入 |

```text
你的任务
   │
   ▼
YAgent ──────────────── 本地代码 · 工具 · 浏览器 · 变更审阅
   │
   │  模型请求与执行反馈
   ▼
ViaHarness ──────────── 任务 / 阶段 / 模型 / Skill / 策略
   │
   │  选择与路由
   ▼
模型服务 ────────────── 推理结果与工具调用，返回客户端执行
```

ViaHarness 的产品方向是：**一个 API Key，让终端为每个任务、每个场景选择更合适的模型与策略。** 计划根据任务类型、执行阶段、成本和质量要求，在速度模型、强编码模型、推理策略与独立审查之间选择。

YAgent 可以独立使用，本仓库已提供客户端源码。ViaHarness 开放后，我们会同步发布服务地址、协议、配置和申请方式。当前可在 [ViaHarness 产品介绍](https://viatumlab.inkmindspace.com/#product) 了解设计方向。

<a id="development"></a>
## 参与开发

### 从源码运行

当前运行时与发布目标为 **Windows x64**。准备 Git、Node.js 与 npm；CI 使用 Node.js 22。

```powershell
git clone https://github.com/ViaTumLab/Yan-Agent.git
cd Yan-Agent
npm ci
npm start
```

开发模式使用 `npm run dev`。Serena、GitHub CLI 等外部工具按所需功能另行配置。

### 测试与构建

```powershell
npm test                  # 单元与模块测试
npm run build             # Windows 安装包
npm run build:portable    # Windows 便携包
```

产物位于 `dist/`。构建包含运行时资源准备和打包校验；Electron E2E 与真实 API 测试需单独运行。修改模型适配器等源码后，需更新对应 bundle，详见 [YAgent 技术文档](https://viatumlab.inkmindspace.com/yagent/#development)。

### 从这些模块开始

| 路径 | 内容 |
| --- | --- |
| [lib/yan-core/](lib/yan-core/) | 任务状态、事件与持久化 |
| [lib/opencode-sidecar.js](lib/opencode-sidecar.js) | 模型回合、工具与子代理执行 |
| [lib/analysis/](lib/analysis/) | 项目结构、符号与代码分析 |
| [lib/subagent/](lib/subagent/) | 子代理角色、依赖与调度 |
| [lib/agi/](lib/agi/) | 自进化相关实验模块 |
| [renderer/](renderer/) | 桌面界面、浏览器与审阅交互 |
| [test/](test/) | 模块测试、交互测试与运行时验证 |

欢迎通过 [Issues](https://github.com/ViaTumLab/Yan-Agent/issues) 反馈问题，或提交 Pull Request 改进模型适配、工具连接、交互、文档与评测。问题报告请附版本、系统、连接类型、复现步骤和脱敏日志；功能修改请说明使用场景及实际验证结果。

任务、配置与运行记录主要保存在本地应用数据目录，工作区 `.yanagent` 还可能包含快照和未合并的 worktree。模型请求会发送到你配置的服务，MCP 等工具也可能访问外部系统。数据位置与权限说明见 [YAgent 技术文档](https://viatumlab.inkmindspace.com/yagent/#data)。

## 关于 ViaTum Lab

**ViaTum Lab 是一家构建 Harness 中间层的前沿实验室。** 我们连接算法研究、系统工程与产品实践，探索智能体如何跨任务、跨场景持续工作。

创始团队来自北京大学与清华大学，汇聚多名顶尖基础模型团队成员，团队孵化于国家重点实验室。YAgent 是我们面向开发者与研究者开放的客户端项目。

[公司官网](https://viatumlab.inkmindspace.com) · [前沿探索](https://viatumlab.inkmindspace.com/#research) · [研究交流与合作](mailto:hbjin25@stu.pku.edu.cn)

## 许可证与致谢

YAgent 主项目采用 [MIT License](LICENSE)。感谢 OpenCode、Electron，以及模型 SDK、Serena、CodeGraph、Tree-sitter 等开源项目提供的基础能力。

第三方代码、技能、字体与素材遵循各自许可证，完整来源见[第三方说明](lib/THIRD_PARTY_NOTICES.md)与[开源致谢](docs/technical-reference.md#sources)。项目独立的 [Y 字形 Logo](docs/assets/yagent-logo.svg) 以两路汇入一条执行路径为设计意象，沿用 ViaTum Lab 的蓝灰配色。
