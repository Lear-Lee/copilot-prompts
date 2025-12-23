# 规范强制执行方案设计

## 问题分析

当前问题：
1. ⚠️ `copilot-instructions.md` 中的"强制工作流"只是文档，AI不会真正执行
2. ⚠️ MCP工具调用是可选的，AI可以选择忽略
3. ⚠️ 没有机制在代码生成前自动验证是否加载了规范

## 核心设计理念

**不能依赖AI的"自觉性"，需要技术手段强制执行**

## 解决方案：三层防护

### 第一层：提示词前置检查（Prompt-Level）

在 `copilot-instructions.md` 最开头添加：

```markdown
# ⚠️ 强制执行检查点

在执行**任何**代码生成、修改、创建文件操作前，必须：

1. 检查当前项目路径是否匹配此配置的作用域
2. 如果匹配，则：
   - 对于 .vue 文件 → 必须调用 `get_smart_standards` 或 `use_preset`
   - 对于 .ts 文件 → 必须调用 `get_smart_standards` 或 `use_preset`
   - 对于其他文件 → 根据文件类型调用相应工具

3. 如果没有调用MCP工具加载规范，**不得进行任何代码生成**
4. 必须在响应中明确说明"已加载规范: [工具名称]"

**违反此规则的任何输出都是无效的。**
```

### 第二层：MCP工具智能提醒（Tool-Level）

创建一个新的MCP工具 `validate_workflow`，在每次重要操作前调用：

```typescript
{
  name: 'validate_workflow',
  description: '✅ 验证工作流是否正确。在生成代码前检查是否已加载规范。返回是否可以继续操作。',
  inputSchema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['create_file', 'edit_file', 'multi_edit'],
        description: '即将执行的操作类型'
      },
      fileType: {
        type: 'string',
        description: '文件类型（如 vue, ts, tsx）'
      },
      hasLoadedStandards: {
        type: 'boolean',
        description: 'AI自我声明是否已加载规范'
      }
    },
    required: ['operation', 'fileType', 'hasLoadedStandards']
  }
}
```

### 第三层：代码验证器增强（Validation-Level）

在现有的 `CodeValidator` 中添加：

```typescript
class WorkflowValidator {
  private standardsLoaded = new Set<string>();
  
  // 记录已加载的规范
  recordStandardsLoad(toolName: string, context: any) {
    this.standardsLoaded.add(`${toolName}:${Date.now()}`);
  }
  
  // 验证操作前是否加载规范
  validateBeforeOperation(operation: string, fileType: string): {
    valid: boolean;
    message: string;
  } {
    if (this.standardsLoaded.size === 0) {
      return {
        valid: false,
        message: `❌ 错误：尝试${operation}但未加载规范。请先调用 get_smart_standards 或 use_preset`
      };
    }
    return { valid: true, message: '✅ 工作流验证通过' };
  }
}
```

## 实施步骤

### Step 1: 修改 copilot-instructions.md 模板

文件：`mcp-server/src/tools/generateConfig.ts`

在生成的配置文件最开头添加强制检查点。

### Step 2: 创建 validate_workflow 工具

文件：`mcp-server/src/tools/validateWorkflow.ts`

实现工作流验证逻辑。

### Step 3: 修改 get_smart_standards 工具

在调用成功后返回特殊标记，让AI知道规范已加载。

### Step 4: 更新 index.ts

注册新工具，建立工具间的协作机制。

## 预期效果

1. **AI会被提示词强制要求**先调用MCP工具
2. **MCP工具会返回明确的执行状态**
3. **代码验证器会双重检查**操作合法性

## 局限性

⚠️ 完全依赖AI遵守提示词仍有风险，但三层防护可以显著降低违规概率。

最终方案：结合提示词工程、工具设计、验证机制，形成闭环。
