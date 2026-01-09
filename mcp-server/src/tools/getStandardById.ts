/**
 * 按 ID 获取规范工具
 * 
 * 设计理念：AI 已经知道需要什么规范，直接按 ID 获取
 * 这是最简洁高效的方式，不做任何"智能"匹配
 * 
 * @module tools/getStandardById
 */

import * as fs from 'fs';
import * as path from 'path';
import { ConsoleLogger } from '../core/types.js';

/**
 * 规范目录结构
 */
const STANDARD_DIRS = [
    'standards/core',
    'standards/frameworks',
    'standards/libraries',
    'standards/patterns',
    'standards/workflows'
];

/**
 * 规范 ID 到文件路径的映射（缓存）
 */
let standardsCache: Map<string, string> | null = null;

/**
 * 加载模式
 */
type LoadMode = 'summary' | 'key-rules' | 'full';

/**
 * 按 ID 获取规范
 * 
 * @example
 * // AI 直接调用
 * get_standard_by_id({ id: 'vue3-composition', mode: 'key-rules' })
 * 
 * @example
 * // 获取多个规范
 * get_standard_by_id({ ids: ['vue3-composition', 'element-plus'], mode: 'summary' })
 */
export async function getStandardById(args: {
    /** 单个规范 ID */
    id?: string;
    /** 多个规范 ID */
    ids?: string[];
    /** 加载模式：summary(摘要) | key-rules(关键规则) | full(完整) */
    mode?: LoadMode;
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    const mode = args.mode || 'key-rules';
    
    try {
        // 获取要加载的 ID 列表
        const idsToLoad = args.ids || (args.id ? [args.id] : []);
        
        if (idsToLoad.length === 0) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        error: '请提供 id 或 ids 参数',
                        availableIds: listAvailableStandards()
                    }, null, 2)
                }]
            };
        }

        // 确保缓存已加载
        ensureCache();

        // 加载规范
        const results: Array<{
            id: string;
            found: boolean;
            content?: string;
            error?: string;
        }> = [];

        for (const id of idsToLoad) {
            const filePath = standardsCache!.get(id);
            
            if (!filePath) {
                results.push({
                    id,
                    found: false,
                    error: `规范 "${id}" 不存在`
                });
                continue;
            }

            try {
                const fullContent = fs.readFileSync(filePath, 'utf-8');
                const content = formatContent(fullContent, mode);
                
                results.push({
                    id,
                    found: true,
                    content
                });
            } catch (error) {
                results.push({
                    id,
                    found: false,
                    error: `读取失败: ${error}`
                });
            }
        }

        // 统计
        const successCount = results.filter(r => r.found).length;
        const totalLength = results.reduce((sum, r) => sum + (r.content?.length || 0), 0);

        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    mode,
                    stats: {
                        requested: idsToLoad.length,
                        found: successCount,
                        totalChars: totalLength,
                        estimatedTokens: Math.ceil(totalLength / 4)
                    },
                    standards: results
                }, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`获取规范失败: ${error}`);
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
 * 列出所有可用的规范
 */
export function listAvailableStandards(): string[] {
    ensureCache();
    return Array.from(standardsCache!.keys());
}

/**
 * 确保缓存已加载
 */
function ensureCache(): void {
    if (standardsCache) return;

    standardsCache = new Map();
    const baseDir = findBaseDir();

    for (const dir of STANDARD_DIRS) {
        const fullDir = path.join(baseDir, dir);
        if (!fs.existsSync(fullDir)) continue;

        scanDirectory(fullDir, standardsCache);
    }
}

/**
 * 查找基础目录
 */
function findBaseDir(): string {
    // 尝试多个可能的位置
    const possiblePaths = [
        process.cwd(),
        path.join(process.cwd(), '..'),
        path.join(__dirname, '..', '..', '..')
    ];

    for (const p of possiblePaths) {
        if (fs.existsSync(path.join(p, 'standards'))) {
            return p;
        }
    }

    return process.cwd();
}

/**
 * 扫描目录
 */
function scanDirectory(dir: string, cache: Map<string, string>): void {
    const items = fs.readdirSync(dir);

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            scanDirectory(fullPath, cache);
        } else if (item.endsWith('.md')) {
            // 使用文件名（不含扩展名）作为 ID
            const id = path.basename(item, '.md');
            cache.set(id, fullPath);
        }
    }
}

/**
 * 根据模式格式化内容
 */
function formatContent(content: string, mode: LoadMode): string {
    switch (mode) {
        case 'summary':
            return extractSummary(content);
        case 'key-rules':
            return extractKeyRules(content);
        case 'full':
            return content;
        default:
            return content;
    }
}

/**
 * 提取摘要（约 200-500 字符）
 */
function extractSummary(content: string): string {
    const lines = content.split('\n');
    const summaryLines: string[] = [];
    
    // 提取标题
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        summaryLines.push(`# ${titleMatch[1]}`);
    }

    // 提取描述（第一个非空、非标题段落）
    let foundDescription = false;
    for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') continue;
        if (line.startsWith('>')) {
            summaryLines.push(line);
            foundDescription = true;
            break;
        }
        if (line.startsWith('-') || line.startsWith('*')) continue;
        
        summaryLines.push(line);
        foundDescription = true;
        break;
    }

    // 提取主要章节标题
    const sectionHeaders = lines.filter(l => l.match(/^##\s+/)).slice(0, 5);
    if (sectionHeaders.length > 0) {
        summaryLines.push('\n**主要章节**:');
        summaryLines.push(...sectionHeaders.map(h => `- ${h.replace(/^##\s+/, '')}`));
    }

    return summaryLines.join('\n');
}

/**
 * 提取关键规则（约 1000-3000 字符）
 */
function extractKeyRules(content: string): string {
    const lines = content.split('\n');
    const keyRulesLines: string[] = [];
    
    // 提取标题
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
        keyRulesLines.push(`# ${titleMatch[1]}`);
    }

    // 寻找关键规则相关的章节
    const keyPatterns = [
        /强制|必须|禁止|规则|核心|关键|重要/,
        /MUST|REQUIRED|SHOULD|必选|核心原则/,
        /✅|❌|⚠️/
    ];

    let inKeySection = false;
    let sectionDepth = 0;
    let lineCount = 0;
    const maxLines = 80;

    for (const line of lines) {
        // 检测章节开始
        const headerMatch = line.match(/^(#{2,3})\s+(.+)$/);
        if (headerMatch) {
            const depth = headerMatch[1].length;
            const title = headerMatch[2];
            
            // 判断是否是关键章节
            inKeySection = keyPatterns.some(p => p.test(title));
            sectionDepth = depth;
            
            if (inKeySection) {
                keyRulesLines.push('');
                keyRulesLines.push(line);
                lineCount++;
            }
            continue;
        }

        // 在关键章节内收集内容
        if (inKeySection && lineCount < maxLines) {
            // 遇到同级或更高级标题时结束
            if (line.match(/^#{2}\s+/) && sectionDepth >= 2) {
                inKeySection = false;
                continue;
            }
            
            keyRulesLines.push(line);
            lineCount++;
        }

        // 收集带特殊标记的行（即使不在关键章节）
        if (!inKeySection && lineCount < maxLines) {
            if (line.includes('✅') || line.includes('❌') || line.includes('⚠️')) {
                keyRulesLines.push(line);
                lineCount++;
            }
        }
    }

    // 如果关键规则太少，添加代码示例
    if (keyRulesLines.length < 20) {
        const codeBlockMatch = content.match(/```[\s\S]{50,500}?```/);
        if (codeBlockMatch) {
            keyRulesLines.push('\n**示例**:');
            keyRulesLines.push(codeBlockMatch[0]);
        }
    }

    return keyRulesLines.join('\n').trim() || extractSummary(content);
}
