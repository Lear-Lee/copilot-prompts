import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class AgentEditorPanel {
    public static currentPanel: AgentEditorPanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(
        extensionUri: vscode.Uri,
        agentPath?: string,
        agentContent?: string
    ) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        // 如果已有面板，显示它
        if (AgentEditorPanel.currentPanel) {
            AgentEditorPanel.currentPanel._panel.reveal(column);
            return;
        }

        // 创建新面板
        const panel = vscode.window.createWebviewPanel(
            'agentEditor',
            agentPath ? '编辑 Agent' : '新建 Agent',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        AgentEditorPanel.currentPanel = new AgentEditorPanel(
            panel, 
            extensionUri,
            agentPath,
            agentContent
        );
    }

    private constructor(
        panel: vscode.WebviewPanel,
        extensionUri: vscode.Uri,
        private agentPath?: string,
        private agentContent?: string
    ) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        // 设置初始 HTML 内容
        this._update();

        // 监听面板关闭事件
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // 处理来自 webview 的消息
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'save':
                        this.handleSave(message.data);
                        return;
                    case 'preview':
                        this.handlePreview(message.data);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    private async handleSave(data: {
        name: string;
        description: string;
        tags: string[];
        content: string;
        saveLocation: 'project' | 'user';
    }) {
        try {
            // 生成文件路径
            let targetPath: string;
            
            if (data.saveLocation === 'project') {
                // 保存到当前工作区的第一个文件夹
                const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
                if (!workspaceFolder) {
                    vscode.window.showErrorMessage('未找到工作区文件夹');
                    return;
                }
                
                const agentsDir = path.join(workspaceFolder.uri.fsPath, '.github', 'agents');
                if (!fs.existsSync(agentsDir)) {
                    fs.mkdirSync(agentsDir, { recursive: true });
                }
                
                targetPath = path.join(agentsDir, `${data.name}.agent.md`);
            } else {
                // 保存到用户主目录
                const agentsDir = path.join(os.homedir(), '.copilot-agents');
                if (!fs.existsSync(agentsDir)) {
                    fs.mkdirSync(agentsDir, { recursive: true });
                }
                
                targetPath = path.join(agentsDir, `${data.name}.agent.md`);
            }

            // 检查文件是否已存在
            if (fs.existsSync(targetPath) && !this.agentPath) {
                const overwrite = await vscode.window.showWarningMessage(
                    `文件 ${data.name}.agent.md 已存在，是否覆盖？`,
                    '覆盖',
                    '取消'
                );
                
                if (overwrite !== '覆盖') {
                    return;
                }
            }

            // 生成完整的 Markdown 内容
            const fullContent = this.generateAgentMarkdown(data);

            // 写入文件
            fs.writeFileSync(targetPath, fullContent, 'utf-8');

            vscode.window.showInformationMessage(`✅ Agent 已保存: ${targetPath}`);

            // 刷新配置
            await vscode.commands.executeCommand('copilotPrompts.refresh');

            // 关闭面板
            this._panel.dispose();

        } catch (error) {
            vscode.window.showErrorMessage(`保存失败: ${error}`);
        }
    }

    private generateAgentMarkdown(data: {
        name: string;
        description: string;
        tags: string[];
        content: string;
    }): string {
        let markdown = '---\n';
        markdown += `description: '${data.description}'\n`;
        markdown += `tags: [${data.tags.map(t => `'${t}'`).join(', ')}]\n`;
        markdown += '---\n\n';
        markdown += `# ${data.name}\n\n`;
        markdown += data.content;
        
        return markdown;
    }

    private handlePreview(data: { content: string }) {
        // 在输出通道显示预览
        const outputChannel = vscode.window.createOutputChannel('Agent Preview');
        outputChannel.clear();
        outputChannel.appendLine('# Agent 预览\n');
        outputChannel.appendLine(this.generateAgentMarkdown(data as any));
        outputChannel.show();
    }

    private _update() {
        const webview = this._panel.webview;

        // 解析现有内容（如果有）
        let initialData = {
            name: '',
            description: '',
            tags: [] as string[],
            content: ''
        };

        if (this.agentContent) {
            initialData = this.parseAgentContent(this.agentContent);
        }

        this._panel.webview.html = this._getHtmlForWebview(webview, initialData);
    }

    private parseAgentContent(content: string): {
        name: string;
        description: string;
        tags: string[];
        content: string;
    } {
        const result = {
            name: '',
            description: '',
            tags: [] as string[],
            content: ''
        };

        // 解析 frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            const body = frontmatterMatch[2];

            // 提取 description
            const descMatch = frontmatter.match(/description:\s*['"](.+?)['"]/);
            if (descMatch) {
                result.description = descMatch[1];
            }

            // 提取 tags
            const tagsMatch = frontmatter.match(/tags:\s*\[(.*?)\]/);
            if (tagsMatch) {
                result.tags = tagsMatch[1]
                    .split(',')
                    .map(t => t.trim().replace(/['"]/g, ''));
            }

            // 提取标题作为 name
            const titleMatch = body.match(/^#\s+(.+)$/m);
            if (titleMatch) {
                result.name = titleMatch[1];
            }

            // 移除标题后的内容作为 content
            result.content = body.replace(/^#\s+.+\n\n/, '');
        }

        return result;
    }

    private _getHtmlForWebview(webview: vscode.Webview, initialData: any) {
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Agent 编辑器</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--vscode-foreground);
        }
        
        input[type="text"],
        textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-family: var(--vscode-font-family);
            font-size: 13px;
            box-sizing: border-box;
        }
        
        input[type="text"]:focus,
        textarea:focus {
            outline: 1px solid var(--vscode-focusBorder);
        }
        
        textarea {
            min-height: 300px;
            font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
            line-height: 1.6;
        }
        
        .tags-input {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            min-height: 38px;
        }
        
        .tag {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 8px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            font-size: 12px;
        }
        
        .tag-remove {
            cursor: pointer;
            font-weight: bold;
        }
        
        .tag-input-field {
            flex: 1;
            min-width: 150px;
            border: none;
            background: transparent;
            color: var(--vscode-input-foreground);
            outline: none;
        }
        
        .radio-group {
            display: flex;
            gap: 20px;
            margin-top: 8px;
        }
        
        .radio-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        
        input[type="radio"] {
            cursor: pointer;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            margin-top: 30px;
        }
        
        button {
            padding: 8px 16px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-size: 13px;
            font-family: var(--vscode-font-family);
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-primary:hover {
            background: var(--vscode-button-hoverBackground);
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .help-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            margin-top: 4px;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
        }
    </style>
</head>
<body>
    <h1 class="section-title">${this.agentPath ? '编辑' : '新建'} Agent</h1>
    
    <form id="agentForm">
        <div class="form-group">
            <label for="name">Agent 名称 *</label>
            <input type="text" id="name" required placeholder="例如: element-plus" value="${initialData.name}">
            <div class="help-text">文件名将为: {名称}.agent.md</div>
        </div>
        
        <div class="form-group">
            <label for="description">描述 *</label>
            <input type="text" id="description" required placeholder="简短描述此 Agent 的用途" value="${initialData.description}">
        </div>
        
        <div class="form-group">
            <label>标签</label>
            <div class="tags-input" id="tagsContainer">
                ${initialData.tags.map((tag: string) => `
                    <span class="tag">
                        ${tag}
                        <span class="tag-remove" onclick="removeTag(this)">×</span>
                    </span>
                `).join('')}
                <input type="text" class="tag-input-field" id="tagInput" placeholder="输入标签后按回车">
            </div>
            <div class="help-text">按回车添加标签，点击 × 删除标签</div>
        </div>
        
        <div class="form-group">
            <label for="content">内容 (Markdown) *</label>
            <textarea id="content" required placeholder="在这里编写 Agent 的规则和示例...">${initialData.content}</textarea>
            <div class="help-text">支持 Markdown 格式。建议包含: 核心原则、代码示例、最佳实践</div>
        </div>
        
        <div class="form-group">
            <label>保存位置 *</label>
            <div class="radio-group">
                <label class="radio-label">
                    <input type="radio" name="saveLocation" value="project" checked>
                    <span>📁 项目 (.github/agents/)</span>
                </label>
                <label class="radio-label">
                    <input type="radio" name="saveLocation" value="user">
                    <span>🏠 用户主目录 (~/.copilot-agents/)</span>
                </label>
            </div>
            <div class="help-text">项目级别: 仅当前项目可用 | 用户级别: 全局所有项目可用</div>
        </div>
        
        <div class="button-group">
            <button type="submit" class="btn-primary">💾 保存 Agent</button>
            <button type="button" class="btn-secondary" onclick="previewAgent()">👁️ 预览</button>
        </div>
    </form>
    
    <script>
        const vscode = acquireVsCodeApi();
        const form = document.getElementById('agentForm');
        const tagInput = document.getElementById('tagInput');
        const tagsContainer = document.getElementById('tagsContainer');
        
        // 标签管理
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = tagInput.value.trim();
                if (value) {
                    addTag(value);
                    tagInput.value = '';
                }
            }
        });
        
        function addTag(tagName) {
            const tagElement = document.createElement('span');
            tagElement.className = 'tag';
            tagElement.innerHTML = \`
                \${tagName}
                <span class="tag-remove" onclick="removeTag(this)">×</span>
            \`;
            tagsContainer.insertBefore(tagElement, tagInput);
        }
        
        window.removeTag = function(element) {
            element.parentElement.remove();
        };
        
        // 获取所有标签
        function getTags() {
            const tags = [];
            tagsContainer.querySelectorAll('.tag').forEach(tag => {
                tags.push(tag.textContent.replace('×', '').trim());
            });
            return tags;
        }
        
        // 表单提交
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const data = {
                name: document.getElementById('name').value.trim(),
                description: document.getElementById('description').value.trim(),
                tags: getTags(),
                content: document.getElementById('content').value.trim(),
                saveLocation: document.querySelector('input[name="saveLocation"]:checked').value
            };
            
            if (!data.name || !data.description || !data.content) {
                alert('请填写所有必填项');
                return;
            }
            
            vscode.postMessage({
                command: 'save',
                data: data
            });
        });
        
        // 预览
        window.previewAgent = function() {
            const data = {
                name: document.getElementById('name').value.trim(),
                description: document.getElementById('description').value.trim(),
                tags: getTags(),
                content: document.getElementById('content').value.trim()
            };
            
            vscode.postMessage({
                command: 'preview',
                data: data
            });
        };
    </script>
</body>
</html>`;
    }

    public dispose() {
        AgentEditorPanel.currentPanel = undefined;

        this._panel.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }
}
