# TypeScript 基础规范

## 核心要求

1. **类型优先** - 所有变量、参数、返回值都应有类型
2. **避免 any** - 使用 `unknown` 或更具体的类型
3. **严格模式** - 启用所有严格检查选项

## 基本类型使用

### 原始类型
```typescript
// ✅ 好
const name: string = 'John'
const age: number = 25
const isActive: boolean = true

// ❌ 坏 - 不需要显式类型（可推断）
const name: string = 'John'  // 过度标注
```

### 数组类型
```typescript
// ✅ 好
const numbers: number[] = [1, 2, 3]
const users: User[] = []

// 或使用泛型
const items: Array<string> = ['a', 'b']

// ❌ 坏
const numbers: any[] = [1, 2, 3]
```

### 对象类型
```typescript
// ✅ 好 - 使用 interface
interface User {
  id: number
  name: string
  email?: string  // 可选属性
}

const user: User = {
  id: 1,
  name: 'John'
}

// ❌ 坏
const user: any = { id: 1 }
```

## 函数类型

### 函数声明
```typescript
// ✅ 好 - 明确的参数和返回类型
function add(a: number, b: number): number {
  return a + b
}

// 箭头函数
const multiply = (a: number, b: number): number => a * b

// ❌ 坏 - 缺少返回类型
function add(a: number, b: number) {
  return a + b
}
```

### 异步函数
```typescript
// ✅ 好
async function fetchUser(id: number): Promise<User | null> {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) return null
  return response.json()
}

// ❌ 坏
async function fetchUser(id: number) {
  return await fetch(`/api/users/${id}`)
}
```

### 可选参数
```typescript
// ✅ 好
function greet(name: string, title?: string): string {
  return title ? `${title} ${name}` : name
}

// 默认参数
function createUser(name: string, role: string = 'user'): User {
  return { name, role }
}
```

## 联合类型与类型守卫

### 联合类型
```typescript
// ✅ 好
type Status = 'pending' | 'success' | 'error'
type ID = string | number

function setStatus(status: Status) {
  // ...
}
```

### 类型守卫
```typescript
// ✅ 好
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function processValue(value: string | number) {
  if (typeof value === 'string') {
    return value.toUpperCase()
  }
  return value.toFixed(2)
}
```

## 泛型

### 基本泛型
```typescript
// ✅ 好
function identity<T>(value: T): T {
  return value
}

const result = identity<string>('hello')
```

### 泛型约束
```typescript
// ✅ 好
interface HasId {
  id: number
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id)
}
```

## 类型断言

```typescript
// ✅ 好 - 必要时使用 as
const input = document.querySelector('input') as HTMLInputElement
input.value = 'hello'

// ❌ 坏 - 避免使用 as any
const data = fetchData() as any
```

## 实用类型

```typescript
// Partial - 所有属性可选
type PartialUser = Partial<User>

// Required - 所有属性必填
type RequiredUser = Required<User>

// Pick - 选择部分属性
type UserPreview = Pick<User, 'id' | 'name'>

// Omit - 排除部分属性
type UserWithoutEmail = Omit<User, 'email'>

// Record - 键值对类型
type UserMap = Record<string, User>
```
