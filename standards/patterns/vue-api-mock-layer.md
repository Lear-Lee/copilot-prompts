# Vue API + Mock 层封装模式

> 适用场景：Vue 3 + TypeScript 项目（兼容 Element Plus / Ant Design Vue / Naive UI 等）
> 核心特性：API 集中管理、Mock 无缝切换、wrap 错误处理、文件上传下载
> 设计原则：**灵活可扩展**，模块按需添加，不限定具体业务

---

## 一、目录结构

```
src/api/
├── index.ts              # 统一导出入口
├── request.ts            # Axios 核心封装（必需）
├── mock/                 # Mock 系统（可选）
│   ├── index.ts          # Mock 开关与工具函数
│   └── [module].ts       # 按业务模块创建，如 user.ts, order.ts
└── modules/              # 业务 API 模块
    ├── index.ts          # 模块统一导出
    └── [module].ts       # 按业务模块创建，如 user.ts, order.ts
```

**模块命名建议**（根据项目实际需求选择）：

| 通用模块 | 电商类 | 管理系统 | 社交类 |
|---------|--------|----------|--------|
| `user.ts` | `product.ts` | `auth.ts` | `post.ts` |
| `common.ts` | `order.ts` | `permission.ts` | `comment.ts` |
| `upload.ts` | `cart.ts` | `log.ts` | `message.ts` |

---

## 二、核心文件模板

### 2.1 request.ts - Axios 核心封装

```typescript
/**
 * Axios 请求封装
 * 集成 Mock 系统、错误处理、Token 管理
 * 
 * 💡 自定义点：
 * - API_TIMEOUT: 超时时间
 * - NO_TOKEN_URLS: 无需 Token 的白名单
 * - TOKEN_KEY/USER_KEY: 存储键名
 * - ERROR_CODE_MAP: 错误码映射
 * - 响应拦截器中的业务状态码判断
 */
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
// import { ElMessage } from 'element-plus'  // Element Plus
// import { message } from 'ant-design-vue'  // Ant Design Vue
// import { useMessage } from 'naive-ui'     // Naive UI
import router from '@/router'
import type { ApiResponse } from '@/types/api'

// ========== 常量配置（按项目调整）==========

const API_TIMEOUT = 30000

// 无需 Token 的接口白名单（按项目调整）
const NO_TOKEN_URLS = [
  '/login',
  '/register',
  '/sms-code',
  '/captcha',
]

// ========== Token 管理（按项目调整键名）==========

const TOKEN_KEY = 'app_token'
const USER_KEY = 'app_user'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const getUserInfo = <T = any>(): T | null => {
  const userStr = localStorage.getItem(USER_KEY)
  if (!userStr) return null
  try {
    return JSON.parse(userStr)
  } catch {
    return null
  }
}

export const setUserInfo = (user: any): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// ========== 消息提示（按 UI 框架调整）==========

// 封装消息提示，便于切换 UI 框架
const showMessage = {
  success: (msg: string) => console.log('✅', msg),  // 替换为 UI 框架方法
  error: (msg: string) => console.error('❌', msg),
  warning: (msg: string) => console.warn('⚠️', msg),
}

// Element Plus 示例：
// import { ElMessage } from 'element-plus'
// const showMessage = {
//   success: (msg: string) => ElMessage.success(msg),
//   error: (msg: string) => ElMessage.error(msg),
//   warning: (msg: string) => ElMessage.warning(msg),
// }

// ========== 错误处理 ==========

const ERROR_CODE_MAP: Record<number, string> = {
  400: '请求参数错误',
  401: '登录已过期，请重新登录',
  403: '没有操作权限',
  404: '请求的资源不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务暂不可用',
  504: '网关超时',
}

const handleRequestError = (error: any): Promise<never> => {
  console.error('请求错误:', error)
  
  if (error.code === 'ERR_NETWORK') {
    showMessage.error('网络连接失败，请检查网络设置')
  } else if (error.code === 'ECONNABORTED') {
    showMessage.error('请求超时，请稍后重试')
  }
  
  return Promise.reject(error)
}

const handleResponseError = (error: any): Promise<never> => {
  const status = error?.response?.status
  const data = error?.response?.data
  const message = data?.message || ERROR_CODE_MAP[status] || '请求失败，请稍后重试'
  
  if (status === 401) {
    clearToken()
    showMessage.warning(message)
    router.push({ name: 'login' })  // 按项目调整登录路由
    return Promise.reject(error)
  }
  
  showMessage.error(message)
  return Promise.reject(error)
}

// ========== Axios 实例 ==========

const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
})

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const needToken = !NO_TOKEN_URLS.some(url => config.url?.includes(url))
    
    if (needToken) {
      const token = getToken()
      if (token) {
        // 按后端要求调整 Token 传递方式
        config.headers.Authorization = `Bearer ${token}`
        // config.headers.token = token  // 备选方式
      }
    }
    
    return config
  },
  handleRequestError
)

// 响应拦截器（按后端响应结构调整）
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 文件流直接返回
    if (response.config.responseType === 'blob') {
      return res
    }
    
    // 业务状态码判断（按后端约定调整）
    // 常见格式：{ code: 0, data: {}, message: '' }
    // 或：{ code: 200, data: {}, msg: '' }
    // 或：{ success: true, data: {}, message: '' }
    if (res.code === 0 || res.code === 200 || res.success === true) {
      return res
    }
    
    // 401 Token 过期
    if (res.code === 401) {
      clearToken()
      showMessage.warning(res.message || '登录已过期')
      router.push({ name: 'login' })
      return Promise.reject(new Error(res.message))
    }
    
    // 其他业务错误
    showMessage.error(res.message || res.msg || '请求失败')
    return Promise.reject(new Error(res.message || res.msg))
  },
  handleResponseError
)

// ========== 请求方法 ==========

export async function get<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return instance.get(url, { params, ...config })
}

export async function post<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return instance.post(url, data, config)
}

export async function put<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return instance.put(url, data, config)
}

export async function del<T = any>(
  url: string,
  params?: Record<string, any>,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  return instance.delete(url, { params, ...config })
}

// ========== 工具函数 ==========

/**
 * 包装异步请求，返回 [data, error] 元组
 * 借鉴 Go 语言错误处理风格，避免 try/catch
 * 
 * @example
 * const [res, err] = await wrap(api.getList(params))
 * if (err) {
 *   console.error('请求失败:', err)
 *   return
 * }
 * // 使用 res.data
 */
export async function wrap<T>(
  promise: Promise<T>
): Promise<[T, null] | [null, Error]> {
  try {
    const data = await promise
    return [data, null]
  } catch (error) {
    return [null, error as Error]
  }
}

/**
 * 下载文件
 */
export async function downloadFile(
  url: string,
  params?: Record<string, any>,
  filename?: string
): Promise<void> {
  const response = await instance.get(url, {
    params,
    responseType: 'blob',
  })
  
  const blob = new Blob([response as any])
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename || 'download'
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * 上传文件
 */
export async function uploadFile<T = any>(
  url: string,
  file: File,
  fieldName = 'file',
  extraData?: Record<string, any>
): Promise<ApiResponse<T>> {
  const formData = new FormData()
  formData.append(fieldName, file)
  
  if (extraData) {
    Object.entries(extraData).forEach(([key, value]) => {
      formData.append(key, value)
    })
  }
  
  return instance.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export default instance
```

### 2.2 mock/index.ts - Mock 系统核心

```typescript
// Mock 系统入口
import type { ApiResponse, PageData } from '@/types/common'

export const MOCK_ENABLED = import.meta.env.VITE_MOCK_ENABLED === 'true'
export const MOCK_DELAY = 300

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export const delay = sleep

/**
 * 生成分页响应数据
 */
export function generatePageResponse<T>(
  list: T[],
  page: number,
  pageSize: number,
  total?: number
): ApiResponse<PageData<T>> {
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const data = list.slice(start, end)
  return {
    code: 0,
    data: { list: data, total: total ?? list.length, page, pageSize },
    message: 'success',
  }
}

/**
 * 生成成功响应
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return { code: 0, data, message: 'success' }
}

/**
 * 生成错误响应
 */
export function errorResponse(message: string, code = -1) {
  return { code, data: null, message }
}

/**
 * 生成随机 ID
 */
export function randomId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * 生成随机日期（近 n 天内）
 */
export function randomDate(days = 30): string {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * days))
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0]
}

/**
 * 从数组中随机选择
 */
export function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * 生成随机金额
 */
export function randomAmount(min = 100, max = 10000): number {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

// 导出各模块 Mock
export * from './auth'
// export * from './customer'
// export * from './finance'
// export * from './system'
// export * from './transaction'
```

### 2.3 API 模块示例 - modules/[module].ts

```typescript
/**
 * [模块名] API
 * 
 * 💡 创建新模块时复制此模板，替换：
 * - 模块名称和描述
 * - URLs 对象中的接口地址
 * - 类型定义
 * - 具体的 API 函数
 */
import { post, get, put, del } from '../request'
import { MOCK_ENABLED } from '../mock'
// import * as mockModule from '../mock/[module]'  // 对应的 Mock
import type { ApiResponse, PageResponse, PageParams } from '@/types/api'

// ========== 接口地址（按实际后端调整）==========

const URLs = {
  list: '/xxx/list',
  detail: '/xxx/detail',
  create: '/xxx/create',
  update: '/xxx/update',
  delete: '/xxx/delete',
}

// ========== 类型定义（按实际业务调整）==========

export interface ItemData {
  id: string
  name: string
  status: string
  createdAt: string
  // ... 其他字段
}

export interface CreateParams {
  name: string
  // ... 其他参数
}

export interface ListParams extends PageParams {
  keyword?: string
  status?: string
  // ... 其他筛选条件
}

// ========== 接口实现 ==========

/** 获取列表 */
export async function getList(params: ListParams): Promise<PageResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockGetList(params)
  return get(URLs.list, params)
}

/** 获取详情 */
export async function getDetail(id: string): Promise<ApiResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockGetDetail(id)
  return get(URLs.detail, { id })
}

/** 创建 */
export async function create(data: CreateParams): Promise<ApiResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockCreate(data)
  return post(URLs.create, data)
}

/** 更新 */
export async function update(id: string, data: Partial<CreateParams>): Promise<ApiResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockUpdate(id, data)
  return put(`${URLs.update}/${id}`, data)
}

/** 删除 */
export async function remove(id: string): Promise<ApiResponse<null>> {
  // if (MOCK_ENABLED) return mockModule.mockDelete(id)
  return del(URLs.delete, { id })
}
```

### 2.4 modules/index.ts - 统一导出

```typescript
/**
 * API 模块统一导出
 * 
 * 💡 添加新模块时：
 * 1. 创建 modules/[module].ts
 * 2. 在此处添加导入和导出
 */

// 示例：导出各业务模块
// export * as userApi from './user'
// export * as orderApi from './order'
// export * as productApi from './product'

// 按项目实际模块调整...
```

### 2.5 index.ts - API 统一入口

```typescript
/**
 * API 统一入口
 *
 * 使用方式：
 *
 * 1. 直接导入模块使用
 * import { userApi } from '@/api'
 * const res = await userApi.getList(params)
 *
 * 2. 使用 wrap 函数处理错误（推荐）
 * import { wrap, userApi } from '@/api'
 * const [res, err] = await wrap(userApi.getList(params))
 * if (err) return
 *
 * 3. 直接使用请求方法
 * import { get, post } from '@/api'
 * const res = await post('/custom/url', data)
 */

// 导出基础请求方法
export { get, post, put, del, wrap, downloadFile, uploadFile } from './request'
export { default as axios } from './request'

// 导出 Token 管理方法
export { getToken, setToken, clearToken, getUserInfo, setUserInfo } from './request'

// 导出所有 API 模块
export * from './modules'

// 导出 Mock 配置
export { MOCK_ENABLED } from './mock'
```

---

## 三、类型定义模板

### 3.1 types/api.ts

```typescript
/**
 * API 通用类型定义
 * 
 * 💡 按后端实际响应结构调整字段名
 */

/**
 * API 响应基础结构
 * 常见格式：
 * - { code: 0, data: T, message: '' }
 * - { code: 200, data: T, msg: '' }
 * - { success: true, data: T, message: '' }
 */
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
  // msg?: string      // 备选字段名
  // success?: boolean // 备选判断字段
}

/**
 * 分页请求参数
 * 常见字段名：page/pageNum/current, pageSize/size/limit
 */
export interface PageParams {
  page: number
  pageSize: number
  // pageNum?: number  // 备选字段名
  // current?: number  // 备选字段名
  // size?: number     // 备选字段名
}

/**
 * 分页响应数据
 * 常见字段名：list/records/items, total/totalCount
 */
export interface PageData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  // records?: T[]     // 备选字段名
  // items?: T[]       // 备选字段名
}

/**
 * 分页响应（完整）
 */
export type PageResponse<T> = ApiResponse<PageData<T>>

/**
 * 通用 ID 类型（按项目调整）
 */
export type ID = string | number

/**
 * 通用状态枚举示例
 */
export type Status = 'active' | 'inactive' | 'pending' | 'deleted'
```

---

## 四、环境变量配置

### .env.development

```bash
VITE_API_BASE_URL=/api
VITE_MOCK_ENABLED=true
```

### .env.production

```bash
VITE_API_BASE_URL=https://api.example.com
VITE_MOCK_ENABLED=false
```

---

## 五、使用示例

### 5.1 基础调用

```typescript
import { userApi } from '@/api'

const handleSubmit = async () => {
  try {
    const res = await userApi.create(formData)
    if (res.code === 0) {
      // 成功处理
    }
  } catch (err) {
    console.error(err)
  }
}
```

### 5.2 使用 wrap 函数（推荐）

```typescript
import { wrap, userApi } from '@/api'

const handleSubmit = async () => {
  const [res, err] = await wrap(userApi.create(formData))
  
  if (err) {
    console.error('操作失败:', err)
    return
  }
  
  // 成功处理
  router.push('/list')
}
```

### 5.3 列表页面通用模式

```typescript
import { wrap } from '@/api'
import { xxxApi } from '@/api'  // 替换为实际模块

// 状态
const loading = ref(false)
const list = ref<ItemData[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchParams = ref({})

// 获取列表
const fetchList = async () => {
  loading.value = true
  
  const [res, err] = await wrap(xxxApi.getList({
    page: currentPage.value,
    pageSize: pageSize.value,
    ...searchParams.value
  }))
  
  loading.value = false
  
  if (err) return
  
  list.value = res.data.list
  total.value = res.data.total
}

// 删除
const handleDelete = async (id: string) => {
  const [, err] = await wrap(xxxApi.remove(id))
  if (err) return
  
  // 刷新列表
  fetchList()
}
```

---

## 六、Mock 数据编写规范

### 6.1 基本结构

```typescript
// mock/[module].ts - Mock 模块模板
import { successResponse, errorResponse, generatePageResponse, randomId, delay } from './index'
import type { PageParams } from '@/types/api'

// 模拟数据类型
interface MockItem {
  id: string
  name: string
  status: string
  createdAt: string
}

// 数据缓存
let dataCache: MockItem[] | null = null

// 生成单条数据
function generateItem(index: number): MockItem {
  return {
    id: randomId(),
    name: `项目${index}`,
    status: randomPick(['active', 'inactive']),
    createdAt: randomDate(30)
  }
}

// 获取数据（带缓存）
function getData(): MockItem[] {
  if (!dataCache) {
    dataCache = Array.from({ length: 50 }, (_, i) => generateItem(i + 1))
  }
  return dataCache
}

/** 模拟获取列表 */
export async function mockGetList(params: PageParams & { keyword?: string }) {
  await delay(300)
  
  let data = getData()
  
  // 筛选（按实际需求调整）
  if (params.keyword) {
    data = data.filter(item => item.name.includes(params.keyword!))
  }
  
  return generatePageResponse(data, params.page || 1, params.pageSize || 10)
}

/** 模拟获取详情 */
export async function mockGetDetail(id: string) {
  await delay(200)
  
  const item = getData().find(d => d.id === id)
  if (!item) return errorResponse('数据不存在')
  
  return successResponse(item)
}

/** 模拟创建 */
export async function mockCreate(data: Partial<MockItem>) {
  await delay(300)
  
  const newItem = { ...generateItem(getData().length + 1), ...data }
  getData().unshift(newItem)
  
  return successResponse(newItem)
}

/** 模拟更新 */
export async function mockUpdate(id: string, data: Partial<MockItem>) {
  await delay(300)
  
  const list = getData()
  const index = list.findIndex(d => d.id === id)
  if (index === -1) return errorResponse('数据不存在')
  
  list[index] = { ...list[index], ...data }
  return successResponse(list[index])
}

/** 模拟删除 */
export async function mockDelete(id: string) {
  await delay(200)
  
  const list = getData()
  const index = list.findIndex(d => d.id === id)
  if (index === -1) return errorResponse('数据不存在')
  
  list.splice(index, 1)
  return successResponse(null)
}
```

### 6.2 登录认证 Mock 示例

```typescript
// mock/auth.ts
import { successResponse, errorResponse, randomId, delay } from './index'

// 模拟用户（按项目调整）
const mockUsers: Record<string, { password: string; user: any }> = {
  admin: {
    password: '123456',
    user: { id: '1', username: 'admin', name: '管理员', roles: ['admin'] }
  },
  user: {
    password: '123456',
    user: { id: '2', username: 'user', name: '普通用户', roles: ['user'] }
  }
}

const tokenStore = new Map<string, any>()

export async function mockLogin(username: string, password: string) {
  await delay(500)
  
  const userData = mockUsers[username]
  if (!userData || userData.password !== password) {
    return errorResponse('用户名或密码错误')
  }
  
  const token = `mock_${randomId()}`
  tokenStore.set(token, userData.user)
  
  return successResponse({ token, user: userData.user })
}

export async function mockGetUserInfo(token: string) {
  await delay(200)
  
  const user = tokenStore.get(token)
  if (!user) return errorResponse('Token 无效', 401)
  
  return successResponse(user)
}
```

---

## 七、最佳实践

### 7.1 API 模块组织

- 每个业务模块一个文件，按实际需求命名
- URLs 集中定义在文件顶部
- 类型定义紧跟 URLs
- Mock 判断在函数内部

### 7.2 错误处理

- 使用 `wrap` 函数统一处理
- 避免重复的 try/catch
- 错误信息由拦截器统一展示

### 7.3 Mock 开发

- Mock 函数与真实 API 返回结构一致
- 使用缓存避免重复生成数据
- 支持基本的筛选和分页
- 登录 Mock 要模拟 Token 存储

### 7.4 类型安全

- 所有 API 函数都有返回类型
- 参数使用 interface 定义
- 避免使用 any

### 7.5 适配不同后端

**响应结构适配**：
```typescript
// 后端 A：{ code: 0, data, message }
// 后端 B：{ code: 200, data, msg }
// 后端 C：{ success: true, data, message }

// 在响应拦截器中统一处理
if (res.code === 0 || res.code === 200 || res.success === true) {
  return res
}
```

**分页参数适配**：
```typescript
// 封装转换函数
function toBackendPageParams(params: PageParams) {
  return {
    pageNum: params.page,    // 或 current
    pageSize: params.pageSize // 或 size
  }
}
```

---

## 八、快速接入清单

新项目接入此模式时，按以下步骤操作：

### 8.1 使用模板（推荐）

直接复制模板目录 `templates/vue/api-layer/` 到项目 `src/api/`：

```bash
# 模板位置
copilot-prompts/templates/vue/api-layer/
├── _CONFIG.md          # 配置说明（无需复制）
├── request.ts          # ← 复制
├── types.ts            # ← 复制
├── index.ts            # ← 复制
├── mock/index.ts       # ← 复制
└── modules/
    ├── index.ts        # ← 复制
    └── _template.ts    # ← 复制后重命名为业务模块
```

详细配置说明见：[templates/vue/api-layer/_CONFIG.md](../../../templates/vue/api-layer/_CONFIG.md)

### 8.2 手动创建

如需从零开始，确保创建以下文件：

- [ ] `src/api/request.ts` - 核心封装
- [ ] `src/api/types.ts` - 类型定义
- [ ] `src/api/mock/index.ts` - Mock 工具
- [ ] `src/api/modules/index.ts` - 模块导出
- [ ] `src/api/index.ts` - 统一入口

### 8.3 按项目调整

- [ ] `request.ts` 中的消息提示方法（适配 UI 框架）
- [ ] `request.ts` 中的 Token 传递方式（按后端要求）
- [ ] `request.ts` 中的业务状态码判断（按后端约定）
- [ ] `types/api.ts` 中的响应结构（按后端格式）
- [ ] `.env` 中的环境变量

### 8.3 创建业务模块

- [ ] 根据业务需求创建 `modules/xxx.ts`
- [ ] 对应创建 `mock/xxx.ts`（如需要）
- [ ] 在 `modules/index.ts` 中导出

---

**适用技术栈**: Vue 3 + TypeScript + 任意 UI 框架 + Vite/Webpack
**维护者**: MTA工作室
**创建日期**: 2025-12-25
**版本**: v1.1（通用化版本）
