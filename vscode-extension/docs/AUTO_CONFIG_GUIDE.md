# 自动生成智能配置功能指南

## 🎯 功能概述

**自动生成智能配置**是 Copilot Prompts Manager 的全新功能，可以自动分析项目特征并智能匹配最适合的 Agents，无需手动选择。

## ✨ 核心特性

1. **智能项目分析**
   - 自动检测项目类型（Vue 3、React、Angular 等）
   - 识别使用的工具和库（TypeScript、Vite、Element Plus 等）
   - 扫描文件结构特征（.vue 文件、i18n 目录、stores 目录等）

2. **智能 Agent 匹配**
   - 基于加权评分算法自动选择相关 Agents
   - 评分权重：
     - 框架匹配：10 分
     - 工具匹配：8 分
     - 语言匹配：5 分
     - 关键词匹配：3 分
     - 标签匹配：2 分

3. **一键配置生成**
   - 自动生成 `.github/copilot-instructions.md`
   - 从 GitHub 动态获取 Agent 内容
   - 自动添加到 `.gitignore`

## 🚀 使用方式

### 方式一：侧边栏按钮

1. 打开 Copilot Prompts 侧边栏
2. 点击工具栏上的 ✨ **自动生成智能配置** 按钮
3. 如果有多个工作区，选择目标项目
4. 等待分析和生成完成

### 方式二：资源管理器右键菜单

1. 在 VS Code 资源管理器中找到项目文件夹
2. 右键点击文件夹
3. 选择 **自动生成智能配置 (实验性)**
4. 查看生成结果

### 方式三：命令面板

1. 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
2. 输入 `Copilot Prompts: 自动生成智能配置`
3. 选择目标工作区
4. 等待完成

## 📊 生成结果示例

生成的配置文件结构：

```markdown
<!-- ⚠️ 此文件由 Copilot Prompts Manager 自动生成 -->
<!-- ⚠️ 请勿手动编辑，所有修改将在下次自动生成时被覆盖 -->

# AI 开发指南

> 📌 **自动配置信息**
> - 项目类型: vue3
> - 检测到的框架: Vue 3
> - 检测到的语言: TypeScript
> - 检测到的工具: Vite, Element Plus
> - 匹配的 Agents: 3 个

---

<!-- Source: vue3.agent.md -->
[Agent 内容]

<!-- Source: typescript.agent.md -->
[Agent 内容]

<!-- Source: i18n.agent.md -->
[Agent 内容]
```

## 🔍 项目分析详情

系统会检测以下项目特征：

### 框架检测
- **Vue 3**: package.json 包含 `vue@^3`，存在 `.vue` 文件
- **React**: package.json 包含 `react`，存在 `.tsx/.jsx` 文件
- **Angular**: package.json 包含 `@angular/core`
- **Next.js**: package.json 包含 `next`

### 工具检测
- **Vite**: package.json devDependencies 包含 `vite`
- **Webpack**: package.json 包含 `webpack`
- **TypeScript**: package.json 包含 `typescript`，存在 `.ts` 文件
- **Element Plus**: package.json 包含 `element-plus`
- **LogicFlow**: package.json 包含 `@logicflow/core`

### 特征检测
- **国际化**: 存在 `src/locales/` 或 `src/i18n/` 目录
- **状态管理**: 存在 `src/stores/` 或 `src/store/` 目录
- **VS Code 扩展**: 存在 `package.json` 包含 `vscode` 引擎

## 🎓 Agent 匹配示例

### Vue 3 项目示例

**检测到的特征**:
```json
{
  "frameworks": ["Vue 3"],
  "languages": ["TypeScript"],
  "tools": ["Vite", "Element Plus"],
  "keywords": [],
  "projectType": "vue3"
}
```

**匹配的 Agents** (按评分排序):
1. `vue3.agent.md` - 评分: 25 (框架 10 + 工具 8 + 语言 5 + 标签 2)
2. `typescript.agent.md` - 评分: 15 (语言 5 + 标签 2)
3. `i18n.agent.md` - 评分: 10 (标签 2)

### VS Code 扩展项目示例

**检测到的特征**:
```json
{
  "frameworks": [],
  "languages": ["TypeScript"],
  "tools": ["VS Code Extension API"],
  "keywords": ["vscode", "extension"],
  "projectType": "vscode-extension"
}
```

**匹配的 Agents**:
1. `vscode-extension-dev.agent.md` - 评分: 28
2. `typescript.agent.md` - 评分: 15

## ⚙️ 配置选项

### 离线模式

如果无法连接到 GitHub，系统会自动使用内置的后备 Agents：
- `typescript.agent.md` (TypeScript 项目)
- `vue3.agent.md` (Vue 3 项目)

### 自定义评分权重

如需自定义评分算法，可以修改 `smartAgentMatcher.ts` 中的权重配置：

```typescript
// 当前默认权重
const WEIGHTS = {
  framework: 10,    // 框架匹配
  tool: 8,         // 工具匹配
  language: 5,     // 语言匹配
  keyword: 3,      // 关键词匹配
  tag: 2          // 标签匹配
};
```

## 🐛 故障排查

### 问题：未检测到任何特征

**原因**: 项目缺少 `package.json` 或文件结构不典型

**解决**:
1. 确保项目根目录有 `package.json`
2. 运行 `npm install` 安装依赖
3. 手动添加依赖到 `package.json`

### 问题：匹配到不相关的 Agents

**原因**: 项目有多种技术栈混合使用

**解决**:
1. 生成后手动编辑 `.github/copilot-instructions.md`
2. 删除不需要的 Agent 部分
3. 或使用传统的手动选择方式

### 问题：生成的配置文件损坏

**原因**: GitHub API 请求失败或网络问题

**解决**:
1. 检查网络连接
2. 重新运行自动生成命令
3. 查看输出通道的错误日志

## 📝 注意事项

1. **实验性功能**: 此功能仍在实验阶段，可能不适用于所有项目类型
2. **自动覆盖**: 重新运行命令会覆盖现有的 `.github/copilot-instructions.md`
3. **Git 忽略**: 生成的文件会自动添加到 `.gitignore`
4. **定期更新**: Agent 内容从 GitHub 动态获取，建议定期重新生成以获取最新版本

## 🔮 未来计划

- [ ] 支持更多项目类型（Python、Java、Go 等）
- [ ] 自定义匹配规则配置
- [ ] 增量更新（仅更新 Agent 内容，保留自定义部分）
- [ ] 项目配置预览和调整界面
- [ ] 支持私有 GitHub 仓库作为 Agent 源

## 💡 提示

- 首次使用建议先在测试项目上试验
- 如果对结果不满意，可以随时切换回手动选择模式
- 生成的配置文件可以手动编辑，但再次自动生成时会被覆盖
- 建议配合版本控制使用，方便回退

---

**反馈和建议**: 如有问题或建议，请在 GitHub 仓库提交 Issue
