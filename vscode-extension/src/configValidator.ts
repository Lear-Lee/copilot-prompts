import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface FixAction {
    label: string;
    description?: string;
    action: () => Promise<void>;
}

export interface ValidationIssue {
    severity: 'error' | 'warning' | 'info';
    category: 'workspace' | 'file' | 'reference' | 'format' | 'duplicate';
    message: string;
    detail?: string;
    fixes: FixAction[];
    affectedFiles?: string[];
}

export class ConfigValidator {
    private workspaceFolders: readonly vscode.WorkspaceFolder[];
    private promptsRoot: string = '';

    constructor() {
        this.workspaceFolders = vscode.workspace.workspaceFolders || [];
        // 尝试定位 prompts 根目录
        this.locatePromptsRoot();
    }

    /**
     * 定位 prompts 根目录
     */
    private locatePromptsRoot(): void {
        for (const folder of this.workspaceFolders) {
            const possiblePaths = [
                path.join(folder.uri.fsPath, 'copilot-prompts'),
                path.join(folder.uri.fsPath, '.github', 'prompts'),
                folder.uri.fsPath
            ];

            for (const testPath of possiblePaths) {
                if (fs.existsSync(path.join(testPath, 'agents')) || 
                    fs.existsSync(path.join(testPath, 'common')) ||
                    fs.existsSync(path.join(testPath, 'industry'))) {
                    this.promptsRoot = testPath;
                    return;
                }
            }
        }
    }

    /**
     * 检查所有配置问题
     */
    async checkAll(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        // 检查 1: 多文件夹工作区的配置冲突
        const conflictIssues = await this.checkWorkspaceConflicts();
        issues.push(...conflictIssues);

        // 检查 2: 检查是否有备份文件
        const backupIssues = await this.checkBackupFiles();
        issues.push(...backupIssues);

        // 检查 3: 检查项目配置是否存在
        const missingIssues = await this.checkMissingConfigs();
        issues.push(...missingIssues);

        // 检查 4: 检查 Agent 文件完整性
        const agentIssues = await this.checkAgentFiles();
        issues.push(...agentIssues);

        // 检查 5: 检查 Prompt 文件完整性
        const promptIssues = await this.checkPromptFiles();
        issues.push(...promptIssues);

        // 检查 6: 检查引用关系
        const referenceIssues = await this.checkReferences();
        issues.push(...referenceIssues);

        // 检查 7: 检查文件格式
        const formatIssues = await this.checkFileFormats();
        issues.push(...formatIssues);

        // 检查 8: 检查重复定义
        const duplicateIssues = await this.checkDuplicates();
        issues.push(...duplicateIssues);

        return issues;
    }

    /**
     * 检查工作区配置冲突
     */
    private async checkWorkspaceConflicts(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        if (this.workspaceFolders.length <= 1) {
            return issues;
        }

        const configPaths: { folder: string; path: string; content: string }[] = [];

        for (const folder of this.workspaceFolders) {
            const configPath = path.join(folder.uri.fsPath, '.github', 'copilot-instructions.md');
            if (fs.existsSync(configPath)) {
                const content = fs.readFileSync(configPath, 'utf-8');
                configPaths.push({
                    folder: folder.name,
                    path: configPath,
                    content: content
                });
            }
        }

        if (configPaths.length > 1) {
            const firstFolder = configPaths[0].folder;
            const otherFolders = configPaths.slice(1).map(c => c.folder).join(', ');

            issues.push({
                severity: 'warning',
                category: 'workspace',
                message: `检测到多个项目都有配置文件`,
                detail: `当前生效: ${firstFolder}\n其他项目: ${otherFolders}`,
                affectedFiles: configPaths.map(c => c.path),
                fixes: [
                    {
                        label: '查看冲突详情',
                        description: '显示所有配置文件位置',
                        action: async () => {
                            const items = configPaths.map((c, index) => ({
                                label: `${index === 0 ? '$(check) ' : '$(warning) '}${c.folder}`,
                                description: index === 0 ? '当前生效' : '可能不生效',
                                detail: c.path,
                                buttons: [{
                                    iconPath: new vscode.ThemeIcon('go-to-file'),
                                    tooltip: '打开文件'
                                }]
                            }));

                            const selected = await vscode.window.showQuickPick(items, {
                                title: '工作区配置冲突',
                                placeHolder: '选择查看具体配置文件'
                            });

                            if (selected) {
                                const config = configPaths.find(c => c.folder === selected.label.replace(/\$\(.*?\) /, ''));
                                if (config) {
                                    const doc = await vscode.workspace.openTextDocument(config.path);
                                    await vscode.window.showTextDocument(doc);
                                }
                            }
                        }
                    },
                    {
                        label: '备份非活动项目配置',
                        description: '保留第一个项目配置，备份其他',
                        action: async () => {
                            const choice = await vscode.window.showWarningMessage(
                                `将备份除 ${firstFolder} 外的所有配置文件`,
                                { modal: true },
                                '确认',
                                '取消'
                            );

                            if (choice === '确认') {
                                let backupCount = 0;
                                for (let i = 1; i < configPaths.length; i++) {
                                    const backupPath = configPaths[i].path + '.backup';
                                    fs.renameSync(configPaths[i].path, backupPath);
                                    backupCount++;
                                }
                                vscode.window.showInformationMessage(`✅ 已备份 ${backupCount} 个配置文件`);
                            }
                        }
                    },
                    {
                        label: '为每个项目创建独立配置',
                        description: '基于当前配置生成各项目配置',
                        action: async () => {
                            const selected = await vscode.window.showQuickPick(
                                configPaths.map(c => ({
                                    label: c.folder,
                                    picked: true
                                })),
                                {
                                    title: '选择需要配置的项目',
                                    canPickMany: true
                                }
                            );

                            if (selected && selected.length > 0) {
                                vscode.window.showInformationMessage(
                                    `将为 ${selected.length} 个项目创建配置，请使用"应用配置"命令`
                                );
                            }
                        }
                    }
                ]
            });
        }

        return issues;
    }

    /**
     * 检查备份文件
     */
    private async checkBackupFiles(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        for (const folder of this.workspaceFolders) {
            const backupPath = path.join(folder.uri.fsPath, '.github', 'copilot-instructions.md.backup');
            if (fs.existsSync(backupPath)) {
                const originalPath = path.join(folder.uri.fsPath, '.github', 'copilot-instructions.md');
                const hasOriginal = fs.existsSync(originalPath);

                issues.push({
                    severity: 'info',
                    category: 'file',
                    message: `发现备份文件: ${folder.name}`,
                    detail: hasOriginal ? '当前配置文件已存在' : '当前无活动配置',
                    affectedFiles: [backupPath],
                    fixes: [
                        {
                            label: '恢复备份',
                            description: hasOriginal ? '将替换当前配置' : '恢复为活动配置',
                            action: async () => {
                                const message = hasOriginal 
                                    ? `确认用备份替换 ${folder.name} 的当前配置？`
                                    : `确认恢复 ${folder.name} 的配置备份？`;
                                
                                const choice = await vscode.window.showWarningMessage(
                                    message,
                                    { modal: true },
                                    '恢复',
                                    '取消'
                                );

                                if (choice === '恢复') {
                                    if (hasOriginal) {
                                        fs.unlinkSync(originalPath);
                                    }
                                    fs.renameSync(backupPath, originalPath);
                                    vscode.window.showInformationMessage(`✅ 已恢复 ${folder.name} 的配置`);
                                }
                            }
                        },
                        {
                            label: '查看备份内容',
                            description: '对比备份与当前配置',
                            action: async () => {
                                const doc = await vscode.workspace.openTextDocument(backupPath);
                                await vscode.window.showTextDocument(doc);

                                if (hasOriginal) {
                                    const originalDoc = await vscode.workspace.openTextDocument(originalPath);
                                    await vscode.commands.executeCommand('vscode.diff', 
                                        vscode.Uri.file(backupPath), 
                                        vscode.Uri.file(originalPath),
                                        '备份 ↔ 当前'
                                    );
                                }
                            }
                        },
                        {
                            label: '删除备份',
                            description: '不再需要此备份',
                            action: async () => {
                                const choice = await vscode.window.showWarningMessage(
                                    `确认删除 ${folder.name} 的备份文件？`,
                                    { modal: true },
                                    '删除',
                                    '取消'
                                );

                                if (choice === '删除') {
                                    fs.unlinkSync(backupPath);
                                    vscode.window.showInformationMessage(`✅ 已删除备份文件`);
                                }
                            }
                        }
                    ]
                });
            }
        }

        return issues;
    }

    /**
     * 检查缺失的配置
     */
    private async checkMissingConfigs(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        for (const folder of this.workspaceFolders) {
            const configPath = path.join(folder.uri.fsPath, '.github', 'copilot-instructions.md');
            if (!fs.existsSync(configPath)) {
                issues.push({
                    severity: 'info',
                    category: 'file',
                    message: `${folder.name} 未配置 Copilot Prompts`,
                    detail: '建议为此项目创建独立配置',
                    affectedFiles: [configPath],
                    fixes: [
                        {
                            label: '立即配置',
                            description: '为此项目应用选中的 Prompts',
                            action: async () => {
                                await vscode.commands.executeCommand('copilotPrompts.applyConfig');
                            }
                        },
                        {
                            label: '忽略此项目',
                            description: '不需要为此项目配置',
                            action: async () => {
                                vscode.window.showInformationMessage('已忽略');
                            }
                        }
                    ]
                });
            }
        }

        return issues;
    }

    /**
     * 检查 Agent 文件完整性
     */
    private async checkAgentFiles(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        if (!this.promptsRoot) {
            return issues;
        }

        const agentsDir = path.join(this.promptsRoot, 'agents');
        if (!fs.existsSync(agentsDir)) {
            return issues;
        }

        const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.agent.md'));

        for (const file of agentFiles) {
            const filePath = path.join(agentsDir, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // 检查必需的 frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
            if (!frontmatterMatch) {
                issues.push({
                    severity: 'error',
                    category: 'format',
                    message: `Agent 文件缺少 frontmatter: ${file}`,
                    detail: '必须包含 YAML frontmatter 配置',
                    affectedFiles: [filePath],
                    fixes: [
                        {
                            label: '添加模板 frontmatter',
                            description: '自动添加标准配置',
                            action: async () => {
                                const template = `---
description: '描述信息'
tools: ['edit', 'search']
---

`;
                                fs.writeFileSync(filePath, template + content, 'utf-8');
                                vscode.window.showInformationMessage('✅ 已添加 frontmatter');
                            }
                        },
                        {
                            label: '查看文件',
                            action: async () => {
                                const doc = await vscode.workspace.openTextDocument(filePath);
                                await vscode.window.showTextDocument(doc);
                            }
                        }
                    ]
                });
                continue;
            }

            // 检查 description 字段
            const frontmatter = frontmatterMatch[1];
            if (!frontmatter.includes('description:')) {
                issues.push({
                    severity: 'warning',
                    category: 'format',
                    message: `Agent 文件缺少描述: ${file}`,
                    detail: 'description 字段是必需的',
                    affectedFiles: [filePath],
                    fixes: [
                        {
                            label: '添加描述字段',
                            action: async () => {
                                const doc = await vscode.workspace.openTextDocument(filePath);
                                await vscode.window.showTextDocument(doc);
                            }
                        }
                    ]
                });
            }

            // 检查文件内容是否为空
            const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
            if (bodyContent.length < 50) {
                issues.push({
                    severity: 'warning',
                    category: 'file',
                    message: `Agent 文件内容过少: ${file}`,
                    detail: '建议添加更详细的说明和示例',
                    affectedFiles: [filePath],
                    fixes: [
                        {
                            label: '编辑文件',
                            action: async () => {
                                const doc = await vscode.workspace.openTextDocument(filePath);
                                await vscode.window.showTextDocument(doc);
                            }
                        }
                    ]
                });
            }
        }

        return issues;
    }

    /**
     * 检查 Prompt 文件完整性
     */
    private async checkPromptFiles(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        if (!this.promptsRoot) {
            return issues;
        }

        const promptDirs = ['common', 'industry', 'vue', 'vscode-extension'];
        
        for (const dir of promptDirs) {
            const dirPath = path.join(this.promptsRoot, dir);
            if (!fs.existsSync(dirPath)) {
                continue;
            }

            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md') && !f.endsWith('.agent.md'));

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const content = fs.readFileSync(filePath, 'utf-8');

                // 检查是否有标题
                if (!content.match(/^#\s+.+/m)) {
                    issues.push({
                        severity: 'warning',
                        category: 'format',
                        message: `Prompt 文件缺少标题: ${dir}/${file}`,
                        detail: '建议添加 Markdown 一级标题',
                        affectedFiles: [filePath],
                        fixes: [
                            {
                                label: '编辑文件',
                                action: async () => {
                                    const doc = await vscode.workspace.openTextDocument(filePath);
                                    await vscode.window.showTextDocument(doc);
                                }
                            }
                        ]
                    });
                }

                // 检查文件大小
                if (content.length < 100) {
                    issues.push({
                        severity: 'info',
                        category: 'file',
                        message: `Prompt 文件内容较少: ${dir}/${file}`,
                        detail: '可能需要补充更多内容',
                        affectedFiles: [filePath],
                        fixes: [
                            {
                                label: '编辑文件',
                                action: async () => {
                                    const doc = await vscode.workspace.openTextDocument(filePath);
                                    await vscode.window.showTextDocument(doc);
                                }
                            }
                        ]
                    });
                }
            }
        }

        return issues;
    }

    /**
     * 检查引用关系
     */
    private async checkReferences(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        if (!this.promptsRoot) {
            return issues;
        }

        // 检查 agents 对 prompts 的引用
        const agentsDir = path.join(this.promptsRoot, 'agents');
        if (fs.existsSync(agentsDir)) {
            const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.agent.md'));

            for (const file of agentFiles) {
                const filePath = path.join(agentsDir, file);
                const content = fs.readFileSync(filePath, 'utf-8');

                // 查找两种格式的引用: prompts/xxx/yyy.md 或 xxx/yyy.md
                const promptsRefs = content.match(/prompts\/[\w-]+\/[\w-]+\.md/g) || [];
                const directRefs = content.match(/(?<!prompts\/)(common|industry|vue|vscode-extension)\/[\w-]+\.md/g) || [];
                const references = [...promptsRefs, ...directRefs];
                
                for (const ref of references) {
                    // 尝试两种路径格式
                    const refWithPrompts = ref.startsWith('prompts/') ? ref : `prompts/${ref}`;
                    const refWithoutPrompts = ref.replace(/^prompts\//, '');
                    
                    const possiblePaths = [
                        path.join(this.promptsRoot, refWithoutPrompts),  // common/i18n.md
                        path.join(this.promptsRoot, refWithPrompts),     // prompts/common/i18n.md
                        path.join(this.promptsRoot, ref)                 // 原始引用
                    ];
                    
                    const refPath = possiblePaths.find(p => fs.existsSync(p));
                    
                    if (!refPath) {
                        // 确定应该创建的路径（优先使用不带 prompts 前缀的）
                        const targetPath = path.join(this.promptsRoot, refWithoutPrompts);
                        
                        issues.push({
                            severity: 'error',
                            category: 'reference',
                            message: `Agent 引用的 Prompt 不存在: ${file}`,
                            detail: `引用路径: ${ref}`,
                            affectedFiles: [filePath, targetPath],
                            fixes: [
                                {
                                    label: '创建缺失的 Prompt',
                                    description: `创建 ${path.basename(targetPath)}`,
                                    action: async () => {
                                        const dir = path.dirname(targetPath);
                                        if (!fs.existsSync(dir)) {
                                            fs.mkdirSync(dir, { recursive: true });
                                        }
                                        fs.writeFileSync(targetPath, `# ${path.basename(targetPath, '.md')}\n\n`, 'utf-8');
                                        const doc = await vscode.workspace.openTextDocument(targetPath);
                                        await vscode.window.showTextDocument(doc);
                                    }
                                },
                                {
                                    label: '移除引用',
                                    description: '从 Agent 文件中删除此引用',
                                    action: async () => {
                                        const doc = await vscode.workspace.openTextDocument(filePath);
                                        await vscode.window.showTextDocument(doc);
                                    }
                                },
                                {
                                    label: '查看所有可用 Prompts',
                                    action: async () => {
                                        const allPrompts: string[] = [];
                                        const dirs = ['common', 'industry', 'vue', 'vscode-extension'];
                                        for (const dir of dirs) {
                                            const dirPath = path.join(this.promptsRoot, dir);
                                            if (fs.existsSync(dirPath)) {
                                                const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.md'));
                                                allPrompts.push(...files.map(f => `${dir}/${f}`));
                                            }
                                        }
                                        
                                        const selected = await vscode.window.showQuickPick(allPrompts, {
                                            title: '选择要引用的 Prompt',
                                            placeHolder: '当前可用的 Prompts'
                                        });

                                        if (selected) {
                                            vscode.window.showInformationMessage(`可以在 Agent 中引用: prompts/${selected}`);
                                        }
                                    }
                                }
                            ]
                        });
                    }
                }
            }
        }

        return issues;
    }

    /**
     * 检查文件格式
     */
    private async checkFileFormats(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        if (!this.promptsRoot) {
            return issues;
        }

        const agentsDir = path.join(this.promptsRoot, 'agents');
        if (fs.existsSync(agentsDir)) {
            const files = fs.readdirSync(agentsDir);

            for (const file of files) {
                if (file.endsWith('.md') && !file.endsWith('.agent.md')) {
                    const filePath = path.join(agentsDir, file);
                    issues.push({
                        severity: 'warning',
                        category: 'format',
                        message: `agents 目录中的文件命名不规范: ${file}`,
                        detail: 'Agent 文件应以 .agent.md 结尾',
                        affectedFiles: [filePath],
                        fixes: [
                            {
                                label: '重命名为 Agent 格式',
                                description: `重命名为 ${file.replace(/\.md$/, '.agent.md')}`,
                                action: async () => {
                                    const newPath = filePath.replace(/\.md$/, '.agent.md');
                                    fs.renameSync(filePath, newPath);
                                    vscode.window.showInformationMessage('✅ 已重命名');
                                }
                            },
                            {
                                label: '移动到 prompts 目录',
                                description: '这可能是一个普通 Prompt',
                                action: async () => {
                                    const targetDir = path.join(this.promptsRoot, 'common');
                                    if (!fs.existsSync(targetDir)) {
                                        fs.mkdirSync(targetDir, { recursive: true });
                                    }
                                    const newPath = path.join(targetDir, file);
                                    fs.renameSync(filePath, newPath);
                                    vscode.window.showInformationMessage('✅ 已移动到 common 目录');
                                }
                            }
                        ]
                    });
                }
            }
        }

        return issues;
    }

    /**
     * 检查重复定义
     */
    private async checkDuplicates(): Promise<ValidationIssue[]> {
        const issues: ValidationIssue[] = [];

        if (!this.promptsRoot) {
            return issues;
        }

        // 检查重复的文件名
        const allFiles = new Map<string, string[]>();

        const scanDir = (dir: string, prefix: string = '') => {
            if (!fs.existsSync(dir)) return;
            
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory()) {
                    scanDir(fullPath, prefix + file + '/');
                } else if (file.endsWith('.md')) {
                    const key = file.toLowerCase();
                    if (!allFiles.has(key)) {
                        allFiles.set(key, []);
                    }
                    allFiles.get(key)!.push(prefix + file);
                }
            }
        };

        scanDir(this.promptsRoot);

        for (const [filename, locations] of allFiles.entries()) {
            if (locations.length > 1) {
                issues.push({
                    severity: 'warning',
                    category: 'duplicate',
                    message: `发现重复的文件名: ${filename}`,
                    detail: `存在于: ${locations.join(', ')}`,
                    affectedFiles: locations.map(l => path.join(this.promptsRoot, l)),
                    fixes: [
                        {
                            label: '查看所有重复文件',
                            action: async () => {
                                const items = locations.map(loc => ({
                                    label: loc,
                                    description: '点击打开'
                                }));

                                const selected = await vscode.window.showQuickPick(items, {
                                    title: '重复的文件',
                                    placeHolder: '选择要查看的文件'
                                });

                                if (selected) {
                                    const doc = await vscode.workspace.openTextDocument(
                                        path.join(this.promptsRoot, selected.label)
                                    );
                                    await vscode.window.showTextDocument(doc);
                                }
                            }
                        },
                        {
                            label: '对比文件内容',
                            description: '查看文件是否真的重复',
                            action: async () => {
                                if (locations.length >= 2) {
                                    await vscode.commands.executeCommand('vscode.diff',
                                        vscode.Uri.file(path.join(this.promptsRoot, locations[0])),
                                        vscode.Uri.file(path.join(this.promptsRoot, locations[1])),
                                        `${locations[0]} ↔ ${locations[1]}`
                                    );
                                }
                            }
                        },
                        {
                            label: '重命名以区分',
                            description: '给文件添加前缀或后缀',
                            action: async () => {
                                vscode.window.showInformationMessage('请手动重命名文件以区分用途');
                            }
                        }
                    ]
                });
            }
        }

        return issues;
    }

    /**
     * 显示检查结果（增强版）
     */
    async showResults(issues: ValidationIssue[]): Promise<void> {
        if (issues.length === 0) {
            vscode.window.showInformationMessage('✅ 未发现配置问题');
            return;
        }

        // 统计问题数量
        const errors = issues.filter(i => i.severity === 'error').length;
        const warnings = issues.filter(i => i.severity === 'warning').length;
        const infos = issues.filter(i => i.severity === 'info').length;

        // 按类别分组
        const byCategory = {
            workspace: issues.filter(i => i.category === 'workspace'),
            file: issues.filter(i => i.category === 'file'),
            reference: issues.filter(i => i.category === 'reference'),
            format: issues.filter(i => i.category === 'format'),
            duplicate: issues.filter(i => i.category === 'duplicate')
        };

        let summary = '🔍 配置检查结果:\n';
        if (errors > 0) summary += `\n❌ 错误: ${errors} 个`;
        if (warnings > 0) summary += `\n⚠️ 警告: ${warnings} 个`;
        if (infos > 0) summary += `\nℹ️ 信息: ${infos} 个`;

        // 创建问题列表项
        const items: any[] = [];

        // 添加分类标签
        const categoryLabels = {
            workspace: '$(workspace) 工作区问题',
            file: '$(file) 文件问题',
            reference: '$(link) 引用问题',
            format: '$(symbol-ruler) 格式问题',
            duplicate: '$(copy) 重复问题'
        };

        for (const [category, categoryIssues] of Object.entries(byCategory)) {
            if (categoryIssues.length === 0) continue;

            // 添加分类标题
            items.push({
                label: categoryLabels[category as keyof typeof categoryLabels],
                kind: vscode.QuickPickItemKind.Separator
            });

            // 添加该分类的问题
            for (const issue of categoryIssues) {
                const icon = issue.severity === 'error' ? '$(error)' : 
                            issue.severity === 'warning' ? '$(warning)' : '$(info)';
                
                items.push({
                    label: `${icon} ${issue.message}`,
                    detail: issue.detail,
                    description: `${issue.fixes.length} 个解决方案`,
                    issue: issue
                });
            }
        }

        // 添加批量操作
        items.push({
            label: '',
            kind: vscode.QuickPickItemKind.Separator
        });
        items.push({
            label: '$(tools) 批量修复所有问题',
            description: '尝试自动修复所有可修复的问题',
            batch: 'fix-all'
        });
        items.push({
            label: '$(export) 导出检查报告',
            description: '生成详细的问题报告',
            batch: 'export'
        });

        const selected = await vscode.window.showQuickPick(items, {
            title: summary,
            placeHolder: '选择一个问题查看解决方案',
            matchOnDetail: true
        });

        if (!selected) return;

        // 处理批量操作
        if (selected.batch === 'fix-all') {
            await this.batchFixIssues(issues);
            return;
        }

        if (selected.batch === 'export') {
            await this.exportReport(issues);
            return;
        }

        // 显示单个问题的解决方案
        if (selected.issue) {
            await this.showFixOptions(selected.issue);
        }
    }

    /**
     * 显示修复选项
     */
    private async showFixOptions(issue: ValidationIssue): Promise<void> {
        const fixItems = issue.fixes.map(fix => ({
            label: fix.label,
            description: fix.description || '',
            fix: fix
        }));

        fixItems.push({
            label: '$(close) 取消',
            description: '',
            fix: null as any
        });

        const selected = await vscode.window.showQuickPick(fixItems, {
            title: `解决方案: ${issue.message}`,
            placeHolder: '选择一个解决方案'
        });

        if (selected?.fix) {
            await selected.fix.action();
            
            // 修复后重新检查
            const choice = await vscode.window.showInformationMessage(
                '是否重新检查配置？',
                '重新检查',
                '稍后'
            );

            if (choice === '重新检查') {
                await vscode.commands.executeCommand('copilotPrompts.checkIssues');
            }
        }
    }

    /**
     * 批量修复问题
     */
    private async batchFixIssues(issues: ValidationIssue[]): Promise<void> {
        const fixableIssues = issues.filter(issue => 
            issue.fixes.length > 0 && 
            issue.fixes.some(f => f.label.includes('自动') || f.label.includes('添加'))
        );

        if (fixableIssues.length === 0) {
            vscode.window.showInformationMessage('没有可自动修复的问题');
            return;
        }

        const choice = await vscode.window.showWarningMessage(
            `发现 ${fixableIssues.length} 个可自动修复的问题，是否继续？`,
            { modal: true },
            '修复',
            '取消'
        );

        if (choice !== '修复') return;

        let fixed = 0;
        let failed = 0;

        for (const issue of fixableIssues) {
            try {
                const autoFix = issue.fixes.find(f => 
                    f.label.includes('自动') || f.label.includes('添加')
                );
                
                if (autoFix) {
                    await autoFix.action();
                    fixed++;
                }
            } catch (err) {
                failed++;
                console.error('Fix failed:', err);
            }
        }

        vscode.window.showInformationMessage(
            `批量修复完成: ${fixed} 个成功, ${failed} 个失败`
        );
    }

    /**
     * 导出检查报告
     */
    private async exportReport(issues: ValidationIssue[]): Promise<void> {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const reportPath = path.join(
            this.workspaceFolders[0]?.uri.fsPath || '',
            `copilot-prompts-check-${timestamp}.md`
        );

        let report = `# Copilot Prompts 配置检查报告\n\n`;
        report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
        report += `## 问题概览\n\n`;
        report += `- ❌ 错误: ${issues.filter(i => i.severity === 'error').length} 个\n`;
        report += `- ⚠️ 警告: ${issues.filter(i => i.severity === 'warning').length} 个\n`;
        report += `- ℹ️ 信息: ${issues.filter(i => i.severity === 'info').length} 个\n\n`;

        // 按类别分组
        const byCategory = {
            workspace: issues.filter(i => i.category === 'workspace'),
            file: issues.filter(i => i.category === 'file'),
            reference: issues.filter(i => i.category === 'reference'),
            format: issues.filter(i => i.category === 'format'),
            duplicate: issues.filter(i => i.category === 'duplicate')
        };

        const categoryTitles = {
            workspace: '工作区问题',
            file: '文件问题',
            reference: '引用问题',
            format: '格式问题',
            duplicate: '重复问题'
        };

        for (const [category, categoryIssues] of Object.entries(byCategory)) {
            if (categoryIssues.length === 0) continue;

            report += `## ${categoryTitles[category as keyof typeof categoryTitles]}\n\n`;

            for (const issue of categoryIssues) {
                const icon = issue.severity === 'error' ? '❌' : 
                            issue.severity === 'warning' ? '⚠️' : 'ℹ️';
                
                report += `### ${icon} ${issue.message}\n\n`;
                if (issue.detail) {
                    report += `**详情**: ${issue.detail}\n\n`;
                }
                if (issue.affectedFiles && issue.affectedFiles.length > 0) {
                    report += `**相关文件**:\n`;
                    for (const file of issue.affectedFiles) {
                        report += `- \`${file}\`\n`;
                    }
                    report += '\n';
                }
                report += `**解决方案**:\n`;
                for (const fix of issue.fixes) {
                    report += `- ${fix.label}`;
                    if (fix.description) {
                        report += ` - ${fix.description}`;
                    }
                    report += '\n';
                }
                report += '\n';
            }
        }

        fs.writeFileSync(reportPath, report, 'utf-8');

        const choice = await vscode.window.showInformationMessage(
            `报告已生成: ${path.basename(reportPath)}`,
            '打开'
        );

        if (choice === '打开') {
            const doc = await vscode.workspace.openTextDocument(reportPath);
            await vscode.window.showTextDocument(doc);
        }
    }

    /**
     * 快速修复：备份第一个文件夹的配置（已废弃，使用新的 fixes 机制）
     */
    async backupFirstFolderConfig(): Promise<boolean> {
        if (this.workspaceFolders.length === 0) {
            return false;
        }

        const firstFolder = this.workspaceFolders[0];
        const configPath = path.join(firstFolder.uri.fsPath, '.github', 'copilot-instructions.md');
        
        if (!fs.existsSync(configPath)) {
            vscode.window.showWarningMessage(`${firstFolder.name} 没有配置文件`);
            return false;
        }

        const backupPath = configPath + '.backup';
        
        const choice = await vscode.window.showWarningMessage(
            `确认备份 ${firstFolder.name} 的配置文件？\n这将避免影响其他项目`,
            { modal: true },
            '备份',
            '取消'
        );

        if (choice === '备份') {
            fs.renameSync(configPath, backupPath);
            vscode.window.showInformationMessage(`✅ 已备份 ${firstFolder.name} 的配置`);
            return true;
        }

        return false;
    }
}