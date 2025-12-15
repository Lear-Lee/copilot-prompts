# 组件设计模式

## 组件分类

### 1. 基础组件（通用组件）
```
components/base/
├── BaseButton.vue
├── BaseInput.vue
├── BaseCard.vue
└── BaseModal.vue
```

特点：
- 高度可复用
- 无业务逻辑
- Props 驱动
- 样式可定制

### 2. 业务组件
```
components/business/
├── UserCard.vue
├── ProductList.vue
└── OrderForm.vue
```

特点：
- 包含业务逻辑
- 调用 API
- 使用 Store
- 特定场景

### 3. 布局组件
```
components/layout/
├── AppHeader.vue
├── AppSidebar.vue
└── AppFooter.vue
```

## 组件通信

### Props Down, Events Up
```vue
<!-- 父组件 -->
<script setup lang="ts">
const count = ref(0)

const handleIncrement = (value: number) => {
  count.value += value
}
</script>

<template>
  <Counter :count="count" @increment="handleIncrement" />
</template>

<!-- 子组件 Counter.vue -->
<script setup lang="ts">
interface Props {
  count: number
}

interface Emits {
  (e: 'increment', value: number): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleClick = () => {
  emit('increment', 1)
}
</script>
```

### Provide / Inject
```typescript
// 父组件
const theme = ref('light')
provide('theme', theme)

// 子组件（任意深度）
const theme = inject<Ref<string>>('theme')
```

### 使用 Composables 共享逻辑
```typescript
// composables/useCounter.ts
export function useCounter() {
  const count = ref(0)
  const increment = () => count.value++
  return { count, increment }
}

// 在多个组件中使用
const { count, increment } = useCounter()
```

## 组件封装原则

### 单一职责
```vue
<!-- ✅ 好 - 职责单一 -->
<UserAvatar :src="user.avatar" :size="40" />
<UserName :name="user.name" />

<!-- ❌ 坏 - 职责过多 -->
<UserProfileCard :user="user" :show-stats="true" :editable="true" />
```

### Props 验证
```typescript
interface Props {
  // 必填
  id: number
  name: string
  
  // 可选 + 默认值
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  disabled: false
})
```

### 插槽使用
```vue
<!-- 组件 Card.vue -->
<template>
  <div class="card">
    <div class="card-header">
      <slot name="header">默认标题</slot>
    </div>
    <div class="card-body">
      <slot>默认内容</slot>
    </div>
    <div class="card-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<!-- 使用 -->
<Card>
  <template #header>
    <h2>自定义标题</h2>
  </template>
  
  <p>主要内容</p>
  
  <template #footer>
    <el-button>操作</el-button>
  </template>
</Card>
```

## 性能优化

### 懒加载组件
```typescript
const HeavyComponent = defineAsyncComponent(() =>
  import('./components/HeavyComponent.vue')
)
```

### 计算属性缓存
```typescript
// ✅ 好 - 使用计算属性
const filteredList = computed(() => 
  list.value.filter(item => item.active)
)

// ❌ 坏 - 每次渲染都计算
const filteredList = () => list.value.filter(item => item.active)
```

### 使用 key 优化列表
```vue
<template>
  <div
    v-for="item in items"
    :key="item.id"
  >
    {{ item.name }}
  </div>
</template>
```

## 最佳实践

1. **组件大小** - 单个组件不超过 300 行
2. **Props 数量** - 不超过 10 个
3. **命名规范** - PascalCase 或 kebab-case
4. **样式隔离** - 使用 scoped 或 CSS Modules
5. **文档注释** - 为复杂组件添加说明
