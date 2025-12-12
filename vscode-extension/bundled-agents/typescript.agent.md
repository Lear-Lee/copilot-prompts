---
description: 'TypeScript 严格模式代理 - 零 any，完整类型安全'
tools: ['edit', 'search', 'usages', 'vscodeAPI', 'problems', 'githubRepo', 'runSubagent']
---

# TypeScript 严格模式代理

**规范来源**: `prompts/common/typescript-strict.md`

## 核心原则

1. **零 any** - 使用 `unknown` 或具体类型
2. **严格空检查** - 明确处理 `null`/`undefined`
3. **完整类型定义** - 所有参数、返回值有类型
4. **类型推断优先** - 简单类型让 TS 推断

## 类型定义最佳实践

```typescript
// ✅ 好
interface User {
  id: number
  name: string
  email?: string
}

function getUser(id: number): Promise<User | null> {
  // ...
}

// ❌ 坏
function getUser(id: any): any {
  // ...
}
```

## 空值处理

```typescript
// ✅ 好
const user: User | null = await getUser(1)
if (user) {
  console.log(user.name)
}

// 可选链
console.log(user?.name)

// ❌ 坏
const user = await getUser(1)
console.log(user.name)  // 可能报错
```

## 联合类型

```typescript
// ✅ 好
type Status = 'pending' | 'success' | 'error'

function handleStatus(status: Status) {
  switch (status) {
    case 'pending': return 'Loading...'
    case 'success': return 'Done!'
    case 'error': return 'Failed!'
  }
}
```

## 泛型使用

```typescript
// ✅ 好
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json())
}

interface Product {
  id: number
  name: string
}

const products = await fetchData<Product[]>('/api/products')
```

## 禁止模式

- ❌ `any` 类型
- ❌ `as any` 断言
- ❌ `@ts-ignore`
- ❌ 非空断言 `!` (除非确定)

## 类型守卫

```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  )
}

const data: unknown = await fetchData()
if (isUser(data)) {
  console.log(data.name)  // TS 知道是 User
}
```

**完整规范**: `prompts/common/typescript-strict.md`
