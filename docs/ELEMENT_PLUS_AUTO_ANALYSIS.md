# Element Plus 自动配置分析工具设计

> 自动扫描项目中的 Vue 文件，提取 Element Plus 使用习惯并生成配置文件

---

## 🎯 功能目标

输入项目路径，自动输出该项目的 Element Plus 使用配置 JSON 文件。

## 📊 分析维度

### 1. 表格 (el-table)

**扫描目标**:
```vue
<el-table border highlight-current-row v-loading="loading">
```

**统计项**:
- `border` 属性出现频率
- `stripe` 属性出现频率
- `highlight-current-row` 属性出现频率
- `v-loading` 使用频率及变量名规律
- 序号列宽度分布
- 操作列宽度分布

**生成配置**:
```json
{
  "table": {
    "border": { "required": true, "frequency": 95 },
    "highlight-current-row": { "required": true, "frequency": 88 }
  }
}
```

---

### 2. 按钮 (el-button)

**扫描目标**:
```vue
<el-button link type="primary">编辑</el-button>
```

**统计项**:
- 操作列按钮是否使用 `link` 属性
- 按钮 `type` 分布（primary/danger/default）
- 是否有自定义 class（如 `del_btn`）
- Loading 属性使用情况

**生成配置**:
```json
{
  "button": {
    "operationColumn": {
      "style": "link",
      "frequency": 90
    }
  }
}
```

---

### 3. 弹窗 (el-dialog)

**扫描目标**:
```vue
<el-dialog destroy-on-close width="600px">
```

**统计项**:
- `destroy-on-close` 使用频率
- `width` 值分布统计
- 标题是否动态（含三元运算符）
- Footer 结构模式

**生成配置**:
```json
{
  "dialog": {
    "destroy-on-close": { "required": true, "frequency": 92 },
    "widths": {
      "simple": "400px",
      "standard": "600px"
    }
  }
}
```

---

### 4. 表单 (el-form)

**扫描目标**:
```vue
<el-form label-position="top">
```

**统计项**:
- `label-position` 值分布（top/right/left）
- `label-width` 常用值

**生成配置**:
```json
{
  "form": {
    "label-position": {
      "default": "top",
      "frequency": 75
    }
  }
}
```

---

### 5. 反馈组件

**扫描目标**:
```typescript
ElMessage.success($t('成功'))
ElMessage({ type: 'success', message: '成功' })
```

**统计项**:
- 方法形式 vs 对象形式比例
- 是否使用国际化函数

**生成配置**:
```json
{
  "message": {
    "preferredStyle": "method",
    "frequency": 88
  }
}
```

---

### 6. 国际化

**扫描目标**:
```vue
:label="$t('名称')"
```

**统计项**:
- `$t()` 使用率
- 硬编码文本出现率
- 国际化函数名称

**生成配置**:
```json
{
  "i18n": {
    "required": true,
    "frequency": 100,
    "function": "$t"
  }
}
```

---

## 🛠️ 实现方案

### 方案 1: MCP Tool 实现（推荐）

在 MCP 服务器中添加新工具：

```typescript
// mcp-server/src/tools/analyze-element-plus.ts

import { glob } from 'glob'
import { readFile } from 'fs/promises'
import { parse } from '@vue/compiler-sfc'

interface AnalysisResult {
  configId: string
  name: string
  analyzedFrom: string
  analyzedAt: string
  rules: Record<string, any>
}

export async function analyzeElementPlusUsage(
  projectPath: string,
  outputConfigId?: string
): Promise<AnalysisResult> {
  
  // 1. 扫描所有 .vue 文件
  const vueFiles = await glob(`${projectPath}/**/*.vue`, {
    ignore: ['**/node_modules/**', '**/dist/**']
  })
  
  // 2. 解析每个文件
  const stats = {
    table: { border: 0, stripe: 0, highlight: 0, total: 0 },
    button: { link: 0, solid: 0, total: 0 },
    dialog: { destroyOnClose: 0, total: 0, widths: [] },
    form: { labelPositions: [], total: 0 },
    message: { method: 0, object: 0 },
    i18n: { hasTFunc: 0, hardcoded: 0, total: 0 }
  }
  
  for (const file of vueFiles) {
    const content = await readFile(file, 'utf-8')
    const { descriptor } = parse(content)
    
    // 分析模板
    if (descriptor.template) {
      analyzeTemplate(descriptor.template.content, stats)
    }
    
    // 分析脚本
    if (descriptor.script || descriptor.scriptSetup) {
      analyzeScript(descriptor.script?.content || descriptor.scriptSetup?.content || '', stats)
    }
  }
  
  // 3. 计算频率并生成配置
  return generateConfig(stats, projectPath, outputConfigId)
}

function analyzeTemplate(template: string, stats: any) {
  // 正则匹配 el-table 标签
  const tableMatches = template.matchAll(/<el-table([^>]*)>/g)
  for (const match of tableMatches) {
    stats.table.total++
    const attrs = match[1]
    if (attrs.includes('border')) stats.table.border++
    if (attrs.includes('stripe')) stats.table.stripe++
    if (attrs.includes('highlight-current-row')) stats.table.highlight++
  }
  
  // 匹配 el-button
  const buttonMatches = template.matchAll(/<el-button([^>]*)>/g)
  for (const match of buttonMatches) {
    stats.button.total++
    const attrs = match[1]
    if (attrs.includes('link')) stats.button.link++
    else stats.button.solid++
  }
  
  // 匹配 el-dialog
  const dialogMatches = template.matchAll(/<el-dialog([^>]*)>/g)
  for (const match of dialogMatches) {
    stats.dialog.total++
    const attrs = match[1]
    if (attrs.includes('destroy-on-close')) stats.dialog.destroyOnClose++
    
    // 提取宽度
    const widthMatch = attrs.match(/width="([^"]+)"/)
    if (widthMatch) stats.dialog.widths.push(widthMatch[1])
  }
  
  // 匹配 el-form
  const formMatches = template.matchAll(/<el-form([^>]*)>/g)
  for (const match of formMatches) {
    stats.form.total++
    const attrs = match[1]
    const posMatch = attrs.match(/label-position="([^"]+)"/)
    if (posMatch) stats.form.labelPositions.push(posMatch[1])
  }
  
  // 检测国际化
  const tFuncMatches = template.match(/\$t\(/g)
  const hardcodedTexts = template.match(/>[\u4e00-\u9fa5]+</g)
  stats.i18n.total++
  if (tFuncMatches) stats.i18n.hasTFunc++
  if (hardcodedTexts) stats.i18n.hardcoded++
}

function analyzeScript(script: string, stats: any) {
  // 分析 ElMessage 使用
  const methodStyle = script.match(/ElMessage\.(success|error|warning|info)/g)
  const objectStyle = script.match(/ElMessage\(\{/g)
  
  if (methodStyle) stats.message.method += methodStyle.length
  if (objectStyle) stats.message.object += objectStyle.length
}

function generateConfig(stats: any, projectPath: string, configId?: string): AnalysisResult {
  const id = configId || `custom-${Date.now()}`
  
  return {
    configId: id,
    name: `${id} 配置`,
    analyzedFrom: projectPath,
    analyzedAt: new Date().toISOString().split('T')[0],
    rules: {
      table: {
        border: {
          required: stats.table.border / stats.table.total > 0.8,
          frequency: Math.round((stats.table.border / stats.table.total) * 100)
        },
        'highlight-current-row': {
          required: stats.table.highlight / stats.table.total > 0.8,
          frequency: Math.round((stats.table.highlight / stats.table.total) * 100)
        }
      },
      button: {
        operationColumn: {
          style: stats.button.link > stats.button.solid ? 'link' : 'solid',
          frequency: Math.round((stats.button.link / stats.button.total) * 100)
        }
      },
      dialog: {
        'destroy-on-close': {
          required: stats.dialog.destroyOnClose / stats.dialog.total > 0.8,
          frequency: Math.round((stats.dialog.destroyOnClose / stats.dialog.total) * 100)
        },
        widths: calculateCommonWidths(stats.dialog.widths)
      },
      form: {
        'label-position': {
          default: getMostCommon(stats.form.labelPositions) || 'right',
          frequency: Math.round((getMostCommonCount(stats.form.labelPositions) / stats.form.total) * 100)
        }
      },
      message: {
        preferredStyle: stats.message.method > stats.message.object ? 'method' : 'object',
        frequency: Math.round((stats.message.method / (stats.message.method + stats.message.object)) * 100)
      },
      i18n: {
        required: stats.i18n.hasTFunc / stats.i18n.total > 0.8,
        frequency: Math.round((stats.i18n.hasTFunc / stats.i18n.total) * 100),
        function: '$t'
      }
    }
  }
}

// 辅助函数
function getMostCommon(arr: string[]): string | null {
  const counts: Record<string, number> = {}
  arr.forEach(item => counts[item] = (counts[item] || 0) + 1)
  return Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || null
}

function getMostCommonCount(arr: string[]): number {
  const mostCommon = getMostCommon(arr)
  return mostCommon ? arr.filter(x => x === mostCommon).length : 0
}

function calculateCommonWidths(widths: string[]): Record<string, string> {
  const counts: Record<string, number> = {}
  widths.forEach(w => counts[w] = (counts[w] || 0) + 1)
  
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  
  return {
    simple: sorted[0]?.[0] || '400px',
    standard: sorted[1]?.[0] || '600px',
    complex: sorted[2]?.[0] || '800px'
  }
}
```

---

### 方案 2: 独立脚本实现

创建独立的 Node.js 脚本：

```bash
# 安装依赖
npm install -D @vue/compiler-sfc glob

# 运行分析
node scripts/analyze-element-plus.js --project /path/to/project --output my-config
```

---

## 🔧 MCP Tool 注册

在 MCP 服务器的 tools list 中添加：

```typescript
{
  name: 'analyze_element_plus_usage',
  description: '分析项目中 Element Plus 的使用习惯并生成配置文件',
  inputSchema: {
    type: 'object',
    properties: {
      projectPath: {
        type: 'string',
        description: '项目的绝对路径'
      },
      outputConfigId: {
        type: 'string',
        description: '配置 ID（可选，默认自动生成）'
      }
    },
    required: ['projectPath']
  }
}
```

---

## 📖 使用示例

### 通过 MCP Tool

```typescript
// 在 Copilot Chat 中
analyze_element_plus_usage({
  projectPath: '/Users/xxx/my-company-project',
  outputConfigId: 'my-company'
})

// 输出
{
  success: true,
  configPath: 'copilot-prompts/standards/libraries/configs/element-plus-my-company.json',
  summary: {
    totalFiles: 45,
    table: { border: '95%', highlight: '88%' },
    button: { link: '90%' },
    i18n: { coverage: '100%' }
  }
}
```

### 生成的配置文件

```json
{
  "configId": "my-company",
  "name": "我司标准配置",
  "analyzedFrom": "/Users/xxx/my-company-project",
  "analyzedAt": "2025-12-16",
  "rules": {
    "table": {
      "border": { "required": true, "frequency": 95 },
      "highlight-current-row": { "required": true, "frequency": 88 }
    },
    "button": {
      "operationColumn": { "style": "link", "frequency": 90 }
    }
    // ... 更多规则
  }
}
```

---

## 🚀 后续优化

1. **增加更多组件分析**: Tree、Tabs、Cascader 等
2. **支持样式分析**: 提取常用的 class 名称和样式模式
3. **生成代码模板**: 基于配置自动生成 CRUD 模板
4. **配置对比工具**: 比较两个配置的差异
5. **配置合并工具**: 合并多个项目的配置

---

**状态**: 设计完成，待实现  
**优先级**: P2（可选功能）  
**维护团队**: MTA团队（蘑菇与吐司的AI团队）  
**更新时间**: 2025-12-16
