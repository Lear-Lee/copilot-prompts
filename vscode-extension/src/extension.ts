import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { PromptsProvider, PromptItem } from './promptsProvider';
import { ConfigManager } from './configManager';
import { ConfigValidator } from './configValidator';
import { AgentEditorPanel } from './agentEditorPanel';
import { PackageAnalyzer } from './packageAnalyzer';
import { AgentGenerator } from './agentGenerator';

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

    // 智能识别项目根目录的辅助函数
    const isProjectRoot = (folderPath: string): boolean => {
        // 检测项目根目录的标志文件
        const projectMarkers = [
            // 前端 & Node.js
            'package.json',
            // 跨平台 & 移动端
            'pubspec.yaml',        // Flutter/Dart
            'app.json',            // React Native
            'manifest.json',       // 小程序/Chrome Extension
            'pages.json',          // uniApp
            'project.config.json', // 微信小程序
            // Android
            'build.gradle',
            'settings.gradle',
            'gradle.properties',
            // iOS
            'Podfile',
            'project.pbxproj',
            // 后端 & 微服务
            'pom.xml',             // Maven/Java
            'build.gradle.kts',    // Kotlin DSL (Gradle)
            'Cargo.toml',          // Rust
            'go.mod',              // Go
            'requirements.txt',    // Python
            'Pipfile',             // Python (pipenv)
            'pyproject.toml',      // Python (Poetry)
            'Gemfile',             // Ruby
            'composer.json',       // PHP
            // 微服务框架
            'application.yml',     // Spring Boot
            'application.yaml',    // Spring Boot
            'application.properties', // Spring Boot
            'Dockerfile',          // Docker 容器
            'docker-compose.yml',  // Docker Compose
            'docker-compose.yaml', // Docker Compose
            'k8s.yaml',            // Kubernetes
            'deployment.yaml',     // Kubernetes
            'service.yaml',        // Kubernetes Service
            '.dockerignore',       // Docker
            // 通用标志
            '.git',
            '.gitignore'
        ];
        
        return projectMarkers.some(marker => {
            const markerPath = path.join(folderPath, marker);
            return fs.existsSync(markerPath);
        });
    };

    // 检查文件夹是否有配置
    const hasConfig = (folderPath: string): boolean => {
        const configPath = path.join(folderPath, '.github', 'copilot-instructions.md');
        const agentsDir = path.join(folderPath, '.github', 'agents');
        return fs.existsSync(configPath) || fs.existsSync(agentsDir);
    };

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
        
        if (searchText) {
            // 实现搜索功能（简化版）
            const results = configManager.getAllPrompts().filter(p => 
                p.title.toLowerCase().includes(searchText.toLowerCase()) ||
                p.description.toLowerCase().includes(searchText.toLowerCase()) ||
                p.tags.some(t => t.toLowerCase().includes(searchText.toLowerCase()))
            );
            
            if (results.length > 0) {
                vscode.window.showInformationMessage(
                    `找到 ${results.length} 个匹配项:\n${results.map(r => r.title).join('\n')}`
                );
            } else {
                vscode.window.showInformationMessage('未找到匹配的配置');
            }
        }
    });

    // ===== 资源管理器右键菜单命令 =====
    
    // 右键菜单：应用配置到文件夹
    const applyToFolder = vscode.commands.registerCommand('copilotPrompts.applyToFolder', async (uri: vscode.Uri) => {
        try {
            // 查找 URI 对应的工作区文件夹
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('❌ 无法识别工作区文件夹');
                return;
            }

            // 检查是否为项目根目录
            const folderPath = uri.fsPath;
            if (!isProjectRoot(folderPath)) {
                const action = await vscode.window.showWarningMessage(
                    `⚠️ "${path.basename(folderPath)}" 不是项目根目录\n\n项目根目录应包含以下之一：package.json, pubspec.yaml, go.mod, pom.xml, Dockerfile 等\n\n是否仍然继续应用配置？`,
                    '继续应用',
                    '取消'
                );
                
                if (action !== '继续应用') {
                    return;
                }
            }

            // 检查是否有选中的配置
            const selectedPrompts = configManager.getSelectedPrompts();
            
            if (selectedPrompts.length === 0) {
                const action = await vscode.window.showWarningMessage(
                    '当前未选择任何配置，请先在侧边栏勾选需要的 MTA 智能助手配置',
                    '打开配置面板'
                );
                
                if (action === '打开配置面板') {
                    vscode.commands.executeCommand('copilotPromptsTree.focus');
                }
                return;
            }

            // 显示确认对话框
            const allPrompts = configManager.getAllPrompts();
            const activePrompts = allPrompts.filter(p => selectedPrompts.includes(p.id));
            const configList = activePrompts.map(p => `  • ${p.title}`).join('\n');
            
            const confirmation = await vscode.window.showInformationMessage(
                `将以下 MTA 智能助手配置应用到 ${workspaceFolder.name}？`,
                { 
                    modal: true, 
                    detail: `当前选中的配置 (${selectedPrompts.length}):\n${configList}\n\n将创建或更新:\n• .github/copilot-instructions.md\n• .github/agents/ 目录` 
                },
                '确认应用',
                '取消'
            );

            if (confirmation === '确认应用') {
                // 应用配置到指定工作区
                await configManager.applyConfigToWorkspace(workspaceFolder);
                
                vscode.window.showInformationMessage(`✅ 已应用 ${selectedPrompts.length} 个 MTA 智能助手配置到 ${workspaceFolder.name}`);
                outputChannel.appendLine(`✅ 已应用配置到: ${workspaceFolder.name}`);
                outputChannel.appendLine(`  配置数量: ${selectedPrompts.length}`);
                outputChannel.appendLine(`  配置列表: ${activePrompts.map(p => p.title).join(', ')}`);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`❌ 应用配置失败: ${errorMsg}`);
            outputChannel.appendLine(`❌ 应用配置失败: ${errorMsg}`);
        }
    });

    // 右键菜单：清除文件夹配置
    const clearFolderConfig = vscode.commands.registerCommand('copilotPrompts.clearFolderConfig', async (uri: vscode.Uri) => {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('❌ 无法识别工作区文件夹');
                return;
            }

            // 检查是否有配置
            const folderPath = uri.fsPath;
            if (!hasConfig(folderPath)) {
                vscode.window.showInformationMessage(`ℹ️ "${workspaceFolder.name}" 尚未配置 MTA 智能助手`);
                return;
            }
            
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('❌ 无法识别工作区文件夹');
                return;
            }

            const confirmation = await vscode.window.showWarningMessage(
                `确定要清除 ${workspaceFolder.name} 的所有 MTA 智能助手配置吗？`,
                { 
                    modal: true, 
                    detail: '这将删除:\n• .github/copilot-instructions.md\n• .github/agents/ 目录\n\n此操作不可撤销！' 
                },
                '确认清空',
                '取消'
            );

            if (confirmation === '确认清空') {
                await configManager.clearProjectConfig(workspaceFolder);
                
                vscode.window.showInformationMessage(`✅ 已清除 ${workspaceFolder.name} 的 MTA 智能助手配置`);
                outputChannel.appendLine(`✅ 已清空项目配置: ${workspaceFolder.name}`);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`❌ 清空配置失败: ${errorMsg}`);
            outputChannel.appendLine(`❌ 清空配置失败: ${errorMsg}`);
        }
    });

    // 右键菜单：查看文件夹配置
    const viewFolderConfig = vscode.commands.registerCommand('copilotPrompts.viewFolderConfig', async (uri: vscode.Uri) => {
        try {
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
            
            if (!workspaceFolder) {
                vscode.window.showWarningMessage('❌ 无法识别工作区文件夹');
                return;
            }

            const path = require('path');
            const fs = require('fs');
            
            const configPath = path.join(workspaceFolder.uri.fsPath, '.github', 'copilot-instructions.md');
            const agentsDir = path.join(workspaceFolder.uri.fsPath, '.github', 'agents');
            
            const hasConfigFile = fs.existsSync(configPath);
            const hasAgents = fs.existsSync(agentsDir);
            
            if (!hasConfigFile && !hasAgents) {
                vscode.window.showInformationMessage(`📝 ${workspaceFolder.name} 尚未配置 MTA 智能助手`);
                return;
            }

            let configInfo = `📁 ${workspaceFolder.name} 的 MTA 智能助手配置:\n\n`;
            
            if (hasConfigFile) {
                const configContent = fs.readFileSync(configPath, 'utf-8');
                const lines = configContent.split('\n').length;
                configInfo += `✅ copilot-instructions.md (${lines} 行)\n`;
            } else {
                configInfo += `⚪ copilot-instructions.md (未配置)\n`;
            }
            
            if (hasAgents) {
                const agents = fs.readdirSync(agentsDir).filter((f: string) => f.endsWith('.agent.md'));
                configInfo += `✅ agents/ 目录 (${agents.length} 个 agent)\n`;
                if (agents.length > 0) {
                    configInfo += agents.map((a: string) => `  • ${a}`).join('\n');
                }
            } else {
                configInfo += `⚪ agents/ 目录 (未配置)\n`;
            }
            
            const action = await vscode.window.showInformationMessage(
                configInfo,
                '打开配置文件',
                '打开 agents 目录',
                '关闭'
            );

            if (action === '打开配置文件' && hasConfigFile) {
                const doc = await vscode.workspace.openTextDocument(configPath);
                await vscode.window.showTextDocument(doc);
            } else if (action === '打开 agents 目录' && hasAgents) {
                const agentsDirUri = vscode.Uri.file(agentsDir);
                await vscode.commands.executeCommand('revealInExplorer', agentsDirUri);
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`❌ 查看配置失败: ${errorMsg}`);
            outputChannel.appendLine(`❌ 查看配置失败: ${errorMsg}`);
        }
    });

    // ===== 资源管理器右键菜单命令结束 =====

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

    // 新建 Agent
    const createAgent = vscode.commands.registerCommand('copilotPrompts.createAgent', async () => {
        AgentEditorPanel.createOrShow(context.extensionUri);
    });

    // 编辑 Agent
    const editAgent = vscode.commands.registerCommand('copilotPrompts.editAgent', async (item?: PromptItem) => {
        if (!item) {
            vscode.window.showWarningMessage('请在列表中选择要编辑的 Agent');
            return;
        }

        // 检查是否是本地 agent
        const allPrompts = configManager.getAllPrompts();
        const targetPrompt = allPrompts.find(p => p.id === item.id);
        
        if (!targetPrompt) {
            vscode.window.showWarningMessage('未找到该 Agent');
            return;
        }

        // 只允许编辑本地 agent
        if (!item.id.startsWith('local-')) {
            vscode.window.showInformationMessage('只能编辑本地自定义 Agent。GitHub 中央仓库的 Agent 请通过 PR 提交修改。');
            return;
        }

        // 读取文件内容
        try {
            const agentPath = targetPrompt.path;
            const agentContent = fs.readFileSync(agentPath, 'utf-8');
            
            AgentEditorPanel.createOrShow(context.extensionUri, agentPath, agentContent);
        } catch (error) {
            vscode.window.showErrorMessage(`打开 Agent 失败: ${error}`);
        }
    });

    // 从 npm 包生成 Agent
    const generateAgentFromPackage = vscode.commands.registerCommand('copilotPrompts.generateAgentFromPackage', async () => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            vscode.window.showWarningMessage('请先打开一个工作区');
            return;
        }

        const packageAnalyzer = new PackageAnalyzer(outputChannel);
        const agentGenerator = new AgentGenerator();

        // 获取已安装的包列表
        const installedPackages = await packageAnalyzer.getInstalledPackages(workspaceFolder.uri.fsPath);

        if (installedPackages.length === 0) {
            vscode.window.showWarningMessage('当前项目没有安装任何 npm 包。请先在 package.json 中添加依赖并运行 npm install。');
            return;
        }

        // 显示包选择器
        const selectedPackage = await vscode.window.showQuickPick(
            installedPackages.map(pkg => ({
                label: pkg,
                description: '已安装的 npm 包'
            })),
            {
                placeHolder: '选择要分析的 npm 包',
                matchOnDescription: true,
                title: '从 npm 包生成 Agent'
            }
        );

        if (!selectedPackage) {
            return;
        }

        const packageName = selectedPackage.label;

        // 显示进度
        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: `正在分析 ${packageName}...`,
                cancellable: false
            },
            async (progress) => {
                try {
                    // 分析包
                    progress.report({ message: '读取 package.json...' });
                    const analysis = await packageAnalyzer.analyzePackage(packageName, workspaceFolder.uri.fsPath);

                    if (!analysis) {
                        return;
                    }

                    // 生成 Agent Markdown
                    progress.report({ message: '生成 Agent 内容...' });
                    const agentMarkdown = agentGenerator.generateAgentMarkdown(analysis);
                    const fileName = agentGenerator.generateFileName(packageName);

                    // 询问保存位置
                    const saveLocation = await vscode.window.showQuickPick(
                        [
                            { label: '📁 项目 (.github/agents/)', value: 'project' },
                            { label: '🏠 用户主目录 (~/.copilot-agents/)', value: 'user' }
                        ],
                        {
                            placeHolder: '选择保存位置',
                            title: `保存 ${fileName}`
                        }
                    );

                    if (!saveLocation) {
                        return;
                    }

                    // 保存文件
                    progress.report({ message: '保存 Agent 文件...' });
                    let targetPath: string;

                    if (saveLocation.value === 'project') {
                        const agentsDir = path.join(workspaceFolder.uri.fsPath, '.github', 'agents');
                        if (!fs.existsSync(agentsDir)) {
                            fs.mkdirSync(agentsDir, { recursive: true });
                        }
                        targetPath = path.join(agentsDir, fileName);
                    } else {
                        const agentsDir = path.join(require('os').homedir(), '.copilot-agents');
                        if (!fs.existsSync(agentsDir)) {
                            fs.mkdirSync(agentsDir, { recursive: true });
                        }
                        targetPath = path.join(agentsDir, fileName);
                    }

                    // 检查文件是否已存在
                    if (fs.existsSync(targetPath)) {
                        const overwrite = await vscode.window.showWarningMessage(
                            `文件 ${fileName} 已存在，是否覆盖？`,
                            '覆盖',
                            '取消'
                        );

                        if (overwrite !== '覆盖') {
                            return;
                        }
                    }

                    // 写入文件
                    fs.writeFileSync(targetPath, agentMarkdown, 'utf-8');

                    // 刷新配置
                    await vscode.commands.executeCommand('copilotPrompts.refresh');

                    // 询问是否打开文件
                    const action = await vscode.window.showInformationMessage(
                        `✅ Agent 已生成: ${fileName}`,
                        '打开文件',
                        '完成'
                    );

                    if (action === '打开文件') {
                        const doc = await vscode.workspace.openTextDocument(targetPath);
                        await vscode.window.showTextDocument(doc);
                    }

                } catch (error) {
                    vscode.window.showErrorMessage(`生成 Agent 失败: ${error}`);
                    outputChannel.appendLine(`❌ 错误: ${error}`);
                }
            }
        );
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
        selectTarget,
        applyToFolder,
        clearFolderConfig,
        viewFolderConfig,
        createAgent,
        editAgent,
        generateAgentFromPackage
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
