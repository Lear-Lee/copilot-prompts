# R2: 精确规范匹配系统设计

> **文档状态**: 详细设计  
> **关联需求**: R2 - 在生成代码时，精确匹配用户需求所用到的规范  
> **创建日期**: 2026-01-09  
> **设计理念**: MCP 提供信息，AI 做决策

---

## 0. ⚠️ 核心理念

### MCP 的定位

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ 错误理念：MCP 做意图分析 → 权重计算 → 规范匹配 → 返回结果   │
│     问题：这些都是 AI 擅长的事情，MCP 做了反而慢且不准          │
├─────────────────────────────────────────────────────────────────┤
│  ✅ 正确理念：AI 分析意图 → AI 决定需要什么 → 调用 MCP 获取     │
│     优势：AI 理解力强，MCP 只需快速提供数据                     │
└─────────────────────────────────────────────────────────────────┘
```

### MCP 应该做的

| 功能 | 说明 | 示例 |
|------|------|------|
| **按需加载** | AI 告诉 MCP 需要什么，MCP 返回 | `get_standard({ id: 'vue3-form' })` |
| **多模式返回** | 摘要/关键规则/完整，AI 选择 | `mode: 'key-rules'` 节省 85% token |
| **预设场景** | 常用场景一键获取 | `use_preset('vue3-form')` |
| **项目信息** | 提供项目特征供 AI 参考 | `analyze_project()` |

### MCP 不应该做的

| 功能 | 原因 |
|------|------|
| 复杂意图分析 | AI 本身就擅长理解用户意图 |
| 权重计算 | AI 自己能判断什么更重要 |
| 规范排序 | AI 根据上下文自己决定 |
| 替代 AI 决策 | MCP 只是信息提供者 |

---

## 1. 简化后的设计

### 1.1 目标

- 提供**多种加载模式**，让 AI 按需选择（摘要/关键规则/完整）
- 维护**场景-规范映射**，便于 AI 快速定位
- 提供**项目信息**，帮助 AI 更好地理解上下文
- **减少 Token 消耗**，通过精简模式实现

### 1.2 核心工具（简化版）

```typescript
// 1. 按 ID 获取规范（AI 已知道需要什么）
get_standard({ 
    id: 'vue3-form',           // AI 决定的
    mode: 'key-rules'          // AI 选择的模式
})

// 2. 预设场景快速获取
use_preset('vue3-form')        // 已有 8 个预设

// 3. 项目分析（提供信息给 AI）
analyze_project()              // AI 用这些信息做判断

// 4. 智能推荐（轻量辅助，非强制）
get_smart_standards({
    currentFile: 'xxx.vue'     // 提供上下文，返回建议
})
```

### 1.3 ⚠️ 兼容性要求

> **强制要求**：新设计必须兼容现有工具和预设

**现有实现**（必须保留）：

| 文件 | 功能 | 兼容策略 |
|------|------|---------|
| `usePreset.ts` | 8 个预设场景 | 扩展 PRESETS 对象，不修改现有预设 |
| `getSmartStandards.ts` | 智能规范推荐 | 增强逻辑，保持接口兼容 |
| `standardsManager.ts` | 规范管理和缓存 | 复用现有缓存机制 |
| `scenarioDetector.ts` | 场景检测（当前为空） | 实现此文件，填充逻辑 |

**现有预设列表**（`usePreset.ts`）：
- `vue3-component`, `vue3-form`, `vue3-table`
- `pinia-store`, `api-call`, `typescript-strict`
- `i18n`, `composable`

**扩展策略**：
1. 新增预设追加到 PRESETS 对象末尾
2. 不修改现有预设的 imports、scenario 等字段
3. 新增的 ScenarioDetector 与 usePreset 协同工作

### 1.4 解决思路

```
用户意图 ─────┐
              ├──→ 智能规范匹配 ──→ 精准规范列表
当前文件上下文 ─┤
              │
项目特征 ─────┘
```

---

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     StandardMatchingSystem                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  IntentAnalyzer │  │ ContextAnalyzer │  │ ProjectAnalyzer │  │
│  │  - 用户意图解析   │  │  - 文件内容分析  │  │  - 项目特征    │  │
│  │  - 操作类型识别   │  │  - import 解析   │  │  - 技术栈      │  │
│  │  - 场景分类      │  │  - 组件识别      │  │  - 工具链      │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│           └────────────────────┼────────────────────┘            │
│                                ↓                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    MatchingContext                          │ │
│  │  {                                                          │ │
│  │    intent: 'create-form',                                   │ │
│  │    fileType: 'vue',                                        │ │
│  │    imports: ['element-plus', 'vue'],                       │ │
│  │    components: ['ElForm', 'ElInput'],                      │ │
│  │    projectType: 'vue3',                                    │ │
│  │    frameworks: ['Vue 3'],                                  │ │
│  │    tools: ['Element Plus', 'Vite']                         │ │
│  │  }                                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                ↓                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 StandardRecommender                         │ │
│  │  - 场景-规范映射查询                                         │ │
│  │  - 相关性评分                                                │ │
│  │  - 优先级排序                                                │ │
│  │  - Token 预算控制                                            │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                ↓                                  │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 RecommendedStandards                        │ │
│  │  [                                                          │ │
│  │    { uri: 'standards://frameworks/vue3-composition',       │ │
│  │      relevance: 0.95, priority: 1 },                       │ │
│  │    { uri: 'standards://libraries/element-plus',            │ │
│  │      relevance: 0.90, priority: 2 },                       │ │
│  │    ...                                                      │ │
│  │  ]                                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流

```
1. 用户输入 "创建一个用户表单组件"
       ↓
2. IntentAnalyzer 解析:
   - intent: 'create'
   - scenario: 'form'
   - entity: 'user-form'
       ↓
3. ContextAnalyzer 分析当前文件:
   - fileType: 'vue'
   - imports: ['vue', 'element-plus', 'pinia']
   - existingComponents: ['ElForm', 'ElInput']
       ↓
4. ProjectAnalyzer 提供项目上下文:
   - projectType: 'vue3'
   - i18n: 'vue-i18n'
   - stateManagement: 'pinia'
       ↓
5. StandardRecommender 推荐:
   - vue3-composition (必须)
   - element-plus (必须)
   - i18n (项目使用)
   - pinia (如涉及状态)
       ↓
6. 返回精简规范内容
```

---

## 3. 意图识别系统

### 3.1 意图类型定义

```typescript
/**
 * 用户意图类型
 */
type IntentType = 
    | 'create'    // 创建新内容
    | 'modify'    // 修改现有内容
    | 'fix'       // 修复问题
    | 'optimize'  // 优化性能/代码
    | 'refactor'  // 重构代码
    | 'review'    // 代码审查
    | 'explain'   // 解释代码
    | 'test'      // 编写测试
    | 'document'; // 编写文档

/**
 * 场景类型
 */
type ScenarioType =
    // UI 场景
    | 'form'           // 表单
    | 'table'          // 表格
    | 'dialog'         // 弹窗
    | 'page'           // 页面
    | 'component'      // 通用组件
    | 'layout'         // 布局
    
    // 逻辑场景
    | 'api'            // API 调用
    | 'state'          // 状态管理
    | 'router'         // 路由
    | 'composable'     // 组合函数
    | 'utils'          // 工具函数
    | 'types'          // 类型定义
    
    // 特殊场景
    | 'i18n'           // 国际化
    | 'auth'           // 认证授权
    | 'upload'         // 文件上传
    | 'chart'          // 图表
    | 'flow'           // 流程图
    | 'validation';    // 表单验证

/**
 * 意图分析结果
 */
interface IntentAnalysisResult {
    intent: IntentType;
    scenario: ScenarioType | null;
    confidence: number;
    
    // 提取的实体
    entities: {
        componentName?: string;
        fileName?: string;
        functionName?: string;
        targetElement?: string;
    };
    
    // 关键词
    keywords: string[];
}
```

### 3.2 意图关键词库

```typescript
/**
 * 意图识别关键词库
 */
const INTENT_KEYWORDS: Record<IntentType, string[]> = {
    create: [
        '创建', '新增', '添加', '新建', '生成', '写一个',
        'create', 'add', 'new', 'generate', 'build'
    ],
    modify: [
        '修改', '更改', '更新', '调整', '改一下',
        'modify', 'update', 'change', 'adjust'
    ],
    fix: [
        '修复', '修bug', '解决', '处理', '修正', '修一下',
        'fix', 'solve', 'resolve', 'repair', 'debug'
    ],
    optimize: [
        '优化', '提升', '改进', '加速', '精简',
        'optimize', 'improve', 'enhance', 'speed up'
    ],
    refactor: [
        '重构', '重写', '整理', '拆分', '合并',
        'refactor', 'rewrite', 'reorganize', 'split', 'merge'
    ],
    review: [
        '检查', '审查', '看看', '分析', '评估',
        'review', 'check', 'analyze', 'evaluate'
    ],
    explain: [
        '解释', '说明', '讲解', '什么意思', '为什么',
        'explain', 'describe', 'what is', 'why'
    ],
    test: [
        '测试', '单测', '写测试', '测试用例',
        'test', 'unit test', 'spec', 'testing'
    ],
    document: [
        '文档', '注释', '说明文档', '写注释',
        'document', 'comment', 'doc', 'documentation'
    ]
};

/**
 * 场景识别关键词库
 */
const SCENARIO_KEYWORDS: Record<ScenarioType, string[]> = {
    form: [
        '表单', '输入', '提交', '验证', '必填',
        'form', 'input', 'submit', 'validate', 'required'
    ],
    table: [
        '表格', '列表', '分页', '排序', '筛选', '数据列表',
        'table', 'list', 'pagination', 'sort', 'filter', 'grid'
    ],
    dialog: [
        '弹窗', '对话框', '模态框', '确认框', '提示框',
        'dialog', 'modal', 'popup', 'confirm', 'alert'
    ],
    page: [
        '页面', '视图', '路由页面',
        'page', 'view', 'screen'
    ],
    component: [
        '组件', '控件', '部件',
        'component', 'widget'
    ],
    layout: [
        '布局', '排版', '容器',
        'layout', 'container'
    ],
    api: [
        'api', '接口', '请求', '调用', 'http', 'axios', 'fetch',
        'API', 'request', 'call', 'endpoint'
    ],
    state: [
        '状态', 'store', 'pinia', 'vuex', '状态管理',
        'state', 'store', 'global state'
    ],
    router: [
        '路由', '导航', '跳转',
        'router', 'route', 'navigate', 'navigation'
    ],
    composable: [
        'composable', 'hook', '组合函数', '可复用逻辑',
        'use', 'composition'
    ],
    utils: [
        '工具', '工具函数', '帮助函数', '辅助',
        'utils', 'helper', 'utility'
    ],
    types: [
        '类型', '接口', '类型定义', 'interface', 'type',
        'types', 'interface', 'typing'
    ],
    i18n: [
        '国际化', '多语言', '翻译', 'i18n',
        'internationalization', 'locale', 'translation'
    ],
    auth: [
        '认证', '授权', '登录', '权限', '鉴权',
        'auth', 'authentication', 'authorization', 'login', 'permission'
    ],
    upload: [
        '上传', '文件上传', '图片上传',
        'upload', 'file upload', 'image upload'
    ],
    chart: [
        '图表', '统计图', '可视化', 'echarts', 'chart',
        'chart', 'graph', 'visualization'
    ],
    flow: [
        '流程图', '流程', 'logicflow', '节点',
        'flow', 'flowchart', 'diagram', 'workflow'
    ],
    validation: [
        '验证', '校验', '规则', '必填',
        'validate', 'validation', 'rule'
    ]
};
```

### 3.3 意图分析器实现

```typescript
/**
 * 意图分析器
 */
class IntentAnalyzer {
    
    /**
     * 分析用户输入的意图
     */
    analyze(userInput: string): IntentAnalysisResult {
        const normalizedInput = this.normalize(userInput);
        
        // 识别意图类型
        const intent = this.detectIntent(normalizedInput);
        
        // 识别场景
        const scenario = this.detectScenario(normalizedInput);
        
        // 提取实体
        const entities = this.extractEntities(normalizedInput, scenario);
        
        // 提取关键词
        const keywords = this.extractKeywords(normalizedInput);
        
        // 计算置信度
        const confidence = this.calculateConfidence(intent, scenario, keywords);
        
        return {
            intent,
            scenario,
            confidence,
            entities,
            keywords
        };
    }
    
    private normalize(input: string): string {
        return input
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    private detectIntent(input: string): IntentType {
        let bestMatch: IntentType = 'create';
        let bestScore = 0;
        
        for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
            const score = this.calculateKeywordScore(input, keywords);
            if (score > bestScore) {
                bestScore = score;
                bestMatch = intent as IntentType;
            }
        }
        
        return bestMatch;
    }
    
    private detectScenario(input: string): ScenarioType | null {
        let bestMatch: ScenarioType | null = null;
        let bestScore = 0;
        
        for (const [scenario, keywords] of Object.entries(SCENARIO_KEYWORDS)) {
            const score = this.calculateKeywordScore(input, keywords);
            if (score > bestScore && score > 0.3) {
                bestScore = score;
                bestMatch = scenario as ScenarioType;
            }
        }
        
        return bestMatch;
    }
    
    private calculateKeywordScore(input: string, keywords: string[]): number {
        let matchCount = 0;
        
        for (const keyword of keywords) {
            if (input.includes(keyword.toLowerCase())) {
                matchCount++;
            }
        }
        
        return keywords.length > 0 ? matchCount / keywords.length : 0;
    }
    
    private extractEntities(
        input: string, 
        scenario: ScenarioType | null
    ): IntentAnalysisResult['entities'] {
        const entities: IntentAnalysisResult['entities'] = {};
        
        // 提取组件名（驼峰命名）
        const componentMatch = input.match(/([A-Z][a-zA-Z]*(?:Component|Form|Table|Dialog|Page|View)?)/);
        if (componentMatch) {
            entities.componentName = componentMatch[1];
        }
        
        // 提取文件名
        const fileMatch = input.match(/([a-zA-Z0-9_-]+\.(vue|ts|tsx|js|jsx))/i);
        if (fileMatch) {
            entities.fileName = fileMatch[1];
        }
        
        // 提取中文名称
        const chineseMatch = input.match(/[「「『]([^」」』]+)[」」』]|["']([^"']+)["']/);
        if (chineseMatch) {
            entities.targetElement = chineseMatch[1] || chineseMatch[2];
        }
        
        return entities;
    }
    
    private extractKeywords(input: string): string[] {
        const keywords: string[] = [];
        
        // 提取技术关键词
        const techKeywords = [
            'vue', 'react', 'typescript', 'element', 'antd',
            'pinia', 'vuex', 'axios', 'i18n', 'router',
            'logicflow', 'echarts', 'tailwind'
        ];
        
        for (const keyword of techKeywords) {
            if (input.toLowerCase().includes(keyword)) {
                keywords.push(keyword);
            }
        }
        
        return keywords;
    }
    
    private calculateConfidence(
        intent: IntentType,
        scenario: ScenarioType | null,
        keywords: string[]
    ): number {
        let confidence = 0.5; // 基础置信度
        
        // 意图明确加分
        if (intent !== 'create') {
            confidence += 0.1;
        }
        
        // 场景明确加分
        if (scenario) {
            confidence += 0.2;
        }
        
        // 技术关键词加分
        confidence += Math.min(keywords.length * 0.05, 0.2);
        
        return Math.min(confidence, 1);
    }
}
```

---

## 4. 上下文分析系统

### 4.1 文件上下文分析器

```typescript
/**
 * 文件上下文
 */
interface FileContext {
    filePath: string;
    fileType: FileType;
    
    // 导入信息
    imports: ImportInfo[];
    
    // 导出信息
    exports: ExportInfo[];
    
    // Vue 特有
    vueComponents?: {
        name?: string;
        props?: string[];
        emits?: string[];
        usedComponents: string[];
    };
    
    // 使用的组合函数
    composables: string[];
    
    // 使用的类型
    types: string[];
    
    // 代码模式
    patterns: CodePattern[];
}

type FileType = 'vue' | 'ts' | 'tsx' | 'js' | 'jsx' | 'css' | 'scss' | 'json';

interface ImportInfo {
    source: string;          // 导入源
    defaultImport?: string;  // 默认导入
    namedImports: string[];  // 具名导入
    isType: boolean;         // 是否是类型导入
}

interface ExportInfo {
    name: string;
    type: 'default' | 'named' | 'type';
}

type CodePattern = 
    | 'composition-api'
    | 'options-api'
    | 'script-setup'
    | 'class-component'
    | 'functional'
    | 'async-await'
    | 'promise'
    | 'reactive'
    | 'ref';

/**
 * 上下文分析器
 */
class ContextAnalyzer {
    
    /**
     * 分析文件上下文
     */
    analyzeFile(filePath: string, content: string): FileContext {
        const fileType = this.detectFileType(filePath);
        
        const context: FileContext = {
            filePath,
            fileType,
            imports: [],
            exports: [],
            composables: [],
            types: [],
            patterns: []
        };
        
        // 解析导入
        context.imports = this.parseImports(content, fileType);
        
        // 解析导出
        context.exports = this.parseExports(content, fileType);
        
        // Vue 文件特殊处理
        if (fileType === 'vue') {
            context.vueComponents = this.parseVueComponent(content);
        }
        
        // 识别组合函数
        context.composables = this.detectComposables(content);
        
        // 识别类型
        context.types = this.detectTypes(content);
        
        // 识别代码模式
        context.patterns = this.detectPatterns(content, fileType);
        
        return context;
    }
    
    private detectFileType(filePath: string): FileType {
        const ext = path.extname(filePath).toLowerCase();
        const typeMap: Record<string, FileType> = {
            '.vue': 'vue',
            '.ts': 'ts',
            '.tsx': 'tsx',
            '.js': 'js',
            '.jsx': 'jsx',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json'
        };
        return typeMap[ext] || 'ts';
    }
    
    private parseImports(content: string, fileType: FileType): ImportInfo[] {
        const imports: ImportInfo[] = [];
        
        // ES6 import 语句正则
        const importRegex = /import\s+(?:type\s+)?(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s+from\s+['"]([^'"]+)['"]/g;
        
        let match;
        while ((match = importRegex.exec(content)) !== null) {
            const [fullMatch, defaultImport, namedImportsStr, source] = match;
            
            const namedImports = namedImportsStr
                ? namedImportsStr.split(',').map(s => s.trim().split(' as ')[0].trim())
                : [];
            
            imports.push({
                source,
                defaultImport: defaultImport || undefined,
                namedImports,
                isType: fullMatch.includes('import type')
            });
        }
        
        return imports;
    }
    
    private parseExports(content: string, fileType: FileType): ExportInfo[] {
        const exports: ExportInfo[] = [];
        
        // export default
        if (/export\s+default/.test(content)) {
            const defaultMatch = content.match(/export\s+default\s+(?:class\s+)?(\w+)?/);
            exports.push({
                name: defaultMatch?.[1] || 'default',
                type: 'default'
            });
        }
        
        // named exports
        const namedExportRegex = /export\s+(?:const|let|var|function|class|interface|type)\s+(\w+)/g;
        let match;
        while ((match = namedExportRegex.exec(content)) !== null) {
            exports.push({
                name: match[1],
                type: match[0].includes('interface') || match[0].includes('type') 
                    ? 'type' 
                    : 'named'
            });
        }
        
        return exports;
    }
    
    private parseVueComponent(content: string): FileContext['vueComponents'] {
        const result: FileContext['vueComponents'] = {
            usedComponents: []
        };
        
        // 解析组件名
        const nameMatch = content.match(/name:\s*['"](\w+)['"]/);
        if (nameMatch) {
            result.name = nameMatch[1];
        }
        
        // 解析 props
        const propsMatch = content.match(/defineProps<\{([^}]+)\}>/);
        if (propsMatch) {
            const propsStr = propsMatch[1];
            result.props = propsStr.split(/[,;]/)
                .map(p => p.trim().split(':')[0].trim())
                .filter(Boolean);
        }
        
        // 解析 emits
        const emitsMatch = content.match(/defineEmits<\{([^}]+)\}>/);
        if (emitsMatch) {
            result.emits = [];
            // 解析 emit 事件名
        }
        
        // 解析使用的组件
        const templateMatch = content.match(/<template[^>]*>([\s\S]*?)<\/template>/);
        if (templateMatch) {
            const template = templateMatch[1];
            // 匹配 PascalCase 和 kebab-case 组件
            const componentMatches = template.match(/<((?:[A-Z][a-zA-Z]*)+|[a-z]+(?:-[a-z]+)+)/g);
            if (componentMatches) {
                result.usedComponents = [...new Set(
                    componentMatches
                        .map(m => m.substring(1))
                        .filter(c => !['template', 'div', 'span', 'p', 'a', 'button', 'input'].includes(c.toLowerCase()))
                )];
            }
        }
        
        return result;
    }
    
    private detectComposables(content: string): string[] {
        const composables: string[] = [];
        
        // 匹配 use 开头的函数调用
        const useMatches = content.match(/\buse[A-Z]\w+/g);
        if (useMatches) {
            composables.push(...new Set(useMatches));
        }
        
        return composables;
    }
    
    private detectTypes(content: string): string[] {
        const types: string[] = [];
        
        // 匹配接口和类型定义
        const interfaceMatches = content.match(/interface\s+(\w+)/g);
        const typeMatches = content.match(/type\s+(\w+)\s*=/g);
        
        if (interfaceMatches) {
            types.push(...interfaceMatches.map(m => m.replace('interface ', '')));
        }
        
        if (typeMatches) {
            types.push(...typeMatches.map(m => m.replace(/type\s+(\w+)\s*=/, '$1')));
        }
        
        return types;
    }
    
    private detectPatterns(content: string, fileType: FileType): CodePattern[] {
        const patterns: CodePattern[] = [];
        
        if (fileType === 'vue') {
            // <script setup> 模式
            if (/<script[^>]*\ssetup[^>]*>/.test(content)) {
                patterns.push('script-setup');
                patterns.push('composition-api');
            }
            // Composition API（非 setup）
            else if (/setup\s*\([^)]*\)\s*{/.test(content)) {
                patterns.push('composition-api');
            }
            // Options API
            else if (/export\s+default\s*\{[\s\S]*data\s*\(\)/.test(content)) {
                patterns.push('options-api');
            }
        }
        
        // ref/reactive 使用
        if (/\bref\s*[<(]/.test(content)) patterns.push('ref');
        if (/\breactive\s*[<(]/.test(content)) patterns.push('reactive');
        
        // async/await
        if (/async\s+(?:function|\(|[a-z_$])/.test(content)) patterns.push('async-await');
        
        // Promise
        if (/new\s+Promise/.test(content) || /\.then\s*\(/.test(content)) patterns.push('promise');
        
        return patterns;
    }
}
```

---

## 5. 场景-规范映射

### 5.1 映射配置

```typescript
/**
 * 场景-规范映射配置
 */
const SCENARIO_STANDARD_MAPPING: Record<ScenarioType, StandardRecommendation[]> = {
    form: [
        { uri: 'standards://frameworks/vue3-composition', priority: 1, required: true },
        { uri: 'standards://libraries/element-plus', priority: 2, required: true },
        { uri: 'standards://patterns/form-validation', priority: 3, required: false }
    ],
    table: [
        { uri: 'standards://frameworks/vue3-composition', priority: 1, required: true },
        { uri: 'standards://libraries/element-plus', priority: 2, required: true },
        { uri: 'standards://patterns/table-pattern', priority: 3, required: false }
    ],
    dialog: [
        { uri: 'standards://frameworks/vue3-composition', priority: 1, required: true },
        { uri: 'standards://libraries/element-plus', priority: 2, required: true }
    ],
    api: [
        { uri: 'standards://core/typescript-base', priority: 1, required: true },
        { uri: 'standards://patterns/api-layer', priority: 2, required: true },
        { uri: 'standards://core/code-style', priority: 3, required: false }
    ],
    state: [
        { uri: 'standards://core/typescript-base', priority: 1, required: true },
        { uri: 'standards://libraries/pinia', priority: 2, required: true }
    ],
    composable: [
        { uri: 'standards://frameworks/vue3-composition', priority: 1, required: true },
        { uri: 'standards://core/typescript-base', priority: 2, required: true }
    ],
    i18n: [
        { uri: 'standards://patterns/i18n', priority: 1, required: true },
        { uri: 'standards://frameworks/vue3-composition', priority: 2, required: false }
    ],
    flow: [
        { uri: 'standards://libraries/logicflow', priority: 1, required: true },
        { uri: 'standards://frameworks/vue3-composition', priority: 2, required: true }
    ],
    chart: [
        { uri: 'standards://libraries/echarts', priority: 1, required: true },
        { uri: 'standards://frameworks/vue3-composition', priority: 2, required: true }
    ],
    validation: [
        { uri: 'standards://patterns/form-validation', priority: 1, required: true },
        { uri: 'standards://libraries/element-plus', priority: 2, required: false }
    ],
    // ... 其他场景
    component: [
        { uri: 'standards://frameworks/vue3-composition', priority: 1, required: true }
    ],
    page: [
        { uri: 'standards://frameworks/vue3-composition', priority: 1, required: true },
        { uri: 'standards://libraries/vue-router', priority: 2, required: false }
    ],
    layout: [
        { uri: 'standards://frameworks/vue3-composition', priority: 1, required: true }
    ],
    router: [
        { uri: 'standards://libraries/vue-router', priority: 1, required: true }
    ],
    utils: [
        { uri: 'standards://core/typescript-base', priority: 1, required: true }
    ],
    types: [
        { uri: 'standards://core/typescript-base', priority: 1, required: true }
    ],
    auth: [
        { uri: 'standards://patterns/auth', priority: 1, required: true },
        { uri: 'standards://core/typescript-base', priority: 2, required: true }
    ],
    upload: [
        { uri: 'standards://libraries/element-plus', priority: 1, required: true },
        { uri: 'standards://frameworks/vue3-composition', priority: 2, required: true }
    ]
};

interface StandardRecommendation {
    uri: string;
    priority: number;
    required: boolean;
    condition?: (context: MatchingContext) => boolean;
}
```

### 5.2 导入-规范映射

```typescript
/**
 * 导入源-规范映射
 */
const IMPORT_STANDARD_MAPPING: Record<string, string[]> = {
    // Vue 相关
    'vue': ['standards://frameworks/vue3-composition'],
    '@vue/composition-api': ['standards://frameworks/vue3-composition'],
    
    // UI 组件库
    'element-plus': ['standards://libraries/element-plus'],
    'ant-design-vue': ['standards://libraries/antd-vue'],
    'naive-ui': ['standards://libraries/naive-ui'],
    
    // 状态管理
    'pinia': ['standards://libraries/pinia'],
    'vuex': ['standards://libraries/vuex'],
    
    // 路由
    'vue-router': ['standards://libraries/vue-router'],
    
    // 网络请求
    'axios': ['standards://patterns/api-layer'],
    '@tanstack/vue-query': ['standards://patterns/api-layer'],
    
    // 国际化
    'vue-i18n': ['standards://patterns/i18n'],
    
    // 图表/可视化
    'echarts': ['standards://libraries/echarts'],
    '@logicflow/core': ['standards://libraries/logicflow'],
    
    // 工具库
    'lodash': ['standards://core/code-style'],
    'dayjs': ['standards://core/code-style'],
    
    // TypeScript
    'typescript': ['standards://core/typescript-base']
};
```

---

## 6. 规范推荐器

### 6.1 推荐器实现

```typescript
/**
 * 匹配上下文
 */
interface MatchingContext {
    // 用户意图分析结果
    intent: IntentAnalysisResult;
    
    // 文件上下文
    fileContext?: FileContext;
    
    // 项目特征
    projectFeatures: ProjectFeatures;
    
    // Token 预算（可选）
    tokenBudget?: number;
}

/**
 * 推荐结果
 */
interface RecommendedStandard {
    uri: string;
    name: string;
    relevance: number;     // 相关性评分 (0-1)
    priority: number;      // 优先级
    reason: string;        // 推荐原因
    estimatedTokens: number;
    required: boolean;
}

/**
 * 规范推荐器
 */
class StandardRecommender {
    private standardsManager: StandardsManager;
    
    constructor() {
        this.standardsManager = new StandardsManager();
    }
    
    /**
     * 推荐规范
     */
    recommend(context: MatchingContext): RecommendedStandard[] {
        const recommendations: Map<string, RecommendedStandard> = new Map();
        
        // 1. 核心规范（始终加载）
        this.addCoreStandards(recommendations);
        
        // 2. 基于场景推荐
        if (context.intent.scenario) {
            this.addScenarioStandards(recommendations, context.intent.scenario, context);
        }
        
        // 3. 基于导入推荐
        if (context.fileContext?.imports) {
            this.addImportBasedStandards(recommendations, context.fileContext.imports);
        }
        
        // 4. 基于项目特征推荐
        this.addProjectBasedStandards(recommendations, context.projectFeatures);
        
        // 5. 排序和过滤
        let results = Array.from(recommendations.values())
            .sort((a, b) => {
                // 先按 required 排序
                if (a.required !== b.required) return a.required ? -1 : 1;
                // 再按 relevance 排序
                if (a.relevance !== b.relevance) return b.relevance - a.relevance;
                // 最后按 priority 排序
                return a.priority - b.priority;
            });
        
        // 6. Token 预算控制
        if (context.tokenBudget) {
            results = this.applyTokenBudget(results, context.tokenBudget);
        }
        
        return results;
    }
    
    private addCoreStandards(recommendations: Map<string, RecommendedStandard>): void {
        const coreUris = [
            'standards://core/code-style',
            'standards://core/typescript-base',
            'standards://core/code-generation'
        ];
        
        coreUris.forEach((uri, index) => {
            recommendations.set(uri, {
                uri,
                name: this.getStandardName(uri),
                relevance: 1.0,
                priority: index + 1,
                reason: '核心规范（始终加载）',
                estimatedTokens: 500,
                required: true
            });
        });
    }
    
    private addScenarioStandards(
        recommendations: Map<string, RecommendedStandard>,
        scenario: ScenarioType,
        context: MatchingContext
    ): void {
        const mapping = SCENARIO_STANDARD_MAPPING[scenario];
        if (!mapping) return;
        
        mapping.forEach(rec => {
            // 检查条件
            if (rec.condition && !rec.condition(context)) return;
            
            const existing = recommendations.get(rec.uri);
            
            if (existing) {
                // 更新相关性（取较高值）
                existing.relevance = Math.max(existing.relevance, 0.9);
                existing.required = existing.required || rec.required;
            } else {
                recommendations.set(rec.uri, {
                    uri: rec.uri,
                    name: this.getStandardName(rec.uri),
                    relevance: 0.9,
                    priority: rec.priority + 10,
                    reason: `场景匹配: ${scenario}`,
                    estimatedTokens: this.estimateTokens(rec.uri),
                    required: rec.required
                });
            }
        });
    }
    
    private addImportBasedStandards(
        recommendations: Map<string, RecommendedStandard>,
        imports: ImportInfo[]
    ): void {
        imports.forEach(imp => {
            const standards = IMPORT_STANDARD_MAPPING[imp.source];
            if (!standards) return;
            
            standards.forEach(uri => {
                const existing = recommendations.get(uri);
                
                if (existing) {
                    existing.relevance = Math.max(existing.relevance, 0.85);
                } else {
                    recommendations.set(uri, {
                        uri,
                        name: this.getStandardName(uri),
                        relevance: 0.85,
                        priority: 20,
                        reason: `导入匹配: ${imp.source}`,
                        estimatedTokens: this.estimateTokens(uri),
                        required: false
                    });
                }
            });
        });
    }
    
    private addProjectBasedStandards(
        recommendations: Map<string, RecommendedStandard>,
        features: ProjectFeatures
    ): void {
        // 基于框架
        features.frameworks.forEach(f => {
            const frameworkStandards = this.getFrameworkStandards(f.name);
            frameworkStandards.forEach(uri => {
                if (!recommendations.has(uri)) {
                    recommendations.set(uri, {
                        uri,
                        name: this.getStandardName(uri),
                        relevance: 0.7 * f.confidence,
                        priority: 30,
                        reason: `项目框架: ${f.name}`,
                        estimatedTokens: this.estimateTokens(uri),
                        required: false
                    });
                }
            });
        });
        
        // 基于工具
        features.tools.forEach(t => {
            const toolStandards = this.getToolStandards(t.name);
            toolStandards.forEach(uri => {
                if (!recommendations.has(uri)) {
                    recommendations.set(uri, {
                        uri,
                        name: this.getStandardName(uri),
                        relevance: 0.6,
                        priority: 40,
                        reason: `项目工具: ${t.name}`,
                        estimatedTokens: this.estimateTokens(uri),
                        required: false
                    });
                }
            });
        });
    }
    
    private applyTokenBudget(
        standards: RecommendedStandard[],
        budget: number
    ): RecommendedStandard[] {
        const result: RecommendedStandard[] = [];
        let usedTokens = 0;
        
        for (const standard of standards) {
            if (standard.required || usedTokens + standard.estimatedTokens <= budget) {
                result.push(standard);
                usedTokens += standard.estimatedTokens;
            }
        }
        
        return result;
    }
    
    private getStandardName(uri: string): string {
        const match = uri.match(/standards:\/\/([^/]+)\/(.+)/);
        if (match) {
            return match[2].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
        return uri;
    }
    
    private estimateTokens(uri: string): number {
        // 根据规范类型估算 Token
        const estimates: Record<string, number> = {
            'core': 500,
            'frameworks': 800,
            'libraries': 600,
            'patterns': 400
        };
        
        const match = uri.match(/standards:\/\/([^/]+)/);
        return estimates[match?.[1] || 'core'] || 500;
    }
    
    private getFrameworkStandards(framework: string): string[] {
        const mapping: Record<string, string[]> = {
            'Vue 3': ['standards://frameworks/vue3-composition'],
            'Vue': ['standards://frameworks/vue3-composition'],
            'React': ['standards://frameworks/react'],
            'Angular': ['standards://frameworks/angular'],
            'Flutter': ['standards://frameworks/flutter'],
            // ...
        };
        return mapping[framework] || [];
    }
    
    private getToolStandards(tool: string): string[] {
        const mapping: Record<string, string[]> = {
            'Element Plus': ['standards://libraries/element-plus'],
            'Pinia': ['standards://libraries/pinia'],
            'LogicFlow': ['standards://libraries/logicflow'],
            'ECharts': ['standards://libraries/echarts'],
            // ...
        };
        return mapping[tool] || [];
    }
}
```

---

## 7. 集成到 MCP 工具

### 7.1 更新 get_smart_standards

```typescript
/**
 * 增强版智能规范加载
 */
export async function getSmartStandards(args: {
    currentFile?: string;
    fileContent?: string;
    userIntent?: string;
    workspacePath?: string;
}): Promise<{ content: Array<{ type: string; text: string }> }> {
    const logger = new ConsoleLogger();
    
    try {
        // 1. 分析用户意图
        const intentAnalyzer = new IntentAnalyzer();
        const intentResult = args.userIntent 
            ? intentAnalyzer.analyze(args.userIntent)
            : { intent: 'create' as IntentType, scenario: null, confidence: 0.5, entities: {}, keywords: [] };
        
        // 2. 分析文件上下文
        const contextAnalyzer = new ContextAnalyzer();
        let fileContext: FileContext | undefined;
        if (args.currentFile && args.fileContent) {
            fileContext = contextAnalyzer.analyzeFile(args.currentFile, args.fileContent);
        }
        
        // 3. 获取项目特征
        const projectAnalyzer = new SmartAgentMatcher(logger);
        let projectFeatures: ProjectFeatures;
        if (args.workspacePath) {
            projectFeatures = await projectAnalyzer.analyzeProject({ 
                uri: { fsPath: args.workspacePath }, 
                name: path.basename(args.workspacePath) 
            });
        } else {
            projectFeatures = getDefaultFeatures();
        }
        
        // 4. 构建匹配上下文
        const matchingContext: MatchingContext = {
            intent: intentResult,
            fileContext,
            projectFeatures,
            tokenBudget: 3000  // 默认 Token 预算
        };
        
        // 5. 获取推荐
        const recommender = new StandardRecommender();
        const recommendations = recommender.recommend(matchingContext);
        
        // 6. 加载规范内容
        const standardsManager = new StandardsManager();
        const loadedStandards = recommendations.map(rec => ({
            ...rec,
            content: standardsManager.readStandard(rec.uri)
        }));
        
        // 7. 返回结果
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    context: {
                        intent: intentResult.intent,
                        scenario: intentResult.scenario,
                        fileType: fileContext?.fileType,
                        projectType: projectFeatures.projectType
                    },
                    recommendations: loadedStandards.map(s => ({
                        uri: s.uri,
                        name: s.name,
                        relevance: s.relevance,
                        reason: s.reason,
                        required: s.required
                    })),
                    standards: loadedStandards.map(s => ({
                        uri: s.uri,
                        content: s.content
                    })),
                    stats: {
                        totalStandards: loadedStandards.length,
                        estimatedTokens: loadedStandards.reduce((sum, s) => sum + s.estimatedTokens, 0)
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`智能规范加载失败: ${error}`);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    error: error instanceof Error ? error.message : String(error)
                }, null, 2)
            }]
        };
    }
}
```

---

## 8. 测试计划

### 8.1 意图识别测试

| 输入 | 预期意图 | 预期场景 |
|------|---------|---------|
| "创建一个用户表单" | create | form |
| "修复登录页面的bug" | fix | null |
| "优化表格性能" | optimize | table |
| "添加 API 接口" | create | api |
| "更新用户信息组件" | modify | component |

### 8.2 上下文分析测试

| 文件类型 | 测试内容 | 验收标准 |
|---------|---------|---------|
| Vue SFC | script setup + Element Plus | 正确识别组件和导入 |
| TypeScript | interface + type | 正确识别类型定义 |
| API 文件 | axios 调用 | 正确识别 API 模式 |

### 8.3 规范推荐测试

| 场景 | 预期规范 | 优先级 |
|------|---------|--------|
| Vue 表单 | vue3-composition, element-plus | 1, 2 |
| API 调用 | typescript-base, api-layer | 1, 2 |
| 国际化 | i18n | 1 |

---

**文档版本**: v1.0  
**最后更新**: 2026-01-09
