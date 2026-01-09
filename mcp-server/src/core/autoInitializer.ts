import * as fs from 'fs';
import * as path from 'path';
import { analyzeProject } from '../tools/analyzeProject.js';
import { generateConfig } from '../tools/generateConfig.js';
import { Logger } from './types.js';

/**
 * 自动初始化器
 * 在工具调用前检查项目配置，如果不存在则自动生成
 */
export class AutoInitializer {
    private initialized: Map<string, boolean> = new Map();
    
    constructor(private logger?: Logger) {}

    /**
     * 检查并初始化项目配置
     * @param workspacePath 工作区路径
     * @returns 是否需要初始化（返回 true 表示已执行初始化）
     */
    async ensureProjectConfig(workspacePath?: string): Promise<{
        needsInit: boolean;
        initialized: boolean;
        message: string;
    }> {
        // 检测工作区路径
        const projectPath = workspacePath || this.detectWorkspacePath();
        
        if (!projectPath) {
            return {
                needsInit: false,
                initialized: false,
                message: '未检测到工作区路径'
            };
        }

        // 检查是否已经初始化过（避免重复）
        if (this.initialized.get(projectPath)) {
            return {
                needsInit: false,
                initialized: true,
                message: `项目已配置: ${path.basename(projectPath)}`
            };
        }

        // 检查是否存在配置文件
        const configPath = path.join(projectPath, '.github', 'copilot-instructions.md');
        const hasConfig = fs.existsSync(configPath);

        if (hasConfig) {
            this.initialized.set(projectPath, true);
            return {
                needsInit: false,
                initialized: true,
                message: `项目已有配置: ${path.basename(projectPath)}`
            };
        }

        // 需要初始化
        this.log(`🔍 检测到项目未配置，开始自动分析和生成配置...`);
        this.log(`📁 项目路径: ${projectPath}`);

        try {
            // 1. 分析项目
            this.log('1️⃣ 分析项目技术栈...');
            const analysisResult = await analyzeProject({ projectPath });
            
            if (analysisResult.content?.[0]?.text) {
                const analysis = JSON.parse(analysisResult.content[0].text);
                this.log(`✅ 检测到: ${analysis.frameworks?.join(', ') || '未知技术栈'}`);

                // 2. 生成配置
                this.log('2️⃣ 生成项目配置文件...');
                await generateConfig({
                    projectPath,
                    autoMatch: true
                });

                this.initialized.set(projectPath, true);

                return {
                    needsInit: true,
                    initialized: true,
                    message: `✅ 项目配置已自动生成\n📁 路径: ${configPath}\n🎯 技术栈: ${analysis.frameworks?.join(', ')}`
                };
            }
        } catch (error) {
            this.log(`❌ 自动初始化失败: ${error}`);
            return {
                needsInit: true,
                initialized: false,
                message: `⚠️ 自动初始化失败: ${error instanceof Error ? error.message : String(error)}`
            };
        }

        return {
            needsInit: true,
            initialized: false,
            message: '⚠️ 无法完成自动初始化'
        };
    }

    /**
     * 检测工作区路径
     */
    private detectWorkspacePath(): string | null {
        // 优先级 1: 环境变量
        if (process.env.WORKSPACE_PATH) {
            return process.env.WORKSPACE_PATH;
        }

        // 优先级 2: 当前工作目录
        const cwd = process.cwd();
        if (this.isValidProject(cwd)) {
            return cwd;
        }

        // 优先级 3: 尝试从常见位置检测
        const possiblePaths = [
            path.join(cwd, '..'),
            path.join(cwd, '../..'),
        ];

        for (const possiblePath of possiblePaths) {
            if (this.isValidProject(possiblePath)) {
                return possiblePath;
            }
        }

        return null;
    }

    /**
     * 判断是否是有效的项目目录
     */
    private isValidProject(dirPath: string): boolean {
        if (!fs.existsSync(dirPath)) {
            return false;
        }

        // 检查是否有项目标志文件
        const markers = [
            'package.json',
            'pubspec.yaml',
            'pom.xml',
            'go.mod',
            'Cargo.toml',
            '.git'
        ];

        return markers.some(marker => 
            fs.existsSync(path.join(dirPath, marker))
        );
    }

    /**
     * 重置初始化状态（用于测试）
     */
    reset(): void {
        this.initialized.clear();
    }

    private log(message: string): void {
        if (this.logger) {
            this.logger.log(message);
        } else {
            console.error(`[AutoInit] ${message}`);
        }
    }
}
