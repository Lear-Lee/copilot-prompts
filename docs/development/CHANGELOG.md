# Copilot Prompts 更新日志

## v2.1.0 (2025-12-16)

### 🎉 新增 Flutter/Dart 支持

#### 新增标准规范
- ✨ 添加 `standards/core/dart-base.md` - Dart 语言核心规范 (12KB)
- ✨ 添加 `standards/frameworks/flutter.md` - Flutter 框架规范 (22KB)
- ✨ 基于 Flutter 官方 Style Guide 和 Effective Dart
- ✨ 涵盖 Widget 设计、状态管理、性能优化

#### 新增 Agent
- ✨ 添加 `agents/flutter.agent.md` - Flutter 开发专家 Agent (14KB)
- ✨ 支持 Clean Architecture、测试、调试
- ✨ 包含完整的 MCP 工作流强制要求

#### 新增配置
- ✨ 添加 `configs/flutter-recipe.md` - Flutter 项目完整配置指南
- ✨ 支持 BLoC、Provider、Riverpod 状态管理
- ✨ 集成 Dio、go_router、local_auth 等常用包

#### 文档优化
- 📝 添加 `docs/guides/FLUTTER_GUIDE.md` - Flutter 快速指南
- 📝 添加 `docs/guides/FLUTTER_SETUP_SUMMARY.md` - 配置总结
- 📝 添加 `docs/guides/COPILOT_GITIGNORE_GUIDE.md` - 通用 .gitignore 指南 🌟
- 📝 添加 `docs/guides/GITIGNORE_OPTIMIZATION.md` - 配置优化详解
- 📝 添加 `docs/guides/GITIGNORE_QUICK_REFERENCE.md` - 快速参考

### 🔧 配置文件管理优化

#### .gitignore 最佳实践
- ✨ 为所有语言/框架添加 .gitignore 配置说明
- ✨ 更新 `standards/frameworks/vue3-composition.md` - 添加配置管理章节
- ✨ 更新 `common/typescript-strict.md` - 添加配置管理章节
- ✨ 更新 `common/i18n.md` - 添加配置管理章节
- ✨ 通用指南支持 JavaScript、Python、Java、Go、Rust、C#、Ruby、PHP

#### 项目模板
- ✨ 为 my_flutter 项目生成完整配置
- ✨ 添加 `.github/copilot-instructions.template.md`
- ✨ 添加 `.github/README.md` 配置说明
- ✨ 更新 `.gitignore` 排除自动生成的配置文件

#### VitaSage 项目更新
- ✨ 创建 `.github/copilot-instructions.template.md`
- ✨ 添加 `.github/README.md` 团队配置指南
- ✨ 已有 `.gitignore` 配置确认

### 📋 文档结构优化
- 🔧 修正根目录文件组织问题（遵循项目规范）
- 🔧 所有 Flutter 相关文档正确放置在 `docs/guides/`
- 🔧 更新 README.md 文档导航，新增 Flutter 章节

---

## v2.0.0 (2025-12-15)

### 🎉 重大更新

#### 移除内容
- ❌ 删除 VS Code Extension 开发相关代码和目录
- ❌ 删除 agent-manager.html 工具
- ❌ 删除 vscode-extension-dev.agent.md
- ❌ 清理过时的文档文件

#### MCP 服务器优化

**核心改进：**
- ✨ 升级到 v1.1.0
- ✨ 改进错误处理机制（SIGINT、SIGTERM、uncaughtException）
- ✨ 添加调试日志支持
- ✨ 优化日志输出格式
- ✨ 新增 `clean` 脚本命令

**新功能：**
- 🎯 更智能的项目分析
- 🎯 更准确的 Agent 匹配算法
- 🎯 更友好的错误提示

**文档更新：**
- 📝 完全重写 README.md
- 📝 更新项目结构说明
- 📝 添加 MCP 工具列表
- 📝 增加使用示例

### 🔧 技术栈

- **MCP SDK**: @modelcontextprotocol/sdk ^1.0.4
- **TypeScript**: 5.3.3
- **Node.js**: >= 18.0.0

### 📦 当前 Agents

- `vue3.agent.md` - Vue 3 + Composition API
- `typescript.agent.md` - TypeScript 严格模式
- `i18n.agent.md` - 国际化最佳实践
- `vitasage.agent.md` - VitaSage 工业配方系统
- `logicflow.agent.md` - LogicFlow 流程图开发

### 🎯 聚焦方向

本版本重新聚焦于核心功能：
1. **MCP 智能服务** - 作为主要交互方式
2. **Agent 库管理** - 提供高质量的开发规范
3. **自动化配置** - 减少手动配置工作

---

## v1.3.0 (之前版本)

- VS Code 扩展功能
- Agent Manager 工具
- 手动配置管理

---

**升级说明：**

如果你之前使用 VS Code 扩展，现在推荐：
1. 使用 MCP 服务器（在 Claude Desktop 或 VS Code MCP 中）
2. 或者手动复制 agents 文件到项目

**迁移步骤：**
```bash
# 1. 编译 MCP 服务器
cd mcp-server && npm install && npm run build

# 2. 配置 Claude Desktop 或 VS Code MCP
# 详见 README.md
```
