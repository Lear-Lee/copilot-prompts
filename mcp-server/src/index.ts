#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { analyzeProject } from './tools/analyzeProject.js';
import { matchAgents } from './tools/matchAgents.js';
import { listAvailableAgents } from './tools/listAgents.js';
import { generateConfig } from './tools/generateConfig.js';

/**
 * Copilot Prompts MCP Server
 * 提供智能项目分析和 Agent 匹配服务
 */
class CopilotPromptsMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'copilot-prompts-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    // 错误处理
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    // 列出所有可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_project',
          description: '分析项目的技术栈、框架、工具和特征。自动检测 Vue、React、TypeScript 等技术。',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: '项目的绝对路径，例如: /Users/username/projects/my-app',
              },
            },
            required: ['projectPath'],
          },
        },
        {
          name: 'match_agents',
          description: '根据项目特征智能匹配最合适的 Copilot Agents。使用加权评分算法。',
          inputSchema: {
            type: 'object',
            properties: {
              projectFeatures: {
                type: 'object',
                description: '项目特征对象（从 analyze_project 获取）',
                properties: {
                  frameworks: { type: 'array', items: { type: 'string' } },
                  languages: { type: 'array', items: { type: 'string' } },
                  tools: { type: 'array', items: { type: 'string' } },
                  keywords: { type: 'array', items: { type: 'string' } },
                  projectType: { type: 'string' },
                },
                required: ['frameworks', 'languages', 'tools', 'keywords', 'projectType'],
              },
              limit: {
                type: 'number',
                description: '返回的最大 Agent 数量（默认 10）',
                default: 10,
              },
            },
            required: ['projectFeatures'],
          },
        },
        {
          name: 'list_available_agents',
          description: '获取所有可用的 Copilot Agents 列表，包括名称、描述、路径等信息。',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'generate_config',
          description: '为项目生成 Copilot 配置文件（.github/copilot-instructions.md）。可以自动匹配或手动指定 Agents。',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: '项目的绝对路径',
              },
              agentIds: {
                type: 'array',
                items: { type: 'string' },
                description: '要应用的 Agent ID 列表（可选，如不提供则自动匹配）',
              },
              autoMatch: {
                type: 'boolean',
                description: '是否自动匹配 Agents（默认 true）',
                default: true,
              },
            },
            required: ['projectPath'],
          },
        },
      ],
    }));

    // 处理工具调用
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        console.error(`[MCP] 调用工具: ${name}`);
        console.error(`[MCP] 参数:`, JSON.stringify(args, null, 2));

        switch (name) {
          case 'analyze_project':
            return await analyzeProject(args as any);

          case 'match_agents':
            return await matchAgents(args as any);

          case 'list_available_agents':
            return await listAvailableAgents();

          case 'generate_config':
            return await generateConfig(args as any);

          default:
            throw new Error(`未知工具: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[MCP] 工具执行失败:`, errorMessage);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: errorMessage,
                  success: false,
                },
                null,
                2
              ),
            },
          ],
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Copilot Prompts MCP Server 已启动');
  }
}

// 启动服务器
const server = new CopilotPromptsMCPServer();
server.run().catch(console.error);
