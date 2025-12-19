import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 缓存条目
 */
interface CacheEntry {
  content: string;
  timestamp: number;
  accessCount: number;
}

/**
 * 使用统计
 */
interface UsageStats {
  standardCombinations: Map<string, number>; // 规范组合 -> 使用次数
  individualStandards: Map<string, number>;   // 单个规范 -> 使用次数
  averageTokens: number;                       // 平均 token 消耗
  totalCalls: number;                          // 总调用次数
}

/**
 * 性能指标
 */
interface PerformanceMetrics {
  totalCalls: number;
  cacheHits: number;
  cacheMisses: number;
  averageResponseTime: number;
  totalTokensSaved: number;
  cacheHitRate?: string; // 可选，在 getPerformanceMetrics 中添加
}

/**
 * 规范资源管理器（Phase 3 增强）
 */
export class StandardsManager {
  private standardsPath: string;
  
  // Phase 3: 缓存系统
  private contentCache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30分钟
  private readonly MAX_CACHE_SIZE = 50; // 最多缓存50个条目
  
  // Phase 3: 使用统计
  private stats: UsageStats = {
    standardCombinations: new Map(),
    individualStandards: new Map(),
    averageTokens: 0,
    totalCalls: 0
  };
  
  // Phase 3: 性能指标
  private metrics: PerformanceMetrics = {
    totalCalls: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    totalTokensSaved: 0
  };
  
  constructor() {
    // 标准规范目录路径（相对于 mcp-server/build）
    this.standardsPath = path.resolve(__dirname, '../../../standards');
  }
  
  /**
   * 获取所有可用的规范资源
   */
  getAvailableStandards(): Array<{ uri: string; name: string; description: string; category: string }> {
    const standards: Array<{ uri: string; name: string; description: string; category: string }> = [];
    
    const categories = [
      { dir: 'core', name: '核心规范' },
      { dir: 'frameworks', name: '框架规范' },
      { dir: 'libraries', name: '库规范' },
      { dir: 'patterns', name: '设计模式' }
    ];
    
    categories.forEach(({ dir, name: categoryName }) => {
      const categoryPath = path.join(this.standardsPath, dir);
      
      if (!fs.existsSync(categoryPath)) {
        return;
      }
      
      const files = fs.readdirSync(categoryPath)
        .filter(file => file.endsWith('.md'));
      
      files.forEach(file => {
        const standardId = file.replace('.md', '');
        standards.push({
          uri: `standards://${dir}/${standardId}`,
          name: this.getStandardName(dir, standardId),
          description: `${categoryName} - ${this.getStandardDescription(dir, standardId)}`,
          category: dir
        });
      });
    });
    
    return standards;
  }
  
  /**
   * 读取特定规范内容（Phase 3: 带缓存）
   */
  readStandard(uri: string): string {
    const startTime = Date.now();
    
    // 检查缓存
    const cached = this.contentCache.get(uri);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      cached.accessCount++;
      this.metrics.cacheHits++;
      return cached.content;
    }
    
    this.metrics.cacheMisses++;
    
    // 解析 URI: standards://category/standard-name
    const match = uri.match(/^standards:\/\/([^/]+)\/(.+)$/);
    
    if (!match) {
      throw new Error(`Invalid standards URI: ${uri}`);
    }
    
    const [, category, standardId] = match;
    const filePath = path.join(this.standardsPath, category, `${standardId}.md`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Standard not found: ${uri}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 更新缓存
    this.updateCache(uri, content);
    
    // 更新统计
    this.stats.individualStandards.set(
      uri,
      (this.stats.individualStandards.get(uri) || 0) + 1
    );
    
    // 记录响应时间
    const responseTime = Date.now() - startTime;
    this.updateAverageResponseTime(responseTime);
    
    return content;
  }
  
  /**
   * 更新缓存
   */
  private updateCache(uri: string, content: string): void {
    // 如果缓存已满，移除最少使用的条目
    if (this.contentCache.size >= this.MAX_CACHE_SIZE) {
      let minAccessCount = Infinity;
      let lruKey: string | null = null;
      
      this.contentCache.forEach((entry, key) => {
        if (entry.accessCount < minAccessCount) {
          minAccessCount = entry.accessCount;
          lruKey = key;
        }
      });
      
      if (lruKey) {
        this.contentCache.delete(lruKey);
      }
    }
    
    this.contentCache.set(uri, {
      content,
      timestamp: Date.now(),
      accessCount: 1
    });
  }
  
  /**
   * 根据技术栈获取相关规范（增强版 - Phase 2）
   */
  getRelevantStandards(context: {
    fileType?: string;
    imports?: string[];
    scenario?: string;
    fileContent?: string; // 新增：文件内容（用于自动检测）
  }): string[] {
    const standardScores = new Map<string, number>();
    
    // 权重系统
    const WEIGHTS = {
      CORE: 100,           // 核心规范始终包含
      FILE_TYPE: 50,       // 文件类型匹配
      IMPORT_DIRECT: 40,   // 直接导入匹配
      IMPORT_RELATED: 20,  // 相关导入匹配
      SCENARIO: 30,        // 场景匹配
      CONTENT: 15,         // 内容关键词匹配
      THRESHOLD: 10        // 最低阈值
    };
    
    // 始终包含核心规范
    standardScores.set('standards://core/code-style', WEIGHTS.CORE);
    standardScores.set('standards://core/typescript-base', WEIGHTS.CORE);
    standardScores.set('standards://core/code-generation', WEIGHTS.CORE);
    
    // 自动检测导入（如果提供了文件内容）
    let detectedImports = context.imports || [];
    if (context.fileContent && !context.imports) {
      detectedImports = this.detectImports(context.fileContent);
    }
    
    // 根据文件类型评分
    if (context.fileType) {
      this.scoreByFileType(context.fileType, standardScores, WEIGHTS);
    }
    
    // 根据导入评分
    if (detectedImports.length > 0) {
      this.scoreByImports(detectedImports, standardScores, WEIGHTS);
    }
    
    // 根据场景评分
    if (context.scenario) {
      this.scoreByScenario(context.scenario, standardScores, WEIGHTS);
    }
    
    // 根据内容关键词评分
    if (context.fileContent) {
      this.scoreByContent(context.fileContent, standardScores, WEIGHTS);
    }
    
    // 过滤并排序
    const sortedStandards = Array.from(standardScores.entries())
      .filter(([_, score]) => score >= WEIGHTS.THRESHOLD)
      .sort((a, b) => b[1] - a[1])
      .map(([uri]) => uri);
    
    // Phase 3: 记录使用统计
    this.stats.totalCalls++;
    const combinationKey = sortedStandards.join('|');
    this.stats.standardCombinations.set(
      combinationKey,
      (this.stats.standardCombinations.get(combinationKey) || 0) + 1
    );
    
    return sortedStandards;
  }
  
  /**
   * 自动检测文件中的导入语句
   */
  private detectImports(content: string): string[] {
    const imports: string[] = [];
    
    // 匹配 ES6 import 语句
    const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    // 匹配 require 语句
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }
  
  /**
   * 根据文件类型评分
   */
  private scoreByFileType(
    fileType: string, 
    scores: Map<string, number>, 
    weights: Record<string, number>
  ): void {
    const type = fileType.toLowerCase();
    
    if (type === 'vue' || type.endsWith('.vue')) {
      this.addScore(scores, 'standards://frameworks/vue3-composition', weights.FILE_TYPE);
      this.addScore(scores, 'standards://patterns/component-design', weights.FILE_TYPE * 0.6);
    }
    
    // 微信小程序文件类型
    if (type === 'wxml' || type.endsWith('.wxml') ||
        type === 'wxss' || type.endsWith('.wxss') ||
        type === 'wxs' || type.endsWith('.wxs')) {
      this.addScore(scores, 'standards://frameworks/wechat-miniprogram', weights.FILE_TYPE);
    }
    
    if (type === 'ts' || type === 'typescript' || type.endsWith('.ts')) {
      // TypeScript 文件，略微提升 TS 规范权重
      this.addScore(scores, 'standards://core/typescript-base', weights.FILE_TYPE * 0.3);
    }
  }
  
  /**
   * 根据导入评分
   */
  private scoreByImports(
    imports: string[], 
    scores: Map<string, number>, 
    weights: Record<string, number>
  ): void {
    imports.forEach(imp => {
      const normalized = imp.toLowerCase();
      
      // Vue 生态
      if (normalized === 'vue' || normalized.startsWith('vue/')) {
        this.addScore(scores, 'standards://frameworks/vue3-composition', weights.IMPORT_DIRECT);
      } else if (normalized.includes('vue')) {
        this.addScore(scores, 'standards://frameworks/vue3-composition', weights.IMPORT_RELATED);
      }
      
      // Pinia
      if (normalized === 'pinia' || normalized.startsWith('pinia/')) {
        this.addScore(scores, 'standards://frameworks/pinia', weights.IMPORT_DIRECT);
      }
      
      // Element Plus
      if (normalized === 'element-plus' || normalized.startsWith('element-plus/')) {
        this.addScore(scores, 'standards://libraries/element-plus', weights.IMPORT_DIRECT);
      } else if (normalized.includes('element')) {
        this.addScore(scores, 'standards://libraries/element-plus', weights.IMPORT_RELATED);
      }
      
      // i18n
      if (normalized === 'vue-i18n' || normalized.includes('i18n')) {
        this.addScore(scores, 'standards://libraries/i18n', weights.IMPORT_DIRECT);
      }
      
      // 微信小程序
      if (normalized === 'wx' || normalized.includes('weixin') || 
          normalized.includes('miniprogram')) {
        this.addScore(scores, 'standards://frameworks/wechat-miniprogram', weights.IMPORT_DIRECT);
      }
      
      // Axios / API 相关
      if (normalized === 'axios' || normalized.includes('axios')) {
        this.addScore(scores, 'standards://patterns/api-layer', weights.IMPORT_DIRECT);
      }
      
      // 通用组件库导入提示组件设计
      if (normalized.includes('component') || normalized.startsWith('./components/')) {
        this.addScore(scores, 'standards://patterns/component-design', weights.IMPORT_RELATED);
      }
    });
  }
  
  /**
   * 根据场景评分
   */
  private scoreByScenario(
    scenario: string, 
    scores: Map<string, number>, 
    weights: Record<string, number>
  ): void {
    const normalized = scenario.toLowerCase();
    
    // API 相关场景
    if (normalized.includes('api') || normalized.includes('request') || 
        normalized.includes('fetch') || normalized.includes('axios')) {
      this.addScore(scores, 'standards://patterns/api-layer', weights.SCENARIO);
    }
    
    // 组件相关场景
    if (normalized.includes('component') || normalized.includes('组件') ||
        normalized.includes('widget') || normalized.includes('封装')) {
      this.addScore(scores, 'standards://patterns/component-design', weights.SCENARIO);
    }
    
    // 表单场景
    if (normalized.includes('form') || normalized.includes('表单') ||
        normalized.includes('input') || normalized.includes('validation')) {
      this.addScore(scores, 'standards://libraries/element-plus', weights.SCENARIO);
      this.addScore(scores, 'standards://patterns/component-design', weights.SCENARIO * 0.5);
    }
    
    // 状态管理场景
    if (normalized.includes('store') || normalized.includes('state') ||
        normalized.includes('状态') || normalized.includes('pinia')) {
      this.addScore(scores, 'standards://frameworks/pinia', weights.SCENARIO);
    }
    
    // 国际化场景
    if (normalized.includes('i18n') || normalized.includes('translate') ||
        normalized.includes('国际化') || normalized.includes('翻译') ||
        normalized.includes('locale')) {
      this.addScore(scores, 'standards://libraries/i18n', weights.SCENARIO);
    }
    
    // 微信小程序场景
    if (normalized.includes('小程序') || normalized.includes('miniprogram') ||
        normalized.includes('wechat') || normalized.includes('微信') ||
        normalized.includes('wx.') || normalized.includes('page(') ||
        normalized.includes('component(') || normalized.includes('云开发') ||
        normalized.includes('云函数') || normalized.includes('云数据库') ||
        normalized.includes('云存储')) {
      this.addScore(scores, 'standards://frameworks/wechat-miniprogram', weights.SCENARIO);
    }
  }
  
  /**
   * 根据文件内容关键词评分
   */
  private scoreByContent(
    content: string, 
    scores: Map<string, number>, 
    weights: Record<string, number>
  ): void {
    const normalized = content.toLowerCase();
    
    // Vue Composition API 关键词
    if (normalized.includes('defineprops') || normalized.includes('defineemits') ||
        normalized.includes('ref(') || normalized.includes('computed(') ||
        normalized.includes('watch(') || normalized.includes('onmounted')) {
      this.addScore(scores, 'standards://frameworks/vue3-composition', weights.CONTENT);
    }
    
    // Pinia 关键词
    if (normalized.includes('definestore') || normalized.includes('usestore') ||
        normalized.includes('$patch') || normalized.includes('$subscribe')) {
      this.addScore(scores, 'standards://frameworks/pinia', weights.CONTENT);
    }
    
    // Element Plus 关键词
    if (normalized.includes('el-form') || normalized.includes('el-table') ||
        normalized.includes('el-dialog') || normalized.includes('elmessage')) {
      this.addScore(scores, 'standards://libraries/element-plus', weights.CONTENT);
    }
    
    // i18n 关键词
    if (normalized.includes('$t(') || normalized.includes('t(\'') ||
        normalized.includes('usei18n') || normalized.includes('locale')) {
      this.addScore(scores, 'standards://libraries/i18n', weights.CONTENT);
    }
    
    // 微信小程序关键词
    if (normalized.includes('wx.') || normalized.includes('page({') ||
        normalized.includes('component({') || normalized.includes('setdata') ||
        normalized.includes('onload') || normalized.includes('onshow') ||
        normalized.includes('wx:for') || normalized.includes('wx:if') ||
        normalized.includes('wx.cloud') || normalized.includes('cloudfunctions') ||
        normalized.includes('callfunction') || normalized.includes('wx-server-sdk') ||
        normalized.includes('cloud.init') || normalized.includes('exports.main')) {
      this.addScore(scores, 'standards://frameworks/wechat-miniprogram', weights.CONTENT);
    }
    
    // API 层关键词
    if (normalized.includes('axios.') || normalized.includes('.get(') ||
        normalized.includes('.post(') || normalized.includes('interceptor')) {
      this.addScore(scores, 'standards://patterns/api-layer', weights.CONTENT);
    }
  }
  
  /**
   * 添加分数（累加）
   */
  private addScore(scores: Map<string, number>, uri: string, points: number): void {
    const current = scores.get(uri) || 0;
    scores.set(uri, current + points);
  }
  
  /**
   * 组合多个规范内容（Phase 3: 优化去重与顺序）
   */
  combineStandards(uris: string[]): string {
    const startTime = Date.now();
    
    // 去重（保持顺序）
    const uniqueUris = Array.from(new Set(uris));
    
    // 优化顺序：核心规范放在最前面
    const coreUris = uniqueUris.filter(uri => uri.startsWith('standards://core/'));
    const otherUris = uniqueUris.filter(uri => !uri.startsWith('standards://core/'));
    const sortedUris = [...coreUris, ...otherUris];
    
    const contents: string[] = [];
    let totalSize = 0;
    
    sortedUris.forEach(uri => {
      try {
        const content = this.readStandard(uri);
        const standardName = this.extractStandardName(uri);
        
        const section = `\n## 📚 ${standardName}\n\n${content}\n`;
        contents.push(section);
        totalSize += section.length;
      } catch (error) {
        console.error(`Failed to read standard ${uri}:`, error);
      }
    });
    
    const combined = contents.join('\n---\n');
    
    // 计算 token 节省（假设完整规范 ~10000 tokens）
    const estimatedTokens = Math.ceil(combined.length / 4);
    const baselineTokens = 10000;
    const tokensSaved = baselineTokens - estimatedTokens;
    
    this.metrics.totalTokensSaved += Math.max(0, tokensSaved);
    
    // 记录处理时间
    const processingTime = Date.now() - startTime;
    console.log(`[StandardsManager] Combined ${sortedUris.length} standards in ${processingTime}ms, ~${estimatedTokens} tokens (saved ${tokensSaved})`);
    
    return combined;
  }
  
  /**
   * 提取规范名称
   */
  private extractStandardName(uri: string): string {
    const match = uri.match(/^standards:\/\/([^/]+)\/(.+)$/);
    if (match) {
      const [, category, standardId] = match;
      return this.getStandardName(category, standardId);
    }
    return uri;
  }
  
  /**
   * 获取规范显示名称
   */
  private getStandardName(category: string, standardId: string): string {
    const nameMap: Record<string, Record<string, string>> = {
      core: {
        'code-style': '代码风格规范',
        'typescript-base': 'TypeScript 基础',
        'dart-base': 'Dart 基础'
      },
      frameworks: {
        'vue3-composition': 'Vue 3 Composition API',
        'pinia': 'Pinia 状态管理',
        'flutter': 'Flutter 开发规范',
        'wechat-miniprogram': '微信小程序开发'
      },
      libraries: {
        'element-plus': 'Element Plus 组件库',
        'i18n': '国际化 (i18n)'
      },
      patterns: {
        'api-layer': 'API 层设计',
        'component-design': '组件设计模式'
      }
    };
    
    return nameMap[category]?.[standardId] || standardId;
  }
  
  /**
   * 获取规范描述
   */
  private getStandardDescription(category: string, standardId: string): string {
    const descMap: Record<string, Record<string, string>> = {
      core: {
        'code-style': '命名规范、代码组织、注释规范',
        'typescript-base': '基础类型、函数、泛型使用',
        'dart-base': '空安全、异步编程、类和对象'
      },
      frameworks: {
        'vue3-composition': 'Props、Emits、生命周期、Composables',
        'pinia': 'Store 定义、状态管理、持久化',
        'flutter': 'Widget 设计、状态管理、性能优化',
        'wechat-miniprogram': 'Page/Component、网络请求、性能优化'
      },
      libraries: {
        'element-plus': '表单、表格、对话框、消息提示',
        'i18n': '翻译文件、组件使用、参数化'
      },
      patterns: {
        'api-layer': 'Axios 配置、API 模块化、错误处理',
        'component-design': '组件通信、Props 验证、性能优化'
      }
    };
    
    return descMap[category]?.[standardId] || '';
  }
  
  /**
   * 更新平均响应时间
   */
  private updateAverageResponseTime(responseTime: number): void {
    const { totalCalls, averageResponseTime } = this.metrics;
    this.metrics.totalCalls++;
    this.metrics.averageResponseTime = 
      (averageResponseTime * totalCalls + responseTime) / this.metrics.totalCalls;
  }
  
  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.totalCalls > 0 
        ? (this.metrics.cacheHits / this.metrics.totalCalls * 100).toFixed(2) + '%'
        : '0%'
    } as any;
  }
  
  /**
   * 获取使用统计
   */
  getUsageStats(): {
    topCombinations: Array<{ combination: string; count: number }>;
    topStandards: Array<{ standard: string; count: number }>;
    totalCalls: number;
  } {
    // 获取最常用的规范组合（Top 5）
    const topCombinations = Array.from(this.stats.standardCombinations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([combination, count]) => ({ combination, count }));
    
    // 获取最常用的单个规范（Top 5）
    const topStandards = Array.from(this.stats.individualStandards.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([standard, count]) => ({ standard, count }));
    
    return {
      topCombinations,
      topStandards,
      totalCalls: this.stats.totalCalls
    };
  }
  
  /**
   * 清除缓存
   */
  clearCache(): void {
    this.contentCache.clear();
    console.log('[StandardsManager] Cache cleared');
  }
  
  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    size: number;
    maxSize: number;
    entries: Array<{ uri: string; accessCount: number; age: number }>;
  } {
    const entries = Array.from(this.contentCache.entries())
      .map(([uri, entry]) => ({
        uri,
        accessCount: entry.accessCount,
        age: Math.floor((Date.now() - entry.timestamp) / 1000) // 秒
      }))
      .sort((a, b) => b.accessCount - a.accessCount);
    
    return {
      size: this.contentCache.size,
      maxSize: this.MAX_CACHE_SIZE,
      entries
    };
  }
}
