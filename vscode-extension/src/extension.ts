import * as vscode from 'vscode';
import { PromptsProvider, PromptItem } from './promptsProvider';
import { ConfigManager } from './configManager';
import { ConfigValidator } from './configValidator';

export function activate(context: vscode.ExtensionContext) {
    console.log('Copilot Prompts Manager 已激活');

    // 创建输出通道
    const outputChannel = vscode.window.createOutputChannel('Copilot Prompts Manager');
    outputChannel.appendLine('Copilot Prompts Manager v1.3.0 已启动');
    outputChannel.appendLine('配置源: GitHub (动态获取)');
    outputChannel.appendLine('正在从 GitHub 获取最新配置列表...');

    const configManager = new ConfigManager(context, outputChannel);
    const promptsProvider = new PromptsProvider(configManager);
    const configValidator = new ConfigValidator(configManager);

    // 启动时自动刷新配置列表
    (async () => {
        try {
            await configManager.refreshFromGitHub();
            promptsProvider.refresh();
            outputChannel.appendLine('✅ 配置列表已更新');
        } catch (error) {
            outputChannel.appendLine(`⚠️ 自动刷新失败: ${error}`);
            outputChannel.appendLine('将使用本地缓存的配置');
        }
    })();

    // 注册 TreeView
    const treeView = vscode.window.createTreeView('copilotPromptsTree', {
        treeDataProvider: promptsProvider,
        showCollapseAll: true,
        canSelectMany: true
    });

    // 监听 checkbox 变化事件，立即生效
    treeView.onDidChangeCheckboxState(async (event) => {
        for (const [item, state] of event.items) {
            const promptItem = item as PromptItem;
            if (promptItem.id && promptItem.contextValue === 'prompt') {
                const isChecked = state === vscode.TreeItemCheckboxState.Checked;
                const currentlySelected = configManager.getSelectedPrompts().includes(promptItem.id);

                // 只在状态变化时处理
                if (isChecked !== currentlySelected) {
                    configManager.togglePrompt(promptItem.id);
                }
            }
        }

        // 静默应用配置（无需用户感知）
        await configManager.applyConfig();
        promptsProvider.refresh();
        updateStatusBar();
    });

    // 创建状态栏
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    statusBarItem.command = 'copilotPrompts.viewCurrent';
    context.subscriptions.push(statusBarItem);

    // 更新状态栏
    const updateStatusBar = () => {
        const selected = configManager.getSelectedPrompts();
        const count = selected.length;
        const allPrompts = configManager.getAllPrompts();
        const activePrompts = allPrompts.filter(p => selected.includes(p.id));
        const tooltip = activePrompts.length > 0
            ? `生效中 (${count}):\n${activePrompts.map(p => `• ${p.title}`).join('\n')}`
            : 'Copilot Prompts - 未选择配置';

        statusBarItem.text = count > 0 ? `$(check) ${count}` : '$(circle-slash) 0';
        statusBarItem.tooltip = tooltip;
        statusBarItem.show();
    };
    updateStatusBar();

    // 应用配置到当前项目（静默执行）
    const applyConfig = vscode.commands.registerCommand('copilotPrompts.applyConfig', async () => {
        try {
            const selected = configManager.getSelectedPrompts();
            if (selected.length === 0) {
                const action = await vscode.window.showWarningMessage(
                    '还没有选择任何配置',
                    '去选择',
                    '取消'
                );
                if (action === '去选择') {
                    vscode.commands.executeCommand('copilotPromptsTree.focus');
                }
                return;
            }

            const result = await configManager.applyConfig();
            if (result.success) {
                // 静默应用，仅在状态栏显示
                updateStatusBar();
                outputChannel.appendLine(`✅ 配置已应用 (${result.count} 个)`);
                vscode.window.showInformationMessage(`✅ 已应用 ${result.count} 个配置到当前项目`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`应用配置失败: ${error}`);
        }
    });

    // 智能检查配置（简化版）
    const checkIssues = vscode.commands.registerCommand('copilotPrompts.checkIssues', async () => {
        outputChannel.appendLine('开始检查配置...');
        const issues = await configValidator.checkAll();
        
        if (issues.length === 0) {
            vscode.window.showInformationMessage('✅ 配置检查通过，没有发现问题');
            outputChannel.appendLine('✅ 检查完成：无问题');
            return;
        }
        
        // 使用 QuickPick 界面展示问题
        await configValidator.showResults(issues);
        outputChannel.appendLine(`检查完成：发现 ${issues.length} 个问题`);
    });

    // 应用到全局（移除，改为只应用到当前项目）
    const applyGlobal = vscode.commands.registerCommand('copilotPrompts.applyGlobal', async () => {
        // 保留命令用于向后兼容，实际调用 applyConfig
        vscode.commands.executeCommand('copilotPrompts.applyConfig');
    });

    // 新命令：选择目标工作区并应用配置
    const selectTarget = vscode.commands.registerCommand('copilotPrompts.selectTarget', async () => {
        const folders = vscode.workspace.workspaceFolders;
        if (!folders || folders.length === 0) {
            vscode.window.showWarningMessage('请先打开一个工作区');
            return;
        }
        const items = folders.map(f => ({ label: f.name, description: f.uri.fsPath, folder: f }));
        const selected = await vscode.window.showQuickPick(items, {
            title: '选择目标工作区',
            placeHolder: '选择要应用配置的工作区'
        });
        if (selected) {
            try {
                const result = await configManager.applyConfigToWorkspace(selected.folder);
                promptsProvider.refresh();
                updateStatusBar();
                vscode.window.showInformationMessage(`✅ 配置已应用到 ${selected.label} (${result.count} 个配置)`);
                outputChannel.appendLine(`✅ 配置已应用到 ${selected.label}: ${result.count} 个`);
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : String(error);
                vscode.window.showErrorMessage(`应用配置到 ${selected.label} 失败: ${errorMsg}`);
                outputChannel.appendLine(`❌ 应用配置失败: ${errorMsg}`);
            }
        }
    });

    // 刷新
    const refresh = vscode.commands.registerCommand('copilotPrompts.refresh', async () => {
        outputChannel.appendLine('正在从 GitHub 刷新配置列表...');
        try {
            await configManager.refreshFromGitHub();
            promptsProvider.refresh();
            updateStatusBar();
            vscode.window.showInformationMessage('✅ 配置列表已更新');
            outputChannel.appendLine('✅ 配置列表刷新成功');
        } catch (error) {
            vscode.window.showErrorMessage(`刷新失败: ${error instanceof Error ? error.message : String(error)}`);
            outputChannel.appendLine(`❌ 刷新失败: ${error}`);
        }
    });

    // 清空项目配置
    const clearProjectConfig = vscode.commands.registerCommand('copilotPrompts.clearProjectConfig', async () => {
        // 让用户选择要清空配置的项目
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            vscode.window.showErrorMessage('请先打开一个工作区');
            return;
        }

        interface FolderQuickPick extends vscode.QuickPickItem {
            folder: vscode.WorkspaceFolder;
        }

        const items: FolderQuickPick[] = workspaceFolders.map(folder => ({
            label: `$(folder) ${folder.name}`,
            description: folder.uri.fsPath,
            folder: folder
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '选择要清空配置的项目',
            title: '清空项目 Copilot 配置'
        });

        if (selected) {
            const confirmation = await vscode.window.showWarningMessage(
                `确定要清空 ${selected.folder.name} 的所有 Copilot 配置吗？`,
                { modal: true, detail: '这将删除:\n• .github/copilot-instructions.md\n• .github/agents/ 目录\n\n此操作不可撤销！' },
                '确认清空',
                '取消'
            );

            if (confirmation === '确认清空') {
                try {
                    await configManager.clearProjectConfig(selected.folder);
                    promptsProvider.refresh();
                    vscode.window.showInformationMessage(`✅ 已清空 ${selected.folder.name} 的配置`);
                    outputChannel.appendLine(`✅ 已清空项目配置: ${selected.folder.name}`);
                } catch (error) {
                    const errorMsg = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`清空配置失败: ${errorMsg}`);
                    outputChannel.appendLine(`❌ 清空配置失败: ${errorMsg}`);
                }
            }
        }
    });

    // 全选
    const selectAll = vscode.commands.registerCommand('copilotPrompts.selectAll', async () => {
        configManager.selectAll();
        await configManager.applyConfig();
        promptsProvider.refresh();
        updateStatusBar();
    });

    // 清空
    const clearAll = vscode.commands.registerCommand('copilotPrompts.clearAll', async () => {
        configManager.clearAll();
        await configManager.applyConfig();
        promptsProvider.refresh();
        updateStatusBar();
    });

    // 切换单项（已弃用，由 checkbox 事件替代）
    const toggleItem = vscode.commands.registerCommand('copilotPrompts.toggleItem', (item: PromptItem) => {
        // 此命令已由 onDidChangeCheckboxState 事件替代
        // 保留用于向后兼容
    });

    // 搜索
    const search = vscode.commands.registerCommand('copilotPrompts.search', async () => {
        const searchText = await vscode.window.showInputBox({
            prompt: '搜索 Prompts 和 Agents',
            placeHolder: '输入关键词搜索标题、描述或标签...',
            value: ''
        });

        if (searchText !== undefined) {
            if (searchText.trim()) {
                promptsProvider.setSearchText(searchText);
                vscode.window.showInformationMessage(`🔍 搜索: "${searchText}"`);
            } else {
                promptsProvider.clearSearch();
                vscode.window.showInformationMessage('✅ 已清除搜索');
            }
        }
    });

    // 显示当前生效的配置
    const showActive = vscode.commands.registerCommand('copilotPrompts.showActive', () => {
        const selected = configManager.getSelectedPrompts();
        const allPrompts = configManager.getAllPrompts();
        const activePrompts = allPrompts.filter(p => selected.includes(p.id));

        if (activePrompts.length === 0) {
            vscode.window.showInformationMessage('ℹ️ 当前没有生效的配置');
            return;
        }

        const items = activePrompts.map(p => ({
            label: `$(${p.type === 'agent' ? 'person' : 'file'}) ${p.title}`,
            description: p.description,
            detail: `标签: ${p.tags.join(', ')}`
        }));

        vscode.window.showQuickPick(items, {
            title: `当前生效的配置 (${activePrompts.length} 个)`,
            placeHolder: '这些配置正在影响 Copilot 的代码生成...',
            matchOnDescription: true,
            matchOnDetail: true
        });
    });

    // 查看当前配置
    const viewCurrent = vscode.commands.registerCommand('copilotPrompts.viewCurrent', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showWarningMessage('请先打开一个工作区');
            return;
        }

        const configPath = vscode.Uri.joinPath(workspaceFolder.uri, '.github', 'copilot-instructions.md');
        try {
            const doc = await vscode.workspace.openTextDocument(configPath);
            await vscode.window.showTextDocument(doc);
        } catch (error) {
            vscode.window.showWarningMessage('配置文件不存在，请先应用配置');
        }
    });

    // 打开管理器
    const openManager = vscode.commands.registerCommand('copilotPrompts.openManager', () => {
        const panel = vscode.window.createWebviewPanel(
            'copilotPromptsManager',
            'Copilot Prompts 管理器',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getWebviewContent(configManager);

        // 处理来自 Webview 的消息
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'apply':
                        configManager.setSelectedPrompts(message.selected);
                        vscode.commands.executeCommand('copilotPrompts.applyConfig');
                        promptsProvider.refresh();
                        updateStatusBar();
                        break;
                    case 'getState':
                        panel.webview.postMessage({
                            command: 'state',
                            selected: configManager.getSelectedPrompts()
                        });
                        break;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    // 加载模板
    const loadTemplate = vscode.commands.registerCommand('copilotPrompts.loadTemplate', async () => {
        const templates = {
            'vue3-frontend': {
                name: 'Vue 3 前端项目',
                prompts: ['vue3-agent', 'typescript-agent', 'i18n-agent']
            },
            'vitasage': {
                name: 'VitaSage 工业项目',
                prompts: ['vitasage-agent', 'typescript-agent', 'i18n-agent']
            },
            'fullstack': {
                name: '全栈项目',
                prompts: ['vitasage-agent', 'vue3-agent', 'typescript-agent', 'i18n-agent']
            }
        };

        const items = Object.entries(templates).map(([key, value]) => ({
            label: value.name,
            description: `包含 ${value.prompts.length} 个配置`,
            detail: value.prompts.join(', '),
            key: key
        }));

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: '选择配置模板'
        });

        if (selected) {
            const template = templates[selected.key as keyof typeof templates];
            configManager.setSelectedPrompts(template.prompts);
            promptsProvider.refresh();
            updateStatusBar();
            vscode.window.showInformationMessage(`✅ 已加载 ${template.name} 模板`);
        }
    });

    context.subscriptions.push(
        treeView,
        applyConfig,
        checkIssues,
        applyGlobal,
        refresh,
        clearProjectConfig,
        selectAll,
        clearAll,
        toggleItem,
        search,
        showActive,
        viewCurrent,
        openManager,
        loadTemplate,
        selectTarget
    );
}

function getWebviewContent(configManager: ConfigManager): string {
    const selected = configManager.getSelectedPrompts();
    const all = configManager.getAllPrompts();

    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { padding: 20px; font-family: var(--vscode-font-family); }
        .prompt-item { padding: 10px; margin: 10px 0; border: 1px solid var(--vscode-panel-border); border-radius: 4px; }
        .prompt-item:hover { background: var(--vscode-list-hoverBackground); }
        label { display: flex; align-items: center; cursor: pointer; }
        input[type="checkbox"] { margin-right: 10px; }
        .actions { margin-top: 20px; display: flex; gap: 10px; }
        button { padding: 8px 16px; background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; cursor: pointer; }
        button:hover { background: var(--vscode-button-hoverBackground); }
    </style>
</head>
<body>
    <h2>选择 Copilot Prompts</h2>
    <div id="prompts">
        ${all.map(p => `
            <div class="prompt-item">
                <label>
                    <input type="checkbox" value="${p.id}" ${selected.includes(p.id) ? 'checked' : ''}>
                    <div>
                        <strong>${p.title}</strong>
                        <div style="font-size: 12px; opacity: 0.8;">${p.description}</div>
                    </div>
                </label>
            </div>
        `).join('')}
    </div>
    <div class="actions">
        <button onclick="apply()">应用配置</button>
        <button onclick="selectAll()">全选</button>
        <button onclick="clearAll()">清空</button>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        
        function apply() {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]');
            const selected = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);
            vscode.postMessage({ command: 'apply', selected });
        }
        
        function selectAll() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = true);
        }
        
        function clearAll() {
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
        }
    </script>
</body>
</html>`;
}

export function deactivate() { }
