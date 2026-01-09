/**
 * ESLint 配置文件分析器
 * 
 * 解析 ESLint 配置文件，提取：
 * - 使用的预设（Vue, React, TypeScript 等）
 * - 插件配置
 * - 规则偏好
 */

import * as fs from 'fs';
import { ConfigAnalyzer, AnalyzerResult, ProjectFeaturesExtended } from './types.js';

/**
 * ESLint 配置分析器
 */
export class EslintConfigAnalyzer implements ConfigAnalyzer {
    readonly name = 'EslintConfigAnalyzer';
    readonly supportedFiles = [
        '.eslintrc.js',
        '.eslintrc.cjs',
        '.eslintrc.json',
        '.eslintrc.yaml',
        '.eslintrc.yml',
        'eslint.config.js',
        'eslint.config.mjs',
        'eslint.config.cjs'
    ];
    
    // 预设到框架的映射
    private readonly PRESET_MAPPINGS: Record<string, { type: 'framework' | 'tool'; name: string }> = {
        'plugin:vue/vue3-recommended': { type: 'framework', name: 'Vue 3' },
        'plugin:vue/vue3-essential': { type: 'framework', name: 'Vue 3' },
        'plugin:vue/vue3-strongly-recommended': { type: 'framework', name: 'Vue 3' },
        'plugin:vue/essential': { type: 'framework', name: 'Vue 2' },
        'plugin:vue/recommended': { type: 'framework', name: 'Vue 2' },
        'plugin:react/recommended': { type: 'framework', name: 'React' },
        'plugin:react-hooks/recommended': { type: 'tool', name: 'React Hooks' },
        '@typescript-eslint/recommended': { type: 'tool', name: 'TypeScript ESLint' },
        'plugin:@typescript-eslint/recommended': { type: 'tool', name: 'TypeScript ESLint' },
        'plugin:prettier/recommended': { type: 'tool', name: 'Prettier' },
        'plugin:nuxt/recommended': { type: 'framework', name: 'Nuxt.js' },
        'plugin:tailwindcss/recommended': { type: 'tool', name: 'Tailwind CSS' },
    };
    
    // 插件到工具的映射
    private readonly PLUGIN_MAPPINGS: Record<string, string> = {
        '@typescript-eslint': 'TypeScript ESLint',
        'vue': 'Vue ESLint',
        'react': 'React ESLint',
        'react-hooks': 'React Hooks',
        'prettier': 'Prettier',
        'import': 'Import Sorting',
        'unused-imports': 'Unused Imports',
        'tailwindcss': 'Tailwind CSS',
        'i18n': 'i18n Linting',
    };
    
    /**
     * 检查是否支持指定文件
     */
    supports(fileName: string): boolean {
        return this.supportedFiles.includes(fileName);
    }
    
    /**
     * 分析 ESLint 配置文件
     */
    async analyze(filePath: string, content?: string): Promise<AnalyzerResult> {
        const startTime = Date.now();
        
        try {
            // 读取文件内容
            const fileContent = content ?? fs.readFileSync(filePath, 'utf-8');
            
            const features: Partial<ProjectFeaturesExtended> = {
                tools: ['ESLint'],
                keywords: []
            };
            
            // 根据文件类型选择分析方法
            if (filePath.endsWith('.json')) {
                this.analyzeJsonConfig(fileContent, features);
            } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
                // YAML 文件简单分析
                this.analyzeTextConfig(fileContent, features);
            } else {
                // JS/CJS/MJS 文件
                this.analyzeJsConfig(fileContent, features);
            }
            
            return {
                features,
                confidence: 0.85,
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
                error: `分析 ESLint 配置失败: ${message}`
            };
        }
    }
    
    /**
     * 分析 JSON 格式配置
     */
    private analyzeJsonConfig(
        content: string,
        features: Partial<ProjectFeaturesExtended>
    ): void {
        try {
            const config = JSON.parse(content);
            
            // 分析 extends
            if (config.extends) {
                this.analyzeExtends(config.extends, features);
            }
            
            // 分析 plugins
            if (config.plugins) {
                this.analyzePlugins(config.plugins, features);
            }
            
            // 分析 rules
            if (config.rules) {
                this.analyzeRules(config.rules, features);
            }
        } catch {
            // JSON 解析失败，使用文本分析
            this.analyzeTextConfig(content, features);
        }
    }
    
    /**
     * 分析 JS 格式配置
     */
    private analyzeJsConfig(
        content: string,
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 检测 flat config (ESLint 9+)
        if (content.includes('export default') || content.includes('module.exports')) {
            // 检测预设
            for (const [preset, mapping] of Object.entries(this.PRESET_MAPPINGS)) {
                if (content.includes(preset)) {
                    if (mapping.type === 'framework') {
                        if (!features.frameworks) features.frameworks = [];
                        if (!features.frameworks.includes(mapping.name)) {
                            features.frameworks.push(mapping.name);
                        }
                    } else {
                        if (!features.tools!.includes(mapping.name)) {
                            features.tools!.push(mapping.name);
                        }
                    }
                }
            }
            
            // 检测导入的插件
            for (const [plugin, toolName] of Object.entries(this.PLUGIN_MAPPINGS)) {
                if (content.includes(`'${plugin}'`) || 
                    content.includes(`"${plugin}"`) ||
                    content.includes(`@${plugin}`)) {
                    if (!features.tools!.includes(toolName)) {
                        features.tools!.push(toolName);
                    }
                }
            }
        }
        
        // 检测 TypeScript
        if (content.includes('@typescript-eslint') || 
            content.includes('typescript-eslint')) {
            features.keywords!.push('typescript-lint');
        }
        
        // 检测 Prettier 集成
        if (content.includes('prettier')) {
            features.keywords!.push('prettier-integration');
        }
        
        // 检测自动导入规则
        if (content.includes('unused-imports') || 
            content.includes('no-unused-imports')) {
            features.keywords!.push('unused-imports-check');
        }
    }
    
    /**
     * 分析文本格式配置（通用）
     */
    private analyzeTextConfig(
        content: string,
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 检测 Vue
        if (content.includes('vue')) {
            if (content.includes('vue3')) {
                if (!features.frameworks) features.frameworks = [];
                features.frameworks.push('Vue 3');
            } else if (content.includes('vue/')) {
                if (!features.frameworks) features.frameworks = [];
                features.frameworks.push('Vue');
            }
        }
        
        // 检测 React
        if (content.includes('react')) {
            if (!features.frameworks) features.frameworks = [];
            features.frameworks.push('React');
        }
        
        // 检测 TypeScript
        if (content.includes('typescript')) {
            features.keywords!.push('typescript-lint');
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
            const mapping = this.PRESET_MAPPINGS[ext];
            if (mapping) {
                if (mapping.type === 'framework') {
                    if (!features.frameworks) features.frameworks = [];
                    if (!features.frameworks.includes(mapping.name)) {
                        features.frameworks.push(mapping.name);
                    }
                } else {
                    if (!features.tools!.includes(mapping.name)) {
                        features.tools!.push(mapping.name);
                    }
                }
            }
        }
    }
    
    /**
     * 分析 plugins 配置
     */
    private analyzePlugins(
        plugins: string[],
        features: Partial<ProjectFeaturesExtended>
    ): void {
        for (const plugin of plugins) {
            const toolName = this.PLUGIN_MAPPINGS[plugin];
            if (toolName && !features.tools!.includes(toolName)) {
                features.tools!.push(toolName);
            }
        }
    }
    
    /**
     * 分析 rules 配置
     */
    private analyzeRules(
        rules: Record<string, unknown>,
        features: Partial<ProjectFeaturesExtended>
    ): void {
        const ruleNames = Object.keys(rules);
        
        // 检测 i18n 规则
        if (ruleNames.some(r => r.includes('i18n'))) {
            features.keywords!.push('i18n-lint');
        }
        
        // 检测严格规则
        const strictRules = [
            'no-any',
            'explicit-function-return-type',
            'strict-boolean-expressions'
        ];
        if (ruleNames.some(r => strictRules.some(sr => r.includes(sr)))) {
            features.keywords!.push('strict-rules');
        }
        
        // 检测 import 排序
        if (ruleNames.some(r => r.includes('import/order'))) {
            features.keywords!.push('import-sorting');
        }
    }
}
