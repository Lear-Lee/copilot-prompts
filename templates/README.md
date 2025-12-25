# 📦 项目模板代码库

> 预置的可复用代码模板，支持快速生成项目基础设施

---

## 🤖 Agent 使用指令

当用户说出以下类似指令时，Agent 应按照本文档规范执行：

**触发指令示例**：
- "将 axios 模板应用到 ht-manage 项目"
- "把 api-layer 模板复制到 VitaSage"
- "给 xx 项目配置 API 层"
- "应用 vue/api-layer 模板"

**Agent 执行流程**：

1. **识别模板** - 根据关键词匹配模板：
   | 关键词 | 对应模板 |
   |--------|----------|
   | axios / api / api-layer / 请求封装 | `vue/api-layer` |
   | types / 类型 | `common/types` |

2. **确定目标路径** - 根据项目和模板类型：
   | 模板 | 目标路径 |
   |------|----------|
   | `vue/api-layer` | `{项目}/src/api/` |
   | `common/types` | `{项目}/src/types/` |

3. **复制文件** - 将模板目录下的文件（排除 `_CONFIG.md`）复制到目标路径

4. **提示配置** - 告知用户需要根据 `_CONFIG.md` 调整的配置项：
   - UI 框架适配（showMessage）
   - 后端响应格式适配
   - Token 传递方式
   - 环境变量配置

**执行示例**：

```
用户: 将 axios 模板应用到 ht-manage 项目

Agent 执行:
1. 模板路径: /Users/pailasi/Work/copilot-prompts/templates/vue/api-layer/
2. 目标路径: /Users/pailasi/Work/ht-manage/src/api/
3. 复制文件:
   - request.ts
   - types.ts
   - index.ts
   - mock/index.ts
   - modules/index.ts
   - modules/_template.ts
4. 提示用户按 _CONFIG.md 配置
```

---

## 目录结构

```
templates/
├── README.md                 # 本文件（含 Agent 指令）
├── vue/                      # Vue 项目模板
│   ├── api-layer/            # API 层封装（axios + mock）✅
│   ├── composables/          # 通用 Composables（预留）
│   ├── components/           # 通用组件模板（预留）
│   └── stores/               # 状态管理模板（预留）
├── flutter/                  # Flutter 项目模板（预留）
│   ├── api-layer/
│   └── themes/
├── react/                    # React 项目模板（预留）
└── common/                   # 跨框架通用模板
    └── types/                # TypeScript 类型定义 ✅
```

---

## 🎯 手动使用方式

1. 进入对应模板目录
2. 复制需要的文件到项目中
3. 根据 `_CONFIG.md` 文件说明进行配置

---

## 📋 可用模板

### Vue 项目

| 模板 | 关键词 | 说明 | 状态 |
|------|--------|------|------|
| `vue/api-layer` | axios, api, 请求封装 | Axios + Mock 完整封装 | ✅ 可用 |
| `vue/composables` | composable, hook | 通用 Composables | 🚧 计划中 |
| `vue/components` | component, 组件 | 基础组件模板 | 🚧 计划中 |
| `vue/stores` | pinia, store, 状态 | Pinia Store 模板 | 🚧 计划中 |

### Flutter 项目

| 模板 | 关键词 | 说明 | 状态 |
|------|--------|------|------|
| `flutter/api-layer` | dio, api | Dio + 状态管理封装 | 🚧 计划中 |
| `flutter/themes` | theme, token | Design Token 系统 | 🚧 计划中 |

### 通用模板

| 模板 | 关键词 | 说明 | 状态 |
|------|--------|------|------|
| `common/types` | types, 类型 | TypeScript 通用类型 | ✅ 可用 |

---

## 🔧 模板规范

每个模板目录必须包含：

1. **`_CONFIG.md`** - 配置说明文件
   - 模板用途
   - 依赖要求
   - 配置项说明
   - 适配指南

2. **源代码文件** - 可直接复制使用的代码
   - 保持通用性，不含业务逻辑
   - 标注自定义点（使用 `💡` 或 `TODO` 注释）
   - 支持多种配置方案

---

## 🚀 扩展模板

添加新模板时：

1. 在对应框架目录下创建模板文件夹
2. 编写 `_CONFIG.md` 配置说明
3. 添加代码文件，确保通用性
4. 更新本 README 的模板列表
5. 如有相关规范文档，在 `standards/patterns/` 中添加

---

**维护者**: MTA工作室  
**创建日期**: 2025-12-25  
**版本**: v1.0
