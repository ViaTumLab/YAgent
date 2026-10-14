# YAgent

[中文](README.md) · [English](README.en.md)

**YAgent is an open-source desktop AI agent workspace maintained by ViaTumLab.** Connect your preferred models to understand projects, edit code, execute tasks, and review results.

![Desktop workspace](.github/readme/desktop.png)

## Features

- **Projects and code:** Read files, find symbols, analyze project structure, edit code, and run tests.
- **Task collaboration:** Coordinate multiple agents and inspect progress and deliverables.
- **Browser and tools:** Work with the built-in browser, desktop tools, plugins, skills, and MCP services.
- **Model connections:** Configure different model services and select models for each task.
- **Change review:** Inspect file diffs and organize development with Git and workspaces.

## Local development

The current source primarily targets **Windows x64**. Install Git, Node.js 22, and npm:

```powershell
git clone https://github.com/ViaTumLab/YAgent.git
cd YAgent
npm ci
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm start` | Start the application |
| `npm test` | Run unit tests |
| `npm run build` | Build the Windows installer |
| `npm run build:release` | Build installer and portable packages |

Some features require additional runtimes. See the `build:desktop-bridge`, `build:cua-driver`, and `build:playwright` scripts in `package.json`. Build outputs are written to `dist/`.

This repository has not published installers yet. Future versions will be available on the [Releases](https://github.com/ViaTumLab/YAgent/releases) page.

## Contributing

Pull requests improving model integrations, tools, usability, tests, and documentation are welcome. Describe the use case, scope, and validation of your changes.

## Acknowledgments

Thank you to **[Yan-Agent](https://github.com/666-gy/Yan-Agent)**, **[Yanxi / 666-gy](https://github.com/666-gy)**, and all contributors for their open-source work and contributions. Thank you to OpenCode, Electron, and other open-source projects for their foundational capabilities.

## License

This project uses the [MIT License](LICENSE). Applicable copyright notices and license texts are retained. Third-party components, skills, and assets remain subject to their respective licenses; see [third-party notices](lib/THIRD_PARTY_NOTICES.md) and [skill notices](lib/skills/THIRD_PARTY_NOTICES.md).
