#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { analyzeProject } from './tools/analyzeProject.js';
import { matchAgents } from './tools/matchAgents.js';
import { listAvailableAgents } from './tools/listAgents.js';
import { generateConfig } from './tools/generateConfig.js';
import { autoSetup } from './tools/autoSetup.js';
import { getSmartStandards } from './tools/getSmartStandards.js';
import { usePreset, listPresets } from './tools/usePreset.js';
import { healthCheck } from './tools/healthCheck.js';
import { getCompactStandards } from './tools/getCompactStandards.js';
import { StandardsManager } from './core/standardsManager.js';
import { CodeValidator } from './core/codeValidator.js';

const SERVER_VERSION = '1.7.0'; // v1.3.0 更新

/**
 * Copilot Prompts MCP Server
 * 智能项目分析和编码规范服务
 * 
 * @version 1.7.0
 * @features
 * - 项目技术栈自动检测
 * - 智能 Agent 匹配推荐
 * - 配置文件自动生成
 * - 动态编码规范资源
 * - 跨平台 MCP 支持
 * - Phase 4: 傻瓜模式增强
 *   * 一键自动配置
 *   * 零参数智能推荐
 *   * 预设场景快捷方式
 *   * 健康检查诊断
 * - v1.1.0: 代码质量保障
 *   * 自动语法验证
 *   * 代码完整性检查
 *   * 自动修复常见错误
 *   * 多场景兼容性测试
 */
class CopilotPromptsMCPServer {
  private server: Server;
  private standardsManager: StandardsManager;
  private codeValidator: CodeValidator;

  constructor() {
    this.standardsManager = new StandardsManager();
    this.codeValidator = new CodeValidator();
    
    this.server = new Server(
      {
        name: 'copilot-prompts-server',
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupResourceHandlers();
    this.setupErrorHandlers();
  }

  /**
   * 设置错误处理器
   */
  private setupErrorHandlers(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      console.error('[MCP] 收到关闭信号，正在关闭服务器...');
      await this.server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('[MCP] 收到终止信号，正在关闭服务器...');
      await this.server.close();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('[MCP] 未捕获的异常:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('[MCP] 未处理的 Promise 拒绝:', reason);
      process.exit(1);
    });
  }

  private setupToolHandlers() {
    // 列出所有可用工具
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'analyze_project',
          description: '分析项目的技术栈、框架、工具和特征。自动检测 Vue、React、TypeScript 等技术。路径可选，不填则自动检测当前工作区。',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: '项目的绝对路径（可选，不填则使用当前工作目录），例如: /Users/username/projects/my-app',
              },
            },
          },
        },
        {
          name: 'auto_setup',
          description: '🎯 一键自动配置 MCP 服务器和项目规范。自动创建 .vscode/mcp.json、settings.json、extensions.json，并分析项目生成 .github/copilot-instructions.md 配置文件。',
          inputSchema: {
            type: 'object',
            properties: {
              workspacePath: {
                type: 'string',
                description: '工作区路径（可选，不填则使用当前目录）',
              },
              generateInstructions: {
                type: 'boolean',
                description: '是否自动生成 copilot-instructions.md（默认 true）',
                default: true,
              },
            },
          },
        },
        {
          name: 'health_check',
          description: '🏥 检查 MCP 服务器健康状态，诊断配置问题。返回详细的健康报告和修复建议。',
          inputSchema: {
            type: 'object',
            properties: {
              workspacePath: {
                type: 'string',
                description: '工作区路径（可选）',
              },
              verbose: {
                type: 'boolean',
                description: '是否显示详细信息（默认 false）',
              },
            },
          },
        },
        {
          name: 'get_smart_standards',
          description: '🧠 零参数智能规范推荐。自动检测当前文件类型、导入、场景，推荐最相关的编码规范。比手动指定参数更简单。',
          inputSchema: {
            type: 'object',
            properties: {
              currentFile: {
                type: 'string',
                description: '当前编辑的文件路径（可选）',
              },
              fileContent: {
                type: 'string',
                description: '文件内容（可选，用于分析导入和场景）',
              },
            },
          },
        },
        {
          name: 'use_preset',
          description: '⚡ 使用预设场景快捷获取规范。支持 vue3-component、vue3-form、pinia-store、api-call 等常见场景，一键获取。',
          inputSchema: {
            type: 'object',
            properties: {
              preset: {
                type: 'string',
                enum: ['vue3-component', 'vue3-form', 'vue3-table', 'pinia-store', 'api-call', 'typescript-strict', 'i18n', 'composable'],
                description: '预设场景 ID',
              },
              customImports: {
                type: 'array',
                items: { type: 'string' },
                description: '额外的导入（可选）',
              },
            },
            required: ['preset'],
          },
        },
        {
          name: 'list_presets',
          description: '📋 列出所有可用的预设场景及其说明。',
          inputSchema: {
            type: 'object',
            properties: {},
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
              updateMode: {
                type: 'string',
                enum: ['merge', 'overwrite'],
                description: '更新模式：merge-保留自定义内容（默认），overwrite-完全覆盖',
                default: 'merge',
              },
              configId: {
                type: 'string',
                description: '配置方案ID（如 strict），会加载对应的详细规则',
              },
            },
            required: ['projectPath'],
          },
        },
        {
          name: 'get_compact_standards',
          description: '🚀 Token 优化版规范获取。支持三种模式：summary(~500 tokens)仅返回规范列表、key-rules(~2000 tokens)返回关键规则摘要、full(完整内容)。默认 key-rules 模式，比完整加载节省 80%+ token。',
          inputSchema: {
            type: 'object',
            properties: {
              currentFile: {
                type: 'string',
                description: '当前文件路径（可选）',
              },
              fileContent: {
                type: 'string',
                description: '文件内容（可选，用于分析）',
              },
              scenario: {
                type: 'string',
                description: '开发场景（可选）',
              },
              mode: {
                type: 'string',
                enum: ['summary', 'key-rules', 'full'],
                description: '返回模式：summary(~500 tokens)、key-rules(~2000 tokens，默认)、full(完整内容)',
                default: 'key-rules',
              },
            },
          },
        },
        {
          name: 'get_relevant_standards',
          description: '根据当前开发上下文，获取相关的编码规范（完整内容）。如需节省 token，请使用 get_compact_standards。',
          inputSchema: {
            type: 'object',
            properties: {
              fileType: {
                type: 'string',
                description: '文件类型（如 vue, ts, tsx, js）',
              },
              imports: {
                type: 'array',
                items: { type: 'string' },
                description: '文件中的 import 语句（如 ["vue", "pinia", "element-plus"]）。如果未提供且提供了 fileContent，将自动检测。',
              },
              scenario: {
                type: 'string',
                description: '开发场景描述（如 "创建表单组件", "API 调用", "状态管理"）',
              },
              fileContent: {
                type: 'string',
                description: '文件内容（可选）。提供后可自动检测 imports 并根据关键词智能匹配规范。',
              },
            },
          },
        },
        {
          name: 'get_standards_stats',
          description: '获取规范系统的使用统计和性能指标。用于了解最常用的规范组合、缓存命中率、Token 节省情况等。',
          inputSchema: {
            type: 'object',
            properties: {
              includeCache: {
                type: 'boolean',
                description: '是否包含缓存详细信息（默认 false）',
              },
            },
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

          case 'auto_setup':
            return await autoSetup(args as any);

          case 'health_check':
            return await healthCheck(args as any);

          case 'get_smart_standards':
            return await getSmartStandards(args as any);

          case 'use_preset':
            return await usePreset(args as any);

          case 'list_presets':
            return await listPresets();

          case 'match_agents':
            return await matchAgents(args as any);

          case 'list_available_agents':
            return await listAvailableAgents();

          case 'generate_config':
            return await generateConfig(args as any);

          case 'get_compact_standards':
            return await getCompactStandards(args as any);

          case 'get_relevant_standards':
            return this.getRelevantStandards(args as any);
          
          case 'get_standards_stats':
            return this.getStandardsStats(args as any);

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

  /**
   * 设置资源处理器
   */
  private setupResourceHandlers() {
    // 列出所有可用资源
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const standards = this.standardsManager.getAvailableStandards();
      
      return {
        resources: standards.map(std => ({
          uri: std.uri,
          name: std.name,
          description: std.description,
          mimeType: 'text/markdown'
        }))
      };
    });

    // 读取特定资源
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;
      
      try {
        const content = this.standardsManager.readStandard(uri);
        
        return {
          contents: [{
            uri,
            mimeType: 'text/markdown',
            text: content
          }]
        };
      } catch (error) {
        throw new Error(`无法读取规范 ${uri}: ${error}`);
      }
    });
  }

  /**
   * 获取相关编码规范
   */
  private getRelevantStandards(args: {
    fileType?: string;
    imports?: string[];
    scenario?: string;
  }) {
    // 获取相关规范 URI 列表
    const standardUris = this.standardsManager.getRelevantStandards(args);
    
    // 组合规范内容
    const content = this.standardsManager.combineStandards(standardUris);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          standards: standardUris,
          content: content,
          tokenEstimate: Math.ceil(content.length / 4), // 粗略估算 token 数
          message: `已加载 ${standardUris.length} 个相关规范`
        }, null, 2)
      }]
    };
  }
  
  /**
   * 获取规范系统统计信息（Phase 3）
   */
  private getStandardsStats(args: { includeCache?: boolean }) {
    const usageStats = this.standardsManager.getUsageStats();
    const performanceMetrics = this.standardsManager.getPerformanceMetrics();
    
    const result: any = {
      success: true,
      usage: usageStats,
      performance: performanceMetrics,
      summary: {
        totalCalls: usageStats.totalCalls,
        cacheHitRate: performanceMetrics.cacheHitRate,
        totalTokensSaved: performanceMetrics.totalTokensSaved,
        averageResponseTime: `${performanceMetrics.averageResponseTime.toFixed(2)}ms`
      }
    };
    
    // 如果需要缓存详情
    if (args.includeCache) {
      result.cache = this.standardsManager.getCacheStats();
    }
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
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
