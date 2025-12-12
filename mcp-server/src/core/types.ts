/**
 * 项目特征接口
 */
export interface ProjectFeatures {
    frameworks: string[];
    languages: string[];
    tools: string[];
    keywords: string[];
    projectType: string;
}

/**
 * Agent 元数据接口
 */
export interface AgentMetadata {
    id: string;
    path: string;
    title: string;
    description: string;
    tags: string[];
    applicableWhen?: {
        frameworks?: string[];
        tools?: string[];
        languages?: string[];
        keywords?: string[];
    };
    score?: number;
}

/**
 * 配置生成结果
 */
export interface GenerationResult {
    success: boolean;
    projectType?: string;
    matchedAgents?: AgentMetadata[];
    configPath?: string;
    error?: string;
}

/**
 * 日志输出接口
 */
export interface Logger {
    log(message: string): void;
    error(message: string): void;
}

/**
 * 控制台日志实现
 */
export class ConsoleLogger implements Logger {
    log(message: string): void {
        console.log(`[INFO] ${message}`);
    }
    
    error(message: string): void {
        console.error(`[ERROR] ${message}`);
    }
}
