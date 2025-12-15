# Element Plus 组件库使用规范

## 按需导入（推荐）

```typescript
// vite.config.ts
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

export default {
  plugins: [
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ]
}
```

## 表单处理

### 基础表单
```vue
<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'

interface FormData {
  name: string
  email: string
  age: number
}

const formRef = ref<FormInstance>()

const form = reactive<FormData>({
  name: '',
  email: '',
  age: 0
})

const rules: FormRules<FormData> = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱', trigger: 'blur' }
  ]
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((valid) => {
    if (valid) {
      console.log('Submit:', form)
    }
  })
}

const resetForm = () => {
  formRef.value?.resetFields()
}
</script>

<template>
  <el-form
    ref="formRef"
    :model="form"
    :rules="rules"
    label-width="120px"
  >
    <el-form-item label="姓名" prop="name">
      <el-input v-model="form.name" />
    </el-form-item>
    
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" type="email" />
    </el-form-item>
    
    <el-form-item>
      <el-button type="primary" @click="submitForm">提交</el-button>
      <el-button @click="resetForm">重置</el-button>
    </el-form-item>
  </el-form>
</template>
```

## 表格处理

### 基础表格
```vue
<script setup lang="ts">
import { ref } from 'vue'

interface User {
  id: number
  name: string
  email: string
  status: 'active' | 'inactive'
}

const tableData = ref<User[]>([])
const loading = ref(false)

const handleEdit = (row: User) => {
  console.log('Edit:', row)
}

const handleDelete = (row: User) => {
  ElMessageBox.confirm(`确认删除用户 ${row.name}?`, '提示', {
    type: 'warning'
  }).then(() => {
    // 删除逻辑
    ElMessage.success('删除成功')
  })
}
</script>

<template>
  <el-table
    :data="tableData"
    v-loading="loading"
    stripe
  >
    <el-table-column prop="id" label="ID" width="80" />
    <el-table-column prop="name" label="姓名" />
    <el-table-column prop="email" label="邮箱" />
    
    <el-table-column label="状态">
      <template #default="{ row }">
        <el-tag :type="row.status === 'active' ? 'success' : 'info'">
          {{ row.status }}
        </el-tag>
      </template>
    </el-table-column>
    
    <el-table-column label="操作" width="180">
      <template #default="{ row }">
        <el-button link type="primary" @click="handleEdit(row)">
          编辑
        </el-button>
        <el-button link type="danger" @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </el-table-column>
  </el-table>
</template>
```

## 分页

```vue
<script setup lang="ts">
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const handlePageChange = (page: number) => {
  currentPage.value = page
  fetchData()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  fetchData()
}
</script>

<template>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :total="total"
    :page-sizes="[10, 20, 50, 100]"
    layout="total, sizes, prev, pager, next, jumper"
    @size-change="handleSizeChange"
    @current-change="handlePageChange"
  />
</template>
```

## 对话框

```vue
<script setup lang="ts">
const dialogVisible = ref(false)

const openDialog = () => {
  dialogVisible.value = true
}

const handleClose = () => {
  // 关闭前的清理逻辑
  dialogVisible.value = false
}

const handleConfirm = async () => {
  // 确认逻辑
  ElMessage.success('操作成功')
  dialogVisible.value = false
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="对话框标题"
    width="500px"
    @close="handleClose"
  >
    <div>对话框内容</div>
    
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>
```

## 消息提示

```typescript
import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

// 普通消息
ElMessage.success('操作成功')
ElMessage.error('操作失败')
ElMessage.warning('警告信息')

// 确认框
ElMessageBox.confirm('确认删除?', '提示', {
  type: 'warning'
}).then(() => {
  // 确认逻辑
}).catch(() => {
  // 取消逻辑
})

// 通知
ElNotification({
  title: '提示',
  message: '这是一条通知消息',
  type: 'success',
  duration: 3000
})
```

## 加载状态

```vue
<script setup lang="ts">
import { ElLoading } from 'element-plus'

// 全屏加载
const loading = ElLoading.service({
  lock: true,
  text: '加载中...',
  background: 'rgba(0, 0, 0, 0.7)'
})

// 关闭加载
loading.close()

// 或使用 v-loading 指令
const tableLoading = ref(false)
</script>

<template>
  <div v-loading="tableLoading">
    <!-- 内容 -->
  </div>
</template>
```

## 国际化

```typescript
// main.ts
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'

app.use(ElementPlus, {
  locale: zhCn // 或 en
})
```

## 最佳实践

1. **使用按需导入** - 减小包体积
2. **表单验证** - 使用 el-form 的验证功能
3. **类型定义** - 为表格数据定义接口
4. **统一样式** - 使用 CSS 变量自定义主题
5. **响应式** - 合理使用 ref 和 reactive
