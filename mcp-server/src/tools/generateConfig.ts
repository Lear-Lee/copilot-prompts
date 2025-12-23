import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { GitHubClient } from '../core/githubClient.js';
import { SmartAgentMatcher } from '../core/smartAgentMatcher.js';
import { ConsoleLogger, AgentMetadata } from '../core/types.js';
import { CodeValidator } from '../core/codeValidator.js';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 生成配置文件工具
 */
export async function generateConfig(args: {
    projectPath: string;
    agentIds?: string[];
    autoMatch?: boolean;
    updateMode?: 'merge' | 'overwrite'; // merge: 保留自定义内容, overwrite: 完全覆盖
    configId?: string; // 配置方案ID (如 strict)
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
            
            // 获取可用 Agents - 优先从 GitHub 获取（保证最新版本）
            const availableAgents: AgentMetadata[] = [];
            
            try {
                logger.log('📡 从 GitHub 获取 Agents...');
                const agentFiles = await githubClient.listDirectoryFiles('agents');
                
                for (const file of agentFiles) {
                    if (file.name.endsWith('.agent.md')) {
                        try {
                            const content = await githubClient.fetchFileContent(file.path);
                            const metadata = matcher.parseAgentMetadata(file.path, content);
                            availableAgents.push(metadata);
                            logger.log(`✅ 加载 Agent: ${metadata.title}`);
                        } catch (error) {
                            logger.error(`解析 ${file.name} 失败`);
                        }
                    }
                }
                logger.log(`✅ 从 GitHub 成功加载 ${availableAgents.length} 个 Agents`);
            } catch (githubError) {
                // GitHub 失败时尝试本地
                logger.log('⚠️ GitHub 获取失败，尝试从本地加载...');
                const agentsDir = path.join(__dirname, '../../../agents');
                
                if (fs.existsSync(agentsDir)) {
                    const agentFiles = fs.readdirSync(agentsDir);
                    logger.log(`找到 ${agentFiles.length} 个本地文件`);
                    
                    for (const file of agentFiles) {
                        if (file.endsWith('.agent.md')) {
                            try {
                                const filePath = path.join(agentsDir, file);
                                const content = fs.readFileSync(filePath, 'utf-8');
                                const metadata = matcher.parseAgentMetadata(`agents/${file}`, content);
                                availableAgents.push(metadata);
                                logger.log(`✅ 加载 Agent: ${metadata.title}`);
                            } catch (error) {
                                logger.error(`解析 ${file} 失败`);
                            }
                        }
                    }
                    logger.log(`✅ 从本地成功加载 ${availableAgents.length} 个 Agents`);
                } else {
                    throw new Error('无法从 GitHub 或本地获取 Agents');
                }
            }
            
            logger.log(`成功加载 ${availableAgents.length} 个 Agents`);
            selectedAgents = matcher.matchAgents(features, availableAgents);
            logger.log(`匹配到 ${selectedAgents.length} 个 Agents`);
            selectedAgents = selectedAgents.slice(0, 5); // 取前5个
        }
        
        // 如果指定了 agentIds，使用指定的
        if (args.agentIds && args.agentIds.length > 0) {
            logger.log(`使用指定的 Agents: ${args.agentIds.join(', ')}`);
            
            selectedAgents = [];
            
            for (const id of args.agentIds) {
                try {
                    let content: string;
                    const agentPath = `agents/${id}.agent.md`;
                    
                    // 优先从 GitHub 加载（保证最新版本）
                    try {
                        logger.log(`从 GitHub 获取 Agent: ${id}`);
                        content = await githubClient.fetchFileContent(agentPath);
                        logger.log(`✅ 从 GitHub 加载成功: ${id}`);
                    } catch (githubError) {
                        // GitHub 失败时尝试本地
                        logger.log(`GitHub 获取失败，尝试本地: ${id}`);
                        const agentsDir = path.join(__dirname, '../../../agents');
                        const localPath = path.join(agentsDir, `${id}.agent.md`);
                        
                        if (fs.existsSync(localPath)) {
                            content = fs.readFileSync(localPath, 'utf-8');
                            logger.log(`✅ 从本地加载成功: ${id}`);
                        } else {
                            throw new Error(`Agent ${id} 不存在（GitHub 和本地都未找到）`);
                        }
                    }
                    
                    const metadata = matcher.parseAgentMetadata(`agents/${id}.agent.md`, content);
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

        // 检测已有配置的自定义内容
        let existingCustomContent = '';
        let existingConfig = '';
        if (fs.existsSync(configPath)) {
            existingConfig = fs.readFileSync(configPath, 'utf-8');
            
            // 提取自定义章节（标记为 CUSTOM 的内容）
            const customMatch = existingConfig.match(/<!-- CUSTOM_START -->([\s\S]*?)<!-- CUSTOM_END -->/g);
            if (customMatch) {
                existingCustomContent = customMatch.join('\n\n');
            }
        }

        // 创建目录
        if (!fs.existsSync(githubDir)) {
            fs.mkdirSync(githubDir, { recursive: true });
        }
        
        const updateMode = args.updateMode || 'merge'; // 默认保护模式

        // 构建配置内容
        let content = '';
        
        if (updateMode === 'merge') {
            content += `<!-- ⚠️ 此文件由 Copilot Prompts MCP Server 生成 -->\n`;
            content += `<!-- ℹ️ 你可以添加自定义内容，使用 CUSTOM_START/CUSTOM_END 标记保护 -->\n`;
            content += `<!-- 示例: -->\n`;
            content += `<!-- CUSTOM_START -->\n`;
            content += `<!-- 你的自定义规范 -->\n`;
            content += `<!-- CUSTOM_END -->\n\n`;
        } else {
            content += `<!-- ⚠️ 此文件由 Copilot Prompts MCP Server 自动生成 -->\n`;
            content += `<!-- ⚠️ 使用 --update-mode merge 可保护自定义内容 -->\n\n`;
        }

        // 添加作用域声明 - 防止跨项目污染
        const projectName = path.basename(args.projectPath);
        const projectPath = args.projectPath;
        
        content += `<!-- 🎯 作用域：此配置仅适用于当前项目 -->\n`;
        content += `<!-- 项目名称: ${projectName} -->\n`;
        content += `<!-- 项目路径: ${projectPath} -->\n\n`;
        
        content += `# 项目开发规范 - Copilot 指令\n\n`;
        
        // ⚠️ 强制执行检查点 - 必须在最前面
        content += `## ⚠️ 强制执行检查点\n\n`;
        content += `> **此检查点的优先级高于本文件的所有其他内容**\n\n`;
        content += `在执行**任何**以下操作前，必须先完成规范加载验证：\n\n`;
        content += `### 受限操作清单\n\n`;
        content += `- ❌ 创建任何代码文件（.vue、.ts、.tsx、.js 等）\n`;
        content += `- ❌ 修改任何代码文件\n`;
        content += `- ❌ 使用 \`replace_string_in_file\` 或 \`multi_replace_string_in_file\`\n`;
        content += `- ❌ 生成任何代码片段\n\n`;
        content += `### 强制验证流程\n\n`;
        content += `1. **检查项目作用域** - 确认当前操作的文件路径包含 \`/${projectName}/\`\n`;
        content += `2. **加载相关规范** - 根据文件类型调用对应的 MCP 工具：\n`;
        content += `   - Vue 文件 → \`get_smart_standards\` 或 \`use_preset\`\n`;
        content += `   - TypeScript 文件 → \`get_smart_standards\` 或 \`use_preset\`\n`;
        content += `   - 其他文件 → 根据实际情况选择\n`;
        content += `3. **验证加载成功** - 确认工具返回了规范内容\n`;
        content += `4. **声明已加载** - 在响应中明确说明：\`✅ 已加载规范: [工具名称]\`\n\n`;
        content += `### 违规处理\n\n`;
        content += `- 如果未加载规范就生成代码 → **此操作无效，必须重新执行**\n`;
        content += `- 如果出现语法错误 → **深刻反思，检查是否遵循了规范**\n`;
        content += `- 如果出现低级错误 → **停止操作，重新加载规范后再继续**\n\n`;
        content += `---\n\n`;
        
        // 添加AI可识别的作用域限制
        content += `## 🎯 作用域限制\n\n`;
        content += `**⚠️ 此配置仅在以下情况生效：**\n\n`;
        content += `1. 当前编辑的文件路径包含: \`/${projectName}/\`\n`;
        content += `2. 或当前工作目录为: \`${projectPath}\`\n\n`;
        content += `**如果你在其他项目工作（如 ${projectName} 之外的项目），请完全忽略此配置文件中的所有规范和指令。**\n\n`;
        content += `---\n\n`;
        
        content += `> 📌 **自动配置信息**\n`;
        content += `> - 生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
        content += `> - 匹配的 Agents: ${selectedAgents.length} 个\n\n`;
        content += `---\n\n`;
        
        // 加载配置方案的详细规则
        if (args.configId) {
            try {
                const configFilePath = path.join(__dirname, '../../../configs', `element-plus-${args.configId}.json`);
                if (fs.existsSync(configFilePath)) {
                    const configData = JSON.parse(fs.readFileSync(configFilePath, 'utf-8'));
                    
                    content += `## 📦 配置方案\n\n`;
                    content += `**方案ID**: ${configData.configId}\n`;
                    content += `**名称**: ${configData.name}\n`;
                    content += `**描述**: ${configData.description}\n`;
                    content += `**维护者**: ${configData.maintainer}\n\n`;
                    
                    // 添加重要规则摘要
                    if (configData.rules && configData.rules.table) {
                        content += `### 表格组件规范\n\n`;
                        const tableRules = configData.rules.table;
                        if (tableRules.border) content += `- ✅ **必须添加 border**\n`;
                        if (tableRules['highlight-current-row']) content += `- ✅ **必须高亮当前行**\n`;
                        if (tableRules['v-loading']) content += `- ✅ **加载状态变量**: \`${tableRules['v-loading'].variable}\`\n`;
                        content += `\n`;
                    }
                    
                    content += `> 详细规则请参考: \`configs/element-plus-${args.configId}.json\`\n\n`;
                    content += `---\n\n`;
                    
                    logger.log(`✅ 已加载配置方案: ${configData.name}`);
                }
            } catch (error) {
                logger.error(`加载配置方案失败: ${error}`);
            }
        }
        
        // 添加强制工作流说明
        content += `## ⚠️ 强制工作流\n\n`;
        content += `**在进行任何代码生成或修改之前，必须先调用 MCP 工具加载相关规范！**\n\n`;
        content += `根据文件类型和场景，调用相应的 MCP 工具：\n\n`;
        content += `1. **Vue 文件** → \`get_relevant_standards({ fileType: "vue" })\`\n`;
        content += `2. **TypeScript 文件** → \`get_relevant_standards({ fileType: "ts" })\`\n`;
        content += `3. **React 组件** → \`get_relevant_standards({ fileType: "tsx" })\`\n`;
        content += `4. **使用特定库时**：\n`;
        content += `   - Element Plus: \`get_relevant_standards({ imports: ["element-plus"] })\`\n`;
        content += `   - Pinia: \`get_relevant_standards({ imports: ["pinia"] })\`\n`;
        content += `   - Vue Router: \`get_relevant_standards({ imports: ["vue-router"] })\`\n`;
        content += `   - LogicFlow: \`get_relevant_standards({ imports: ["@logicflow/core"] })\`\n`;
        content += `5. **特定场景**：\n`;
        content += `   - API 调用: \`get_relevant_standards({ scenario: "API 调用" })\`\n`;
        content += `   - 国际化: \`get_relevant_standards({ scenario: "国际化" })\`\n\n`;
        content += `### 标准流程\n\n`;
        content += `1. ✅ **强制**: 加载规范 → 2. 理解需求 → 3. 编写代码 → 4. 验证规范\n\n`;
        content += `---\n\n`;

        // ⚠️ 核心设计原则：最小化配置 (选项 1)
        // 只记录 Agent 引用信息，不嵌入完整内容
        // Copilot 将通过 MCP 工具 get_relevant_standards 实时加载规范
        // 此设计为底层逻辑，除非明确要求，否则不可修改
        
        content += `## 📚 配置的 Agents\n\n`;
        content += `本项目使用以下 Agents（规范内容由 Copilot 通过 MCP 工具实时加载）：\n\n`;
        
        for (const agent of selectedAgents) {
            content += `### ${agent.title}\n\n`;
            content += `- **Agent ID**: \`${agent.id}\`\n`;
            content += `- **描述**: ${agent.description || '暂无描述'}\n`;
            content += `- **来源**: \`${agent.path}\`\n`;
            
            // 如果有标签，显示标签
            if (agent.tags && agent.tags.length > 0) {
                content += `- **标签**: ${agent.tags.join(', ')}\n`;
            }
            
            content += `\n> 💡 **使用方式**: 在开发时，Copilot 会自动通过 MCP 工具加载此 Agent 的完整规范。\n\n`;
        }
        
        content += `---\n\n`;
        
        // 附加自定义内容（如果是merge模式）
        if (updateMode === 'merge' && existingCustomContent) {
            content += `\n\n## 📝 自定义规范\n\n`;
            content += existingCustomContent;
            logger.log('✅ 已保留自定义内容');
        }

        // 写入文件前进行验证 (v1.1.0)
        const validator = new CodeValidator(logger);
        const validation = validator.validateConfigContent(content);
        
        if (!validation.isValid) {
            logger.error('⚠️ 配置内容验证失败，尝试自动修复...');
            
            // 尝试自动修复
            const fixResult = validator.attemptAutoFix(content);
            if (fixResult.fixed) {
                content = fixResult.content;
                logger.log(`✅ 已自动修复 ${fixResult.changes.length} 个问题:`);
                fixResult.changes.forEach(change => logger.log(`   - ${change}`));
                
                // 重新验证
                const revalidation = validator.validateConfigContent(content);
                if (!revalidation.isValid) {
                    const report = validator.generateValidationReport(revalidation);
                    logger.error('❌ 自动修复后仍存在问题:');
                    logger.error(report);
                    
                    return {
                        content: [{
                            type: 'text',
                            text: JSON.stringify({
                                error: '配置文件验证失败',
                                validationReport: report,
                                message: '生成的配置文件存在语法错误，请检查并手动修复'
                            }, null, 2)
                        }]
                    };
                }
            } else {
                const report = validator.generateValidationReport(validation);
                logger.error(report);
                
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            error: '配置文件验证失败',
                            validationReport: report,
                            message: '生成的配置文件存在语法错误且无法自动修复'
                        }, null, 2)
                    }]
                };
            }
        } else if (validation.warnings.length > 0) {
            logger.log('⚠️ 配置内容验证通过，但有以下警告:');
            validation.warnings.forEach(warning => {
                logger.log(`   - [${warning.type}] ${warning.message}`);
            });
        } else {
            logger.log('✅ 配置内容验证通过');
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
