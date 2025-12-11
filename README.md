# Copilot Prompts 中央仓库

[![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)](https://github.com/ForLear/copilot-prompts)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

集中管理各类项目的 AI 开发指令文件，用于 GitHub Copilot 和其他 AI 编程助手。

## 📁 项目结构

```
copilot-prompts/
├── agents/              # Custom Agents（VS Code 专用）
│   ├── i18n.agent.md
│   ├── typescript.agent.md
│   ├── vitasage.agent.md
│   ├── vue3.agent.md
│   └── vscode-extension-dev.agent.md
├── common/              # 通用开发规范
│   ├── i18n.md
│   └── typescript-strict.md
├── vue/                 # Vue 相关配置
│   └── vue3-typescript.md
├── industry/            # 行业专用配置
│   └── vitasage-recipe.md
├── vscode-extension/    # VS Code 扩展插件
│   └── ...
├── tools/               # 辅助工具
│   └── agent-manager.html
├── docs/                # 文档
│   ├── AGENTS_GUIDE.md
│   ├── BEST_PRACTICES.md
│   └── MANAGER_GUIDE.md
└── README.md
```

## 🚀 快速开始

### 方式 1: 使用 VS Code 扩展（推荐）

1. 安装插件：
   ```bash
   cd vscode-extension
   npm install
   npm run compile
   vsce package
   code --install-extension copilot-prompts-manager-*.vsix
   ```

2. 使用插件：
   - 打开 VS Code 侧边栏 "Copilot Prompts" 视图
   - 勾选需要的 agents 和 prompts
   - 点击"应用到项目"按钮

### 方式 2: 手动配置

复制配置文件到项目：

```bash
# 创建配置目录
mkdir -p .github/agents

# 复制主配置（选择一个或多个）
cp copilot-prompts/vue/vue3-typescript.md .github/copilot-instructions.md

# 复制 agents（可选，用于 @agent-name 调用）
cp copilot-prompts/agents/*.agent.md .github/agents/
```

## 📖 配置说明

### Agents（Custom Agents）

放置在 `.github/agents/` 目录，使用 `@agent-name` 调用：

- `vitasage.agent.md` - VitaSage 工业配方系统专用
- `vue3.agent.md` - Vue 3 + Composition API
- `typescript.agent.md` - TypeScript 严格模式
- `i18n.agent.md` - 国际化最佳实践
- `vscode-extension-dev.agent.md` - VS Code 扩展开发

### Prompts（通用配置）

放置在 `.github/copilot-instructions.md`，自动应用到所有对话：

- `vue/vue3-typescript.md` - Vue 3 项目配置
- `common/typescript-strict.md` - TypeScript 严格模式
- `common/i18n.md` - 国际化规范
- `industry/vitasage-recipe.md` - VitaSage 专用配置

## 🛠️ VS Code 扩展功能

- ✅ 可视化选择配置
- ✅ 一键应用到项目
- ✅ 自动从 GitHub 获取最新配置
- ✅ 支持多工作区
- ✅ 配置验证和问题检查
- ✅ 清空项目配置

详见：[vscode-extension/README.md](vscode-extension/README.md)

## 📚 文档

- [Agents 使用指南](AGENTS_GUIDE.md)
- [最佳实践](BEST_PRACTICES.md)
- [配置管理器使用](MANAGER_GUIDE.md)
- [VS Code 扩展文档](vscode-extension/README.md)

## 🤝 贡献

欢迎贡献新的 agents 和 prompts！

1. Fork 本仓库
2. 创建你的分支 (`git checkout -b feature/my-agent`)
3. 提交变更 (`git commit -am 'Add some agent'`)
4. 推送到分支 (`git push origin feature/my-agent`)
5. 创建 Pull Request

### 贡献规范

- Agents 文件命名：`xxx.agent.md`
- Prompts 文件命名：`xxx.md`
- 必须包含 YAML frontmatter（description, tools 等）
- 内容清晰、示例完整

## 📄 许可

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [GitHub 仓库](https://github.com/ForLear/copilot-prompts)
- [问题反馈](https://github.com/ForLear/copilot-prompts/issues)
- [更新日志](vscode-extension/CHANGELOG.md)
