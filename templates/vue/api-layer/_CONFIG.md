# Vue API Layer 模板

> Axios + Mock 完整封装，支持多种 UI 框架

## 📋 模板信息

- **适用框架**: Vue 3 + TypeScript
- **构建工具**: Vite / Webpack
- **UI 框架**: Element Plus / Ant Design Vue / Naive UI / 其他

## 📦 包含文件

```
api-layer/
├── _CONFIG.md              # 本文件
├── request.ts              # Axios 核心封装
├── mock/
│   └── index.ts            # Mock 工具函数
├── modules/
│   ├── index.ts            # 模块导出
│   └── _template.ts        # API 模块模板
├── index.ts                # 统一入口
└── types.ts                # 类型定义
```

## 🔧 依赖要求

```json
{
  "dependencies": {
    "axios": "^1.6.0"
  }
}
```

## 🚀 快速开始

### 1. 复制文件

将本目录下所有文件（除 `_CONFIG.md`）复制到项目的 `src/api/` 目录

### 2. 配置环境变量

```bash
# .env.development
VITE_API_BASE_URL=/api
VITE_MOCK_ENABLED=true

# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_MOCK_ENABLED=false
```

### 3. 适配 UI 框架

编辑 `request.ts`，找到 `showMessage` 对象，替换为你的 UI 框架：

```typescript
// Element Plus
import { ElMessage } from 'element-plus'
const showMessage = {
  success: (msg: string) => ElMessage.success(msg),
  error: (msg: string) => ElMessage.error(msg),
  warning: (msg: string) => ElMessage.warning(msg),
}

// Ant Design Vue
import { message } from 'ant-design-vue'
const showMessage = {
  success: (msg: string) => message.success(msg),
  error: (msg: string) => message.error(msg),
  warning: (msg: string) => message.warning(msg),
}

// Naive UI
import { useMessage } from 'naive-ui'
// 需要在 setup 中使用，建议封装为工具函数
```

### 4. 适配后端响应格式

编辑 `request.ts` 响应拦截器，调整业务状态码判断：

```typescript
// 常见格式 A: { code: 0, data, message }
if (res.code === 0) return res

// 常见格式 B: { code: 200, data, msg }
if (res.code === 200) return res

// 常见格式 C: { success: true, data, message }
if (res.success === true) return res
```

### 5. 创建业务模块

复制 `modules/_template.ts`，重命名为业务模块名（如 `user.ts`），修改内容。

### 6. 导出模块

编辑 `modules/index.ts`，添加导出：

```typescript
export * as userApi from './user'
```

---

## ⚙️ 配置项

### Token 配置

| 配置项 | 位置 | 说明 |
|--------|------|------|
| `TOKEN_KEY` | request.ts | localStorage 存储键名 |
| `USER_KEY` | request.ts | 用户信息存储键名 |
| `NO_TOKEN_URLS` | request.ts | 无需 Token 的白名单 |
| Token 传递方式 | 请求拦截器 | `Authorization: Bearer xxx` 或 `headers.token` |

### 响应配置

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 成功状态码 | 响应拦截器 | `code === 0` 或 `code === 200` |
| 错误消息字段 | 响应拦截器 | `message` 或 `msg` |
| 登录过期处理 | 响应拦截器 | 清除 Token、跳转登录页 |

### 类型配置

| 配置项 | 位置 | 说明 |
|--------|------|------|
| 响应结构 | types.ts | `ApiResponse<T>` |
| 分页参数 | types.ts | `PageParams` |
| 分页数据 | types.ts | `PageData<T>` |

---

## 📚 相关文档

- 详细规范：[vue-api-mock-layer.md](../../../standards/patterns/vue-api-mock-layer.md)

---

**版本**: v1.0  
**更新日期**: 2025-12-25
