import * as fs from 'fs';
import { StandardsManager } from '../core/standardsManager.js';
import { ConsoleLogger } from '../core/types.js';
import { AutoInitializer } from '../core/autoInitializer.js';

/**
 * 智能规范推荐工具
 * 零参数，自动检测上下文并推荐规范
 * v1.9.0: 集成自动项目配置检测
 */
export async function getSmartStandards(args: {
    currentFile?: string;
    fileContent?: string;
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    const manager = new StandardsManager();
    const autoInit = new AutoInitializer(logger);
    
    try {
        // ✨ 新增：自动检测并初始化项目配置
        const initResult = await autoInit.ensureProjectConfig();
        
        if (initResult.needsInit) {
            logger.log('📋 ' + initResult.message);
            
            // 如果初始化成功，提示用户
            if (initResult.initialized) {
                return {
                    content: [{
                        type: 'text',
                        text: `🎉 **首次使用自动配置完成**\n\n${initResult.message}\n\n现在可以继续使用 @mta 进行开发了！\n\n💡 提示：项目配置文件已生成在 .github/copilot-instructions.md`
                    }]
                };
            }
        }
        
        let detectedFileType = 'unknown';
        let detectedImports: string[] = [];
        let detectedScenario = '';
        let analysisSource = 'none';

        // 策略 1: 使用提供的文件路径
        if (args.currentFile && fs.existsSync(args.currentFile)) {
            analysisSource = 'file-path';
            const ext = args.currentFile.split('.').pop()?.toLowerCase() || '';
            
            const extMap: Record<string, string> = {
                'vue': 'vue',
                'ts': 'ts',
                'tsx': 'tsx',
                'js': 'js',
                'jsx': 'jsx'
            };
            detectedFileType = extMap[ext] || 'unknown';

            // 读取文件内容分析
            try {
                const content = fs.readFileSync(args.currentFile, 'utf-8');
                const imports = extractImports(content);
                detectedImports = imports;
                detectedScenario = inferScenario(content, detectedFileType);
            } catch {
                logger.log('无法读取文件内容，仅使用文件类型');
            }
        }

        // 策略 2: 使用提供的文件内容
        if (args.fileContent) {
            analysisSource = 'file-content';
            const imports = extractImports(args.fileContent);
            detectedImports = [...detectedImports, ...imports];
            
            // 从内容推断文件类型
            if (detectedFileType === 'unknown') {
                if (args.fileContent.includes('<template>')) {
                    detectedFileType = 'vue';
                } else if (args.fileContent.includes('interface ') || args.fileContent.includes('type ')) {
                    detectedFileType = 'ts';
                }
            }
            
            const scenario = inferScenario(args.fileContent, detectedFileType);
            if (scenario) detectedScenario = scenario;
        }

        // 策略 3: 环境检测（进程当前目录）
        if (detectedFileType === 'unknown') {
            analysisSource = 'environment';
            const cwd = process.cwd();
            const packageJsonPath = `${cwd}/package.json`;
            
            if (fs.existsSync(packageJsonPath)) {
                try {
                    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
                    
                    if (deps['vue']) {
                        detectedFileType = 'vue';
                        detectedImports.push('vue');
                    }
                    if (deps['react']) {
                        detectedFileType = 'tsx';
                        detectedImports.push('react');
                    }
                    if (deps['element-plus']) detectedImports.push('element-plus');
                    if (deps['pinia']) detectedImports.push('pinia');
                    if (deps['vue-i18n']) detectedImports.push('vue-i18n');
                } catch {
                    logger.log('无法解析 package.json');
                }
            }
        }

        // 去重
        detectedImports = [...new Set(detectedImports)];

        logger.log(`🔍 智能检测结果: fileType=${detectedFileType}, imports=${detectedImports.join(',')}, scenario=${detectedScenario}`);

        // 获取相关规范
        const standards = manager.getRelevantStandards({
            fileType: detectedFileType !== 'unknown' ? detectedFileType : undefined,
            imports: detectedImports.length > 0 ? detectedImports : undefined,
            scenario: detectedScenario || undefined
        });

        const combinedContent = manager.combineStandards(standards);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    analysis: {
                        source: analysisSource,
                        fileType: detectedFileType,
                        imports: detectedImports,
                        scenario: detectedScenario
                    },
                    standards: standards,
                    content: combinedContent,
                    stats: {
                        standardsCount: standards.length,
                        contentLength: combinedContent.length,
                        estimatedTokens: Math.ceil(combinedContent.length / 4)
                    }
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`智能规范推荐失败: ${error}`);
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
 * 从代码中提取导入语句
 */
function extractImports(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const es6Regex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = es6Regex.exec(content)) !== null) {
        const pkg = match[1];
        if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
            imports.push(pkg.split('/')[0]);
        }
    }
    
    // require statements
    const requireRegex = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
        const pkg = match[1];
        if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
            imports.push(pkg.split('/')[0]);
        }
    }
    
    return [...new Set(imports)];
}

/**
 * 从代码推断开发场景
 */
function inferScenario(content: string, fileType: string): string {
    const scenarios: string[] = [];
    
    // Vue 相关
    if (fileType === 'vue') {
        if (content.includes('ElForm') || content.includes('<el-form')) {
            scenarios.push('表单组件');
        }
        if (content.includes('ElTable') || content.includes('<el-table')) {
            scenarios.push('表格组件');
        }
        if (content.includes('defineStore')) {
            scenarios.push('状态管理');
        }
        if (content.includes('useI18n') || content.includes('$t(')) {
            scenarios.push('国际化');
        }
    }
    
    // API 调用
    if (content.includes('fetch(') || content.includes('axios.')) {
        scenarios.push('API 调用');
    }
    
    // TypeScript
    if (content.includes('interface ') || content.includes('type ')) {
        scenarios.push('类型定义');
    }
    
    return scenarios.join('、');
}
