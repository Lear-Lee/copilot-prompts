# Copilot Prompts 中央仓库

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/ForLear/copilot-prompts)
[![MCP](https://img.shields.io/badge/MCP-1.5.0-green.svg)](mcp-server/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

集中管理各类项目的 AI 开发指令文件，通过 MCP 服务器智能分析项目并自动匹配最合适的 GitHub Copilot Agents。

## 🎯 核心功能

- **🤖 MCP 智能服务** - 自动分析项目技术栈，智能推荐配置
- **📦 Agent 库** - 预置多种开发规范（Vue 3、TypeScript、i18n 等）
- **⚡ 一键配置** - 自动生成 `.github/copilot-instructions.md`
- **🔄 跨平台** - 支持 Claude Desktop、VS Code 等 MCP 客户端
- **🛡️ 质量保障** - v1.1.0 新增：自动代码验证和错误修复

## 📁 项目结构

```
copilot-prompts/
├── setup-copilot.sh     # 🚀 一键配置脚本
├── mcp-server/          # MCP 智能服务（核心）
│   ├── src/             # 服务器源码
│   ├── build/           # 编译输出
│   └── README.md        # MCP 使用文档
├── configs/             # 团队自定义配置
│   ├── element-plus-vitasage.json
│   └── README.md
├── standards/           # MCP 规范库（模块化）
│   ├── core/            # 核心规范
│   ├── frameworks/      # 框架规范
│   ├── libraries/       # 库规范
│   └── patterns/        # 设计模式
├── agents/              # Custom Agents（VS Code 专用）
│   ├── flutter.agent.md
│   ├── i18n.agent.md
│   ├── logicflow.agent.md
│   ├── vitasage.agent.md
│   └── vue3.agent.md
├── common/              # 通用开发规范（兼容旧版）
│   ├── i18n.md
│   └── typescript-strict.md
├── vue/                 # Vue 相关配置
│   └── vue3-typescript.md
├── industry/            # 行业专用配置
│   └── vitasage-recipe.md
└── docs/                # 文档
    └── MCP_USAGE_DEMO.md
```

## 🚀 快速开始

### 方式 1: 一键配置脚本 ⚡（最简单）

```bash
# 自动分析项目并生成配置
./setup-copilot.sh -a /path/to/your-project

# 使用指定配置方案
./setup-copilot.sh -c vitasage /path/to/VitaSage

# 列出所有可用配置
./setup-copilot.sh -l
```

### 方式 2: 使用 MCP 服务（功能最强）

**在 Claude Desktop 中使用：**

1. **编译 MCP 服务器**
   ```bash
   cd mcp-server
   npm install
   npm run build
   ```

2. **配置 Claude Desktop**
   
   编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：
   ```json
   {
     "mcpServers": {
       "copilot-prompts": {
         "command": "node",
         "args": ["/绝对路径/copilot-prompts/mcp-server/build/index.js"]
       }
     }
   }
   ```

3. **重启 Claude Desktop 并使用**
   ```
   帮我分析 /path/to/my-project 并生成 Copilot 配置
   ```

详见：[mcp-server/README.md](mcp-server/README.md)

**在 VS Code 中使用：**

**v1.2.0 更新**：现在支持一键自动配置！

1. **一键自动配置（推荐）**
   
   在 VS Code Copilot Chat 中：
   ```
   使用 auto_setup 工具自动配置当前项目
   ```
   
   这会自动完成：
   - ✅ 创建 `.vscode/mcp.json` 和 `settings.json`
   - ✅ 分析项目并生成 `.github/copilot-instructions.md`
   - ✅ 匹配合适的 Agents（vue3、i18n、logicflow 等）

2. **手动配置 MCP**（高级用户）
   
   创建 `.vscode/mcp.json`：
   ```json
   {
     "servers": {
       "copilot-prompts": {
         "command": "node",
         "args": ["/绝对路径/copilot-prompts/mcp-server/build/index.js"],
         "autoStart": true
       }
     }
   }
   ```

3. **在 Copilot Chat 中使用**
   ```
   分析项目并生成配置
   获取 Vue 3 相关规范
   ```

### 方式 3: 手动配置

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
- `logicflow.agent.md` - LogicFlow 流程图开发
- `wechat-miniprogram.agent.md` - 微信小程序开发 🆕
- `flutter.agent.md` - Flutter/Dart 开发

### Prompts（通用配置）

放置在 `.github/copilot-instructions.md`，自动应用到所有对话：

- `vue/vue3-typescript.md` - Vue 3 项目配置
- `common/typescript-strict.md` - TypeScript 严格模式
- `common/i18n.md` - 国际化规范
- `industry/vitasage-recipe.md` - VitaSage 专用配置

## 🔧 MCP 工具列表

MCP 服务器提供以下智能工具：

| 工具名称 | 功能描述 |
|---------|---------|
| `analyze_project` | 分析项目技术栈（Vue、React、TypeScript 等） |
| `match_agents` | 根据项目特征智能匹配最合适的 Agents |
| `list_available_agents` | 列出所有可用的 Agents |
| `generate_config` | 一键生成 `.github/copilot-instructions.md` |

## 📚 文档

### 新手入门
- **[🚀 MCP 首次配置指南](docs/getting-started/MCP_FIRST_TIME_SETUP.md)** - **首次使用必读** ⭐
- [快速开始指南](docs/getting-started/QUICK_START.md) - 5分钟上手 MCP
- [MCP 配置自动生效指南](docs/getting-started/MCP_AUTO_RELOAD.md) - 让配置立即生效

### 使用指南
- **[⚡ MCP Token 优化指南](docs/guides/MCP_TOKEN_OPTIMIZATION.md)** - **节省 95% token 消耗的秘诀** 🔥
- [MCP 使用演示](docs/MCP_USAGE_DEMO.md) - 完整实战演示，从零到精通
- [Agents 使用指南](docs/guides/AGENTS_GUIDE.md) - Custom Agents 指南
- [最佳实践](docs/guides/BEST_PRACTICES.md) - 编码规范建议
- [MCP 服务器文档](mcp-server/README.md) - MCP 详细配置说明
- **[配置系统可扩展性](docs/guides/CONFIGURATION_EXTENSIBILITY.md)** - 如何为任何项目创建配置 🆕
- **[配置保护机制](docs/getting-started/CONFIG_PROTECTION.md)** - 自动保护自定义内容 🆕
- **[Copilot .gitignore 通用指南](docs/guides/COPILOT_GITIGNORE_GUIDE.md)** - 配置文件管理最佳实践

### Flutter 开发指南 (新增) 🎯
- [Flutter 快速指南](docs/guides/FLUTTER_GUIDE.md) - Flutter/Dart 标准使用
- [Flutter 配置总结](docs/guides/FLUTTER_SETUP_SUMMARY.md) - 完整配置说明
- [.gitignore 优化详解](docs/guides/GITIGNORE_OPTIMIZATION.md) - 配置文件管理详解
- [快速参考卡片](docs/guides/GITIGNORE_QUICK_REFERENCE.md) - 一页纸参考

### 微信小程序开发指南 (新增) 🆕
- [微信小程序开发指南](docs/guides/WECHAT_MINIPROGRAM_GUIDE.md) - 小程序开发规范和最佳实践

### 开发参考
- [项目结构说明](docs/development/STRUCTURE.md) - 了解目录组织
- [测试指南](docs/development/TEST_GUIDE_v2.0.md) - 如何测试 MCP 服务
- [更新日志](docs/development/CHANGELOG.md) - 版本历史记录
- [项目管理规范](docs/PROJECT_RULES.md) - 文件组织和维护规则 ⭐
- ⭐ **[核心设计原则](docs/development/CORE_DESIGN_PRINCIPLES.md)** - **底层逻辑，不可修改**


## 💡 使用示例

### Claude Desktop 示例

```
你：分析 /Users/username/my-vue-project 项目

Claude：[调用 analyze_project 工具]
检测到 Vue 3 项目，使用 Vite、TypeScript、Pinia...

你：为这个项目生成 Copilot 配置

Claude：[调用 generate_config 工具]
已生成配置文件，应用了以下 Agents：
- Vue 3 开发规范
- TypeScript 严格模式
- 国际化规范
```

### VS Code Copilot Chat 示例

```
@vue3 分析当前项目并推荐合适的开发规范

@typescript 帮我检查类型安全问题

@i18n 确保所有文本都已国际化
```

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
- 必须包含 YAML frontmatter（description, tags 等）
- 内容清晰、示例完整

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## ⭐ Star History

如果这个项目对你有帮助，欢迎 Star！

## 📄 许可

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [GitHub 仓库](https://github.com/ForLear/copilot-prompts)
- [问题反馈](https://github.com/ForLear/copilot-prompts/issues)

---

**维护团队**: MTA工作室  
**最后更新**: 2025-12-23
