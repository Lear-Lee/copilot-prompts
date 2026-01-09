/**
 * Vite 配置文件分析器
 * 
 * 解析 vite.config.ts/js 文件，提取：
 * - 使用的插件（vue, react 等）
 * - 路径别名配置
 * - 构建配置
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConfigAnalyzer, AnalyzerResult, ProjectFeaturesExtended, ToolInfo } from './types.js';

/**
 * Vite 配置分析器
 */
export class ViteConfigAnalyzer implements ConfigAnalyzer {
    readonly name = 'ViteConfigAnalyzer';
    readonly supportedFiles = [
        'vite.config.ts',
        'vite.config.js',
        'vite.config.mts',
        'vite.config.mjs'
    ];
    
    // 插件名称到框架/工具的映射
    private readonly PLUGIN_MAPPINGS: Record<string, { type: 'framework' | 'tool'; name: string }> = {
        '@vitejs/plugin-vue': { type: 'framework', name: 'Vue 3' },
        '@vitejs/plugin-vue-jsx': { type: 'tool', name: 'Vue JSX' },
        '@vitejs/plugin-react': { type: 'framework', name: 'React' },
        '@vitejs/plugin-react-swc': { type: 'framework', name: 'React' },
        '@vitejs/plugin-legacy': { type: 'tool', name: 'Legacy Browser Support' },
        'vite-plugin-vue2': { type: 'framework', name: 'Vue 2' },
        'unplugin-vue-components': { type: 'tool', name: 'Auto Components' },
        'unplugin-auto-import': { type: 'tool', name: 'Auto Import' },
        'vite-plugin-pages': { type: 'tool', name: 'File-based Routing' },
        'vite-plugin-vue-layouts': { type: 'tool', name: 'Vue Layouts' },
        'vite-plugin-pwa': { type: 'tool', name: 'PWA' },
        'vite-plugin-compression': { type: 'tool', name: 'Compression' },
        'vite-plugin-svg-icons': { type: 'tool', name: 'SVG Icons' },
        'unocss': { type: 'tool', name: 'UnoCSS' },
        '@unocss/vite': { type: 'tool', name: 'UnoCSS' },
        'vite-plugin-windicss': { type: 'tool', name: 'WindiCSS' },
        'vite-plugin-mock': { type: 'tool', name: 'Mock Server' },
        'vite-plugin-html': { type: 'tool', name: 'HTML Transform' },
        'rollup-plugin-visualizer': { type: 'tool', name: 'Bundle Analyzer' },
    };
    
    /**
     * 检查是否支持指定文件
     */
    supports(fileName: string): boolean {
        return this.supportedFiles.includes(fileName);
    }
    
    /**
     * 分析 Vite 配置文件
     */
    async analyze(filePath: string, content?: string): Promise<AnalyzerResult> {
        const startTime = Date.now();
        
        try {
            // 读取文件内容
            const fileContent = content ?? fs.readFileSync(filePath, 'utf-8');
            
            const features: Partial<ProjectFeaturesExtended> = {
                frameworks: [],
                tools: ['Vite'],
                toolsDetail: [{
                    name: 'Vite',
                    category: 'build',
                    config: {}
                }],
                keywords: []
            };
            
            // 分析导入的插件
            this.analyzePluginImports(fileContent, features);
            
            // 分析插件配置
            this.analyzePluginConfig(fileContent, features);
            
            // 分析 resolve.alias
            this.analyzeAliasConfig(fileContent, features);
            
            // 分析 server 配置
            this.analyzeServerConfig(fileContent, features);
            
            // 分析 build 配置
            this.analyzeBuildConfig(fileContent, features);
            
            return {
                features,
                confidence: 0.9,
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
                error: `分析 Vite 配置失败: ${message}`
            };
        }
    }
    
    /**
     * 分析插件导入语句
     */
    private analyzePluginImports(
        content: string, 
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 匹配 import 语句
        const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
            const packageName = match[1];
            const mapping = this.PLUGIN_MAPPINGS[packageName];
            
            if (mapping) {
                if (mapping.type === 'framework') {
                    if (!features.frameworks!.includes(mapping.name)) {
                        features.frameworks!.push(mapping.name);
                    }
                } else {
                    if (!features.tools!.includes(mapping.name)) {
                        features.tools!.push(mapping.name);
                    }
                }
            }
        }
        
        // 检测 ElementPlus 自动导入
        if (content.includes('ElementPlusResolver') || 
            content.includes('element-plus')) {
            if (!features.tools!.includes('Element Plus')) {
                features.tools!.push('Element Plus');
            }
        }
        
        // 检测 Ant Design Vue
        if (content.includes('AntDesignVueResolver') || 
            content.includes('ant-design-vue')) {
            if (!features.tools!.includes('Ant Design Vue')) {
                features.tools!.push('Ant Design Vue');
            }
        }
        
        // 检测 Naive UI
        if (content.includes('NaiveUiResolver') || 
            content.includes('naive-ui')) {
            if (!features.tools!.includes('Naive UI')) {
                features.tools!.push('Naive UI');
            }
        }
    }
    
    /**
     * 分析插件配置部分
     */
    private analyzePluginConfig(
        content: string, 
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 检测 Vue I18n
        if (content.includes('VueI18nPlugin') || 
            content.includes('@intlify/unplugin-vue-i18n')) {
            features.keywords!.push('i18n');
            if (!features.tools!.includes('Vue I18n')) {
                features.tools!.push('Vue I18n');
            }
        }
        
        // 检测 Mock
        if (content.includes('viteMockServe') || 
            content.includes('vite-plugin-mock')) {
            features.keywords!.push('mock');
        }
        
        // 检测 PWA
        if (content.includes('VitePWA') || 
            content.includes('vite-plugin-pwa')) {
            features.keywords!.push('pwa');
        }
    }
    
    /**
     * 分析路径别名配置
     */
    private analyzeAliasConfig(
        content: string, 
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 检测 @ 别名配置
        if (content.includes("'@'") || content.includes('"@"')) {
            features.keywords!.push('path-alias');
        }
        
        // 检测 src 目录结构
        const srcDirs = ['@/components', '@/views', '@/store', '@/api', '@/utils'];
        for (const dir of srcDirs) {
            if (content.includes(dir)) {
                features.keywords!.push('standard-structure');
                break;
            }
        }
    }
    
    /**
     * 分析开发服务器配置
     */
    private analyzeServerConfig(
        content: string, 
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 检测代理配置
        if (content.includes('proxy:') || content.includes('proxy :')) {
            features.keywords!.push('api-proxy');
        }
        
        // 检测 HTTPS
        if (content.includes('https:') && content.includes('true')) {
            features.keywords!.push('https');
        }
    }
    
    /**
     * 分析构建配置
     */
    private analyzeBuildConfig(
        content: string, 
        features: Partial<ProjectFeaturesExtended>
    ): void {
        // 检测代码分割
        if (content.includes('manualChunks')) {
            features.keywords!.push('code-splitting');
        }
        
        // 检测 Rollup 选项
        if (content.includes('rollupOptions')) {
            features.keywords!.push('rollup-config');
        }
        
        // 检测源码映射
        if (content.includes('sourcemap')) {
            features.keywords!.push('sourcemap');
        }
    }
}
