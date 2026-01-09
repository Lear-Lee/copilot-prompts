# R3: 模板系统模块化设计

> **文档状态**: 详细设计  
> **关联需求**: R3 - 模板生成功能打包到 npm，支持可扩展性  
> **创建日期**: 2026-01-09

---

## 1. 概述

### 1.1 目标

- 将现有模板功能**模块化**，打包到 npm 包中
- 设计**可扩展**的模板注册和加载机制
- 支持**自定义模板**目录和第三方模板
- 提供完善的 **MCP 工具**集成

### 1.2 现状问题

| 问题 | 描述 | 解决方案 |
|------|------|---------|
| 无自动加载机制 | 需要手动复制文件 | MCP 工具自动应用 |
| 无 MCP 工具支持 | 没有专门的模板工具 | 新增 list_templates, apply_template |
| 扩展性差 | 无法配置注册新模板 | 设计模板注册表 |
| 缺少模板变量 | 无法动态替换项目名等 | 模板渲染引擎 |

### 1.3 设计原则

1. **插件化**: 模板作为独立插件，可按需加载
2. **可扩展**: 支持用户自定义模板和第三方模板
3. **类型安全**: 完整的 TypeScript 类型定义
4. **向后兼容**: 支持现有模板目录结构

---

## 2. 架构设计

### 2.1 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      TemplateSystem                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   TemplateRegistry                        │  │
│  │  - 模板注册表                                              │  │
│  │  - 模板发现与加载                                          │  │
│  │  - 模板验证                                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   TemplateRenderer                        │  │
│  │  - 变量替换                                                │  │
│  │  - 条件渲染                                                │  │
│  │  - 循环渲染                                                │  │
│  │  - 文件名变换                                              │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   TemplateApplier                         │  │
│  │  - 文件复制与创建                                          │  │
│  │  - 依赖安装提示                                            │  │
│  │  - 后置脚本执行                                            │  │
│  │  - 冲突处理                                                │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                        MCP Tools                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │list_templates│ │apply_template│ │create_template (future)│  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 目录结构

```
templates/
├── README.md                  # 模板使用说明（保留现有）
├── registry.json              # 模板注册表（可选，自动发现时不需要）
├── vue/
│   ├── api-layer/             # ✅ 现有模板
│   │   ├── _CONFIG.md         # 现有配置说明（保留）
│   │   ├── _template.json     # 新增：自动化配置（可选）
│   │   ├── request.ts         # 现有模板文件
│   │   ├── types.ts
│   │   ├── index.ts
│   │   ├── mock/
│   │   └── modules/
│   ├── form-component/        # 新增模板示例
│   │   ├── _template.json     # 使用 JSON 配置
│   │   └── {{name}}.vue.tpl   # 支持文件名变量
│   └── table-component/
│       └── ...
├── react/
│   └── ...
├── flutter/
│   └── ...
└── common/
    ├── types/                 # ✅ 现有模板
    │   ├── _CONFIG.md         # 保留现有
    │   └── ...
    └── utils/
        └── ...
```

**配置文件优先级**：
1. 优先读取 `_template.json`（如果存在）
2. 回退到 `_CONFIG.md`（解析为基础配置）
3. 无配置时按目录名作为模板 ID

---

## 3. 类型定义

### 3.1 模板元数据

```typescript
/**
 * 模板元数据
 */
interface TemplateMetadata {
    /** 模板唯一标识 */
    id: string;
    
    /** 模板名称 */
    name: string;
    
    /** 模板描述 */
    description: string;
    
    /** 模板版本 */
    version: string;
    
    /** 模板分类 */
    category: TemplateCategory;
    
    /** 模板标签 */
    tags: string[];
    
    /** 作者信息 */
    author?: {
        name: string;
        email?: string;
    };
    
    /** 适用条件 */
    applicableWhen?: {
        frameworks?: string[];
        languages?: string[];
        tools?: string[];
    };
    
    /** 模板参数 */
    parameters: TemplateParameter[];
    
    /** 模板文件 */
    files: TemplateFileConfig[];
    
    /** 依赖信息 */
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    
    /** 后置操作 */
    postActions?: PostAction[];
}

type TemplateCategory = 
    | 'vue' 
    | 'react' 
    | 'flutter' 
    | 'common' 
    | 'custom';

/**
 * 模板参数定义
 */
interface TemplateParameter {
    /** 参数名 */
    name: string;
    
    /** 参数类型 */
    type: 'string' | 'boolean' | 'number' | 'select' | 'multiselect';
    
    /** 参数描述 */
    description: string;
    
    /** 默认值 */
    default?: string | boolean | number | string[];
    
    /** 是否必填 */
    required?: boolean;
    
    /** select/multiselect 时的选项 */
    options?: Array<{
        value: string;
        label: string;
    }>;
    
    /** 验证规则 */
    validate?: {
        pattern?: string;      // 正则表达式
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
    };
}

/**
 * 模板文件配置
 */
interface TemplateFileConfig {
    /** 源文件路径（相对于模板目录） */
    source: string;
    
    /** 目标文件路径（支持变量，相对于项目根目录） */
    target: string;
    
    /** 条件表达式（JS 表达式字符串） */
    condition?: string;
    
    /** 文件操作类型 */
    action?: 'create' | 'append' | 'merge';
    
    /** 是否覆盖已存在文件 */
    overwrite?: boolean;
}

/**
 * 后置操作
 */
interface PostAction {
    /** 操作类型 */
    type: 'command' | 'message' | 'open-file';
    
    /** 操作内容 */
    content: string;
    
    /** 条件 */
    condition?: string;
}
```

### 3.2 渲染上下文

```typescript
/**
 * 渲染上下文
 */
interface RenderContext {
    /** 模板参数值 */
    params: Record<string, unknown>;
    
    /** 项目信息 */
    project: {
        name: string;
        path: string;
        type: string;
    };
    
    /** 辅助函数 */
    helpers: RenderHelpers;
}

/**
 * 渲染辅助函数
 */
interface RenderHelpers {
    /** 转换为驼峰命名 */
    camelCase(str: string): string;
    
    /** 转换为帕斯卡命名 */
    pascalCase(str: string): string;
    
    /** 转换为短横线命名 */
    kebabCase(str: string): string;
    
    /** 转换为下划线命名 */
    snakeCase(str: string): string;
    
    /** 首字母大写 */
    capitalize(str: string): string;
    
    /** 当前日期 */
    date(format?: string): string;
    
    /** 生成 UUID */
    uuid(): string;
}
```

---

## 4. 核心模块实现

### 4.1 模板注册表

```typescript
/**
 * 模板注册表
 */
class TemplateRegistry {
    private templates: Map<string, RegisteredTemplate> = new Map();
    private templateDirs: string[] = [];
    private logger?: Logger;
    
    constructor(logger?: Logger) {
        this.logger = logger;
        this.initializeDefaultDirs();
    }
    
    /**
     * 初始化默认模板目录
     */
    private initializeDefaultDirs(): void {
        // 内置模板目录
        const builtinDir = path.resolve(__dirname, '../../templates');
        if (fs.existsSync(builtinDir)) {
            this.templateDirs.push(builtinDir);
        }
        
        // npm 包模板目录
        const npmDir = path.resolve(__dirname, '../templates');
        if (fs.existsSync(npmDir)) {
            this.templateDirs.push(npmDir);
        }
    }
    
    /**
     * 添加自定义模板目录
     */
    addTemplateDir(dir: string): void {
        if (fs.existsSync(dir) && !this.templateDirs.includes(dir)) {
            this.templateDirs.push(dir);
            this.log(`添加模板目录: ${dir}`);
        }
    }
    
    /**
     * 发现并注册所有模板
     */
    async discover(): Promise<void> {
        this.templates.clear();
        
        for (const dir of this.templateDirs) {
            await this.discoverInDir(dir);
        }
        
        this.log(`发现 ${this.templates.size} 个模板`);
    }
    
    /**
     * 在目录中发现模板
     */
    private async discoverInDir(baseDir: string): Promise<void> {
        const categories = ['vue', 'react', 'flutter', 'common', 'custom'];
        
        for (const category of categories) {
            const categoryDir = path.join(baseDir, category);
            
            if (!fs.existsSync(categoryDir)) continue;
            
            const entries = fs.readdirSync(categoryDir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (!entry.isDirectory()) continue;
                
                const templateDir = path.join(categoryDir, entry.name);
                const configPath = path.join(templateDir, '_template.json');
                
                if (fs.existsSync(configPath)) {
                    try {
                        const metadata = this.loadTemplateConfig(configPath);
                        
                        // 验证模板
                        this.validateTemplate(metadata, templateDir);
                        
                        // 注册模板
                        const templateId = `${category}/${entry.name}`;
                        this.templates.set(templateId, {
                            id: templateId,
                            metadata,
                            path: templateDir,
                            source: baseDir
                        });
                        
                        this.log(`注册模板: ${templateId}`);
                    } catch (error) {
                        this.log(`加载模板失败 ${templateDir}: ${error}`);
                    }
                }
            }
        }
    }
    
    /**
     * 加载模板配置
     */
    private loadTemplateConfig(configPath: string): TemplateMetadata {
        const content = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    }
    
    /**
     * 验证模板配置
     */
    private validateTemplate(metadata: TemplateMetadata, templateDir: string): void {
        // 必填字段验证
        if (!metadata.id) throw new Error('缺少 id 字段');
        if (!metadata.name) throw new Error('缺少 name 字段');
        if (!metadata.files || metadata.files.length === 0) {
            throw new Error('缺少 files 字段');
        }
        
        // 验证文件存在
        for (const file of metadata.files) {
            const sourcePath = path.join(templateDir, file.source);
            if (!fs.existsSync(sourcePath)) {
                throw new Error(`模板文件不存在: ${file.source}`);
            }
        }
    }
    
    /**
     * 获取所有模板
     */
    getAll(): RegisteredTemplate[] {
        return Array.from(this.templates.values());
    }
    
    /**
     * 按分类获取模板
     */
    getByCategory(category: TemplateCategory): RegisteredTemplate[] {
        return this.getAll().filter(t => 
            t.metadata.category === category
        );
    }
    
    /**
     * 按标签获取模板
     */
    getByTags(tags: string[]): RegisteredTemplate[] {
        return this.getAll().filter(t => 
            tags.some(tag => t.metadata.tags.includes(tag))
        );
    }
    
    /**
     * 获取单个模板
     */
    get(id: string): RegisteredTemplate | undefined {
        return this.templates.get(id);
    }
    
    /**
     * 搜索模板
     */
    search(query: string): RegisteredTemplate[] {
        const normalizedQuery = query.toLowerCase();
        
        return this.getAll().filter(t => 
            t.metadata.name.toLowerCase().includes(normalizedQuery) ||
            t.metadata.description.toLowerCase().includes(normalizedQuery) ||
            t.metadata.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
        );
    }
    
    private log(message: string): void {
        this.logger?.log(message);
    }
}

/**
 * 已注册的模板
 */
interface RegisteredTemplate {
    id: string;
    metadata: TemplateMetadata;
    path: string;
    source: string;  // 来源目录
}
```

### 4.2 模板渲染器

```typescript
/**
 * 模板渲染器
 */
class TemplateRenderer {
    private helpers: RenderHelpers;
    
    constructor() {
        this.helpers = this.createHelpers();
    }
    
    /**
     * 渲染模板内容
     */
    render(template: string, context: RenderContext): string {
        let result = template;
        
        // 1. 处理条件渲染 {{#if condition}}...{{/if}}
        result = this.processConditionals(result, context);
        
        // 2. 处理循环渲染 {{#each items}}...{{/each}}
        result = this.processLoops(result, context);
        
        // 3. 处理变量替换 {{variable}}
        result = this.processVariables(result, context);
        
        // 4. 处理辅助函数 {{helper variable}}
        result = this.processHelpers(result, context);
        
        return result;
    }
    
    /**
     * 渲染文件路径
     */
    renderPath(pathTemplate: string, context: RenderContext): string {
        return this.processVariables(pathTemplate, context);
    }
    
    /**
     * 处理条件渲染
     */
    private processConditionals(template: string, context: RenderContext): string {
        const conditionalRegex = /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
        
        return template.replace(conditionalRegex, (match, condition, content) => {
            const result = this.evaluateCondition(condition.trim(), context);
            return result ? content : '';
        });
    }
    
    /**
     * 处理循环渲染
     */
    private processLoops(template: string, context: RenderContext): string {
        const loopRegex = /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
        
        return template.replace(loopRegex, (match, arrayName, content) => {
            const array = this.getValue(arrayName.trim(), context);
            
            if (!Array.isArray(array)) return '';
            
            return array.map((item, index) => {
                const itemContext: RenderContext = {
                    ...context,
                    params: {
                        ...context.params,
                        $item: item,
                        $index: index,
                        $first: index === 0,
                        $last: index === array.length - 1
                    }
                };
                return this.render(content, itemContext);
            }).join('');
        });
    }
    
    /**
     * 处理变量替换
     */
    private processVariables(template: string, context: RenderContext): string {
        const variableRegex = /\{\{([^#/}][^}]*)\}\}/g;
        
        return template.replace(variableRegex, (match, expression) => {
            const trimmed = expression.trim();
            
            // 检查是否是辅助函数调用
            if (trimmed.includes(' ')) {
                return match; // 留给 processHelpers 处理
            }
            
            const value = this.getValue(trimmed, context);
            return value !== undefined ? String(value) : '';
        });
    }
    
    /**
     * 处理辅助函数
     */
    private processHelpers(template: string, context: RenderContext): string {
        const helperRegex = /\{\{(\w+)\s+([^}]+)\}\}/g;
        
        return template.replace(helperRegex, (match, helperName, argExpr) => {
            const helper = (this.helpers as any)[helperName];
            
            if (typeof helper !== 'function') {
                return match;
            }
            
            const argValue = this.getValue(argExpr.trim(), context);
            return helper(argValue);
        });
    }
    
    /**
     * 获取值
     */
    private getValue(path: string, context: RenderContext): unknown {
        const parts = path.split('.');
        let current: unknown = context.params;
        
        // 特殊前缀处理
        if (parts[0] === 'project') {
            current = context.project;
            parts.shift();
        } else if (parts[0] === 'params') {
            parts.shift();
        }
        
        for (const part of parts) {
            if (current === null || current === undefined) return undefined;
            current = (current as Record<string, unknown>)[part];
        }
        
        return current;
    }
    
    /**
     * 评估条件表达式
     */
    private evaluateCondition(condition: string, context: RenderContext): boolean {
        try {
            // 创建安全的评估环境
            const fn = new Function('params', 'project', `return ${condition}`);
            return Boolean(fn(context.params, context.project));
        } catch {
            return false;
        }
    }
    
    /**
     * 创建辅助函数
     */
    private createHelpers(): RenderHelpers {
        return {
            camelCase(str: string): string {
                return str
                    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
                    .replace(/^./, c => c.toLowerCase());
            },
            
            pascalCase(str: string): string {
                return str
                    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
                    .replace(/^./, c => c.toUpperCase());
            },
            
            kebabCase(str: string): string {
                return str
                    .replace(/([a-z])([A-Z])/g, '$1-$2')
                    .replace(/[\s_]+/g, '-')
                    .toLowerCase();
            },
            
            snakeCase(str: string): string {
                return str
                    .replace(/([a-z])([A-Z])/g, '$1_$2')
                    .replace(/[-\s]+/g, '_')
                    .toLowerCase();
            },
            
            capitalize(str: string): string {
                return str.charAt(0).toUpperCase() + str.slice(1);
            },
            
            date(format?: string): string {
                const now = new Date();
                if (!format) return now.toISOString().split('T')[0];
                
                return format
                    .replace('YYYY', String(now.getFullYear()))
                    .replace('MM', String(now.getMonth() + 1).padStart(2, '0'))
                    .replace('DD', String(now.getDate()).padStart(2, '0'));
            },
            
            uuid(): string {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        };
    }
}
```

### 4.3 模板应用器

```typescript
/**
 * 模板应用器
 */
class TemplateApplier {
    private renderer: TemplateRenderer;
    private logger?: Logger;
    
    constructor(logger?: Logger) {
        this.renderer = new TemplateRenderer();
        this.logger = logger;
    }
    
    /**
     * 应用模板到项目
     */
    async apply(options: ApplyOptions): Promise<ApplyResult> {
        const { template, targetPath, params, overwrite = false } = options;
        
        const result: ApplyResult = {
            success: true,
            createdFiles: [],
            skippedFiles: [],
            errors: [],
            postActions: []
        };
        
        // 构建渲染上下文
        const context: RenderContext = {
            params: {
                ...this.getDefaultParams(template.metadata),
                ...params
            },
            project: {
                name: path.basename(targetPath),
                path: targetPath,
                type: template.metadata.category
            },
            helpers: this.renderer['helpers']
        };
        
        // 验证必填参数
        const validationErrors = this.validateParams(template.metadata.parameters, context.params);
        if (validationErrors.length > 0) {
            return {
                ...result,
                success: false,
                errors: validationErrors
            };
        }
        
        // 处理每个模板文件
        for (const fileConfig of template.metadata.files) {
            try {
                const fileResult = await this.processFile(
                    template.path,
                    fileConfig,
                    targetPath,
                    context,
                    overwrite
                );
                
                if (fileResult.created) {
                    result.createdFiles.push(fileResult.path);
                } else if (fileResult.skipped) {
                    result.skippedFiles.push(fileResult.path);
                }
            } catch (error) {
                result.errors.push(`处理文件 ${fileConfig.source} 失败: ${error}`);
            }
        }
        
        // 处理后置操作
        if (template.metadata.postActions) {
            result.postActions = template.metadata.postActions
                .filter(action => this.shouldExecuteAction(action, context))
                .map(action => this.formatAction(action, context));
        }
        
        // 添加依赖提示
        if (template.metadata.dependencies || template.metadata.devDependencies) {
            result.postActions.push({
                type: 'message',
                content: this.formatDependencyMessage(template.metadata)
            });
        }
        
        result.success = result.errors.length === 0;
        
        return result;
    }
    
    /**
     * 处理单个文件
     */
    private async processFile(
        templateDir: string,
        config: TemplateFileConfig,
        targetPath: string,
        context: RenderContext,
        overwrite: boolean
    ): Promise<{ created: boolean; skipped: boolean; path: string }> {
        // 检查条件
        if (config.condition) {
            const shouldInclude = this.evaluateCondition(config.condition, context);
            if (!shouldInclude) {
                return { created: false, skipped: true, path: '' };
            }
        }
        
        // 读取模板文件
        const sourcePath = path.join(templateDir, config.source);
        const templateContent = fs.readFileSync(sourcePath, 'utf-8');
        
        // 渲染目标路径
        const renderedTarget = this.renderer.renderPath(config.target, context);
        const fullTargetPath = path.join(targetPath, renderedTarget);
        
        // 检查目标文件是否存在
        const exists = fs.existsSync(fullTargetPath);
        if (exists && !overwrite && config.action !== 'append' && config.action !== 'merge') {
            this.log(`跳过已存在文件: ${renderedTarget}`);
            return { created: false, skipped: true, path: renderedTarget };
        }
        
        // 渲染内容
        const renderedContent = this.renderer.render(templateContent, context);
        
        // 确保目录存在
        const targetDir = path.dirname(fullTargetPath);
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // 根据操作类型处理
        switch (config.action) {
            case 'append':
                const existingContent = exists 
                    ? fs.readFileSync(fullTargetPath, 'utf-8') 
                    : '';
                fs.writeFileSync(fullTargetPath, existingContent + '\n' + renderedContent);
                break;
                
            case 'merge':
                // JSON 文件合并
                if (fullTargetPath.endsWith('.json')) {
                    const merged = this.mergeJsonFiles(fullTargetPath, renderedContent);
                    fs.writeFileSync(fullTargetPath, merged);
                } else {
                    fs.writeFileSync(fullTargetPath, renderedContent);
                }
                break;
                
            default:
                fs.writeFileSync(fullTargetPath, renderedContent);
        }
        
        this.log(`创建文件: ${renderedTarget}`);
        return { created: true, skipped: false, path: renderedTarget };
    }
    
    /**
     * 获取默认参数值
     */
    private getDefaultParams(parameters: TemplateParameter[]): Record<string, unknown> {
        const defaults: Record<string, unknown> = {};
        
        for (const param of parameters) {
            if (param.default !== undefined) {
                defaults[param.name] = param.default;
            }
        }
        
        return defaults;
    }
    
    /**
     * 验证参数
     */
    private validateParams(
        parameters: TemplateParameter[],
        values: Record<string, unknown>
    ): string[] {
        const errors: string[] = [];
        
        for (const param of parameters) {
            const value = values[param.name];
            
            // 必填检查
            if (param.required && (value === undefined || value === '')) {
                errors.push(`参数 ${param.name} 是必填的`);
                continue;
            }
            
            if (value === undefined) continue;
            
            // 验证规则
            if (param.validate) {
                if (param.validate.pattern) {
                    const regex = new RegExp(param.validate.pattern);
                    if (!regex.test(String(value))) {
                        errors.push(`参数 ${param.name} 不符合格式要求`);
                    }
                }
                
                if (typeof value === 'string') {
                    if (param.validate.minLength && value.length < param.validate.minLength) {
                        errors.push(`参数 ${param.name} 长度不能小于 ${param.validate.minLength}`);
                    }
                    if (param.validate.maxLength && value.length > param.validate.maxLength) {
                        errors.push(`参数 ${param.name} 长度不能大于 ${param.validate.maxLength}`);
                    }
                }
                
                if (typeof value === 'number') {
                    if (param.validate.min && value < param.validate.min) {
                        errors.push(`参数 ${param.name} 不能小于 ${param.validate.min}`);
                    }
                    if (param.validate.max && value > param.validate.max) {
                        errors.push(`参数 ${param.name} 不能大于 ${param.validate.max}`);
                    }
                }
            }
        }
        
        return errors;
    }
    
    /**
     * 合并 JSON 文件
     */
    private mergeJsonFiles(existingPath: string, newContent: string): string {
        try {
            const existing = fs.existsSync(existingPath)
                ? JSON.parse(fs.readFileSync(existingPath, 'utf-8'))
                : {};
            const newData = JSON.parse(newContent);
            
            const merged = this.deepMerge(existing, newData);
            return JSON.stringify(merged, null, 2);
        } catch {
            return newContent;
        }
    }
    
    /**
     * 深度合并对象
     */
    private deepMerge(target: any, source: any): any {
        if (typeof source !== 'object' || source === null) return source;
        if (typeof target !== 'object' || target === null) return source;
        
        const result = Array.isArray(source) ? [...target] : { ...target };
        
        for (const key of Object.keys(source)) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                result[key] = this.deepMerge(result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    private evaluateCondition(condition: string, context: RenderContext): boolean {
        try {
            const fn = new Function('params', 'project', `return ${condition}`);
            return Boolean(fn(context.params, context.project));
        } catch {
            return true;
        }
    }
    
    private shouldExecuteAction(action: PostAction, context: RenderContext): boolean {
        if (!action.condition) return true;
        return this.evaluateCondition(action.condition, context);
    }
    
    private formatAction(action: PostAction, context: RenderContext): PostAction {
        return {
            ...action,
            content: this.renderer.render(action.content, context)
        };
    }
    
    private formatDependencyMessage(metadata: TemplateMetadata): string {
        const parts: string[] = ['需要安装以下依赖:'];
        
        if (metadata.dependencies) {
            parts.push('\n生产依赖:');
            parts.push('npm install ' + Object.keys(metadata.dependencies).join(' '));
        }
        
        if (metadata.devDependencies) {
            parts.push('\n开发依赖:');
            parts.push('npm install -D ' + Object.keys(metadata.devDependencies).join(' '));
        }
        
        return parts.join('\n');
    }
    
    private log(message: string): void {
        this.logger?.log(message);
    }
}

/**
 * 应用选项
 */
interface ApplyOptions {
    template: RegisteredTemplate;
    targetPath: string;
    params: Record<string, unknown>;
    overwrite?: boolean;
}

/**
 * 应用结果
 */
interface ApplyResult {
    success: boolean;
    createdFiles: string[];
    skippedFiles: string[];
    errors: string[];
    postActions: PostAction[];
}
```

---

## 5. MCP 工具集成

### 5.1 list_templates 工具

```typescript
/**
 * 列出所有可用模板
 */
export async function listTemplates(args: {
    category?: string;
    tags?: string[];
    search?: string;
}): Promise<{ content: Array<{ type: string; text: string }> }> {
    const logger = new ConsoleLogger();
    const registry = new TemplateRegistry(logger);
    
    try {
        await registry.discover();
        
        let templates = registry.getAll();
        
        // 按分类过滤
        if (args.category) {
            templates = templates.filter(t => 
                t.metadata.category === args.category
            );
        }
        
        // 按标签过滤
        if (args.tags && args.tags.length > 0) {
            templates = templates.filter(t =>
                args.tags!.some(tag => t.metadata.tags.includes(tag))
            );
        }
        
        // 搜索
        if (args.search) {
            templates = registry.search(args.search);
        }
        
        // 格式化输出
        const result = templates.map(t => ({
            id: t.id,
            name: t.metadata.name,
            description: t.metadata.description,
            category: t.metadata.category,
            tags: t.metadata.tags,
            parameters: t.metadata.parameters.map(p => ({
                name: p.name,
                type: p.type,
                required: p.required,
                default: p.default
            }))
        }));
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    count: result.length,
                    templates: result
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`列出模板失败: ${error}`);
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

### 5.2 apply_template 工具

```typescript
/**
 * 应用模板到项目
 */
export async function applyTemplate(args: {
    templateId: string;
    targetPath: string;
    params?: Record<string, unknown>;
    overwrite?: boolean;
}): Promise<{ content: Array<{ type: string; text: string }> }> {
    const logger = new ConsoleLogger();
    const registry = new TemplateRegistry(logger);
    const applier = new TemplateApplier(logger);
    
    try {
        await registry.discover();
        
        // 获取模板
        const template = registry.get(args.templateId);
        if (!template) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: `模板不存在: ${args.templateId}`,
                        availableTemplates: registry.getAll().map(t => t.id)
                    }, null, 2)
                }]
            };
        }
        
        // 检查目标路径
        if (!fs.existsSync(args.targetPath)) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: `目标路径不存在: ${args.targetPath}`
                    }, null, 2)
                }]
            };
        }
        
        // 应用模板
        const result = await applier.apply({
            template,
            targetPath: args.targetPath,
            params: args.params || {},
            overwrite: args.overwrite
        });
        
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: result.success,
                    template: {
                        id: template.id,
                        name: template.metadata.name
                    },
                    createdFiles: result.createdFiles,
                    skippedFiles: result.skippedFiles,
                    errors: result.errors,
                    postActions: result.postActions.map(a => ({
                        type: a.type,
                        content: a.content
                    }))
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`应用模板失败: ${error}`);
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

## 6. 模板配置示例

### 6.1 Vue API Layer 模板

```json
{
    "id": "api-layer",
    "name": "Vue API 层封装",
    "description": "Axios 请求封装，包含拦截器、Mock 和类型定义",
    "version": "1.0.0",
    "category": "vue",
    "tags": ["api", "axios", "typescript"],
    "author": {
        "name": "MTA 工作室"
    },
    "applicableWhen": {
        "frameworks": ["Vue 3", "Vue"],
        "languages": ["TypeScript"]
    },
    "parameters": [
        {
            "name": "baseUrl",
            "type": "string",
            "description": "API 基础路径",
            "default": "/api",
            "required": false
        },
        {
            "name": "timeout",
            "type": "number",
            "description": "请求超时时间（毫秒）",
            "default": 10000,
            "required": false
        },
        {
            "name": "useMock",
            "type": "boolean",
            "description": "是否启用 Mock",
            "default": true,
            "required": false
        }
    ],
    "files": [
        {
            "source": "request.ts.tpl",
            "target": "src/api/request.ts"
        },
        {
            "source": "types.ts.tpl",
            "target": "src/api/types.ts"
        },
        {
            "source": "index.ts.tpl",
            "target": "src/api/index.ts"
        },
        {
            "source": "mock/index.ts.tpl",
            "target": "src/api/mock/index.ts",
            "condition": "params.useMock"
        }
    ],
    "dependencies": {
        "axios": "^1.6.0"
    },
    "devDependencies": {
        "mockjs": "^1.1.0"
    },
    "postActions": [
        {
            "type": "message",
            "content": "✅ API 层已创建，请在 src/api/modules/ 中添加具体接口"
        }
    ]
}
```

### 6.2 Vue Form 组件模板

```json
{
    "id": "form-component",
    "name": "Vue 表单组件",
    "description": "Element Plus 表单组件模板，包含验证和提交",
    "version": "1.0.0",
    "category": "vue",
    "tags": ["form", "component", "element-plus"],
    "parameters": [
        {
            "name": "name",
            "type": "string",
            "description": "组件名称（PascalCase）",
            "required": true,
            "validate": {
                "pattern": "^[A-Z][a-zA-Z]+$"
            }
        },
        {
            "name": "fields",
            "type": "multiselect",
            "description": "表单字段",
            "options": [
                { "value": "input", "label": "文本输入框" },
                { "value": "select", "label": "下拉选择" },
                { "value": "date", "label": "日期选择" },
                { "value": "switch", "label": "开关" },
                { "value": "upload", "label": "文件上传" }
            ],
            "default": ["input", "select"]
        },
        {
            "name": "useI18n",
            "type": "boolean",
            "description": "是否使用国际化",
            "default": true
        }
    ],
    "files": [
        {
            "source": "form.vue.tpl",
            "target": "src/components/{{kebabCase name}}/{{pascalCase name}}.vue"
        },
        {
            "source": "types.ts.tpl",
            "target": "src/components/{{kebabCase name}}/types.ts"
        }
    ],
    "postActions": [
        {
            "type": "open-file",
            "content": "src/components/{{kebabCase name}}/{{pascalCase name}}.vue"
        }
    ]
}
```

---

## 7. 测试计划

### 7.1 单元测试

| 测试模块 | 测试用例 | 验收标准 |
|---------|---------|---------|
| TemplateRegistry | 模板发现 | 正确扫描所有模板目录 |
| TemplateRegistry | 模板验证 | 拒绝无效模板配置 |
| TemplateRenderer | 变量替换 | `{{name}}` 正确替换 |
| TemplateRenderer | 条件渲染 | `{{#if}}` 正确处理 |
| TemplateRenderer | 辅助函数 | `{{pascalCase name}}` 正确转换 |
| TemplateApplier | 文件创建 | 正确创建目标文件 |
| TemplateApplier | 参数验证 | 拒绝缺少必填参数 |

### 7.2 集成测试

| 场景 | 描述 | 验收标准 |
|------|------|---------|
| 应用 API 模板 | 完整应用 api-layer 模板 | 所有文件正确生成 |
| 应用表单模板 | 应用 form-component 模板 | 组件文件正确生成 |
| 条件文件 | useMock=false | 不生成 mock 文件 |
| 文件覆盖 | overwrite=false | 跳过已存在文件 |

---

## 8. 实施步骤

### Step 1: 创建基础类型和接口（0.5天）

1. 定义 TemplateMetadata 等类型
2. 创建 TemplateRegistry 类结构
3. 创建 TemplateRenderer 类结构

### Step 2: 实现模板注册表（0.5天）

1. 模板目录发现逻辑
2. 模板配置加载
3. 模板验证

### Step 3: 实现模板渲染器（0.5天）

1. 变量替换
2. 条件渲染
3. 辅助函数

### Step 4: 实现模板应用器（0.5天）

1. 文件处理逻辑
2. 参数验证
3. 后置操作

### Step 5: MCP 工具集成（0.5天）

1. list_templates 工具
2. apply_template 工具
3. 工具注册

### Step 6: 迁移现有模板（0.5天）

1. 转换现有模板格式
2. 添加 _template.json 配置
3. 测试验证

---

**文档版本**: v1.0  
**最后更新**: 2026-01-09
