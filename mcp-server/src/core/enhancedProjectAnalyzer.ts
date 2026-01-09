/**
 * 增强版项目分析器（简化版）
 * 
 * 设计理念：只提供项目信息给 AI，不做决策
 * 整合模块化分析器，提供更精准的项目检测能力
 * 
 * @module core/enhancedProjectAnalyzer
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import glob from 'fast-glob';
import { ProjectFeatures, Logger } from './types.js';
import { 
    ProjectFeaturesExtended, 
    toBasicFeatures
} from './analyzers/types.js';
import { AnalyzerRegistry } from './analyzers/registry.js';

/**
 * 工作区文件夹接口
 */
export interface WorkspaceFolder {
    uri: { fsPath: string };
    name: string;
}

/**
 * 分析选项
 */
export interface AnalyzeOptions {
    /** 是否使用缓存 */
    useCache?: boolean;
}

/**
 * 增强分析结果
 * 
 * 只提供项目信息，不做权重计算或规范推荐
 */
export interface EnhancedAnalysisResult {
    /** 项目特征（扩展版） */
    features: ProjectFeaturesExtended;
    /** 基础特征（兼容版） */
    basicFeatures: ProjectFeatures;
    /** 是否来自缓存 */
    fromCache: boolean;
}

/**
 * 缓存条目
 */
interface CacheEntry {
    features: ProjectFeaturesExtended;
    fileHashes: Map<string, string>;
    timestamp: number;
}

/**
 * 增强版项目分析器
 */
export class EnhancedProjectAnalyzer {
    private registry: AnalyzerRegistry;
    private cache: Map<string, CacheEntry> = new Map();
    private cacheMaxAge = 5 * 60 * 1000; // 5 分钟

    constructor(private logger?: Logger) {
        this.registry = new AnalyzerRegistry();
    }

    /**
     * 分析项目
     */
    async analyze(
        workspaceFolder: WorkspaceFolder,
        options: AnalyzeOptions = {}
    ): Promise<EnhancedAnalysisResult> {
        const rootPath = workspaceFolder.uri.fsPath;
        const cacheKey = rootPath;

        this.log(`🔍 开始增强分析项目: ${workspaceFolder.name}`);

        // 检查缓存
        if (options.useCache !== false) {
            const cached = this.getCachedResult(cacheKey, rootPath);
            if (cached) {
                this.log(`📦 使用缓存结果`);
                return {
                    features: cached,
                    basicFeatures: toBasicFeatures(cached),
                    fromCache: true
                };
            }
        }

        // 执行分析
        const features = await this.analyzeProjectFeatures(rootPath);
        
        // 更新缓存
        this.updateCache(cacheKey, rootPath, features);

        this.log(`✅ 增强分析完成: ${features.projectType}`);

        return {
            features,
            basicFeatures: toBasicFeatures(features),
            fromCache: false
        };
    }

    /**
     * 分析项目特征
     */
    private async analyzeProjectFeatures(rootPath: string): Promise<ProjectFeaturesExtended> {
        // 初始化特征
        const features: ProjectFeaturesExtended = {
            frameworks: [],
            languages: [],
            tools: [],
            keywords: [],
            projectType: 'unknown'
        };

        // 1. 优先检测 Flutter 项目
        const pubspecPath = path.join(rootPath, 'pubspec.yaml');
        if (fs.existsSync(pubspecPath)) {
            this.analyzeFlutterProject(pubspecPath, features);
            features.projectType = 'flutter';
            return features;
        }

        // 2. 分析 package.json
        const packageJsonPath = path.join(rootPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            this.analyzePackageJson(packageJsonPath, features);
        }

        // 3. 分析项目结构
        await this.analyzeProjectStructure(rootPath, features);

        // 4. 推断项目类型
        features.projectType = this.inferProjectType(features);

        return features;
    }

    /**
     * 分析 Flutter 项目
     */
    private analyzeFlutterProject(pubspecPath: string, features: ProjectFeaturesExtended): void {
        features.frameworks.push('Flutter');
        features.languages.push('Dart');

        try {
            const content = fs.readFileSync(pubspecPath, 'utf-8');
            
            // 状态管理
            if (content.includes('provider:')) features.keywords.push('state-management');
            if (content.includes('riverpod:')) features.keywords.push('state-management');
            if (content.includes('bloc:') || content.includes('flutter_bloc:')) features.keywords.push('state-management');
            
            // 国际化
            if (content.includes('flutter_localizations:') || content.includes('intl:')) {
                features.keywords.push('i18n');
            }
            
            // 路由
            if (content.includes('go_router:')) features.tools.push('GoRouter');
            
            // 网络
            if (content.includes('dio:')) features.tools.push('Dio');
            
        } catch (error) {
            this.log(`解析 pubspec.yaml 失败: ${error}`);
        }
    }

    /**
     * 分析 package.json
     */
    private analyzePackageJson(packageJsonPath: string, features: ProjectFeaturesExtended): void {
        try {
            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            const pkg = JSON.parse(content);
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

            // 前端框架
            if (allDeps['vue']) features.frameworks.push('Vue 3');
            if (allDeps['react']) features.frameworks.push('React');
            if (allDeps['@angular/core']) features.frameworks.push('Angular');
            if (allDeps['next']) features.frameworks.push('Next.js');
            if (allDeps['nuxt']) features.frameworks.push('Nuxt.js');

            // UI 库
            if (allDeps['element-plus']) features.tools.push('Element Plus');
            if (allDeps['ant-design-vue']) features.tools.push('Ant Design Vue');
            if (allDeps['antd']) features.tools.push('Ant Design');

            // 构建工具
            if (allDeps['vite']) features.tools.push('Vite');
            if (allDeps['webpack']) features.tools.push('Webpack');

            // 语言
            if (allDeps['typescript']) features.languages.push('TypeScript');

            // 状态管理
            if (allDeps['pinia']) features.keywords.push('state-management');
            if (allDeps['vuex']) features.keywords.push('state-management');
            if (allDeps['redux']) features.keywords.push('state-management');

            // 国际化
            if (allDeps['vue-i18n'] || allDeps['i18next']) features.keywords.push('i18n');

            // 其他工具
            if (allDeps['@logicflow/core']) features.tools.push('LogicFlow');
            if (allDeps['axios']) features.keywords.push('data-fetching');

        } catch (error) {
            this.log(`解析 package.json 失败: ${error}`);
        }
    }

    /**
     * 分析项目结构
     */
    private async analyzeProjectStructure(rootPath: string, features: ProjectFeaturesExtended): Promise<void> {
        try {
            const patterns = ['**/*.{vue,tsx,ts,js,jsx}'];
            const files = await glob(patterns, {
                cwd: rootPath,
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
                onlyFiles: true
            });

            // 检测文件类型
            if (files.some(f => f.endsWith('.vue'))) {
                if (!features.frameworks.includes('Vue 3') && !features.frameworks.includes('Vue')) {
                    features.frameworks.push('Vue');
                }
            }
            if (files.some(f => f.endsWith('.tsx'))) {
                if (!features.frameworks.includes('React')) {
                    features.frameworks.push('React');
                }
            }
            if (files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
                if (!features.languages.includes('TypeScript')) {
                    features.languages.push('TypeScript');
                }
            }

            // 检测国际化
            if (files.some(f => f.includes('/locales/') || f.includes('/i18n/'))) {
                if (!features.keywords.includes('i18n')) {
                    features.keywords.push('i18n');
                }
            }

        } catch (error) {
            this.log(`分析项目结构失败: ${error}`);
        }
    }

    /**
     * 推断项目类型
     */
    private inferProjectType(features: ProjectFeaturesExtended): string {
        const frameworks = features.frameworks.map(f => f.toLowerCase());

        if (frameworks.some(f => f.includes('nuxt'))) return 'nuxt-app';
        if (frameworks.some(f => f.includes('vue'))) return 'vue-app';
        if (frameworks.some(f => f.includes('next'))) return 'next-app';
        if (frameworks.some(f => f.includes('react'))) return 'react-app';
        if (frameworks.some(f => f.includes('flutter'))) return 'flutter-app';
        if (features.languages.includes('TypeScript')) return 'typescript-project';
        
        return 'unknown';
    }

    // ==================== 缓存 ====================

    /**
     * 获取缓存结果
     */
    private getCachedResult(cacheKey: string, rootPath: string): ProjectFeaturesExtended | null {
        const entry = this.cache.get(cacheKey);
        if (!entry) return null;

        // 检查过期
        if (Date.now() - entry.timestamp > this.cacheMaxAge) {
            this.cache.delete(cacheKey);
            return null;
        }

        // 检查文件变化
        if (this.checkFilesChanged(rootPath, entry.fileHashes)) {
            this.cache.delete(cacheKey);
            return null;
        }

        return entry.features;
    }

    /**
     * 更新缓存
     */
    private updateCache(cacheKey: string, rootPath: string, features: ProjectFeaturesExtended): void {
        const fileHashes = this.calculateFileHashes(rootPath);
        
        this.cache.set(cacheKey, {
            features,
            fileHashes,
            timestamp: Date.now()
        });
    }

    /**
     * 计算关键文件哈希
     */
    private calculateFileHashes(rootPath: string): Map<string, string> {
        const hashes = new Map<string, string>();
        const keyFiles = ['package.json', 'pubspec.yaml', 'tsconfig.json'];

        for (const file of keyFiles) {
            const filePath = path.join(rootPath, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath);
                    const hash = crypto.createHash('md5').update(content).digest('hex');
                    hashes.set(file, hash);
                } catch {
                    // 忽略读取错误
                }
            }
        }

        return hashes;
    }

    /**
     * 检查文件是否变化
     */
    private checkFilesChanged(rootPath: string, oldHashes: Map<string, string>): boolean {
        const newHashes = this.calculateFileHashes(rootPath);
        
        if (newHashes.size !== oldHashes.size) return true;

        for (const [file, hash] of newHashes) {
            if (oldHashes.get(file) !== hash) return true;
        }

        return false;
    }

    /**
     * 清除缓存
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * 日志
     */
    private log(message: string): void {
        this.logger?.log(message);
    }
}

/**
 * 获取默认分析器实例
 */
export function getDefaultAnalyzer(logger?: Logger): EnhancedProjectAnalyzer {
    return new EnhancedProjectAnalyzer(logger);
}
