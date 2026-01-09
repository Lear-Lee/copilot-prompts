# Copilot Prompts MCP Server

[![MCP](https://img.shields.io/badge/MCP-2.0-blue)](https://modelcontextprotocol.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

智能分析项目并自动匹配 GitHub Copilot Agents 的 MCP 服务器。

## 🧠 v2.0 设计理念

> **MCP = 信息提供者，AI = 决策者**

v2.0 版本进行了重大设计调整：

| 错误做法 | 正确做法 |
|---------|---------|
| MCP 分析意图 → 计算权重 → 匹配规范 | AI 知道需要什么 → 调用 MCP → MCP 快速返回数据 |
| MCP 返回"推荐规范" | MCP 返回"可用信息供参考" |
| 复杂的权重算法 | 简单的映射表查询 |

**核心思想**：AI 比 MCP 更擅长理解用户意图和做决策，MCP 只需要提供高效的数据访问能力。

## 🎯 功能特性

### 核心功能
- **智能项目分析** - 自动检测 Vue、React、TypeScript 等技术栈
- **智能 Agent 匹配** - 基于加权评分算法推荐最合适的 Agents  
- **配置文件生成** - 一键生成 `.github/copilot-instructions.md`
- **模块化编码规范** - MCP Resources 按需加载，节省 50-70% tokens
- **跨平台支持** - 可用于 Claude Desktop、VS Code 等任何 MCP 客户端

### v2.0 新增：直接访问工具 🆕
- **📖 `get_standard_by_id`** - AI 知道需要什么规范时，直接按 ID 获取
- **🗺️ `query_mappings`** - 查询场景-规范映射关系，AI 自行决策
- **📋 `list_scenarios`** - 列出所有可用场景名称

### Phase 4: 傻瓜模式 🎉
- **🎯 一键自动配置** - `auto_setup` 工具，30 秒完成 VS Code 配置
- **🏥 健康检查诊断** - `health_check` 工具，自动诊断并给出修复建议
- **🧠 零参数智能推荐** - `get_smart_standards` 工具，自动检测上下文
- **⚡ 预设场景快捷** - `use_preset` 工具，8 种常见场景一键获取
- **📋 自动路径检测** - 所有工具支持路径自动检测，无需手动输入

### 性能优化
- **上下文智能分析** - 自动检测 imports、关键词，精准匹配规范
- **智能缓存系统** - LRU 缓存机制，3次以上请求 300%+ 命中率
- **性能监控统计** - 实时追踪使用情况、Token 节省、响应时间

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

### 📖 v2.0 直接访问工具（推荐 AI 使用）

> 这些工具遵循"MCP = 信息提供者"理念，AI 直接调用获取需要的数据。

#### 1. `get_standard_by_id` - 按 ID 直接获取规范 ⭐

AI 知道需要什么规范时，直接按 ID 获取，最简洁高效。

**参数**:
```typescript
{
  id?: string,              // 单个规范 ID
  ids?: string[],           // 多个规范 ID（批量获取）
  mode?: 'summary' | 'key-rules' | 'full'  // 加载模式，默认 key-rules
}
```

**使用示例**:
```
// 获取单个规范
get_standard_by_id({ id: 'vue3-composition', mode: 'key-rules' })

// 批量获取
get_standard_by_id({ ids: ['vue3-composition', 'element-plus'], mode: 'summary' })
```

#### 2. `query_mappings` - 查询场景-规范映射

提供映射信息给 AI 参考，AI 自己决定使用哪些规范。

**参数**:
```typescript
{
  scenario?: string,    // 场景名称
  fileType?: string,    // 文件类型
  imports?: string[],   // 导入的包
  listAll?: boolean     // 列出所有映射
}
```

**使用示例**:
```
// 查询场景对应的规范
query_mappings({ scenario: 'vue3-form' })

// 查询所有映射关系
query_mappings({ listAll: true })
```

#### 3. `list_scenarios` - 列出所有场景

获取所有可用场景名称，用于 `use_preset` 或 `query_mappings`。

**参数**: 无

---

### 🎯 Phase 4: 傻瓜模式工具（推荐）

#### 1. `auto_setup` - 一键自动配置 ⭐

**v1.2.0 更新**：现在不仅配置 MCP 服务器，还会自动分析项目并生成 `copilot-instructions.md`！
**v1.2.1 更新**：默认从 GitHub 获取最新 Agents，本地作为备份。

30 秒完成完整配置，无需手动编辑任何文件：
- ✅ 创建 `.vscode/mcp.json` 
- ✅ 更新 `settings.json`
- ✅ 添加推荐扩展
- ✅ **自动分析项目并生成 `.github/copilot-instructions.md`**
- ✅ **从 GitHub 获取最新 Agents**（确保使用最新规范）

**参数**:
```typescript
{
  workspacePath?: string         // 可选，不填则使用当前目录
  generateInstructions?: boolean // 是否生成 copilot-instructions.md（默认 true）
}
```

**返回**:
```json
{
  "success": true,
  "message": "🎉 MCP 服务器已自动配置到工作区",
  "steps": [
    { "step": "创建 .vscode 目录", "status": "success" },
    { "step": "检测 MCP 服务器路径", "status": "success" },
    { "step": "创建 mcp.json", "status": "success" },
    { "step": "更新 settings.json", "status": "success" },
    { "step": "生成 copilot-instructions.md", "status": "success", "detail": "应用了 3 个 Agents" }
  ],
  "nextSteps": [
    "1. 重新加载 VS Code 窗口",
    "2. 打开 GitHub Copilot Chat",
    "3. 开始使用：Copilot 会自动应用项目规范"
  ]
}
```

**使用示例**:
```
// 完整配置（推荐）
auto_setup({ workspacePath: "/Users/you/my-project" })

// 只配置 MCP，不生成项目规范
auto_setup({ 
  workspacePath: "/Users/you/my-project",
  generateInstructions: false 
})
```

#### 2. `health_check` - 健康检查诊断

检查 MCP 服务器配置和运行状态，自动诊断问题并给出修复建议。

**参数**:
```typescript
{
  workspacePath?: string,  // 可选
  verbose?: boolean       // 是否显示详细信息
}
```

**返回**:
```json
{
  "success": true,
  "overallStatus": "healthy",
  "summary": "✅ MCP 服务器状态: healthy",
  "checks": {
    "server": { "status": "healthy", "details": ["✅ MCP 服务器正在运行"] },
    "configuration": { "status": "healthy", "details": ["✅ mcp.json 配置正确"] },
    "dependencies": { "status": "healthy", "details": ["✅ 服务器版本: 1.4.0"] },
    "standards": { "status": "healthy", "details": ["✅ 找到 8 个规范文件"] }
  },
  "recommendations": ["🎉 一切正常！您可以开始使用 MCP 服务器了"]
}
```

#### 3. `get_smart_standards` - 零参数智能推荐

自动检测当前文件类型、导入和场景，推荐最相关的编码规范。

**参数**:
```typescript
{
  currentFile?: string,   // 可选，当前文件路径
  fileContent?: string    // 可选，文件内容用于分析
}
```

**返回**:
```json
{
  "success": true,
  "analysis": {
    "source": "file-content",
    "fileType": "vue",
    "imports": ["vue", "element-plus", "pinia"],
    "scenario": "表单组件、状态管理"
  },
  "standards": ["standards://core/code-style", "standards://frameworks/vue3-composition"],
  "stats": {
    "standardsCount": 5,
    "estimatedTokens": 4347
  }
}
```

#### 4. `use_preset` - 预设场景快捷方式

使用预定义的常见场景配置，一键获取相关规范。

**预设列表**:
- `vue3-component` - Vue 3 组件开发
- `vue3-form` - Vue 3 表单开发
- `vue3-table` - Vue 3 表格开发
- `pinia-store` - Pinia 状态管理
- `api-call` - API 调用层
- `typescript-strict` - TypeScript 严格模式
- `i18n` - 国际化开发
- `composable` - Vue 3 Composable

**参数**:
```typescript
{
  preset: string,          // 预设 ID（见上方列表）
  customImports?: string[] // 可选，额外的导入
}
```

**返回**:
```json
{
  "success": true,
  "preset": {
    "id": "vue3-form",
    "name": "Vue 3 表单开发",
    "description": "Element Plus 表单组件开发，包含验证和国际化"
  },
  "applied": {
    "fileType": "vue",
    "imports": ["vue", "element-plus"],
    "scenario": "表单组件"
  },
  "standards": ["standards://core/code-style", "..."],
  "stats": { "estimatedTokens": 4347 }
}
```

#### 5. `list_presets` - 列出所有预设

**参数**: 无

**返回**: 所有可用预设的列表及说明

---

### 📦 基础工具

#### 1. `analyze_project`

分析项目的技术栈和特征。路径可选，不填则自动检测当前工作区。

**参数**:
```typescript
{
  projectPath?: string  // 项目绝对路径（可选，不填则使用当前目录）
}
```

**返回**:
```json
{
  "success": true,
  "projectPath": "/path/to/project",
  "projectName": "my-app",
  "autoDetected": true,
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
│   └── core/                 # 核心逻辑
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
```

## � 文档

- **[快速开始](./GETTING_STARTED.md)** - 新手入门指南
- **[使用指南](./USAGE_GUIDE.md)** - 详细使用说明
- **[故障排除](./TROUBLESHOOTING.md)** - 常见问题解决方案 🆕
- **[迁移指南](./MIGRATION_GUIDE.md)** - 版本升级指南 🆕
- **[开发路线图](./DEVELOPMENT_ROADMAP.md)** - 未来计划
- **[更新日志](./CHANGELOG.md)** - 版本历史

## 🐛 故障排查

### 快速诊断

遇到问题？使用内置工具快速诊断：

```
请使用 health_check 工具检查我的配置
```

### 常见问题

#### 问题：VS Code 看不到 MCP 工具

**症状**: 配置文件已创建但 Copilot 中看不到工具

**解决**:
1. 检查配置格式是否正确（使用 `servers` 而不是 `mcpServers`）
2. 确保包含 `env: {}` 和 `autoStart: true` 字段
3. 重新加载 VS Code 窗口
4. 或使用 `auto_setup` 工具自动修复

详细解决方案请查看 [故障排除指南](./TROUBLESHOOTING.md)

#### 问题：配置格式错误

**错误提示**: "不允许属性 mcpServers"

**解决**:
- VS Code 应使用 `servers` 格式
- Claude Desktop 使用 `mcpServers` 格式
- 查看 [迁移指南](./MIGRATION_GUIDE.md) 了解详情

#### 问题：Claude Desktop 无法连接

**解决**:
1. 检查配置文件路径是否正确
2. 确认已运行 `npm run build`
3. 重启 Claude Desktop
4. 查看日志：`~/Library/Logs/Claude/mcp*.log`

#### 问题：工具调用失败

**解决**:
1. 使用 `health_check` 工具诊断
2. 确认网络连接（需访问 GitHub API）
3. 检查项目路径是否存在
4. 查看详细错误信息

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE)

## 🔗 相关链接

- [MCP 文档](https://modelcontextprotocol.io)
- [Copilot Prompts 仓库](https://github.com/ForLear/copilot-prompts)
