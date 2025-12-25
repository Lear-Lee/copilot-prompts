# Copilot Prompts 项目开发规范

> 本项目是 Copilot 配置的中央仓库，需要特别注意文档管理和代码质量。

## 🎯 核心原则

1. **文档为先** - 保持文档结构清晰、更新及时
2. **代码质量** - MCP 服务器代码需要严格的类型检查
3. **用户友好** - 配置简单、错误提示清晰
4. **向后兼容** - 配置格式更新时保持兼容性
5. **作用域隔离** - 生成的配置文件自动包含作用域限制，防止跨项目污染

---

## 🆕 v1.2.0 新特性：作用域限制

**问题**：VSCode workspace 包含多个项目时，所有项目的 `copilot-instructions.md` 都会被加载，导致上下文污染。

**解决方案**：自动在每个生成的配置文件中添加作用域声明：

```markdown
## 🎯 作用域限制

**⚠️ 此配置仅在以下情况生效：**

1. 当前编辑的文件路径包含: `/VitaSage/`
2. 或当前工作目录为: `/Users/pailasi/Work/VitaSage`

**如果你在其他项目工作，请完全忽略此配置文件中的所有规范和指令。**
```

**实现位置**：
- `setup-copilot.sh` - shell 脚本生成逻辑已更新
- `mcp-server/src/tools/generateConfig.ts` - MCP 服务器生成逻辑已更新
- `mcp-server/src/core/codeValidator.ts` - 验证器已修复 Markdown blockquote 支持

**测试验证**：
- ✅ Shell 脚本生成的配置包含作用域限制
- ✅ MCP 服务器生成的配置包含作用域限制
- ✅ 配置内容验证通过（支持 Markdown blockquote 语法）

---

## 📁 文件组织规范

### 根目录规则 ⚠️

**只允许以下文件存在于根目录：**
- ✅ `README.md` - 项目主文档（保持简洁，200-300行）
- ✅ Shell 脚本：`setup-copilot.sh`、`check-mcp-status.sh`
- ✅ 配置文件：`package.json`、`tsconfig.json` 等

**禁止在根目录放置：**
- ❌ 详细使用指南（应在 `docs/getting-started/`）
- ❌ 开发文档（应在 `docs/development/`）
- ❌ CHANGELOG（应在 `docs/development/CHANGELOG.md`）
- ❌ 其他 `.md` 文件（除了 README.md）

### docs/ 目录结构

```
docs/
├── getting-started/          # 新手入门
│   ├── QUICK_START.md
│   └── MCP_AUTO_RELOAD.md
├── guides/                   # 使用指南
│   ├── AGENTS_GUIDE.md
│   └── BEST_PRACTICES.md
├── development/              # 开发参考
│   ├── STRUCTURE.md
│   ├── TEST_GUIDE_v2.0.md
│   └── CHANGELOG.md
├── PROJECT_RULES.md          # 项目管理规范 ⭐
└── MCP_USAGE_DEMO.md
```

**详细规范请参考：** [docs/PROJECT_RULES.md](docs/PROJECT_RULES.md)

---

## 💻 MCP 服务器开发规范

### TypeScript 严格模式

```typescript
// tsconfig.json 必须启用
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true
  }
}
```

### 错误处理

**必须处理所有可能的异常：**
```typescript
// ❌ 错误示例
const file = fs.readFileSync(path); // 没有错误处理

// ✅ 正确示例
try {
    const file = fs.readFileSync(path);
} catch (error) {
    logger.error(`Failed to read file: ${error.message}`);
    return { error: `文件读取失败: ${path}` };
}
```

### 日志规范

```typescript
// 使用统一的日志接口
logger.log('正在分析项目...'); // 普通信息
logger.error('分析失败'); // 错误信息
logger.debug('详细调试信息'); // 调试信息（仅在 DEBUG 模式）
```

---

## 📝 文档编写规范

### README.md 规范

**长度控制：**
- 理想：200-300 行
- 最大：不超过 400 行
- 原则：能链接就不展开

**必须包含的章节：**
1. 项目简介（2-3句）
2. 核心功能（4-5个要点）
3. 项目结构（简化版）
4. 快速开始（3种方式）
5. 配置说明（简要）
6. 文档导航（分类清晰） ⭐
7. 贡献指南和许可证

### 其他文档规范

**文件命名：**
- 使用大写：`QUICK_START.md`、`CHANGELOG.md`
- 版本号：`TEST_GUIDE_v2.0.md`
- 描述性：清楚表达文档内容

**内容要求：**
- 开头说明目的和受众
- 使用清晰的标题层级
- 提供代码示例
- 标注更新日期

---

## 🔄 维护流程

### 添加新功能时

1. **更新代码** - 在 `mcp-server/src/` 添加功能
2. **编写测试** - 添加对应的测试用例
3. **更新文档** - 在合适的 docs 子目录添加说明
4. **更新 README** - 添加到文档导航
5. **更新 CHANGELOG** - 记录变更

### 添加新文档时

1. **确定分类** - getting-started / guides / development
2. **创建文件** - 放到对应目录
3. **更新 README** - 添加到 `📚 文档` 章节
4. **检查链接** - 确保所有引用正确

### 每次提交前

- ✅ 运行 `npm run build` 确保编译通过
- ✅ 检查 README.md 链接是否有效
- ✅ 确认没有在根目录添加不必要的 .md 文件
- ✅ 更新 CHANGELOG.md

---

## 🎯 工作流

### ⚠️ 强制要求：MCP 工具优先

**在编写任何代码、文档或配置前，必须先调用 MCP 工具加载相关规范！**

### 📦 模板应用指令

当用户说出以下指令时，按照模板系统规范执行：

**触发词**：
- "将 xx 模板应用到 xx 项目"
- "把 api/axios 模板复制到 xx"
- "给 xx 项目配置 API 层"

**执行流程**：

1. **识别模板**：
   | 关键词 | 模板路径 |
   |--------|----------|
   | axios / api / 请求封装 | `templates/vue/api-layer/` |
   | types / 类型 | `templates/common/types/` |

2. **确定目标**：
   | 模板 | 目标路径 |
   |------|----------|
   | vue/api-layer | `{项目}/src/api/` |
   | common/types | `{项目}/src/types/` |

3. **复制文件**：排除 `_CONFIG.md`，复制其他所有文件

4. **提示配置**：告知用户需调整的配置项（参考 `_CONFIG.md`）

**模板位置**：`/Users/pailasi/Work/copilot-prompts/templates/`

详细说明：[templates/README.md](../templates/README.md)

---

#### 开发 Agent 时

- 编写新 Agent → `get_relevant_standards({ scenario: "Agent 开发" })`
- 修改现有 Agent → 先加载对应技术栈的规范

#### 开发 MCP 服务器代码时

- TypeScript 代码 → `get_relevant_standards({ fileType: "ts" })`
- Node.js 相关 → `get_relevant_standards({ imports: ["node:fs", "node:path"] })`

#### 编写标准规范时

- Vue 规范 → 先查看现有 `standards/frameworks/vue3-composition.md`
- 新框架规范 → 参考 `standards/README.md` 的结构要求

#### 生成配置工具时

**核心要求**：确保所有生成的 `copilot-instructions.md` 都包含强制 MCP 工作流说明：

```typescript
// generateConfig.ts 必须包含以下内容
content += `## ⚠️ 强制工作流\n\n`;
content += `**在进行任何代码生成或修改之前，必须先调用 MCP 工具加载相关规范！**\n\n`;
// ... 添加具体的调用示例
```

### 🚨 代码质量零容忍政策

**绝对禁止出现的低级错误（每次编辑后必检）：**

#### HTML/Vue 模板语法错误
- ❌ **缺少结束标签** - `<div>...</div>` 必须配对
- ❌ **标签未闭合** - `<el-table>` 必须有 `</el-table>`
- ❌ **嵌套错误** - 检查所有 `{}`、`()`、`[]` 配对
- ❌ **多个 `<style>` 标签** - Vue SFC 只能有一个 style 块

**强制检查清单（每次编辑完成后）：**
```markdown
1. ✅ 所有开始标签都有对应的结束标签
2. ✅ 缩进正确，嵌套层级清晰
3. ✅ 没有孤立的 `</div>` 或重复的开始标签
4. ✅ Vue SFC 结构完整：<template> + <script> + <style>（最多各一个）
5. ✅ 所有 v-if/v-for 的元素都正确闭合
```

**工具辅助检查：**
- 使用 `get_errors` 工具检查编译错误
- 大型修改使用 `multi_replace_string_in_file` 前先验证旧代码
- 修改完成后立即用 `get_errors` 验证

#### 上下文污染问题
**问题**：每次对话引用5个不相关的 copilot-instructions.md 文件
**原因**：VSCode workspace 包含多个项目，系统自动附加所有项目的配置
**解决方案**：
1. **Agent 规范更新**：明确说明只关注当前工作目录的规范
2. **用户操作建议**：关闭无关项目文件夹，只保留当前工作项目

### 🚫 文档创建零容忍政策（适用所有项目）

**绝对禁止**：用户未明说创建文档的话绝对不要创建。

**具体要求**：
- ❌ **禁止主动询问**"是否需要创建文档？"
- ❌ **禁止自作主张**因为"记录工作"、"版本说明"、"总结"等理由创建 .md 文件
- ✅ **只有明确指令**：仅当用户明确说"创建 xxx.md"、"生成一个文档"时才创建
- ✅ **汇报即可**：工作完成后直接汇报结果，不创建总结文档

**违规示例**：
- ❌ 完成功能后自动创建 UPDATE_v1.2.0.md
- ❌ 看到项目有 CHANGELOG.md 就主动更新它（除非用户要求）
- ❌ 因为"需要记录"而创建任何 .md 文件

**正确做法**：
- ✅ 完成工作后简短汇报："已完成 xxx 功能，更新了 yyy 文件"
- ✅ 如果用户问"记录在哪"，回答"可以更新 CHANGELOG.md，需要我更新吗？"
- ✅ 等待用户明确指令后再操作

**此规则优先级**：最高 - 覆盖任何其他可能暗示"应该创建文档"的规则

### 标准开发流程

当你需要修改或添加内容时：

1. **加载规范** (强制) - 使用 MCP 工具获取相关编码规范
2. **理解现有代码** - 完整阅读要修改的文件，理解上下文
3. **代码修改** - 优先使用项目现有模式和结构，遵循已加载的规范
4. **语法检查** (强制) - 完成后立即检查标签配对、嵌套正确性
5. **编译验证** (强制) - 使用 get_errors 工具验证无编译错误
6. **类型安全** - 确保所有 TypeScript 类型正确
7. **错误处理** - 添加完善的异常处理
8. **自我检查** - 确认符合本规范
9. **禁止创建文档** (强制) - 除非用户明确要求

### Agent 编写规范

**每个 Agent 文件必须包含 `⚠️ 强制工作流` 章节：**

```markdown
## ⚠️ 强制工作流

**在编写任何代码前，必须先调用 MCP 工具：**

\`\`\`
get_relevant_standards({ fileType: "xxx" })
# 或
get_relevant_standards({ imports: ["xxx"] })
# 或
get_relevant_standards({ scenario: "xxx" })
\`\`\`
```

**示例：**
- [agents/vitasage.agent.md](agents/vitasage.agent.md) - 包含完整的强制工作流说明
- [agents/vue3.agent.md](agents/vue3.agent.md) - Vue 3 开发的强制要求
- [agents/i18n.agent.md](agents/i18n.agent.md) - 国际化场景的强制要求

---

**维护团队**: MTA工作室  
**制定日期**: 2025-12-16  
**最后更新**: 2025-12-16
