# 代码生成规范

## 核心原则

生成代码时必须遵循以下原则：

### 1. 禁止创建 Markdown 文档

**除非用户明确要求，否则不要创建任何 .md 文件**

```
❌ 禁止自动创建：
- USAGE.md
- GUIDE.md
- CHANGES.md
- CHANGELOG.md
- API.md
- NOTES.md
- 任何其他文档文件

✅ 允许创建（仅在明确要求时）：
- README.md（项目初始化时）
- 用户明确指定的文档
- 修改现有的文档文件
```

**原因：**
- 代码注释已经足够说明用途
- 避免文档与代码不同步
- 减少维护负担
- 保持项目目录清洁

### 2. 重要代码必须添加注释

所有重要代码部分都需要注释：

#### 必须注释的场景

```typescript
// 1. 复杂算法
// 使用快速排序算法，平均时间复杂度 O(n log n)
function quickSort(arr: number[]): number[] {
  if (arr.length <= 1) return arr
  
  const pivot = arr[0]
  const left = arr.slice(1).filter(x => x <= pivot)
  const right = arr.slice(1).filter(x => x > pivot)
  
  return [...quickSort(left), pivot, ...quickSort(right)]
}

// 2. 业务规则
// 新用户享有 7 天免费试用期
function getTrialEndDate(user: User): Date {
  const createdDate = new Date(user.createdAt)
  createdDate.setDate(createdDate.getDate() + 7)
  return createdDate
}

// 3. 性能优化
// 使用节流避免频繁触发搜索请求
const throttledSearch = throttle((keyword: string) => {
  searchAPI(keyword)
}, 300)

// 4. 边界条件处理
function divide(a: number, b: number): number {
  // 防止除零错误
  if (b === 0) {
    throw new Error('除数不能为零')
  }
  return a / b
}

// 5. 重要状态变更
// 标记订单为已完成，触发后续流程
function completeOrder(orderId: string) {
  updateOrderStatus(orderId, 'completed')
  notifyUser(orderId)
  updateInventory(orderId)
}

// 6. API 集成
// 调用第三方支付接口，超时时间 30 秒
async function processPayment(order: Order): Promise<PaymentResult> {
  return await paymentGateway.charge({
    amount: order.total,
    timeout: 30000
  })
}

// 7. 数据转换
// 将后端返回的下划线命名转换为驼峰命名
function transformResponse(data: any) {
  return Object.keys(data).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    acc[camelKey] = data[key]
    return acc
  }, {})
}
```

#### 可选注释的场景

```typescript
// 简单明了的代码可以不注释
function add(a: number, b: number): number {
  return a + b
}

// getter/setter 通常不需要注释
get fullName(): string {
  return `${this.firstName} ${this.lastName}`
}

// 自解释的变量名不需要注释
const isUserLoggedIn = checkLoginStatus()
const hasPermission = user.role === 'admin'
```

### 3. 注释风格：去 AI 化

#### 禁止使用

```typescript
// ❌ 表情符号
// 🎉 欢迎使用这个超棒的函数！
// ✨ 神奇的代码来了～
// 🔥 超级厉害的实现！
// ⚠️ 请注意这里哦～

// ❌ 过度热情的语气
// 哇！这个功能太酷了！
// 太棒了！让我们开始吧～
// 注意啦！这里超级重要！

// ❌ 口语化表达
// 这里稍微有点复杂哈
// 大家注意下这个地方～
// 这块儿需要好好看看

// ❌ AI 式套话
// 让我来帮你实现这个功能
// 我将为您创建一个...
// 下面是一个很好的例子
```

#### 正确使用

```typescript
// ✅ 专业简洁
// 验证用户输入
// 处理异步请求
// 更新缓存数据

// ✅ 说明原因
// 使用 Map 提高查询性能
// 避免循环依赖
// 兼容 IE11

// ✅ 描述技术细节
// 实现深拷贝，避免引用共享
// 使用二进制搜索，时间复杂度 O(log n)
// 采用观察者模式解耦组件

// ✅ 警告潜在问题
// 注意：此操作会修改原数组
// 仅在开发环境使用
// 依赖外部配置文件
```

### 4. 注释的数量和质量

#### 平衡注释密度

```typescript
// ❌ 过少注释
function processData(data) {
  const filtered = data.filter(x => x.status === 'active')
  const sorted = filtered.sort((a, b) => b.priority - a.priority)
  const grouped = sorted.reduce((acc, item) => {
    const key = item.category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})
  return Object.entries(grouped).map(([category, items]) => ({
    category,
    items,
    total: items.reduce((sum, i) => sum + i.value, 0)
  }))
}

// ✅ 适当注释
function processData(data: Item[]): CategorySummary[] {
  // 只处理激活状态的数据
  const filtered = data.filter(x => x.status === 'active')
  
  // 按优先级降序排序
  const sorted = filtered.sort((a, b) => b.priority - a.priority)
  
  // 按类别分组
  const grouped = sorted.reduce((acc, item) => {
    const key = item.category
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, Item[]>)
  
  // 生成每个类别的汇总信息
  return Object.entries(grouped).map(([category, items]) => ({
    category,
    items,
    total: items.reduce((sum, i) => sum + i.value, 0)
  }))
}

// ❌ 过度注释（废话）
function calculateTotal(items: Item[]): number {
  // 初始化总和为 0
  let total = 0
  
  // 遍历每个项目
  for (const item of items) {
    // 将项目的价格加到总和
    total += item.price
  }
  
  // 返回计算出的总和
  return total
}

// ✅ 简洁明了
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

## 实践指南

### 代码生成工作流

1. **分析需求** - 理解用户要求
2. **编写代码** - 实现功能逻辑
3. **添加注释** - 为重要部分添加说明
4. **自查** - 确认没有创建不必要的文档文件
5. **去 AI 化** - 检查注释风格是否专业

### 检查清单

生成代码前检查：

- [ ] 是否只创建了必要的代码文件？
- [ ] 是否避免了创建 .md 文档？
- [ ] 重要逻辑是否有注释说明？
- [ ] 注释是否去除了表情符号？
- [ ] 注释是否使用专业简洁的语言？
- [ ] 注释是否说明了"为什么"而非"是什么"？

### 示例对比

#### 错误示例

```typescript
// 生成了不必要的文档
文件结构：
├── UserService.ts
├── USAGE.md          ❌ 不要创建
└── API_GUIDE.md      ❌ 不要创建

// UserService.ts
// 🎉 用户服务类来啦～
class UserService {
  // 超级厉害的登录方法！
  login() {}
}
```

#### 正确示例

```typescript
// 只生成必要的代码文件
文件结构：
└── UserService.ts

// UserService.ts
/**
 * 用户服务类
 * 处理用户认证、信息管理等核心业务逻辑
 */
class UserService {
  /**
   * 用户登录
   * @param credentials 登录凭证
   * @returns 登录结果，包含用户信息和 token
   * @throws 当凭证无效时抛出 AuthenticationError
   */
  async login(credentials: Credentials): Promise<LoginResult> {
    // 验证凭证格式
    this.validateCredentials(credentials)
    
    // 调用认证服务
    const result = await authService.authenticate(credentials)
    
    // 缓存用户信息
    this.cacheUserInfo(result.user)
    
    return result
  }
  
  // 验证登录凭证格式
  private validateCredentials(credentials: Credentials): void {
    if (!credentials.username || !credentials.password) {
      throw new ValidationError('用户名和密码不能为空')
    }
  }
  
  // 缓存用户信息到本地存储
  private cacheUserInfo(user: User): void {
    localStorage.setItem('user', JSON.stringify(user))
  }
}
```

## 常见问题

### Q: 什么时候可以创建文档？

A: 仅在以下情况：
- 用户明确说"创建一个 README"
- 项目初始化需要项目说明
- 修改现有的文档文件

### Q: 简单的代码也要注释吗？

A: 不需要。如果代码本身就很清晰，不要添加废话注释。

### Q: 如何判断注释是否"AI 化"？

A: 检查是否包含：
- 表情符号（🎉 ✨ 🔥 ⚠️ 等）
- 过度热情的语气（"太棒了"、"超级"、"哇"）
- AI 式套话（"让我来"、"我将为您"）

### Q: 英文项目的注释也要遵循这些规则吗？

A: 是的。无论中英文，都要保持专业简洁的风格。

```typescript
// ✅ 英文注释示例
// Cache results to improve performance
// Handle edge case when array is empty
// Validate input before processing

// ❌ 避免
// 🎉 Awesome function here!
// Let me help you with this amazing feature!
```

## 总结

核心要点：
1. **不要创建文档** - 除非明确要求
2. **充分注释** - 重要代码必须说明
3. **专业风格** - 去除表情符号和 AI 化语气
4. **简洁明了** - 说明原因而非重复代码
