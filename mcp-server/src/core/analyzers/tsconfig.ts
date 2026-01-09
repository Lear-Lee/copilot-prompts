/**
 * TypeScript 配置文件分析器
 * 
 * 解析 tsconfig.json 文件，提取：
 * - 编译器选项（strict, target 等）
 * - 路径别名配置
 * - 项目引用
 */

import * as fs from 'fs';
import { ConfigAnalyzer, AnalyzerResult, ProjectFeaturesExtended } from './types.js';

/**
 * TypeScript 配置分析器
 */
export class TsConfigAnalyzer implements ConfigAnalyzer {
    readonly name = 'TsConfigAnalyzer';
    readonly supportedFiles = [
        'tsconfig.json',
        'tsconfig.app.json',
        'tsconfig.node.json',
        'tsconfig.build.json'
    ];
    
    /**
     * 检查是否支持指定文件
     */
    supports(fileName: string): boolean {
        return this.supportedFiles.includes(fileName) || 
               fileName.startsWith('tsconfig.') && fileName.endsWith('.json');
    }
    
    /**
     * 分析 TypeScript 配置文件
     */
    async analyze(filePath: string, content?: string): Promise<AnalyzerResult> {
        const startTime = Date.now();
        
        try {
            // 读取文件内容
            const fileContent = content ?? fs.readFileSync(filePath, 'utf-8');
            
            // 移除注释后解析 JSON
            const jsonContent = this.removeJsonComments(fileContent);
            const config = JSON.parse(jsonContent);
            
            const features: Partial<ProjectFeaturesExtended> = {
                languages: ['TypeScript'],
                tools: [],
                keywords: []
            };
            
            // 分析编译器选项
            if (config.compilerOptions) {
                this.analyzeCompilerOptions(config.compilerOptions, features);
            }
            
            // 分析路径别名
            if (config.compilerOptions?.paths) {
                this.analyzePathAliases(config.compilerOptions.paths, features);
            }
            
            // 分析项目引用
            if (config.references) {
                this.analyzeReferences(config.references, features);
            }
            
            // 分析 extends
            if (config.extends) {
                this.analyzeExtends(config.extends, features);
            }
            
            return {
                features,
                confidence: 0.95,
                analyzerName: this.name,
                duration: Date.now() - startTime
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                features: {},
                confidence: 0,
                analyzerName: this.name,
                duration: Date.now() - startTime,
                error: `分析 TypeScript 配置失败: ${message}`
            };
        }
    }
    
    /**
     * 移除 JSON 中的注释
     */
    private removeJsonComments(content: string): string {
        // 移除单行注释
        let result = content.replace(/\/\/.*$/gm, '');
        // 移除多行注释
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
        return result;
    }
    
    /**
     * 分析编译器选项
     */
    private analyzeCompilerOptions(
        options: Record<string, unknown>,
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 检测严格模式
        if (options.strict === true) {
            features.keywords!.push('typescript-strict');
        }
        
        // 检测装饰器
        if (options.experimentalDecorators === true) {
            features.keywords!.push('decorators');
        }
        
        // 检测 JSX
        if (options.jsx) {
            const jsxValue = String(options.jsx).toLowerCase();
            if (jsxValue.includes('react')) {
                features.keywords!.push('react-jsx');
            } else if (jsxValue === 'preserve') {
                features.keywords!.push('vue-jsx');
            }
        }
        
        // 检测模块系统
        if (options.module) {
            const moduleValue = String(options.module).toLowerCase();
            if (moduleValue.includes('esnext') || moduleValue.includes('es20')) {
                features.keywords!.push('esm');
            } else if (moduleValue === 'commonjs') {
                features.keywords!.push('commonjs');
            }
        }
        
        // 检测目标环境
        if (options.target) {
            const targetValue = String(options.target).toLowerCase();
            features.keywords!.push(`target-${targetValue}`);
        }
        
        // 检测 baseUrl（表示有路径别名）
        if (options.baseUrl) {
            features.keywords!.push('path-alias');
        }
        
        // 检测 composite（表示是 monorepo 或多项目）
        if (options.composite === true) {
            features.keywords!.push('composite');
        }
        
        // 检测 lib
        if (Array.isArray(options.lib)) {
            const libs = options.lib as string[];
            if (libs.some(lib => lib.toLowerCase().includes('dom'))) {
                features.keywords!.push('browser');
            }
            if (libs.some(lib => lib.toLowerCase().includes('webworker'))) {
                features.keywords!.push('webworker');
            }
        }
    }
    
    /**
     * 分析路径别名
     */
    private analyzePathAliases(
        paths: Record<string, string[]>,
        features: Partial<ProjectFeaturesExtended>
    ): void {
        const pathKeys = Object.keys(paths);
        
        // 检测常见别名模式
        if (pathKeys.some(key => key.startsWith('@/'))) {
            features.keywords!.push('at-alias');
        }
        
        // 检测组件别名
        if (pathKeys.some(key => key.includes('components'))) {
            features.keywords!.push('components-alias');
        }
        
        // 检测多别名配置
        if (pathKeys.length > 3) {
            features.keywords!.push('multi-alias');
        }
    }
    
    /**
     * 分析项目引用
     */
    private analyzeReferences(
        references: Array<{ path: string }>,
        features: Partial<ProjectFeaturesExtended>
    ): void {
        if (references.length > 0) {
            features.keywords!.push('project-references');
            
            // 多个引用可能表示 monorepo
            if (references.length > 2) {
                features.keywords!.push('monorepo-candidate');
            }
        }
    }
    
    /**
     * 分析 extends 配置
     */
    private analyzeExtends(
        extendsValue: string | string[],
        features: Partial<ProjectFeaturesExtended>
    ): void {
        const extendsList = Array.isArray(extendsValue) ? extendsValue : [extendsValue];
        
        for (const ext of extendsList) {
            // 检测 Vue 官方配置
            if (ext.includes('@vue/tsconfig')) {
                if (!features.keywords!.includes('vue-tsconfig')) {
                    features.keywords!.push('vue-tsconfig');
                }
            }
            
            // 检测 Node.js 配置
            if (ext.includes('@tsconfig/node')) {
                features.keywords!.push('node-tsconfig');
            }
            
            // 检测 strictest 配置
            if (ext.includes('strictest')) {
                features.keywords!.push('typescript-strictest');
            }
        }
    }
}
