import { GitHubClient } from '../core/githubClient.js';
import { SmartAgentMatcher } from '../core/smartAgentMatcher.js';
import { ProjectFeatures, AgentMetadata, ConsoleLogger } from '../core/types.js';

/**
 * 匹配 Agents 工具
 */
export async function matchAgents(args: {
    projectFeatures: ProjectFeatures;
    limit?: number;
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    
    try {
        const matcher = new SmartAgentMatcher(logger);
        const githubClient = new GitHubClient(logger);

        logger.log('正在从 GitHub 获取可用 Agents...');

        // 获取所有可用的 Agents
        const availableAgents: AgentMetadata[] = [];
        
        try {
            const agentFiles = await githubClient.listDirectoryFiles('agents');
            
            for (const file of agentFiles) {
                if (file.name.endsWith('.agent.md')) {
                    try {
                        const content = await githubClient.fetchFileContent(file.path);
                        const metadata = matcher.parseAgentMetadata(file.path, content);
                        availableAgents.push(metadata);
                    } catch (error) {
                        logger.error(`解析 ${file.name} 失败: ${error}`);
                    }
                }
            }
        } catch (error) {
            logger.error(`获取 Agents 失败: ${error}`);
        }

        // 匹配 Agents
        const matchedAgents = matcher.matchAgents(args.projectFeatures, availableAgents);
        
        // 限制返回数量
        const limit = args.limit || 10;
        const topAgents = matchedAgents.slice(0, limit);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    totalAvailable: availableAgents.length,
                    matched: topAgents.length,
                    agents: topAgents.map(agent => ({
                        id: agent.id,
                        title: agent.title,
                        description: agent.description,
                        score: agent.score,
                        tags: agent.tags,
                        path: agent.path
                    })),
                    recommendations: topAgents.slice(0, 5).map(a => a.title)
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`匹配 Agents 失败: ${error}`);
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
