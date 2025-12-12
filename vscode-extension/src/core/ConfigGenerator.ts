import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { AgentManager, AgentMatch } from './AgentManager';

/**
 * 输出模式
 */
export type OutputMode = 'reference' | 'inline' | 'config-driven' | 'hybrid';

/**
 * 生成结果
 */
export interface GenerationResult {
  success: boolean;
  message: string;
  configPath?: string;
  agentCount: number;
  agents: string[];
  mode: OutputMode;
}

/**
 * 配置生成器 - 支持多种输出模式
 * 
 * 模式说明：
 * - reference: 引用式，只包含 @import 指令
 * - config-driven: 配置文件驱动，生成 .copilot/config.json
 * - hybrid: 混合模式（推荐），引用式 + 配置文件
 */
export class ConfigGenerator {
  private mode: OutputMode = 'hybrid'; // 默认混合模式
  private agentManager: AgentManager;

  constructor(private context: vscode.ExtensionContext) {
    this.agentManager = new AgentManager(context);
  }

  /**
   * 为工作区生成配置
   */
  async generateForWorkspace(
    workspaceFolder: vscode.WorkspaceFolder,
    mode?: OutputMode
  ): Promise<GenerationResult> {
    const outputMode = mode || this.mode;
    const projectPath = workspaceFolder.uri.fsPath;

    try {
      // 1. 分析项目并匹配 agents
      const matches = await this.agentManager.matchAgents(projectPath);

      if (matches.length === 0) {
        return {
          success: false,
          message: '未找到匹配的 agents',
          agentCount: 0,
          agents: [],
          mode: outputMode
        };
      }

      // 2. 确保 agents 已缓存
      await this.ensureAgentsCached(matches);

      // 3. 根据模式生成配置
      let configPath: string;
      switch (outputMode) {
        case 'reference':
          configPath = await this.generateReference(projectPath, matches);
          break;
        case 'config-driven':
          configPath = await this.generateConfigDriven(projectPath, matches);
          break;
        case 'hybrid':
        default:
          configPath = await this.generateHybrid(projectPath, matches);
          break;
      }

      // 4. 更新 .gitignore
      await this.updateGitignore(projectPath);

      return {
        success: true,
        message: `成功生成配置，匹配 ${matches.length} 个 agents`,
        configPath,
        agentCount: matches.length,
        agents: matches.map(m => m.agent.name),
        mode: outputMode
      };
    } catch (error) {
      return {
        success: false,
        message: `生成配置失败: ${error instanceof Error ? error.message : String(error)}`,
        agentCount: 0,
        agents: [],
        mode: outputMode
      };
    }
  }

  /**
   * 确保 agents 已缓存
   */
  private async ensureAgentsCached(matches: AgentMatch[]): Promise<void> {
    const promises = matches.map(m => this.agentManager.loadAgent(m.id));
    await Promise.all(promises);
  }

  /**
   * 生成引用式配置
   */
  private async generateReference(
    projectPath: string,
    matches: AgentMatch[]
  ): Promise<string> {
    const githubDir = path.join(projectPath, '.github');
    const instructionsPath = path.join(githubDir, 'copilot-instructions.md');

    // 创建 .github 目录
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    // 生成引用
    const imports = matches
      .map(m => {
        const agentPath = this.agentManager.getAgentPath(m.id);
        return `<!-- @import ${agentPath} -->`;
      })
      .join('\n');

    const content = `<!-- ⚠️ 此文件由 Copilot Prompts Manager 自动生成 -->
<!-- ⚠️ 请勿手动编辑，所有修改将在下次更新时被覆盖 -->

# AI 开发指南

> 📌 **配置模式**: 引用式
> - 本文件通过引用外部 agents 实现配置
> - Agents 内容存储在: ~/.copilot-agents/cache/

---

${imports}

---

## 📊 匹配的 Agents (${matches.length}个)

${matches.map(m => `- **${m.agent.name}** (匹配度: ${m.score}%)
  - ${m.agent.description}
  - 匹配原因: ${m.reasons.join(', ')}`).join('\n')}

生成时间: ${new Date().toISOString()}
`;

    fs.writeFileSync(instructionsPath, content, 'utf-8');
    return instructionsPath;
  }

  /**
   * 生成配置文件驱动式
   */
  private async generateConfigDriven(
    projectPath: string,
    matches: AgentMatch[]
  ): Promise<string> {
    const copilotDir = path.join(projectPath, '.copilot');
    const configPath = path.join(copilotDir, 'config.json');
    const githubDir = path.join(projectPath, '.github');
    const instructionsPath = path.join(githubDir, 'copilot-instructions.md');

    // 创建目录
    if (!fs.existsSync(copilotDir)) {
      fs.mkdirSync(copilotDir, { recursive: true });
    }
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    // 生成配置文件
    const config = {
      version: '1.0.0',
      agents: matches.map(m => ({
        id: m.id,
        name: m.agent.name,
        score: m.score,
        reasons: m.reasons
      })),
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    // 生成简化的 copilot-instructions.md
    const instructionsContent = `<!-- ⚠️ 此文件由 Copilot Prompts Manager 自动生成 -->

# AI 开发指南

> 📌 **配置模式**: 配置文件驱动
> - 详细配置: \`.copilot/config.json\`
> - Agents 路径: \`~/.copilot-agents/cache/\`

## 📋 应用的 Agents

${matches.map(m => `- **${m.agent.name}** - ${m.agent.description}`).join('\n')}

配置文件: \`.copilot/config.json\`
生成时间: ${new Date().toISOString()}
`;

    fs.writeFileSync(instructionsPath, instructionsContent, 'utf-8');
    return instructionsPath;
  }

  /**
   * 生成混合模式（推荐）
   */
  private async generateHybrid(
    projectPath: string,
    matches: AgentMatch[]
  ): Promise<string> {
    const copilotDir = path.join(projectPath, '.copilot');
    const configPath = path.join(copilotDir, 'config.json');
    const githubDir = path.join(projectPath, '.github');
    const instructionsPath = path.join(githubDir, 'copilot-instructions.md');

    // 创建目录
    if (!fs.existsSync(copilotDir)) {
      fs.mkdirSync(copilotDir, { recursive: true });
    }
    if (!fs.existsSync(githubDir)) {
      fs.mkdirSync(githubDir, { recursive: true });
    }

    // 1. 生成配置文件
    const config = {
      version: '1.0.0',
      mode: 'hybrid',
      agents: matches.map(m => ({
        id: m.id,
        name: m.agent.name,
        score: m.score,
        path: this.agentManager.getAgentPath(m.id)
      })),
      generatedAt: new Date().toISOString()
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');

    // 2. 生成引用式 copilot-instructions.md
    const imports = matches
      .map(m => {
        const agentPath = this.agentManager.getAgentPath(m.id);
        return `<!-- @import ${agentPath} -->`;
      })
      .join('\n');

    const instructionsContent = `<!-- ⚠️ 此文件由 Copilot Prompts Manager 自动生成 -->
<!-- ⚠️ 请勿手动编辑，所有修改将在下次更新时被覆盖 -->
<!-- ⚠️ 如需修改配置，请使用侧边栏的 Copilot Prompts 视图 -->

# AI 开发指南

> 📌 **重要提示**
> - 本文件由插件自动生成和维护
> - 已添加到 .gitignore，不会提交到 Git
> - 配置来源: 自动匹配

---

${imports}

---

## 📋 应用的 Agent 列表

${matches.map(m => `- **${m.agent.name}** (${m.agent.id}.agent.md)
  - ${m.agent.description}
  - 标签: ${m.agent.tags.join(', ')}`).join('\n')}

生成时间: ${new Date().toISOString()}
配置来源: 自动匹配
`;

    fs.writeFileSync(instructionsPath, instructionsContent, 'utf-8');
    return instructionsPath;
  }

  /**
   * 更新 .gitignore
   */
  private async updateGitignore(projectPath: string): Promise<void> {
    const gitignorePath = path.join(projectPath, '.gitignore');
    let content = '';

    if (fs.existsSync(gitignorePath)) {
      content = fs.readFileSync(gitignorePath, 'utf-8');
    }

    const entries = [
      '.github/copilot-instructions.md',
      '.copilot/'
    ];

    let modified = false;
    for (const entry of entries) {
      if (!content.includes(entry)) {
        content += `\n# Copilot Prompts Manager (auto-generated)\n${entry}\n`;
        modified = true;
      }
    }

    if (modified) {
      fs.writeFileSync(gitignorePath, content, 'utf-8');
    }
  }

  /**
   * 设置输出模式
   */
  setMode(mode: OutputMode): void {
    this.mode = mode;
  }

  /**
   * 获取当前模式
   */
  getMode(): OutputMode {
    return this.mode;
  }
}
