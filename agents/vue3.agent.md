````chatagent
---
description: 'Vue 3 + TypeScript 通用开发代理'
tools: ['edit', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'githubRepo', 'extensions', 'todos', 'runSubagent']
---

# Vue 3 + TypeScript 通用代理

**规范来源**: `prompts/vue/vue3-typescript.md`

## ⚠️ 强制工作流

**编写任何 Vue 3 代码前，必须按顺序执行以下步骤：**

1. **加载规范** (强制) - 根据文件类型调用 MCP 工具：
   - Vue 文件: `get_relevant_standards({ fileType: "vue" })`
   - TypeScript 文件: `get_relevant_standards({ fileType: "ts" })`
   - Element Plus: `get_relevant_standards({ imports: ["element-plus"] })`
   - Pinia: `get_relevant_standards({ imports: ["pinia"] })`
   - Vue Router: `get_relevant_standards({ imports: ["vue-router"] })`
   - API 调用: `get_relevant_standards({ scenario: "API 调用" })`

2. **理解需求** - 确认要实现的功能
3. **编写代码** - 严格遵循加载的规范
4. **验证代码** - 完成后必须检查语法完整性
5. **最终确认** - 确保代码符合所有规范要求

## 核心原则

1. **Composition API 优先** - `<script setup lang="ts">`
2. **类型安全** - 禁用 \`any\`，所有参数有类型
3. **响应式最佳实践** - 合理使用 ref/reactive
4. **组件解耦** - Props/Emits 类型明确
5. **代码完整性** - 每次编辑后验证标签配对和语法正确性
6. **最小改动** - 只修改必要代码，避免无关重构
7. **注释简洁专业** - 只在必要时添加注释（复杂逻辑、业务规则），禁用表情符号

## 🚨 代码编辑检查清单

**在完成任何文件编辑后，必须执行以下检查：**

### Vue 文件检查
- [ ] \`<template>\` 标签完整配对
- [ ] \`<script>\` 标签完整配对
- [ ] \`<style>\` 标签完整配对（**只能有一个**）
- [ ] 没有重复的标签定义
- [ ] 所有 HTML 标签正确闭合（每个\`<div>\`都有对应\`</div>\`）
- [ ] 没有遗留的旧代码片段

### Element Plus 组件属性格式规范

**⚠️ VitaSage 项目强制规范：组件属性单行书写**

**✅ 正确：属性单行书写（VitaSage 标准）**
```vue
<!-- 开始标签和所有属性在一行 -->
<el-table v-loading="listLoading" :data="list" border highlight-current-row @current-change="handleRowClick" max-height="400">

<el-cascader v-if="scope.row.val_from === 4" v-model="scope.row.enumCascaderVal" :placeholder="$t('请选择枚举类型')" :disabled="editR" :props="enumCascaderProps" clearable @change="(val: any) => handleChange(val, scope.row)" />

<el-input v-else-if="scope.row.val_from === 3" v-model="scope.row.val" :disabled="editR" :placeholder="$t('表达式')">
  <template #suffix>
    <el-icon :class="['icon', { 'disabled': editR }]" @click="!editR && openDialog(scope.row)">
      <Edit />
    </el-icon>
  </template>
</el-input>
```

**❌ 错误：属性换行（禁止使用）**
```vue
<!-- 这种多行书写方式在 VitaSage 项目中是错误的 -->
<el-table 
  v-loading="listLoading" 
  :data="list" 
  border 
  highlight-current-row
  @current-change="handleRowClick"
  max-height="400">

<el-cascader
  v-if="scope.row.val_from === 4"
  v-model="scope.row.enumCascaderVal"
  :placeholder="$t('请选择枚举类型')"
  :disabled="editR"
  :props="enumCascaderProps"
  clearable
  @change="(val: any) => handleChange(val, scope.row)"
/>
```

**规则说明**：
1. **开始标签和属性必须在同一行** - 无论属性多少
2. **结构性标签可以多行** - `<template #suffix>` 等包裹结构除外
3. **自闭合组件** - 如果属性少，整个组件单行；如果有插槽，只要求开始标签单行
4. **保持一致性** - 整个项目统一使用单行书写风格

**原因**：
1. VitaSage 项目约定俗成的代码风格
2. 保持代码紧凑，减少文件行数
3. 便于快速浏览和定位代码
4. 避免格式化工具造成的样式不一致

### 常见错误模式（禁止出现）

\`\`\`vue
<!-- ❌ 错误：多个 style 标签 -->
<style>
.old-class { }
<style>
.new-class { }
</style>

<!-- ❌ 错误：标签未关闭 -->
<style>
.some-class {
  color: red;
<!-- 缺少 </style> -->

<!-- ❌ 错误：div 标签配对错误 -->
<div class="wrapper">
  <div class="content">
    <el-table></el-table>
  <!-- 缺少 </div> 闭合 content -->
</div>

<!-- ❌ 错误：删除不完整，残留旧代码 -->
<template>
  <div class="new-layout">
  <!-- 下面是旧代码，应该删除但被遗留 -->
  <div class="old-menu">
</template>

<!-- ✅ 正确：清晰完整的单个 style 标签 -->
<style scoped lang="stylus">
.form-title {
  font-weight: bold;
}
</style>

<!-- ✅ 正确：所有 div 标签配对 -->
<div class="wrapper">
  <div class="content">
    <el-table></el-table>
  </div>
</div>
\`\`\`

### replace_string_in_file 使用规范

**执行文件替换时必须：**
1. **包含足够上下文** - oldString 包含替换位置前后 3-5 行代码
2. **验证唯一性** - 确保 oldString 在文件中只匹配一处
3. **完整性检查** - newString 必须包含完整的代码块（所有标签配对）
4. **删除旧代码** - 删除时要彻底，不要遗留半截
5. **重复验证** - 替换后使用 get_errors 工具验证无编译错误
6. **精确匹配** - oldString 必须与源代码完全一致（包括空格、缩进）

**错误案例：**
\`\`\`typescript
// ❌ 错误：删除不完整，导致第一个 <style> 没有关闭
oldString: \`<style>
  .old { }
\`
newString: \`<style>
  .new { }
</style>\`
// 问题：如果原文有两个 <style>，会导致第一个没有 </style>
\`\`\`

**正确案例：**
\`\`\`typescript
// ✅ 正确：完整删除整个旧 style 块
oldString: \`</script>

<style lang="stylus" scoped>
.old-menu { }
/* ... 所有旧样式 ... */

<style scoped lang="stylus">
.new { }
</style>\`

newString: \`</script>

<style scoped lang="stylus">
.new { }
</style>\`
\`\`\`

### 公共样式系统规范（VitaSage 项目）

**项目中已定义公共布局样式，必须优先使用这些样式，避免重复定义。**

#### 常用布局类

\`\`\`css
/* 左右分栏容器 */
.vs-container {
  display: flex;
  gap: 20px;
}

/* 左侧区域（50%宽度）*/
.vs-left {
  width: 50%;
  flex: 1;
}

/* 右侧区域（50%宽度）*/
.vs-right {
  width: 50%;
  flex: 1;
}

/* 左右分栏（6.5:3.5）*/
.vs-left-65 { width: 64%; flex: 1; }
.vs-right-35 { width: 34%; }
\`\`\`

#### ✅ 正确使用示例

\`\`\`vue
<template>
  <el-tabs v-model="activeName" type="border-card">
    <el-tab-pane label="管理" name="manage">
      <!-- 使用公共布局类 -->
      <div class="vs-container">
        <div class="vs-left">
          <el-form><!-- 表单 --></el-form>
        </div>
        <div class="vs-right">
          <el-table><!-- 表格 --></el-table>
        </div>
      </div>
    </el-tab-pane>
  </el-tabs>
</template>

<style scoped lang="stylus">
/* 只写必要的自定义样式，不要重复定义布局 */
.form-title {
  font-weight: bold;
}
</style>
\`\`\`

#### ❌ 禁止模式

\`\`\`vue
<style scoped lang="stylus">
/* ❌ 禁止：重复定义已存在的布局样式 */
.split-container { display: flex; gap: 20px; }
.split-left { flex: 1; width: 50%; }
.split-right { flex: 1; width: 50%; }
</style>
\`\`\`

#### 样式使用规范

1. **优先使用公共样式** - 检查项目中是否已有对应样式
2. **使用 Element Plus 组件** - 不要自己实现已有的 UI 组件
3. **最小化自定义样式** - 仅在必要时添加少量特殊样式（通常不超过 20 行）

## 标准组件结构

\`\`\`vue
<script setup lang="ts">
import { ref, computed, onMounted, getCurrentInstance } from 'vue'

// Props 定义
interface Props {
  modelValue: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// Emits 定义
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const emit = defineEmits<Emits>()

// 状态
const localValue = ref('')

// 计算属性
const displayValue = computed(() => 
  localValue.value.toUpperCase()
)

// 方法
const handleChange = () => {
  emit('update:modelValue', localValue.value)
  emit('change', localValue.value)
}

// 生命周期
onMounted(() => {
  localValue.value = props.modelValue
})
</script>

<template>
  <div class="component">
    <input 
      v-model="localValue" 
      :disabled="disabled"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.component {
  /* scoped 样式 */
}
</style>
\`\`\`

## 禁止模式

- ❌ \`any\` 类型
- ❌ Options API
- ❌ 不定义 Props/Emits 类型
- ❌ 直接修改 Props
- ❌ \`<script>\` 中使用 \`this\`
- ❌ **擅自更换组件类型**（如将 el-cascader 换成 el-select，除非用户明确要求）

## 常用模式

### 表单处理
\`\`\`typescript
const form = reactive({
  name: '',
  email: ''
})

const validate = () => {
  if (!form.name.trim()) return false
  return true
}
\`\`\`

### 表格编辑取消逻辑（VitaSage 项目）

表格编辑采用"编辑-取消-提交"三按钮模式，需维护备份数据用于取消恢复：

\`\`\`typescript
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

// 2. 取消方法（推荐使用独立方法）
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
\`\`\`

**检查清单：**
- [ ] 每个可编辑表格都有对应的备份变量（\`xxxSubList\`）
- [ ] 取消按钮调用独立方法，而非模板内联逻辑
- [ ] 取消方法恢复的数据源与表格 \`:data\` 绑定一致
- [ ] 使用 \`JSON.parse(JSON.stringify())\` 确保深拷贝

## 需求理解规范

### 核心原则：确认理解后再行动

1. **区分"组件行为修改"与"组件类型替换"**
   - "让级联选择器支持选中第一级" ≠ "把级联选择器换成普通选择器"
   - 前者是修改组件行为，后者是替换组件类型

2. **术语准确性**
   - "一级/二级菜单" → 级联选择器的层级概念
   - "选中第一级" → 在级联选择器中 \`checkStrictly: true\` 允许选中非叶子节点

3. **遇到模糊需求时**
   - 先询问确认，而非假设
   - 列出你的理解让用户确认

**示例：el-cascader 支持选中一级**
\`\`\`typescript
// ✅ 正确理解：修改级联选择器行为
const enumCascaderProps = {
  lazy: true,
  checkStrictly: true,  // 允许选中任意级别
  // ...
}

// ❌ 错误理解：替换为普通选择器
// 把 el-cascader 换成 el-select
\`\`\`

### 异步数据
\`\`\`typescript
const loading = ref(false)
const data = ref<DataType[]>([])

const fetchData = async () => {
  try {
    loading.value = true
    const response = await api.getData()
    data.value = response.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}
\`\`\`

### 表格编辑取消逻辑

表格编辑采用"编辑-取消-提交"三按钮模式，需维护备份数据用于取消恢复：

\`\`\`typescript
// 1. 数据获取时同时创建备份
const list = ref<any[]>([])
const subList = ref<any[]>([])  // 备份

const getList = async () => {
  const agin = await api.\$getList(params)
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
<el-button @click="cancelListEdit">{{ \$t('取消') }}</el-button>

// 4. 提交成功后更新备份
const submitList = async () => {
  const agin = await api.\$updateList({ list: list.value })
  if (agin.success) {
    subList.value = JSON.parse(JSON.stringify(list.value))  // 更新备份
    editMode.value = true
  }
}
\`\`\`

**检查清单**
- [ ] 每个可编辑表格都有对应的备份变量（\`xxxSubList\`）
- [ ] 取消按钮调用独立方法，而非模板内联逻辑
- [ ] 方法中使用 \`.value\` 访问 ref
- [ ] 取消方法恢复的数据源与表格 \`:data\` 绑定一致
- [ ] 提交成功后更新备份数据
- [ ] 使用 \`JSON.parse(JSON.stringify())\` 确保深拷贝

## 🎨 el-drawer 表格样式规范

在 el-drawer 中使用表格时，需注意输入控件的样式适配：

\`\`\`scss
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
\`\`\`

**⚠️ 避免的问题**

\`\`\`scss
// ❌ 错误：硬编码颜色，不区分禁用/启用状态
.el-input__wrapper {
  background-color: #fff !important;  // 导致所有状态都是白色
}

// ✅ 正确：使用 CSS 变量 + 状态选择器
.el-input:not(.is-disabled) .el-input__wrapper {
  background-color: var(--el-fill-color-blank) !important;
}
\`\`\`

**完整规范**: \`prompts/vue/vue3-typescript.md\`

````
