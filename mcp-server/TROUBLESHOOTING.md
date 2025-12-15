# 🔧 MCP 服务器故障排除指南

本指南帮助你解决使用 Copilot Prompts MCP 服务器时可能遇到的常见问题。

## 📋 目录

- [VS Code 配置问题](#vs-code-配置问题)
- [Claude Desktop 配置问题](#claude-desktop-配置问题)
- [MCP 服务器无法启动](#mcp-服务器无法启动)
- [工具调用失败](#工具调用失败)
- [配置文件格式错误](#配置文件格式错误)

---

## VS Code 配置问题

### 问题：VS Code Copilot 看不到 MCP 工具

**症状**：
- 在 Copilot Chat 中看不到 MCP 工具
- 配置文件已创建但不生效

**解决方案**：

#### 1. 检查配置文件格式

确保 `.vscode/mcp.json` 使用正确的格式：

```json
{
  "servers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "/绝对路径/copilot-prompts/mcp-server/build/index.js"
      ],
      "env": {},
      "autoStart": true
    }
  }
}
```

**❌ 错误格式** (常见错误)：
```json
{
  "mcpServers": {  // ❌ 错误：应该是 "servers"
    "copilot-prompts": {
      "command": "node",
      "args": ["..."]
      // ❌ 缺少 env 和 autoStart
    }
  }
}
```

**✅ 正确格式**：
```json
{
  "servers": {  // ✅ 正确
    "copilot-prompts": {
      "command": "node",
      "args": ["/绝对路径/..."],
      "env": {},           // ✅ 必须包含
      "autoStart": true    // ✅ 推荐添加
    }
  }
}
```

#### 2. 检查 settings.json

`.vscode/settings.json` 应包含：

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.configFile": "${workspaceFolder}/.vscode/mcp.json",
  "github.copilot.chat.mcp.autoStart": true
}
```

#### 3. 重新加载 VS Code

配置更改后**必须**重新加载窗口：
1. 按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 `Developer: Reload Window`
3. 回车

#### 4. 检查服务器路径

确保路径指向正确的文件：

```bash
# 检查文件是否存在
ls -la /绝对路径/copilot-prompts/mcp-server/build/index.js

# 测试服务器是否能运行
node /绝对路径/copilot-prompts/mcp-server/build/index.js
```

应该看到：`Copilot Prompts MCP Server 已启动`

#### 5. 使用自动配置工具

最简单的方法是使用 `auto_setup` 工具：

在已启动的 Claude Desktop 或其他 MCP 客户端中：
```
请使用 auto_setup 工具配置 /path/to/your/project
```

或使用健康检查：
```
请使用 health_check 工具检查配置
```

---

## Claude Desktop 配置问题

### 问题：Claude Desktop 看不到工具

**解决方案**：

#### 1. 检查配置文件位置

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### 2. 检查配置格式

Claude Desktop 使用 `mcpServers` (注意与 VS Code 不同):

```json
{
  "mcpServers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "/绝对路径/copilot-prompts/mcp-server/build/index.js"
      ]
    }
  }
}
```

#### 3. 重启 Claude Desktop

配置更改后必须完全退出并重新启动 Claude Desktop。

---

## MCP 服务器无法启动

### 问题：服务器启动失败

**症状**：
- 配置正确但工具不可用
- VS Code 输出面板显示错误

**解决方案**：

#### 1. 检查 Node.js 版本

```bash
node --version
# 应该 >= 18.0.0
```

如果版本过低，请升级 Node.js。

#### 2. 检查服务器是否已构建

```bash
cd /path/to/copilot-prompts/mcp-server
ls -la build/index.js
```

如果文件不存在：
```bash
npm install
npm run build
```

#### 3. 检查依赖是否安装

```bash
cd /path/to/copilot-prompts/mcp-server
npm install
```

#### 4. 手动测试服务器

```bash
node /path/to/copilot-prompts/mcp-server/build/index.js
```

应该看到：`Copilot Prompts MCP Server 已启动`

按 `Ctrl+C` 停止测试。

---

## 工具调用失败

### 问题：工具存在但调用失败

**症状**：
- 能看到工具列表
- 调用工具时返回错误

**解决方案**：

#### 1. 检查文件权限

```bash
# 确保 MCP 服务器文件有执行权限
chmod +x /path/to/copilot-prompts/mcp-server/build/index.js
```

#### 2. 检查工作区路径

确保传递的路径是绝对路径且存在：

```bash
# 检查路径
ls -la /path/to/your/project
```

#### 3. 查看详细错误

在 VS Code 中：
1. 打开输出面板：`Cmd/Ctrl+Shift+U`
2. 选择 "GitHub Copilot" 频道
3. 查看详细错误信息

---

## 配置文件格式错误

### 问题：JSON 格式错误

**症状**：
- VS Code 提示 "不允许属性 mcpServers"
- 配置文件显示红色波浪线

**解决方案**：

#### VS Code 正确格式

```json
{
  "servers": {
    "copilot-prompts": {
      "command": "node",
      "args": ["..."],
      "env": {},
      "autoStart": true
    }
  }
}
```

#### Claude Desktop 正确格式

```json
{
  "mcpServers": {
    "copilot-prompts": {
      "command": "node",
      "args": ["..."]
    }
  }
}
```

**注意区别**：
- VS Code 使用 `servers`
- Claude Desktop 使用 `mcpServers`

---

## 🎯 快速诊断命令

### 使用 health_check 工具

最简单的诊断方法：

```
请使用 health_check 工具检查我的配置
```

这会返回：
- ✅ 配置文件状态
- ✅ 服务器路径验证
- ✅ 依赖检查
- ✅ 修复建议

### 使用 auto_setup 工具

如果遇到配置问题，最快的解决方法：

```
请使用 auto_setup 工具重新配置
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. **查看日志**：
   - VS Code: 输出面板 → GitHub Copilot
   - Claude: 应用程序日志

2. **提交 Issue**：
   - GitHub: https://github.com/ForLear/copilot-prompts/issues
   - 包含：
     - 操作系统
     - Node.js 版本
     - VS Code/Claude 版本
     - 错误信息
     - 配置文件内容

3. **查看文档**：
   - [使用指南](./USAGE_GUIDE.md)
   - [快速开始](./GETTING_STARTED.md)
   - [README](./README.md)

---

## 🔄 版本升级

### 从旧版本升级

如果你之前使用的是旧版本（使用 `mcpServers` 在 VS Code 中）：

1. **使用 auto_setup 自动升级**：
   ```
   请使用 auto_setup 工具
   ```

2. **或手动修改配置**：
   - 将 `.vscode/mcp.json` 中的 `mcpServers` 改为 `servers`
   - 添加 `env: {}` 和 `autoStart: true`
   - 重新加载 VS Code 窗口

---

## ✅ 验证配置

### 检查清单

- [ ] 配置文件路径正确
- [ ] JSON 格式有效（无语法错误）
- [ ] 使用正确的键名（VS Code 用 `servers`）
- [ ] 服务器路径是绝对路径
- [ ] 服务器文件存在且可执行
- [ ] 已重新加载 VS Code 窗口
- [ ] Node.js 版本 >= 18.0.0
- [ ] 已安装依赖 (`npm install`)
- [ ] 已构建服务器 (`npm run build`)

### 快速验证命令

```bash
# 1. 检查 Node.js
node --version

# 2. 检查服务器文件
ls -la /path/to/mcp-server/build/index.js

# 3. 测试服务器
node /path/to/mcp-server/build/index.js

# 4. 检查配置文件
cat .vscode/mcp.json
cat .vscode/settings.json
```

---

**记住**：大多数问题都可以通过使用 `auto_setup` 工具或 `health_check` 工具自动解决！
