# MCP Server 使用指南

## 📋 目录
1. [配置 MCP 客户端](#配置-mcp-客户端)
2. [在 Claude Desktop 中使用](#在-claude-desktop-中使用)
3. [在 VS Code 中使用](#在-vs-code-中使用)
4. [实际使用场景](#实际使用场景)
5. [最佳实践](#最佳实践)

---

## 配置 MCP 客户端

### 方法 1: Claude Desktop（推荐）

#### 1. 编辑配置文件

**macOS**:
```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Windows**:
```bash
notepad %APPDATA%\Claude\claude_desktop_config.json
```

#### 2. 添加服务器配置

```json
{
  "mcpServers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "/Users/你的用户名/Work/copilot-prompts/mcp-server/build/index.js"
      ]
    }
  }
}
```

**重要**：将路径替换为实际的绝对路径！

#### 3. 重启 Claude Desktop

完全退出并重新启动 Claude Desktop 应用。

#### 4. 验证连接

在 Claude Desktop 中，你应该看到：
- 左下角或工具栏显示 🔨 图标
- 点击后可以看到可用的 MCP 工具

---

### 方法 2: VS Code 工作区

#### 前提条件
- VS Code 版本 >= 1.85
- 已安装 GitHub Copilot 扩展

#### 配置步骤

**选项 A: 使用 VS Code 的 MCP 支持（推荐）**

1. **创建工作区配置文件**

在项目根目录创建 `.vscode/mcp.json`：

```json
{
  "servers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "/Users/pailasi/Work/copilot-prompts/mcp-server/build/index.js"
      ],
      "env": {},
      "autoStart": true
    }
  }
}
```

**⚠️ 注意**: 
- 使用 `servers` (不是 `mcpServers`)
- 必须包含 `env: {}` 字段
- 推荐添加 `autoStart: true`
- 路径必须是绝对路径

2. **配置工作区设置**

在 `.vscode/settings.json` 中添加：

```json
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.configFile": "${workspaceFolder}/.vscode/mcp.json"
}
```

3. **重启 VS Code**

重新打开工作区或重启 VS Code。

4. **验证**

- 打开 Copilot Chat (Ctrl/Cmd + Shift + I)
- 输入 `@workspace` 后应该能看到可用的 MCP 工具
- 或直接在聊天中提问，Copilot 会自动调用工具

**选项 B: 使用 MCP 扩展（备选）**

1. **安装 MCP 扩展**

```bash
# 在 VS Code 扩展市场搜索并安装
"Model Context Protocol"
```

2. **配置 User Settings**

打开 VS Code 设置（Cmd/Ctrl + ,），搜索 "MCP"，添加：

```json
{
  "mcp.servers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "/Users/pailasi/Work/copilot-prompts/mcp-server/build/index.js"
      ]
    }
  }
}
```

3. **启动服务**

- 打开命令面板（Cmd/Ctrl + Shift + P）
- 输入 "MCP: Start Server"
- 选择 "copilot-prompts"

#### VS Code 中的使用方式

**方式 1: Copilot Chat 中使用**

```
你: @workspace 我要开发一个 Vue 3 表单组件，使用 Element Plus

Copilot 会:
1. 自动调用 get_relevant_standards 工具
2. 获取相关编码规范
3. 在当前文件中生成符合规范的代码
```

**方式 2: 内联提示**

```typescript
// 1. 在文件中写注释
// TODO: 创建用户 API，使用 axios，符合项目规范

// 2. 触发 Copilot（Tab 键）
// 3. Copilot 会自动获取规范并生成代码
```

**方式 3: Chat 视图直接使用**

打开 Copilot Chat 侧边栏，输入：

```
帮我分析项目 /Users/pailasi/Work/weipin 并生成 Copilot 配置
```

Copilot 会调用 `analyze_project` 和 `generate_config` 工具。

#### VS Code 工作流示例

**示例 1: 新建组件**

1. 创建文件 `src/components/UserForm.vue`
2. 在文件开头注释：
   ```vue
   <!-- TODO: 创建用户表单组件，使用 Element Plus 和表单验证 -->
   ```
3. 打开 Copilot Chat，输入：
   ```
   基于当前文件，生成完整的 Vue 3 表单组件
   ```
4. Copilot 自动调用 `get_relevant_standards`，生成符合规范的代码

**示例 2: 代码重构**

1. 选中需要优化的代码
2. 右键选择 "Copilot: Explain this"
3. 在 Chat 中继续输入：
   ```
   根据最佳实践重构这段代码
   ```
4. Copilot 获取相关规范并提供优化建议

**示例 3: API 层开发**

1. 创建 `src/api/user.ts`
2. 在 Copilot Chat 中：
   ```
   @workspace 在当前文件创建用户管理 API，包括 CRUD 操作
   使用 axios，符合 TypeScript 和 API 层设计规范
   ```
3. 代码自动插入到文件中

#### VS Code 特有优势

- ✅ **上下文感知**: 自动读取当前文件内容
- ✅ **即时反馈**: 代码直接插入编辑器
- ✅ **多文件操作**: 可以在多个文件间协调
- ✅ **Git 集成**: 配合版本控制使用
- ✅ **调试支持**: 可以在 Chat 中讨论调试问题

#### 工作区配置模板

为方便团队使用，可以将配置提交到仓库：

**`.vscode/mcp.json`**:
```json
{
  "$schema": "https://modelcontextprotocol.io/schema/mcp.json",
  "servers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "${workspaceFolder}/../copilot-prompts/mcp-server/build/index.js"
      ],
      "description": "智能编码规范服务器",
      "autoStart": true
    }
  }
}
```

**`.vscode/settings.json`**:
```json
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.configFile": "${workspaceFolder}/.vscode/mcp.json",
  "github.copilot.chat.mcp.autoStart": true
}
```

**`.vscode/extensions.json`** (推荐扩展):
```json
{
  "recommendations": [
    "github.copilot",
    "github.copilot-chat"
  ]
}
```

提交这些文件后，团队成员打开项目即可自动获得 MCP 支持。

---

## 在 Claude Desktop 中使用

### 场景 1: 开发 Vue 组件时获取编码规范

**你的输入**:
```
我正在开发一个 Vue 3 表单组件，使用 Element Plus 和 Pinia。
请给我相关的编码规范。
```

**Claude 的行为**:
1. 自动调用 `get_relevant_standards` 工具
2. 参数：
   ```json
   {
     "fileType": "vue",
     "imports": ["vue", "element-plus", "pinia"],
     "scenario": "表单组件"
   }
   ```
3. 返回精准的规范（仅 3-6 个模块，~3500 tokens）

**结果**:
Claude 会基于规范为你生成代码：
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useFormStore } from '@/stores/form'
import { ElForm, ElFormItem, ElInput, ElButton } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ✅ 符合规范的 Props 定义
interface Props {
  modelValue: FormData
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false
})

// ✅ 符合规范的 Emits 定义
interface Emits {
  (e: 'update:modelValue', value: FormData): void
  (e: 'submit', value: FormData): void
}

const emit = defineEmits<Emits>()

// ✅ 符合规范的 Store 使用
const formStore = useFormStore()

// ✅ 符合规范的表单引用
const formRef = ref<FormInstance>()

// ✅ 符合规范的验证规则
const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ]
}
</script>
```

---

### 场景 2: 开发 API 层时

**你的输入**:
```
帮我创建一个用户管理的 API 模块，使用 axios。
文件路径: src/api/user.ts
```

**Claude 的行为**:
1. 调用 `get_relevant_standards` 
2. 参数：
   ```json
   {
     "fileType": "ts",
     "imports": ["axios"],
     "scenario": "API 调用"
   }
   ```

**生成的代码**:
```typescript
// src/api/user.ts
import request from '@/utils/request'

// ✅ 符合规范的类型定义
export interface User {
  id: number
  username: string
  email: string
}

export interface CreateUserDTO {
  username: string
  email: string
  password: string
}

export interface UserListParams {
  page: number
  pageSize: number
  keyword?: string
}

export interface UserListResponse {
  list: User[]
  total: number
}

// ✅ 符合规范的 API 模块化
export const userApi = {
  /**
   * 获取用户列表
   */
  getList(params: UserListParams): Promise<UserListResponse> {
    return request.get('/users', { params })
  },

  /**
   * 获取用户详情
   */
  getById(id: number): Promise<User> {
    return request.get(`/users/${id}`)
  },

  /**
   * 创建用户
   */
  create(data: CreateUserDTO): Promise<User> {
    return request.post('/users', data)
  },

  /**
   * 更新用户
   */
  update(id: number, data: Partial<User>): Promise<User> {
    return request.put(`/users/${id}`, data)
  },

  /**
   * 删除用户
   */
  delete(id: number): Promise<void> {
    return request.delete(`/users/${id}`)
  }
}
```

---

### 场景 3: 直接提供文件内容（最智能）

**你的输入**:
```
帮我优化这段代码：

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

const form = ref({})

function submit() {
  ElMessage.success('提交成功')
}
</script>
```

**Claude 的行为**:
1. 自动检测文件内容中的 imports
2. 调用 `get_relevant_standards`
3. 参数自动填充：
   ```json
   {
     "fileType": "vue",
     "fileContent": "<script setup>...",  // 完整内容
     // imports 自动检测为: ["vue", "element-plus"]
   }
   ```

**优化后的代码**:
```vue
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// ✅ 添加类型定义
interface FormData {
  username: string
  email: string
}

// ✅ 使用 reactive 而非 ref（对象）
const form = reactive<FormData>({
  username: '',
  email: ''
})

// ✅ 添加表单引用
const formRef = ref<FormInstance>()

// ✅ 添加验证规则
const rules: FormRules<FormData> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式不正确', trigger: 'blur' }
  ]
}

// ✅ 添加验证逻辑
async function submit() {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    // 提交逻辑
    ElMessage.success('提交成功')
  } catch (error) {
    ElMessage.error('表单验证失败')
  }
}
</script>

<template>
  <el-form ref="formRef" :model="form" :rules="rules">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" />
    </el-form-item>
    <el-form-item>
      <el-button type="primary" @click="submit">提交</el-button>
    </el-form-item>
  </el-form>
</template>
```

---

## 实际使用场景

### 1. 新项目初始化

```
你: 帮我分析项目 /Users/me/projects/my-vue-app 并生成 Copilot 配置

Claude 会:
1. 调用 analyze_project 分析技术栈
2. 调用 match_agents 匹配合适的 Agents
3. 调用 generate_config 生成配置文件
4. 告诉你已生成 .github/copilot-instructions.md
```

### 2. 开发中实时获取规范

```
你: 我要写一个 Pinia store，管理用户状态

Claude:
[调用 get_relevant_standards]
根据 Pinia 规范为你生成：
- ✅ 使用 Composition API 风格
- ✅ 正确的 state、getters、actions 结构
- ✅ TypeScript 类型定义
- ✅ 持久化配置（如果需要）
```

### 3. 代码审查与优化

```
你: 帮我审查这段代码，看看是否符合最佳实践
[粘贴代码]

Claude:
[自动检测技术栈，获取相关规范]
给出具体的优化建议，包括：
- ❌ 不符合规范的地方
- ✅ 符合规范的地方
- 💡 改进建议
- 📝 优化后的代码
```

### 4. 查看性能统计

```
你: 查看一下规范系统的使用情况

Claude:
[调用 get_standards_stats]
返回：
- 缓存命中率: 75%
- 最常用规范: Vue 3 Composition API
- Token 节省: 42915
- 平均响应时间: 0.25ms
```

---

## 最佳实践

### ✅ DO（推荐做法）

1. **明确场景**
   ```
   好: "我要开发一个 Vue 3 表单组件，使用 Element Plus"
   差: "给我写个表单"
   ```

2. **提供上下文**
   ```
   好: "在 src/api/user.ts 中创建用户 API，使用 axios"
   差: "创建 API"
   ```

3. **直接粘贴代码**
   ```
   好: "优化这段代码：[粘贴完整代码]"
   差: "我的代码有问题"
   ```

4. **利用缓存**
   - 同一个会话中，相似的请求会利用缓存加速
   - 连续开发同一类型的功能时效率更高

### ❌ DON'T（避免的做法）

1. **不要过于简单的描述**
   ```
   差: "写代码"
   差: "帮我"
   ```

2. **不要省略技术栈**
   ```
   差: "创建一个组件"（不知道是 Vue/React？）
   好: "创建一个 Vue 3 组件"
   ```

3. **不要期望跨语言规范**
   ```
   当前仅支持: Vue 3, TypeScript, Element Plus, Pinia, i18n
   不支持: React, Angular 等（可扩展）
   ```

---

## 高级技巧

### 1. 组合使用多个工具

```
你: 先分析项目 /path/to/project，然后为我生成一个符合项目规范的用户管理页面

Claude 会:
1. analyze_project - 了解项目技术栈
2. get_relevant_standards - 获取相关规范
3. 生成完整的用户管理页面（包括 Vue 组件、API、Store）
```

### 2. 增量开发

```
你: 基于刚才的表单组件，再添加国际化支持

Claude:
[自动调用 get_relevant_standards，增加 i18n 规范]
添加：
- useI18n 使用
- $t() 翻译函数
- 翻译文件结构
```

### 3. 性能优化建议

```
你: 查看规范系统统计，告诉我哪些规范最常用

Claude:
[调用 get_standards_stats]
根据统计数据，建议你：
- 优先学习 Vue 3 Composition API（使用最频繁）
- 关注 Element Plus 表单规范（常见需求）
```

---

## 故障排查

### 问题 1: Claude 没有调用工具

**症状**: Claude 直接回答，没有使用 MCP 工具

**解决**:
1. 检查 Claude Desktop 左下角是否有 🔨 图标
2. 重启 Claude Desktop
3. 检查配置文件路径是否正确
4. 查看日志: `~/Library/Logs/Claude/mcp*.log`

### 问题 2: 工具调用失败

**症状**: 显示错误信息

**解决**:
1. 确认已运行 `npm run build`
2. 检查 Node.js 版本 >= 18.0.0
3. 查看服务器日志（stderr 输出）

### 问题 3: 规范内容不符合预期

**症状**: 返回的规范不相关

**解决**:
1. 提供更明确的场景描述
2. 直接指定 imports 数组
3. 提供完整的文件内容让 AI 自动检测

---

## 进阶配置

### 自定义规范

如果你想添加自己的规范：

1. 在 `standards/` 目录下添加新文件
2. 遵循现有的 Markdown 格式
3. 更新 `standardsManager.ts` 中的映射
4. 重新编译: `npm run build`

### 与其他工具集成

MCP 服务器可以与任何支持 MCP 协议的客户端集成：
- Claude Desktop（推荐）
- VS Code（通过插件）
- 自定义客户端（使用 MCP SDK）

---

## 总结

**核心优势**:
- 🚀 **Token 节省 50-70%**: 仅加载相关规范
- ⚡ **响应速度快**: 缓存命中时 8 倍加速
- 🎯 **精准匹配**: 智能权重算法
- 📊 **数据驱动**: 使用统计优化体验

**典型工作流**:
```
1. 告诉 Claude 你要做什么 →
2. Claude 自动获取相关规范 →
3. 基于规范生成高质量代码 →
4. 你得到符合最佳实践的代码 ✨
```

**开始使用**:
1. 配置 Claude Desktop（5 分钟）
2. 告诉 Claude 你的需求
3. 享受智能编码体验！

---

**需要帮助？**
- 查看 [README.md](README.md)
- 查看 [CHANGELOG.md](CHANGELOG.md)
- 运行测试: `node test-phase3.cjs`
