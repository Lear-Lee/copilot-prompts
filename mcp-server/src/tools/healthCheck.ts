import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { ConsoleLogger } from '../core/types.js';

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 健康检查工具
 * 诊断 MCP 服务器配置和运行状态
 */
export async function healthCheck(args: {
    workspacePath?: string;
    verbose?: boolean;
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    const verbose = args.verbose ?? false;
    
    try {
        const checks = {
            server: { status: 'unknown', details: [] as string[] },
            configuration: { status: 'unknown', details: [] as string[] },
            dependencies: { status: 'unknown', details: [] as string[] },
            standards: { status: 'unknown', details: [] as string[] },
            workspace: { status: 'unknown', details: [] as string[] }
        };

        // Check 1: 服务器运行状态
        logger.log('🔍 检查服务器状态...');
        try {
            checks.server.status = 'healthy';
            checks.server.details.push('✅ MCP 服务器正在运行');
            checks.server.details.push(`📍 进程 PID: ${process.pid}`);
            checks.server.details.push(`🕐 运行时间: ${Math.floor(process.uptime())}秒`);
        } catch {
            checks.server.status = 'error';
            checks.server.details.push('❌ 服务器未响应');
        }

        // Check 2: 配置文件
        logger.log('🔍 检查配置文件...');
        const workspacePath = args.workspacePath || process.cwd();
        const vscodeDir = path.join(workspacePath, '.vscode');
        
        if (fs.existsSync(vscodeDir)) {
            checks.workspace.status = 'healthy';
            checks.workspace.details.push(`✅ 工作区路径: ${workspacePath}`);
            
            // mcp.json
            const mcpJsonPath = path.join(vscodeDir, 'mcp.json');
            if (fs.existsSync(mcpJsonPath)) {
                try {
                    const config = JSON.parse(fs.readFileSync(mcpJsonPath, 'utf-8'));
                    
                    // 检查新格式 (servers) 和旧格式 (mcpServers)
                    const hasNewFormat = config.servers?.['copilot-prompts'];
                    const hasOldFormat = config.mcpServers?.['copilot-prompts'];
                    
                    if (hasNewFormat) {
                        checks.configuration.status = 'healthy';
                        checks.configuration.details.push('✅ mcp.json 配置正确 (使用新格式)');
                        
                        const serverConfig = config.servers['copilot-prompts'];
                        if (verbose) {
                            checks.configuration.details.push(`  Command: ${serverConfig.command}`);
                            checks.configuration.details.push(`  Args: ${serverConfig.args?.join(' ')}`);
                            checks.configuration.details.push(`  AutoStart: ${serverConfig.autoStart ?? 'undefined'}`);
                            checks.configuration.details.push(`  Env: ${JSON.stringify(serverConfig.env ?? {})}`);
                        }
                        
                        // 检查是否包含推荐字段
                        if (!serverConfig.env) {
                            checks.configuration.details.push('💡 建议: 添加 "env": {} 字段');
                        }
                        if (!serverConfig.autoStart) {
                            checks.configuration.details.push('💡 建议: 添加 "autoStart": true 字段');
                        }
                    } else if (hasOldFormat) {
                        checks.configuration.status = 'warning';
                        checks.configuration.details.push('⚠️  mcp.json 使用旧格式 (mcpServers)');
                        checks.configuration.details.push('💡 建议: 运行 auto_setup 工具升级到新格式 (servers)');
                        
                        if (verbose) {
                            const serverConfig = config.mcpServers['copilot-prompts'];
                            checks.configuration.details.push(`  Command: ${serverConfig.command}`);
                            checks.configuration.details.push(`  Args: ${serverConfig.args?.join(' ')}`);
                        }
                    } else {
                        checks.configuration.status = 'warning';
                        checks.configuration.details.push('⚠️  mcp.json 缺少 copilot-prompts 配置');
                        checks.configuration.details.push('💡 建议: 运行 auto_setup 工具添加配置');
                    }
                } catch (error) {
                    checks.configuration.status = 'error';
                    checks.configuration.details.push(`❌ mcp.json 格式错误: ${error}`);
                    checks.configuration.details.push('💡 修复: 运行 auto_setup 工具重新生成配置');
                }
            } else {
                checks.configuration.status = 'warning';
                checks.configuration.details.push('⚠️  mcp.json 不存在');
                checks.configuration.details.push('💡 建议: 运行 auto_setup 工具自动配置');
            }
            
            // settings.json
            const settingsPath = path.join(vscodeDir, 'settings.json');
            if (fs.existsSync(settingsPath)) {
                try {
                    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
                    if (settings['github.copilot.chat.mcp.enabled'] === true) {
                        checks.configuration.details.push('✅ VS Code MCP 已启用');
                    } else {
                        checks.configuration.details.push('⚠️  VS Code MCP 未启用');
                    }
                } catch {
                    checks.configuration.details.push('⚠️  settings.json 格式错误');
                }
            }
        } else {
            checks.workspace.status = 'error';
            checks.workspace.details.push('❌ .vscode 目录不存在');
        }

        // Check 3: 依赖检查
        logger.log('🔍 检查依赖...');
        const serverRoot = path.resolve(__dirname, '../..');
        const packageJsonPath = path.join(serverRoot, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                checks.dependencies.status = 'healthy';
                checks.dependencies.details.push(`✅ 服务器版本: ${pkg.version}`);
                
                if (verbose && pkg.dependencies) {
                    const deps = Object.entries(pkg.dependencies).slice(0, 3);
                    deps.forEach(([name, version]) => {
                        checks.dependencies.details.push(`  ${name}: ${version}`);
                    });
                }
                
                // 检查关键依赖
                const requiredDeps = ['@modelcontextprotocol/sdk'];
                const missing = requiredDeps.filter(dep => !pkg.dependencies?.[dep]);
                if (missing.length > 0) {
                    checks.dependencies.status = 'error';
                    checks.dependencies.details.push(`❌ 缺少依赖: ${missing.join(', ')}`);
                }
            } catch {
                checks.dependencies.status = 'error';
                checks.dependencies.details.push('❌ 无法读取 package.json');
            }
        }

        // Check 4: 规范文件
        logger.log('🔍 检查规范文件...');
        const standardsDir = path.join(serverRoot, 'standards');
        
        if (fs.existsSync(standardsDir)) {
            const categories = ['core', 'frameworks', 'libraries', 'patterns'];
            const foundStandards: string[] = [];
            
            for (const category of categories) {
                const categoryPath = path.join(standardsDir, category);
                if (fs.existsSync(categoryPath)) {
                    const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));
                    foundStandards.push(...files.map(f => `${category}/${f}`));
                }
            }
            
            if (foundStandards.length > 0) {
                checks.standards.status = 'healthy';
                checks.standards.details.push(`✅ 找到 ${foundStandards.length} 个规范文件`);
                if (verbose) {
                    foundStandards.slice(0, 5).forEach(s => {
                        checks.standards.details.push(`  📄 ${s}`);
                    });
                    if (foundStandards.length > 5) {
                        checks.standards.details.push(`  ... 还有 ${foundStandards.length - 5} 个文件`);
                    }
                }
            } else {
                checks.standards.status = 'warning';
                checks.standards.details.push('⚠️  未找到规范文件');
            }
        } else {
            checks.standards.status = 'error';
            checks.standards.details.push('❌ standards 目录不存在');
        }

        // 生成总体健康状态
        const allStatuses = Object.values(checks).map(c => c.status);
        const overallStatus = allStatuses.includes('error') ? 'error' 
                            : allStatuses.includes('warning') ? 'warning' 
                            : 'healthy';

        const statusEmoji = {
            healthy: '✅',
            warning: '⚠️',
            error: '❌',
            unknown: '❓'
        };

        logger.log(`${statusEmoji[overallStatus]} 健康检查完成`);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    overallStatus,
                    summary: `${statusEmoji[overallStatus]} MCP 服务器状态: ${overallStatus}`,
                    checks,
                    recommendations: generateRecommendations(checks)
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`健康检查失败: ${error}`);
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

/**
 * 根据检查结果生成建议
 */
function generateRecommendations(checks: any): string[] {
    const recommendations: string[] = [];
    
    if (checks.configuration.status !== 'healthy') {
        recommendations.push('🔧 运行 auto_setup 工具自动配置 MCP 服务器');
    }
    
    if (checks.workspace.status === 'error') {
        recommendations.push('📁 确保在正确的工作区目录中运行');
    }
    
    if (checks.dependencies.status === 'error') {
        recommendations.push('📦 运行 npm install 安装依赖');
    }
    
    if (checks.standards.status !== 'healthy') {
        recommendations.push('📚 检查 standards 目录是否存在规范文件');
    }
    
    if (recommendations.length === 0) {
        recommendations.push('🎉 一切正常！您可以开始使用 MCP 服务器了');
    }
    
    return recommendations;
}
