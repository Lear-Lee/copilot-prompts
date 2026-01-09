/**
 * 分析器类型定义
 * 
 * 设计原则：
 * 1. 扩展而非替换现有 ProjectFeatures 接口
 * 2. 所有新增字段都是可选的
 * 3. 提供转换函数保持向后兼容
 */

import { ProjectFeatures } from '../types.js';

// ============= 基础类型 =============

/**
 * 项目类型枚举
 */
export type ProjectType = 
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
 * 框架详细信息
 */
export interface FrameworkInfo {
    name: string;
    version?: string;
    confidence: number;  // 识别置信度 0-1
    source: 'package.json' | 'config' | 'code' | 'structure';
}

/**
 * 语言详细信息
 */
export interface LanguageInfo {
    name: string;
    version?: string;
    isPrimary: boolean;
    fileCount?: number;
}

/**
 * 工具详细信息
 */
export interface ToolInfo {
    name: string;
    category: 'build' | 'ui' | 'style' | 'test' | 'lint' | 'other';
    version?: string;
    config?: Record<string, unknown>;
}

/**
 * 检测元数据
 */
export interface AnalysisMetadata {
    analyzedAt: Date;
    analyzers: string[];
    duration: number;
    cacheHit?: boolean;
}

/**
 * 项目特征（增强版）
 * 继承自现有 ProjectFeatures，保持向后兼容
 */
export interface ProjectFeaturesExtended extends ProjectFeatures {
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
    metadata?: AnalysisMetadata;
}

/**
 * 转换为基础类型（兼容现有代码）
 */
export function toBasicFeatures(extended: ProjectFeaturesExtended): ProjectFeatures {
    return {
        frameworks: extended.frameworks,
        languages: extended.languages,
        tools: extended.tools,
        keywords: extended.keywords,
        projectType: extended.projectType
    };
}

// ============= 分析器接口 =============

/**
 * 分析结果
 */
export interface AnalyzerResult {
    // 检测到的特征
    features: Partial<ProjectFeaturesExtended>;
    
    // 置信度 (0-1)
    confidence: number;
    
    // 分析器名称
    analyzerName: string;
    
    // 分析耗时(ms)
    duration: number;
    
    // 错误信息（如有）
    error?: string;
}

/**
 * 配置文件分析器接口
 */
export interface ConfigAnalyzer {
    /**
     * 分析器名称
     */
    readonly name: string;
    
    /**
     * 支持的配置文件名列表
     */
    readonly supportedFiles: string[];
    
    /**
     * 检查是否支持指定文件
     */
    supports(fileName: string): boolean;
    
    /**
     * 分析配置文件
     * @param filePath 配置文件绝对路径
     * @param content 文件内容（可选，避免重复读取）
     */
    analyze(filePath: string, content?: string): Promise<AnalyzerResult>;
}

/**
 * 分析器优先级
 */
export interface AnalyzerPriority {
    analyzer: ConfigAnalyzer;
    priority: number;  // 越大越优先
}

// ============= 权重系统 =============

/**
 * 匹配权重配置
 */
export interface MatchWeights {
    framework: number;
    tool: number;
    language: number;
    keyword: number;
    tag: number;
}

/**
 * 默认权重（与现有保持一致）
 */
export const DEFAULT_WEIGHTS: MatchWeights = {
    framework: 10,
    tool: 8,
    language: 5,
    keyword: 3,
    tag: 2
};

/**
 * 场景权重因子
 */
export interface ScenarioWeightFactors {
    scenario: string;
    factors: Partial<MatchWeights>;
}

/**
 * 项目类型权重因子
 */
export interface ProjectTypeWeightFactors {
    projectType: ProjectType;
    factors: Partial<MatchWeights>;
}

// ============= 匹配结果 =============

/**
 * 匹配详情
 */
export interface MatchDetails {
    frameworkMatches: string[];
    toolMatches: string[];
    languageMatches: string[];
    keywordMatches: string[];
    tagMatches: string[];
}

/**
 * 匹配结果
 */
export interface MatchResult {
    agentId: string;
    score: number;
    confidence: number;  // 0-1
    matchDetails: MatchDetails;
    recommendation: 'high' | 'medium' | 'low';
}

// ============= 缓存系统 =============

/**
 * 缓存条目
 */
export interface CacheEntry<T> {
    data: T;
    hash: string;
    timestamp: number;
    accessCount: number;
}

/**
 * 缓存配置
 */
export interface CacheConfig {
    maxSize: number;
    ttlMs: number;
    enableHashValidation: boolean;
}

/**
 * 默认缓存配置
 */
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
    maxSize: 50,
    ttlMs: 30 * 60 * 1000,  // 30分钟
    enableHashValidation: true
};
