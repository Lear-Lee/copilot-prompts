# Element Plus 配置方案使用指南

> 如何在不同项目中使用不同的 Element Plus 开发习惯

---

## 🎯 使用场景

### 场景 1: 新项目使用标准配置

```markdown
<!-- .github/copilot-instructions.md -->

## Element Plus 配置方案

使用方案: **standard**
```

AI 将按照 Element Plus 官方推荐的标准方式生成代码。

---

### 场景 2: 使用 VitaSage 配置

```markdown
<!-- .github/copilot-instructions.md -->

## Element Plus 配置方案

使用方案: **vitasage**

配置特点：
- 强制国际化
- 统一表格边框和高亮
- link 样式操作按钮
```

AI 将严格按照 VitaSage 团队习惯生成代码。

---

### 场景 3: 自动生成项目专属配置

#### 步骤 1: 分析项目生成配置

在 Copilot Chat 中执行：

```
请使用 MCP 工具分析我的项目并生成 Element Plus 配置：

项目路径: /Users/xxx/my-company-project
配置 ID: my-company
```

AI 会调用工具分析项目中的 `.vue` 文件，提取 Element Plus 使用模式。

#### 步骤 2: 生成配置文件

```json
// copilot-prompts/standards/libraries/configs/element-plus-my-company.json
{
  "configId": "my-company",
  "name": "我司标准配置",
  "analyzedFrom": "/Users/xxx/my-company-project",
  "rules": {
    "table": {
      "border": { "required": true, "frequency": 88 },
      // ... 基于实际分析的配置
    }
  }
}
```

#### 步骤 3: 在项目中使用

```markdown
<!-- .github/copilot-instructions.md -->

## Element Plus 配置方案

使用方案: **my-company**
```

---

## 🔧 配置切换方法

### 方法 1: 项目级配置（推荐）

在项目的 `.github/copilot-instructions.md` 中声明：

```markdown
## Element Plus 配置方案

使用方案: **vitasage**
```

**优点**: 一次配置，整个项目自动应用  
**缺点**: 需要重启 VS Code 生效

---

### 方法 2: 对话级配置

在 Copilot Chat 中手动指定：

```
请按照 vitasage 配置方案生成一个用户列表表格
```

或使用 MCP 工具：

```typescript
get_relevant_standards({ 
  imports: ["element-plus"],
  config: "vitasage"
})
```

**优点**: 灵活切换，无需重启  
**缺点**: 每次对话都要说明

---

### 方法 3: 混合使用

项目默认使用标准配置，特定文件使用自定义配置：

```vue
<!-- 在文件顶部注释说明 -->
<!--
  Element Plus 配置: vitasage
  说明: 本模块使用严格国际化和统一表格样式
-->

<template>
  <!-- 代码会按照 vitasage 配置生成 -->
</template>
```

---

## 📊 配置对比实例

### 生成一个用户列表表格

#### 使用标准配置

```vue
<el-table :data="users" stripe>
  <el-table-column prop="name" label="Name" />
  <el-table-column label="Actions">
    <template #default>
      <el-button type="primary" size="small">Edit</el-button>
    </template>
  </el-table-column>
</el-table>
```

#### 使用 VitaSage 配置

```vue
<el-table 
  v-loading="listLoading" 
  :data="users" 
  border 
  highlight-current-row
>
  <el-table-column type="index" :label="$t('序号')" width="70" />
  <el-table-column prop="name" :label="$t('姓名')" min-width="120" />
  <el-table-column fixed="right" :label="$t('操作')" width="200">
    <template #default="scope">
      <el-button link type="primary" @click="edit(scope.row)">
        {{ $t('编辑') }}
      </el-button>
    </template>
  </el-table-column>
</el-table>
```

**区别总结**：
| 特性 | 标准配置 | VitaSage 配置 |
|-----|---------|--------------|
| 边框 | 无，使用 stripe | border 必须 |
| Loading | 可选 | v-loading 必须 |
| 序号列 | 无 | type="index" 必须 |
| 操作按钮 | 实心按钮 | link 按钮 |
| 国际化 | 直接文本 | $t() 强制 |
| 列宽 | 自适应 | 严格规范 |

---

## 🚀 最佳实践

### 团队协作项目

1. **统一配置**: 团队约定使用同一配置方案
2. **项目声明**: 在 `.github/copilot-instructions.md` 中明确声明
3. **文档说明**: 在 README 中注明使用的配置方案

### 多项目维护

1. **不同项目使用不同配置**: 每个项目独立声明
2. **共享通用配置**: 公司级配置可以在多个项目间复用
3. **定期更新**: 根据团队习惯演变更新配置文件

### 新人入职

1. **阅读配置文件**: 了解团队代码风格
2. **查看示例**: 参考配置文件中的代码示例
3. **自动生成**: AI 会自动按照配置生成符合规范的代码

---

## 🔍 配置验证

生成代码后，检查是否符合配置要求：

### VitaSage 配置检查清单

- [ ] 表格是否有 `border` 属性
- [ ] 表格是否有 `highlight-current-row` 属性
- [ ] 是否使用 `v-loading="listLoading"`
- [ ] 操作列按钮是否使用 `link` 属性
- [ ] 所有文本是否使用 `$t()` 国际化
- [ ] 序号列宽度是否为 `70`
- [ ] 操作列是否 `fixed="right"`

---

## 📞 故障排除

### Q: 配置没有生效？

**A**: 
1. 检查 `.github/copilot-instructions.md` 是否正确声明
2. 重启 VS Code 窗口
3. 在对话中明确提示使用某配置

### Q: 如何知道当前使用哪个配置？

**A**: 
1. 查看项目的 `.github/copilot-instructions.md`
2. 询问 Copilot: "当前项目使用的 Element Plus 配置是什么？"

### Q: 配置冲突怎么办？

**A**: 
优先级顺序：
1. 对话中明确指定的配置
2. `.github/copilot-instructions.md` 声明的配置
3. 标准配置（默认）

---

**维护团队**: MTA团队（蘑菇与吐司的AI团队）  
**更新时间**: 2025-12-16
