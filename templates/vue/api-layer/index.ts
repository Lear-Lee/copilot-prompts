/**
 * API 统一入口
 *
 * @example
 * // 1. 导入模块使用
 * import { userApi } from '@/api'
 * const res = await userApi.getList(params)
 *
 * // 2. 使用 wrap 函数（推荐）
 * import { wrap, userApi } from '@/api'
 * const [res, err] = await wrap(userApi.getList(params))
 * if (err) return
 *
 * // 3. 直接使用请求方法
 * import { get, post } from '@/api'
 * const res = await post('/custom/url', data)
 */

// 基础请求方法
export {
  get,
  post,
  put,
  del,
  wrap,
  downloadFile,
  uploadFile,
} from './request'

// Axios 实例
export { default as axios } from './request'

// Token 管理
export {
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo,
} from './request'

// API 模块
export * from './modules'

// Mock 配置
export { MOCK_ENABLED } from './mock'

// 类型导出
export type {
  ApiResponse,
  PageParams,
  PageData,
  PageResponse,
  ID,
  CommonStatus,
  SortParams,
  DateRangeParams,
} from './types'
