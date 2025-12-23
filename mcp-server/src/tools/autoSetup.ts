import * as fs from 'fs';
import * as path from 'path';
import { ConsoleLogger } from '../core/types.js';
import { analyzeProject } from './analyzeProject.js';
import { generateConfig } from './generateConfig.js';

/**
 * 自动配置工具
 * 一键配置 MCP 服务器到 VS Code 工作区
 * v1.2.0: 新增自动生成项目 copilot-instructions.md
 */
export async function autoSetup(args: {
    workspacePath?: string;
    generateInstructions?: boolean; // 是否生成 copilot-instructions.md（默认 true）
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    
    try {
        // 确定工作区路径
        const workspacePath = args.workspacePath || process.cwd();
        
        if (!fs.existsSync(workspacePath)) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: `工作区路径不存在: ${workspacePath}`
                    }, null, 2)
                }]
            };
        }

        const results = {
            workspacePath,
            steps: [] as Array<{ step: string; status: string; detail?: string }>,
            warnings: [] as string[]
        };

        logger.log('🚀 开始自动配置 MCP 服务器...');

        // Step 1: 创建 .vscode 目录
        const vscodeDir = path.join(workspacePath, '.vscode');
        if (!fs.existsSync(vscodeDir)) {
            fs.mkdirSync(vscodeDir, { recursive: true });
            results.steps.push({ step: '创建 .vscode 目录', status: 'success' });
        } else {
            results.steps.push({ step: '检测到已有 .vscode 目录', status: 'skip' });
        }

        // Step 2: 检测 MCP 服务器路径
        let mcpServerPath = '';
        const possiblePaths = [
            path.join(workspacePath, 'mcp-server/build/index.js'),
            path.join(workspacePath, '../copilot-prompts/mcp-server/build/index.js'),
            path.join(workspacePath, 'copilot-prompts/mcp-server/build/index.js')
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                mcpServerPath = p;
                break;
            }
        }

        if (!mcpServerPath) {
            // 尝试查找 src/index.ts (开发模式)
            const srcPath = path.join(workspacePath, 'mcp-server/src/index.ts');
            if (fs.existsSync(srcPath)) {
                results.warnings.push('检测到开发模式，请先运行 npm run build 编译服务器');
                mcpServerPath = '${workspaceFolder}/mcp-server/build/index.js';
            } else {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            error: 'MCP 服务器未找到',
                            hint: '请确保 mcp-server/build/index.js 存在，或运行 npm run build'
                        }, null, 2)
                    }]
                };
            }
        }

        const relativePath = mcpServerPath.startsWith(workspacePath)
            ? '${workspaceFolder}/' + path.relative(workspacePath, mcpServerPath)
            : mcpServerPath;

        results.steps.push({ 
            step: '检测 MCP 服务器路径', 
            status: 'success', 
            detail: relativePath 
        });

        // Step 3: 创建或更新 mcp.json
        const mcpJsonPath = path.join(vscodeDir, 'mcp.json');
        const mcpConfig = {
            servers: {
                'copilot-prompts': {
                    command: 'node',
                    args: [relativePath],
                    env: {},
                    autoStart: true
                }
            }
        };

        if (fs.existsSync(mcpJsonPath)) {
            // 合并现有配置
            try {
                const existingConfig = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
                // 检查是否使用了旧格式 mcpServers
                if (existingConfig.mcpServers && !existingConfig.servers) {
                    results.warnings.push('检测到旧版配置格式(mcpServers)，已自动升级为新格式(servers)');
                    existingConfig.servers = existingConfig.mcpServers;
                    delete existingConfig.mcpServers;
                }
                
                if (existingConfig.servers?.['copilot-prompts']) {
                    // 确保现有配置包含必要字段
                    existingConfig.servers['copilot-prompts'] = {
                        ...mcpConfig.servers['copilot-prompts'],
                        ...existingConfig.servers['copilot-prompts']
                    };
                    fs.writeFileSync(mcpJsonPath, JSON.stringify(existingConfig, null, 2));
                    results.steps.push({ step: '更新 mcp.json', status: 'success' });
                } else {
                    existingConfig.servers = {
                        ...existingConfig.servers,
                        ...mcpConfig.servers
                    };
                    fs.writeFileSync(mcpJsonPath, JSON.stringify(existingConfig, null, 2));
                    results.steps.push({ step: '合并配置到 mcp.json', status: 'success' });
                }
            } catch (err) {
                fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
                results.steps.push({ step: '重新创建 mcp.json', status: 'success' });
                results.warnings.push(`原配置文件解析失败: ${err}`);
            }
        } else {
            fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
            results.steps.push({ step: '创建 mcp.json', status: 'success' });
        }

        // Step 4: 创建或更新 settings.json
        const settingsJsonPath = path.join(vscodeDir, 'settings.json');
        const mcpSettings = {
            'github.copilot.chat.mcp.enabled': true,
            'github.copilot.chat.mcp.configFile': '${workspaceFolder}/.vscode/mcp.json',
            'github.copilot.chat.mcp.autoStart': true
        };

        if (fs.existsSync(settingsJsonPath)) {
            try {
                const existingSettings = JSON.parse(fs.readFileSync(settingsJsonPath, 'utf-8'));
                const updated = { ...existingSettings, ...mcpSettings };
                // 确保 JSON 格式正确，添加结尾换行
                fs.writeFileSync(settingsJsonPath, JSON.stringify(updated, null, 2) + '\n');
                results.steps.push({ step: '更新 settings.json', status: 'success' });
            } catch {
                fs.writeFileSync(settingsJsonPath, JSON.stringify(mcpSettings, null, 2) + '\n');
                results.steps.push({ step: '重新创建 settings.json', status: 'success' });
            }
        } else {
            fs.writeFileSync(settingsJsonPath, JSON.stringify(mcpSettings, null, 2) + '\n');
            results.steps.push({ step: '创建 settings.json', status: 'success' });
        }

        // Step 5: 创建 extensions.json (推荐扩展)
        const extensionsJsonPath = path.join(vscodeDir, 'extensions.json');
        const recommendedExtensions = {
            recommendations: [
                'github.copilot',
                'github.copilot-chat'
            ]
        };

        if (!fs.existsSync(extensionsJsonPath)) {
            fs.writeFileSync(extensionsJsonPath, JSON.stringify(recommendedExtensions, null, 2));
            results.steps.push({ step: '创建 extensions.json', status: 'success' });
        } else {
            results.steps.push({ step: 'extensions.json 已存在', status: 'skip' });
        }

        // Step 6: 添加到 .gitignore (可选)
        const gitignorePath = path.join(workspacePath, '.gitignore');
        if (fs.existsSync(gitignorePath)) {
            const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
            if (!gitignoreContent.includes('.vscode/mcp.json')) {
                const updatedContent = gitignoreContent + '\n# MCP 配置（本地）\n.vscode/mcp.json\n';
                fs.writeFileSync(gitignorePath, updatedContent);
                results.steps.push({ step: '添加到 .gitignore', status: 'success' });
            } else {
                results.steps.push({ step: '.gitignore 已包含配置', status: 'skip' });
            }
        } else {
            results.warnings.push('未检测到 .gitignore，建议手动添加 .vscode/mcp.json');
        }

        // Step 7: 自动分析项目并生成 copilot-instructions.md
        const generateInstructions = args.generateInstructions !== false; // 默认 true
        if (generateInstructions) {
            logger.log('🔍 分析项目并生成 copilot-instructions.md...');
            
            try {
                // 分析项目以推荐 Agents
                const analysisResult = await analyzeProject({ projectPath: workspacePath });
                const analysisContent = analysisResult.content[0];
                
                if (analysisContent.type === 'text') {
                    const analysisData = JSON.parse(analysisContent.text);
                    
                    if (analysisData.success && analysisData.features) {
                        // 根据项目特征推荐 Agents
                        const agentIds: string[] = [];
                        const features = analysisData.features;
                        
                        // Vue 3 项目
                        if (features.frameworks?.includes('Vue 3') || features.frameworks?.includes('Vue')) {
                            agentIds.push('vue3');
                        }
                        
                        // LogicFlow
                        if (features.tools?.includes('LogicFlow')) {
                            agentIds.push('logicflow');
                        }
                        
                        // 国际化
                        if (features.keywords?.includes('i18n') || features.keywords?.includes('国际化')) {
                            agentIds.push('i18n');
                        }
                        
                        // Flutter
                        if (features.projectType === 'flutter') {
                            agentIds.push('flutter');
                        }
                        
                        // 微信小程序
                        if (features.projectType === 'wechat-miniprogram') {
                            agentIds.push('wechat-miniprogram');
                        }
                        
                        // 生成配置文件
                        if (agentIds.length > 0) {
                            const configResult = await generateConfig({
                                projectPath: workspacePath,
                                agentIds,
                                autoMatch: false,
                                updateMode: 'merge'
                            });
                            
                            const configContent = configResult.content[0];
                            if (configContent.type === 'text') {
                                const configData = JSON.parse(configContent.text);
                                
                                if (configData.success) {
                                    results.steps.push({ 
                                        step: '生成 copilot-instructions.md', 
                                        status: 'success',
                                        detail: `应用了 ${configData.agents?.length || 0} 个 Agents: ${agentIds.join(', ')}`
                                    });
                                } else {
                                    results.warnings.push(`配置生成失败: ${configData.error || '未知错误'}`);
                                }
                            }
                        } else {
                            results.warnings.push('未找到匹配的 Agents，跳过配置生成');
                            results.warnings.push('你可以稍后手动运行 generate_config 工具并指定 agentIds');
                        }
                    } else {
                        results.warnings.push(`项目分析失败: ${analysisData.error || '未知错误'}`);
                    }
                }
            } catch (error) {
                results.warnings.push(`自动生成配置失败: ${error instanceof Error ? error.message : String(error)}`);
                results.warnings.push('你可以稍后手动运行 generate_config 工具生成配置');
            }
        } else {
            results.steps.push({ step: '跳过 copilot-instructions.md 生成', status: 'skip' });
        }

        logger.log('✅ 自动配置完成！');

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: '🎉 MCP 服务器已自动配置到工作区',
                    ...results,
                    nextSteps: [
                        '1. 重新加载 VS Code 窗口 (Cmd+Shift+P → Reload Window)',
                        '2. 打开 GitHub Copilot Chat',
                        '3. 开始使用：Copilot 会自动应用项目规范',
                        '4. 高级用法：尝试说"获取 Vue 3 相关规范"'
                    ]
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`自动配置失败: ${error}`);
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
