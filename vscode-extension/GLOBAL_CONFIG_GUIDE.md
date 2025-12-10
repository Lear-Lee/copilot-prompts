# 🔒 全局 Copilot 配置指南

## 问题
不想在项目中暴露 `.github/copilot-instructions.md` 配置文件

## 解决方案

### 方案1：VS Code 用户设置（推荐）⭐

GitHub Copilot 会读取用户级配置，无需在项目中创建文件。

#### 步骤

1. **打开 VS Code 用户设置 JSON**
   ```
   Cmd + Shift + P → "Preferences: Open User Settings (JSON)"
   ```

2. **添加全局 Copilot 指令**
   ```json
   {
     "github.copilot.advanced": {
       "inlineSuggestCount": 3,
       "authProvider": "github"
     },
     "github.copilot.editor.enableCodeActions": true,
     
     // 添加全局指令
     "github.copilot.chat.codeGeneration.instructions": [
       {
         "text": "你是 Vue 3 + TypeScript 专家，使用 Composition API"
       },
       {
         "text": "所有 UI 文本必须使用 $t() 国际化"
       },
       {
         "text": "API 调用使用 import api from '@api' 和 api.$method"
       },
       {
         "text": "禁用 any 类型，使用完整 TypeScript 定义"
       },
       {
         "text": "错误处理使用 try-catch-finally，loading 在 finally 中清理"
       }
     ]
   }
   ```

3. **重新加载 VS Code**
   ```
   Cmd + Shift + P → "Developer: Reload Window"
   ```

---

### 方案2：用户级 copilot-instructions.md

将配置文件放在用户目录，不在项目中。

#### 位置
```bash
~/.vscode/copilot-instructions.md
# 或
~/Library/Application Support/Code/User/copilot-instructions.md
```

#### 创建方式

**手动创建**：
```bash
# 创建目录
mkdir -p ~/.vscode

# 复制配置
cp /Users/pailasi/Work/copilot-prompts/agents/vitasage.agent.md \
   ~/.vscode/copilot-instructions.md
```

**通过插件创建**：
修改插件，添加"应用到全局"选项。

---

### 方案3：.gitignore 排除（简单）

如果必须使用项目级配置，可以排除版本控制：

```bash
# 在项目根目录 .gitignore 中添加
.github/copilot-instructions.md
.github/prompts
```

这样配置只在本地有效，不会提交到 Git。

---

## 🔧 插件支持（即将添加）

我会为插件添加"全局模式"选项：

### 新增功能
- ☑️ **应用到项目**（当前默认）
- ☑️ **应用到全局**（用户级）
- ☑️ **应用到工作区**（多项目）

### 使用方式
```
右键菜单 → "应用选中的配置 (全局)"
或
设置 → "Copilot Prompts: Apply Scope" → "Global"
```

---

## 📊 三种方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **VS Code 设置** | 纯配置，不需要文件 | 配置项有限 | ⭐⭐⭐⭐⭐ |
| **用户级文件** | 完整功能，全局生效 | 需要手动管理 | ⭐⭐⭐⭐ |
| **gitignore** | 简单快速 | 配置依然存在本地 | ⭐⭐⭐ |

---

## 🚀 立即使用（方案1）

**快速配置**：

```json
// settings.json (用户级)
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "作为 Vue 3 + TypeScript 专家，使用 <script setup lang=\"ts\">，所有参数有明确类型定义，禁用 any。API 调用使用 import api from '@api' 和 api.$method 模式，不要直接使用 axios。所有 UI 文本使用 $t() 国际化。错误处理使用完整的 try-catch-finally，loading 状态在 finally 中清理。删除操作需要 ElMessageBox.confirm 确认。"
    }
  ]
}
```

---

**需要我帮你修改插件，添加"全局模式"功能吗？**
