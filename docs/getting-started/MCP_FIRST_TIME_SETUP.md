# MCP 首次使用配置指南

> **问题**：首次使用 mta-mcp 时，`copilot-instructions.md` 不会自动生成  
> **原因**：MCP 改为由 AI 引导生成，而非脚本自动生成  
> **解决**：本指南教你如何正确触发生成

---

## 🎯 核心概念

### v1.x（旧版）- 脚本自动生成

```bash
# 运行脚本，自动分析并生成
./setup-copilot.sh -a /path/to/project
```

**特点**：
- ✅ 自动执行，无需 AI 参与
- ❌ 生成完整规范文件（1000+ 行）
- ❌ 消耗大量 token（~40000+）

### v2.0（新版）- AI 引导生成 ⭐

```
# 在 Copilot Chat 中说：
请帮我配置 MCP 规范系统
```

**特点**：
- ✅ AI 理解项目后智能生成
- ✅ 生成精简配置（50-100 行）
- ✅ 按需加载规范（~2000 tokens）
- ✅ Token 节省 95%+

---

## 🚀 快速开始

### 第一步：确认 MCP 服务可用

在 Copilot Chat 中说：

```
检查 MCP 健康状态
```

期望输出：

```json
{
  "success": true,
  "overallStatus": "healthy",
  "checks": {
    "server": { "status": "healthy" },
    "configuration": { "status": "healthy" },
    ...
  }
}
```

如果 `server.status` 不是 `healthy`，请先配置 MCP（见下方"MCP 初始配置"）。

---

### 第二步：一键自动配置（推荐）

在 Copilot Chat 中说：

```
请帮我配置 MCP 规范系统
```

或更明确地：

```
使用 auto_setup 工具为当前项目配置 copilot-instructions.md
```

AI 会自动执行：

1. ✅ 调用 `mcp_mta_auto_setup()`
2. ✅ 创建 `.vscode/mcp.json` 和 `settings.json`
3. ✅ 调用 `mcp_mta_analyze_project()` 分析项目特征
4. ✅ 调用 `mcp_mta_generate_config()` 生成精简配置

**预期结果**：

```
✅ 自动配置完成！

生成的文件：
- .vscode/mcp.json
- .vscode/settings.json  
- .github/copilot-instructions.md （精简版，~80 行）

下一步：
1. 重新加载 VS Code 窗口 (Cmd+Shift+P → Reload Window)
2. 开始使用 MCP 工具按需加载规范
```

---

### 第三步：验证生成结果

检查文件是否生成：

```bash
ls -la .github/copilot-instructions.md
ls -la .vscode/mcp.json
```

查看生成的内容：

```bash
cat .github/copilot-instructions.md
```

你应该看到类似这样的精简配置（50-100 行）：

```markdown
# 项目开发规范 - Copilot 指令

## ⚠️ 强制工作流

**在进行任何代码生成或修改之前，必须先调用 MCP 工具加载相关规范！**

推荐工具：
- 表单组件 → use_preset({ preset: "vue3-form" })
- API 调用 → use_preset({ preset: "api-call" })
- 智能推荐 → get_smart_standards()

## 🎯 作用域限制

此配置仅适用于 `/YourProject/` 路径下的文件
```

**而不是**传统的完整规范文件（1000+ 行）。

---

## 🔧 MCP 初始配置

如果 MCP 服务器尚未配置（`mcp.json` 不存在），先执行配置：

### 方式一：自动配置（推荐）

在 Copilot Chat 中说：

```
配置 MCP 服务器到当前项目
```

AI 会调用 `mcp_mta_auto_setup()` 自动创建配置文件。

### 方式二：手动配置

创建 `.vscode/mcp.json`：

```json
{
  "servers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "${workspaceFolder}/../copilot-prompts/mcp-server/build/index.js"
      ],
      "autoStart": true
    }
  }
}
```

创建 `.vscode/settings.json`（如果不存在）：

```json
{
  "github.copilot.chat.mcp.enabled": true
}
```

重新加载 VS Code 窗口：`Cmd+Shift+P` → `Reload Window`

---

## 💡 常见用法场景

### 场景 1：首次配置新项目

```
# 步骤 1：在 Copilot Chat 中
请帮我配置 MCP 规范系统

# 步骤 2：重新加载窗口
Cmd+Shift+P → Reload Window

# 步骤 3：开始开发
创建一个用户列表页面，包含表格和搜索功能
```

AI 会自动调用 `use_preset({ preset: "vue3-table" })` 加载规范。

---

### 场景 2：已有项目迁移到 MCP

```
# 当前状态：有 1200 行的 copilot-instructions.md
# 目标：精简为 80 行，按需加载规范

# 步骤 1：备份现有配置
mv .github/copilot-instructions.md .github/copilot-instructions.md.bak

# 步骤 2：在 Copilot Chat 中
使用 generate_config 工具重新生成精简配置

# 步骤 3：对比差异
diff .github/copilot-instructions.md.bak .github/copilot-instructions.md
```

---

### 场景 3：多项目 Workspace

```
# 为每个项目分别配置

# 项目 A
cd /path/to/projectA
在 Copilot Chat 中：请为当前项目配置 MCP 规范系统

# 项目 B  
cd /path/to/projectB
在 Copilot Chat 中：请为当前项目配置 MCP 规范系统
```

每个项目的 `copilot-instructions.md` 会自动包含作用域限制，避免冲突。

---

## ❓ 常见问题

### Q1: 为什么说"请帮我配置"后没有生成文件？

**可能原因**：
1. MCP 服务器未启动
2. AI 理解错误，没有调用工具

**解决方法**：
```
# 更明确地说：
调用 auto_setup 工具配置当前项目

# 或分步执行：
1. 调用 analyze_project 分析当前项目
2. 调用 generate_config 生成配置文件
```

---

### Q2: 生成的配置文件太简单，能否包含更多规范？

**这是设计目标**！精简配置 + 按需加载 = Token 优化。

如果需要查看完整规范：

```typescript
// 仅在当前对话加载完整规范
get_compact_standards({ 
  currentFile: "xxx.vue",
  mode: "full"
})
```

**不要**把完整规范写入 `copilot-instructions.md`，这样每次对话都会加载，浪费 token。

---

### Q3: 如何验证 AI 是否真的调用了 MCP 工具？

查看 Copilot Chat 的响应，应该包含：

```
✅ 已加载规范: use_preset({ preset: "vue3-form" })

根据规范，我将创建：
- 使用 Composition API
- 使用 <script setup> 语法
- 表单验证使用 Element Plus 规则
...
```

如果没有这样的说明，说明 AI 没有调用工具，需要手动提醒：

```
请先调用 use_preset 或 get_smart_standards 加载规范
```

---

### Q4: 可以让 AI 自动调用工具吗？

**可以**！在 `copilot-instructions.md` 中添加：

```markdown
## ⚠️ 强制工作流

**在生成任何代码前，必须先调用 MCP 工具加载规范！**

受限操作：
- ❌ 创建代码文件
- ❌ 修改代码文件  
- ❌ 使用 replace_string_in_file

验证流程：
1. 加载规范（调用 MCP 工具）
2. 声明已加载（明确说明）
3. 编写代码（遵循规范）
```

这样 AI 在生成代码前会自动调用工具。

---

## 📚 延伸阅读

- [MCP Token 优化指南](./MCP_TOKEN_OPTIMIZATION.md) - Token 节省原理和最佳实践
- [预设场景列表](../../mcp-server/README.md#预设场景) - 所有可用的 use_preset 选项
- [规范库结构](../../standards/README.md) - 了解规范组织方式

---

## 📊 效果对比

| 方式 | 配置文件行数 | 每次加载 Token | 规范更新 | 首次配置难度 |
|------|------------|---------------|---------|-------------|
| **旧版（脚本）** | 1200 行 | ~40000 | 手动同步 | 简单（自动） |
| **新版（AI 引导）** | 80 行 | ~2000 | 自动最新 | 中等（需提示） |
| **改进方向** | ✅ 95% ↓ | ✅ 95% ↓ | ✅ | ⚠️ 需要文档 |

本指南就是为了解决"首次配置难度"问题 🎯

---

**维护者**: MTA 工作室  
**最后更新**: 2026-01-09
