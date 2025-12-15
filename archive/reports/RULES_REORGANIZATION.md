# 📊 规则归纳整理报告

## 🎯 归纳原则

1. **通用框架规范** → `standards/frameworks/vue3-composition.md`
2. **库专用规范** → `standards/libraries/element-plus.md`  
3. **项目特定规范** → `agents/vitasage.agent.md` (保留)
4. **核心开发规范** → `standards/core/code-style.md`

---

## ✅ 已完成的优化

### 1. Vue 3 通用规范补充 (`vue3-composition.md`)

**新增内容**:
- ✅ **模板规范**: 禁止内联样式 (`style="color: red"`)
- ✅ **模板规范**: 禁止复杂表达式 (应使用计算属性)
- ✅ **模板规范**: 避免在 v-for 中调用方法 (应使用计算属性缓存)
- ✅ **组件通信**: v-model 双向绑定标准模式
- ✅ **组件通信**: 多个 v-model 使用方式
- ✅ **组件通信**: Provide/Inject 跨层级通信
- ✅ **禁止模式**: Options API
- ✅ **禁止模式**: 使用 `this`
- ✅ **禁止模式**: 直接修改 props
- ✅ **禁止模式**: reactive 重新赋值
- ✅ **禁止模式**: 解构 reactive 对象
- ✅ **最佳实践**: 组件结构顺序规范
- ✅ **最佳实践**: ref vs reactive 使用场景
- ✅ **最佳实践**: 响应式陷阱避免指南

### 示例对比

```vue
<!-- ❌ 错误: vitasage 中发现的反模式 -->
<template>
  <div style="color: red">错误文本</div>
  <div>{{ items.filter(i => i.active).map(i => i.name).join(', ') }}</div>
</template>

<!-- ✅ 正确: 已添加到 vue3-composition.md -->
<template>
  <div class="error-text">正确文本</div>
  <div>{{ activeItemNames }}</div>
</template>

<script setup>
const activeItemNames = computed(() => 
  items.value.filter(i => i.active).map(i => i.name).join(', ')
)
</script>

<style scoped>
.error-text {
  color: red;
}
</style>
```

---

## 📋 规则分类建议

### A. 应保留在 `vitasage.agent.md` (项目特定)

这些是 VitaSage 项目独有的规范:

```markdown
✅ 保留:
- API 调用模式 (api.$method 别名)
- LogicFlow 流程图系统规范
- 国际化强制要求 ($t() 必须)
- messages.ts 翻译键同步流程
- 表格编辑-取消-提交模式 (subList 备份机制)
- el-drawer 表格样式 (项目主题相关)
- 路径别名 (@api, @com, @stores)
- CRUD 分页标准模式
- 需求理解确认规范
- VitaSage 特定代码审查清单
```

### B. 已移到 `standards/frameworks/vue3-composition.md` (通用)

这些是所有 Vue 3 项目通用的规范:

```markdown
✅ 已移动:
- 禁止内联样式
- 禁止复杂模板表达式
- 禁止在模板中调用方法进行数据转换
- 使用计算属性缓存
- v-model 双向绑定模式
- Props/Emits 类型定义
- ref vs reactive 使用场景
- 响应式陷阱避免
- Composables 编写规范
- 生命周期钩子使用
- 组件结构顺序
```

### C. 应补充到 `standards/libraries/element-plus.md`

这些是 Element Plus 相关的通用规范:

```markdown
🔄 建议补充:
- 表单验证国际化模式
- ElMessage/ElMessageBox 国际化
- 表格列标题国际化 (:label="$t('xxx')")
- 输入框占位符国际化 (:placeholder="$t('xxx')")
- 表格编辑模式的通用实现
- el-cascader checkStrictly 配置
```

### D. 应补充到 `standards/core/code-style.md`

这些是跨框架的核心规范:

```markdown
🔄 建议补充:
- 错误处理: try-catch-finally 三位一体
- 加载状态管理 (必须在 finally 中重置)
- 最小改动原则
- 类型安全: 禁用 any
- 代码审查清单
```

---

## 🆕 新增的 Vue 3 最佳实践

### 1. 模板复杂度控制

```vue
<!-- ❌ 禁止 -->
<template>
  <div>{{ items.filter(i => i.status === 'active').map(i => ({ ...i, label: i.name })).slice(0, 10).join(', ') }}</div>
</template>

<!-- ✅ 推荐 -->
<script setup>
const displayItems = computed(() => 
  items.value
    .filter(i => i.status === 'active')
    .map(i => ({ ...i, label: i.name }))
    .slice(0, 10)
    .join(', ')
)
</script>

<template>
  <div>{{ displayItems }}</div>
</template>
```

### 2. 样式管理

```vue
<!-- ❌ 禁止 -->
<div :style="{ color: error ? 'red' : 'green', fontSize: '14px' }">

<!-- ✅ 推荐方式1: 动态 class -->
<div :class="{ 'error-text': error, 'success-text': !error }">

<!-- ✅ 推荐方式2: 计算属性 + scoped style -->
<div :class="statusClass">

<script setup>
const statusClass = computed(() => error.value ? 'error-text' : 'success-text')
</script>

<style scoped>
.error-text {
  color: red;
  font-size: 14px;
}
.success-text {
  color: green;
  font-size: 14px;
}
</style>
```

### 3. 避免模板中频繁调用方法

```vue
<!-- ❌ 性能问题: 每次渲染都会调用 -->
<div v-for="item in items" :key="item.id">
  {{ formatDate(item.createdAt) }}
  {{ calculateDiscount(item.price, item.discount) }}
</div>

<!-- ✅ 推荐: 使用计算属性缓存 -->
<script setup>
const formattedItems = computed(() => 
  items.value.map(item => ({
    ...item,
    formattedDate: formatDate(item.createdAt),
    finalPrice: calculateDiscount(item.price, item.discount)
  }))
)
</script>

<template>
  <div v-for="item in formattedItems" :key="item.id">
    {{ item.formattedDate }}
    {{ item.finalPrice }}
  </div>
</template>
```

### 4. 响应式数据管理

```typescript
// ✅ ref - 适用场景
const count = ref(0)                    // 基本类型
const user = ref<User | null>(null)     // 可能为 null 的对象
const list = ref<Item[]>([])            // 需要重新赋值的数组

// ✅ reactive - 适用场景
const form = reactive({                 // 表单对象 (不会重新赋值)
  name: '',
  email: '',
  age: 0
})

const state = reactive({                // 组件状态 (不会重新赋值)
  loading: false,
  error: null
})

// ❌ 错误用法
const state = reactive({ count: 0 })
state = reactive({ count: 1 })          // 失去响应式！

const { count } = reactive({ count: 0 }) // 失去响应式！
```

---

## 🔧 建议的后续优化

### 1. 创建 Element Plus 国际化规范

```markdown
# standards/libraries/element-plus-i18n.md

## 表单验证国际化
const rules = {
  name: [
    { required: true, message: $t('请输入姓名'), trigger: 'blur' }
  ]
}

## 消息提示国际化
ElMessage.success($t('操作成功'))
ElMessageBox.confirm($t('确认删除吗？'), $t('警告'))

## 组件属性国际化
<el-table-column :label="$t('用户名')" />
<el-input :placeholder="$t('请输入')" />
```

### 2. 创建错误处理通用规范

```markdown
# standards/patterns/error-handling.md

## 异步操作标准模式
const loading = ref(false)

const fetchData = async () => {
  try {
    loading.value = true
    const res = await api.getData()
    if (res.success) {
      data.value = res.data
    }
  } catch (err) {
    console.error(err)
    ElMessage.error($t('操作失败'))
  } finally {
    loading.value = false  // 必须在 finally 中重置
  }
}
```

### 3. 优化代码审查清单

```markdown
# 通用 Vue 3 审查清单
- [ ] 使用 <script setup lang="ts">
- [ ] 所有 Props/Emits 有类型
- [ ] 无内联样式
- [ ] 无复杂模板表达式
- [ ] 计算属性替代模板中的方法调用
- [ ] 使用 scoped CSS
- [ ] 正确使用 ref/reactive

# VitaSage 项目额外检查
- [ ] API 使用 api.$method
- [ ] 所有文本使用 $t()
- [ ] 翻译键在 messages.ts 中存在
- [ ] try-catch-finally 完整
- [ ] loading 在 finally 中重置
```

---

## 📊 统计总结

| 规范类型 | 数量 | 位置 | 状态 |
|---------|------|------|------|
| Vue 3 通用规范 | 15+ | vue3-composition.md | ✅ 已优化 |
| Element Plus 通用 | 8+ | element-plus.md | 🔄 待补充国际化部分 |
| VitaSage 项目特定 | 12+ | vitasage.agent.md | ✅ 保持现状 |
| 核心开发规范 | 6+ | code-style.md | 🔄 待补充错误处理 |

---

## ✅ 执行建议

### 立即行动
1. ✅ Vue 3 模板规范已补充完成
2. ✅ 响应式最佳实践已添加
3. ✅ 禁止模式清单已完善

### 后续优化 (可选)
1. 补充 Element Plus 国际化专项规范
2. 创建错误处理通用模式文档
3. 提取代码审查清单到独立文件

### 使用方式
- **新 Vue 3 项目**: 直接使用 `standards/frameworks/vue3-composition.md`
- **VitaSage 开发**: 继续使用 `agents/vitasage.agent.md` (已引用通用规范)
- **国际化重点**: 使用 `standards/libraries/i18n.md` + VitaSage 的 messages.ts 同步规范

---

**总结**: 通用的 Vue 3 框架规范已成功提取并优化,项目特定的业务规则保留在 agent 中,实现了清晰的分层管理! 🎉
