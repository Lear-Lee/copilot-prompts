import * as fs from 'fs';
import * as path from 'path';
import { GitHubClient } from '../core/githubClient.js';
import { SmartAgentMatcher } from '../core/smartAgentMatcher.js';
import { ConsoleLogger, AgentMetadata } from '../core/types.js';

/**
 * 生成配置文件工具
 */
export async function generateConfig(args: {
    projectPath: string;
    agentIds?: string[];
    autoMatch?: boolean;
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    
    try {
        // 验证路径
        if (!fs.existsSync(args.projectPath)) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: `项目路径不存在: ${args.projectPath}`
                    }, null, 2)
                }]
            };
        }

        const matcher = new SmartAgentMatcher(logger);
        const githubClient = new GitHubClient(logger);
        
        let selectedAgents: AgentMetadata[] = [];

        // 如果需要自动匹配
        if (args.autoMatch !== false) {
            logger.log('正在分析项目特征...');
            
            const workspaceFolder = {
                uri: { fsPath: args.projectPath },
                name: path.basename(args.projectPath),
                index: 0
            };
            
            const features = await matcher.analyzeProject(workspaceFolder as any);
            
            logger.log('正在匹配 Agents...');
            
            // 获取可用 Agents
            const agentFiles = await githubClient.listDirectoryFiles('agents');
            const availableAgents: AgentMetadata[] = [];
            
            for (const file of agentFiles) {
                if (file.name.endsWith('.agent.md')) {
                    try {
                        const content = await githubClient.fetchFileContent(file.path);
                        const metadata = matcher.parseAgentMetadata(file.path, content);
                        availableAgents.push(metadata);
                    } catch (error) {
                        logger.error(`解析 ${file.name} 失败`);
                    }
                }
            }
            
            selectedAgents = matcher.matchAgents(features, availableAgents);
            selectedAgents = selectedAgents.slice(0, 5); // 取前5个
        }
        
        // 如果指定了 agentIds，使用指定的
        if (args.agentIds && args.agentIds.length > 0) {
            logger.log(`使用指定的 Agents: ${args.agentIds.join(', ')}`);
            
            selectedAgents = [];
            for (const id of args.agentIds) {
                try {
                    const agentPath = `agents/${id}.agent.md`;
                    const content = await githubClient.fetchFileContent(agentPath);
                    const metadata = matcher.parseAgentMetadata(agentPath, content);
                    selectedAgents.push(metadata);
                } catch (error) {
                    logger.error(`获取 Agent ${id} 失败: ${error}`);
                }
            }
        }

        if (selectedAgents.length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: '未找到合适的 Agents'
                    }, null, 2)
                }]
            };
        }

        // 生成配置文件
        logger.log('正在生成配置文件...');
        
        const githubDir = path.join(args.projectPath, '.github');
        const configPath = path.join(githubDir, 'copilot-instructions.md');

        // 创建目录
        if (!fs.existsSync(githubDir)) {
            fs.mkdirSync(githubDir, { recursive: true });
        }

        // 构建配置内容
        let content = `<!-- ⚠️ 此文件由 Copilot Prompts MCP Server 自动生成 -->\n`;
        content += `<!-- ⚠️ 请勿手动编辑，所有修改将在下次自动生成时被覆盖 -->\n\n`;
        content += `# AI 开发指南\n\n`;
        content += `> 📌 **自动配置信息**\n`;
        content += `> - 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
        content += `> - 匹配的 Agents: ${selectedAgents.length} 个\n\n`;
        content += `---\n\n`;

        // 添加 Agents 内容
        for (const agent of selectedAgents) {
            content += `<!-- Source: ${agent.path} -->\n\n`;
            
            try {
                const agentContent = await githubClient.fetchFileContent(agent.path);
                content += agentContent;
            } catch (error) {
                content += `_无法获取 ${agent.title} 的内容_\n`;
            }
            
            content += `\n\n---\n\n`;
        }

        // 写入文件
        fs.writeFileSync(configPath, content, 'utf-8');

        // 更新 .gitignore
        const gitignorePath = path.join(args.projectPath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            let gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            if (!gitignoreContent.includes('.github/copilot-instructions.md')) {
                gitignoreContent += '\n# Copilot Prompts (auto-generated)\n.github/copilot-instructions.md\n';
                fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
            }
        }

        logger.log(`✅ 配置文件已生成: ${configPath}`);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    configPath,
                    agents: selectedAgents.map(a => ({
                        id: a.id,
                        title: a.title,
                        score: a.score
                    })),
                    message: `已成功生成配置文件，应用了 ${selectedAgents.length} 个 Agents`
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`生成配置失败: ${error}`);
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    error: error instanceof Error ? error.message : String(error)
                }, null, 2)
            }]
        };
    }
}
