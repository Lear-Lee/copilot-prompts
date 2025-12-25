# Vue 3 Composition API 核心规范

## 🎯 核心原则

1. **使用 `<script setup lang="ts">`** - 简洁的 Composition API 语法
2. **类型安全优先** - 所有 Props/Emits 必须有类型定义
3. **响应式最佳实践** - 正确使用 ref/reactive
4. **模板规范** - 避免复杂逻辑,禁止内联样式
5. **组件解耦** - 清晰的 Props/Emits 接口

---

## 📐 模板代码格式规范

### 标签书写风格

根据项目不同，有两种标签书写风格：

#### 风格 A：单行书写（紧凑风格）

**特征**：开始标签和所有属性必须在同一行

```vue
<!-- ✅ 单行书写风格 - 所有标签 -->
<div class="container" :class="{ active: isActive }" @click="handleClick">
<el-button type="primary" :loading="loading" @click="submit">{{ $t('提交') }}</el-button>
<div v-for="item in list" :key="item.id" class="item" @click="select(item)">
<span v-show="isVisible" class="text">{{ content }}</span>

<!-- ❌ 禁止：多行书写 -->
<div 
  class="container"
  @click="handleClick">
  
<el-button
  type="primary"
  @click="submit">
```

**适用范围**：
- ⚠️ **所有 HTML 标签**（`<div>`, `<span>`, `<section>` 等）
- ⚠️ **所有 Vue 组件**（Element Plus、自定义组件等）
- ⚠️ **例外**：仅当单行过长（>120 字符）时可以换行

**检测方法**：
- .github/copilot-instructions.md 明确声明使用单行书写
- 或项目中 90% 以上标签使用单行书写
- 或用户明确要求紧凑风格

#### 风格 B：多行书写（标准风格）

**特征**：每个属性一行，便于阅读

```vue
<!-- ✅ 多行书写风格 -->
<div
  class="container"
  :class="{ active: isActive }"
  @click="handleClick">
  
<el-button
  type="primary"
  :loading="loading"
  @click="submit">
  {{ $t('提交') }}
</el-button>
```

**适用场景**：未明确要求单行书写的项目（默认）

---

## 组件基本结构

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

// 1. Props 定义
interface Props {
  modelValue: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// 2. Emits 定义
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const emit = defineEmits<Emits>()

// 3. 响应式状态
const localValue = ref('')
const isLoading = ref(false)

// 4. 计算属性
const displayValue = computed(() => 
  localValue.value.toUpperCase()
)

// 5. 方法
const handleChange = () => {
  emit('update:modelValue', localValue.value)
  emit('change', localValue.value)
}

// 6. 生命周期
onMounted(() => {
  localValue.value = props.modelValue
})
</script>

<template>
  <div class="my-component">
    <!-- ✅ 使用计算属性或方法处理复杂逻辑 -->
    <input 
      v-model="localValue" 
      :disabled="disabled"
      @change="handleChange"
    />
    
    <!-- ✅ 简单的条件渲染 -->
    <p v-if="isLoading">{{ $t('加载中') }}</p>
    
    <!-- ❌ 禁止：内联样式 -->
    <!-- <div style="color: red">错误示例</div> -->
    
    <!-- ❌ 禁止：复杂的模板表达式 -->
    <!-- <div>{{ items.filter(i => i.active).map(i => i.name).join(', ') }}</div> -->
    
    <!-- ✅ 正确：使用计算属性 -->
    <div>{{ activeItemNames }}</div>
  </div>
</template>

<style scoped>
/* ✅ 使用 scoped 样式替代内联样式 */
.my-component {
  /* 组件样式 */
}

.error-text {
  color: red;
}
</style>
```

## 组件通信

### v-model 双向绑定
```vue
<script setup lang="ts">
// ✅ 正确 - 使用 modelValue 约定
interface Props {
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 本地状态同步
const localValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

<template>
  <input v-model="localValue" />
</template>
```

### 多个 v-model
```typescript
interface Props {
  modelValue: string
  count: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'update:count', value: number): void
}

// 使用: <MyComponent v-model="text" v-model:count="num" />
```

### Provide/Inject (跨层级通信)
```typescript
// 父组件
import { provide } from 'vue'

const theme = ref('dark')
provide('theme', theme)

// 子孙组件
import { inject } from 'vue'

const theme = inject<Ref<string>>('theme')
```

## Props 定义

### 基础 Props
```typescript
// ✅ 好 - 使用 interface
interface Props {
  title: string
  count: number
  user?: User
}

const props = defineProps<Props>()

// ❌ 坏 - 不使用类型
const props = defineProps({
  title: String,
  count: Number
})
```

### 默认值
```typescript
// ✅ 好 - 使用 withDefaults
interface Props {
  title: string
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  disabled: false
})
```

## Emits 定义

```typescript
// ✅ 好 - 类型化的 emits
interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'submit', data: FormData): void
  (e: 'error', error: Error): void
}

const emit = defineEmits<Emits>()

// 使用
emit('update:modelValue', 'new value')
emit('submit', formData)
```

## 响应式数据

### ref vs reactive
```typescript
// ✅ 使用 ref - 基本类型和需要重新赋值的对象
const count = ref(0)
const user = ref<User | null>(null)

// ✅ 使用 reactive - 不需要重新赋值的对象
const form = reactive({
  name: '',
  email: '',
  age: 0
})

// ❌ 坏 - reactive 对象不能重新赋值
let state = reactive({ count: 0 })
state = reactive({ count: 1 })  // 失去响应式
```

### 计算属性
```typescript
// ✅ 好 - 只读计算属性
const fullName = computed(() => 
  `${firstName.value} ${lastName.value}`
)

// 可写计算属性
const fullName = computed({
  get: () => `${firstName.value} ${lastName.value}`,
  set: (value: string) => {
    const [first, last] = value.split(' ')
    firstName.value = first
    lastName.value = last
  }
})
```

## 生命周期

```typescript
import { 
  onMounted, 
  onUnmounted, 
  onUpdated,
  onBeforeMount 
} from 'vue'

// ✅ 好 - 在 setup 中使用生命周期钩子
onBeforeMount(() => {
  console.log('Before mount')
})

onMounted(() => {
  console.log('Mounted')
  // 初始化操作
})

onUpdated(() => {
  console.log('Updated')
})

onUnmounted(() => {
  console.log('Unmounted')
  // 清理操作
})
```

## 模板引用

```typescript
// ✅ 好 - 使用模板引用
const inputRef = ref<HTMLInputElement>()

onMounted(() => {
  inputRef.value?.focus()
})
```

```vue
<template>
  <input ref="inputRef" />
</template>
```

## Composables

```typescript
// composables/useCounter.ts
import { ref, computed } from 'vue'

export function useCounter(initialValue = 0) {
  const count = ref(initialValue)
  
  const doubled = computed(() => count.value * 2)
  
  const increment = () => {
    count.value++
  }
  
  const decrement = () => {
    count.value--
  }
  
  return {
    count,
    doubled,
    increment,
    decrement
  }
}

// 在组件中使用
const { count, increment } = useCounter(10)
```

## ❌ 禁止模式

### 代码层面
```typescript
// ❌ Options API
export default {
  data() {
    return { count: 0 }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}

// ❌ 使用 this
const increment = () => {
  this.count++  // Composition API 中没有 this
}

// ❌ 直接修改 props
const handleClick = () => {
  props.value = 'new value'  // 禁止！应使用 emit
}

// ❌ reactive 重新赋值
let state = reactive({ count: 0 })
state = reactive({ count: 1 })  // 失去响应式

// ❌ 解构 reactive 对象
const { count } = reactive({ count: 0 })  // 失去响应式
```

### 模板层面
```vue
<template>
  <!-- ❌ 禁止内联样式 -->
  <div style="color: red; font-size: 14px">错误</div>
  
  <!-- ✅ 使用 class -->
  <div class="error-text">正确</div>
  
  <!-- ❌ 禁止复杂表达式 -->
  <div>{{ items.filter(i => i.active).map(i => i.name).join(', ') }}</div>
  
  <!-- ✅ 使用计算属性 -->
  <div>{{ activeItemNames }}</div>
  
  <!-- ❌ 禁止在模板中调用方法进行数据转换 -->
  <div v-for="item in items" :key="item.id">
    {{ formatDate(item.createdAt) }}  <!-- 每次渲染都会调用 -->
  </div>
  
  <!-- ✅ 使用计算属性缓存结果 -->
  <div v-for="item in formattedItems" :key="item.id">
    {{ item.formattedDate }}
  </div>
</template>
```

## ✅ 最佳实践总结

1. **组件结构顺序**: Props → Emits → 状态 → 计算属性 → 方法 → 生命周期
2. **使用 ref**: 基本类型、需要重新赋值的对象
3. **使用 reactive**: 不需要重新赋值的表单对象
4. **模板简洁**: 复杂逻辑提取到计算属性或方法
5. **禁止内联样式**: 始终使用 scoped CSS 或 class
6. **类型安全**: Props/Emits 必须有 TypeScript 类型
7. **响应式陷阱**: 避免解构 reactive,避免重新赋值 reactive

---

## ⚠️ 重要：配置文件管理

### Copilot 配置 .gitignore

**推荐做法：**将自动生成的 `.github/copilot-instructions.md` 添加到 `.gitignore`

```gitignore
# Copilot 配置(自动生成)
.github/copilot-instructions.md
```

**原因：**
- ✅ 避免团队配置冲突
- ✅ 保持仓库清洁
- ✅ 允许个性化配置

**替代方案：**提交 `.github/copilot-instructions.template.md` 作为团队参考模板

**详细指南**: 参考 [Copilot .gitignore 通用指南](../../docs/guides/COPILOT_GITIGNORE_GUIDE.md)
  methods: {
    increment() {
      this.count++
    }
  }
}

// ❌ 坏 - 使用 this
const increment = () => {
  this.count++  // 在 Composition API 中没有 this
}

// ❌ 坏 - 直接修改 props
const handleClick = () => {
  props.value = 'new value'  // 禁止
}
```
