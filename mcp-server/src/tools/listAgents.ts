import { GitHubClient } from '../core/githubClient.js';
import { ConsoleLogger } from '../core/types.js';

/**
 * 列出所有可用的 Agents
 */
export async function listAvailableAgents(): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    
    try {
        const githubClient = new GitHubClient(logger);
        
        logger.log('正在从 GitHub 获取 Agents 列表...');

        const agentFiles = await githubClient.listDirectoryFiles('agents');
        const agents = agentFiles.filter(f => f.name.endsWith('.agent.md'));

        // 获取每个 Agent 的基本信息
        const agentList = await Promise.all(
            agents.map(async (file) => {
                try {
                    const content = await githubClient.fetchFileContent(file.path);
                    
                    // 简单解析标题和描述
                    const lines = content.split('\n');
                    let title = file.name.replace('.agent.md', '');
                    let description = '';
                    
                    // 尝试从 frontmatter 提取
                    if (lines[0] === '---') {
                        const endIndex = lines.slice(1).findIndex(l => l === '---');
                        if (endIndex > 0) {
                            const frontmatter = lines.slice(1, endIndex + 1).join('\n');
                            const descMatch = frontmatter.match(/description:\s*['"](.+)['"]/);
                            if (descMatch) {
                                description = descMatch[1];
                            }
                        }
                    }
                    
                    // 提取标题（第一个 # 开头的行）
                    const titleLine = lines.find(l => l.startsWith('# '));
                    if (titleLine) {
                        title = titleLine.replace('# ', '').trim();
                    }

                    return {
                        id: file.name.replace('.agent.md', ''),
                        name: file.name,
                        title,
                        description: description || '暂无描述',
                        path: file.path
                    };
                } catch (error) {
                    logger.error(`解析 ${file.name} 失败: ${error}`);
                    return null;
                }
            })
        );

        const validAgents = agentList.filter(a => a !== null);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    total: validAgents.length,
                    agents: validAgents,
                    categories: {
                        general: validAgents.filter(a => a!.path.includes('common/')).length,
                        frameworks: validAgents.filter(a => a!.path.includes('vue/') || a!.path.includes('react/')).length,
                        agents: validAgents.filter(a => a!.path.includes('agents/')).length
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`获取 Agents 列表失败: ${error}`);
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
