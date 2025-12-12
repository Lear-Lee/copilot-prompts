import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 项目特征分析结果
 */
export interface ProjectFeatures {
    frameworks: string[];      // Vue, React, Angular, etc.
    languages: string[];       // TypeScript, JavaScript, Python, etc.
    tools: string[];          // Vite, Webpack, LogicFlow, etc.
    keywords: string[];       // i18n, state-management, routing, etc.
    projectType: string;      // frontend, backend, fullstack, extension, etc.
}

/**
 * Agent 元数据
 */
export interface AgentMetadata {
    id: string;
    path: string;
    title: string;
    description: string;
    tags: string[];
    applicableWhen: {
        frameworks?: string[];
        languages?: string[];
        tools?: string[];
        keywords?: string[];
    };
}

/**
 * 智能 Agent 匹配器
 * 根据项目特征自动推荐和应用合适的 Agents
 */
export class SmartAgentMatcher {
    constructor(private outputChannel?: vscode.OutputChannel) {}

    /**
     * 分析项目特征
     */
    async analyzeProject(workspaceFolder: vscode.WorkspaceFolder): Promise<ProjectFeatures> {
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

        // 分析 tsconfig.json
        const tsconfigPath = path.join(rootPath, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
            features.languages.push('typescript');
        }

        // 分析文件结构
        const structureFeatures = await this.analyzeFileStructure(rootPath);
        this.mergeFeatures(features, structureFeatures);

        // 推断项目类型
        features.projectType = this.inferProjectType(features);

        this.log(`✅ 项目分析完成:`);
        this.log(`   - 框架: ${features.frameworks.join(', ') || '无'}`);
        this.log(`   - 语言: ${features.languages.join(', ') || '无'}`);
        this.log(`   - 工具: ${features.tools.join(', ') || '无'}`);
        this.log(`   - 类型: ${features.projectType}`);

        return features;
    }

    /**
     * 分析 package.json 获取项目依赖和特征
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
            if (allDeps['vue'] || allDeps['@vue/cli']) {
                features.frameworks!.push('vue3');
            }
            if (allDeps['react']) {
                features.frameworks!.push('react');
            }
            if (allDeps['@angular/core']) {
                features.frameworks!.push('angular');
            }
            if (allDeps['next']) {
                features.frameworks!.push('nextjs');
            }

            // 检测工具
            if (allDeps['vite']) {
                features.tools!.push('vite');
            }
            if (allDeps['webpack']) {
                features.tools!.push('webpack');
            }
            if (allDeps['@logicflow/core']) {
                features.tools!.push('logicflow');
            }
            if (allDeps['element-plus']) {
                features.tools!.push('element-plus');
            }
            if (allDeps['antd']) {
                features.tools!.push('antd');
            }

            // 检测语言
            if (allDeps['typescript']) {
                features.languages!.push('typescript');
            } else {
                features.languages!.push('javascript');
            }

            // 检测关键特性
            if (allDeps['vue-i18n'] || allDeps['react-i18n']) {
                features.keywords!.push('i18n');
            }
            if (allDeps['pinia'] || allDeps['vuex'] || allDeps['redux']) {
                features.keywords!.push('state-management');
            }
            if (allDeps['vue-router'] || allDeps['react-router']) {
                features.keywords!.push('routing');
            }

            // VS Code Extension
            if (allDeps['vscode'] || allDeps['@types/vscode']) {
                features.tools!.push('vscode-extension');
            }

        } catch (error) {
            this.log(`⚠️ 读取 package.json 失败: ${error}`);
        }

        return features;
    }

    /**
     * 分析文件结构获取项目特征
     */
    private async analyzeFileStructure(rootPath: string): Promise<Partial<ProjectFeatures>> {
        const features: Partial<ProjectFeatures> = {
            frameworks: [],
            languages: [],
            tools: [],
            keywords: []
        };

        // 检查 src 目录
        const srcPath = path.join(rootPath, 'src');
        if (fs.existsSync(srcPath)) {
            // 检查 .vue 文件
            if (this.hasFilesWithExtension(srcPath, '.vue')) {
                if (!features.frameworks!.includes('vue3')) {
                    features.frameworks!.push('vue3');
                }
            }

            // 检查 .tsx/.jsx 文件
            if (this.hasFilesWithExtension(srcPath, '.tsx') || this.hasFilesWithExtension(srcPath, '.jsx')) {
                if (!features.frameworks!.includes('react')) {
                    features.frameworks!.push('react');
                }
            }

            // 检查 .ts 文件
            if (this.hasFilesWithExtension(srcPath, '.ts')) {
                if (!features.languages!.includes('typescript')) {
                    features.languages!.push('typescript');
                }
            }

            // 检查 locales/i18n 目录
            if (fs.existsSync(path.join(srcPath, 'locales')) || fs.existsSync(path.join(srcPath, 'i18n'))) {
                if (!features.keywords!.includes('i18n')) {
                    features.keywords!.push('i18n');
                }
            }

            // 检查 stores 目录
            if (fs.existsSync(path.join(srcPath, 'stores')) || fs.existsSync(path.join(srcPath, 'store'))) {
                if (!features.keywords!.includes('state-management')) {
                    features.keywords!.push('state-management');
                }
            }
        }

        // 检查 Python 项目
        if (fs.existsSync(path.join(rootPath, 'requirements.txt')) || 
            fs.existsSync(path.join(rootPath, 'setup.py'))) {
            features.languages!.push('python');
        }

        return features;
    }

    /**
     * 检查目录下是否存在特定扩展名的文件
     */
    private hasFilesWithExtension(dirPath: string, extension: string, maxDepth: number = 2): boolean {
        const checkDir = (currentPath: string, depth: number): boolean => {
            if (depth > maxDepth) return false;

            try {
                const entries = fs.readdirSync(currentPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue;
                    
                    const fullPath = path.join(currentPath, entry.name);
                    
                    if (entry.isFile() && entry.name.endsWith(extension)) {
                        return true;
                    }
                    
                    if (entry.isDirectory()) {
                        if (checkDir(fullPath, depth + 1)) {
                            return true;
                        }
                    }
                }
            } catch (error) {
                // 忽略权限错误
            }
            
            return false;
        };

        return checkDir(dirPath, 0);
    }

    /**
     * 推断项目类型
     */
    private inferProjectType(features: ProjectFeatures): string {
        if (features.tools.includes('vscode-extension')) {
            return 'vscode-extension';
        }
        
        if (features.frameworks.length > 0) {
            return 'frontend';
        }
        
        if (features.languages.includes('python')) {
            return 'backend';
        }
        
        return 'general';
    }

    /**
     * 合并特征
     */
    private mergeFeatures(target: ProjectFeatures, source: Partial<ProjectFeatures>): void {
        if (source.frameworks) {
            target.frameworks.push(...source.frameworks.filter(f => !target.frameworks.includes(f)));
        }
        if (source.languages) {
            target.languages.push(...source.languages.filter(l => !target.languages.includes(l)));
        }
        if (source.tools) {
            target.tools.push(...source.tools.filter(t => !target.tools.includes(t)));
        }
        if (source.keywords) {
            target.keywords.push(...source.keywords.filter(k => !target.keywords.includes(k)));
        }
    }

    /**
     * 根据项目特征匹配合适的 Agents
     */
    matchAgents(projectFeatures: ProjectFeatures, availableAgents: AgentMetadata[]): AgentMetadata[] {
        this.log(`🎯 开始匹配 Agents...`);

        const matchedAgents: Array<{ agent: AgentMetadata; score: number }> = [];

        for (const agent of availableAgents) {
            const score = this.calculateMatchScore(projectFeatures, agent);
            
            if (score > 0) {
                matchedAgents.push({ agent, score });
                this.log(`   ✓ ${agent.title} (匹配度: ${score})`);
            }
        }

        // 按匹配度排序
        matchedAgents.sort((a, b) => b.score - a.score);

        this.log(`✅ 找到 ${matchedAgents.length} 个匹配的 Agents`);

        return matchedAgents.map(m => m.agent);
    }

    /**
     * 计算 Agent 与项目的匹配分数
     */
    private calculateMatchScore(features: ProjectFeatures, agent: AgentMetadata): number {
        let score = 0;

        const applicable = agent.applicableWhen;

        // 框架匹配 (最高权重)
        if (applicable.frameworks) {
            const matches = applicable.frameworks.filter(f => features.frameworks.includes(f));
            score += matches.length * 10;
        }

        // 语言匹配
        if (applicable.languages) {
            const matches = applicable.languages.filter(l => features.languages.includes(l));
            score += matches.length * 5;
        }

        // 工具匹配
        if (applicable.tools) {
            const matches = applicable.tools.filter(t => features.tools.includes(t));
            score += matches.length * 8;
        }

        // 关键词匹配
        if (applicable.keywords) {
            const matches = applicable.keywords.filter(k => features.keywords.includes(k));
            score += matches.length * 3;
        }

        // 标签匹配（次要）
        const tagMatches = agent.tags.filter(tag => 
            features.frameworks.includes(tag) ||
            features.languages.includes(tag) ||
            features.tools.includes(tag) ||
            features.keywords.includes(tag)
        );
        score += tagMatches.length * 2;

        return score;
    }

    /**
     * 从 Agent 文件中提取元数据
     */
    parseAgentMetadata(agentPath: string, content: string): AgentMetadata {
        const fileName = path.basename(agentPath);
        const id = fileName.replace(/\.agent\.md$/, '');

        // 解析 YAML frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        let description = '';
        let tags: string[] = [];

        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const descMatch = frontmatter.match(/description:\s*['"](.+?)['"]/);
            if (descMatch) {
                description = descMatch[1];
            }

            const tagsMatch = frontmatter.match(/tags:\s*\[(.+?)\]/);
            if (tagsMatch) {
                tags = tagsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''));
            }
        }

        // 提取标题（第一个 # 标题）
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : id;

        // 根据标签推断适用条件
        const applicableWhen = this.inferApplicableConditions(tags, content);

        return {
            id,
            path: agentPath,
            title,
            description,
            tags,
            applicableWhen
        };
    }

    /**
     * 根据标签和内容推断适用条件
     */
    private inferApplicableConditions(tags: string[], content: string): AgentMetadata['applicableWhen'] {
        const conditions: AgentMetadata['applicableWhen'] = {
            frameworks: [],
            languages: [],
            tools: [],
            keywords: []
        };

        // 框架
        if (tags.includes('vue3') || content.toLowerCase().includes('vue 3')) {
            conditions.frameworks!.push('vue3');
        }
        if (tags.includes('react') || content.toLowerCase().includes('react')) {
            conditions.frameworks!.push('react');
        }

        // 语言
        if (tags.includes('typescript')) {
            conditions.languages!.push('typescript');
        }
        if (tags.includes('javascript')) {
            conditions.languages!.push('javascript');
        }

        // 工具
        if (tags.includes('logicflow') || content.toLowerCase().includes('logicflow')) {
            conditions.tools!.push('logicflow');
        }
        if (tags.includes('vscode-extension')) {
            conditions.tools!.push('vscode-extension');
        }

        // 关键词
        if (tags.includes('i18n') || content.toLowerCase().includes('国际化')) {
            conditions.keywords!.push('i18n');
        }

        return conditions;
    }

    private log(message: string): void {
        if (this.outputChannel) {
            this.outputChannel.appendLine(message);
        }
    }
}
