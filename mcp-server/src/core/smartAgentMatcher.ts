import * as fs from 'fs';
import * as path from 'path';
import glob from 'fast-glob';
import { ProjectFeatures, AgentMetadata, Logger } from './types.js';

/**
 * 工作区文件夹接口（简化版）
 */
interface WorkspaceFolder {
    uri: { fsPath: string };
    name: string;
}

/**
 * 智能 Agent 匹配器
 * 根据项目特征自动推荐和应用合适的 Agents
 */
export class SmartAgentMatcher {
    constructor(private logger?: Logger) {}

    /**
     * 分析项目特征
     */
    async analyzeProject(workspaceFolder: WorkspaceFolder): Promise<ProjectFeatures> {
        this.log(`🔍 开始分析项目: ${workspaceFolder.name}`);

        const features: ProjectFeatures = {
            frameworks: [],
            languages: [],
            tools: [],
            keywords: [],
            projectType: 'unknown'
        };

        const rootPath = workspaceFolder.uri.fsPath;

        // 分析 package.json
        const packageJsonPath = path.join(rootPath, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
            const packageFeatures = this.analyzePackageJson(packageJsonPath);
            this.mergeFeatures(features, packageFeatures);
        }

        // 分析文件结构
        const structureFeatures = await this.analyzeFileStructure(rootPath);
        this.mergeFeatures(features, structureFeatures);

        // 推断项目类型
        features.projectType = this.inferProjectType(features);

        this.log(`✅ 项目分析完成: ${features.projectType}`);

        return features;
    }

    /**
     * 分析 package.json
     */
    private analyzePackageJson(packageJsonPath: string): Partial<ProjectFeatures> {
        const features: Partial<ProjectFeatures> = {
            frameworks: [],
            languages: [],
            tools: [],
            keywords: []
        };

        try {
            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(content);

            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies
            };

            // 检测框架
            if (allDeps['vue']) features.frameworks!.push('Vue 3');
            if (allDeps['react']) features.frameworks!.push('React');
            if (allDeps['@angular/core']) features.frameworks!.push('Angular');
            if (allDeps['next']) features.frameworks!.push('Next.js');

            // 检测工具
            if (allDeps['vite']) features.tools!.push('Vite');
            if (allDeps['webpack']) features.tools!.push('Webpack');
            if (allDeps['@logicflow/core']) features.tools!.push('LogicFlow');
            if (allDeps['element-plus']) features.tools!.push('Element Plus');
            if (allDeps['typescript']) features.languages!.push('TypeScript');

            // 检测特性
            if (allDeps['vue-i18n'] || allDeps['react-i18n']) features.keywords!.push('i18n');
            if (allDeps['pinia'] || allDeps['vuex'] || allDeps['redux']) features.keywords!.push('state-management');
            if (allDeps['vue-router'] || allDeps['react-router']) features.keywords!.push('routing');

            // VS Code 扩展
            if (packageJson.engines?.vscode) {
                features.keywords!.push('vscode-extension');
                features.tools!.push('VS Code Extension API');
            }

        } catch (error) {
            this.log(`解析 package.json 失败: ${error}`);
        }

        return features;
    }

    /**
     * 分析文件结构
     */
    private async analyzeFileStructure(rootPath: string): Promise<Partial<ProjectFeatures>> {
        const features: Partial<ProjectFeatures> = {
            frameworks: [],
            languages: [],
            tools: [],
            keywords: []
        };

        try {
            const patterns = ['**/*.vue', '**/*.ts', '**/*.tsx', '**/*.jsx', '**/locales/**', '**/stores/**'];
            const files = await glob(patterns, {
                cwd: rootPath,
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
                onlyFiles: true
            });

            if (files.some(f => f.endsWith('.vue'))) features.frameworks!.push('Vue');
            if (files.some(f => f.endsWith('.tsx'))) features.frameworks!.push('React');
            if (files.some(f => f.endsWith('.ts'))) features.languages!.push('TypeScript');
            if (files.some(f => f.includes('/locales/') || f.includes('/i18n/'))) features.keywords!.push('i18n');
            if (files.some(f => f.includes('/stores/') || f.includes('/store/'))) features.keywords!.push('state-management');

        } catch (error) {
            this.log(`扫描文件结构失败: ${error}`);
        }

        return features;
    }

    /**
     * 匹配 Agents
     */
    matchAgents(features: ProjectFeatures, availableAgents: AgentMetadata[]): AgentMetadata[] {
        const scoredAgents = availableAgents.map(agent => {
            const score = this.calculateMatchScore(features, agent);
            return { ...agent, score };
        });

        return scoredAgents
            .filter(a => a.score > 0)
            .sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    /**
     * 计算匹配分数
     */
    private calculateMatchScore(features: ProjectFeatures, agent: AgentMetadata): number {
        let score = 0;

        const WEIGHTS = {
            framework: 10,
            tool: 8,
            language: 5,
            keyword: 3,
            tag: 2
        };

        // 框架匹配
        features.frameworks.forEach(f => {
            if (agent.applicableWhen?.frameworks?.some(af => af.toLowerCase().includes(f.toLowerCase()))) {
                score += WEIGHTS.framework;
            }
        });

        // 工具匹配
        features.tools.forEach(t => {
            if (agent.applicableWhen?.tools?.some(at => at.toLowerCase().includes(t.toLowerCase()))) {
                score += WEIGHTS.tool;
            }
        });

        // 语言匹配
        features.languages.forEach(l => {
            if (agent.applicableWhen?.languages?.some(al => al.toLowerCase().includes(l.toLowerCase()))) {
                score += WEIGHTS.language;
            }
        });

        // 关键词匹配
        features.keywords.forEach(k => {
            if (agent.applicableWhen?.keywords?.some(ak => ak.toLowerCase().includes(k.toLowerCase()))) {
                score += WEIGHTS.keyword;
            }
        });

        // 标签匹配
        features.frameworks.concat(features.tools, features.languages, features.keywords).forEach(feature => {
            if (agent.tags.some(tag => tag.toLowerCase().includes(feature.toLowerCase()))) {
                score += WEIGHTS.tag;
            }
        });

        return score;
    }

    /**
     * 解析 Agent 元数据
     */
    parseAgentMetadata(filePath: string, content: string): AgentMetadata {
        const id = path.basename(filePath, '.agent.md');
        
        // 解析 YAML frontmatter
        let description = '';
        let tags: string[] = [];

        if (content.startsWith('---')) {
            const endIndex = content.indexOf('---', 3);
            if (endIndex > 0) {
                const frontmatter = content.substring(3, endIndex);
                const descMatch = frontmatter.match(/description:\s*['"](.+)['"]/);
                if (descMatch) description = descMatch[1];
                
                const tagsMatch = frontmatter.match(/tags:\s*\[(.+)\]/);
                if (tagsMatch) {
                    tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
                }
            }
        }

        // 提取标题
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : id;

        return {
            id,
            path: filePath,
            title,
            description,
            tags,
            applicableWhen: {
                frameworks: tags.filter(t => ['vue', 'vue3', 'react', 'angular'].includes(t.toLowerCase())),
                languages: tags.filter(t => ['typescript', 'javascript'].includes(t.toLowerCase())),
                tools: tags.filter(t => ['vite', 'webpack', 'logicflow'].includes(t.toLowerCase())),
                keywords: tags.filter(t => ['i18n', 'state-management'].includes(t.toLowerCase()))
            }
        };
    }

    private mergeFeatures(target: ProjectFeatures, source: Partial<ProjectFeatures>): void {
        if (source.frameworks) target.frameworks.push(...source.frameworks);
        if (source.languages) target.languages.push(...source.languages);
        if (source.tools) target.tools.push(...source.tools);
        if (source.keywords) target.keywords.push(...source.keywords);
    }

    private inferProjectType(features: ProjectFeatures): string {
        if (features.keywords.includes('vscode-extension')) return 'vscode-extension';
        if (features.frameworks.some(f => f.toLowerCase().includes('vue'))) return 'vue3';
        if (features.frameworks.some(f => f.toLowerCase().includes('react'))) return 'react';
        if (features.frameworks.some(f => f.toLowerCase().includes('angular'))) return 'angular';
        if (features.languages.includes('TypeScript')) return 'typescript';
        return 'general';
    }

    private log(message: string): void {
        this.logger?.log(message);
    }
}
