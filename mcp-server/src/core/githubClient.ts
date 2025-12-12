import axios from 'axios';
import { Logger } from './types.js';

/**
 * GitHub 客户端（Node.js 版本，无 VS Code 依赖）
 */
export class GitHubClient {
    private readonly owner = 'ForLear';
    private readonly repo = 'copilot-prompts';
    private readonly branch = 'main';
    private readonly baseUrl = 'https://api.github.com';
    private readonly rawBaseUrl = 'https://raw.githubusercontent.com';

    constructor(private logger?: Logger) {}

    /**
     * 列出目录中的文件
     */
    async listDirectoryFiles(dirPath: string): Promise<Array<{ name: string; path: string; type: string }>> {
        const url = `${this.baseUrl}/repos/${this.owner}/${this.repo}/contents/${dirPath}?ref=${this.branch}`;
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Copilot-Prompts-MCP-Server'
                }
            });

            if (Array.isArray(response.data)) {
                return response.data.map((item: any) => ({
                    name: item.name,
                    path: item.path,
                    type: item.type
                }));
            }

            return [];
        } catch (error) {
            this.logger?.error(`获取目录失败: ${error}`);
            return [];
        }
    }

    /**
     * 获取文件内容
     */
    async fetchFileContent(filePath: string): Promise<string> {
        const url = `${this.rawBaseUrl}/${this.owner}/${this.repo}/${this.branch}/${filePath}`;
        
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Copilot-Prompts-MCP-Server'
                }
            });

            return response.data;
        } catch (error) {
            this.logger?.error(`获取文件失败: ${filePath}`);
            throw error;
        }
    }
}
