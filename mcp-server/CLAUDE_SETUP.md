# MCP 服务器配置示例

## Claude Desktop 配置

配置文件位置：
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

### 配置内容

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

**重要**: 将上面的路径替换为您的实际路径！

## 测试命令

在 Claude Desktop 中尝试这些对话：

### 1. 分析项目

```
分析 /Users/pailasi/Work/VitaSage 项目
```

### 2. 生成配置

```
为 /Users/pailasi/Work/VitaSage 生成 Copilot 配置
```

### 3. 列出可用 Agents

```
列出所有可用的 Copilot Agents
```

### 4. 手动选择 Agents

```
为 /Users/pailasi/Work/VitaSage 应用以下 Agents: vitasage, vue3, typescript
```

## 本地调试

不使用 Claude Desktop，直接测试 MCP 服务器：

```bash
cd /Users/pailasi/Work/copilot-prompts/mcp-server

# 启动服务器（会等待 stdin 输入）
node build/index.js

# 或者使用 MCP Inspector（如果安装了）
npx @modelcontextprotocol/inspector build/index.js
```

## 日志查看

Claude Desktop 日志位置：

```bash
# macOS
~/Library/Logs/Claude/

# 查看最新日志
tail -f ~/Library/Logs/Claude/mcp*.log
```

## 故障排查

### 问题1: Claude Desktop 找不到服务器

**检查**:
- 配置文件路径是否正确
- build 目录是否存在（运行 `npm run build`）
- Node.js 是否在 PATH 中

### 问题2: 工具执行失败

**检查**:
- 项目路径是否存在且可访问
- 网络连接（需要访问 GitHub API）
- stderr 日志中的错误信息

## 下一步

1. **重启 Claude Desktop**
2. **打开对话窗口**
3. **尝试上面的测试命令**
4. **查看工具调用结果**

---

**注意**: 首次运行会从 GitHub 获取 Agents 列表，需要稳定的网络连接。
