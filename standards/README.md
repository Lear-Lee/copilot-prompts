# 规范目录索引

## 📁 目录结构

```
standards/
├── core/                    # 核心规范（总是包含）
│   ├── code-style.md        # 代码风格规范
│   └── typescript-base.md   # TypeScript 基础
│
├── frameworks/              # 框架规范（按需加载）
│   ├── vue3-composition.md  # Vue 3 Composition API
│   └── pinia.md             # Pinia 状态管理
│
├── libraries/               # 库规范（按需加载）
│   ├── element-plus.md      # Element Plus
│   └── i18n.md              # 国际化
│
└── patterns/                # 设计模式（智能推荐）
    ├── api-layer.md         # API 层设计
    └── component-design.md  # 组件设计模式
```

## 🎯 规范分类

### Core (核心规范)
始终包含的基础规范

| 文件 | 大小 | 说明 |
|------|------|------|
| code-style.md | ~2KB | 命名、注释、代码组织 |
| typescript-base.md | ~3KB | TS 基础类型、函数、泛型 |

### Frameworks (框架规范)
根据项目框架按需加载

| 文件 | 技术栈 | 触发条件 |
|------|--------|----------|
| vue3-composition.md | Vue 3 | import vue |
| pinia.md | Pinia | import pinia |

### Libraries (库规范)
根据使用的库按需加载

| 文件 | 库名称 | 触发条件 |
|------|--------|----------|
| element-plus.md | Element Plus | import element-plus |
| i18n.md | Vue I18n | import vue-i18n |

### Patterns (设计模式)
根据任务类型智能推荐

| 文件 | 场景 | 触发词 |
|------|------|--------|
| api-layer.md | API 调用 | API, axios, request |
| component-design.md | 组件设计 | component, props, emit |

## 🔧 使用示例

### 场景 1: 创建 Vue 3 组件
**加载规范:**
- core/code-style.md
- core/typescript-base.md
- frameworks/vue3-composition.md
- patterns/component-design.md

**预计 Token:** ~8KB (vs 传统 20KB)

### 场景 2: Pinia Store
**加载规范:**
- core/typescript-base.md
- frameworks/vue3-composition.md
- frameworks/pinia.md

**预计 Token:** ~6KB (vs 传统 20KB)

### 场景 3: Element Plus 表单
**加载规范:**
- core/code-style.md
- frameworks/vue3-composition.md
- libraries/element-plus.md
- libraries/i18n.md

**预计 Token:** ~9KB (vs 传统 20KB)

## 📊 Token 节省对比

| 传统方式 | MCP 方案 | 节省 |
|---------|---------|------|
| 20KB (全量) | 6-10KB (按需) | 50-70% |

## 🎨 匹配规则

```typescript
// 规范匹配配置
export const standardsMapping = {
  // 框架检测
  frameworks: {
    vue3: {
      imports: ['vue', '@vue'],
      files: ['.vue'],
      standards: ['vue3-composition']
    },
    pinia: {
      imports: ['pinia'],
      standards: ['pinia']
    }
  },
  
  // 库检测
  libraries: {
    'element-plus': {
      imports: ['element-plus'],
      standards: ['element-plus']
    },
    'vue-i18n': {
      imports: ['vue-i18n'],
      standards: ['i18n']
    }
  },
  
  // 模式检测
  patterns: {
    api: {
      keywords: ['api', 'axios', 'request', 'fetch'],
      standards: ['api-layer']
    },
    component: {
      keywords: ['component', 'props', 'emit'],
      standards: ['component-design']
    }
  }
}
```
