# Vue CSS 嵌套写法规范

> 适用于 Vue 3 项目中的 `<style scoped>` 样式编写

## 🎯 核心原则

1. **强制使用原生 CSS 嵌套语法** - 所有 Vue 组件样式必须使用嵌套写法
2. **层级清晰** - 样式结构与 HTML 结构保持对应
3. **减少重复** - 利用嵌套避免重复书写父选择器
4. **BEM 友好** - 嵌套语法与 BEM 命名完美配合
5. **禁止内联样式** - 模板中不允许使用 `style="..."` 内联样式
6. **标准 CSS 语法** - 全局样式文件必须使用完整的 CSS 语法（带 `:`、`;`、`{}`）

---

## 🚫 禁止内联样式

### ❌ 禁止 - 内联样式

```vue
<template>
  <!-- ❌ 禁止：使用 style 属性 -->
  <el-input v-model="value" style="width: 180px;" />
  <el-select v-model="value" style="width: 140px;" />
  <div style="margin-top: 16px; padding: 12px;">内容</div>
</template>
```

### ✅ 正确 - 使用 CSS 类

```vue
<template>
  <!-- ✅ 使用语义化类名或工具类 -->
  <el-input v-model="value" class="w_180" />
  <el-select v-model="value" class="w_140" />
  <div class="mt_16 p_12">内容</div>
  
  <!-- ✅ 或使用嵌套 CSS 定义宽度 -->
  <div class="search-form">
    <el-input v-model="value" />  <!-- 宽度由 CSS 控制 -->
  </div>
</template>

<style scoped>
.search-form {
  :deep(.el-input) {
    width: 180px;
  }
  
  :deep(.el-select) {
    width: 140px;
  }
}
</style>
```

### 搜索表单最佳实践

```vue
<template>
  <el-form :model="searchForm" inline class="search-form">
    <el-form-item label="订单编号">
      <el-input v-model="searchForm.orderNo" placeholder="请输入" clearable />
    </el-form-item>
    <el-form-item label="状态">
      <el-select v-model="searchForm.status" placeholder="请选择" clearable />
    </el-form-item>
    <el-form-item label="日期范围">
      <el-date-picker v-model="searchForm.dateRange" type="daterange" />
    </el-form-item>
  </el-form>
</template>

<style scoped>
.search-form {
  /* 统一设置搜索表单中输入框的宽度 */
  :deep(.el-input) {
    width: 180px;
  }
  
  :deep(.el-select) {
    width: 140px;
  }
  
  :deep(.el-date-editor--daterange) {
    width: 260px;
  }
}
</style>
```

---

## 📐 基础语法

### ✅ 正确 - 嵌套写法

```vue
<style scoped>
.container {
  padding: 20px;
  background: var(--color-background);

  .header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;

    .title {
      font-size: 18px;
      font-weight: 600;
      color: var(--color-text-primary);
    }

    .actions {
      margin-left: auto;
      display: flex;
      gap: 8px;
    }
  }

  .content {
    padding: 16px;
    border-radius: 8px;
    background: var(--color-background-elevated);

    .item {
      padding: 12px;
      border-bottom: 1px solid var(--color-border);

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: var(--color-background-hover);
      }
    }
  }
}
</style>
```

### ❌ 禁止 - 扁平写法

```vue
<style scoped>
/* ❌ 禁止：重复书写父选择器 */
.container {
  padding: 20px;
}

.container .header {
  display: flex;
}

.container .header .title {
  font-size: 18px;
}

.container .content {
  padding: 16px;
}

.container .content .item {
  padding: 12px;
}
</style>
```

---

## 🔧 嵌套语法详解

### 1. 基础嵌套

```css
.parent {
  /* 父元素样式 */

  .child {
    /* 子元素样式 */
  }
}
```

### 2. 伪类和伪元素（使用 `&`）

```css
.button {
  background: var(--color-primary);
  color: white;

  &:hover {
    background: var(--color-primary-dark);
  }

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &::before {
    content: '';
    /* ... */
  }
}
```

### 3. 状态类名组合

```css
.menu-item {
  padding: 12px 16px;
  color: var(--color-text-secondary);

  &.active {
    color: var(--color-primary);
    background: var(--color-primary-light);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
```

### 4. 响应式媒体查询

```css
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
}
```

### 5. 多级嵌套（建议不超过 3 层）

```css
.page {
  /* 第 1 层 */

  .section {
    /* 第 2 层 */

    .card {
      /* 第 3 层 - 建议最深层级 */

      .card-title { /* ⚠️ 第 4 层 - 尽量避免 */ }
    }
  }
}
```

---

## 📋 完整组件示例

```vue
<template>
  <div class="user-card">
    <div class="user-card__header">
      <img class="avatar" :src="user.avatar" />
      <div class="info">
        <span class="name">{{ user.name }}</span>
        <span class="role">{{ user.role }}</span>
      </div>
    </div>
    <div class="user-card__content">
      <p class="description">{{ user.bio }}</p>
    </div>
    <div class="user-card__footer">
      <el-button type="primary" @click="handleEdit">编辑</el-button>
      <el-button @click="handleDelete">删除</el-button>
    </div>
  </div>
</template>

<style scoped>
.user-card {
  border-radius: 8px;
  background: var(--color-background-elevated);
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  &__header {
    display: flex;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--color-border);

    .avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
    }

    .info {
      margin-left: 12px;
      display: flex;
      flex-direction: column;

      .name {
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-primary);
      }

      .role {
        font-size: 12px;
        color: var(--color-text-tertiary);
        margin-top: 4px;
      }
    }
  }

  &__content {
    padding: 16px;

    .description {
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-text-secondary);
    }
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px;
    background: var(--color-background-secondary);
  }
}
</style>
```

---

## ⚠️ 注意事项

### 1. 深度选择器（穿透第三方组件）

```css
.custom-table {
  /* 穿透 Element Plus 组件样式 */
  :deep(.el-table__header) {
    background: var(--color-background-secondary);
  }

  :deep(.el-table__row) {
    &:hover {
      background: var(--color-background-hover);
    }
  }
}
```

### 2. 全局样式（慎用）

```css
/* 在嵌套中使用全局选择器 */
.modal {
  :global(.el-overlay) {
    /* 影响全局，慎用 */
  }
}
```

### 3. 变量使用

```css
.component {
  /* ✅ 使用 CSS 变量（Design Token） */
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);

  /* ❌ 禁止硬编码 */
  /* color: #333333; */
  /* padding: 16px; */
}
```

---

## 🔍 代码审查清单

- [ ] 所有样式使用嵌套语法
- [ ] 嵌套层级不超过 3-4 层
- [ ] 伪类/伪元素使用 `&` 前缀
- [ ] 状态类名使用 `&.active` 形式
- [ ] 颜色/间距使用 CSS 变量
- [ ] 穿透样式使用 `:deep()` 语法
- [ ] 无重复的父选择器书写

---

## 📚 相关规范

- [Vue 3 Composition API 规范](../frameworks/vue3-composition.md)
- [Design Token 规范](../patterns/design-tokens.md)
- [Element Plus 规范](../libraries/element-plus.md)

---

## 📏 全局样式文件语法规范

### ⚠️ 必须使用标准 CSS 语法

全局样式文件（如 `base.css`、`common.css`、`utilities.css`）必须使用完整的 CSS 语法，包含所有标点符号。

```css
/* ✅ 正确：标准 CSS 语法 */
.mt_16 { margin-top: 16px !important; }
.mb_16 { margin-bottom: 16px !important; }
.w_100 { width: 100% !important; }

/* ❌ 错误：Stylus/SCSS 简写语法 */
.mt_16
  margin-top 16px !important
```

---

## 🛠️ 便捷工具类规范

### 推荐配置完整的工具类体系

项目应在全局样式中配置一套完整的便捷工具类，用于快速处理常见的间距、宽度等样式需求。

### 1. 间距工具类 (Spacing Utilities)

```css
/* margin-left: .ml_1 ~ .ml_100 */
.ml_1 { margin-left: 1px !important; }
.ml_2 { margin-left: 2px !important; }
/* ... */
.ml_16 { margin-left: 16px !important; }
.ml_24 { margin-left: 24px !important; }

/* margin-right: .mr_1 ~ .mr_100 */
.mr_1 { margin-right: 1px !important; }
.mr_8 { margin-right: 8px !important; }
.mr_16 { margin-right: 16px !important; }

/* margin-top: .mt_1 ~ .mt_100 */
.mt_1 { margin-top: 1px !important; }
.mt_8 { margin-top: 8px !important; }
.mt_16 { margin-top: 16px !important; }

/* margin-bottom: .mb_1 ~ .mb_100 */
.mb_1 { margin-bottom: 1px !important; }
.mb_8 { margin-bottom: 8px !important; }
.mb_16 { margin-bottom: 16px !important; }

/* padding-left: .pl_1 ~ .pl_100 */
.pl_1 { padding-left: 1px !important; }
.pl_8 { padding-left: 8px !important; }
.pl_16 { padding-left: 16px !important; }

/* padding-right: .pr_1 ~ .pr_100 */
.pr_1 { padding-right: 1px !important; }
.pr_8 { padding-right: 8px !important; }
.pr_16 { padding-right: 16px !important; }

/* padding-top: .pt_1 ~ .pt_100 */
.pt_1 { padding-top: 1px !important; }
.pt_8 { padding-top: 8px !important; }
.pt_16 { padding-top: 16px !important; }

/* padding-bottom: .pb_1 ~ .pb_100 */
.pb_1 { padding-bottom: 1px !important; }
.pb_8 { padding-bottom: 8px !important; }
.pb_16 { padding-bottom: 16px !important; }
```

### 2. 宽度工具类 (Width Utilities)

```css
/* 百分比宽度 */
.w_100 { width: 100% !important; }
.w_50 { width: 50% !important; }
.w_auto { width: auto !important; }

/* 固定宽度（常用于表单输入框） */
.w_80 { width: 80px !important; }
.w_100px { width: 100px !important; }
.w_120 { width: 120px !important; }
.w_140 { width: 140px !important; }
.w_160 { width: 160px !important; }
.w_180 { width: 180px !important; }
.w_200 { width: 200px !important; }
.w_240 { width: 240px !important; }
.w_260 { width: 260px !important; }
.w_300 { width: 300px !important; }
```

### 3. 使用示例

```vue
<template>
  <!-- 使用工具类快速添加间距 -->
  <div class="flex items-center">
    <span>标签</span>
    <el-tag class="ml_8">状态</el-tag>
    <el-button class="ml_16">操作</el-button>
  </div>
  
  <!-- 特殊宽度需求 -->
  <el-input class="w_180" />
  <el-select class="w_140" />
</template>
```

### 4. 工具类 vs 组件样式

| 场景 | 推荐方式 |
|------|---------|
| 临时微调间距 | 工具类 `.ml_8`、`.mt_16` |
| 组件内统一样式 | 嵌套 CSS `:deep(.el-input) { width: 180px; }` |
| 通用布局间距 | Design Token `var(--spacing-md)` |
| 特定业务样式 | 语义化类名 `.order-amount` |

### ⚠️ 通用样式作用域原则

**核心原则：通用样式必须限定作用域，避免影响 UI 框架内部组件**

Element Plus、Ant Design 等 UI 框架的复合组件（如分页器、日期选择器、级联选择器等）内部会嵌套使用基础组件（input、select 等）。全局样式如果选择器过于宽泛，会破坏这些组件的内部布局。

#### ❌ 错误示例 - 选择器过于宽泛

```css
/* ❌ 会影响分页器、日期选择器等所有内嵌 input 的组件 */
.search-form .el-input {
  width: 180px;
}

/* ❌ 会影响所有页面内的 select，包括级联选择器内部 */
.main_page_scroll .el-select {
  width: 140px;
}
```

#### ✅ 正确示例 - 通过父级容器限定

```css
/* ✅ 只影响表单项内的输入组件，不影响其他复合组件 */
.search-form .el-form-item .el-input,
.search-form .el-form-item .el-select {
  width: 180px;
}

/* ✅ 组件内使用 :deep() 限定作用域 */
.search-form {
  :deep(.el-form-item .el-input) {
    width: 180px;
  }
}
```

#### 选择器设计原则

1. **通过结构限定** - 使用 `.el-form-item` 等父容器限定，而非直接选择基础组件
2. **避免过深嵌套** - 选择器层级控制在 2-3 层
3. **不针对特定组件排除** - 不要用 `:not(.el-pagination ...)` 这种方式，因为你无法枚举所有可能受影响的组件

2. **工具类使用 !important** - 确保工具类能覆盖组件默认样式
3. **命名一致性** - 统一使用 `_` 作为分隔符（如 `ml_16` 而非 `ml-16`）

