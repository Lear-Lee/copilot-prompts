# R4: 质量标准与自检清单

> **文档状态**: 详细设计  
> **关联需求**: R4 - 遵循 MCP 自身的规范要求  
> **创建日期**: 2026-01-09

---

## 1. 概述

### 1.1 目标

本文档定义 MCP 服务器开发的质量标准和自检清单，确保：

- 代码质量符合 TypeScript 严格模式要求
- 错误处理完善、日志规范
- 文档及时更新
- 测试覆盖充分

### 1.2 依据来源

基于以下**现有规范文档**（不重复定义，仅引用）：

| 规范文件 | 路径 | 核心内容 |
|---------|------|---------|
| **copilot-instructions.md** | `.github/copilot-instructions.md` | MCP 强制工作流、代码质量零容忍政策 |
| **typescript-strict.md** | `common/typescript-strict.md` | TypeScript 严格模式规范 |
| **PROJECT_RULES.md** | `docs/PROJECT_RULES.md` | 文件组织、Agent 编写规范 |
| **code-generation.md** | `standards/core/code-generation.md` | 禁止创建文档、注释格式规范 |
| **code-style.md** | `standards/core/code-style.md` | 命名、注释、代码组织 |
| **problem-diagnosis.md** | `standards/workflows/problem-diagnosis.md` | 问题诊断零容忍政策 |

### 1.3 ⚠️ 强制要求

> **本文档是对现有规范的补充和整合，不是替代。**
> 
> 1. **不重复定义**：已有规范中的内容仅引用，不重复编写
> 2. **不修改原规范**：本文档不会更改现有 standards/ 中的任何规范
> 3. **强制继承**：`code-generation.md` 中的规范优先级最高

### 1.4 核心规范继承（来自 code-generation.md）

以下规范**必须严格遵守**，在此强调但不重复内容：

1. **禁止创建 Markdown 文档**：除非用户明确要求
2. **注释格式**：单行用 `//`，文档注释用 `/** */`
3. **去 AI 化注释**：禁止表情符号、过度热情语气
4. **代码注释必要性**：复杂算法、业务规则、边界处理必须注释

详细内容请查看：[standards/core/code-generation.md](../../standards/core/code-generation.md)

---

## 2. TypeScript 严格模式标准

### 2.1 编译器配置要求

```json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "strictBindCallApply": true,
        "strictPropertyInitialization": true,
        "noImplicitThis": true,
        "useUnknownInCatchVariables": true,
        "alwaysStrict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "exactOptionalPropertyTypes": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true
    }
}
```

### 2.2 类型定义检查清单

| 检查项 | 正确示例 | 错误示例 | 说明 |
|--------|---------|---------|------|
| 禁止 any | `unknown` | `any` | 使用 unknown 替代 any |
| 显式返回类型 | `: string` | (无返回类型) | 函数必须声明返回类型 |
| 空值处理 | `value?.prop` | `value.prop` | 可能为 null/undefined 时使用可选链 |
| 类型守卫 | `if (isUser(obj))` | `obj as User` | 优先使用类型守卫而非类型断言 |
| 只读属性 | `readonly id: string` | `id: string` | 不可变数据使用 readonly |

### 2.3 代码示例

#### ✅ 正确做法

```typescript
// 1. 显式类型声明
interface UserInput {
    readonly name: string;
    readonly email: string;
    readonly age?: number;
}

// 2. 返回类型声明
function processUser(input: unknown): UserInput | null {
    // 3. 类型守卫
    if (!isValidUserInput(input)) {
        return null;
    }
    return input;
}

// 4. 类型守卫函数
function isValidUserInput(input: unknown): input is UserInput {
    if (typeof input !== 'object' || input === null) {
        return false;
    }
    
    const obj = input as Record<string, unknown>;
    return (
        typeof obj['name'] === 'string' &&
        typeof obj['email'] === 'string'
    );
}

// 5. 错误处理中使用 unknown
try {
    await riskyOperation();
} catch (error: unknown) {
    const message = error instanceof Error 
        ? error.message 
        : String(error);
    logger.error(message);
}
```

#### ❌ 错误做法

```typescript
// 1. 使用 any
function processData(data: any) {  // ❌
    return data.value;  // 可能运行时错误
}

// 2. 缺少返回类型
function getData() {  // ❌ 缺少返回类型
    return fetchSomething();
}

// 3. 不安全的类型断言
const user = response as User;  // ❌ 应使用类型守卫

// 4. 忽略 null 检查
function getLength(arr: string[] | null) {
    return arr.length;  // ❌ 可能为 null
}
```

---

## 3. 错误处理标准

### 3.1 错误处理原则

| 原则 | 说明 | 示例 |
|------|------|------|
| **捕获所有异常** | 所有可能抛出异常的操作都要 try-catch | 文件读取、网络请求、JSON 解析 |
| **错误分类** | 区分系统错误和业务错误 | SystemError vs BusinessError |
| **上下文信息** | 错误信息包含足够上下文 | 文件路径、参数值、操作类型 |
| **优雅降级** | 非致命错误不中断整体流程 | 单个文件处理失败不影响其他文件 |

### 3.2 错误处理代码模板

```typescript
/**
 * 自定义错误类
 */
export class MCPError extends Error {
    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly context?: Record<string, unknown>
    ) {
        super(message);
        this.name = 'MCPError';
    }
}

export enum ErrorCode {
    FILE_NOT_FOUND = 'FILE_NOT_FOUND',
    PARSE_ERROR = 'PARSE_ERROR',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误处理工具函数
 */
export function handleError(error: unknown, context: string): MCPError {
    if (error instanceof MCPError) {
        return error;
    }
    
    if (error instanceof Error) {
        return new MCPError(
            `${context}: ${error.message}`,
            ErrorCode.UNKNOWN_ERROR,
            { originalError: error.name, stack: error.stack }
        );
    }
    
    return new MCPError(
        `${context}: ${String(error)}`,
        ErrorCode.UNKNOWN_ERROR
    );
}

/**
 * 安全执行包装器
 */
export async function safeExecute<T>(
    fn: () => Promise<T>,
    context: string,
    fallback?: T
): Promise<{ success: true; data: T } | { success: false; error: MCPError }> {
    try {
        const data = await fn();
        return { success: true, data };
    } catch (error: unknown) {
        const mcpError = handleError(error, context);
        logger.error(mcpError.message, mcpError.context);
        
        if (fallback !== undefined) {
            return { success: true, data: fallback };
        }
        
        return { success: false, error: mcpError };
    }
}
```

### 3.3 错误处理检查清单

- [ ] 所有 `fs.readFileSync` / `fs.writeFileSync` 都有 try-catch
- [ ] 所有 `JSON.parse` 都有 try-catch
- [ ] 所有网络请求都有超时和错误处理
- [ ] 错误信息包含操作上下文（文件路径、参数等）
- [ ] 使用 `unknown` 类型捕获错误
- [ ] 非致命错误不终止整体流程

---

## 4. 日志规范

### 4.1 日志级别定义

| 级别 | 使用场景 | 示例 |
|------|---------|------|
| `log` | 正常操作信息 | "正在分析项目...", "发现 5 个模板" |
| `error` | 错误和异常 | "文件读取失败", "解析错误" |
| `debug` | 调试信息（仅开发环境） | 详细的参数、中间状态 |
| `warn` | 警告（非致命问题） | "配置文件缺失，使用默认值" |

### 4.2 日志接口实现

```typescript
/**
 * 日志接口
 */
export interface Logger {
    log(message: string): void;
    error(message: string, context?: Record<string, unknown>): void;
    debug(message: string, context?: Record<string, unknown>): void;
    warn(message: string): void;
}

/**
 * MCP 标准日志实现
 */
export class ConsoleLogger implements Logger {
    private debugMode: boolean;
    
    constructor(debugMode: boolean = false) {
        this.debugMode = debugMode || process.env.DEBUG === 'true';
    }
    
    log(message: string): void {
        console.error(`[MCP] ${message}`);  // MCP 使用 stderr 输出日志
    }
    
    error(message: string, context?: Record<string, unknown>): void {
        const contextStr = context 
            ? ` | ${JSON.stringify(context)}` 
            : '';
        console.error(`[MCP ERROR] ${message}${contextStr}`);
    }
    
    debug(message: string, context?: Record<string, unknown>): void {
        if (!this.debugMode) return;
        
        const contextStr = context 
            ? ` | ${JSON.stringify(context)}` 
            : '';
        console.error(`[MCP DEBUG] ${message}${contextStr}`);
    }
    
    warn(message: string): void {
        console.error(`[MCP WARN] ${message}`);
    }
}
```

### 4.3 日志检查清单

- [ ] 关键操作有日志输出（开始、完成、失败）
- [ ] 错误日志包含上下文信息
- [ ] 调试日志仅在 DEBUG 模式输出
- [ ] 不输出敏感信息（密码、token 等）
- [ ] 日志使用 stderr（不污染 MCP stdout 通信）

---

## 5. 文档标准

### 5.1 必需文档

| 文档类型 | 位置 | 更新时机 |
|---------|------|---------|
| README.md | 根目录 | 重大功能变更时 |
| CHANGELOG.md | docs/development/ | 每次发版前 |
| API 文档 | JSDoc 注释 | 代码变更时同步更新 |
| 工具文档 | docs/guides/ | 新增工具时 |

### 5.2 JSDoc 注释规范

```typescript
/**
 * 分析项目技术栈和特征
 * 
 * @description 扫描项目目录，检测 package.json、配置文件等，
 *              自动识别使用的框架、库和工具
 * 
 * @param projectPath - 项目根目录的绝对路径
 * @param options - 分析选项
 * @param options.deep - 是否深度扫描（包括 node_modules）
 * @param options.timeout - 超时时间（毫秒）
 * 
 * @returns 项目特征对象，包含框架、语言、工具等信息
 * 
 * @throws {MCPError} 当项目路径不存在或不可读时
 * 
 * @example
 * ```typescript
 * const features = await analyzeProject('/path/to/project');
 * console.log(features.frameworks); // ['Vue 3', 'Vite']
 * ```
 * 
 * @since 1.8.0
 */
export async function analyzeProject(
    projectPath: string,
    options?: AnalyzeOptions
): Promise<ProjectFeatures> {
    // ...
}
```

### 5.3 文档检查清单

- [ ] 所有公开函数/类有 JSDoc 注释
- [ ] JSDoc 包含 @param、@returns、@throws
- [ ] 复杂函数有 @example 示例
- [ ] README 链接有效
- [ ] CHANGELOG 记录了本次变更

---

## 6. 代码质量检查清单

### 6.1 每次提交前必检

#### TypeScript 语法
- [ ] `npm run build` 编译通过
- [ ] 没有 TypeScript 错误
- [ ] 没有未使用的变量/导入

#### 代码风格
- [ ] 遵循项目 ESLint 配置
- [ ] 导入语句按规范排序
- [ ] 没有 console.log（使用 logger）

#### 错误处理
- [ ] 所有 try-catch 使用 `unknown` 类型
- [ ] 错误信息有上下文
- [ ] 非致命错误不中断流程

### 6.2 新增功能必检

#### 类型定义
- [ ] 新增接口有完整类型
- [ ] 可选字段明确标注
- [ ] 使用 readonly 保护不可变数据

#### 测试
- [ ] 单元测试覆盖核心逻辑
- [ ] 边界情况有测试
- [ ] 错误场景有测试

#### 文档
- [ ] JSDoc 注释完整
- [ ] 更新 README（如需要）
- [ ] 更新 CHANGELOG

### 6.3 重构代码必检

- [ ] 所有调用点已更新
- [ ] 旧代码已删除（无死代码）
- [ ] 相关测试已更新
- [ ] 接口变更有迁移说明

---

## 7. 自动化检查脚本

### 7.1 预提交检查脚本

```bash
#!/bin/bash
# scripts/pre-commit.sh

set -e

echo "🔍 Running pre-commit checks..."

# 1. TypeScript 编译检查
echo "📦 Building TypeScript..."
npm run build

# 2. ESLint 检查
echo "📝 Running ESLint..."
npm run lint

# 3. 类型检查
echo "🔷 Type checking..."
npm run typecheck

# 4. 测试
echo "🧪 Running tests..."
npm run test

echo "✅ All checks passed!"
```

### 7.2 package.json 脚本配置

```json
{
    "scripts": {
        "build": "tsc",
        "typecheck": "tsc --noEmit",
        "lint": "eslint src/**/*.ts",
        "lint:fix": "eslint src/**/*.ts --fix",
        "test": "vitest run",
        "test:watch": "vitest",
        "precommit": "sh scripts/pre-commit.sh"
    }
}
```

### 7.3 Git Hooks 配置

```json
// .husky/pre-commit
{
    "hooks": {
        "pre-commit": "npm run precommit"
    }
}
```

---

## 8. 代码审查检查清单

### 8.1 代码审查要点

| 类别 | 检查点 | 严重程度 |
|------|-------|---------|
| 类型安全 | 是否使用 any | 🔴 高 |
| 类型安全 | 是否有不安全的类型断言 | 🔴 高 |
| 错误处理 | 是否捕获所有可能的异常 | 🔴 高 |
| 错误处理 | 错误信息是否有上下文 | 🟡 中 |
| 日志 | 关键操作是否有日志 | 🟡 中 |
| 文档 | 公开 API 是否有 JSDoc | 🟡 中 |
| 测试 | 是否有单元测试 | 🟡 中 |
| 性能 | 是否有潜在的性能问题 | 🟢 低 |

### 8.2 PR 模板

```markdown
## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新

## 变更描述
<!-- 简要描述本次变更 -->

## 自检清单
- [ ] TypeScript 编译通过
- [ ] 没有使用 any 类型
- [ ] 错误处理完善
- [ ] 关键操作有日志
- [ ] 公开 API 有 JSDoc
- [ ] 单元测试覆盖
- [ ] 更新了 CHANGELOG

## 测试说明
<!-- 如何测试这些变更 -->
```

---

## 9. 质量标准执行机制

### 9.1 集成到 MCP 工具

在 `get_smart_standards` 返回中包含质量提醒：

```typescript
const qualityReminder = `
## ⚠️ 质量检查提醒

编写代码时请确保：
1. ✅ 使用 TypeScript 严格模式（禁止 any）
2. ✅ 所有异常都有 try-catch 处理
3. ✅ 错误信息包含上下文
4. ✅ 关键操作有日志输出
5. ✅ 公开函数有 JSDoc 注释

完成后运行：\`npm run build && npm run lint\`
`;
```

### 9.2 集成到 copilot-instructions.md

```markdown
## 🚨 代码质量零容忍政策

**每次编辑完成后必须检查：**

1. ✅ TypeScript 编译无错误
2. ✅ 没有使用 `any` 类型
3. ✅ 所有可能抛异常的操作都有 try-catch
4. ✅ 错误使用 `unknown` 类型捕获
5. ✅ 日志使用 logger 而非 console.log
```

---

## 10. 实施步骤

### Step 1: 代码规范强化（0.5天）

1. 更新 tsconfig.json 启用所有严格选项
2. 添加 ESLint 规则
3. 修复现有代码的类型问题

### Step 2: 错误处理统一（0.5天）

1. 创建 MCPError 类和工具函数
2. 替换现有代码中的错误处理
3. 添加 safeExecute 包装器

### Step 3: 日志系统规范化（0.5天）

1. 实现 ConsoleLogger 类
2. 替换现有 console.log/error
3. 添加 DEBUG 模式支持

### Step 4: 自动化检查（0.5天）

1. 添加 pre-commit 脚本
2. 配置 Git Hooks
3. 更新 package.json 脚本

### Step 5: 文档更新（0.5天）

1. 更新 README
2. 添加 CONTRIBUTING.md
3. 创建 PR 模板

---

**文档版本**: v1.0  
**最后更新**: 2026-01-09
