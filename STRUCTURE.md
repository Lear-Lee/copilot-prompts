# 项目结构说明

## 📁 目录结构

```
copilot-prompts/
├── mcp-server/              # MCP 智能服务（核心功能）
│   ├── src/                 # TypeScript 源码
│   │   ├── index.ts         # 服务器入口
│   │   ├── core/            # 核心模块
│   │   │   ├── types.ts     # 类型定义
│   │   │   ├── githubClient.ts
│   │   │   └── smartAgentMatcher.ts
│   │   └── tools/           # MCP 工具实现
│   │       ├── analyzeProject.ts
│   │       ├── matchAgents.ts
│   │       ├── listAgents.ts
│   │       └── generateConfig.ts
│   ├── build/               # 编译输出
│   ├── package.json
│   ├── tsconfig.json
│   ├── README.md            # MCP 使用文档
│   ├── GETTING_STARTED.md   # 快速开始指南
│   └── CLAUDE_SETUP.md      # Claude Desktop 配置
│
├── agents/                  # Custom Agents
│   ├── vue3.agent.md        # Vue 3 开发规范
│   ├── typescript.agent.md  # TypeScript 严格模式
│   ├── i18n.agent.md        # 国际化规范
│   ├── vitasage.agent.md    # VitaSage 专用
│   └── logicflow.agent.md   # LogicFlow 流程图
│
├── common/                  # 通用规范
│   ├── typescript-strict.md # TypeScript 规范
│   └── i18n.md             # 国际化规范
│
├── vue/                     # Vue 专用规范
│   └── vue3-typescript.md  # Vue 3 + TS 规范
│
├── industry/                # 行业专用规范
│   └── vitasage-recipe.md  # VitaSage 工业配方
│
├── docs/                    # 文档目录
│   ├── DEPLOYMENT_SUMMARY.md
│   └── SETUP_COMPLETE.md
│
├── .github/                 # GitHub 配置
│   └── copilot-instructions.md
│
├── .vscode/                 # VS Code 配置
│   └── mcp.json            # MCP 服务器配置
│
├── README.md               # 项目说明
├── CHANGELOG.md            # 更新日志
├── AGENTS_GUIDE.md         # Agents 使用指南
├── BEST_PRACTICES.md       # 最佳实践
└── STRUCTURE.md            # 本文件
```

## 🎯 核心组件

### 1. MCP 服务器 (mcp-server/)

**功能：**
- 智能分析项目技术栈
- 自动匹配合适的 Agents
- 生成 Copilot 配置文件
- 列出所有可用 Agents

**使用：**
- Claude Desktop
- VS Code MCP
- 其他 MCP 客户端

### 2. Agents 库 (agents/)

**内容：**
预置的开发规范和最佳实践

**格式：**
- 文件名：xxx.agent.md
- 包含 YAML frontmatter（description, tools）
- 使用 @agent-name 调用

### 3. 通用规范 (common/, vue/, industry/)

**用途：**
- 作为 .github/copilot-instructions.md 的素材
- 可被多个项目复用
- 可组合使用

## 🔄 工作流程

### 使用 MCP 服务（推荐）

```
用户 → Claude/VS Code → MCP 服务器 → 分析项目
                                    ↓
                            匹配 Agents
                                    ↓
                            生成配置文件
```

### 手动配置

```
用户 → 选择 Agents → 复制到项目 .github/ 目录
```

## 📝 文件类型

### Agent 文件 (.agent.md)

- 放置在 .github/agents/ 目录
- 通过 @agent-name 调用
- 支持指定 tools 列表
- 可包含详细的开发规范

### Prompt 文件 (.md)

- 放置在 .github/copilot-instructions.md
- 自动应用到所有对话
- 可组合多个规范文件

## 🚀 版本历史

- **v2.0.0** - MCP 服务器优化，移除 VS Code 扩展
- **v1.3.0** - 支持 VS Code 扩展
- **v1.0.0** - 初始版本

---

**更新时间：** 2025-12-15
