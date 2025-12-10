---
description: 'VitaSage 工业配方管理系统专用代理 - 引用中央 prompts 规范'
tools: ['edit', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'com.figma.mcp/mcp/*', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'openSimpleBrowser', 'fetch', 'githubRepo', 'extensions', 'todos', 'runSubagent']
---

# VitaSage 专用开发代理

**核心规范来源**: `.github/copilot-instructions.md` (链接自中央 prompts 仓库)

## 📚 规范文档引用

本 agent 遵循以下规范（按优先级排序）：

1. **项目专用规范**: `prompts/industry/vitasage-recipe.md`
   - VitaSage 特有的 API 调用模式
   - LogicFlow 流程图系统
   - 国际化强制要求
   - 分页和 CRUD 标准

2. **Vue 3 通用规范**: `prompts/vue/vue3-typescript.md`
   - Composition API 标准
   - 组件结构规范
   - Props/Emits 类型定义

3. **TypeScript 规范**: `prompts/common/typescript-strict.md`
   - 零 any 类型
   - 严格空检查
   - 类型安全要求

4. **国际化规范**: `prompts/common/i18n.md`
   - 所有文本必须使用 $t()
   - 动态文本映射模式

---

## 🎯 快速参考

### 必须遵守的核心原则

1. **最小改动** - 只修改必要代码，避免重构
2. **类型安全** - 禁用 `any`，所有参数有类型
3. **国际化强制** - 所有 UI 文本使用 `$t()`
4. **错误处理** - try-catch-finally 三位一体

### API 调用标准模式

```typescript
import api from '@api'  // 必须使用别名

const getList = async () => {
  try {
    listLoading.value = true
    const agin = await api.$getUserPageList(params)
    if (agin.success) {
      list.value = agin?.Data?.data || []
      total.value = agin?.Data?.total_count || 0
    }
  } catch (err) {
    console.error(err)
  } finally {
    listLoading.value = false
  }
}
```

### 组件开发模板

```typescript
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '@api'

// 国际化 (必须)
const { appContext } = getCurrentInstance()!
const $t = appContext.config.globalProperties.$t

// 类型定义
interface FormData {
  id?: number
  name: string
}

// 响应式状态
const listLoading = ref(false)
const list = ref<FormData[]>([])
```

### 路径别名

```typescript
@api    → src/api/index
@com    → src/components
@stores → src/stores
@       → src/
```

---

## ⚠️ 禁止模式

- ❌ `axios.post()` 直接调用
- ❌ 硬编码文本（不用 `$t()`）
- ❌ `any` 类型
- ❌ Options API (`data()`, `methods`)
- ❌ 不清理 loading 状态
- ❌ 无关代码重构

---

## 📋 代码审查清单

生成代码前确认：
- [ ] API 使用 `api.$method`
- [ ] 有 try-catch-finally
- [ ] 所有文本国际化
- [ ] `<script setup lang="ts">`
- [ ] 函数参数/返回值有类型
- [ ] 删除操作有确认

---

## 🔄 规范更新

本 agent 文件引用中央 prompts 仓库，更新方式：

```bash
# 更新 prompts
cd .github/prompts
git pull origin main

# 无需修改本 agent 文件，规范自动同步
```

---

**完整规范**: 查看 `.github/copilot-instructions.md` 获取详细说明
**参考示例**: 
- CRUD: `src/views/classMain/classConfig/UnitClass.vue`
- 表达式: `src/components/expression/index.vue`
- 流程图: `src/components/flow/Flow.vue`
