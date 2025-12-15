# Copilot Prompts MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.0-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

智能分析项目并自动匹配 GitHub Copilot Agents 的 MCP 服务器。

## 🎯 功能特性

- **智能项目分析** - 自动检测 Vue、React、TypeScript 等技术栈
- **智能 Agent 匹配** - 基于加权评分算法推荐最合适的 Agents  
- **配置文件生成** - 一键生成 `.github/copilot-instructions.md`
- **模块化编码规范** - MCP Resources 按需加载，节省 50-70% tokens
- **上下文智能分析** - 自动检测 imports、关键词，精准匹配规范
- **智能缓存系统** - LRU 缓存机制，3次以上请求 300%+ 命中率 ⭐新
- **性能监控统计** - 实时追踪使用情况、Token 节省、响应时间 ⭐新
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

### 5. `get_relevant_standards` ⭐新

根据开发上下文智能获取编码规范，按需加载节省 50-70% tokens。

**参数**:
```typescript
{
  fileType?: string,      // 文件类型（vue, ts, tsx 等）
  imports?: string[],     // import 语句（如未提供会自动检测）
  scenario?: string,      // 开发场景（"创建组件"、"API调用"等）
  fileContent?: string    // 文件内容（可选，用于自动分析）
}
```

**返回**:
```json
{
  "success": true,
  "standards": [
    "standards://core/code-style",
    "standards://frameworks/vue3-composition",
    "standards://libraries/element-plus"
  ],
  "content": "合并后的规范内容...",
  "tokenEstimate": 3500
}
```

**示例**:
```typescript
// 自动检测（仅提供文件内容）
get_relevant_standards({
  fileType: "vue",
  fileContent: `
    import { ref } from 'vue'
    import { ElForm } from 'element-plus'
    const form = ref({})
  `
})
// 返回：Vue 3 + Element Plus + 组件设计规范

// 手动指定
get_relevant_standards({
  fileType: "ts",
  imports: ["axios"],
  scenario: "API 调用"
})
// 返回：TypeScript + API 层设计规范
```

### 6. `get_standards_stats` ⭐新

查看规范系统的使用统计和性能指标。

**参数**:
```typescript
{
  includeCache?: boolean  // 是否包含缓存详情（默认 false）
}
```

**返回**:
```json
{
  "success": true,
  "usage": {
    "topCombinations": [...],  // 最常用的规范组合
    "topStandards": [...],      // 最常用的单个规范
    "totalCalls": 100
  },
  "performance": {
    "totalCalls": 100,
    "cacheHits": 75,
    "cacheMisses": 25,
    "cacheHitRate": "75.00%",
    "averageResponseTime": 0.5,
    "totalTokensSaved": 42000
  },
  "cache": {  // 仅当 includeCache=true 时
    "size": 8,
    "maxSize": 50,
    "entries": [...]
  }
}
```

## 📊 使用示例

### 场景 1：获取 Vue 组件开发规范（智能检测）

```
你: 我正在开发一个 Vue 表单组件，需要相关规范

Claude: [调用 get_relevant_standards]
{
  fileType: "vue",
  scenario: "表单组件",
  fileContent: "<script setup>\nimport { ref } from 'vue'\n..."
}

返回：
- Vue 3 Composition API 规范
- Element Plus 表单规范
- 组件设计模式
- TypeScript 基础规范

Token 消耗：~3500 (相比完整规范节省 65%)
```

### 场景 2：分析并生成配置

```
你: 分析 /Users/me/projects/my-app 并生成 Copilot 配置

Claude 会:
1. 调用 analyze_project 分析项目
2. 调用 generate_config 生成配置（自动匹配）
3. 返回生成结果
```

### 场景 3：手动选择 Agents

```
你: 列出所有可用的 Agents

Claude: [调用 list_available_agents]
找到 8 个 Agents...

你: 为 /path/to/project 应用 vue3 和 typescript 两个 Agents

Claude: [调用 generate_config，agentIds: ["vue3", "typescript"]]
已生成配置...
```

### 场景 4：查看系统性能统计 ⭐新

```
你: 查看规范系统的使用情况和性能数据

Claude: [调用 get_standards_stats, includeCache: true]
{
  "cacheHitRate": "75.00%",
  "averageResponseTime": "0.25ms",
  "totalTokensSaved": 42915,
  "topStandards": [
    "Vue 3 Composition API - 50次",
    "TypeScript 基础 - 45次",
    ...
  ],
  "topCombinations": [
    "Vue 3 + Element Plus + 组件设计 - 30次"
  ]
}
```

### 场景 5：查看匹配评分

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

# 运行测试
node test-standards.cjs      # Phase 1: 基础 Resources 功能
node test-phase2.cjs         # Phase 2: 增强上下文分析
node test-phase3.cjs         # Phase 3: 性能与缓存优化 ⭐新

# 调试
node --inspect build/index.js
```

## 🎨 规范系统架构 ⭐新

### MCP Resources 结构

```
standards/
├── core/                    # 核心规范（始终加载）
│   ├── code-style.md       # 命名、组织、注释
│   └── typescript-base.md  # 类型系统基础
├── frameworks/              # 框架规范（按需）
│   ├── vue3-composition.md # Vue 3 Composition API
│   └── pinia.md            # Pinia 状态管理
├── libraries/               # 库规范（按需）
│   ├── element-plus.md     # UI 组件库
│   └── i18n.md             # 国际化
└── patterns/                # 设计模式（按需）
    ├── api-layer.md        # API 层设计
    └── component-design.md # 组件封装
```

### 智能匹配算法

**权重系统**:
- 核心规范：100（始终包含）
- 文件类型：50
- 直接导入：40
- 场景匹配：30
- 相关导入：20
- 内容关键词：15

**匹配流程**:
1. 自动检测 imports（如未提供）
2. 根据文件类型评分
3. 根据导入语句评分
4. 根据场景描述评分
5. 根据内容关键词评分
6. 过滤低分项（阈值 10）
7. 排序返回

**Token 优化**:
- 传统方式：加载所有规范 ~10,000 tokens
- Resources 方式：按需加载 3-6 个模块 ~3,500 tokens
- **节省：50-70%**

### 缓存系统（Phase 3）⭐新

**LRU 缓存策略**:
- 容量：50 个规范文件
- 时长：30 分钟自动过期
- 淘汰：最少使用（LRU）策略

**性能提升**:
```
第 1 次请求：~2ms（读取文件）
第 2 次请求：~0.25ms（缓存命中，8x 加速）
第 3+ 次：~0.25ms（持续命中）
缓存命中率：75%+（典型场景）
```

**使用统计**:
- 追踪最常用规范（Top 5）
- 追踪常用组合（Top 5）
- 优化推荐算法依据

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
│       ├── standardsManager.ts  # ⭐Phase 3 增强：缓存+统计
│       ├── githubClient.ts
│       └── types.ts
├── standards/                # ⭐规范资源库
│   ├── core/
│   ├── frameworks/
│   ├── libraries/
│   └── patterns/
└── build/                    # 编译输出
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
