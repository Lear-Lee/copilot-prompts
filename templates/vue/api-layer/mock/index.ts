/**
 * Mock 系统入口
 * 
 * 提供 Mock 开关和常用工具函数
 */
import type { ApiResponse, PageData } from '../types'

// Mock 开关（由环境变量控制）
export const MOCK_ENABLED = import.meta.env.VITE_MOCK_ENABLED === 'true'

// Mock 延迟时间（模拟网络请求）
export const MOCK_DELAY = 300

/**
 * 延迟函数
 */
export const delay = (ms: number = MOCK_DELAY) => 
  new Promise(resolve => setTimeout(resolve, ms))

// 别名
export const sleep = delay

/**
 * 生成成功响应
 */
export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    code: 0,
    data,
    message: 'success',
  }
}

/**
 * 生成错误响应
 */
export function errorResponse(message: string, code = -1): ApiResponse<null> {
  return {
    code,
    data: null,
    message,
  }
}

/**
 * 生成分页响应
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
    data: {
      list: data,
      total: total ?? list.length,
      page,
      pageSize,
    },
    message: 'success',
  }
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
 * 生成随机整数
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * 生成随机金额（保留两位小数）
 */
export function randomAmount(min = 100, max = 10000): number {
  return Number((Math.random() * (max - min) + min).toFixed(2))
}

/**
 * 生成随机手机号
 */
export function randomPhone(): string {
  const prefixes = ['138', '139', '150', '151', '152', '158', '159', '186', '187', '188']
  return randomPick(prefixes) + String(Math.random()).slice(2, 10)
}

/**
 * 生成随机邮箱
 */
export function randomEmail(name?: string): string {
  const domains = ['qq.com', '163.com', 'gmail.com', 'outlook.com']
  const prefix = name || `user${randomInt(1000, 9999)}`
  return `${prefix}@${randomPick(domains)}`
}
