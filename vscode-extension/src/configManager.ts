import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

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

    // Prompts 数据
    private readonly prompts: PromptData[] = [
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
        },
        {
            id: 'vitasage-recipe',
            type: 'prompt',
            category: 'industry',
            title: 'VitaSage 配方系统',
            description: '工业配方管理系统完整开发规范',
            path: 'industry/vitasage-recipe.md',
            tags: ['vue3', 'typescript', 'element-plus'],
            default: false
        },
        {
            id: 'vue3-typescript',
            type: 'prompt',
            category: 'vue',
            title: 'Vue 3 + TypeScript',
            description: 'Vue 3 Composition API + TypeScript 最佳实践',
            path: 'vue/vue3-typescript.md',
            tags: ['vue3', 'typescript'],
            default: false
        },
        {
            id: 'typescript-strict',
            type: 'prompt',
            category: 'common',
            title: 'TypeScript 严格模式',
            description: '零 any、严格空检查、完整类型定义',
            path: 'common/typescript-strict.md',
            tags: ['typescript', 'type-safety'],
            default: false
        },
        {
            id: 'i18n',
            type: 'prompt',
            category: 'common',
            title: '国际化 (i18n)',
            description: '零硬编码文本，完整国际化方案',
            path: 'common/i18n.md',
            tags: ['i18n', 'vue-i18n'],
            default: false
        }
    ];

    constructor(private context: vscode.ExtensionContext) {
        // 从存储中恢复选中状态
        const stored = context.workspaceState.get<string[]>(this.STORAGE_KEY);
        if (stored) {
            this.selectedPrompts = new Set(stored);
        } else {
            // 默认选中
            this.selectedPrompts = new Set(
                this.prompts.filter(p => p.default).map(p => p.id)
            );
        }
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

    async applyGlobal(): Promise<{ success: boolean; count: number }> {
        const selected = this.getSelectedPrompts();
        if (selected.length === 0) {
            throw new Error('请至少选择一个配置');
        }

        const selectedPrompts = this.prompts.filter(p => selected.includes(p.id));

        // 获取 prompts 目录路径
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        const config = vscode.workspace.getConfiguration('copilotPrompts');
        const promptsPath = config.get<string>('promptsPath') || '../copilot-prompts';
        
        let promptsDir: string;
        if (workspaceFolder) {
            promptsDir = path.resolve(workspaceFolder.uri.fsPath, promptsPath);
        } else {
            // 如果没有工作区，使用绝对路径
            promptsDir = '/Users/pailasi/Work/copilot-prompts';
        }

        // 检查目录是否存在
        if (!fs.existsSync(promptsDir)) {
            throw new Error(`Prompts 目录不存在: ${promptsDir}`);
        }

        // 生成配置内容
        let content = '# AI 开发指南 (全局配置)\n\n';
        content += '> 本文件自动生成，仅在本机生效，不会提交到 Git\n\n';
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

        // 写入全局配置文件
        const globalConfigDir = path.join(process.env.HOME || process.env.USERPROFILE || '', '.vscode');
        if (!fs.existsSync(globalConfigDir)) {
            fs.mkdirSync(globalConfigDir, { recursive: true });
        }

        const globalConfigPath = path.join(globalConfigDir, 'copilot-instructions.md');
        
        // 备份旧文件
        if (fs.existsSync(globalConfigPath)) {
            const backupPath = `${globalConfigPath}.backup.${Date.now()}`;
            fs.copyFileSync(globalConfigPath, backupPath);
        }

        fs.writeFileSync(globalConfigPath, content, 'utf-8');

        return { success: true, count: selectedPrompts.length };
    }

    async applyConfig(): Promise<{ success: boolean; count: number }> {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('请先打开一个工作区');
        }

        const selected = this.getSelectedPrompts();
        if (selected.length === 0) {
            throw new Error('请至少选择一个配置');
        }

        const selectedPrompts = this.prompts.filter(p => selected.includes(p.id));

        // 获取 prompts 目录路径
        const config = vscode.workspace.getConfiguration('copilotPrompts');
        const promptsPath = config.get<string>('promptsPath') || '../copilot-prompts';
        const promptsDir = path.resolve(workspaceFolder.uri.fsPath, promptsPath);

        // 检查目录是否存在
        if (!fs.existsSync(promptsDir)) {
            const createLink = await vscode.window.showWarningMessage(
                `Prompts 目录不存在: ${promptsPath}`,
                '创建符号链接',
                '取消'
            );
            
            if (createLink === '创建符号链接') {
                const githubDir = path.join(workspaceFolder.uri.fsPath, '.github');
                if (!fs.existsSync(githubDir)) {
                    fs.mkdirSync(githubDir, { recursive: true });
                }
                const linkPath = path.join(githubDir, 'prompts');
                fs.symlinkSync(promptsDir, linkPath, 'dir');
            } else {
                throw new Error('取消操作');
            }
        }

        // 生成配置内容
        let content = '# AI 开发指南\n\n';
        content += '> 本文件自动生成，请勿手动编辑\n\n';
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

        // 写入文件
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

        return { success: true, count: selectedPrompts.length };
    }
}
