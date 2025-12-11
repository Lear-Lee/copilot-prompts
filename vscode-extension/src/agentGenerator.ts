import { PackageAnalysisResult, TypeDefinition, CodeExample } from './packageAnalyzer';

export class AgentGenerator {
    /**
     * 从包分析结果生成 Agent Markdown 内容
     */
    generateAgentMarkdown(analysis: PackageAnalysisResult): string {
        const timestamp = new Date().toLocaleString('zh-CN');

        let markdown = '';

        // Frontmatter
        markdown += '---\n';
        markdown += `description: '${analysis.name} ${analysis.description ? '- ' + analysis.description : ''}'\n`;
        
        const tags = [
            analysis.name.includes('vue') ? 'vue' : null,
            analysis.name.includes('react') ? 'react' : null,
            ...analysis.keywords.slice(0, 3),
            'npm',
            'auto-generated'
        ].filter(Boolean);
        
        markdown += `tags: [${tags.map(t => `'${t}'`).join(', ')}]\n`;
        markdown += '---\n\n';

        // 标题
        const title = this.formatTitle(analysis.name);
        markdown += `# ${title} Agent\n\n`;

        // 版本信息
        markdown += `> **版本**: ${analysis.version}\n`;
        markdown += `> **自动生成时间**: ${timestamp}\n`;
        markdown += `> **描述**: ${analysis.description || 'No description'}\n\n`;

        // 包信息
        markdown += '## 📦 包信息\n\n';
        markdown += `- **名称**: \`${analysis.name}\`\n`;
        markdown += `- **版本**: \`${analysis.version}\`\n`;
        if (analysis.description) {
            markdown += `- **描述**: ${analysis.description}\n`;
        }
        if (analysis.keywords.length > 0) {
            markdown += `- **关键词**: ${analysis.keywords.map(k => `\`${k}\``).join(', ')}\n`;
        }
        markdown += '\n';

        // 核心 API
        if (analysis.types && analysis.types.length > 0) {
            markdown += '## 🎯 核心 API\n\n';
            markdown += this.generateTypesSection(analysis.types);
        }

        // 使用示例
        if (analysis.examples && analysis.examples.length > 0) {
            markdown += '## 📋 使用示例\n\n';
            markdown += this.generateExamplesSection(analysis.examples);
        }

        // 最佳实践
        markdown += '## 🚀 最佳实践\n\n';
        markdown += this.generateBestPractices(analysis);

        // 依赖项
        if (analysis.dependencies && analysis.dependencies.length > 0) {
            markdown += '## 📚 依赖项\n\n';
            markdown += analysis.dependencies.slice(0, 10).map(dep => `- \`${dep}\``).join('\n');
            if (analysis.dependencies.length > 10) {
                markdown += `\n- ... 以及其他 ${analysis.dependencies.length - 10} 个依赖`;
            }
            markdown += '\n\n';
        }

        // 注意事项
        markdown += '## ⚠️ 注意事项\n\n';
        markdown += '- 此 Agent 由自动分析生成，可能不完整\n';
        markdown += '- 建议参考官方文档获取最新信息\n';
        markdown += '- 如有错误，请手动编辑此文件\n\n';

        return markdown;
    }

    /**
     * 生成类型定义章节
     */
    private generateTypesSection(types: TypeDefinition[]): string {
        let section = '';

        // 按类型分组
        const interfaces = types.filter(t => t.kind === 'interface');
        const classes = types.filter(t => t.kind === 'class');
        const functions = types.filter(t => t.kind === 'function');
        const typeAliases = types.filter(t => t.kind === 'type');

        // 接口
        if (interfaces.length > 0) {
            section += '### 接口定义\n\n';
            interfaces.slice(0, 5).forEach(iface => {
                section += `#### \`${iface.name}\`\n\n`;
                if (iface.properties && iface.properties.length > 0) {
                    section += '```typescript\n';
                    section += `interface ${iface.name} {\n`;
                    iface.properties.slice(0, 10).forEach(prop => {
                        section += `  ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}\n`;
                    });
                    if (iface.properties.length > 10) {
                        section += `  // ... 还有 ${iface.properties.length - 10} 个属性\n`;
                    }
                    section += '}\n';
                    section += '```\n\n';
                } else if (iface.signature) {
                    section += `\`\`\`typescript\n${iface.signature}\n\`\`\`\n\n`;
                }
            });

            if (interfaces.length > 5) {
                section += `_... 以及其他 ${interfaces.length - 5} 个接口_\n\n`;
            }
        }

        // 类
        if (classes.length > 0) {
            section += '### 类\n\n';
            classes.slice(0, 5).forEach(cls => {
                section += `- \`${cls.name}\`: ${cls.signature || cls.name}\n`;
            });
            section += '\n';
        }

        // 函数
        if (functions.length > 0) {
            section += '### 导出函数\n\n';
            functions.slice(0, 5).forEach(func => {
                section += `- \`${func.signature || func.name}\`\n`;
            });
            section += '\n';
        }

        // 类型别名
        if (typeAliases.length > 0) {
            section += '### 类型别名\n\n';
            typeAliases.slice(0, 5).forEach(type => {
                section += `- \`${type.signature || type.name}\`\n`;
            });
            section += '\n';
        }

        return section;
    }

    /**
     * 生成示例章节
     */
    private generateExamplesSection(examples: CodeExample[]): string {
        let section = '';

        examples.forEach((example, index) => {
            section += `### ${example.title}\n\n`;
            section += `\`\`\`${example.language}\n`;
            section += example.code;
            section += '\n```\n\n';
        });

        return section;
    }

    /**
     * 生成最佳实践建议
     */
    private generateBestPractices(analysis: PackageAnalysisResult): string {
        let practices = '';

        // 基于包名和类型生成建议
        const isVue = analysis.name.includes('vue');
        const isReact = analysis.name.includes('react');
        const isUI = analysis.keywords.some(k => 
            ['ui', 'component', 'components'].includes(k.toLowerCase())
        );

        practices += '### 通用建议\n\n';
        practices += '1. **类型安全**: 使用 TypeScript 类型定义确保代码质量\n';
        practices += '2. **按需引入**: 只导入需要的组件/函数，减小打包体积\n';
        practices += '3. **查阅文档**: 参考官方文档获取最新 API 和最佳实践\n\n';

        if (isVue) {
            practices += '### Vue 项目建议\n\n';
            practices += '```vue\n';
            practices += '<script setup lang="ts">\n';
            practices += `import { ${analysis.types?.[0]?.name || 'Component'} } from '${analysis.name}'\n`;
            practices += '</script>\n';
            practices += '```\n\n';
        }

        if (isReact) {
            practices += '### React 项目建议\n\n';
            practices += '```tsx\n';
            practices += `import { ${analysis.types?.[0]?.name || 'Component'} } from '${analysis.name}'\n\n`;
            practices += 'function MyComponent() {\n';
            practices += '  return <div>...</div>\n';
            practices += '}\n';
            practices += '```\n\n';
        }

        if (isUI) {
            practices += '### UI 组件库建议\n\n';
            practices += '1. **主题配置**: 根据项目需求配置主题色\n';
            practices += '2. **国际化**: 配置多语言支持\n';
            practices += '3. **按需加载**: 使用 tree-shaking 减小体积\n\n';
        }

        return practices;
    }

    /**
     * 格式化标题
     */
    private formatTitle(packageName: string): string {
        // 移除 @ 前缀和命名空间
        let title = packageName.replace(/^@[\w-]+\//, '');
        
        // 转为标题格式
        title = title
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return title;
    }

    /**
     * 生成 Agent 文件名
     */
    generateFileName(packageName: string): string {
        // 移除 @ 前缀和命名空间
        let fileName = packageName.replace(/^@[\w-]+\//, '');
        
        // 转为 kebab-case
        fileName = fileName.toLowerCase().replace(/[^\w-]/g, '-');
        
        return `${fileName}.agent.md`;
    }
}
