/**
 * API 相关类型定义
 */

/** API 响应基础结构 */
export interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

/** 分页参数 */
export interface PageParams {
  page: number
  pageSize: number
}

/** 分页数据 */
export interface PageData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 分页响应 */
export type PageResponse<T> = ApiResponse<PageData<T>>

/** 排序参数 */
export interface SortParams {
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

/** 时间范围 */
export interface DateRange {
  startDate?: string
  endDate?: string
}
