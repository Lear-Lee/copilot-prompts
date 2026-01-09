<!-- ⚠️ 此文件由 Copilot Prompts MCP Server 生成 -->
<!-- ℹ️ 你可以添加自定义内容，使用 CUSTOM_START/CUSTOM_END 标记保护 -->

<!-- 🎯 作用域：此配置仅适用于当前项目 -->
<!-- 项目名称: YourProject -->
<!-- 项目路径: /path/to/your/project -->

# 项目开发规范 - Copilot 指令

> 📌 **配置信息**
> - 生成时间: 2026-01-09
> - 配置方式: MCP Token 优化模式
> - Token 节省: 95%+ ✅

---

## ⚠️ 强制执行检查点

> **此检查点的优先级高于本文件的所有其他内容**

在执行**任何**以下操作前，必须先完成规范加载验证：

### 受限操作清单

- ❌ 创建任何代码文件（.vue、.ts、.tsx、.js 等）
- ❌ 修改任何代码文件
- ❌ 使用 `replace_string_in_file` 或 `multi_replace_string_in_file`
- ❌ 生成任何代码片段

### 强制验证流程

1. **检查项目作用域** - 确认当前操作的文件路径包含 `/YourProject/`
2. **加载相关规范** - 根据文件类型调用对应的 MCP 工具：
   - Vue 文件 → `use_preset({ preset: "vue3-form" })` 或 `get_smart_standards()`
   - TypeScript 文件 → `get_compact_standards({ currentFile: "xxx.ts" })`
   - 特定场景 → 选择合适的预设或工具
3. **验证加载成功** - 确认工具返回了规范内容
4. **声明已加载** - 在响应中明确说明：`✅ 已加载规范: [工具名称]`

### 违规处理

- 如果未加载规范就生成代码 → **此操作无效，必须重新执行**
- 如果出现语法错误 → **深刻反思，检查是否遵循了规范**
- 如果出现低级错误 → **停止操作，重新加载规范后再继续**

---

## 🎯 作用域限制

**⚠️ 此配置仅在以下情况生效：**

1. 当前编辑的文件路径包含: `/YourProject/`
2. 或当前工作目录为: `/path/to/your/project`

**如果你在其他项目工作，请完全忽略此配置文件中的所有规范和指令。**

---

## ⚡ MCP 工具使用指南（Token 优化）

> **核心理念**：不在配置文件中写规范，而是指导 AI 如何按需加载规范

### 推荐工具（按优先级）

| 优先级 | 工具 | Token 消耗 | 适用场景 |
|-------|------|-----------|---------|
| 🥇 | `use_preset` | ~500 | **最推荐**：表单、表格、API 等常见场景 |
| 🥈 | `get_smart_standards` | ~2000 | 零参数，智能推荐 |
| 🥉 | `get_compact_standards` | ~2000 | 精准控制（key-rules 模式） |
| 🚫 | `get_relevant_standards` | ~15000 | 仅在需要完整规范时使用 |

### 快速参考

```typescript
// 📋 创建表单组件
use_preset({ preset: "vue3-form" })

// 📊 创建数据表格
use_preset({ preset: "vue3-table" })

// 🌐 创建 API 接口
use_preset({ preset: "api-call" })

// 💾 创建 Pinia Store
use_preset({ preset: "pinia-store" })

// 🎯 零参数智能推荐
get_smart_standards()

// 🔍 按文件类型精准加载
get_compact_standards({ 
  currentFile: "src/views/User.vue",
  mode: "key-rules"  // 默认，推荐
})
```

### 标准开发流程

1. ✅ **强制**: 加载规范（调用 MCP 工具）
2. 理解需求
3. 编写代码（遵循已加载的规范）
4. 验证规范（确保符合要求）

---

## 📦 项目特定配置

<!-- CUSTOM_START -->
<!-- 在这里添加你的项目特定规范，这些内容会在配置更新时被保留 -->

### 国际化规范

- 所有文案使用 `$t('key')` 格式
- 新增文案需同时添加中英文翻译

### API 调用规范

- 统一使用 `/src/api/` 目录管理接口
- 接口命名遵循 RESTful 风格

### 组件开发规范

- 使用 Composition API
- 使用 `<script setup>` 语法
- 导出类型定义

<!-- CUSTOM_END -->

---

## 🚫 禁止事项

### 文档创建零容忍

- ❌ **绝对禁止**：用户未明说时创建任何 .md 文档
- ❌ **禁止主动询问**："是否需要创建文档？"
- ✅ **正确做法**：仅在用户明确要求时创建文档

### 代码质量零容忍

**每次编辑后必检：**
- ✅ 所有开始标签都有对应的结束标签
- ✅ 缩进正确，嵌套层级清晰
- ✅ 没有孤立的标签或重复的开始标签
- ✅ Vue SFC 结构完整：`<template>` + `<script>` + `<style>`

---

## 📚 相关资源

- [MCP Token 优化指南](https://github.com/ForLear/copilot-prompts/blob/main/docs/guides/MCP_TOKEN_OPTIMIZATION.md)
- [预设场景列表](https://github.com/ForLear/copilot-prompts/blob/main/mcp-server/README.md#预设场景)
- [规范库结构](https://github.com/ForLear/copilot-prompts/tree/main/standards)

---

**维护者**: MTA 工作室  
**最后更新**: 2026-01-09
