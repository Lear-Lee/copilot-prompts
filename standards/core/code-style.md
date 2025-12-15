# 核心代码规范

## 基本原则

1. **代码可读性优先** - 清晰 > 简洁
2. **类型安全** - 使用严格的类型系统
3. **一致性** - 遵循统一的代码风格
4. **可维护性** - 编写易于理解和修改的代码

## 命名规范

### 变量命名
```typescript
// ✅ 好 - 使用驼峰命名法
const userName = 'John'
const isActive = true
const itemCount = 10

// ❌ 坏
const user_name = 'John'
const UserName = 'John'
```

### 常量命名
```typescript
// ✅ 好 - 使用大写字母和下划线
const MAX_RETRY_COUNT = 3
const API_BASE_URL = 'https://api.example.com'

// ❌ 坏
const maxRetryCount = 3
```

### 函数命名
```typescript
// ✅ 好 - 使用动词开头
function getUserData() { }
function validateForm() { }
function handleClick() { }

// ❌ 坏
function user() { }
function data() { }
```

### 类/接口命名
```typescript
// ✅ 好 - 使用 PascalCase
interface UserProfile { }
class DataService { }
type StatusType = 'pending' | 'success'

// ❌ 坏
interface userProfile { }
class dataService { }
```

## 代码组织

### 导入顺序
```typescript
// 1. Node 内置模块
import * as path from 'path'

// 2. 第三方库
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

// 3. 项目内部模块
import { useUserStore } from '@/stores/user'
import MyComponent from '@/components/MyComponent.vue'

// 4. 类型导入（分组）
import type { User, Profile } from '@/types'
```

### 文件结构
```typescript
// 1. 类型定义
interface Props { }
interface Emits { }

// 2. 常量
const DEFAULT_PAGE_SIZE = 10

// 3. 状态
const isLoading = ref(false)

// 4. 计算属性
const filteredData = computed(() => {})

// 5. 方法
function handleSubmit() {}

// 6. 生命周期
onMounted(() => {})
```

## 注释规范

### 函数注释
```typescript
/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息对象，如果不存在返回 null
 */
function getUserInfo(userId: number): User | null {
  // ...
}
```

### 复杂逻辑注释
```typescript
// ✅ 好 - 说明为什么这样做
// 使用 Set 去重，提高性能（避免 O(n²) 复杂度）
const uniqueIds = [...new Set(ids)]

// ❌ 坏 - 只是重复代码
// 创建 Set 去重
const uniqueIds = [...new Set(ids)]
```

## 错误处理

```typescript
// ✅ 好 - 明确的错误处理
try {
  const data = await fetchData()
  return data
} catch (error) {
  console.error('Failed to fetch data:', error)
  throw new Error(`Data fetch failed: ${error.message}`)
}

// ❌ 坏 - 吞掉错误
try {
  const data = await fetchData()
} catch (error) {
  // 什么都不做
}
```

## 性能优化原则

1. **避免不必要的计算** - 使用 computed 缓存
2. **按需加载** - 使用动态导入
3. **防抖节流** - 高频事件使用防抖/节流
4. **列表渲染** - 使用 key 优化
