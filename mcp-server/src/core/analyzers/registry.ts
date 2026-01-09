/**
 * 分析器注册表
 * 
 * 管理所有配置文件分析器，提供：
 * - 分析器注册和发现
 * - 根据文件名匹配分析器
 * - 执行分析并聚合结果
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
    ConfigAnalyzer, 
    AnalyzerResult, 
    AnalyzerPriority,
    ProjectFeaturesExtended 
} from './types.js';
import { ViteConfigAnalyzer } from './vite.js';
import { TsConfigAnalyzer } from './tsconfig.js';
import { EslintConfigAnalyzer } from './eslint.js';
import { Logger } from '../types.js';

/**
 * 分析器注册表
 */
export class AnalyzerRegistry {
    private analyzers: AnalyzerPriority[] = [];
    private logger?: Logger;
    
    constructor(logger?: Logger) {
        this.logger = logger;
        this.registerDefaultAnalyzers();
    }
    
    /**
     * 注册默认分析器
     */
    private registerDefaultAnalyzers(): void {
        // 按优先级注册分析器
        this.register(new ViteConfigAnalyzer(), 100);
        this.register(new TsConfigAnalyzer(), 90);
        this.register(new EslintConfigAnalyzer(), 80);
    }
    
    /**
     * 注册分析器
     */
    register(analyzer: ConfigAnalyzer, priority: number = 50): void {
        this.analyzers.push({ analyzer, priority });
        // 按优先级排序
        this.analyzers.sort((a, b) => b.priority - a.priority);
        this.log(`注册分析器: ${analyzer.name} (优先级: ${priority})`);
    }
    
    /**
     * 获取所有已注册的分析器
     */
    getAnalyzers(): ConfigAnalyzer[] {
        return this.analyzers.map(ap => ap.analyzer);
    }
    
    /**
     * 根据文件名查找匹配的分析器
     */
    findAnalyzer(fileName: string): ConfigAnalyzer | undefined {
        for (const { analyzer } of this.analyzers) {
            if (analyzer.supports(fileName)) {
                return analyzer;
            }
        }
        return undefined;
    }
    
    /**
     * 分析单个配置文件
     */
    async analyzeFile(filePath: string): Promise<AnalyzerResult | null> {
        const fileName = path.basename(filePath);
        const analyzer = this.findAnalyzer(fileName);
        
        if (!analyzer) {
            this.log(`没有找到匹配的分析器: ${fileName}`);
            return null;
        }
        
        this.log(`使用 ${analyzer.name} 分析: ${fileName}`);
        return analyzer.analyze(filePath);
    }
    
    /**
     * 分析项目目录中的所有配置文件
     */
    async analyzeDirectory(projectPath: string): Promise<AnalyzerResult[]> {
        const results: AnalyzerResult[] = [];
        const startTime = Date.now();
        
        // 获取所有支持的配置文件名
        const supportedFiles = new Set<string>();
        for (const { analyzer } of this.analyzers) {
            for (const file of analyzer.supportedFiles) {
                supportedFiles.add(file);
            }
        }
        
        // 扫描项目根目录
        const entries = fs.readdirSync(projectPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (!entry.isFile()) continue;
            
            // 检查是否是支持的配置文件
            if (supportedFiles.has(entry.name) || this.findAnalyzer(entry.name)) {
                const filePath = path.join(projectPath, entry.name);
                const result = await this.analyzeFile(filePath);
                
                if (result && !result.error) {
                    results.push(result);
                }
            }
        }
        
        this.log(`分析完成: ${results.length} 个配置文件, 耗时 ${Date.now() - startTime}ms`);
        
        return results;
    }
    
    /**
     * 聚合多个分析结果
     */
    aggregateResults(results: AnalyzerResult[]): ProjectFeaturesExtended {
        const aggregated: ProjectFeaturesExtended = {
            frameworks: [],
            languages: [],
            tools: [],
            keywords: [],
            projectType: 'unknown',
            frameworksDetail: [],
            languagesDetail: [],
            toolsDetail: [],
            confidence: 0,
            metadata: {
                analyzedAt: new Date(),
                analyzers: [],
                duration: 0
            }
        };
        
        let totalConfidence = 0;
        let totalDuration = 0;
        
        for (const result of results) {
            const features = result.features;
            
            // 合并 frameworks
            if (features.frameworks) {
                for (const fw of features.frameworks) {
                    if (!aggregated.frameworks.includes(fw)) {
                        aggregated.frameworks.push(fw);
                    }
                }
            }
            
            // 合并 languages
            if (features.languages) {
                for (const lang of features.languages) {
                    if (!aggregated.languages.includes(lang)) {
                        aggregated.languages.push(lang);
                    }
                }
            }
            
            // 合并 tools
            if (features.tools) {
                for (const tool of features.tools) {
                    if (!aggregated.tools.includes(tool)) {
                        aggregated.tools.push(tool);
                    }
                }
            }
            
            // 合并 keywords
            if (features.keywords) {
                for (const kw of features.keywords) {
                    if (!aggregated.keywords.includes(kw)) {
                        aggregated.keywords.push(kw);
                    }
                }
            }
            
            // 合并详细信息
            if (features.frameworksDetail) {
                aggregated.frameworksDetail!.push(...features.frameworksDetail);
            }
            if (features.languagesDetail) {
                aggregated.languagesDetail!.push(...features.languagesDetail);
            }
            if (features.toolsDetail) {
                aggregated.toolsDetail!.push(...features.toolsDetail);
            }
            
            // 累计置信度和时间
            totalConfidence += result.confidence;
            totalDuration += result.duration;
            aggregated.metadata!.analyzers.push(result.analyzerName);
        }
        
        // 计算平均置信度
        if (results.length > 0) {
            aggregated.confidence = totalConfidence / results.length;
        }
        aggregated.metadata!.duration = totalDuration;
        
        // 推断项目类型
        aggregated.projectType = this.inferProjectType(aggregated);
        
        return aggregated;
    }
    
    /**
     * 推断项目类型
     */
    private inferProjectType(features: ProjectFeaturesExtended): string {
        const { frameworks, tools } = features;
        
        // Vue 3 项目
        if (frameworks.includes('Vue 3')) {
            if (frameworks.includes('Nuxt.js')) return 'nuxtjs';
            return 'vue3';
        }
        
        // Vue 2 项目
        if (frameworks.includes('Vue 2') || frameworks.includes('Vue')) {
            return 'vue2';
        }
        
        // React 项目
        if (frameworks.includes('React')) {
            if (frameworks.includes('Next.js')) return 'nextjs';
            if (frameworks.includes('Remix')) return 'remix';
            return 'react';
        }
        
        // Angular 项目
        if (frameworks.includes('Angular')) {
            return 'angular';
        }
        
        // Svelte 项目
        if (frameworks.includes('Svelte')) {
            if (frameworks.includes('SvelteKit')) return 'sveltekit';
            return 'svelte';
        }
        
        // 后端项目
        if (frameworks.includes('Express')) return 'express';
        if (frameworks.includes('NestJS')) return 'nestjs';
        if (frameworks.includes('Koa')) return 'koa';
        if (frameworks.includes('Fastify')) return 'fastify';
        
        // 构建工具判断
        if (tools.includes('Vite')) {
            return 'typescript'; // Vite 项目默认 TypeScript
        }
        
        return 'unknown';
    }
    
    private log(message: string): void {
        this.logger?.log(message);
    }
}

/**
 * 导出所有分析器
 */
export { ViteConfigAnalyzer } from './vite.js';
export { TsConfigAnalyzer } from './tsconfig.js';
export { EslintConfigAnalyzer } from './eslint.js';
export * from './types.js';
