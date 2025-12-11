# 资源管理器右键菜单使用指南

## 📋 功能概述

v1.3.0 新增了资源管理器右键菜单功能，让你可以直接在工作区文件夹上右键快捷管理 Copilot 配置。

## 🎯 三个新增菜单项

在资源管理器中，右键点击任意**文件夹**，会看到以下 Copilot 菜单项：

### 1. 应用 Copilot 配置到此文件夹

**功能**: 将当前选中的 Prompts/Agents 应用到指定文件夹

**使用流程**:
1. 在侧边栏勾选需要的配置
2. 右键点击目标文件夹
3. 选择 "应用 Copilot 配置到此文件夹"
4. 确认配置列表
5. 点击"确认应用"

**效果**:
- 创建或更新 `.github/copilot-instructions.md`
- 创建或更新 `.github/agents/` 目录
- 自动添加到 `.gitignore`

**适用场景**:
- ✅ 为新项目快速配置 Copilot
- ✅ 为多个子项目分别配置
- ✅ 快速切换不同配置方案

---

### 2. 清除此文件夹的 Copilot 配置

**功能**: 删除指定文件夹的所有 Copilot 配置

**使用流程**:
1. 右键点击目标文件夹
2. 选择 "清除此文件夹的 Copilot 配置"
3. 确认删除操作（⚠️ 不可撤销）

**效果**:
- 删除 `.github/copilot-instructions.md`
- 删除 `.github/agents/` 目录

**适用场景**:
- ✅ 清理测试配置
- ✅ 重置项目配置
- ✅ 切换到新配置方案

**注意**:
- ⚠️ 此操作不可撤销
- ⚠️ 会删除所有自定义的 agent 文件

---

### 3. 查看此文件夹的 Copilot 配置

**功能**: 查看指定文件夹当前的 Copilot 配置状态

**使用流程**:
1. 右键点击目标文件夹
2. 选择 "查看此文件夹的 Copilot 配置"
3. 查看配置详情

**显示信息**:
- ✅ `copilot-instructions.md` 状态（是否存在、行数）
- ✅ `agents/` 目录状态（是否存在、agent 数量）
- ✅ 具体的 agent 文件列表

**快捷操作**:
- 打开配置文件（在编辑器中查看）
- 打开 agents 目录（在资源管理器中显示）

**适用场景**:
- ✅ 检查项目配置状态
- ✅ 快速查看 agent 列表
- ✅ 验证配置是否生效

---

## 🎨 使用示例

### 场景 1: 为新项目配置 Copilot

```bash
# 1. 在侧边栏勾选配置
☑️ Vue 3 + TypeScript
☑️ TypeScript 严格模式
☑️ 国际化 (i18n)

# 2. 右键项目文件夹 → "应用 Copilot 配置到此文件夹"
# 3. 确认配置列表
# 4. 完成！项目已配置好 Copilot
```

### 场景 2: 多项目差异化配置

```bash
# 项目 A: Vue 前端项目
右键 projectA/ → 应用配置
勾选: Vue3, TypeScript, i18n

# 项目 B: Node 后端项目
右键 projectB/ → 应用配置
勾选: TypeScript, API 开发

# 项目 C: VS Code 插件
右键 projectC/ → 应用配置
勾选: VS Code Extension Dev, TypeScript
```

### 场景 3: 检查和清理配置

```bash
# 1. 查看配置状态
右键 project/ → "查看此文件夹的 Copilot 配置"
显示: copilot-instructions.md (256 行)
     agents/ (3 个 agent)

# 2. 清理旧配置
右键 project/ → "清除此文件夹的 Copilot 配置"
确认删除

# 3. 应用新配置
右键 project/ → "应用 Copilot 配置到此文件夹"
```

---

## 🔄 与侧边栏功能的对比

| 功能 | 侧边栏按钮 | 右键菜单 | 推荐场景 |
|------|-----------|---------|---------|
| 应用配置 | ✅ 应用到项目 | ✅ 应用到此文件夹 | 右键菜单更直观 |
| 选择目标 | ✅ 选择目标工作区 | ✅ 右键直接指定 | 右键菜单更快捷 |
| 清空配置 | ✅ 清空项目配置 | ✅ 清除此文件夹配置 | 功能相同 |
| 查看配置 | ✅ 显示当前生效的配置 | ✅ 查看此文件夹配置 | 右键菜单更详细 |

**建议**:
- 💡 **日常使用**: 优先使用右键菜单（更快捷）
- 💡 **批量操作**: 使用侧边栏（可以全选/清空）
- 💡 **查看生效**: 使用侧边栏状态栏（全局视角）

---

## ⚙️ 工作原理

### 右键菜单的触发条件

```typescript
"when": "explorerResourceIsFolder && resourceScheme == file"
```

**说明**:
- ✅ 只在**文件夹**上显示（文件上不显示）
- ✅ 只在**本地文件系统**上显示（远程/虚拟文件系统不显示）
- ✅ 自动识别是否为工作区文件夹

### 配置应用逻辑

```
右键文件夹
    ↓
识别工作区 (workspace.getWorkspaceFolder)
    ↓
检查是否有选中配置
    ↓
显示确认对话框 (包含配置列表)
    ↓
应用到 .github/ 目录
    ↓
添加到 .gitignore
    ↓
完成 ✅
```

---

## 🐛 常见问题

### Q: 右键菜单不显示？

**原因**:
- 右键点击的是文件而非文件夹
- 不在工作区内的文件夹
- 插件未正确加载

**解决**:
1. 确认右键点击的是**文件夹**
2. 确认文件夹在当前工作区内
3. 重新加载 VS Code 窗口 (`Developer: Reload Window`)

### Q: 提示"无法识别工作区文件夹"？

**原因**: 右键的文件夹不属于任何工作区

**解决**: 
- 打开包含该文件夹的工作区
- 或将文件夹添加到工作区 (`File > Add Folder to Workspace`)

### Q: 提示"当前未选择任何配置"？

**原因**: 侧边栏未勾选任何 Prompts/Agents

**解决**:
1. 打开侧边栏 "Copilot Prompts" 面板
2. 勾选需要的配置
3. 返回右键应用

### Q: 配置应用后 Copilot 不生效？

**检查步骤**:
1. 确认 `.github/copilot-instructions.md` 已创建
2. 重启 VS Code 窗口
3. 在 Copilot Chat 中测试（应该会引用配置内容）
4. 查看插件输出日志 (`Copilot Prompts Manager`)

---

## 💡 最佳实践

### 1. 配置前先查看

```bash
右键文件夹 → "查看此文件夹的 Copilot 配置"
# 了解当前状态，避免覆盖重要配置
```

### 2. 使用确认对话框

```bash
# 对话框会显示将要应用的配置列表
# 仔细检查后再点击"确认应用"
```

### 3. 定期清理测试配置

```bash
# 开发/测试环境的配置应该及时清理
右键 test-project/ → "清除此文件夹的 Copilot 配置"
```

### 4. 多项目使用不同配置

```bash
# 前端项目
右键 frontend/ → 应用 [Vue3, TypeScript, i18n]

# 后端项目
右键 backend/ → 应用 [TypeScript, API 开发]

# 文档项目
右键 docs/ → 应用 [Markdown, 写作助手]
```

---

## 🎯 快捷键建议

虽然右键菜单本身没有默认快捷键，但你可以自定义：

**打开键盘快捷键设置** (`Cmd+K Cmd+S`)：

```json
{
  "key": "ctrl+shift+c a",
  "command": "copilotPrompts.applyToFolder",
  "when": "explorerViewletFocus"
},
{
  "key": "ctrl+shift+c v",
  "command": "copilotPrompts.viewFolderConfig",
  "when": "explorerViewletFocus"
},
{
  "key": "ctrl+shift+c x",
  "command": "copilotPrompts.clearFolderConfig",
  "when": "explorerViewletFocus"
}
```

---

**更新时间**: 2025-12-11  
**适用版本**: v1.3.0+  
**相关文档**: [INSTALL_GUIDE.md](INSTALL_GUIDE.md) | [README.md](../../README.md)
