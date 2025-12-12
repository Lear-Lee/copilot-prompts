import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { AgentManager } from '../core/AgentManager';
import { ConfigGenerator, GenerationResult } from '../core/ConfigGenerator';

/**
 * 项目状态
 */
interface ProjectStatus {
  configured: boolean;
  agentCount: number;
  lastUpdate: Date | null;
  configPath?: string;
}

/**
 * 项目树节点
 */
export class ProjectItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly workspaceFolder: vscode.WorkspaceFolder,
    public readonly status: ProjectStatus,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly children?: ProjectItem[]
  ) {
    super(label, collapsibleState);

    // 设置图标和描述
    if (!children) {
      // 根节点（项目）
      this.iconPath = status.configured 
        ? new vscode.ThemeIcon('check', new vscode.ThemeColor('testing.iconPassed'))
        : new vscode.ThemeIcon('warning', new vscode.ThemeColor('testing.iconQueued'));
      
      this.description = status.configured 
        ? `${status.agentCount} agents`
        : '未配置';
      
      this.tooltip = this.createTooltip();
      this.contextValue = status.configured ? 'project-configured' : 'project-unconfigured';
    } else {
      // 子节点（详情）
      this.contextValue = 'project-detail';
    }
  }

  private createTooltip(): string {
    if (this.status.configured) {
      return `已配置 ${this.status.agentCount} 个 agents\n` +
        `最后更新: ${this.status.lastUpdate?.toLocaleString() || '未知'}`;
    } else {
      return '点击自动配置';
    }
  }
}

/**
 * 项目状态视图
 */
export class ProjectStatusView implements vscode.TreeDataProvider<ProjectItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ProjectItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private agentManager: AgentManager;
  private configGenerator: ConfigGenerator;

  constructor(private context: vscode.ExtensionContext) {
    this.agentManager = new AgentManager(context);
    this.configGenerator = new ConfigGenerator(context);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ProjectItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ProjectItem): Promise<ProjectItem[]> {
    if (!element) {
      // 根级：显示所有项目
      return this.getProjects();
    } else {
      // 展开：显示项目详情
      return this.getProjectDetails(element);
    }
  }

  /**
   * 获取所有项目
   */
  private async getProjects(): Promise<ProjectItem[]> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      return [];
    }

    const projects: ProjectItem[] = [];
    for (const folder of folders) {
      const status = await this.getProjectStatus(folder);
      projects.push(new ProjectItem(
        folder.name,
        folder,
        status,
        vscode.TreeItemCollapsibleState.Collapsed
      ));
    }

    return projects;
  }

  /**
   * 获取项目详情
   */
  private async getProjectDetails(item: ProjectItem): Promise<ProjectItem[]> {
    const details: ProjectItem[] = [];

    if (item.status.configured) {
      // 已配置：显示详情
      const configPath = path.join(item.workspaceFolder.uri.fsPath, '.copilot', 'config.json');
      
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        
        // 显示匹配的 agents
        details.push(new ProjectItem(
          `🎯 匹配 ${config.agents?.length || 0} 个 Agents`,
          item.workspaceFolder,
          item.status,
          vscode.TreeItemCollapsibleState.None
        ));

        if (config.agents) {
          for (const agent of config.agents) {
            const agentItem = new ProjectItem(
              `• ${agent.name} (${agent.score}%)`,
              item.workspaceFolder,
              item.status,
              vscode.TreeItemCollapsibleState.None
            );
            agentItem.iconPath = new vscode.ThemeIcon('symbol-file');
            details.push(agentItem);
          }
        }
      }
    } else {
      // 未配置：显示提示
      const hintItem = new ProjectItem(
        '点击顶部 ✨ 按钮自动配置',
        item.workspaceFolder,
        item.status,
        vscode.TreeItemCollapsibleState.None
      );
      hintItem.iconPath = new vscode.ThemeIcon('lightbulb');
      details.push(hintItem);
    }

    return details;
  }

  /**
   * 获取项目状态
   */
  private async getProjectStatus(folder: vscode.WorkspaceFolder): Promise<ProjectStatus> {
    const instructionsPath = path.join(folder.uri.fsPath, '.github', 'copilot-instructions.md');
    const configPath = path.join(folder.uri.fsPath, '.copilot', 'config.json');

    if (!fs.existsSync(instructionsPath)) {
      return {
        configured: false,
        agentCount: 0,
        lastUpdate: null
      };
    }

    // 读取配置
    let agentCount = 0;
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      agentCount = config.agents?.length || 0;
    }

    // 获取最后更新时间
    const stats = fs.statSync(instructionsPath);

    return {
      configured: true,
      agentCount,
      lastUpdate: stats.mtime,
      configPath: instructionsPath
    };
  }

  /**
   * 自动配置项目
   */
  async autoConfigureProject(item?: ProjectItem): Promise<void> {
    let targetFolder: vscode.WorkspaceFolder | undefined;

    if (item) {
      targetFolder = item.workspaceFolder;
    } else {
      // 如果没有传入 item，让用户选择
      targetFolder = await this.pickWorkspaceFolder();
    }

    if (!targetFolder) {
      return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: `正在为 ${targetFolder.name} 生成配置...`,
      cancellable: false
    }, async (progress) => {
      progress.report({ increment: 0, message: '分析项目结构...' });

      try {
        const result = await this.configGenerator.generateForWorkspace(targetFolder!);

        if (result.success) {
          vscode.window.showInformationMessage(
            `✅ ${result.message}\n匹配的 Agents: ${result.agents.join(', ')}`,
            '查看配置'
          ).then(selection => {
            if (selection === '查看配置' && result.configPath) {
              vscode.workspace.openTextDocument(result.configPath).then(doc => {
                vscode.window.showTextDocument(doc);
              });
            }
          });
          
          this.refresh();
        } else {
          vscode.window.showErrorMessage(`❌ ${result.message}`);
        }
      } catch (error) {
        vscode.window.showErrorMessage(
          `❌ 配置失败: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  /**
   * 批量配置所有项目
   */
  async autoConfigureAll(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders) {
      vscode.window.showWarningMessage('没有打开的工作区');
      return;
    }

    const confirm = await vscode.window.showInformationMessage(
      `是否为所有 ${folders.length} 个项目自动生成配置？`,
      { modal: true },
      '确认',
      '取消'
    );

    if (confirm !== '确认') {
      return;
    }

    await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: '批量生成配置...',
      cancellable: false
    }, async (progress) => {
      let successCount = 0;
      let failedCount = 0;

      for (let i = 0; i < folders.length; i++) {
        const folder = folders[i];
        progress.report({
          increment: (100 / folders.length),
          message: `[${i + 1}/${folders.length}] ${folder.name}`
        });

        try {
          const result = await this.configGenerator.generateForWorkspace(folder);
          if (result.success) {
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
        }
      }

      if (successCount > 0) {
        vscode.window.showInformationMessage(
          `✅ 批量配置完成: ${successCount} 成功, ${failedCount} 失败`
        );
        this.refresh();
      } else {
        vscode.window.showErrorMessage('❌ 所有项目配置失败');
      }
    });
  }

  /**
   * 更新项目配置
   */
  async updateProjectConfig(item: ProjectItem): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `确认重新生成 ${item.label} 的配置？`,
      { modal: true },
      '确认',
      '取消'
    );

    if (confirm !== '确认') {
      return;
    }

    await this.autoConfigureProject(item);
  }

  /**
   * 删除项目配置
   */
  async deleteProjectConfig(item: ProjectItem): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      `确认删除 ${item.label} 的配置？`,
      { modal: true },
      '删除',
      '取消'
    );

    if (confirm !== '删除') {
      return;
    }

    const instructionsPath = path.join(item.workspaceFolder.uri.fsPath, '.github', 'copilot-instructions.md');
    const configPath = path.join(item.workspaceFolder.uri.fsPath, '.copilot', 'config.json');

    try {
      if (fs.existsSync(instructionsPath)) {
        fs.unlinkSync(instructionsPath);
      }
      if (fs.existsSync(configPath)) {
        fs.unlinkSync(configPath);
      }

      vscode.window.showInformationMessage(`✅ 已删除 ${item.label} 的配置`);
      this.refresh();
    } catch (error) {
      vscode.window.showErrorMessage(
        `❌ 删除失败: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * 选择工作区文件夹
   */
  private async pickWorkspaceFolder(): Promise<vscode.WorkspaceFolder | undefined> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return undefined;
    }

    if (folders.length === 1) {
      return folders[0];
    }

    const selected = await vscode.window.showQuickPick(
      folders.map(folder => ({
        label: `$(folder) ${folder.name}`,
        description: folder.uri.fsPath,
        folder
      })),
      {
        title: '选择目标项目',
        placeHolder: '选择要自动配置的项目',
        ignoreFocusOut: true
      }
    );

    return selected?.folder;
  }
}
