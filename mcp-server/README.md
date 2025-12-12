# Copilot Prompts MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

智能分析项目并自动匹配 GitHub Copilot Agents 的 MCP 服务器。

## 🎯 功能特性

- **智能项目分析** - 自动检测 Vue、React、TypeScript 等技术栈
- **智能 Agent 匹配** - 基于加权评分算法推荐最合适的 Agents  
- **配置文件生成** - 一键生成 `.github/copilot-instructions.md`
- **跨平台支持** - 可用于 Claude Desktop、VS Code 等任何 MCP 客户端

## 📦 安装

```bash
# 克隆仓库
git clone https://github.com/ForLear/copilot-prompts.git
cd copilot-prompts/mcp-server

# 安装依赖
npm install

# 编译
npm run build
```

## 🚀 快速开始

### 在 Claude Desktop 中使用

1. **配置 Claude Desktop**

编辑配置文件：`~/Library/Application Support/Claude/claude_desktop_config.json`

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

2. **重启 Claude Desktop**

3. **开始使用**

在 Claude Desktop 中，您可以这样对话：

```
你: 帮我分析一下 /Users/username/projects/my-vue-app 这个项目

Claude: [调用 analyze_project 工具]
检测到 Vue 3 项目，使用 Vite、TypeScript、Element Plus...

你: 为这个项目生成 Copilot 配置

Claude: [调用 generate_config 工具]  
已为您生成配置文件，应用了 4 个 Agents:
- Vue 3 开发规范
- TypeScript 严格模式
- 国际化规范
- Element Plus 组件库
```

## 🛠️ 可用工具

### 1. `analyze_project`

分析项目的技术栈和特征。

**参数**:
```typescript
{
  projectPath: string  // 项目绝对路径
}
```

**返回**:
```json
{
  "success": true,
  "projectPath": "/path/to/project",
  "projectName": "my-app",
  "features": {
    "projectType": "vue3",
    "frameworks": ["Vue 3"],
    "languages": ["TypeScript"],
    "tools": ["Vite", "Element Plus"],
    "keywords": ["i18n", "state-management"]
  }
}
```

### 2. `match_agents`

根据项目特征匹配 Agents。

**参数**:
```typescript
{
  projectFeatures: ProjectFeatures,  // 从 analyze_project 获取
  limit?: number  // 返回数量，默认 10
}
```

**返回**:
```json
{
  "success": true,
  "matched": 5,
  "agents": [
    {
      "id": "vue3",
      "title": "Vue 3 开发规范",
      "score": 25,
      "tags": ["vue3", "typescript"]
    }
  ]
}
```

### 3. `list_available_agents`

列出所有可用的 Agents。

**参数**: 无

**返回**:
```json
{
  "success": true,
  "total": 8,
  "agents": [...]
}
```

### 4. `generate_config`

生成配置文件。

**参数**:
```typescript
{
  projectPath: string,      // 项目路径
  agentIds?: string[],      // 指定 Agents（可选）
  autoMatch?: boolean       // 是否自动匹配（默认 true）
}
```

**返回**:
```json
{
  "success": true,
  "configPath": "/path/to/.github/copilot-instructions.md",
  "agents": [...],
  "message": "已成功生成配置文件，应用了 4 个 Agents"
}
```

## 📊 使用示例

### 场景 1：分析并生成配置

```
你: 分析 /Users/me/projects/my-app 并生成 Copilot 配置

Claude 会:
1. 调用 analyze_project 分析项目
2. 调用 generate_config 生成配置（自动匹配）
3. 返回生成结果
```

### 场景 2：手动选择 Agents

```
你: 列出所有可用的 Agents

Claude: [调用 list_available_agents]
找到 8 个 Agents...

你: 为 /path/to/project 应用 vue3 和 typescript 两个 Agents

Claude: [调用 generate_config，agentIds: ["vue3", "typescript"]]
已生成配置...
```

### 场景 3：查看匹配评分

```
你: 分析 /path/to/project 并推荐 Agents

Claude: 
[调用 analyze_project 和 match_agents]
根据项目特征，推荐以下 Agents:
1. Vue 3 规范 (25分)
2. TypeScript (15分)
...
```

## 🔧 开发

```bash
# 监听模式编译
npm run watch

# 调试
node --inspect build/index.js
```

## 📝 架构说明

```
mcp-server/
├── src/
│   ├── index.ts              # MCP 服务器入口
│   ├── tools/                # MCP 工具实现
│   │   ├── analyzeProject.ts
│   │   ├── matchAgents.ts
│   │   ├── listAgents.ts
│   │   └── generateConfig.ts
│   └── core/                 # 核心逻辑（复用自 VS Code 插件）
│       ├── smartAgentMatcher.ts
│       ├── githubClient.ts
│       └── types.ts
└── build/                    # 编译输出
```

## 🤝 与 VS Code 插件的关系

- **核心逻辑共享**：MCP 服务器复用了 VS Code 插件的核心代码
- **互补使用**：
  - VS Code 插件：UI 友好，适合开发者日常使用
  - MCP 服务器：AI 原生，适合与 Claude 等 AI 工具对话式交互

## 🐛 故障排查

### 问题：Claude Desktop 无法连接

**解决**:
1. 检查配置文件路径是否正确
2. 确认已运行 `npm run build`
3. 重启 Claude Desktop
4. 查看日志：`~/Library/Logs/Claude/mcp*.log`

### 问题：工具调用失败

**解决**:
1. 确认网络连接（需访问 GitHub API）
2. 检查项目路径是否存在
3. 查看 stderr 输出的错误信息

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE)

## 🔗 相关链接

- [MCP 文档](https://modelcontextprotocol.io)
- [VS Code 插件](../vscode-extension)
- [Copilot Prompts 仓库](https://github.com/ForLear/copilot-prompts)
