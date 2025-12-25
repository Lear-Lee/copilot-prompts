/**
 * [模块名] API
 * 
 * 💡 使用说明：
 * 1. 复制此文件，重命名为业务模块名（如 user.ts, order.ts）
 * 2. 修改 URLs 对象中的接口地址
 * 3. 定义业务相关的类型
 * 4. 实现具体的 API 函数
 * 5. 在 modules/index.ts 中导出
 */
import { post, get, put, del } from '../request'
import { MOCK_ENABLED } from '../mock'
// import * as mockModule from '../mock/[module]'
import type { ApiResponse, PageResponse, PageParams } from '../types'

// ========== 接口地址 ==========

const URLs = {
  list: '/xxx/list',
  detail: '/xxx/detail',
  create: '/xxx/create',
  update: '/xxx/update',
  delete: '/xxx/delete',
}

// ========== 类型定义 ==========

/** 数据项类型 */
export interface ItemData {
  id: string
  name: string
  status: string
  createdAt: string
  updatedAt: string
  // ... 添加其他字段
}

/** 创建/更新参数 */
export interface CreateParams {
  name: string
  // ... 添加其他参数
}

/** 列表查询参数 */
export interface ListParams extends PageParams {
  keyword?: string
  status?: string
  startDate?: string
  endDate?: string
  // ... 添加其他筛选条件
}

// ========== 接口实现 ==========

/**
 * 获取列表
 */
export async function getList(params: ListParams): Promise<PageResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockGetList(params)
  return get(URLs.list, params)
}

/**
 * 获取详情
 */
export async function getDetail(id: string): Promise<ApiResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockGetDetail(id)
  return get(URLs.detail, { id })
}

/**
 * 创建
 */
export async function create(data: CreateParams): Promise<ApiResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockCreate(data)
  return post(URLs.create, data)
}

/**
 * 更新
 */
export async function update(id: string, data: Partial<CreateParams>): Promise<ApiResponse<ItemData>> {
  // if (MOCK_ENABLED) return mockModule.mockUpdate(id, data)
  return put(`${URLs.update}/${id}`, data)
}

/**
 * 删除
 */
export async function remove(id: string): Promise<ApiResponse<null>> {
  // if (MOCK_ENABLED) return mockModule.mockDelete(id)
  return del(URLs.delete, { id })
}

/**
 * 批量删除
 */
export async function batchRemove(ids: string[]): Promise<ApiResponse<null>> {
  // if (MOCK_ENABLED) return mockModule.mockBatchDelete(ids)
  return post(`${URLs.delete}/batch`, { ids })
}

/**
 * 更新状态
 */
export async function updateStatus(id: string, status: string): Promise<ApiResponse<null>> {
  // if (MOCK_ENABLED) return mockModule.mockUpdateStatus(id, status)
  return put(`${URLs.update}/${id}/status`, { status })
}
