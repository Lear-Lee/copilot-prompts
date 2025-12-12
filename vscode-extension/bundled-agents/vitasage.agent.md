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
- ❌ **硬编码中文文本**（绝对禁止！必须用 `$t()`）
- ❌ `any` 类型
- ❌ Options API (`data()`, `methods`)
- ❌ 不清理 loading 状态
- ❌ 无关代码重构
- ❌ **擅自更换组件类型**（如将 el-cascader 换成 el-select）

---

## 🔍 国际化检查（必须执行）

**在生成或修改任何 Vue 组件后，必须执行以下检查：**

### 1. 代码中文本检测
```bash
# 检查是否有未国际化的中文（排除注释）
grep -rn '[一-龥]' src/views/**/*.vue | grep -v '$t(' | grep -v '//'
```

### 2. 翻译键完整性检查（关键！）
**仅使用 `$t()` 还不够，必须确保翻译键存在于 `src/locales/messages.ts` 中！**

```bash
# 检查方法：启动项目后，在控制台查看是否有 "未添加国际化" 警告
# 如果有，必须在 messages.ts 中添加对应的翻译键
```

**常见问题：**
```vue
<!-- ❌ 错误：虽然用了 $t()，但翻译键不存在 -->
<el-button>{{ $t('查询') }}</el-button>  <!-- messages.ts 中没有 '查询' 键 -->

<!-- ✅ 正确：翻译键已在 messages.ts 中定义 -->
查询: ['Query', '查询'],  // 在 messages.ts 中
<el-button>{{ $t('查询') }}</el-button>  <!-- 在组件中使用 -->
```

### 3. 添加翻译键的标准流程
1. **发现缺失的键**：运行时在控制台看到 "未添加国际化: xxx"
2. **在 messages.ts 末尾添加**：
   ```typescript
   查询: ['Query', '查询'],
   创建时间: ['Created At', '创建时间'],
   手机号: ['Phone Number', '手机号'],
   ```
3. **分类组织**：将相关的键放在一起（如系统管理、表单验证等）
4. **验证**：刷新页面，确认警告消失

### 4. 常见遗漏场景
- ✅ **按钮文本**: `<el-button>{{ $t('确认') }}</el-button>`
- ✅ **表格列标题**: `:label="$t('用户名')"`
- ✅ **输入框占位符**: `:placeholder="$t('请输入')"`
- ✅ **消息提示**: `ElMessage.success($t('操作成功'))`
- ✅ **确认对话框**: `ElMessageBox.confirm($t('确认删除吗？'), $t('警告'), {...})`
- ✅ **表单验证**: `{ required: true, message: $t('不能为空'), trigger: 'blur' }`
- ✅ **下拉选项**: `:label="$t('选项名')"`
- ✅ **Tab 标签**: `:label="$t('标签页')"`

### 3. 禁止的错误模式
```vue
<!-- ❌ 绝对禁止 -->
<el-button>保存</el-button>
<el-table-column label="名称" />
<el-input placeholder="请输入用户名" />
ElMessage.success('操作成功')
{ required: true, message: '不能为空' }

<!-- ✅ 正确 -->
<el-button>{{ $t('保存') }}</el-button>
<el-table-column :label="$t('名称')" />
<el-input :placeholder="$t('请输入用户名')" />
ElMessage.success($t('操作成功'))
{ required: true, message: $t('不能为空') }
```

### 4. 动态文本映射
```typescript
// ✅ 正确 - 使用对象映射
const statusMap = {
  0: $t('待审核'),
  1: $t('已通过'),
  2: $t('已拒绝')
}

// 模板中使用
{{ statusMap[row.status] }}

// 或内联映射
{{ { 0: $t('输入'), 1: $t('输出') }[row.type] }}
```

---

## 🔍 需求理解规范

### 核心原则：确认理解后再行动

在执行修改前，必须确认对需求的理解：

1. **区分"组件行为修改"与"组件类型替换"**
   - "让级联选择器支持选中第一级" ≠ "把级联选择器换成普通选择器"
   - 前者是修改组件行为，后者是替换组件类型

2. **术语准确性**
   - "一级/二级菜单" → 级联选择器的层级概念
   - "选中第一级" → 在级联选择器中 `checkStrictly: true` 允许选中非叶子节点

3. **遇到模糊需求时**
   - 先询问确认，而非假设
   - 列出你的理解让用户确认

### 示例：el-cascader 支持选中一级

```typescript
// ✅ 正确理解：修改级联选择器行为
const enumCascaderProps = {
  lazy: true,
  checkStrictly: true,  // 允许选中任意级别（包括一级）
  // ...
}

// ❌ 错误理解：替换为普通选择器
// 把 el-cascader 换成 el-select
```

---

## 📋 代码审查清单

生成代码前确认：
- [ ] API 使用 `api.$method`
- [ ] 有 try-catch-finally
- [ ] **所有中文文本已使用 $t()**（执行 grep 检查）
- [ ] **所有翻译键已在 messages.ts 中定义**（启动项目验证）
- [ ] `<script setup lang="ts">`
- [ ] 函数参数/返回值有类型
- [ ] 删除操作有确认
- [ ] **ElMessage/ElMessageBox 文本已国际化**
- [ ] **表单验证 message 已国际化**
- [ ] **表格列标题已国际化**
- [ ] **按钮文本已国际化**
- [ ] **输入框占位符已国际化**

### 国际化双重验证
1. ✅ **代码层面**：所有文本使用 `$t()`
2. ✅ **翻译层面**：所有键在 `messages.ts` 中存在
3. ✅ **运行验证**：控制台无 "未添加国际化" 警告
- [ ] **新增中文文案已同步到 message.ts**

---

## 🌐 国际化文案同步规范

**重要**: 在添加任何中文文案（使用 `$t()` 包裹的文本）后，必须检查并同步国际化文件。

### 文件位置
- 国际化文件: `src/locales/messages.ts`
- 格式: `key: ['English', '中文']`

### 操作流程

1. **添加新文案时**：
   ```vue
   <!-- 组件中使用 -->
   <el-button>{{ $t('请选择枚举类型') }}</el-button>
   ```

2. **检查 messages.ts**：
   ```typescript
   // src/locales/messages.ts
   export default {
     // ... 检查是否存在
     请选择枚举类型: ['Please select enum type', '请选择枚举类型'],
   }
   ```

3. **若不存在则添加**：在文件末尾 `}` 之前添加对应键值对

### 示例

```typescript
// 当添加如下代码时
ElMessage.success($t('保存成功'))
ElMessage.warning($t('请先选择一项'))

// 必须确保 messages.ts 中包含
保存成功: ['Save successful', '保存成功'],
请先选择一项: ['Please select an item first', '请先选择一项'],
```

---

## 🔄 表格编辑取消逻辑规范

### 核心模式

表格编辑采用"编辑-取消-提交"三按钮模式，需维护备份数据用于取消恢复：

```typescript
// 1. 数据获取时同时创建备份
const list = ref<any[]>([])
const subList = ref<any[]>([])  // 备份

const getList = async () => {
  const agin = await api.$getList(params)
  if (agin.success) {
    list.value = agin.Data
    subList.value = JSON.parse(JSON.stringify(agin.Data))  // 深拷贝备份
  }
}

// 2. 取消方法（推荐使用独立方法，避免模板内联）
const cancelListEdit = () => {
  list.value = JSON.parse(JSON.stringify(subList.value))
  editMode.value = true  // 切回查看模式
}

// 3. 模板中调用
<el-button @click="cancelListEdit" class="cancel_btn">{{ $t('取消') }}</el-button>

// 4. 提交成功后更新备份
const submitList = async () => {
  const agin = await api.$updateList({ list: list.value })
  if (agin.success) {
    subList.value = JSON.parse(JSON.stringify(list.value))  // 更新备份
    editMode.value = true
  }
}
```

### ⚠️ 常见 BUG

**1. 数据源不匹配**：取消按钮恢复的数据必须与表格绑定的数据对应

```typescript
// ❌ 错误：表格绑定 rightList.list，但恢复 list
<el-table :data="rightList.list">
<el-button @click="() => { list.value = JSON.parse(JSON.stringify(subList.value)); }">

// ✅ 正确：数据源一致
<el-table :data="rightList.list">
const cancelRightEdit = () => {
  if (rightSubList.value.list) {
    rightList.value.list = JSON.parse(JSON.stringify(rightSubList.value.list))
  }
  editR.value = true
}
```

**2. 模板内联函数中 ref 访问问题**：在 `<script setup>` 中，模板内联函数应使用 `.value`

```typescript
// ❌ 可能出问题：模板内联函数直接赋值 ref
@click="() => { list = JSON.parse(JSON.stringify(subList)) }"

// ✅ 推荐：使用独立方法
const cancelEdit = () => {
  list.value = JSON.parse(JSON.stringify(subList.value))
  editMode.value = true
}
@click="cancelEdit"
```

### 检查清单

- [ ] 每个可编辑表格都有对应的备份变量（`xxxSubList`）
- [ ] 取消按钮调用独立方法，而非模板内联逻辑
- [ ] 方法中使用 `.value` 访问 ref
- [ ] 取消方法恢复的数据源与表格 `:data` 绑定一致
- [ ] 提交成功后更新备份数据
- [ ] 使用 `JSON.parse(JSON.stringify())` 确保深拷贝

---

## 🎨 el-drawer 表格样式规范

在 el-drawer 中使用表格时，需注意输入控件的样式适配：

```scss
:deep(.el-drawer) {
  .el-table__body {
    /* 禁用状态：透明背景，无边框 */
    .el-input__wrapper,
    .el-select .el-input__wrapper {
      background-color: transparent !important;
      box-shadow: none !important;
    }
    
    /* 启用状态：使用 CSS 变量适配主题 */
    .el-input:not(.is-disabled) .el-input__wrapper,
    .el-select:not(.is-disabled) .el-input__wrapper {
      background-color: var(--el-fill-color-blank) !important;
      box-shadow: 0 0 0 1px var(--el-border-color) inset !important;
    }
  }
}
```

### ⚠️ 避免的问题

```scss
// ❌ 错误：硬编码颜色，不区分禁用/启用状态
.el-input__wrapper {
  background-color: #fff !important;  // 导致所有状态都是白色
}

// ✅ 正确：使用 CSS 变量 + 状态选择器
.el-input:not(.is-disabled) .el-input__wrapper {
  background-color: var(--el-fill-color-blank) !important;
}
```

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
