/**
 * API 通用类型定义
 * 
 * 💡 按后端实际响应结构调整字段名
 */

/**
 * API 响应基础结构
 * 
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
 * 
 * 常见字段名：
 * - page / pageNum / current
 * - pageSize / size / limit
 */
export interface PageParams {
  page: number
  pageSize: number
}

/**
 * 分页响应数据
 * 
 * 常见字段名：
 * - list / records / items / rows
 * - total / totalCount / count
 */
export interface PageData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 分页响应（完整）
 */
export type PageResponse<T> = ApiResponse<PageData<T>>

/**
 * 通用 ID 类型
 */
export type ID = string | number

/**
 * 通用状态枚举
 */
export type CommonStatus = 'active' | 'inactive' | 'pending' | 'deleted'

/**
 * 排序参数
 */
export interface SortParams {
  sortField?: string
  sortOrder?: 'asc' | 'desc' | 'ascend' | 'descend'
}

/**
 * 时间范围参数
 */
export interface DateRangeParams {
  startDate?: string
  endDate?: string
  startTime?: string
  endTime?: string
}
