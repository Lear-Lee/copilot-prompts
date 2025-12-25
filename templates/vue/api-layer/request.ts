/**
 * Axios 请求封装
 * 
 * 💡 自定义点（按项目调整）：
 * - API_TIMEOUT: 请求超时时间
 * - NO_TOKEN_URLS: 无需 Token 的接口白名单
 * - TOKEN_KEY/USER_KEY: 本地存储键名
 * - showMessage: UI 框架消息提示方法
 * - 响应拦截器中的业务状态码判断
 */
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'
import type { ApiResponse } from './types'

// ========== 常量配置 ==========

const API_TIMEOUT = 30000

// 无需 Token 的接口白名单（按项目调整）
const NO_TOKEN_URLS = [
  '/login',
  '/register',
  '/captcha',
  '/sms-code',
]

// ========== Token 管理 ==========

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

// ========== 消息提示 ==========

// 💡 按 UI 框架替换此对象
// Element Plus: import { ElMessage } from 'element-plus'
// Ant Design Vue: import { message } from 'ant-design-vue'

const showMessage = {
  success: (msg: string) => console.log('✅', msg),
  error: (msg: string) => console.error('❌', msg),
  warning: (msg: string) => console.warn('⚠️', msg),
}

// Element Plus 示例：
// const showMessage = {
//   success: (msg: string) => ElMessage.success(msg),
//   error: (msg: string) => ElMessage.error(msg),
//   warning: (msg: string) => ElMessage.warning(msg),
// }

// ========== 错误码映射 ==========

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

// ========== 错误处理 ==========

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
    router.push({ name: 'login' }) // 💡 按项目调整登录路由
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
        // 💡 按后端要求调整 Token 传递方式
        config.headers.Authorization = `Bearer ${token}`
        // config.headers.token = token
      }
    }
    
    return config
  },
  handleRequestError
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    
    // 文件流直接返回
    if (response.config.responseType === 'blob') {
      return res
    }
    
    // 💡 业务状态码判断（按后端约定调整）
    // 格式 A: { code: 0, data, message }
    // 格式 B: { code: 200, data, msg }
    // 格式 C: { success: true, data, message }
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
 * const [res, err] = await wrap(userApi.getList(params))
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
