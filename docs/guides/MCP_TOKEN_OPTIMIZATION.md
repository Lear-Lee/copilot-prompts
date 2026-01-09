# MCP Token 优化指南

> **目标**：用精简的 copilot-instructions.md 替代动辄几百上千行的规范文件，避免巨量 token 消耗

---

## 🎯 核心问题

**传统方式的困境**：
- ❌ 将完整规范写入 `copilot-instructions.md`（500-2000+ 行）
- ❌ 每次对话都加载全部内容（消耗 15000-50000+ tokens）
- ❌ 规范更新需要手动同步到每个项目
- ❌ 多项目 workspace 容易造成规范冲突

**MCP 工具方式的优势**：
- ✅ `copilot-instructions.md` 只保留核心指令（50-100 行）
- ✅ 按需加载规范（~2000 tokens，节省 85%+）
- ✅ 规范集中管理，自动获取最新版本
- ✅ 智能匹配项目特征，推荐相关规范

---

## 🚀 快速开始

### 方式一：自动配置（推荐）

在 Copilot Chat 中直接说：

```
请帮我配置 MCP 规范系统
```

AI 会自动：
1. 调用 `mcp_mta_auto_setup` 创建 `.vscode/mcp.json`
2. 调用 `mcp_mta_analyze_project` 分析项目特征
3. 调用 `mcp_mta_generate_config` 生成精简的 `copilot-instructions.md`

生成的文件示例：

```markdown
# 项目开发规范 - Copilot 指令

## ⚠️ 强制工作流

**在进行任何代码生成或修改之前，必须先调用 MCP 工具加载相关规范！**

根据文件类型和场景，调用相应的 MCP 工具：

1. **Vue 文件** → `get_compact_standards({ currentFile: "xxx.vue" })`
2. **TypeScript 文件** → `get_compact_standards({ currentFile: "xxx.ts" })`
3. **特定场景**：
   - 表单组件: `use_preset({ preset: "vue3-form" })`
   - API 调用: `use_preset({ preset: "api-call" })`
   - Pinia Store: `use_preset({ preset: "pinia-store" })`

### 标准流程

1. ✅ **强制**: 加载规范
2. 理解需求
3. 编写代码
4. 验证规范

---

## 🎯 作用域限制

**⚠️ 此配置仅在以下情况生效：**

1. 当前编辑的文件路径包含: `/VitaSage/`
2. 或当前工作目录为: `/Users/xxx/Work/VitaSage`

**如果你在其他项目工作，请完全忽略此配置文件中的所有规范和指令。**
```

---

## 📖 手动使用 MCP 工具

### 工具选择

| 工具 | Token 消耗 | 适用场景 |
|------|-----------|---------|
| `use_preset` | ~500 | **最推荐**：常见场景快速加载 |
| `get_smart_standards` | ~2000 | 智能推荐（零参数） |
| `get_compact_standards` | ~2000 | 精准控制（需指定参数） |
| `get_relevant_standards` | ~15000 | 需要完整规范内容时 |

### 1. 预设场景（最简单）

```typescript
// 创建 Vue 3 表单组件
use_preset({ preset: "vue3-form" })

// 创建 API 调用层
use_preset({ preset: "api-call" })

// 创建 Pinia Store
use_preset({ preset: "pinia-store" })

// 创建 Vue 3 普通组件
use_preset({ preset: "vue3-component" })
```

### 2. 智能推荐（零参数）

```typescript
// 自动检测当前文件类型、导入、场景
get_smart_standards()

// 指定文件内容以提高准确度
get_smart_standards({
  currentFile: "src/views/UserForm.vue",
  fileContent: "..." // 可选
})
```

### 3. 精准控制

```typescript
// 按文件类型
get_compact_standards({ 
  currentFile: "xxx.vue",
  mode: "key-rules"  // 默认，推荐
})

// 按场景描述
get_compact_standards({ 
  scenario: "创建数据表格",
  mode: "key-rules"
})

// 仅获取规范列表（~500 tokens）
get_compact_standards({ 
  mode: "summary" 
})

// 需要完整内容时（~15000 tokens）
get_compact_standards({ 
  currentFile: "xxx.vue",
  mode: "full"
})
```

---

## 📝 copilot-instructions.md 最佳实践

### ✅ 应该包含

```markdown
## ⚠️ 强制工作流

**必须先调用 MCP 工具加载规范，再编写代码！**

推荐工具：
- 表单组件 → use_preset({ preset: "vue3-form" })
- API 调用 → use_preset({ preset: "api-call" })
- 其他场景 → get_smart_standards()

## 🎯 作用域限制

**此配置仅适用于：** `/ProjectName/` 路径下的文件

## 项目特定规则

- 国际化：所有文案使用 $t('key')
- API 路径：使用 /src/api/ 统一管理
- ... 其他项目特定配置
```

### ❌ 不应该包含

```markdown
❌ 不要：复制粘贴完整的 Vue 3 规范（500+ 行）
❌ 不要：复制粘贴完整的 TypeScript 规范（300+ 行）
❌ 不要：复制粘贴完整的 Element Plus 规范（200+ 行）
```

**原则**：
- 只写**如何加载规范**的指令
- 不写规范本身的详细内容
- 把详细规范交给 MCP 工具按需加载

---

## 📊 Token 节省效果

### 对比示例

| 方式 | 文件大小 | 每次加载 Token | 规范更新 |
|------|---------|---------------|---------|
| **传统方式** | 1500 行 | ~50000 | 手动同步 |
| **MCP 方式** | 80 行 | ~2000（按需）| 自动最新 |
| **节省比例** | 95% ↓ | 96% ↓ | ♾️ |

### 实际案例

**VitaSage 项目**：
- **优化前**：`copilot-instructions.md` 1200 行，每次消耗 ~40000 tokens
- **优化后**：`copilot-instructions.md` 60 行，按需加载 ~2000 tokens
- **节省效果**：95% ↓

---

## 🔧 常见问题

### Q1: 为什么首次使用没有自动生成 copilot-instructions.md？

**原因**：需要主动触发 MCP 工具

**解决方案**：
```
# 在 Copilot Chat 中说：
请帮我配置 MCP 规范系统

# 或手动调用：
mcp_mta_auto_setup()
```

### Q2: 如何验证 MCP 工具是否可用？

```
# 在 Copilot Chat 中说：
检查 MCP 健康状态

# 或手动调用：
mcp_mta_health_check({ verbose: true })
```

### Q3: 规范内容从哪里来？

- **来源**：`copilot-prompts` 仓库的 `standards/` 目录
- **优先级**：GitHub 在线版本 > 本地缓存
- **更新**：每次调用自动获取最新版本

### Q4: 多项目 workspace 如何避免规范冲突？

生成的 `copilot-instructions.md` 自动包含作用域限制：

```markdown
## 🎯 作用域限制

**此配置仅在以下情况生效：**
1. 当前编辑的文件路径包含: `/ProjectA/`
2. 或当前工作目录为: `/Users/xxx/Work/ProjectA`

**如果你在其他项目工作，请完全忽略此配置。**
```

---

## 🎓 最佳实践流程

### 新项目配置

```bash
# 1. 在项目根目录打开 VS Code
code /path/to/your/project

# 2. 打开 Copilot Chat，说：
"请帮我配置 MCP 规范系统"

# 3. 验证生成结果：
ls -la .github/copilot-instructions.md
ls -la .vscode/mcp.json

# 4. 重新加载窗口
Cmd+Shift+P → "Reload Window"
```

### 日常开发

```bash
# 创建新的 Vue 表单组件时
"创建一个用户信息表单组件，使用 Element Plus"
# AI 会自动调用: use_preset({ preset: "vue3-form" })

# 创建 API 调用时
"创建用户管理的 API 接口"
# AI 会自动调用: use_preset({ preset: "api-call" })

# 修改现有组件时
"优化这个表格组件的性能"
# AI 会自动调用: get_smart_standards()
```

---

## 📚 相关文档

- [MCP 自动配置指南](./MCP_AUTO_SETUP.md)
- [预设场景列表](../../mcp-server/README.md#预设场景)
- [规范目录结构](../../standards/README.md)
- [Agent 开发指南](./AGENTS_GUIDE.md)

---

**维护者**: MTA 工作室  
**更新时间**: 2026-01-09
