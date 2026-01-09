/**
 * 场景-规范映射表
 * 
 * 这是一个简单的映射关系，供 AI 快速查询使用
 * MCP 只提供这些映射信息，具体选择由 AI 决定
 * 
 * @module core/mappings/scenarioMappings
 */

/**
 * 场景到规范的映射
 * 
 * AI 可以直接查询这个映射来获取建议的规范列表
 * 最终使用哪些规范由 AI 自己决定
 */
export const SCENARIO_STANDARDS: Record<string, string[]> = {
    // ========== Vue 相关场景 ==========
    'vue3-component': ['vue3-composition', 'typescript-strict'],
    'vue3-form': ['vue3-composition', 'element-plus', 'form-validation'],
    'vue3-table': ['vue3-composition', 'element-plus', 'pagination'],
    'pinia-store': ['pinia-store', 'typescript-strict'],
    'composable': ['vue3-composition', 'composable-patterns'],
    
    // ========== API 相关 ==========
    'api-call': ['axios-interceptor', 'error-handling', 'typescript-strict'],
    'api-design': ['api-design', 'restful-patterns'],
    
    // ========== 国际化 ==========
    'i18n': ['i18n', 'vue-i18n'],
    
    // ========== 测试 ==========
    'unit-test': ['vitest-guide', 'testing-patterns'],
    
    // ========== 特殊场景 ==========
    'logicflow': ['logicflow', 'vue3-composition'],
    'permission': ['permission-design', 'route-guard'],
    'performance': ['performance-optimization', 'lazy-loading']
};

/**
 * 文件类型到规范的映射
 */
export const FILETYPE_STANDARDS: Record<string, string[]> = {
    'vue': ['vue3-composition'],
    'ts': ['typescript-strict'],
    'tsx': ['react-hooks', 'typescript-strict'],
    'dart': ['dart-style', 'flutter-bloc']
};

/**
 * 导入包到规范的映射
 */
export const IMPORT_STANDARDS: Record<string, string[]> = {
    'vue': ['vue3-composition'],
    'element-plus': ['element-plus'],
    'pinia': ['pinia-store'],
    'axios': ['axios-interceptor'],
    'vue-i18n': ['i18n'],
    '@logicflow/core': ['logicflow'],
    'vitest': ['vitest-guide']
};

/**
 * 获取场景对应的规范列表
 */
export function getStandardsForScenario(scenario: string): string[] {
    return SCENARIO_STANDARDS[scenario] || [];
}

/**
 * 获取文件类型对应的规范列表
 */
export function getStandardsForFileType(fileType: string): string[] {
    return FILETYPE_STANDARDS[fileType] || [];
}

/**
 * 获取导入包对应的规范列表
 */
export function getStandardsForImport(importName: string): string[] {
    // 处理带路径的导入，如 '@logicflow/core' -> '@logicflow/core'
    const normalizedImport = importName.startsWith('@') 
        ? importName.split('/').slice(0, 2).join('/')
        : importName.split('/')[0];
    
    return IMPORT_STANDARDS[normalizedImport] || [];
}

/**
 * 获取所有可用的场景列表
 */
export function listAvailableScenarios(): string[] {
    return Object.keys(SCENARIO_STANDARDS);
}

/**
 * 查询规范建议（简单版）
 * 
 * 这个函数只是汇总各种来源的规范建议，去重后返回
 * AI 可以参考这些建议，但最终决定权在 AI
 */
export function suggestStandards(options: {
    scenario?: string;
    fileType?: string;
    imports?: string[];
}): string[] {
    const suggestions: string[] = [];
    
    if (options.scenario) {
        suggestions.push(...getStandardsForScenario(options.scenario));
    }
    
    if (options.fileType) {
        suggestions.push(...getStandardsForFileType(options.fileType));
    }
    
    if (options.imports) {
        for (const imp of options.imports) {
            suggestions.push(...getStandardsForImport(imp));
        }
    }
    
    // 去重
    return [...new Set(suggestions)];
}
