<!-- ⚠️ 此文件由开发者手动维护 -->
<!-- ⚠️ copilot-prompts 项目自身的开发指南 -->

# Copilot Prompts Manager - VS Code Extension 开发指南

> 📌 **项目定位**
> - VS Code 扩展开发
> - TypeScript 严格模式
> - 多工作区支持
> - TreeView + 命令系统

---

## ✅ 规范来源（单一事实来源）

为避免重复维护导致规范漂移，本仓库的 Copilot 指令以如下文件为**唯一权威来源**：

### 通过 MCP Resources 按需加载（推荐）

本项目使用 **MCP Standards Resources** 系统提供模块化编码规范：

- 核心规范：代码风格、TypeScript 基础
- 框架规范：Vue 3、Pinia
- 库规范：Element Plus、i18n
- 模式规范：API 层、组件设计

**优势**：
- 🚀 Token 节省 50-70%（仅加载相关规范）
- 🎯 智能匹配（根据文件类型、导入、场景自动推荐）
- ⚡ 更快响应（减少上下文大小）

**使用**：通过 MCP 工具 `get_relevant_standards` 自动获取相关规范。

### 传统引用文件（向后兼容）

- [common/typescript-strict.md](common/typescript-strict.md)（TypeScript 严格模式）
- [common/i18n.md](common/i18n.md)（国际化规范）

本文件只作为"入口说明"，后续更新请修改 `standards/` 目录或上述传统文件。

---

## 📋 应用的配置摘要

本项目现已使用 **MCP Standards Resources** 系统管理编码规范。

### 可用规范模块

**核心规范 (core)**
- code-style.md - 代码风格规范（命名、组织、注释）
- typescript-base.md - TypeScript 基础类型系统

**框架规范 (frameworks)**
- vue3-composition.md - Vue 3 Composition API 规范
- pinia.md - Pinia 状态管理规范

**库规范 (libraries)**
- element-plus.md - Element Plus 组件库使用规范
- i18n.md - 国际化 (vue-i18n) 规范

**模式规范 (patterns)**
- api-layer.md - API 层设计模式
- component-design.md - 组件封装与设计模式

### 如何使用

AI 可通过 MCP 工具自动匹配相关规范：
```typescript
// 示例：开发 Vue 3 表单组件
get_relevant_standards({
  fileType: "vue",
  imports: ["vue", "element-plus", "pinia"],
  scenario: "表单组件"
})
// 返回：core/code-style + core/typescript-base + 
//       frameworks/vue3-composition + libraries/element-plus + 
//       patterns/component-design
```

更新时间: 2025年12月15日
配置版本: v1.2.0（MCP Resources 支持）
