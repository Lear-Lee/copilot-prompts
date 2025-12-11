import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { GitHubClient, GitHubPromptData } from './githubClient';

interface PromptData {
    id: string;
    type: 'agent' | 'prompt';
    category: string;
    title: string;
    description: string;
    path: string;
    tags: string[];
    default: boolean;
}

export class ConfigManager {
    private selectedPrompts: Set<string>;
    private readonly STORAGE_KEY = 'selectedPrompts';
    private prompts: PromptData[] = [];
    private githubClient: GitHubClient;
    private projectDocs: string = '';
    private isLoading: boolean = false;

    constructor(private context: vscode.ExtensionContext, private outputChannel?: vscode.OutputChannel) {
        this.githubClient = new GitHubClient(outputChannel);

        // 从存储中恢复选中状态
        const stored = context.workspaceState.get<string[]>(this.STORAGE_KEY);
        if (stored) {
            this.selectedPrompts = new Set(stored);
        } else {
            this.selectedPrompts = new Set();
        }

        // 初始化时加载配置
        this.initialize();
    }

    /**
     * 初始化：从 GitHub 加载配置
     */
    private async initialize(): Promise<void> {
        if (this.isLoading) {
            return;
        }

        try {
            this.isLoading = true;
            this.outputChannel?.appendLine('正在从 GitHub 加载配置...');

            // 并行加载配置列表和项目文档
            const [prompts, docs] = await Promise.all([
                this.githubClient.fetchPromptsList(),
                this.githubClient.fetchProjectDocs()
            ]);

            this.prompts = prompts;
            this.projectDocs = docs;

            // 如果没有选中任何配置，选择默认配置
            if (this.selectedPrompts.size === 0) {
                const defaults = this.prompts.filter(p => p.default).map(p => p.id);
                this.selectedPrompts = new Set(defaults);
                this.saveState();
            }

            this.outputChannel?.appendLine(`✅ 成功加载 ${prompts.length} 个配置`);
        } catch (error) {
            this.outputChannel?.appendLine(`⚠️ 加载配置失败，使用降级模式: ${error}`);
            // 使用降级配置
            this.prompts = this.getFallbackPrompts();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * 刷新配置（从 GitHub 重新加载）
     */
    async refresh(): Promise<void> {
        this.githubClient.clearCache();
        await this.initialize();
    }

    /**
     * 从 GitHub 刷新配置列表（显式调用）
     */
    async refreshFromGitHub(): Promise<void> {
        this.outputChannel?.appendLine('正在从 GitHub 获取最新配置...');
        this.githubClient.clearCache();
        await this.initialize();
    }

    /**
     * 清空指定项目的所有 Copilot 配置
     */
    async clearProjectConfig(targetFolder: vscode.WorkspaceFolder): Promise<void> {
        const configPath = path.join(targetFolder.uri.fsPath, '.github', 'copilot-instructions.md');
        const agentsDir = path.join(targetFolder.uri.fsPath, '.github', 'agents');

        // 删除 copilot-instructions.md
        if (fs.existsSync(configPath)) {
            fs.unlinkSync(configPath);
            this.outputChannel?.appendLine(`✅ 已删除: ${configPath}`);
        }

        // 删除 agents 目录
        if (fs.existsSync(agentsDir)) {
            fs.rmSync(agentsDir, { recursive: true, force: true });
            this.outputChannel?.appendLine(`✅ 已删除: ${agentsDir}`);
        }

        this.outputChannel?.appendLine(`✅ 项目 ${targetFolder.name} 的配置已清空`);
    }

    getAllPrompts(): PromptData[] {
        return this.prompts;
    }

    getSelectedPrompts(): string[] {
        return Array.from(this.selectedPrompts);
    }

    setSelectedPrompts(ids: string[]): void {
        this.selectedPrompts = new Set(ids);
        this.saveState();
    }

    togglePrompt(id: string): void {
        if (this.selectedPrompts.has(id)) {
            this.selectedPrompts.delete(id);
        } else {
            this.selectedPrompts.add(id);
        }
        this.saveState();
    }

    selectAll(): void {
        this.selectedPrompts = new Set(this.prompts.map(p => p.id));
        this.saveState();
    }

    clearAll(): void {
        this.selectedPrompts.clear();
        this.saveState();
    }

    private saveState(): void {
        this.context.workspaceState.update(this.STORAGE_KEY, this.getSelectedPrompts());
    }

    /**
     * Apply configuration globally (user-level) – retained for backward compatibility.
     * This method now reuses the workspace-agnostic logic of applyConfigToWorkspace
     * by targeting the first workspace folder and writing to the user’s global VSCode
     * configuration directory.
     */
    async applyGlobal(): Promise<{ success: boolean; count: number }> {
        const selected = this.getSelectedPrompts();
        if (selected.length === 0) {
            throw new Error('请至少选择一个配置');
        }

        const selectedPrompts = this.prompts.filter(p => selected.includes(p.id));

        // Locate prompts directory using the same logic as applyConfigToWorkspace
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('请先打开一个工作区');
        }
        const config = vscode.workspace.getConfiguration('copilotPrompts');
        const configuredPath = config.get<string>('promptsPath');
        const possiblePaths = [
            configuredPath ? path.resolve(workspaceFolder.uri.fsPath, configuredPath) : null,
            path.join(workspaceFolder.uri.fsPath, 'copilot-prompts'),
            path.resolve(workspaceFolder.uri.fsPath, '../copilot-prompts'),
            workspaceFolder.uri.fsPath
        ].filter(Boolean) as string[];
        let promptsDir: string | undefined;
        for (const testPath of possiblePaths) {
            if (fs.existsSync(testPath) && (
                fs.existsSync(path.join(testPath, 'agents')) ||
                fs.existsSync(path.join(testPath, 'common')) ||
                fs.existsSync(path.join(testPath, 'industry'))
            )) {
                promptsDir = testPath;
                break;
            }
        }
        if (!promptsDir) {
            throw new Error(`找不到 Prompts 目录。已尝试:\n${possiblePaths.join('\n')}`);
        }

        // Build content (same as previous implementation)
        let content = '<!-- ⚠️ 此文件由 Copilot Prompts Manager 插件自动生成 -->\n';
        content += '<!-- ⚠️ 请勿手动编辑，所有修改将在下次应用配置时被覆盖 -->\n\n';
        content += '# AI 开发指南 (全局配置)\n\n';
        content += '> 📌 **重要提示**\n';
        content += '> - 本文件由插件自动生成和维护\n';
        content += '> - 全局配置，仅在本机生效\n';
        content += '> - 位置: ~/.copilot/copilot-instructions.md\n\n';
        content += '---\n\n';
        for (const prompt of selectedPrompts) {
            const filePath = path.join(promptsDir, prompt.path);
            if (fs.existsSync(filePath)) {
                content += `---\n\n`;
                content += `<!-- Source: ${prompt.path} -->\n\n`;
                content += fs.readFileSync(filePath, 'utf-8');
                content += '\n\n';
            }
        }
        content += '---\n\n';
        content += '## 📋 应用的 Prompt 列表\n\n';
        for (const prompt of selectedPrompts) {
            content += `- **${prompt.title}** (${prompt.path})\n`;
            content += `  - ${prompt.description}\n`;
            content += `  - 标签: ${prompt.tags.join(', ')}\n`;
        }
        const now = new Date();
        content += `\n生成时间: ${now.toLocaleString('zh-CN')}\n`;
        content += `配置范围: 全局 (用户级)\n`;

        // 全局写入隐藏 .copilot 目录（位于用户主目录）
        const globalConfigDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.copilot');
        if (!fs.existsSync(globalConfigDir)) {
            fs.mkdirSync(globalConfigDir, { recursive: true });
        }
        const globalConfigPath = path.join(globalConfigDir, 'copilot-instructions.md');
        if (fs.existsSync(globalConfigPath)) {
            const backupPath = `${globalConfigPath}.backup.${Date.now()}`;
            fs.copyFileSync(globalConfigPath, backupPath);
        }
        fs.writeFileSync(globalConfigPath, content, 'utf-8');
        return { success: true, count: selectedPrompts.length };
    }

    /**
     * Apply configuration to a specific workspace folder.
     * If no folder is provided, defaults to the first workspace folder.
     */
    async applyConfigToWorkspace(targetFolder?: vscode.WorkspaceFolder): Promise<{ success: boolean; count: number }> {
        const workspaceFolder = targetFolder || vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('请先打开一个工作区');
        }

        const selected = this.getSelectedPrompts();
        if (selected.length === 0) {
            throw new Error('请至少选择一个配置');
        }

        const selectedPrompts = this.prompts.filter(p => selected.includes(p.id));

        // 生成配置内容
        let content = '<!-- ⚠️ 此文件由 Copilot Prompts Manager 插件自动生成 -->\n';
        content += '<!-- ⚠️ 请勿手动编辑，所有修改将在下次应用配置时被覆盖 -->\n';
        content += '<!-- ⚠️ 如需修改配置，请使用侧边栏的 Copilot Prompts 视图 -->\n\n';
        content += '# AI 开发指南\n\n';
        content += '> 📌 **重要提示**\n';
        content += '> - 本文件由插件自动生成和维护\n';
        content += '> - 已添加到 .gitignore，不会提交到 Git\n';
        content += '> - 配置来源: GitHub (动态获取)\n\n';
        content += '---\n\n';

        // 添加项目文档汇总（优化生成质量）
        if (this.projectDocs) {
            content += this.projectDocs;
            content += '\n\n---\n\n';
        }

        // 添加选中的 prompts 内容
        for (const prompt of selectedPrompts) {
            try {
                // 从 GitHub 获取最新内容
                const promptContent = await this.githubClient.fetchFileContent(prompt.path);

                content += `---\n\n`;
                content += `<!-- Source: ${prompt.path} -->\n\n`;
                content += promptContent;
                content += '\n\n';
            } catch (error) {
                this.outputChannel?.appendLine(`⚠️ 获取 ${prompt.path} 失败: ${error}`);
            }
        }

        content += '---\n\n';
        content += '## 📋 应用的 Prompt 列表\n\n';
        for (const prompt of selectedPrompts) {
            content += `- **${prompt.title}** (${prompt.path})\n`;
            content += `  - ${prompt.description}\n`;
            content += `  - 标签: ${prompt.tags.join(', ')}\n`;
        }

        const now = new Date();
        content += `\n生成时间: ${now.toLocaleString('zh-CN')}\n`;
        content += `配置来源: GitHub (动态获取)\n`;

        // Write to .github folder (required by GitHub Copilot)
        const outputDir = path.join(workspaceFolder.uri.fsPath, '.github');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const outputPath = path.join(outputDir, 'copilot-instructions.md');

        // 备份旧文件
        if (fs.existsSync(outputPath)) {
            const backupPath = `${outputPath}.backup.${Date.now()}`;
            fs.copyFileSync(outputPath, backupPath);
        }

        fs.writeFileSync(outputPath, content, 'utf-8');

        // 同时复制 agent 文件到 .github/agents/ 目录
        const agentPrompts = selectedPrompts.filter(p => p.type === 'agent');
        if (agentPrompts.length > 0) {
            const agentsDir = path.join(outputDir, 'agents');
            if (!fs.existsSync(agentsDir)) {
                fs.mkdirSync(agentsDir, { recursive: true });
            }

            for (const agent of agentPrompts) {
                try {
                    const agentContent = await this.githubClient.fetchFileContent(agent.path);
                    const agentFileName = path.basename(agent.path);
                    const agentFilePath = path.join(agentsDir, agentFileName);
                    
                    // 备份旧文件
                    if (fs.existsSync(agentFilePath)) {
                        const backupPath = `${agentFilePath}.backup.${Date.now()}`;
                        fs.copyFileSync(agentFilePath, backupPath);
                    }
                    
                    fs.writeFileSync(agentFilePath, agentContent, 'utf-8');
                    this.outputChannel?.appendLine(`✅ 已复制 agent: ${agentFileName}`);
                } catch (error) {
                    this.outputChannel?.appendLine(`⚠️ 复制 agent 失败 ${agent.path}: ${error}`);
                }
            }
        }

        // 确保 .gitignore 包含此文件
        this.ensureGitIgnore(workspaceFolder.uri.fsPath, '.github/copilot-instructions.md');
        this.ensureGitIgnore(workspaceFolder.uri.fsPath, '.github/agents/');

        return { success: true, count: selectedPrompts.length };
    }

    /**
     * Legacy applyConfig retains original behavior (apply to first workspace folder).
     */
    async applyConfig(): Promise<{ success: boolean; count: number }> {
        return this.applyConfigToWorkspace();
    }

    /**
     * 确保 .gitignore 包含指定文件
     */
    private ensureGitIgnore(workspacePath: string, fileToIgnore: string): void {
        const gitignorePath = path.join(workspacePath, '.gitignore');
        
        try {
            let content = '';
            if (fs.existsSync(gitignorePath)) {
                content = fs.readFileSync(gitignorePath, 'utf-8');
            }

            // 检查是否已存在
            const lines = content.split('\n');
            const alreadyIgnored = lines.some(line => 
                line.trim() === fileToIgnore || 
                line.trim() === `/${fileToIgnore}`
            );

            if (!alreadyIgnored) {
                // 添加注释和忽略规则
                const newContent = content.trim() + '\n\n# Copilot Prompts 自动生成配置（不提交到仓库）\n' + fileToIgnore + '\n';
                fs.writeFileSync(gitignorePath, newContent, 'utf-8');
                this.outputChannel?.appendLine(`✅ 已将 ${fileToIgnore} 添加到 .gitignore`);
            }
        } catch (error) {
            this.outputChannel?.appendLine(`⚠️ 无法更新 .gitignore: ${error}`);
        }
    }

    /**
     * 获取降级配置
     */
    private getFallbackPrompts(): PromptData[] {
        return [
            {
                id: 'vitasage-agent',
                type: 'agent',
                category: 'agents',
                title: 'VitaSage Agent',
                description: 'VitaSage 工业配方管理系统专用',
                path: 'agents/vitasage.agent.md',
                tags: ['vue3', 'typescript', 'element-plus', 'logicflow'],
                default: true
            },
            {
                id: 'vue3-agent',
                type: 'agent',
                category: 'agents',
                title: 'Vue 3 Agent',
                description: 'Vue 3 + TypeScript + Composition API',
                path: 'agents/vue3.agent.md',
                tags: ['vue3', 'typescript', 'composition-api'],
                default: true
            },
            {
                id: 'typescript-agent',
                type: 'agent',
                category: 'agents',
                title: 'TypeScript Agent',
                description: 'TypeScript 严格模式和类型安全',
                path: 'agents/typescript.agent.md',
                tags: ['typescript', 'type-safety'],
                default: true
            },
            {
                id: 'i18n-agent',
                type: 'agent',
                category: 'agents',
                title: 'i18n Agent',
                description: '国际化最佳实践',
                path: 'agents/i18n.agent.md',
                tags: ['i18n', 'vue-i18n'],
                default: true
            }
        ];
    }
}
