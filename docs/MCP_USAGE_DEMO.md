# 🎯 MCP Standards 使用演示指南

> 这是一份完整的实战演示，展示如何在 VS Code 中使用 MCP Standards 服务来提升代码质量

---

## 📋 目录

1. [快速开始](#快速开始)
2. [场景一：创建 Vue 3 表单组件](#场景一创建-vue-3-表单组件)
3. [场景二：编写 API 调用代码](#场景二编写-api-调用代码)
4. [场景三：智能自动推荐](#场景三智能自动推荐)
5. [场景四：使用预设模板](#场景四使用预设模板)
6. [常见问题](#常见问题)

---

## 🚀 快速开始

### 前提条件

确保已完成配置：
- ✅ VS Code 安装了 GitHub Copilot 扩展
- ✅ 项目中存在 `.vscode/mcp.json` 配置文件
- ✅ MCP 服务器已启动（自动启动）

### 验证配置

打开 VS Code，按 `Cmd+Shift+P`（Mac）或 `Ctrl+Shift+P`（Windows），输入 `MCP`，应该能看到 MCP 相关命令。

---

## 🎨 场景一：创建 Vue 3 表单组件

### 1️⃣ 创建新文件

在项目中创建 `src/components/UserForm.vue`

### 2️⃣ 在 Copilot Chat 中输入

```
@mcp 我需要创建一个 Vue 3 用户表单组件，包含：
- 姓名（必填，2-20字符）
- 邮箱（必填，邮箱格式）
- 年龄（必填，0-150）
- 使用 Element Plus
- 符合 TypeScript 严格模式
- 所有文本国际化
```

### 3️⃣ MCP 工作流程

MCP 会自动：
1. 检测到这是 Vue 3 + Element Plus + TypeScript 场景
2. 调用 `get_smart_standards` 获取相关规范：
   - `core/code-style.md` - 代码风格
   - `core/typescript-base.md` - TypeScript 类型规范
   - `frameworks/vue3-composition.md` - Vue 3 Composition API
   - `libraries/element-plus.md` - Element Plus 表单规范
   - `libraries/i18n.md` - 国际化规范

### 4️⃣ 生成的代码（示例）

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface UserForm {
  name: string
  email: string
  age: number
}

const formRef = ref<FormInstance>()

const formData = reactive<UserForm>({
  name: '',
  email: '',
  age: 0
})

const rules: FormRules<UserForm> = {
  name: [
    { required: true, message: t('form.nameRequired'), trigger: 'blur' },
    { min: 2, max: 20, message: t('form.nameLength'), trigger: 'blur' }
  ],
  email: [
    { required: true, message: t('form.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('form.emailFormat'), trigger: 'blur' }
  ],
  age: [
    { required: true, message: t('form.ageRequired'), trigger: 'blur' },
    { type: 'number', min: 0, max: 150, message: t('form.ageRange'), trigger: 'blur' }
  ]
}

const submitForm = async (): Promise<void> => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    // TODO: 实现提交逻辑
    console.log('Submit:', formData)
    ElMessage.success(t('common.submitSuccess'))
  } catch (error) {
    console.error('Validation failed:', error)
    ElMessage.warning(t('form.validationFailed'))
  }
}

const resetForm = (): void => {
  formRef.value?.resetFields()
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
    label-width="120px"
    label-position="right"
  >
    <el-form-item :label="t('form.name')" prop="name">
      <el-input 
        v-model="formData.name" 
        :placeholder="t('form.namePlaceholder')" 
      />
    </el-form-item>
    
    <el-form-item :label="t('form.email')" prop="email">
      <el-input 
        v-model="formData.email" 
        type="email"
        :placeholder="t('form.emailPlaceholder')" 
      />
    </el-form-item>
    
    <el-form-item :label="t('form.age')" prop="age">
      <el-input-number 
        v-model="formData.age" 
        :min="0" 
        :max="150" 
      />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">
        {{ t('common.submit') }}
      </el-button>
      <el-button @click="resetForm">
        {{ t('common.reset') }}
      </el-button>
    </el-form-item>
  </el-form>
</template>
```

### 5️⃣ 代码质量检查

MCP 确保的质量点：
- ✅ TypeScript 严格类型（`FormInstance`, `FormRules<UserForm>`）
- ✅ 所有文本使用 `t()` 国际化
- ✅ 表单验证规则完整
- ✅ 错误处理使用 try-catch
- ✅ 函数有明确返回类型（`: Promise<void>`, `: void`）
- ✅ ref 使用了类型参数
- ✅ 禁用了隐式 any

---

## 🌐 场景二：编写 API 调用代码

### 1️⃣ 创建 API 文件

创建 `src/api/user.ts`

### 2️⃣ 在 Copilot Chat 中输入

```
@mcp 创建用户 API 模块，包括：
- 获取用户列表（分页）
- 创建用户
- 更新用户
- 删除用户
- 使用 axios
- 完整的 TypeScript 类型
- 统一的错误处理
```

### 3️⃣ MCP 调用的规范

- `patterns/api-layer.md` - API 层设计模式
- `core/typescript-base.md` - TypeScript 类型系统
- `core/code-style.md` - 代码风格规范

### 4️⃣ 生成的代码（示例）

```typescript
import axios, { type AxiosResponse } from 'axios'

// ==================== 类型定义 ====================

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
  createdAt: string
}

interface PaginationParams {
  page: number
  pageSize: number
}

interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  code?: number
}

// ==================== API 客户端 ====================

class UserApi {
  private readonly baseURL = '/api/users'

  /**
   * 获取用户列表
   */
  async getList(params: PaginationParams): Promise<ApiResponse<ListResponse<User>>> {
    try {
      const response: AxiosResponse<ApiResponse<ListResponse<User>>> = await axios.get(
        this.baseURL,
        { params }
      )
      return response.data
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 创建用户
   */
  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await axios.post(
        this.baseURL,
        user
      )
      return response.data
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 更新用户
   */
  async update(id: number, user: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await axios.put(
        `${this.baseURL}/${id}`,
        user
      )
      return response.data
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 删除用户
   */
  async delete(id: number): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await axios.delete(
        `${this.baseURL}/${id}`
      )
      return response.data
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * 统一错误处理
   */
  private handleError(error: unknown): ApiResponse {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        message: error.response?.data?.message || error.message,
        code: error.response?.status
      }
    }
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ==================== 导出实例 ====================

export const userApi = new UserApi()

// ==================== 导出类型 ====================

export type { User, PaginationParams, ListResponse, ApiResponse }
```

### 5️⃣ 代码质量亮点

- ✅ 所有函数有 JSDoc 注释
- ✅ 完整的类型定义（无 any）
- ✅ 使用 TypeScript 工具类型（`Omit`, `Partial`）
- ✅ 统一的错误处理
- ✅ 导出类型供其他模块使用
- ✅ 类封装，单一职责

---

## 🧠 场景三：智能自动推荐

### 零配置使用

当你在任何文件中使用 Copilot Chat 时，MCP 会自动分析上下文：

#### 示例 1：编辑 Pinia Store

**文件**: `src/stores/user.ts`

**触发条件**: MCP 检测到文件路径包含 `stores/`

**自动加载的规范**:
- `frameworks/pinia.md` - Pinia 状态管理
- `core/typescript-base.md` - TypeScript 类型
- `patterns/api-layer.md` - API 调用模式（如果检测到 API 调用）

#### 示例 2：编辑 Composable

**文件**: `src/composables/useUserForm.ts`

**触发条件**: 
- 文件路径包含 `composables/`
- 文件名以 `use` 开头

**自动加载的规范**:
- `frameworks/vue3-composition.md` - Composition API
- `core/typescript-base.md` - TypeScript 类型

#### 示例 3：编辑配置文件

**文件**: `vite.config.ts`

**触发条件**: 文件名是配置文件

**自动加载的规范**:
- `core/typescript-base.md` - TypeScript 类型
- 相关构建工具规范

---

## 🎁 场景四：使用预设模板

### 可用预设列表

使用 `use_preset` 工具快速获取特定场景的规范组合：

```
@mcp 使用预设：vue3-form
```

#### 预设 1: `vue3-component`
**适用场景**: 创建通用 Vue 3 组件  
**包含规范**:
- Vue 3 Composition API
- TypeScript 基础
- 代码风格
- 组件设计模式

#### 预设 2: `vue3-form`
**适用场景**: 创建表单组件  
**包含规范**:
- Vue 3 Composition API
- Element Plus（表单部分）
- i18n 国际化
- TypeScript 类型

#### 预设 3: `vue3-table`
**适用场景**: 创建表格组件  
**包含规范**:
- Vue 3 Composition API
- Element Plus（表格、分页）
- TypeScript 类型
- API 调用模式

#### 预设 4: `pinia-store`
**适用场景**: 创建 Pinia store  
**包含规范**:
- Pinia 状态管理
- TypeScript 类型
- API 调用模式

#### 预设 5: `api-call`
**适用场景**: 编写 API 调用代码  
**包含规范**:
- API 层设计
- TypeScript 类型
- 错误处理

#### 预设 6: `typescript-strict`
**适用场景**: 严格类型检查的 TypeScript 代码  
**包含规范**:
- TypeScript 严格模式
- 代码风格

#### 预设 7: `i18n`
**适用场景**: 国际化相关代码  
**包含规范**:
- i18n 规范
- Vue 3 集成

#### 预设 8: `composable`
**适用场景**: 创建 Composable 函数  
**包含规范**:
- Vue 3 Composition API
- TypeScript 类型
- 组件设计模式

### 使用预设的好处

1. **快速启动** - 无需手动指定所需规范
2. **经过验证** - 预设组合经过实战测试
3. **节省 Token** - 只加载必需的规范

---

## 📊 对比：有 MCP vs 无 MCP

### 无 MCP 生成的代码

```vue
<script setup>
// ❌ 没有类型
const form = {
  name: '',
  email: ''
}

// ❌ 硬编码文本
const submit = () => {
  console.log(form)
  alert('提交成功')
}
</script>

<template>
  <!-- ❌ 硬编码文本 -->
  <el-form :model="form">
    <el-form-item label="姓名">
      <el-input v-model="form.name" />
    </el-form-item>
    <!-- ❌ 没有验证规则 -->
  </el-form>
</template>
```

### 有 MCP 生成的代码

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// ✅ 完整类型定义
interface UserForm {
  name: string
  email: string
}

const formRef = ref<FormInstance>()
const formData = reactive<UserForm>({
  name: '',
  email: ''
})

// ✅ 验证规则 + 国际化
const rules: FormRules<UserForm> = {
  name: [
    { required: true, message: t('form.nameRequired'), trigger: 'blur' }
  ],
  email: [
    { required: true, message: t('form.emailRequired'), trigger: 'blur' },
    { type: 'email', message: t('form.emailFormat'), trigger: 'blur' }
  ]
}

// ✅ 完整的错误处理
const submit = async (): Promise<void> => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    console.log('Submit:', formData)
    ElMessage.success(t('common.success'))
  } catch (error) {
    ElMessage.warning(t('form.validationFailed'))
  }
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="rules"
  >
    <!-- ✅ 国际化 -->
    <el-form-item :label="t('form.name')" prop="name">
      <el-input v-model="formData.name" />
    </el-form-item>
  </el-form>
</template>
```

### 质量提升对比

| 维度 | 无 MCP | 有 MCP |
|------|--------|--------|
| TypeScript 类型 | ❌ 缺失 | ✅ 完整 |
| 国际化 | ❌ 硬编码 | ✅ 全部使用 t() |
| 表单验证 | ❌ 缺失 | ✅ 完整规则 |
| 错误处理 | ❌ 缺失 | ✅ try-catch |
| 代码风格 | ❌ 不统一 | ✅ 规范统一 |
| 可维护性 | ⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## 🔍 常见问题

### Q1: MCP 是自动工作的吗？

**A**: 是的！配置完成后，当你使用 `@mcp` 或让 Copilot 生成代码时，MCP 会自动：
1. 分析你的文件路径和内容
2. 推荐相关的编码规范
3. 确保生成的代码符合规范

### Q2: 我需要手动指定规范吗？

**A**: 大多数情况不需要。MCP 的 `get_smart_standards` 工具会自动检测：
- 文件路径（如 `stores/`, `components/`, `api/`）
- 文件扩展名（`.vue`, `.ts`, `.tsx`）
- 导入语句（如 `import { defineStore }`, `import { ref }`）

### Q3: 如何知道 MCP 使用了哪些规范？

**A**: 在 Copilot Chat 中询问：
```
@mcp 当前使用了哪些规范？
```

或查看 MCP 返回的上下文信息。

### Q4: 我可以覆盖 MCP 的规范吗？

**A**: 可以！在提示词中明确说明：
```
@mcp 创建一个用户表单，但不使用 i18n（临时测试用）
```

### Q5: MCP 支持哪些框架？

**A**: 当前支持：
- ✅ Vue 3 (Composition API)
- ✅ Pinia
- ✅ Element Plus
- ✅ TypeScript
- ✅ vue-i18n

更多框架规范持续添加中...

### Q6: 如何添加自定义规范？

**A**: 在 `standards/` 目录下添加新的 `.md` 文件，MCP 会自动识别。

---

## 🎓 学习路径建议

### 第 1 天：基础使用
1. ✅ 完成 VS Code 配置
2. ✅ 尝试场景一（创建表单组件）
3. ✅ 对比有无 MCP 的代码质量差异

### 第 2 天：深入实践
1. ✅ 尝试场景二（API 调用）
2. ✅ 尝试使用预设模板
3. ✅ 在实际项目中使用 MCP

### 第 3 天：高级技巧
1. ✅ 理解智能推荐机制
2. ✅ 学习如何自定义规范
3. ✅ 优化团队的编码规范库

---

## 📞 获取帮助

- 📖 查看 [README.md](../README.md) - 项目概览
- 🚀 查看 [QUICK_START.md](../QUICK_START.md) - 快速开始
- 🏗️ 查看 [STRUCTURE.md](../STRUCTURE.md) - 项目结构
- 💡 查看 `standards/` 目录 - 所有可用规范

---

**更新日期**: 2025-12-15  
**版本**: v1.0.0
