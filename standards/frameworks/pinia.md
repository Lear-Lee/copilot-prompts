# Pinia 状态管理规范

## Store 定义

### Setup Store (推荐)
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const token = ref<string>('')
  
  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => user.value?.name ?? '')
  
  // Actions
  async function login(credentials: Credentials) {
    const response = await api.login(credentials)
    user.value = response.user
    token.value = response.token
  }
  
  function logout() {
    user.value = null
    token.value = ''
  }
  
  return {
    // State
    user,
    token,
    // Getters
    isLoggedIn,
    userName,
    // Actions
    login,
    logout
  }
})
```

### Options Store
```typescript
export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Counter'
  }),
  
  getters: {
    doubled: (state) => state.count * 2
  },
  
  actions: {
    increment() {
      this.count++
    }
  }
})
```

## Store 使用

### 在组件中
```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()

// ✅ 好 - 使用 storeToRefs 保持响应式
const { user, isLoggedIn } = storeToRefs(userStore)

// ✅ 好 - 直接解构 actions（不需要 toRefs）
const { login, logout } = userStore

// ❌ 坏 - 直接解构 state 会失去响应式
const { user, isLoggedIn } = userStore
</script>
```

### 在其他 Store 中
```typescript
export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()
  
  const items = ref<Item[]>([])
  
  async function checkout() {
    if (!userStore.isLoggedIn) {
      throw new Error('Please login first')
    }
    // ...
  }
  
  return { items, checkout }
})
```

## 持久化

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<'light' | 'dark'>('light')
  
  // 从 localStorage 读取
  const loadFromStorage = () => {
    const saved = localStorage.getItem('theme')
    if (saved) theme.value = saved as 'light' | 'dark'
  }
  
  // 保存到 localStorage
  const saveToStorage = () => {
    localStorage.setItem('theme', theme.value)
  }
  
  // 监听变化自动保存
  watch(theme, saveToStorage)
  
  // 初始化时加载
  loadFromStorage()
  
  return { theme }
})
```

## 异步 Actions

```typescript
export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  async function fetchProducts() {
    loading.value = true
    error.value = null
    
    try {
      const data = await api.getProducts()
      products.value = data
    } catch (err) {
      error.value = err as Error
      console.error('Failed to fetch products:', err)
    } finally {
      loading.value = false
    }
  }
  
  return {
    products,
    loading,
    error,
    fetchProducts
  }
})
```

## 最佳实践

1. **一个 Store 一个职责** - 不要创建巨型 Store
2. **使用 TypeScript** - 为 state 定义类型
3. **Setup Store 优先** - 更灵活，与 Composition API 一致
4. **使用 storeToRefs** - 保持响应式
5. **错误处理** - Actions 中处理异步错误
