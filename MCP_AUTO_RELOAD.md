# 🚀 MCP 配置自动生效指南

## 问题说明

执行 `setup-copilot.sh` 后，MCP 配置**不会立即生效**，这是正常的。原因是：

1. **VS Code 不会自动检测配置变化**
2. **需要重新加载窗口才能应用新配置**
3. **MCP 服务器需要初始化启动**

## ✅ 让配置立即生效的方法

### 方法1：重新加载窗口（最快）⭐

在 VS Code 中：
1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 `Reload Window`
3. 按回车

**优点**：
- ✅ 最快速（2秒）
- ✅ 不会丢失未保存的文件
- ✅ 保持所有窗口状态

### 方法2：完全重启 VS Code

1. 完全退出 VS Code (`Cmd+Q` 或关闭所有窗口)
2. 重新打开 VS Code
3. 打开项目

### 方法3：使用命令行重载

```bash
# 在项目目录中运行
code --reuse-window .
```

## 🔍 验证配置是否生效

### 快速检查

运行状态检查脚本：

```bash
cd /Users/pailasi/Work/copilot-prompts
./check-mcp-status.sh /path/to/your/project
```

### 在 VS Code 中测试

1. **打开 Copilot Chat**
   - 快捷键: `Cmd/Ctrl + Shift + I`

2. **测试 MCP 工具**
   ```
   @workspace 列出所有可用的 MCP 工具
   ```

3. **应该看到以下工具**：
   - ✅ `get_relevant_standards` - 获取相关编码规范
   - ✅ `get_smart_standards` - 智能推荐规范
   - ✅ `analyze_project` - 分析项目技术栈
   - ✅ `list_available_agents` - 列出所有 Agents
   - ✅ `use_preset` - 使用预设场景

### 测试代码生成

在 Vue 文件中输入：

```vue
<!-- TODO: 创建用户表单组件，使用 Element Plus -->
```

然后在 Copilot Chat 中：
```
基于注释生成完整的表单组件
```

**期望结果**：
- Copilot 会自动调用 `get_relevant_standards`
- 生成的代码符合 Vue3 + Element Plus 规范
- 代码包含国际化（如果配置了 i18n）

## 🔧 故障排查

### 问题1：重载后仍不生效

**解决方案**：

1. 检查配置文件：
   ```bash
   ./check-mcp-status.sh /path/to/project
   ```

2. 查看 VS Code 输出：
   - 打开输出面板 (`Cmd+Shift+U`)
   - 选择 "GitHub Copilot Chat"
   - 查看是否有 MCP 相关日志

3. 完全重启 VS Code（不是重载窗口）

### 问题2：工具不可用

检查 MCP 服务器是否构建：

```bash
cd /Users/pailasi/Work/copilot-prompts/mcp-server
npm run build
```

### 问题3：权限问题

确保服务器脚本有执行权限：

```bash
chmod +x /Users/pailasi/Work/copilot-prompts/mcp-server/build/index.js
```

### 问题4：Node.js 未找到

确保 Node.js 在 PATH 中：

```bash
which node
node --version
```

如果没有输出，安装 Node.js：
```bash
# macOS
brew install node

# 或者从官网下载
# https://nodejs.org/
```

## 📝 配置文件说明

成功配置后，项目中会有以下文件：

### 1. `.vscode/mcp.json`
```json
{
  "servers": {
    "copilot-prompts": {
      "command": "node",
      "args": ["/path/to/copilot-prompts/mcp-server/build/index.js"],
      "env": {},
      "autoStart": true  // ← 自动启动
    }
  }
}
```

### 2. `.vscode/settings.json`
```json
{
  "github.copilot.chat.mcp.enabled": true,  // ← 启用 MCP
  "github.copilot.chat.mcp.configFile": "${workspaceFolder}/.vscode/mcp.json",
  "github.copilot.chat.mcp.autoStart": true
}
```

### 3. `.github/copilot-instructions.md`
包含项目规范和 MCP 工具使用说明。

## 💡 自动化建议

### 在 setup-copilot.sh 后自动重载

脚本已经更新，现在会提示：

```bash
./setup-copilot.sh /path/to/project
# 脚本结束时会询问：
# 是否立即重新加载 VS Code 窗口？(y/N):
```

选择 `y` 可以尝试自动重载（需要在 VS Code 终端中运行）。

### 创建快捷命令

在 `~/.zshrc` 或 `~/.bashrc` 中添加：

```bash
# MCP 快速配置
alias mcp-setup='bash /Users/pailasi/Work/copilot-prompts/setup-copilot.sh'
alias mcp-check='bash /Users/pailasi/Work/copilot-prompts/check-mcp-status.sh'
alias mcp-reload='code --reuse-window .'
```

使用：
```bash
cd /path/to/project
mcp-setup .          # 配置
mcp-reload           # 重载
mcp-check .          # 检查
```

## 🎯 最佳实践

### 推荐工作流

1. **首次配置**
   ```bash
   cd /path/to/project
   /path/to/copilot-prompts/setup-copilot.sh .
   ```

2. **立即在 VS Code 中**
   - `Cmd+Shift+P` → `Reload Window`

3. **验证生效**
   ```bash
   /path/to/copilot-prompts/check-mcp-status.sh .
   ```

4. **开始使用**
   - 在 Copilot Chat 中测试工具
   - 开始编写代码，享受规范自动应用

### 团队协作

将配置文件提交到 Git：

```bash
git add .vscode/mcp.json .vscode/settings.json .github/copilot-instructions.md
git commit -m "chore: 配置 MCP 服务器和编码规范"
git push
```

其他团队成员拉取后：
1. 执行 `Reload Window`
2. 自动应用相同的规范

## 📚 更多资源

- [MCP 服务器使用指南](./mcp-server/USAGE_GUIDE.md)
- [Claude Desktop 配置](./mcp-server/CLAUDE_SETUP.md)
- [故障排查指南](./mcp-server/TROUBLESHOOTING.md)
- [最佳实践](./BEST_PRACTICES.md)

## 🤝 支持

如果遇到问题：

1. 运行 `check-mcp-status.sh` 诊断
2. 查看 [TROUBLESHOOTING.md](./mcp-server/TROUBLESHOOTING.md)
3. 提交 Issue 到项目仓库

---

**维护团队**: MTA团队（蘑菇与吐司的AI团队）  
**最后更新**: 2025-12-16
