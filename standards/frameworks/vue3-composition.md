# Vue 3 Composition API 核心规范

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
    <input 
      v-model="localValue" 
      :disabled="disabled"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.my-component {
  /* 组件样式 */
}
</style>
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

## 禁止模式

```typescript
// ❌ 坏 - Options API
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

// ❌ 坏 - 使用 this
const increment = () => {
  this.count++  // 在 Composition API 中没有 this
}

// ❌ 坏 - 直接修改 props
const handleClick = () => {
  props.value = 'new value'  // 禁止
}
```
