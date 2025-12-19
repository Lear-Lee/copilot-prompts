/**
 * 代码验证器 (v1.1.0)
 * 用于检测和防止常见的代码生成错误
 */

import { ConsoleLogger } from './types.js';

/**
 * 验证结果接口
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

/**
 * 验证错误
 */
export interface ValidationError {
    type: 'syntax' | 'completeness' | 'compatibility';
    message: string;
    line?: number;
    suggestion?: string;
}

/**
 * 验证警告
 */
export interface ValidationWarning {
    type: 'best-practice' | 'performance' | 'compatibility' | 'completeness';
    message: string;
    suggestion?: string;
}

/**
 * 代码验证器类
 */
export class CodeValidator {
    private logger: ConsoleLogger;
    
    constructor(logger?: ConsoleLogger) {
        this.logger = logger || new ConsoleLogger();
    }

    /**
     * 验证生成的配置文件内容
     */
    validateConfigContent(content: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // 1. 检查重复标签闭合 (如 </style></style>)
        this.checkDuplicateTags(content, errors);

        // 2. 检查括号匹配
        this.checkBracketMatching(content, errors);

        // 3. 检查 Markdown 语法
        this.checkMarkdownSyntax(content, errors);

        // 4. 检查必要章节完整性
        this.checkRequiredSections(content, warnings);

        // 5. 检查自定义内容标记
        this.checkCustomContentMarkers(content, warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 检查重复的HTML标签
     */
    private checkDuplicateTags(content: string, errors: ValidationError[]): void {
        const lines = content.split('\n');
        const tagPattern = /<\/([\w-]+)>/g;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const matches = Array.from(line.matchAll(tagPattern));
            
            if (matches.length > 0) {
                const tags = matches.map(m => m[1]);
                const tagCounts = new Map<string, number>();
                
                tags.forEach(tag => {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                });
                
                tagCounts.forEach((count, tag) => {
                    if (count > 1) {
                        errors.push({
                            type: 'syntax',
                            message: `重复的闭合标签 </${tag}> 在同一行出现 ${count} 次`,
                            line: i + 1,
                            suggestion: `检查是否有多余的闭合标签，应该只保留一个 </${tag}>`
                        });
                    }
                });
            }
        }
    }

    /**
     * 检查括号匹配
     */
    private checkBracketMatching(content: string, errors: ValidationError[]): void {
        const brackets = {
            '(': ')',
            '[': ']',
            '{': '}',
            '<': '>'
        };
        
        const stack: Array<{ char: string; line: number; col: number }> = [];
        const lines = content.split('\n');
        
        for (let lineNum = 0; lineNum < lines.length; lineNum++) {
            const line = lines[lineNum];
            
            // 跳过代码块内容
            if (line.trim().startsWith('```')) {
                continue;
            }
            
            for (let col = 0; col < line.length; col++) {
                const char = line[col];
                
                if (char in brackets) {
                    stack.push({ char, line: lineNum + 1, col: col + 1 });
                } else if (Object.values(brackets).includes(char)) {
                    if (stack.length === 0) {
                        errors.push({
                            type: 'syntax',
                            message: `未配对的闭合括号 '${char}'`,
                            line: lineNum + 1,
                            suggestion: `检查是否缺少对应的开放括号`
                        });
                    } else {
                        const last = stack.pop()!;
                        const expectedClose = brackets[last.char as keyof typeof brackets];
                        
                        if (char !== expectedClose) {
                            errors.push({
                                type: 'syntax',
                                message: `括号不匹配: 期望 '${expectedClose}' 但得到 '${char}'`,
                                line: lineNum + 1,
                                suggestion: `检查第 ${last.line} 行的 '${last.char}' 对应的闭合括号`
                            });
                        }
                    }
                }
            }
        }
        
        // 检查未闭合的括号
        if (stack.length > 0) {
            stack.forEach(bracket => {
                errors.push({
                    type: 'syntax',
                    message: `未闭合的括号 '${bracket.char}'`,
                    line: bracket.line,
                    suggestion: `添加对应的闭合括号 '${brackets[bracket.char as keyof typeof brackets]}'`
                });
            });
        }
    }

    /**
     * 检查 Markdown 语法
     */
    private checkMarkdownSyntax(content: string, errors: ValidationError[]): void {
        const lines = content.split('\n');
        let inCodeBlock = false;
        let codeBlockStart = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // 检查代码块标记
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    inCodeBlock = false;
                } else {
                    inCodeBlock = true;
                    codeBlockStart = i + 1;
                }
            }
        }
        
        // 如果代码块未闭合
        if (inCodeBlock) {
            errors.push({
                type: 'syntax',
                message: '未闭合的代码块',
                line: codeBlockStart,
                suggestion: '在代码块末尾添加 ``` 闭合标记'
            });
        }
    }

    /**
     * 检查必要章节完整性
     */
    private checkRequiredSections(content: string, warnings: ValidationWarning[]): void {
        const requiredSections = [
            { pattern: /## ⚠️ 强制工作流/i, name: '强制工作流章节' },
            { pattern: /## 📚 配置的 Agents/i, name: 'Agents 配置章节' }
        ];
        
        requiredSections.forEach(section => {
            if (!section.pattern.test(content)) {
                warnings.push({
                    type: 'completeness',
                    message: `缺少必要章节: ${section.name}`,
                    suggestion: '确保生成的配置文件包含所有必要的章节'
                });
            }
        });
    }

    /**
     * 检查自定义内容标记
     */
    private checkCustomContentMarkers(content: string, warnings: ValidationWarning[]): void {
        const hasCustomStart = content.includes('<!-- CUSTOM_START -->');
        const hasCustomEnd = content.includes('<!-- CUSTOM_END -->');
        
        if (hasCustomStart !== hasCustomEnd) {
            warnings.push({
                type: 'completeness',
                message: 'CUSTOM 标记不完整',
                suggestion: '确保 CUSTOM_START 和 CUSTOM_END 成对出现'
            });
        }
    }

    /**
     * 验证 Agent 内容
     */
    validateAgentContent(content: string, agentId: string): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // 检查 Agent 文件的特殊要求
        if (!content.includes('⚠️ 强制工作流') && !content.includes('## 强制工作流')) {
            warnings.push({
                type: 'best-practice',
                message: `Agent ${agentId} 缺少强制工作流说明`,
                suggestion: '建议在 Agent 中包含 MCP 工具调用的强制说明'
            });
        }

        // 基本语法检查
        const syntaxValidation = this.validateConfigContent(content);
        errors.push(...syntaxValidation.errors);
        warnings.push(...syntaxValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * 生成验证报告
     */
    generateValidationReport(result: ValidationResult): string {
        let report = '';
        
        if (result.isValid && result.warnings.length === 0) {
            report = '✅ 验证通过，未发现问题\n';
            return report;
        }
        
        if (!result.isValid) {
            report += '❌ 验证失败，发现以下错误：\n\n';
            result.errors.forEach((error, index) => {
                report += `${index + 1}. [${error.type}] ${error.message}\n`;
                if (error.line) {
                    report += `   位置: 第 ${error.line} 行\n`;
                }
                if (error.suggestion) {
                    report += `   建议: ${error.suggestion}\n`;
                }
                report += '\n';
            });
        } else {
            report += '✅ 验证通过\n\n';
        }
        
        if (result.warnings.length > 0) {
            report += '⚠️ 发现以下警告：\n\n';
            result.warnings.forEach((warning, index) => {
                report += `${index + 1}. [${warning.type}] ${warning.message}\n`;
                if (warning.suggestion) {
                    report += `   建议: ${warning.suggestion}\n`;
                }
                report += '\n';
            });
        }
        
        return report;
    }

    /**
     * 尝试自动修复简单的语法错误
     */
    attemptAutoFix(content: string): { fixed: boolean; content: string; changes: string[] } {
        let fixedContent = content;
        const changes: string[] = [];

        // 1. 修复重复的闭合标签
        const tagPattern = /(<\/([\w-]+)>)\1+/g;
        const tagMatches = content.match(tagPattern);
        if (tagMatches) {
            fixedContent = fixedContent.replace(tagPattern, '$1');
            changes.push(`修复了重复的闭合标签: ${tagMatches.join(', ')}`);
        }

        // 2. 修复未闭合的代码块
        const codeBlockCount = (fixedContent.match(/```/g) || []).length;
        if (codeBlockCount % 2 !== 0) {
            fixedContent += '\n```\n';
            changes.push('添加了缺失的代码块闭合标记');
        }

        return {
            fixed: changes.length > 0,
            content: fixedContent,
            changes
        };
    }
}

/**
 * 创建默认验证器实例
 */
export function createValidator(logger?: ConsoleLogger): CodeValidator {
    return new CodeValidator(logger);
}
