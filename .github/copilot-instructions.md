<!-- ⚠️ 此文件由开发者手动维护 -->
<!-- ⚠️ copilot-prompts 项目自身的开发指南 -->

# Copilot Prompts Manager - VS Code Extension 开发指南

> 📌 **项目定位**
> - VS Code 扩展开发
> - TypeScript 严格模式
> - 多工作区支持
> - TreeView + 命令系统

---

<details>
<summary>📦 配置内容 (已折叠隐藏，由 AI 自动使用，无需查看)</summary>

<!-- region Copilot Prompts Configuration -->

---

<!-- Source: agents/vscode-extension-dev.agent.md -->

---
description: 'VS Code Extension 开发专用代理 - TypeScript + 多工作区 + 用户体验优化'
tools: ['edit', 'search', 'usages', 'vscodeAPI', 'problems', 'runSubagent', 'runCommands', 'runTasks']
---

# VS Code Extension 开发代理

**适用场景**: VS Code 插件开发、多工作区支持、TreeView UI、命令注册

## 🎯 核心原则

1. **多工作区优先** - 所有功能必须支持多个工作区文件夹
2. **TypeScript 严格模式** - 完整类型定义，零 any
3. **错误处理完备** - try-catch-finally，用户友好的错误提示
4. **静默式 UX** - 减少弹窗，使用状态栏和内联 UI
5. **参数传递精准** - 避免全局状态，显式传递上下文

## 📐 架构模式

### 多工作区支持的核心模式

```typescript
// ✅ 好 - 明确指定目标工作区
async function operateOnWorkspace(targetFolder: vscode.WorkspaceFolder) {
  const configPath = path.join(targetFolder.uri.fsPath, '.github/config.md');
  // 操作特定工作区
}

// ❌ 坏 - 隐式使用第一个工作区
async function operateOnWorkspace() {
  const folder = vscode.workspace.workspaceFolders?.[0];
  // 可能操作错误的工作区
}
```

### 命令注册与参数传递

```typescript
// ✅ 好 - 通过参数传递上下文
context.subscriptions.push(
  vscode.commands.registerCommand('extension.doSomething', async (item: TreeItem) => {
    try {
      // item 包含完整的上下文信息
      await service.operate(item.workspaceFolder);
      vscode.window.showInformationMessage(`✅ 操作成功: ${item.label}`);
    } catch (error) {
      vscode.window.showErrorMessage(`❌ 操作失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  })
);

// ❌ 坏 - 从全局状态读取
let currentItem: TreeItem | undefined;
context.subscriptions.push(
  vscode.commands.registerCommand('extension.doSomething', async () => {
    if (currentItem) {
      await service.operate(currentItem);
    }
  })
);
```

### TreeView 与用户交互

```typescript
// ✅ 好 - TreeItem 包含完整上下文
class MyTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly workspaceFolder: vscode.WorkspaceFolder, // 关联工作区
    public readonly resourceUri: vscode.Uri,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.contextValue = 'myItem';
    this.resourceUri = resourceUri;
  }
}

// 命令可直接使用 TreeItem 的属性
vscode.commands.registerCommand('extension.itemAction', (item: MyTreeItem) => {
  console.log(`操作工作区: ${item.workspaceFolder.name}`);
  console.log(`资源路径: ${item.resourceUri.fsPath}`);
});
```

### 静默式用户体验

```typescript
// ✅ 好 - 使用状态栏 + 内联 UI
class StatusManager {
  private statusBarItem: vscode.StatusBarItem;
  
  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'extension.showDetails';
  }
  
  updateStatus(count: number) {
    this.statusBarItem.text = `$(check) ${count}`;
    this.statusBarItem.tooltip = `已配置 ${count} 个项目`;
    this.statusBarItem.show();
  }
}

// 使用 QuickPick 代替弹窗
const showResults = async (results: ValidationResult[]) => {
  const items = results.map(r => ({
    label: `$(warning) ${r.message}`,
    description: r.workspace.name,
    buttons: [{ iconPath: new vscode.ThemeIcon('gear'), tooltip: '立即修复' }]
  }));
  
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: '选择问题进行修复',
    canPickMany: false
  });
};

// ❌ 坏 - 频繁弹窗
vscode.window.showInformationMessage('配置已更新');
vscode.window.showInformationMessage('验证完成');
vscode.window.showInformationMessage('状态已刷新');
```

## ⚠️ 常见陷阱

### 1. 工作区混淆问题

```typescript
// ❌ 坏 - 验证发现问题在 projectB，但修复应用到 projectA
class Validator {
  async validate() {
    for (const folder of vscode.workspace.workspaceFolders!) {
      if (hasProblem(folder)) {
        // 只记录了问题，没保存 folder 引用
        problems.push({ message: `${folder.name} 有问题` });
      }
    }
  }
  
  async fix() {
    // 修复时无法知道是哪个 folder
    await fixFirstWorkspace(); // ❌ 错误！
  }
}

// ✅ 好 - 保持工作区引用
interface Problem {
  message: string;
  workspace: vscode.WorkspaceFolder; // 保存引用
}

class Validator {
  async validate(): Promise<Problem[]> {
    const problems: Problem[] = [];
    for (const folder of vscode.workspace.workspaceFolders!) {
      if (hasProblem(folder)) {
        problems.push({ 
          message: `${folder.name} 有问题`,
          workspace: folder // ✅ 保存引用
        });
      }
    }
    return problems;
  }
  
  async fix(problem: Problem) {
    // 修复正确的工作区
    await fixWorkspace(problem.workspace); // ✅ 正确
  }
}
```

### 2. 异步操作与状态管理

```typescript
// ❌ 坏 - 异常后状态泄漏
async function doSomething() {
  loading = true;
  await dangerousOperation(); // 可能抛异常
  loading = false; // 永远不会执行
}

// ✅ 好 - finally 保证清理
async function doSomething() {
  try {
    loading = true;
    await dangerousOperation();
  } catch (error) {
    vscode.window.showErrorMessage(`操作失败: ${error}`);
  } finally {
    loading = false; // ✅ 总是执行
  }
}
```

### 3. 文件操作与目录创建

```typescript
// ❌ 坏 - 目录和文件分步创建，中间可能失败
async function createConfig(folder: vscode.WorkspaceFolder) {
  const dir = path.join(folder.uri.fsPath, '.github');
  fs.mkdirSync(dir, { recursive: true }); // 成功
  // 这里抛异常，目录已创建但文件未写入
  const content = await fetchContent(); // ❌ 可能失败
  fs.writeFileSync(path.join(dir, 'config.md'), content);
}

// ✅ 好 - 先准备内容，再一次性写入
async function createConfig(folder: vscode.WorkspaceFolder) {
  try {
    // 先获取所有需要的数据
    const content = await fetchContent();
    
    // 再操作文件系统
    const dir = path.join(folder.uri.fsPath, '.github');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'config.md'), content);
    
  } catch (error) {
    // 清理失败的操作
    throw new Error(`创建配置失败: ${error}`);
  }
}
```

## 📋 代码审查清单

- [ ] 所有涉及工作区的操作都显式传递 `WorkspaceFolder` 参数
- [ ] TreeItem 包含必要的上下文信息（workspace、resourceUri）
- [ ] 命令通过参数接收上下文，不依赖全局状态
- [ ] 异步操作有 try-catch-finally
- [ ] 文件操作前检查目录存在性
- [ ] 错误信息明确指出是哪个工作区
- [ ] 减少弹窗，优先使用状态栏、QuickPick、TreeView
- [ ] 所有用户可见文本有清晰的成功/失败标识（✅/❌）

## 🔧 实用工具模式

### 工作区查找

```typescript
// 查找包含特定文件的工作区
function findWorkspaceByFile(fileName: string): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.workspaceFolders?.find(folder => 
    fs.existsSync(path.join(folder.uri.fsPath, fileName))
  );
}

// 查找当前活动编辑器所在的工作区
function getActiveWorkspace(): vscode.WorkspaceFolder | undefined {
  const activeEditor = vscode.window.activeTextEditor;
  if (!activeEditor) return undefined;
  
  return vscode.workspace.getWorkspaceFolder(activeEditor.document.uri);
}
```

### 配置文件管理

```typescript
// 确保 .gitignore 包含指定文件
function ensureGitIgnore(workspacePath: string, fileToIgnore: string): void {
  const gitignorePath = path.join(workspacePath, '.gitignore');
  
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  
  const lines = content.split('\n');
  const alreadyIgnored = lines.some(line => 
    line.trim() === fileToIgnore || line.trim() === `/${fileToIgnore}`
  );
  
  if (!alreadyIgnored) {
    const newContent = content.trim() + '\n\n# Auto-generated files\n' + fileToIgnore + '\n';
    fs.writeFileSync(gitignorePath, newContent, 'utf-8');
  }
}
```

### 备份策略

```typescript
// 覆盖前创建带时间戳的备份
function safeWriteFile(filePath: string, content: string): void {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
  }
  fs.writeFileSync(filePath, content, 'utf-8');
}
```

## 🚀 性能优化

```typescript
// 批量操作使用 Promise.all
const results = await Promise.all(
  workspaceFolders.map(folder => validateWorkspace(folder))
);

// 大数据集使用 lazy loading
class LazyTreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  getChildren(element?: TreeItem): vscode.ProviderResult<TreeItem[]> {
    if (!element) {
      // 只返回顶层项
      return this.getRootItems();
    }
    // 展开时才加载子项
    return this.getChildItems(element);
  }
}
```

## 📚 VS Code API 关键点

### 状态持久化

```typescript
// 使用 workspace state 存储工作区级配置
context.workspaceState.update('selectedItems', ['item1', 'item2']);
const selected = context.workspaceState.get<string[]>('selectedItems', []);

// 使用 global state 存储用户级配置
context.globalState.update('lastUsed', Date.now());
```

### 配置读写

```typescript
// 读取用户配置
const config = vscode.workspace.getConfiguration('myExtension');
const value = config.get<string>('someOption', 'default');

// 写入用户配置
await config.update('someOption', 'newValue', vscode.ConfigurationTarget.Global);
```

### 输出通道

```typescript
const outputChannel = vscode.window.createOutputChannel('My Extension');
outputChannel.appendLine('Debug info');
outputChannel.show(); // 显示输出面板
```

## 完整规范

**参考规范**: 
- TypeScript 严格模式: `/common/typescript-strict.md`
- 错误处理模式: 本文档错误处理章节
- 用户体验设计: 本文档静默式 UX 章节

**实战案例**:
- Copilot Prompts Manager 插件源码
- ConfigValidator 的 checkMissingConfigs 方法
- ConfigManager 的 applyConfigToWorkspace 方法

---

<!-- Source: common/typescript-strict.md -->

# TypeScript 严格模式指南

适用于所有需要高质量类型安全的 TypeScript 项目

## 🎯 核心原则

1. **零 any**: 绝不使用 `any` 类型，使用 `unknown` 或具体类型
2. **严格空检查**: 启用 `strictNullChecks`，明确处理 `null`/`undefined`
3. **完整类型定义**: 所有函数参数、返回值、变量都有明确类型
4. **类型推断优先**: 让 TypeScript 推断简单类型，复杂类型显式声明

## 📝 tsconfig.json 配置

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

## ✅ 最佳实践

### 类型定义
```typescript
// ✅ 好
interface User {
  id: number
  name: string
  email?: string  // 可选属性
}

function getUser(id: number): Promise<User | null> {
  // ...
}

// ❌ 坏
function getUser(id: any): any {
  // ...
}
```

### 空值处理
```typescript
// ✅ 好
const user: User | null = await getUser(1)
if (user) {
  console.log(user.name)
}

// 或使用可选链
console.log(user?.name)

// ❌ 坏
const user = await getUser(1)
console.log(user.name)  // 可能报错
```

### 联合类型
```typescript
// ✅ 好
type Status = 'pending' | 'success' | 'error'

function handleStatus(status: Status) {
  switch (status) {
    case 'pending': return 'Loading...'
    case 'success': return 'Done!'
    case 'error': return 'Failed!'
  }
}

// ❌ 坏
function handleStatus(status: string) {
  // 失去类型约束
}
```

### 泛型使用
```typescript
// ✅ 好
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json())
}

interface Product {
  id: number
  name: string
}

const products = await fetchData<Product[]>('/api/products')

// ❌ 坏
function fetchData(url: string): Promise<any> {
  return fetch(url).then(res => res.json())
}
```

## ⚠️ 禁止模式

- ❌ `any` 类型
- ❌ 类型断言 `as any`
- ❌ `@ts-ignore` / `@ts-nocheck`
- ❌ 隐式 any (`noImplicitAny: false`)
- ❌ 非空断言 `!` (除非确定安全)

## 📋 代码审查清单

- [ ] 所有函数有明确的参数类型和返回值类型
- [ ] 没有使用 `any` 类型
- [ ] 正确处理可能为 `null`/`undefined` 的值
- [ ] 使用联合类型而非宽泛的 `string`/`number`
- [ ] 复杂对象有接口定义
- [ ] 泛型使用恰当

## 🔧 常见场景

### API 响应处理
```typescript
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

async function callApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(endpoint)
    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

### 类型守卫
```typescript
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj
  )
}

const data: unknown = await fetchData()
if (isUser(data)) {
  console.log(data.name)  // TypeScript 知道 data 是 User
}
```

<!-- endregion -->

</details>

---

## 📋 应用的配置摘要

已应用 2 个配置项，详细内容已折叠隐藏。

- **VS Code Extension Dev Agent** (agents/vscode-extension-dev.agent.md)
  - VS Code Extension 开发专用代理 - TypeScript + 多工作区 + 用户体验优化
  - 标签: vscode-extension, typescript, multi-workspace, ux
- **TypeScript Strict** (common/typescript-strict.md)
  - TypeScript 严格模式指南
  - 标签: typescript, type-safety

生成时间: 2025年12月11日 14:30:00
配置来源: 手动维护
