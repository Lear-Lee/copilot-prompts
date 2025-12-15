# 🚀 快速参考卡

## ⚡ 快速开始

### 1. 编译 MCP 服务器
```bash
cd /Users/pailasi/Work/copilot-prompts/mcp-server
npm install
npm run build
```

### 2. 配置 Claude Desktop

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "copilot-prompts": {
      "command": "node",
      "args": ["/Users/pailasi/Work/copilot-prompts/mcp-server/build/index.js"]
    }
  }
}
```

### 3. 配置 VS Code MCP

**项目根目录**: `.vscode/mcp.json`

```json
{
  "mcpServers": {
    "copilot-prompts": {
      "command": "node",
      "args": ["/Users/pailasi/Work/copilot-prompts/mcp-server/build/index.js"]
    }
  }
}
```

### 4. 重启并使用

**Claude Desktop**:
```
帮我分析 /path/to/project 并生成 Copilot 配置
```

**VS Code Copilot Chat**:
```
@vue3 分析当前项目
```

---

## 🔧 MCP 工具

| 工具 | 功能 |
|-----|------|
| `analyze_project` | 分析项目技术栈 |
| `match_agents` | 智能匹配 Agents |
| `list_available_agents` | 列出所有 Agents |
| `generate_config` | 生成配置文件 |

---

## 📦 可用 Agents

| Agent | 用途 | 调用 |
|-------|------|------|
| vue3 | Vue 3 开发 | `@vue3` |
| typescript | TS 严格模式 | `@typescript` |
| i18n | 国际化 | `@i18n` |
| vitasage | VitaSage 系统 | `@vitasage` |
| logicflow | 流程图开发 | `@logicflow` |

---

## 📁 手动配置

```bash
# 复制到项目
mkdir -p .github/agents
cp copilot-prompts/agents/*.agent.md .github/agents/
cp copilot-prompts/vue/vue3-typescript.md .github/copilot-instructions.md
```

---

## 🛠️ 常用命令

```bash
# 编译
npm run build

# 开发模式（监听）
npm run dev

# 启动服务器
npm start

# 清理构建
npm run clean
```

---

## 📚 文档链接

- [完整 README](README.md)
- [MCP 使用指南](mcp-server/README.md)
- [快速开始](mcp-server/GETTING_STARTED.md)
- [Agents 指南](AGENTS_GUIDE.md)
- [最佳实践](BEST_PRACTICES.md)
- [更新日志](CHANGELOG.md)

---

**版本**: v2.0.0 | **更新**: 2025-12-15
