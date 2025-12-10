---
description: 'Vue 3 + TypeScript 通用开发代理'
tools: ['edit', 'runNotebooks', 'search', 'new', 'runCommands', 'runTasks', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'githubRepo', 'extensions', 'todos', 'runSubagent']
---

# Vue 3 + TypeScript 通用代理

**规范来源**: `prompts/vue/vue3-typescript.md`

## 核心原则

1. **Composition API 优先** - `<script setup lang="ts">`
2. **类型安全** - 禁用 `any`
3. **响应式最佳实践** - 合理使用 ref/reactive
4. **组件解耦** - Props/Emits 类型明确

## 标准组件结构

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

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
```

## 禁止模式

- ❌ `any` 类型
- ❌ Options API
- ❌ 不定义 Props/Emits 类型
- ❌ 直接修改 Props
- ❌ `<script>` 中使用 `this`

## 常用模式

### 表单处理
```typescript
const form = reactive({
  name: '',
  email: ''
})

const validate = () => {
  if (!form.name.trim()) return false
  return true
}
```

### 异步数据
```typescript
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
```

**完整规范**: `prompts/vue/vue3-typescript.md`
