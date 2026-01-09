# R1: 项目检测与规范匹配算法设计

> **文档状态**: 详细设计  
> **关联需求**: R1 - 检测项目、匹配规范的算法  
> **创建日期**: 2026-01-09

---

## 1. 概述

### 1.1 目标

- 提高项目技术栈检测准确率至 **95%+**
- 支持更深层次的配置文件分析
- 实现动态权重的规范匹配系统
- 优化检测性能，支持大型项目

### 1.2 现状问题

| 问题 | 影响 | 解决方案 |
|------|------|---------|
| 仅分析 package.json 依赖名 | 无法识别具体配置和用法 | 增加配置文件深度解析 |
| 权重值硬编码 | 无法根据场景动态调整 | 实现动态权重系统 |
| 文件扫描效率低 | 大项目检测慢 | 引入缓存和并行扫描 |
| 缺少置信度评估 | 无法判断匹配质量 | 增加置信度评分 |

---

## 2. 架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    ProjectAnalyzer                           │
│  ┌─────────────┬─────────────┬─────────────┬──────────────┐ │
│  │PackageJson  │ConfigFile   │FileStructure│CodeContent   │ │
│  │Analyzer     │Analyzer     │Analyzer     │Analyzer      │ │
│  └─────────────┴─────────────┴─────────────┴──────────────┘ │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              FeatureAggregator                          │ │
│  │  - 特征去重与合并                                        │ │
│  │  - 置信度计算                                            │ │
│  │  - 项目类型推断                                          │ │
│  └─────────────────────────────────────────────────────────┘ │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              SmartMatcher                               │ │
│  │  - 动态权重计算                                          │ │
│  │  - Agent/规范匹配                                        │ │
│  │  - 结果排序与过滤                                        │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责

| 模块 | 职责 | 输入 | 输出 |
|------|------|------|------|
| `PackageJsonAnalyzer` | 分析 npm 依赖 | package.json 路径 | Partial<ProjectFeatures> |
| `ConfigFileAnalyzer` | 分析配置文件 | 配置文件路径 | Partial<ProjectFeatures> |
| `FileStructureAnalyzer` | 分析目录结构 | 项目根路径 | Partial<ProjectFeatures> |
| `CodeContentAnalyzer` | 分析代码内容 | 源文件列表 | Partial<ProjectFeatures> |
| `FeatureAggregator` | 聚合特征 | 多个 Partial<ProjectFeatures> | ProjectFeatures |
| `SmartMatcher` | 匹配规范 | ProjectFeatures + 规范列表 | MatchResult[] |

---

## 3. 详细设计

### 3.0 ⚠️ 兼容性要求

> **强制要求**：新设计必须向后兼容现有类型定义

**现有类型**（`mcp-server/src/core/types.ts`）：

```typescript
// 现有接口 - 不可破坏
interface ProjectFeatures {
    frameworks: string[];
    languages: string[];
    tools: string[];
    keywords: string[];
    projectType: string;
}
```

**兼容策略**：
1. **扩展而非替换**：创建 `ProjectFeaturesExtended` 继承 `ProjectFeatures`
2. **运行时转换**：提供 `toBasicFeatures()` 方法转换为基础类型
3. **可选字段**：新增字段都是可选的，不影响现有代码

### 3.1 类型定义

```typescript
// ============= 基础类型 =============

/**
 * 项目特征（增强版）
 * 继承自现有 ProjectFeatures，保持向后兼容
 */
interface ProjectFeaturesExtended extends ProjectFeatures {
    // 继承自 ProjectFeatures:
    // frameworks: string[];
    // languages: string[];
    // tools: string[];
    // keywords: string[];
    // projectType: string;
    
    // === 新增扩展字段（全部可选） ===
    
    // 基础信息
    projectName?: string;
    projectPath?: string;
    
    // 增强技术栈信息
    frameworksDetail?: FrameworkInfo[];
    languagesDetail?: LanguageInfo[];
    toolsDetail?: ToolInfo[];
    
    // 置信度评分 (0-1)
    confidence?: number;
    
    // 检测元数据
    metadata?: {
        analyzedAt: Date;
        analyzers: string[];
        duration: number;
    };
}

/**
 * 转换为基础类型（兼容现有代码）
 */
function toBasicFeatures(extended: ProjectFeaturesExtended): ProjectFeatures {
    return {
        frameworks: extended.frameworks,
        languages: extended.languages,
        tools: extended.tools,
        keywords: extended.keywords,
        projectType: extended.projectType
    };
}
        duration: number;
    };
}

type ProjectType = 
    | 'vue3' | 'vue2' | 'react' | 'angular' | 'svelte' | 'solid'
    | 'nextjs' | 'nuxtjs' | 'remix' | 'astro'
    | 'flutter' | 'react-native' | 'ionic'
    | 'electron' | 'tauri'
    | 'express' | 'nestjs' | 'koa' | 'fastify'
    | 'miniprogram' | 'uniapp' | 'taro'
    | 'typescript' | 'javascript' | 'python' | 'java' | 'go'
    | 'monorepo' | 'library' | 'cli'
    | 'unknown';

/**
 * 框架信息
 */
interface FrameworkInfo {
    name: string;
    version?: string;
    confidence: number;  // 识别置信度
    source: 'package.json' | 'config' | 'code' | 'structure';
}

/**
 * 语言信息
 */
interface LanguageInfo {
    name: string;
    version?: string;
    isPrimary: boolean;
    fileCount?: number;
}

/**
 * 工具信息
 */
interface ToolInfo {
    name: string;
    category: 'build' | 'ui' | 'style' | 'test' | 'lint' | 'other';
    version?: string;
    config?: Record<string, unknown>;
}

// ============= 分析器接口 =============

/**
 * 分析器接口
 */
interface Analyzer<T = Partial<ProjectFeatures>> {
    readonly name: string;
    readonly priority: number;  // 优先级，数字越小越先执行
    
    /**
     * 检查是否可以分析
     */
    canAnalyze(projectPath: string): boolean;
    
    /**
     * 执行分析
     */
    analyze(projectPath: string): Promise<T>;
}

/**
 * 分析器注册表
 */
interface AnalyzerRegistry {
    register(analyzer: Analyzer): void;
    unregister(name: string): void;
    getAnalyzers(): Analyzer[];
}

// ============= 匹配器类型 =============

/**
 * 匹配结果
 */
interface MatchResult {
    targetId: string;        // Agent ID 或规范 URI
    targetType: 'agent' | 'standard';
    score: number;           // 原始分数
    normalizedScore: number; // 归一化分数 (0-1)
    confidence: number;      // 置信度 (0-1)
    
    matchDetails: {
        frameworkMatches: MatchDetail[];
        toolMatches: MatchDetail[];
        languageMatches: MatchDetail[];
        keywordMatches: MatchDetail[];
    };
    
    recommendation: 'strongly' | 'recommended' | 'optional' | 'low';
}

interface MatchDetail {
    feature: string;      // 项目特征
    target: string;       // 匹配的目标特征
    weight: number;       // 权重
    contribution: number; // 对总分的贡献
}

/**
 * 权重配置
 */
interface WeightConfig {
    base: {
        framework: number;
        tool: number;
        language: number;
        keyword: number;
        tag: number;
    };
    
    // 场景调整因子
    scenarioFactors: Record<string, Record<string, number>>;
    
    // 项目类型调整因子
    projectTypeFactors: Record<ProjectType, Record<string, number>>;
}
```

### 3.2 配置文件分析器设计

```typescript
/**
 * Vite 配置分析器
 */
class ViteConfigAnalyzer implements Analyzer {
    readonly name = 'ViteConfigAnalyzer';
    readonly priority = 10;
    
    canAnalyze(projectPath: string): boolean {
        const configFiles = [
            'vite.config.ts',
            'vite.config.js',
            'vite.config.mjs'
        ];
        return configFiles.some(f => 
            fs.existsSync(path.join(projectPath, f))
        );
    }
    
    async analyze(projectPath: string): Promise<Partial<ProjectFeatures>> {
        const features: Partial<ProjectFeatures> = {
            tools: [],
            frameworks: [],
            keywords: []
        };
        
        const configContent = this.readConfigFile(projectPath);
        
        // 检测 Vue 插件
        if (configContent.includes('@vitejs/plugin-vue')) {
            features.frameworks!.push({
                name: 'Vue 3',
                confidence: 0.95,
                source: 'config'
            });
        }
        
        // 检测 React 插件
        if (configContent.includes('@vitejs/plugin-react')) {
            features.frameworks!.push({
                name: 'React',
                confidence: 0.95,
                source: 'config'
            });
        }
        
        // 检测 Svelte 插件
        if (configContent.includes('@sveltejs/vite-plugin-svelte')) {
            features.frameworks!.push({
                name: 'Svelte',
                confidence: 0.95,
                source: 'config'
            });
        }
        
        // 检测 SSR 配置
        if (configContent.includes('ssr:')) {
            features.keywords!.push('ssr');
        }
        
        // 检测 PWA 插件
        if (configContent.includes('vite-plugin-pwa')) {
            features.keywords!.push('pwa');
        }
        
        // 检测自动导入插件
        if (configContent.includes('unplugin-auto-import')) {
            features.keywords!.push('auto-import');
        }
        
        // 检测组件自动注册
        if (configContent.includes('unplugin-vue-components')) {
            features.keywords!.push('auto-components');
        }
        
        return features;
    }
    
    private readConfigFile(projectPath: string): string {
        const configFiles = [
            'vite.config.ts',
            'vite.config.js',
            'vite.config.mjs'
        ];
        
        for (const file of configFiles) {
            const filePath = path.join(projectPath, file);
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf-8');
            }
        }
        
        return '';
    }
}

/**
 * TypeScript 配置分析器
 */
class TsConfigAnalyzer implements Analyzer {
    readonly name = 'TsConfigAnalyzer';
    readonly priority = 15;
    
    canAnalyze(projectPath: string): boolean {
        return fs.existsSync(path.join(projectPath, 'tsconfig.json'));
    }
    
    async analyze(projectPath: string): Promise<Partial<ProjectFeatures>> {
        const features: Partial<ProjectFeatures> = {
            languages: [],
            keywords: []
        };
        
        try {
            const tsconfigPath = path.join(projectPath, 'tsconfig.json');
            const content = fs.readFileSync(tsconfigPath, 'utf-8');
            const tsconfig = JSON.parse(content);
            
            // 添加 TypeScript 语言
            features.languages!.push({
                name: 'TypeScript',
                isPrimary: true
            });
            
            // 检测严格模式
            if (tsconfig.compilerOptions?.strict) {
                features.keywords!.push('typescript-strict');
            }
            
            // 检测装饰器（NestJS、Angular）
            if (tsconfig.compilerOptions?.experimentalDecorators) {
                features.keywords!.push('decorators');
            }
            
            // 检测 Vue/React JSX
            const jsx = tsconfig.compilerOptions?.jsx;
            if (jsx === 'preserve') {
                features.keywords!.push('vue-jsx');
            } else if (jsx === 'react-jsx' || jsx === 'react-jsxdev') {
                features.keywords!.push('react-jsx');
            }
            
            // 检测路径别名
            if (tsconfig.compilerOptions?.paths) {
                features.keywords!.push('path-alias');
            }
            
        } catch (error) {
            // 解析失败，忽略
        }
        
        return features;
    }
}

/**
 * ESLint 配置分析器
 */
class EslintConfigAnalyzer implements Analyzer {
    readonly name = 'EslintConfigAnalyzer';
    readonly priority = 20;
    
    canAnalyze(projectPath: string): boolean {
        const configFiles = [
            '.eslintrc.js',
            '.eslintrc.cjs',
            '.eslintrc.json',
            'eslint.config.js',
            'eslint.config.mjs'
        ];
        return configFiles.some(f => 
            fs.existsSync(path.join(projectPath, f))
        );
    }
    
    async analyze(projectPath: string): Promise<Partial<ProjectFeatures>> {
        const features: Partial<ProjectFeatures> = {
            tools: [],
            keywords: []
        };
        
        const configContent = this.readConfigFile(projectPath);
        
        // 检测 Vue ESLint 插件
        if (configContent.includes('plugin:vue/') || 
            configContent.includes('eslint-plugin-vue')) {
            features.keywords!.push('eslint-vue');
        }
        
        // 检测 React ESLint 插件
        if (configContent.includes('plugin:react/') ||
            configContent.includes('eslint-plugin-react')) {
            features.keywords!.push('eslint-react');
        }
        
        // 检测 TypeScript ESLint
        if (configContent.includes('@typescript-eslint')) {
            features.keywords!.push('eslint-typescript');
        }
        
        // 检测 Prettier 集成
        if (configContent.includes('prettier') ||
            configContent.includes('eslint-config-prettier')) {
            features.keywords!.push('prettier');
        }
        
        features.tools!.push({
            name: 'ESLint',
            category: 'lint'
        });
        
        return features;
    }
    
    private readConfigFile(projectPath: string): string {
        const configFiles = [
            '.eslintrc.js',
            '.eslintrc.cjs',
            '.eslintrc.json',
            'eslint.config.js',
            'eslint.config.mjs'
        ];
        
        for (const file of configFiles) {
            const filePath = path.join(projectPath, file);
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf-8');
            }
        }
        
        return '';
    }
}
```

### 3.3 动态权重系统设计

```typescript
/**
 * 动态权重计算器
 */
class DynamicWeightCalculator {
    private config: WeightConfig;
    
    constructor(config?: Partial<WeightConfig>) {
        this.config = this.mergeWithDefaults(config);
    }
    
    /**
     * 根据上下文计算动态权重
     */
    calculateWeights(context: {
        projectType: ProjectType;
        scenario?: string;
        userIntent?: IntentType;
    }): Record<string, number> {
        const weights = { ...this.config.base };
        
        // 应用项目类型因子
        const projectFactor = this.config.projectTypeFactors[context.projectType];
        if (projectFactor) {
            Object.keys(weights).forEach(key => {
                if (projectFactor[key]) {
                    weights[key as keyof typeof weights] *= projectFactor[key];
                }
            });
        }
        
        // 应用场景因子
        if (context.scenario) {
            const scenarioFactor = this.config.scenarioFactors[context.scenario];
            if (scenarioFactor) {
                Object.keys(weights).forEach(key => {
                    if (scenarioFactor[key]) {
                        weights[key as keyof typeof weights] *= scenarioFactor[key];
                    }
                });
            }
        }
        
        // 根据用户意图调整
        if (context.userIntent) {
            this.adjustForIntent(weights, context.userIntent);
        }
        
        return weights;
    }
    
    private adjustForIntent(
        weights: Record<string, number>, 
        intent: IntentType
    ): void {
        switch (intent) {
            case 'create':
                // 创建时更关注框架和工具
                weights.framework *= 1.2;
                weights.tool *= 1.2;
                break;
            case 'fix':
                // 修复时更关注关键词（如 i18n、state-management）
                weights.keyword *= 1.5;
                break;
            case 'optimize':
                // 优化时关注工具和模式
                weights.tool *= 1.3;
                break;
            case 'refactor':
                // 重构时关注语言和模式
                weights.language *= 1.2;
                break;
        }
    }
    
    private mergeWithDefaults(config?: Partial<WeightConfig>): WeightConfig {
        const defaults: WeightConfig = {
            base: {
                framework: 10,
                tool: 8,
                language: 5,
                keyword: 3,
                tag: 2
            },
            scenarioFactors: {
                'form': { tool: 1.3, keyword: 1.2 },
                'table': { tool: 1.3, keyword: 1.2 },
                'api': { keyword: 1.5, language: 1.2 },
                'i18n': { keyword: 2.0 },
                'state-management': { keyword: 1.5 }
            },
            projectTypeFactors: {
                'vue3': { framework: 1.2, tool: 1.1 },
                'react': { framework: 1.2, tool: 1.1 },
                'flutter': { framework: 1.5, language: 1.3 },
                'nestjs': { framework: 1.3, keyword: 1.2 },
                // ... 其他项目类型
            } as Record<ProjectType, Record<string, number>>
        };
        
        return {
            ...defaults,
            ...config,
            base: { ...defaults.base, ...config?.base },
            scenarioFactors: { 
                ...defaults.scenarioFactors, 
                ...config?.scenarioFactors 
            },
            projectTypeFactors: {
                ...defaults.projectTypeFactors,
                ...config?.projectTypeFactors
            }
        };
    }
}
```

### 3.4 智能匹配器设计

```typescript
/**
 * 智能匹配器
 */
class SmartMatcher {
    private weightCalculator: DynamicWeightCalculator;
    private logger?: Logger;
    
    constructor(logger?: Logger) {
        this.weightCalculator = new DynamicWeightCalculator();
        this.logger = logger;
    }
    
    /**
     * 匹配规范
     */
    matchStandards(
        features: ProjectFeatures,
        availableStandards: StandardMetadata[],
        context?: MatchContext
    ): MatchResult[] {
        const weights = this.weightCalculator.calculateWeights({
            projectType: features.projectType,
            scenario: context?.scenario,
            userIntent: context?.intent
        });
        
        const results = availableStandards.map(standard => 
            this.calculateMatch(features, standard, weights)
        );
        
        // 过滤和排序
        return results
            .filter(r => r.score > 0)
            .sort((a, b) => b.normalizedScore - a.normalizedScore)
            .map(r => this.addRecommendation(r));
    }
    
    /**
     * 匹配 Agents
     */
    matchAgents(
        features: ProjectFeatures,
        availableAgents: AgentMetadata[],
        context?: MatchContext
    ): MatchResult[] {
        const weights = this.weightCalculator.calculateWeights({
            projectType: features.projectType,
            scenario: context?.scenario,
            userIntent: context?.intent
        });
        
        const results = availableAgents.map(agent => 
            this.calculateMatch(features, agent, weights)
        );
        
        return results
            .filter(r => r.score > 0)
            .sort((a, b) => b.normalizedScore - a.normalizedScore)
            .map(r => this.addRecommendation(r));
    }
    
    private calculateMatch(
        features: ProjectFeatures,
        target: StandardMetadata | AgentMetadata,
        weights: Record<string, number>
    ): MatchResult {
        const matchDetails: MatchResult['matchDetails'] = {
            frameworkMatches: [],
            toolMatches: [],
            languageMatches: [],
            keywordMatches: []
        };
        
        let totalScore = 0;
        let maxPossibleScore = 0;
        
        // 框架匹配
        features.frameworks.forEach(f => {
            maxPossibleScore += weights.framework;
            const targetFrameworks = this.getTargetFeatures(target, 'frameworks');
            
            for (const tf of targetFrameworks) {
                if (this.fuzzyMatch(f.name, tf)) {
                    const contribution = weights.framework * f.confidence;
                    totalScore += contribution;
                    matchDetails.frameworkMatches.push({
                        feature: f.name,
                        target: tf,
                        weight: weights.framework,
                        contribution
                    });
                    break;
                }
            }
        });
        
        // 工具匹配
        features.tools.forEach(t => {
            maxPossibleScore += weights.tool;
            const targetTools = this.getTargetFeatures(target, 'tools');
            
            for (const tt of targetTools) {
                if (this.fuzzyMatch(t.name, tt)) {
                    const contribution = weights.tool;
                    totalScore += contribution;
                    matchDetails.toolMatches.push({
                        feature: t.name,
                        target: tt,
                        weight: weights.tool,
                        contribution
                    });
                    break;
                }
            }
        });
        
        // 语言匹配
        features.languages.forEach(l => {
            const weight = l.isPrimary ? weights.language * 1.5 : weights.language;
            maxPossibleScore += weight;
            const targetLanguages = this.getTargetFeatures(target, 'languages');
            
            for (const tl of targetLanguages) {
                if (this.fuzzyMatch(l.name, tl)) {
                    totalScore += weight;
                    matchDetails.languageMatches.push({
                        feature: l.name,
                        target: tl,
                        weight,
                        contribution: weight
                    });
                    break;
                }
            }
        });
        
        // 关键词匹配
        features.keywords.forEach(k => {
            maxPossibleScore += weights.keyword;
            const targetKeywords = this.getTargetFeatures(target, 'keywords');
            
            for (const tk of targetKeywords) {
                if (this.fuzzyMatch(k, tk)) {
                    totalScore += weights.keyword;
                    matchDetails.keywordMatches.push({
                        feature: k,
                        target: tk,
                        weight: weights.keyword,
                        contribution: weights.keyword
                    });
                    break;
                }
            }
        });
        
        // 计算归一化分数和置信度
        const normalizedScore = maxPossibleScore > 0 
            ? totalScore / maxPossibleScore 
            : 0;
        
        const matchCount = 
            matchDetails.frameworkMatches.length +
            matchDetails.toolMatches.length +
            matchDetails.languageMatches.length +
            matchDetails.keywordMatches.length;
        
        const totalFeatures = 
            features.frameworks.length +
            features.tools.length +
            features.languages.length +
            features.keywords.length;
        
        const confidence = totalFeatures > 0 
            ? matchCount / totalFeatures 
            : 0;
        
        return {
            targetId: this.getTargetId(target),
            targetType: this.isAgent(target) ? 'agent' : 'standard',
            score: totalScore,
            normalizedScore,
            confidence,
            matchDetails,
            recommendation: 'optional' // 后续填充
        };
    }
    
    private fuzzyMatch(source: string, target: string): boolean {
        const s = source.toLowerCase().replace(/[^a-z0-9]/g, '');
        const t = target.toLowerCase().replace(/[^a-z0-9]/g, '');
        return s.includes(t) || t.includes(s);
    }
    
    private addRecommendation(result: MatchResult): MatchResult {
        if (result.normalizedScore >= 0.7) {
            result.recommendation = 'strongly';
        } else if (result.normalizedScore >= 0.5) {
            result.recommendation = 'recommended';
        } else if (result.normalizedScore >= 0.3) {
            result.recommendation = 'optional';
        } else {
            result.recommendation = 'low';
        }
        return result;
    }
    
    private getTargetFeatures(
        target: StandardMetadata | AgentMetadata,
        key: 'frameworks' | 'tools' | 'languages' | 'keywords'
    ): string[] {
        if ('applicableWhen' in target && target.applicableWhen) {
            return target.applicableWhen[key] || [];
        }
        if ('tags' in target) {
            return target.tags || [];
        }
        return [];
    }
    
    private getTargetId(target: StandardMetadata | AgentMetadata): string {
        return 'id' in target ? target.id : target.uri || '';
    }
    
    private isAgent(target: unknown): target is AgentMetadata {
        return typeof target === 'object' && target !== null && 'applicableWhen' in target;
    }
}

interface MatchContext {
    scenario?: string;
    intent?: IntentType;
    currentFile?: string;
    fileContent?: string;
}
```

---

## 4. 缓存策略

### 4.1 项目特征缓存

```typescript
/**
 * 项目特征缓存管理器
 */
class ProjectFeaturesCache {
    private cache: Map<string, CachedFeatures> = new Map();
    private readonly TTL = 30 * 60 * 1000; // 30 分钟
    
    /**
     * 获取缓存的特征
     */
    get(projectPath: string): ProjectFeatures | null {
        const cached = this.cache.get(projectPath);
        
        if (!cached) return null;
        
        // 检查是否过期
        if (Date.now() - cached.timestamp > this.TTL) {
            this.cache.delete(projectPath);
            return null;
        }
        
        // 检查文件是否有变化
        if (this.hasFileChanges(projectPath, cached.fileHashes)) {
            this.cache.delete(projectPath);
            return null;
        }
        
        return cached.features;
    }
    
    /**
     * 设置缓存
     */
    set(projectPath: string, features: ProjectFeatures): void {
        const fileHashes = this.computeFileHashes(projectPath);
        
        this.cache.set(projectPath, {
            features,
            timestamp: Date.now(),
            fileHashes
        });
    }
    
    /**
     * 清除缓存
     */
    clear(projectPath?: string): void {
        if (projectPath) {
            this.cache.delete(projectPath);
        } else {
            this.cache.clear();
        }
    }
    
    private hasFileChanges(
        projectPath: string, 
        oldHashes: Map<string, string>
    ): boolean {
        const keyFiles = [
            'package.json',
            'tsconfig.json',
            'vite.config.ts',
            'vite.config.js'
        ];
        
        for (const file of keyFiles) {
            const filePath = path.join(projectPath, file);
            if (fs.existsSync(filePath)) {
                const currentHash = this.hashFile(filePath);
                const oldHash = oldHashes.get(file);
                
                if (currentHash !== oldHash) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    private computeFileHashes(projectPath: string): Map<string, string> {
        const hashes = new Map<string, string>();
        const keyFiles = [
            'package.json',
            'tsconfig.json',
            'vite.config.ts',
            'vite.config.js'
        ];
        
        for (const file of keyFiles) {
            const filePath = path.join(projectPath, file);
            if (fs.existsSync(filePath)) {
                hashes.set(file, this.hashFile(filePath));
            }
        }
        
        return hashes;
    }
    
    private hashFile(filePath: string): string {
        const content = fs.readFileSync(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
    }
}

interface CachedFeatures {
    features: ProjectFeatures;
    timestamp: number;
    fileHashes: Map<string, string>;
}
```

---

## 5. 测试计划

### 5.1 单元测试

| 测试用例 | 描述 | 预期结果 |
|---------|------|---------|
| `ViteConfigAnalyzer.analyze` | 分析 Vite + Vue 配置 | 正确识别 Vue 3 框架 |
| `TsConfigAnalyzer.analyze` | 分析 TypeScript 配置 | 正确识别严格模式 |
| `DynamicWeightCalculator.calculateWeights` | 计算动态权重 | 根据项目类型调整权重 |
| `SmartMatcher.matchAgents` | 匹配 Agents | 返回按分数排序的结果 |
| `ProjectFeaturesCache.get` | 缓存命中 | 返回缓存的特征 |
| `ProjectFeaturesCache.get` | 文件变化后 | 返回 null |

### 5.2 集成测试

| 测试场景 | 描述 | 验收标准 |
|---------|------|---------|
| Vue 3 项目分析 | 分析完整 Vue 3 项目 | 识别 Vue 3、Vite、Element Plus |
| React 项目分析 | 分析完整 React 项目 | 识别 React、相关工具 |
| Flutter 项目分析 | 分析 Flutter 项目 | 识别 Flutter、Dart |
| Agent 匹配 | 为项目匹配 Agents | 返回相关度高的 Agents |

---

## 6. 实施步骤

### Step 1: 创建基础接口（0.5天）

1. 定义类型接口
2. 创建分析器注册表
3. 重构现有 SmartAgentMatcher

### Step 2: 实现配置文件分析器（1天）

1. ViteConfigAnalyzer
2. TsConfigAnalyzer
3. EslintConfigAnalyzer
4. 其他常见配置分析器

### Step 3: 实现动态权重系统（0.5天）

1. DynamicWeightCalculator
2. 权重配置化
3. 场景因子配置

### Step 4: 重构匹配算法（1天）

1. SmartMatcher 实现
2. 置信度计算
3. 推荐等级划分

### Step 5: 实现缓存系统（0.5天）

1. ProjectFeaturesCache
2. 文件变化检测
3. 缓存失效策略

### Step 6: 测试与优化（0.5天）

1. 单元测试
2. 集成测试
3. 性能优化

---

**文档版本**: v1.0  
**最后更新**: 2026-01-09
