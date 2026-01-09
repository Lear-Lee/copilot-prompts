# MCP v2.0 需求分析与实施计划

> **文档状态**: 需求分析  
> **创建日期**: 2026-01-09  
> **负责人**: AI Assistant  
> **优先级**: 高  
> **质量要求**: 追求细节，完美实现

---

## 📋 目录

1. [需求总览](#1-需求总览)
2. [现状分析](#2-现状分析)
3. [需求拆解](#3-需求拆解)
4. [实施计划](#4-实施计划)
5. [质量保障](#5-质量保障)
6. [相关文档](#6-相关文档)

---

## 1. 需求总览

### 1.1 核心定位

> **⚠️ 关键理念**：MCP 是 AI 的**信息提供者**，而非**决策替代者**

```
┌──────────────────────────────────────────────────────────────┐
│                         AI (决策者)                           │
│  - 理解用户意图                                               │
│  - 分析代码上下文                                             │
│  - 决定需要什么规范                                           │
│  - 调用 MCP 获取信息                                          │
└──────────────────────────┬───────────────────────────────────┘
                           │ 调用
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    MCP (信息提供者)                           │
│  ✅ 快速返回项目特征                                          │
│  ✅ 按需加载规范内容                                          │
│  ✅ 提供精简/完整多种模式                                      │
│  ✅ 预设场景快速获取                                          │
│  ❌ 不做复杂的意图分析（AI会做）                               │
│  ❌ 不做权重计算决策（AI会判断）                               │
└──────────────────────────────────────────────────────────────┘
```

**MCP 应该做的**：
- 提供项目信息（框架、依赖、配置）
- 按需返回规范内容（摘要/关键规则/完整）
- 预设场景快速调用
- 减少 AI 需要读取的文件数量

**MCP 不应该做的**：
- 复杂的用户意图分析（AI 本身就擅长）
- 权重计算和规范排序（AI 自己会判断）
- 替代 AI 做匹配决策

### 1.2 核心诉求

用户提出了 **4 个核心需求**，需要高质量实现：

| 序号 | 需求 | 核心目标 | 实现方式 |
|------|------|---------|---------|
| **R1** | 检测项目、匹配规范的算法 | 更准确的项目特征识别 | 提供更丰富的项目信息给 AI |
| **R2** | 精确匹配用户需求的规范 | 减少无关规范加载 | 提供多种加载模式，让 AI 选择 |
| **R3** | 模板生成功能打包到 npm | 模块化设计 | 可扩展的模板注册机制 |
| **R4** | 遵循 MCP 自身规范要求 | 保证质量 | 严格遵循项目规范 |

### 1.3 质量要求

> **用户原话**："一定要追究到细节，完美实现我的诉求，切记不可图快、走捷径"

**具体要求**：
- ✅ 仔细分析每个需求的细节
- ✅ 完整理解现有代码逻辑
- ✅ 设计可扩展的架构
- ✅ 保证代码质量和类型安全
- ✅ 遵循 copilot-instructions.md 中的所有规范
- ✅ **简洁高效**：MCP 只提供信息，不做 AI 能做的事

### 1.4 ⚠️ 兼容性原则（强制）

> **核心原则**：增强而非替代，扩展而非重写

| 原则 | 说明 | 示例 |
|------|------|------|
| **不破坏现有功能** | 所有现有 MCP 工具必须正常工作 | `use_preset` 8 个预设不变 |
| **不修改底层规范** | `standards/` 目录结构和内容不变 | 规范文件不重命名、不删除 |
| **类型向后兼容** | 扩展接口而非替换接口 | `ProjectFeaturesExtended extends ProjectFeatures` |
| **配置文件兼容** | 同时支持新旧配置格式 | `_template.json` 和 `_CONFIG.md` 都支持 |
| **引用不重复** | 现有规范只引用，不重复编写 | R4 引用 `code-generation.md` 而非复制内容 |

**必须保留的核心文件**：
- `mcp-server/src/core/types.ts` - 基础类型定义
- `mcp-server/src/core/standardsManager.ts` - 规范管理
- `mcp-server/src/tools/usePreset.ts` - 预设场景
- `standards/core/*.md` - 核心规范
- `templates/README.md` - 模板使用说明

### 1.4 预期成果

1. **算法优化**：项目检测准确率提升至 95%+
2. **规范匹配**：根据上下文精准推荐，减少无关规范加载
3. **模板系统**：可扩展的模板注册机制，支持自定义模板
4. **质量保障**：完善的测试覆盖和文档

---

## 2. 现状分析

### 2.1 项目检测算法现状

**当前实现位置**：`mcp-server/src/core/smartAgentMatcher.ts`

**现有检测逻辑**：

```typescript
// 1. 检测 Flutter 项目（优先）
// 2. 分析 package.json（前端/后端框架、工具、语言）
// 3. 分析文件结构（扫描文件扩展名和目录名）
// 4. 推断项目类型
```

**检测范围**：

| 类别 | 检测项 | 覆盖程度 |
|------|-------|---------|
| 前端框架 | Vue, React, Angular, Next, Nuxt, Svelte 等 | ✅ 完善 |
| 后端框架 | Express, Koa, Fastify, NestJS 等 | ✅ 完善 |
| 构建工具 | Vite, Webpack, Rollup 等 | ✅ 完善 |
| UI 组件库 | Element Plus, Ant Design, MUI 等 | ✅ 完善 |
| 语言 | TypeScript, Python, Java, Go 等 | ⚠️ 基础 |
| 项目特征 | i18n, state-management, routing 等 | ⚠️ 基础 |

**现存问题**：

1. **关键词检测不够深入**：仅检测依赖名称，未分析代码内容
2. **Flutter 项目仅检测 pubspec.yaml**：未分析具体使用的包
3. **文件结构扫描效率**：使用 glob 扫描，大项目可能较慢
4. **缺少场景检测**：未根据当前操作场景（如"创建表单"）动态匹配
5. **缺少权重调优**：权重值硬编码，无法根据实际效果调整

### 2.2 规范匹配算法现状

**当前实现**：

```typescript
// calculateMatchScore 计算匹配分数
const WEIGHTS = {
    framework: 10,
    tool: 8,
    language: 5,
    keyword: 3,
    tag: 2
};
```

**匹配逻辑**：
1. 遍历项目特征（frameworks, tools, languages, keywords）
2. 与 Agent 的 applicableWhen 配置对比
3. 计算加权分数
4. 按分数排序返回

**现存问题**：

1. **静态匹配**：不考虑用户当前操作意图
2. **粗粒度**：只匹配 Agent，不匹配具体规范条目
3. **缺少上下文**：不分析当前文件内容和导入
4. **权重固定**：无法根据场景动态调整权重

### 2.3 规范管理现状

**当前实现位置**：`mcp-server/src/core/standardsManager.ts`

**规范结构**：

```
standards/
├── core/           # 核心规范（必加载）
├── frameworks/     # 框架规范
├── libraries/      # 库规范
├── patterns/       # 设计模式
└── workflows/      # 工作流规范
```

**加载策略**：

| 工具 | 策略 | Token 消耗 |
|------|------|-----------|
| `get_relevant_standards` | 完整加载 | ~15000 |
| `get_compact_standards` | 精简加载（key-rules） | ~2000 |
| `get_smart_standards` | 智能推荐 | ~2000 |
| `use_preset` | 预设场景 | ~500 |

**现存问题**：

1. **场景检测为空**：`scenarioDetector.ts` 文件为空
2. **预设场景有限**：只有 8 个预设
3. **缺少上下文分析**：未分析用户当前操作的文件内容

### 2.4 模板系统现状

**当前实现位置**：`templates/` 目录

**现有模板**：

```
templates/
├── vue/
│   └── api-layer/    # API 层封装
├── common/
│   └── types/        # 通用类型定义
└── copilot-instructions-mcp-optimized.md  # 配置模板
```

**现存问题**：

1. **无自动加载机制**：需要手动复制文件
2. **无 MCP 工具支持**：没有专门的模板工具
3. **扩展性差**：无法通过配置注册新模板
4. **缺少模板变量**：无法动态替换项目名等变量

---

## 3. 需求拆解

### R1: 检测项目、匹配规范的算法

> **目标**：提高项目特征识别准确率，智能匹配最合适的规范

#### R1.1 深度项目分析

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R1.1.1 | 增强 package.json 分析 | 解析 scripts、engines、peerDependencies | P0 |
| R1.1.2 | 配置文件深度解析 | 分析 vite.config、tsconfig、eslintrc 等 | P0 |
| R1.1.3 | 代码内容分析 | 扫描关键文件的 import 语句 | P1 |
| R1.1.4 | Git 历史分析 | 识别最近修改频繁的技术栈 | P2 |

**技术方案**：

```typescript
// 新增配置文件解析器
interface ConfigFileAnalyzer {
    analyze(configPath: string): Partial<ProjectFeatures>;
}

// 配置文件类型注册
const CONFIG_ANALYZERS = {
    'vite.config.ts': ViteConfigAnalyzer,
    'tsconfig.json': TsConfigAnalyzer,
    '.eslintrc.js': EslintConfigAnalyzer,
    // ...
};
```

#### R1.2 智能权重系统

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R1.2.1 | 动态权重计算 | 根据项目类型调整权重 | P0 |
| R1.2.2 | 置信度评分 | 返回匹配置信度，辅助决策 | P1 |
| R1.2.3 | 权重配置化 | 允许用户自定义权重 | P2 |

**技术方案**：

```typescript
interface MatchResult {
    agentId: string;
    score: number;
    confidence: number;  // 0-1 置信度
    matchDetails: {      // 匹配详情
        frameworkMatches: string[];
        toolMatches: string[];
        languageMatches: string[];
        keywordMatches: string[];
    };
}
```

#### R1.3 缓存与性能优化

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R1.3.1 | 项目特征缓存 | 首次分析后缓存结果 | P1 |
| R1.3.2 | 增量更新 | 仅在文件变化时重新分析 | P2 |
| R1.3.3 | 并行扫描 | 使用 Worker 并行扫描文件 | P2 |

---

### R2: 精确匹配用户需求的规范

> **目标**：根据用户意图和代码上下文，精准加载相关规范

#### R2.1 意图识别系统

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R2.1.1 | 用户意图解析 | 从用户输入中提取操作意图 | P0 |
| R2.1.2 | 场景关键词库 | 建立场景-规范映射关系 | P0 |
| R2.1.3 | 意图分类模型 | 将意图分类为：创建、修改、修复、优化等 | P1 |

**技术方案**：

```typescript
// 意图类型定义
type IntentType = 'create' | 'modify' | 'fix' | 'optimize' | 'refactor' | 'review';

// 场景关键词映射
const INTENT_KEYWORDS: Record<string, IntentType> = {
    '创建': 'create',
    '新增': 'create',
    '添加': 'create',
    '修改': 'modify',
    '更新': 'modify',
    '修复': 'fix',
    '修 bug': 'fix',
    '优化': 'optimize',
    '重构': 'refactor',
    '审查': 'review',
};

// 场景-规范映射
const SCENARIO_STANDARDS: Record<string, string[]> = {
    'vue3-form': ['standards://frameworks/vue3-composition', 'standards://libraries/element-plus'],
    'api-call': ['standards://patterns/api-layer', 'standards://core/typescript-base'],
    // ...
};
```

#### R2.2 上下文分析系统

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R2.2.1 | 当前文件分析 | 解析当前文件的 import、组件结构 | P0 |
| R2.2.2 | 相关文件发现 | 找出与当前文件相关的其他文件 | P1 |
| R2.2.3 | 代码模式识别 | 识别当前项目的代码风格模式 | P1 |

**技术方案**：

```typescript
interface FileContext {
    filePath: string;
    fileType: 'vue' | 'ts' | 'tsx' | 'js' | 'jsx' | 'css' | 'scss';
    imports: ImportInfo[];
    exports: ExportInfo[];
    usedComponents: string[];
    usedComposables: string[];
    usedTypes: string[];
}

interface ContextAnalyzer {
    analyzeFile(filePath: string, content: string): FileContext;
    findRelatedFiles(filePath: string): string[];
    detectPatterns(context: FileContext): CodePattern[];
}
```

#### R2.3 智能规范推荐

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R2.3.1 | 规范相关性评分 | 计算每个规范与当前上下文的相关度 | P0 |
| R2.3.2 | 规范优先级排序 | 按相关度排序，返回最相关的规范 | P0 |
| R2.3.3 | 规范组合推荐 | 推荐互补的规范组合 | P1 |

---

### R3: 模板生成功能模块化

> **目标**：模块化设计，支持可扩展的模板注册机制

#### R3.1 模板注册系统

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R3.1.1 | 模板元数据定义 | 定义模板的名称、描述、参数、依赖 | P0 |
| R3.1.2 | 模板注册机制 | 支持从目录自动扫描注册模板 | P0 |
| R3.1.3 | 自定义模板目录 | 支持用户指定额外的模板目录 | P1 |

**技术方案**：

```typescript
// 模板元数据
interface TemplateMetadata {
    id: string;
    name: string;
    description: string;
    category: 'vue' | 'react' | 'common' | 'flutter' | 'custom';
    version: string;
    author?: string;
    tags: string[];
    
    // 参数定义
    parameters: TemplateParameter[];
    
    // 文件列表
    files: TemplateFile[];
    
    // 依赖
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    
    // 后置脚本
    postInstall?: string[];
}

interface TemplateParameter {
    name: string;
    type: 'string' | 'boolean' | 'select';
    description: string;
    default?: string | boolean;
    required?: boolean;
    options?: string[];  // select 类型时的选项
}

interface TemplateFile {
    source: string;      // 模板文件路径
    target: string;      // 目标文件路径（支持变量）
    condition?: string;  // 条件表达式
}
```

#### R3.2 模板渲染引擎

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R3.2.1 | 变量替换 | 支持 `{{projectName}}` 等变量 | P0 |
| R3.2.2 | 条件渲染 | 支持 `{{#if useTypeScript}}...{{/if}}` | P1 |
| R3.2.3 | 循环渲染 | 支持 `{{#each items}}...{{/each}}` | P2 |

#### R3.3 MCP 工具集成

**子需求**：

| ID | 需求描述 | 实现要点 | 优先级 |
|----|---------|---------|--------|
| R3.3.1 | `list_templates` 工具 | 列出所有可用模板 | P0 |
| R3.3.2 | `apply_template` 工具 | 应用模板到项目 | P0 |
| R3.3.3 | `create_template` 工具 | 从现有代码创建模板 | P2 |

---

### R4: 遵循 MCP 自身规范要求

> **目标**：开发过程严格遵循项目规范，保证质量

#### R4.1 开发规范遵循

**关键规范提取**（来自 copilot-instructions.md）：

| 规范类别 | 具体要求 | 检查方式 |
|---------|---------|---------|
| TypeScript 严格模式 | strict: true, noImplicitAny, strictNullChecks | tsconfig.json |
| 错误处理 | 所有异步操作必须 try-catch | 代码审查 |
| 日志规范 | 使用统一的 logger 接口 | 代码审查 |
| 文档规范 | 更新 README、CHANGELOG | 提交检查 |
| 编译验证 | npm run build 必须通过 | CI/CD |

#### R4.2 质量检查清单

**每次代码修改后必须执行**：

```markdown
1. ✅ TypeScript 编译无错误 (`npm run build`)
2. ✅ 所有异步操作有 try-catch
3. ✅ 使用 logger 记录关键操作
4. ✅ 新增功能有对应文档
5. ✅ 代码符合项目现有模式
6. ✅ 无硬编码的路径或配置
7. ✅ 导出的接口有 JSDoc 注释
```

---

## 4. 实施计划

### Phase 1: 基础架构优化（1-2天）

**目标**：建立可扩展的基础架构

| 任务 | 预期产出 | 验收标准 |
|------|---------|---------|
| 重构 smartAgentMatcher | 模块化的分析器架构 | 编译通过，现有功能正常 |
| 实现 scenarioDetector | 场景检测基础逻辑 | 能识别 10+ 常见场景 |
| 设计模板系统接口 | TemplateManager 接口定义 | 类型定义完整 |

### Phase 2: 算法优化（2-3天）

**目标**：提升检测和匹配准确率

| 任务 | 预期产出 | 验收标准 |
|------|---------|---------|
| 增强项目分析 | 配置文件深度解析 | 准确识别 Vite/TS 配置 |
| 实现意图识别 | 用户意图解析模块 | 识别创建/修改/修复意图 |
| 优化权重系统 | 动态权重计算 | 匹配结果更准确 |

### Phase 3: 模板系统（1-2天）

**目标**：实现可扩展的模板系统

| 任务 | 预期产出 | 验收标准 |
|------|---------|---------|
| 模板注册机制 | 自动扫描并注册模板 | 支持 5+ 现有模板 |
| 模板渲染引擎 | 变量替换功能 | 能处理项目名等变量 |
| MCP 工具集成 | list_templates, apply_template | 工具可正常调用 |

### Phase 4: 测试与文档（1天）

**目标**：确保质量和可维护性

| 任务 | 预期产出 | 验收标准 |
|------|---------|---------|
| 单元测试 | 核心模块测试用例 | 覆盖率 > 80% |
| 集成测试 | 端到端测试用例 | 主流程全覆盖 |
| 文档更新 | README、API 文档 | 文档完整准确 |

---

## 5. 质量保障

### 5.1 代码质量标准

```typescript
// 必须遵循的代码规范
{
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
}
```

### 5.2 测试要求

- **单元测试**：所有核心函数必须有测试
- **集成测试**：主要工作流必须有端到端测试
- **覆盖率**：目标 > 80%

### 5.3 文档要求

- **JSDoc**：所有导出函数必须有完整注释
- **README**：新功能必须更新 README
- **CHANGELOG**：版本变更必须记录

### 5.4 审查清单

每次提交前执行：

```bash
# 1. 编译检查
npm run build

# 2. 类型检查
npm run type-check

# 3. 代码格式
npm run format

# 4. 测试
npm run test
```

---

## 6. 相关文档

### 详细设计文档

- [R1-项目检测算法设计](./R1-PROJECT-DETECTION.md)
- [R2-规范匹配系统设计](./R2-STANDARD-MATCHING.md)
- [R3-模板系统设计](./R3-TEMPLATE-SYSTEM.md)
- [R4-质量规范清单](./R4-QUALITY-STANDARDS.md)

### 实施记录

- [实施进度跟踪](./PROGRESS.md)
- [问题与解决方案](./ISSUES.md)

---

**文档版本**: v1.0  
**最后更新**: 2026-01-09  
**下一步**: 创建详细设计文档，开始 Phase 1 实施
