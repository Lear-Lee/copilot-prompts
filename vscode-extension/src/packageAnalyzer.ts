import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface PackageAnalysisResult {
    name: string;
    version: string;
    description: string;
    keywords: string[];
    types?: TypeDefinition[];
    examples?: CodeExample[];
    dependencies?: string[];
}

export interface TypeDefinition {
    name: string;
    kind: 'interface' | 'class' | 'function' | 'type';
    signature?: string;
    properties?: PropertyInfo[];
    description?: string;
}

export interface PropertyInfo {
    name: string;
    type: string;
    optional: boolean;
    description?: string;
}

export interface CodeExample {
    title: string;
    code: string;
    language: string;
}

export class PackageAnalyzer {
    constructor(private outputChannel: vscode.OutputChannel) {}

    /**
     * 分析指定的 npm 包
     */
    async analyzePackage(packageName: string, workspaceRoot: string): Promise<PackageAnalysisResult | null> {
        try {
            this.log(`开始分析包: ${packageName}`);

            // 1. 查找包路径
            const packagePath = this.findPackagePath(packageName, workspaceRoot);
            if (!packagePath) {
                vscode.window.showErrorMessage(`未找到包: ${packageName}。请确保已安装该包。`);
                return null;
            }

            this.log(`包路径: ${packagePath}`);

            // 2. 读取 package.json
            const packageJson = await this.readPackageJson(packagePath);
            if (!packageJson) {
                return null;
            }

            // 3. 读取 README.md 提取示例
            const examples = await this.extractExamples(packagePath);

            // 4. 分析 TypeScript 类型定义
            const types = await this.analyzeTypeDefinitions(packagePath);

            const result: PackageAnalysisResult = {
                name: packageJson.name || packageName,
                version: packageJson.version || 'unknown',
                description: packageJson.description || '',
                keywords: packageJson.keywords || [],
                types,
                examples,
                dependencies: Object.keys(packageJson.dependencies || {})
            };

            this.log(`✅ 分析完成: ${types?.length || 0} 个类型定义, ${examples?.length || 0} 个示例`);
            return result;

        } catch (error) {
            this.log(`分析失败: ${error}`, true);
            vscode.window.showErrorMessage(`分析包失败: ${error}`);
            return null;
        }
    }

    /**
     * 查找包的安装路径
     */
    private findPackagePath(packageName: string, workspaceRoot: string): string | null {
        const possiblePaths = [
            path.join(workspaceRoot, 'node_modules', packageName),
            path.join(workspaceRoot, '..', 'node_modules', packageName),
            path.join(workspaceRoot, '../..', 'node_modules', packageName)
        ];

        for (const pkgPath of possiblePaths) {
            if (fs.existsSync(pkgPath)) {
                return pkgPath;
            }
        }

        return null;
    }

    /**
     * 读取 package.json
     */
    private async readPackageJson(packagePath: string): Promise<any> {
        try {
            const packageJsonPath = path.join(packagePath, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                throw new Error('package.json not found');
            }

            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            this.log(`读取 package.json 失败: ${error}`, true);
            return null;
        }
    }

    /**
     * 从 README 提取代码示例
     */
    private async extractExamples(packagePath: string): Promise<CodeExample[]> {
        const examples: CodeExample[] = [];

        try {
            const readmePath = path.join(packagePath, 'README.md');
            if (!fs.existsSync(readmePath)) {
                this.log('未找到 README.md');
                return examples;
            }

            const content = fs.readFileSync(readmePath, 'utf-8');

            // 提取代码块 (```language ... ```)
            const codeBlockRegex = /```(\w+)\n([\s\S]*?)```/g;
            let match;
            let count = 0;

            while ((match = codeBlockRegex.exec(content)) !== null && count < 5) {
                const language = match[1];
                const code = match[2].trim();

                // 只保留相关的代码块 (跳过 shell/bash)
                if (!['bash', 'sh', 'shell', 'console'].includes(language.toLowerCase())) {
                    // 尝试找到代码块前的标题
                    const beforeCode = content.substring(Math.max(0, match.index - 200), match.index);
                    const titleMatch = beforeCode.match(/###?\s+(.+)$/m);
                    const title = titleMatch ? titleMatch[1].trim() : `Example ${count + 1}`;

                    examples.push({
                        title,
                        code,
                        language
                    });

                    count++;
                }
            }

            this.log(`从 README 提取 ${examples.length} 个代码示例`);
        } catch (error) {
            this.log(`提取示例失败: ${error}`, true);
        }

        return examples;
    }

    /**
     * 分析 TypeScript 类型定义
     */
    private async analyzeTypeDefinitions(packagePath: string): Promise<TypeDefinition[]> {
        const types: TypeDefinition[] = [];

        try {
            // 查找 .d.ts 文件
            const dtsFiles = this.findDtsFiles(packagePath);
            
            if (dtsFiles.length === 0) {
                this.log('未找到 .d.ts 类型定义文件');
                return types;
            }

            this.log(`找到 ${dtsFiles.length} 个 .d.ts 文件`);

            // 简单解析主要的类型定义 (不使用完整的 TypeScript AST)
            for (const dtsFile of dtsFiles.slice(0, 3)) { // 只分析前3个文件
                const fileTypes = this.parseTypeDefinitionsSimple(dtsFile);
                types.push(...fileTypes);

                if (types.length > 20) {
                    break; // 限制最多20个类型定义
                }
            }

            this.log(`解析 ${types.length} 个类型定义`);
        } catch (error) {
            this.log(`分析类型定义失败: ${error}`, true);
        }

        return types;
    }

    /**
     * 查找 .d.ts 文件
     */
    private findDtsFiles(packagePath: string): string[] {
        const dtsFiles: string[] = [];

        try {
            // 查找主要的类型定义文件
            const mainDts = path.join(packagePath, 'index.d.ts');
            if (fs.existsSync(mainDts)) {
                dtsFiles.push(mainDts);
            }

            // 查找 dist/types 目录
            const distTypes = path.join(packagePath, 'dist', 'types');
            if (fs.existsSync(distTypes)) {
                const files = fs.readdirSync(distTypes);
                files.forEach(file => {
                    if (file.endsWith('.d.ts')) {
                        dtsFiles.push(path.join(distTypes, file));
                    }
                });
            }

            // 查找 types 目录
            const typesDir = path.join(packagePath, 'types');
            if (fs.existsSync(typesDir)) {
                const files = fs.readdirSync(typesDir);
                files.forEach(file => {
                    if (file.endsWith('.d.ts')) {
                        dtsFiles.push(path.join(typesDir, file));
                    }
                });
            }

            // 查找根目录的其他 .d.ts 文件
            const rootFiles = fs.readdirSync(packagePath);
            rootFiles.forEach(file => {
                if (file.endsWith('.d.ts') && file !== 'index.d.ts') {
                    dtsFiles.push(path.join(packagePath, file));
                }
            });

        } catch (error) {
            this.log(`查找 .d.ts 文件失败: ${error}`, true);
        }

        return dtsFiles;
    }

    /**
     * 简单解析类型定义 (不使用完整的 TypeScript Compiler API)
     */
    private parseTypeDefinitionsSimple(filePath: string): TypeDefinition[] {
        const types: TypeDefinition[] = [];

        try {
            const content = fs.readFileSync(filePath, 'utf-8');

            // 提取 export interface
            const interfaceRegex = /export\s+interface\s+(\w+)(?:<[^>]+>)?\s*\{([^}]*)\}/g;
            let match;

            while ((match = interfaceRegex.exec(content)) !== null) {
                const name = match[1];
                const body = match[2];

                types.push({
                    name,
                    kind: 'interface',
                    signature: `interface ${name}`,
                    properties: this.parseProperties(body)
                });
            }

            // 提取 export type
            const typeRegex = /export\s+type\s+(\w+)\s*=\s*([^;\n]+)/g;
            while ((match = typeRegex.exec(content)) !== null) {
                types.push({
                    name: match[1],
                    kind: 'type',
                    signature: `type ${match[1]} = ${match[2].trim()}`
                });
            }

            // 提取 export function
            const functionRegex = /export\s+(?:declare\s+)?function\s+(\w+)\s*(<[^>]+>)?\s*\(([^)]*)\)\s*:\s*([^;\n{]+)/g;
            while ((match = functionRegex.exec(content)) !== null) {
                types.push({
                    name: match[1],
                    kind: 'function',
                    signature: `function ${match[1]}(${match[3]}): ${match[4].trim()}`
                });
            }

            // 提取 export class
            const classRegex = /export\s+(?:declare\s+)?class\s+(\w+)(?:<[^>]+>)?\s*\{/g;
            while ((match = classRegex.exec(content)) !== null) {
                types.push({
                    name: match[1],
                    kind: 'class',
                    signature: `class ${match[1]}`
                });
            }

        } catch (error) {
            this.log(`解析文件失败 ${filePath}: ${error}`, true);
        }

        return types;
    }

    /**
     * 解析接口属性
     */
    private parseProperties(body: string): PropertyInfo[] {
        const properties: PropertyInfo[] = [];

        // 简单的属性解析: name?: type
        const lines = body.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
                continue;
            }

            const propMatch = trimmed.match(/(\w+)(\??):\s*([^;,]+)/);
            if (propMatch) {
                properties.push({
                    name: propMatch[1],
                    optional: propMatch[2] === '?',
                    type: propMatch[3].trim()
                });
            }
        }

        return properties;
    }

    /**
     * 获取已安装的包列表
     */
    async getInstalledPackages(workspaceRoot: string): Promise<string[]> {
        try {
            const packageJsonPath = path.join(workspaceRoot, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
                return [];
            }

            const content = fs.readFileSync(packageJsonPath, 'utf-8');
            const packageJson = JSON.parse(content);

            const deps = Object.keys(packageJson.dependencies || {});
            const devDeps = Object.keys(packageJson.devDependencies || {});

            return [...deps, ...devDeps].sort();
        } catch (error) {
            this.log(`获取包列表失败: ${error}`, true);
            return [];
        }
    }

    private log(message: string, isError: boolean = false) {
        const prefix = isError ? '❌' : '📦';
        this.outputChannel.appendLine(`${prefix} ${message}`);
    }
}
