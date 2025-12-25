/**
 * 通用业务类型定义
 */

/** 通用 ID 类型 */
export type ID = string | number

/** 通用状态 */
export type Status = 'active' | 'inactive' | 'pending' | 'deleted'

/** 启用状态 */
export type EnableStatus = 0 | 1

/** 审核状态 */
export type AuditStatus = 'pending' | 'approved' | 'rejected'

/** 性别 */
export type Gender = 'male' | 'female' | 'unknown'

/** 键值对 */
export interface KeyValue<T = any> {
  key: string
  value: T
}

/** 选项项（下拉框等） */
export interface OptionItem<T = string | number> {
  label: string
  value: T
  disabled?: boolean
  children?: OptionItem<T>[]
}

/** 树形节点 */
export interface TreeNode<T = any> {
  id: ID
  label: string
  children?: TreeNode<T>[]
  data?: T
}

/** 表格列配置 */
export interface TableColumn {
  prop: string
  label: string
  width?: number | string
  minWidth?: number | string
  fixed?: 'left' | 'right'
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
}

/** 用户基础信息 */
export interface UserBase {
  id: ID
  username: string
  nickname?: string
  avatar?: string
  email?: string
  phone?: string
}

/** 带时间戳的基础实体 */
export interface BaseEntity {
  id: ID
  createdAt: string
  updatedAt: string
  createdBy?: ID
  updatedBy?: ID
}
