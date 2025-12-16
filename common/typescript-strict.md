# TypeScript 严格模式指南

适用于所有需要高质量类型安全的 TypeScript 项目

## 🎯 核心原则

1. **零 any**: 绝不使用 `any` 类型，使用 `unknown` 或具体类型
2. **严格空检查**: 启用 `strictNullChecks`，明确处理 `null`/`undefined`
3. **完整类型定义**: 所有函数参数、返回值、变量都有明确类型
4. **类型推断优先**: 让 TypeScript 推断简单类型，复杂类型显式声明

## 📝 tsconfig.json 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## ✅ 最佳实践

### 类型定义
```typescript
// ✅ 好
interface User {
  id: number
  name: string
  email?: string  // 可选属性
}

function getUser(id: number): Promise<User | null> {
  // ...
}

// ❌ 坏
function getUser(id: any): any {
  // ...
}
```

### 空值处理
```typescript
// ✅ 好
const user: User | null = await getUser(1)
if (user) {
  console.log(user.name)
}

// 或使用可选链
console.log(user?.name)

// ❌ 坏
const user = await getUser(1)
console.log(user.name)  // 可能报错
```

### 联合类型
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

// ❌ 坏
function handleStatus(status: string) {
  // 失去类型约束
}
```

### 泛型使用
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

// ❌ 坏
function fetchData(url: string): Promise<any> {
  return fetch(url).then(res => res.json())
}
```

## ⚠️ 禁止模式

- ❌ `any` 类型
- ❌ 类型断言 `as any`
- ❌ `@ts-ignore` / `@ts-nocheck`
- ❌ 隐式 any (`noImplicitAny: false`)
- ❌ 非空断言 `!` (除非确定安全)

## 📋 代码审查清单

- [ ] 所有函数有明确的参数类型和返回值类型
- [ ] 没有使用 `any` 类型
- [ ] 正确处理可能为 `null`/`undefined` 的值
- [ ] 使用联合类型而非宽泛的 `string`/`number`
- [ ] 复杂对象有接口定义
- [ ] 泛型使用恰当

## 🔧 常见场景

### API 响应处理
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function callApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint)
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

### 类型守卫
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
  console.log(data.name)  // TypeScript 知道 data 是 User
}
```

---

## ⚠️ 重要：配置文件管理

### Copilot 配置 .gitignore

**推荐做法：**将自动生成的 `.github/copilot-instructions.md` 添加到 `.gitignore`

```gitignore
# Copilot 配置(自动生成)
.github/copilot-instructions.md
```

**适用项目：**
- TypeScript 应用（React、Vue、Angular）
- Node.js 后端服务
- TypeScript 工具库
- 所有使用 TypeScript 的项目

**详细指南**: 参考 [Copilot .gitignore 通用指南](../docs/guides/COPILOT_GITIGNORE_GUIDE.md)
