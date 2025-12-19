# 核心代码规范

## 基本原则

1. **代码可读性优先** - 清晰 > 简洁
2. **类型安全** - 使用严格的类型系统
3. **一致性** - 遵循统一的代码风格
4. **可维护性** - 编写易于理解和修改的代码
5. **注释充分** - 重要逻辑必须添加注释说明
6. **专注代码** - 生成代码时不创建 Markdown 文档

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

### 核心要求

1. **重要代码必须注释** - 复杂逻辑、算法、业务规则需要清晰说明
2. **去 AI 化** - 避免使用表情符号、过度热情的语气
3. **专业简洁** - 使用平实的技术语言，避免口语化表达

### 好的注释风格

```typescript
// 使用二分查找提高性能
function binarySearch(arr: number[], target: number): number {
  let left = 0
  let right = arr.length - 1
  
  // 当搜索范围有效时继续查找
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    
    if (arr[mid] === target) {
      return mid
    } else if (arr[mid] < target) {
      left = mid + 1
    } else {
      right = mid - 1
    }
  }
  
  return -1
}

// 缓存计算结果避免重复请求
const memoizedFetch = (() => {
  const cache = new Map()
  
  return async (url: string) => {
    if (cache.has(url)) {
      return cache.get(url)
    }
    
    const data = await fetch(url).then(r => r.json())
    cache.set(url, data)
    return data
  }
})()
```

### 避免的注释风格

```typescript
// ❌ 不自然 - 使用表情符号
// 🎉 太棒了！这个函数超级好用！
// ✨ 神奇的算法来啦～

// ❌ 过度热情
// 哇！这里使用了超酷的技巧！
// 注意啦！这里很重要哦～

// ❌ 只重复代码
// 创建用户
function createUser() {}

// ❌ 废话连篇
// 这个函数非常非常重要，请一定要仔细阅读
// 它做了很多很多事情，真的很厉害
```

### 正确的注释示例

```typescript
// 正确：说明为什么，而非做什么
// 使用 Set 去重，避免 O(n²) 复杂度
const uniqueIds = [...new Set(ids)]

// 正确：说明业务规则
// 管理员用户跳过权限检查
if (user.role === 'admin') {
  return true
}

// 正确：说明技术决策
// 使用 WeakMap 避免内存泄漏
const cache = new WeakMap()

// 正确：警告潜在问题
// 注意：此方法会修改原数组
function sortInPlace(arr: number[]) {
  return arr.sort((a, b) => a - b)
}
```

### 函数注释
```typescript
/**
 * 获取用户信息
 * @param userId 用户ID
 * @returns 用户信息对象，如果不存在返回 null
 */
function getUserInfo(userId: number): User | null {
  // 实现逻辑...
}

// 对于简单函数，单行注释即可
// 验证邮箱格式
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

## 文档创建规范

### 禁止行为

**生成代码时不要创建 Markdown 文档**

```typescript
// ❌ 错误：创建额外的文档文件
// 不要生成：USAGE.md, GUIDE.md, CHANGES.md 等

// ✅ 正确：在代码中添加充分的注释
/**
 * UserService 类
 * 
 * 提供用户相关的业务逻辑处理
 * 包括用户注册、登录、信息更新等功能
 */
class UserService {
  // 实现...
}
```

### 何时可以创建文档

仅在以下情况创建文档：
1. 用户明确要求创建文档
2. 项目初始化需要 README.md
3. 修改现有文档文件

### 复杂逻辑注释

```typescript
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
