import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import * as https from 'https';

/**
 * Agent 配置接口
 */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  tags: string[];
  source: 'github' | 'bundled' | 'local';
  url?: string;
  bundled: boolean;
  priority: number;
  matchRules: {
    frameworks?: string[];
    languages?: string[];
    tools?: string[];
    keywords?: string[];
    files?: string[];
  };
}

/**
 * 项目特征
 */
export interface ProjectFeatures {
  frameworks: string[];
  languages: string[];
  tools: string[];
  keywords: string[];
  files: string[];
}

/**
 * Agent 匹配结果
 */
export interface AgentMatch {
  id: string;
  agent: AgentConfig;
  score: number;
  reasons: string[];
}

/**
 * Agent 管理器 - 三级缓存机制
 * 
 * 加载优先级：
 * 1. 本地缓存 (~/.copilot-agents/cache/) - 最新版本
 * 2. 插件内置 (bundled-agents/) - 离线可用
 * 3. GitHub 动态获取 - 后台更新缓存
 */
export class AgentManager {
  private configPath: string;
  private cachePath: string;
  private bundledPath: string;
  private config: { agents: Record<string, AgentConfig> } | null = null;
  private cacheExpiry = 86400000; // 24小时（毫秒）

  constructor(private context: vscode.ExtensionContext) {
    const homeDir = os.homedir();
    this.configPath = path.join(homeDir, '.copilot-agents', 'config.json');
    this.cachePath = path.join(homeDir, '.copilot-agents', 'cache');
    this.bundledPath = path.join(context.extensionPath, 'bundled-agents');

    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.configPath),
      this.cachePath,
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * 加载配置
   */
  async loadConfig(): Promise<{ agents: Record<string, AgentConfig> }> {
    if (this.config) {
      return this.config;
    }

    // 如果配置文件不存在，从内置创建
    if (!fs.existsSync(this.configPath)) {
      await this.createDefaultConfig();
    }

    const content = fs.readFileSync(this.configPath, 'utf-8');
    this.config = JSON.parse(content);
    return this.config!;
  }

  /**
   * 创建默认配置
   */
  private async createDefaultConfig(): Promise<void> {
    const defaultConfig = {
      version: '1.0.0',
      updatePolicy: 'auto',
      cacheExpiry: 86400,
      agents: {
        'vue3': {
          id: 'vue3',
          name: 'Vue 3 Agent',
          description: 'Vue 3 + TypeScript + Composition API 通用开发代理',
          tags: ['vue3', 'typescript', 'composition-api'],
          source: 'github' as const,
          url: 'https://raw.githubusercontent.com/ForLear/copilot-prompts/main/agents/vue3.agent.md',
          bundled: true,
          priority: 10,
          matchRules: {
            frameworks: ['vue', 'vue3'],
            languages: ['typescript'],
            files: ['vite.config.ts', 'vue.config.js'],
            keywords: ['vue', 'composition']
          }
        },
        'typescript': {
          id: 'typescript',
          name: 'TypeScript Strict',
          description: 'TypeScript 严格模式代理 - 零 any，完整类型安全',
          tags: ['typescript', 'type-safety'],
          source: 'github' as const,
          url: 'https://raw.githubusercontent.com/ForLear/copilot-prompts/main/agents/typescript.agent.md',
          bundled: true,
          priority: 8,
          matchRules: {
            languages: ['typescript'],
            files: ['tsconfig.json']
          }
        },
        'i18n': {
          id: 'i18n',
          name: 'i18n Agent',
          description: '国际化 (i18n) 专用代理 - 零硬编码文本',
          tags: ['i18n', 'internationalization'],
          source: 'github' as const,
          url: 'https://raw.githubusercontent.com/ForLear/copilot-prompts/main/agents/i18n.agent.md',
          bundled: true,
          priority: 7,
          matchRules: {
            tools: ['vue-i18n', 'i18next'],
            keywords: ['i18n', 'internationalization'],
            files: ['i18n.ts', 'i18n.js', 'locales']
          }
        },
        'vitasage': {
          id: 'vitasage',
          name: 'VitaSage Agent',
          description: 'VitaSage 工业配方管理系统专用代理',
          tags: ['vue3', 'typescript', 'vitasage'],
          source: 'github' as const,
          url: 'https://raw.githubusercontent.com/ForLear/copilot-prompts/main/agents/vitasage.agent.md',
          bundled: true,
          priority: 9,
          matchRules: {
            frameworks: ['vue3'],
            tools: ['logicflow', 'element-plus'],
            keywords: ['vitasage', 'recipe']
          }
        },
        'logicflow': {
          id: 'logicflow',
          name: 'LogicFlow Agent',
          description: 'LogicFlow 流程图组件通用开发代理',
          tags: ['logicflow', 'flowchart'],
          source: 'github' as const,
          url: 'https://raw.githubusercontent.com/ForLear/copilot-prompts/main/agents/logicflow.agent.md',
          bundled: true,
          priority: 6,
          matchRules: {
            tools: ['logicflow'],
            keywords: ['flow', 'flowchart', 'graph']
          }
        }
      }
    };

    fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
    this.config = defaultConfig as any;
  }

  /**
   * 加载 Agent 内容（三级缓存）
   */
  async loadAgent(id: string): Promise<string> {
    // 1. 尝试从缓存加载
    const cached = await this.loadFromCache(id);
    if (cached && !this.isCacheExpired(id)) {
      // 后台异步更新（不阻塞）
      this.updateCacheInBackground(id);
      return cached;
    }

    // 2. 从内置加载
    const bundled = await this.loadBundled(id);
    if (bundled) {
      // 后台异步更新（不阻塞）
      this.updateCacheInBackground(id);
      return bundled;
    }

    // 3. 从 GitHub 加载（同步，因为前面都失败了）
    try {
      const content = await this.loadFromGitHub(id);
      await this.saveToCache(id, content);
      return content;
    } catch (error) {
      throw new Error(`Failed to load agent "${id}": ${error}`);
    }
  }

  /**
   * 从缓存加载
   */
  private async loadFromCache(id: string): Promise<string | null> {
    const cachePath = path.join(this.cachePath, `${id}.agent.md`);
    if (!fs.existsSync(cachePath)) {
      return null;
    }

    return fs.readFileSync(cachePath, 'utf-8');
  }

  /**
   * 检查缓存是否过期
   */
  private isCacheExpired(id: string): boolean {
    const cachePath = path.join(this.cachePath, `${id}.agent.md`);
    if (!fs.existsSync(cachePath)) {
      return true;
    }

    const stats = fs.statSync(cachePath);
    const age = Date.now() - stats.mtimeMs;
    return age > this.cacheExpiry;
  }

  /**
   * 从内置加载
   */
  private async loadBundled(id: string): Promise<string | null> {
    const bundledPath = path.join(this.bundledPath, `${id}.agent.md`);
    if (!fs.existsSync(bundledPath)) {
      return null;
    }

    return fs.readFileSync(bundledPath, 'utf-8');
  }

  /**
   * 从 GitHub 加载
   */
  private async loadFromGitHub(id: string): Promise<string> {
    const config = await this.loadConfig();
    const agent = config.agents[id];
    
    if (!agent || !agent.url) {
      throw new Error(`Agent "${id}" not found in config or missing URL`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Request timeout')), 10000);
      
      https.get(agent.url!, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          clearTimeout(timeout);
          resolve(data);
        });
        res.on('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      }).on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  /**
   * 保存到缓存
   */
  private async saveToCache(id: string, content: string): Promise<void> {
    const cachePath = path.join(this.cachePath, `${id}.agent.md`);
    fs.writeFileSync(cachePath, content, 'utf-8');
  }

  /**
   * 后台更新缓存
   */
  private updateCacheInBackground(id: string): void {
    // 异步执行，不阻塞主流程
    setTimeout(async () => {
      try {
        const content = await this.loadFromGitHub(id);
        await this.saveToCache(id, content);
        console.log(`Cache updated for agent: ${id}`);
      } catch (error) {
        console.warn(`Failed to update cache for agent "${id}":`, error);
      }
    }, 0);
  }

  /**
   * 分析项目特征
   */
  async analyzeProject(projectPath: string): Promise<ProjectFeatures> {
    const features: ProjectFeatures = {
      frameworks: [],
      languages: [],
      tools: [],
      keywords: [],
      files: []
    };

    // 读取 package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // 检测框架
        if (deps['vue'] || deps['@vue/cli-service']) {
          features.frameworks.push('vue');
          const vueVersion = deps['vue']?.match(/\^?(\d+)/)?.[1];
          if (vueVersion === '3' || deps['vue']?.includes('^3')) {
            features.frameworks.push('vue3');
          }
        }
        if (deps['react']) features.frameworks.push('react');
        if (deps['@angular/core']) features.frameworks.push('angular');

        // 检测语言
        if (deps['typescript'] || deps['@types/node']) {
          features.languages.push('typescript');
        }
        
        // JavaScript 是默认的
        features.languages.push('javascript');

        // 检测工具
        if (deps['vite']) features.tools.push('vite');
        if (deps['webpack']) features.tools.push('webpack');
        if (deps['element-plus']) features.tools.push('element-plus');
        if (deps['@logicflow/core']) features.tools.push('logicflow');
        if (deps['vue-i18n']) features.tools.push('vue-i18n');
        if (deps['i18next']) features.tools.push('i18next');
        
        // 添加更多常用工具检测
        if (deps['eslint']) features.tools.push('eslint');
        if (deps['prettier']) features.tools.push('prettier');
        if (deps['axios']) features.tools.push('axios');
      } catch (error) {
        console.warn('Failed to parse package.json:', error);
      }
    }

    // 检测 TypeScript 配置
    if (fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
      features.files.push('tsconfig.json');
      if (!features.languages.includes('typescript')) {
        features.languages.push('typescript');
      }
    }

    // 检测其他配置文件
    const checkFiles = [
      'vite.config.ts',
      'vite.config.js',
      'vue.config.js',
      'webpack.config.js',
      'i18n.ts',
      'i18n.js',
      '.eslintrc.js',
      '.prettierrc'
    ];

    for (const file of checkFiles) {
      if (fs.existsSync(path.join(projectPath, file))) {
        features.files.push(file);
      }
    }

    // 检测目录
    if (fs.existsSync(path.join(projectPath, 'src', 'locales')) ||
        fs.existsSync(path.join(projectPath, 'locales'))) {
      features.files.push('locales');
      features.keywords.push('i18n');
    }

    // 检测 src 目录下的文件扩展名
    const srcPath = path.join(projectPath, 'src');
    if (fs.existsSync(srcPath)) {
      try {
        const files = this.getFilesRecursive(srcPath, 2); // 只扫描 2 层
        const hasVue = files.some(f => f.endsWith('.vue'));
        const hasTs = files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'));
        
        if (hasVue && !features.frameworks.includes('vue')) {
          features.frameworks.push('vue');
        }
        if (hasTs && !features.languages.includes('typescript')) {
          features.languages.push('typescript');
        }
      } catch (error) {
        console.warn('Failed to scan src directory:', error);
      }
    }

    return features;
  }

  /**
   * 递归获取文件列表（限制深度）
   */
  private getFilesRecursive(dir: string, maxDepth: number, currentDepth = 0): string[] {
    if (currentDepth >= maxDepth) {
      return [];
    }

    const files: string[] = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        // 跳过 node_modules 和其他常见的忽略目录
        if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
          continue;
        }

        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...this.getFilesRecursive(fullPath, maxDepth, currentDepth + 1));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // 忽略权限错误等
    }

    return files;
  }

  /**
   * 自动匹配 Agents
   */
  async matchAgents(projectPath: string): Promise<AgentMatch[]> {
    const features = await this.analyzeProject(projectPath);
    const config = await this.loadConfig();

    const matches: AgentMatch[] = [];

    for (const [id, agent] of Object.entries(config.agents)) {
      const result = this.calculateMatch(features, agent);
      // 降低阈值：任何有匹配的都返回（分数 > 0）
      if (result.score > 0) {
        matches.push({
          id,
          agent,
          score: result.score,
          reasons: result.reasons
        });
      }
    }

    // 按分数排序
    matches.sort((a, b) => b.score - a.score);

    // 如果没有任何匹配，返回 TypeScript agent（通用）
    if (matches.length === 0) {
      const tsAgent = config.agents['typescript'];
      if (tsAgent) {
        matches.push({
          id: 'typescript',
          agent: tsAgent,
          score: 1,
          reasons: ['默认通用 Agent']
        });
      }
    }

    return matches;
  }

  /**
   * 计算匹配分数
   */
  private calculateMatch(features: ProjectFeatures, agent: AgentConfig): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];
    const rules = agent.matchRules;

    // 框架匹配（权重：10）
    if (rules.frameworks) {
      const matched = rules.frameworks.filter(f => features.frameworks.includes(f));
      if (matched.length > 0) {
        score += matched.length * 10;
        reasons.push(`框架匹配: ${matched.join(', ')}`);
      }
    }

    // 语言匹配（权重：5）
    if (rules.languages) {
      const matched = rules.languages.filter(l => features.languages.includes(l));
      if (matched.length > 0) {
        score += matched.length * 5;
        reasons.push(`语言匹配: ${matched.join(', ')}`);
      }
    }

    // 工具匹配（权重：8）
    if (rules.tools) {
      const matched = rules.tools.filter(t => features.tools.includes(t));
      if (matched.length > 0) {
        score += matched.length * 8;
        reasons.push(`工具匹配: ${matched.join(', ')}`);
      }
    }

    // 关键词匹配（权重：3）
    if (rules.keywords) {
      const matched = rules.keywords.filter(k => 
        features.keywords.includes(k) || features.tools.includes(k)
      );
      if (matched.length > 0) {
        score += matched.length * 3;
        reasons.push(`关键词匹配: ${matched.join(', ')}`);
      }
    }

    // 文件匹配（权重：2）
    if (rules.files) {
      const matched = rules.files.filter(f => features.files.includes(f));
      if (matched.length > 0) {
        score += matched.length * 2;
        reasons.push(`文件匹配: ${matched.join(', ')}`);
      }
    }

    return { score, reasons };
  }

  /**
   * 获取 Agent 路径
   */
  getAgentPath(id: string): string {
    return path.join(this.cachePath, `${id}.agent.md`);
  }

  /**
   * 列出所有可用的 Agents
   */
  async listAgents(): Promise<AgentConfig[]> {
    const config = await this.loadConfig();
    return Object.values(config.agents);
  }
}
