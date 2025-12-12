import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SmartAgentMatcher, ProjectFeatures, AgentMetadata } from './smartAgentMatcher';
import { GitHubClient } from './githubClient';

/**
 * 配置生成结果
 */
export interface GenerationResult {
    success: boolean;
    projectType?: string;
    matchedAgents?: AgentMetadata[];
    configPath?: string;
    error?: string;
}

/**
 * 自动配置生成器
 * 根据项目特征自动生成 copilot-instructions.md
 */
export class AutoConfigGenerator {
    private matcher: SmartAgentMatcher;
    private githubClient: GitHubClient;

    constructor(private outputChannel?: vscode.OutputChannel) {
        this.matcher = new SmartAgentMatcher(outputChannel);
        this.githubClient = new GitHubClient(outputChannel);
    }

    /**
     * 为指定工作区自动生成配置
     */
    async generateForWorkspace(targetFolder: vscode.WorkspaceFolder): Promise<GenerationResult> {
        this.log(`\n${'='.repeat(60)}`);
        this.log(`🚀 开始为项目自动生成 Copilot 配置`);
        this.log(`   项目: ${targetFolder.name}`);
        this.log(`   路径: ${targetFolder.uri.fsPath}`);
        this.log(`${'='.repeat(60)}\n`);

        try {
            // 1. 分析项目特征
            const features = await this.matcher.analyzeProject(targetFolder);

            // 2. 从 GitHub 获取所有可用的 Agents
            const availableAgents = await this.fetchAvailableAgents();

            // 3. 匹配合适的 Agents
            const matchedAgents = this.matcher.matchAgents(features, availableAgents);

            if (matchedAgents.length === 0) {
                vscode.window.showWarningMessage('未找到匹配的 Agents，将使用通用配置');
                this.log('⚠️ 未找到匹配的 Agents');
            }

            // 4. 生成配置文件
            const configPath = await this.generateConfigFile(targetFolder, features, matchedAgents);

            this.log(`\n✅ 配置生成完成！`);
            
            return {
                success: true,
                projectType: features.projectType,
                matchedAgents,
                configPath
            };

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.log(`❌ 生成配置失败: ${errorMsg}`);
            
            return {
                success: false,
                error: errorMsg
            };
        }
    }

    /**
     * 从 GitHub 获取所有可用的 Agents
     */
    private async fetchAvailableAgents(): Promise<AgentMetadata[]> {
        this.log('📥 正在从 GitHub 获取 Agents 列表...');

        const agents: AgentMetadata[] = [];

        try {
            // 获取 agents 目录下的所有文件
            const agentFiles = await this.githubClient.listDirectoryFiles('agents');

            for (const file of agentFiles) {
                if (file.name.endsWith('.agent.md')) {
                    try {
                        // 获取文件内容
                        const content = await this.githubClient.fetchFileContent(file.path);
                        
                        // 解析元数据
                        const metadata = this.matcher.parseAgentMetadata(file.path, content);
                        agents.push(metadata);

                        this.log(`   ✓ ${metadata.title}`);
                    } catch (error) {
                        this.log(`   ✗ 解析失败: ${file.name} - ${error}`);
                    }
                }
            }

            this.log(`✅ 成功加载 ${agents.length} 个 Agents\n`);
            return agents;

        } catch (error) {
            this.log(`❌ 获取 Agents 失败: ${error}`);
            // 返回降级配置
            return this.getFallbackAgents();
        }
    }

    /**
     * 生成配置文件
     */
    private async generateConfigFile(
        targetFolder: vscode.WorkspaceFolder,
        features: ProjectFeatures,
        matchedAgents: AgentMetadata[]
    ): Promise<string> {
        this.log('📝 正在生成配置文件...');

        const githubDir = path.join(targetFolder.uri.fsPath, '.github');
        const configPath = path.join(githubDir, 'copilot-instructions.md');

        // 确保 .github 目录存在
        if (!fs.existsSync(githubDir)) {
            fs.mkdirSync(githubDir, { recursive: true });
        }

        // 生成配置内容
        const content = this.buildConfigContent(features, matchedAgents);

        // 写入文件
        fs.writeFileSync(configPath, content, 'utf-8');

        this.log(`✅ 配置文件已生成: ${configPath}`);

        // 确保在 .gitignore 中
        this.ensureGitIgnore(targetFolder.uri.fsPath);
        
        return configPath;
    }

    /**
     * 构建配置文件内容
     */
    private buildConfigContent(features: ProjectFeatures, matchedAgents: AgentMetadata[]): string {
        const timestamp = new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        let content = `<!-- ⚠️ 此文件由 Copilot Prompts Manager 插件自动生成 -->\n`;
        content += `<!-- ⚠️ 请勿手动编辑，所有修改将在下次应用配置时被覆盖 -->\n`;
        content += `<!-- ⚠️ 如需修改配置，请使用侧边栏的 Copilot Prompts 视图 -->\n\n`;
        content += `# AI 开发指南\n\n`;
        content += `> 📌 **重要提示**\n`;
        content += `> - 本文件由插件自动生成和维护\n`;
        content += `> - 已添加到 .gitignore，不会提交到 Git\n`;
        content += `> - 配置来源: GitHub (动态获取)\n\n`;
        content += `---\n\n`;

        // 添加项目文档汇总
        content += `# Copilot Prompts Manager - 项目文档汇总\n\n`;
        content += `> 以下内容从 GitHub 仓库动态获取，用于优化插件生成质量\n\n`;
        content += `## 📊 项目特征分析\n\n`;
        content += `- **项目类型**: ${features.projectType}\n`;
        content += `- **框架**: ${features.frameworks.join(', ') || '无'}\n`;
        content += `- **语言**: ${features.languages.join(', ') || '无'}\n`;
        content += `- **工具**: ${features.tools.join(', ') || '无'}\n`;
        content += `- **关键特性**: ${features.keywords.join(', ') || '无'}\n\n`;
        content += `---\n\n`;

        // 添加匹配的 Agents
        if (matchedAgents.length > 0) {
            for (const agent of matchedAgents) {
                content += `<!-- Source: ${agent.path} -->\n\n`;
                content += `{{AGENT_CONTENT_${agent.id}}}\n\n`;
                content += `---\n\n`;
            }
        }

        // 添加应用的 Prompt 列表
        content += `## 📋 应用的 Prompt 列表\n\n`;
        
        if (matchedAgents.length > 0) {
            for (const agent of matchedAgents) {
                content += `- **${agent.title}** (${agent.path})\n`;
                content += `  - ${agent.description}\n`;
                content += `  - 标签: ${agent.tags.join(', ')}\n`;
            }
        } else {
            content += `- 暂无匹配的配置\n`;
        }

        content += `\n生成时间: ${timestamp}\n`;
        content += `配置来源: GitHub (动态获取)\n`;

        return content;
    }

    /**
     * 获取并插入 Agent 内容
     */
    async fetchAndInsertAgentContents(
        targetFolder: vscode.WorkspaceFolder,
        matchedAgents: AgentMetadata[]
    ): Promise<void> {
        const configPath = path.join(targetFolder.uri.fsPath, '.github', 'copilot-instructions.md');
        
        if (!fs.existsSync(configPath)) {
            this.log('⚠️ 配置文件不存在');
            return;
        }

        let content = fs.readFileSync(configPath, 'utf-8');

        this.log('📥 正在获取 Agent 内容...');

        for (const agent of matchedAgents) {
            try {
                const agentContent = await this.githubClient.fetchFileContent(agent.path);
                const placeholder = `{{AGENT_CONTENT_${agent.id}}}`;
                
                if (content.includes(placeholder)) {
                    content = content.replace(placeholder, agentContent);
                    this.log(`   ✓ ${agent.title}`);
                }
            } catch (error) {
                this.log(`   ✗ 获取失败: ${agent.title} - ${error}`);
            }
        }

        // 写回文件
        fs.writeFileSync(configPath, content, 'utf-8');
        this.log('✅ Agent 内容已插入');
    }

    /**
     * 确保配置文件在 .gitignore 中
     */
    private ensureGitIgnore(workspacePath: string): void {
        const gitignorePath = path.join(workspacePath, '.gitignore');
        const targetFile = '.github/copilot-instructions.md';

        let gitignoreContent = '';
        if (fs.existsSync(gitignorePath)) {
            gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
        }

        const lines = gitignoreContent.split('\n');
        const alreadyIgnored = lines.some(line => 
            line.trim() === targetFile || line.trim() === `/${targetFile}`
        );

        if (!alreadyIgnored) {
            const newContent = gitignoreContent.trim() + 
                '\n\n# Auto-generated Copilot configuration\n' + 
                targetFile + '\n';
            fs.writeFileSync(gitignorePath, newContent, 'utf-8');
            this.log('✅ 已添加到 .gitignore');
        }
    }

    /**
     * 降级 Agents（离线模式）
     */
    private getFallbackAgents(): AgentMetadata[] {
        return [
            {
                id: 'typescript',
                path: 'common/typescript-strict.md',
                title: 'TypeScript Strict',
                description: 'TypeScript 严格模式指南',
                tags: ['typescript', 'type-safety'],
                applicableWhen: {
                    languages: ['typescript']
                }
            },
            {
                id: 'vue3',
                path: 'vue/vue3-typescript.md',
                title: 'Vue 3 + TypeScript',
                description: 'Vue 3 Composition API 开发指南',
                tags: ['vue3', 'typescript'],
                applicableWhen: {
                    frameworks: ['vue3'],
                    languages: ['typescript']
                }
            }
        ];
    }

    private log(message: string): void {
        if (this.outputChannel) {
            this.outputChannel.appendLine(message);
        }
    }
}
