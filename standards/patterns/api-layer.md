# API 层设计模式

## 目录结构

```
src/api/
├── index.ts          # 统一导出
├── axios.ts          # Axios 配置
├── types.ts          # API 类型定义
├── user.ts           # 用户相关 API
├── product.ts        # 产品相关 API
└── auth.ts           # 认证相关 API
```

## Axios 配置

```typescript
// src/api/axios.ts
import axios from 'axios'
import type { AxiosError, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error: AxiosError) => {
    const message = error.response?.data?.message || '请求失败'
    ElMessage.error(message)
    
    // 401 跳转登录
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

export default instance
```

## API 类型定义

```typescript
// src/api/types.ts
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface User {
  id: number
  name: string
  email: string
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}
```

## API 模块

```typescript
// src/api/user.ts
import request from './axios'
import type { User, ApiResponse, PaginatedResponse } from './types'

export const userApi = {
  // 获取用户列表
  getList(params: { page: number; pageSize: number }) {
    return request.get<ApiResponse<PaginatedResponse<User>>>(
      '/users',
      { params }
    )
  },
  
  // 获取单个用户
  getById(id: number) {
    return request.get<ApiResponse<User>>(`/users/${id}`)
  },
  
  // 创建用户
  create(data: Omit<User, 'id'>) {
    return request.post<ApiResponse<User>>('/users', data)
  },
  
  // 更新用户
  update(id: number, data: Partial<User>) {
    return request.put<ApiResponse<User>>(`/users/${id}`, data)
  },
  
  // 删除用户
  delete(id: number) {
    return request.delete<ApiResponse<void>>(`/users/${id}`)
  }
}
```

## 在组件中使用

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi } from '@/api/user'
import type { User } from '@/api/types'

const users = ref<User[]>([])
const loading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await userApi.getList({
      page: 1,
      pageSize: 10
    })
    users.value = res.data.items
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchUsers()
})
</script>
```

## 统一导出

```typescript
// src/api/index.ts
export * from './user'
export * from './product'
export * from './auth'
export * from './types'
```

## 最佳实践

1. **类型安全** - 所有 API 都有类型定义
2. **错误处理** - 统一在拦截器中处理
3. **加载状态** - 使用 loading 状态
4. **请求取消** - 使用 AbortController
5. **接口文档** - 为每个 API 添加注释
