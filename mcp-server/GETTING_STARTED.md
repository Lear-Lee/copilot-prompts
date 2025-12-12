# 🎉 Copilot Prompts MCP Server - 完整使用指南

## ✅ 配置完成状态

- ✅ MCP 服务器已编译
- ✅ Claude Desktop 配置已完成
- ✅ 测试脚本已准备

---

## 🚀 开始使用（3 步）

### 第 1 步：重启 Claude Desktop

**重要**: 必须完全退出并重启 Claude Desktop 才能加载新配置

```bash
# macOS 完全退出 Claude Desktop
killall Claude 2>/dev/null
# 然后重新打开 Claude Desktop 应用
```

### 第 2 步：检查 MCP 工具是否加载

在 Claude Desktop 的对话窗口中，您应该能看到工具图标（🔧）。点击它应该能看到：

- `analyze_project`
- `match_agents`
- `list_available_agents`
- `generate_config`

### 第 3 步：开始对话测试

尝试以下对话：

#### 测试 1：分析项目
```
分析 /Users/pailasi/Work/VitaSage 项目
```

**期望结果**: Claude 会调用 `analyze_project` 工具，返回项目特征（框架、语言、工具等）

#### 测试 2：生成配置
```
为 /Users/pailasi/Work/VitaSage 生成 Copilot 配置
```

**期望结果**: 
- 自动分析项目
- 匹配合适的 Agents
- 生成 `.github/copilot-instructions.md` 文件
- 返回应用的 Agents 列表

#### 测试 3：查看所有 Agents
```
列出所有可用的 Copilot Agents
```

**期望结果**: 返回所有可用的 Agents 列表（约 8 个）

---

## 🎯 实际使用场景

### 场景 1：新项目自动配置

```
我有一个新的 Vue 3 项目在 /path/to/my-project，
帮我分析并生成最合适的 Copilot 配置
```

Claude 会：
1. 调用 `analyze_project` 分析项目
2. 调用 `generate_config` 生成配置
3. 告诉你应用了哪些 Agents

### 场景 2：查看推荐的 Agents

```
分析 /Users/pailasi/Work/weipin 并推荐最合适的 Agents，
不要自动生成配置，只告诉我推荐哪些
```

Claude 会：
1. 分析项目特征
2. 匹配 Agents 并按评分排序
3. 告诉你推荐理由

### 场景 3：手动选择 Agents

```
为 /path/to/project 应用这些 Agents: vue3, typescript, i18n
```

Claude 会调用 `generate_config` 并指定 `agentIds` 参数

---

## 🔍 本地测试（不用 Claude Desktop）

如果想在命令行快速测试 MCP 服务器：

```bash
cd /Users/pailasi/Work/copilot-prompts/mcp-server

# 运行测试脚本
./test-mcp.sh
```

或手动测试单个工具：

```bash
# 测试分析项目
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "analyze_project",
    "arguments": {
      "projectPath": "/Users/pailasi/Work/VitaSage"
    }
  }
}' | node build/index.js
```

---

## 📊 工具详细说明

### 1. `analyze_project`

**功能**: 分析项目的技术栈和特征

**输入**:
```json
{
  "projectPath": "/absolute/path/to/project"
}
```

**输出示例**:
```json
{
  "success": true,
  "projectPath": "/Users/pailasi/Work/VitaSage",
  "projectName": "VitaSage",
  "features": {
    "projectType": "vue3",
    "frameworks": ["Vue 3"],
    "languages": ["TypeScript"],
    "tools": ["Vite", "LogicFlow", "Element Plus"],
    "keywords": ["i18n", "state-management", "routing"]
  },
  "summary": "检测到 vue3 项目，使用 Vue 3 框架"
}
```

### 2. `match_agents`

**功能**: 根据项目特征智能匹配 Agents

**输入**:
```json
{
  "projectFeatures": { ... },  // 从 analyze_project 获取
  "limit": 10
}
```

**输出示例**:
```json
{
  "success": true,
  "matched": 5,
  "agents": [
    {
      "id": "vitasage",
      "title": "VitaSage 专用开发代理",
      "score": 28,
      "tags": ["vue3", "typescript", "element-plus"]
    },
    ...
  ],
  "recommendations": ["VitaSage 专用", "Vue 3 通用", ...]
}
```

### 3. `list_available_agents`

**功能**: 获取所有可用的 Agents

**输入**: 无

**输出示例**:
```json
{
  "success": true,
  "total": 8,
  "agents": [
    {
      "id": "vue3",
      "name": "vue3.agent.md",
      "title": "Vue 3 + TypeScript 通用代理",
      "description": "Vue 3 + TypeScript 通用开发代理",
      "path": "agents/vue3.agent.md"
    },
    ...
  ]
}
```

### 4. `generate_config`

**功能**: 为项目生成配置文件

**输入**:
```json
{
  "projectPath": "/path/to/project",
  "agentIds": ["vue3", "typescript"],  // 可选
  "autoMatch": true  // 默认 true
}
```

**输出示例**:
```json
{
  "success": true,
  "configPath": "/path/to/project/.github/copilot-instructions.md",
  "agents": [
    { "id": "vue3", "title": "Vue 3", "score": 25 },
    { "id": "typescript", "title": "TypeScript", "score": 15 }
  ],
  "message": "已成功生成配置文件，应用了 2 个 Agents"
}
```

---

## 🐛 故障排查

### 问题 1: Claude Desktop 中看不到工具

**解决**:
1. 确认配置文件正确：
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```

2. 完全退出并重启 Claude Desktop（不是最小化）

3. 检查编译产物：
   ```bash
   ls -la /Users/pailasi/Work/copilot-prompts/mcp-server/build/
   ```

### 问题 2: 工具调用失败

**检查日志**:
```bash
# 查看 Claude Desktop 日志
tail -f ~/Library/Logs/Claude/mcp*.log
```

**常见原因**:
- 项目路径不存在
- 没有网络连接（无法访问 GitHub API）
- Node.js 版本不兼容（需要 >= 18.0.0）

### 问题 3: 生成配置失败

**检查**:
- 项目路径是否有写权限
- `.github/` 目录是否可创建
- 是否有稳定的网络连接

---

## 📝 配置文件位置

- **MCP 服务器**: `/Users/pailasi/Work/copilot-prompts/mcp-server/`
- **Claude 配置**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude 日志**: `~/Library/Logs/Claude/`
- **生成的配置**: `<项目>/.github/copilot-instructions.md`

---

## 🎓 高级用法

### 组合使用

```
先分析 /path/to/project1 和 /path/to/project2，
比较它们的技术栈，然后为相似的项目推荐统一的 Agents
```

### 批量操作

```
列出所有可用的 Agents，
然后为以下项目分别生成配置：
- /path/to/vue-project
- /path/to/react-project
- /path/to/vscode-extension
```

### 自定义匹配

```
分析 /path/to/project，
但只应用 TypeScript 和 i18n 相关的 Agents
```

---

## 🔗 相关资源

- **MCP 文档**: https://modelcontextprotocol.io
- **VS Code 插件**: `/Users/pailasi/Work/copilot-prompts/vscode-extension/`
- **Agents 仓库**: https://github.com/ForLear/copilot-prompts
- **项目 README**: `/Users/pailasi/Work/copilot-prompts/mcp-server/README.md`

---

## ✨ 下一步建议

1. **重启 Claude Desktop** 并测试工具
2. **在实际项目上试用** （VitaSage、weipin 等）
3. **查看生成的配置文件** 确认内容正确
4. **反馈和改进** 记录使用体验

---

**最后更新**: 2025年12月12日  
**版本**: 1.0.0  
**状态**: ✅ 可用
