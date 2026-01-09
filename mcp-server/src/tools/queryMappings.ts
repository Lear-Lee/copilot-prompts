/**
 * 查询场景-规范映射工具
 * 
 * 设计理念：提供映射信息给 AI，让 AI 自己决定使用哪些规范
 * 不做"智能推荐"，只提供数据查询
 * 
 * @module tools/queryMappings
 */

import { 
    SCENARIO_STANDARDS, 
    FILETYPE_STANDARDS, 
    IMPORT_STANDARDS,
    suggestStandards,
    listAvailableScenarios
} from '../core/mappings/scenarioMappings.js';
import { ConsoleLogger } from '../core/types.js';

/**
 * 查询场景-规范映射
 * 
 * 这个工具只返回映射关系，不做任何"智能"处理
 * AI 可以参考这些映射自己做决策
 * 
 * @example
 * // 查询特定场景的规范
 * query_mappings({ scenario: 'vue3-form' })
 * 
 * @example
 * // 查询文件类型对应的规范
 * query_mappings({ fileType: 'vue' })
 * 
 * @example
 * // 查询导入包对应的规范
 * query_mappings({ imports: ['element-plus', 'pinia'] })
 * 
 * @example
 * // 获取所有映射关系
 * query_mappings({ listAll: true })
 */
export async function queryMappings(args: {
    /** 场景名称 */
    scenario?: string;
    /** 文件类型 */
    fileType?: string;
    /** 导入的包 */
    imports?: string[];
    /** 列出所有映射 */
    listAll?: boolean;
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    
    try {
        // 如果请求列出所有映射
        if (args.listAll) {
            return {
                content: [{
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        description: '场景-规范映射表，AI 可参考这些映射自行决定使用哪些规范',
                        mappings: {
                            scenarios: SCENARIO_STANDARDS,
                            fileTypes: FILETYPE_STANDARDS,
                            imports: IMPORT_STANDARDS
                        },
                        availableScenarios: listAvailableScenarios()
                    }, null, 2)
                }]
            };
        }

        // 查询特定映射
        const result: any = {
            success: true,
            query: {},
            suggestions: []
        };

        if (args.scenario) {
            result.query.scenario = args.scenario;
            result.scenarioStandards = SCENARIO_STANDARDS[args.scenario] || [];
        }

        if (args.fileType) {
            result.query.fileType = args.fileType;
            result.fileTypeStandards = FILETYPE_STANDARDS[args.fileType] || [];
        }

        if (args.imports && args.imports.length > 0) {
            result.query.imports = args.imports;
            result.importStandards = {};
            for (const imp of args.imports) {
                const normalizedImport = imp.startsWith('@') 
                    ? imp.split('/').slice(0, 2).join('/')
                    : imp.split('/')[0];
                result.importStandards[imp] = IMPORT_STANDARDS[normalizedImport] || [];
            }
        }

        // 汇总建议（去重）
        result.suggestions = suggestStandards({
            scenario: args.scenario,
            fileType: args.fileType,
            imports: args.imports
        });

        result.note = 'AI 可根据具体情况选择使用哪些规范，这只是建议列表';

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(result, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`查询映射失败: ${error}`);
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
 * 获取可用场景列表
 */
export async function listScenarios(): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    return {
        content: [{
            type: 'text',
            text: JSON.stringify({
                success: true,
                scenarios: listAvailableScenarios(),
                description: 'AI 可使用这些场景名称调用 use_preset 或 query_mappings'
            }, null, 2)
        }]
    };
}
