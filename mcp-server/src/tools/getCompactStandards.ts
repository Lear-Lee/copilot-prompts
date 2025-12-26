import * as fs from 'fs';
import { StandardsManager } from '../core/standardsManager.js';
import { ConsoleLogger } from '../core/types.js';

/**
 * 紧凑规范工具 - Token 优化版
 * 
 * 优化策略：
 * 1. 只返回规范摘要而非完整内容
 * 2. 提供规范 URI 供按需加载
 * 3. 针对特定场景返回精简的关键规则
 */
export async function getCompactStandards(args: {
    currentFile?: string;
    fileContent?: string;
    scenario?: string;
    // 新增：返回模式
    mode?: 'summary' | 'key-rules' | 'full';
}): Promise<{
    content: Array<{ type: string; text: string }>;
}> {
    const logger = new ConsoleLogger();
    const manager = new StandardsManager();
    const mode = args.mode || 'key-rules';
    
    try {
        // 检测上下文（复用智能检测逻辑）
        const context = detectContext(args, logger);
        
        // 获取相关规范 URI
        const standardUris = manager.getRelevantStandards({
            fileType: context.fileType,
            imports: context.imports,
            scenario: args.scenario || context.scenario
        });

        // 根据模式返回不同内容
        let responseContent: any;
        
        switch (mode) {
            case 'summary':
                // 只返回规范名称和描述，约 500 tokens
                responseContent = buildSummaryResponse(standardUris, manager);
                break;
                
            case 'key-rules':
                // 返回关键规则摘要，约 2000-3000 tokens
                responseContent = buildKeyRulesResponse(standardUris, context, manager);
                break;
                
            case 'full':
                // 完整内容（原有行为）
                responseContent = buildFullResponse(standardUris, manager);
                break;
        }

        return {
            content: [{
                type: 'text',
                text: JSON.stringify(responseContent, null, 2)
            }]
        };
    } catch (error) {
        logger.error(`规范获取失败: ${error}`);
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
 * 检测上下文
 */
function detectContext(args: any, logger: ConsoleLogger): {
    fileType: string;
    imports: string[];
    scenario: string;
} {
    let fileType = 'unknown';
    let imports: string[] = [];
    let scenario = '';

    // 从文件路径检测
    if (args.currentFile && fs.existsSync(args.currentFile)) {
        const ext = args.currentFile.split('.').pop()?.toLowerCase() || '';
        const extMap: Record<string, string> = {
            'vue': 'vue', 'ts': 'ts', 'tsx': 'tsx', 
            'js': 'js', 'jsx': 'jsx', 'dart': 'dart'
        };
        fileType = extMap[ext] || 'unknown';

        try {
            const content = fs.readFileSync(args.currentFile, 'utf-8');
            imports = extractImports(content);
            scenario = inferScenario(content, fileType);
        } catch {
            // 忽略读取错误
        }
    }

    // 从内容检测
    if (args.fileContent) {
        imports = [...imports, ...extractImports(args.fileContent)];
        if (fileType === 'unknown') {
            if (args.fileContent.includes('<template>')) fileType = 'vue';
            else if (args.fileContent.includes('interface ')) fileType = 'ts';
        }
        scenario = scenario || inferScenario(args.fileContent, fileType);
    }

    return { fileType, imports: [...new Set(imports)], scenario };
}

/**
 * 构建摘要响应（约 500 tokens）
 */
function buildSummaryResponse(uris: string[], manager: StandardsManager): any {
    const standards = manager.getAvailableStandards();
    const matched = uris.map(uri => {
        const std = standards.find(s => s.uri === uri);
        return {
            uri,
            name: std?.name || uri,
            description: std?.description || ''
        };
    });

    return {
        success: true,
        mode: 'summary',
        message: '已识别相关规范，如需详细内容请使用 mode: "key-rules" 或 "full"',
        standards: matched,
        stats: {
            count: matched.length,
            estimatedTokens: 500
        }
    };
}

/**
 * 构建关键规则响应（约 2000-3000 tokens）
 * 针对不同场景提取关键规则
 */
function buildKeyRulesResponse(
    uris: string[], 
    context: { fileType: string; imports: string[]; scenario: string },
    manager: StandardsManager
): any {
    const keyRules: string[] = [];
    
    // 根据文件类型添加关键规则
    if (context.fileType === 'vue') {
        keyRules.push(...getVueKeyRules(context.imports));
    } else if (context.fileType === 'dart') {
        keyRules.push(...getFlutterKeyRules());
    } else if (context.fileType === 'ts' || context.fileType === 'tsx') {
        keyRules.push(...getTypeScriptKeyRules());
    }
    
    // 根据导入添加特定规则
    if (context.imports.includes('element-plus')) {
        keyRules.push(...getElementPlusKeyRules());
    }
    if (context.imports.some(i => i.includes('i18n') || i.includes('locale'))) {
        keyRules.push(...getI18nKeyRules());
    }
    if (context.imports.includes('pinia')) {
        keyRules.push(...getPiniaKeyRules());
    }

    return {
        success: true,
        mode: 'key-rules',
        context: {
            fileType: context.fileType,
            detectedImports: context.imports,
            scenario: context.scenario
        },
        keyRules: keyRules.join('\n\n'),
        standardUris: uris, // 提供完整 URI 供按需加载
        stats: {
            rulesCount: keyRules.length,
            estimatedTokens: Math.ceil(keyRules.join('').length / 4)
        }
    };
}

/**
 * 构建完整响应（原有行为）
 */
function buildFullResponse(uris: string[], manager: StandardsManager): any {
    const content = manager.combineStandards(uris);
    return {
        success: true,
        mode: 'full',
        standards: uris,
        content,
        stats: {
            standardsCount: uris.length,
            contentLength: content.length,
            estimatedTokens: Math.ceil(content.length / 4)
        }
    };
}

// ==================== 关键规则提取 ====================

function getVueKeyRules(imports: string[]): string[] {
    return [
        `## Vue 3 关键规则

1. **使用 \`<script setup lang="ts">\`** - 必须使用 Composition API
2. **Props/Emits 类型定义** - 必须使用 interface 定义类型
3. **禁止内联样式** - 使用 scoped CSS 或 class
4. **模板简洁** - 复杂逻辑提取到 computed 或方法
5. **响应式** - 基本类型用 ref，对象用 reactive（不重新赋值）`,

        `## 组件结构顺序
\`\`\`vue
<script setup lang="ts">
// 1. 类型导入
// 2. Props/Emits 定义
// 3. 响应式状态
// 4. 计算属性
// 5. 方法
// 6. 生命周期
</script>
\`\`\``
    ];
}

function getElementPlusKeyRules(): string[] {
    return [
        `## Element Plus 关键规则

### 表格规范
- **必须** \`border\` + \`highlight-current-row\`
- 操作列 \`fixed="right"\`，宽度：2按钮160px/3按钮240px/4按钮280px
- 使用 \`v-loading\` 显示加载状态

### 表单规范
- 使用 \`label-position="top"\` 或 \`label-width="120px"\`
- 验证规则使用 \`FormRules<T>\` 类型
- 验证消息必须国际化

### 弹窗规范
- 使用 \`destroy-on-close\` 重置状态
- 宽度：简单500px/标准700px/复杂900px

### 消息提示
\`\`\`typescript
ElMessage.success($t('保存成功'))
ElMessageBox.confirm($t('确认删除？'), $t('警告'), { type: 'warning' })
\`\`\``,

        `## 表格示例
\`\`\`vue
<el-table v-loading="listLoading" :data="list" border highlight-current-row>
  <el-table-column type="index" :label="$t('序号')" width="70" />
  <el-table-column prop="name" :label="$t('名称')" min-width="120" />
  <el-table-column fixed="right" :label="$t('操作')" width="240">
    <template #default="{ row }">
      <el-button link type="primary" @click="handleEdit(row)">{{ $t('编辑') }}</el-button>
      <el-button link type="danger" @click="handleDelete(row)">{{ $t('删除') }}</el-button>
    </template>
  </el-table-column>
</el-table>
\`\`\``
    ];
}

function getI18nKeyRules(): string[] {
    return [
        `## 国际化关键规则

### 必须国际化的内容
- 所有按钮文字：\`{{ $t('保存') }}\`
- 表单标签：\`:label="$t('客户名称')"\`
- 占位符：\`:placeholder="$t('请输入')"\`
- 表格列标题：\`:label="$t('订单编号')"\`
- 弹窗标题：\`:title="$t('新增客户')"\`
- 提示消息：\`ElMessage.success($t('保存成功'))\`
- 验证规则：\`message: $t('请输入用户名')\`

### 禁止
- ❌ \`<el-button>新增</el-button>\` (硬编码)
- ❌ \`label="客户名称"\` (硬编码)
- ❌ \`ElMessage.success('保存成功')\` (硬编码)`
    ];
}

function getPiniaKeyRules(): string[] {
    return [
        `## Pinia 关键规则

### Setup Store 语法（推荐）
\`\`\`typescript
export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const isLoggedIn = computed(() => !!user.value)
  
  async function login(credentials: Credentials) {
    user.value = await authApi.login(credentials)
  }
  
  return { user, isLoggedIn, login }
})
\`\`\`

### 规范要求
- Store ID 使用小写短横线命名
- 使用 Setup Store 语法而非 Options Store
- 异步操作直接用 async/await
- 复杂状态操作使用 $patch`
    ];
}

function getTypeScriptKeyRules(): string[] {
    return [
        `## TypeScript 关键规则

### 类型定义
- 必须定义函数参数和返回类型
- 使用 interface 定义对象类型
- 避免使用 any，使用 unknown 替代

### 命名规范
- 变量/函数：camelCase
- 类/接口/类型：PascalCase
- 常量：UPPER_SNAKE_CASE

### 示例
\`\`\`typescript
interface User {
  id: number
  name: string
  email?: string
}

async function fetchUser(id: number): Promise<User | null> {
  // ...
}
\`\`\``
    ];
}

function getFlutterKeyRules(): string[] {
    return [
        `## Flutter UI 系统关键规则

### Design Token 快捷方式（必须使用）
| 快捷方式 | 用途 | 示例 |
|---------|------|------|
| \`$c\` | 颜色 | \`$c.primary\`, \`$c.text.primary\` |
| \`$s\` | 间距 | \`$s.sm\`, \`$s.md\`, \`$s.px(14)\` |
| \`$t\` | 排版 | \`$t.displayLarge\`, \`$t.bodyMedium\` |
| \`$r\` | 圆角 | \`$r.sm\`, \`$r.md\`, \`$r.full\` |

### Flex 组件库（必须使用）
- \`FlexButton\` 替代 ElevatedButton/TextButton
- \`FlexCard\` 替代 Card/Container
- \`FlexInput\` 替代 TextField
- \`Gap\` 替代 SizedBox（间隔）

### 禁止
- ❌ \`Color(0xFF3B82F6)\` 硬编码颜色
- ❌ \`EdgeInsets.all(16)\` 硬编码间距
- ❌ \`Colors.blue\` Material 颜色常量`
    ];
}

// ==================== 辅助函数 ====================

function extractImports(content: string): string[] {
    const imports: string[] = [];
    
    // ES6 imports
    const esImportRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = esImportRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    
    // require
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
    }
    
    return imports;
}

function inferScenario(content: string, fileType: string): string {
    const scenarios: string[] = [];
    const lower = content.toLowerCase();
    
    if (lower.includes('el-table') || lower.includes('el-form')) {
        scenarios.push('表格组件', '表单组件');
    }
    if (lower.includes('$t(') || lower.includes('i18n')) {
        scenarios.push('国际化');
    }
    if (lower.includes('interface ') || lower.includes('type ')) {
        scenarios.push('类型定义');
    }
    
    return scenarios.join('、');
}
