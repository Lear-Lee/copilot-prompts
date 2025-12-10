# GitHub Copilot Instructions 最佳实践

## 🎯 推荐方案对比

### ✅ 推荐：Git Submodule + 符号链接

**适用场景**: 团队协作、多项目共享规范

**优点**:
- ✅ 版本化管理，可回溯历史
- ✅ 团队成员自动同步规范更新
- ✅ 统一的代码审查标准
- ✅ 支持分支管理（dev/prod 不同规范）

**实施步骤**:

```bash
# 1. 在项目中添加 prompts 子模块
cd your-project
git submodule add https://github.com/ForLear/copilot-prompts.git .github/prompts

# 2. 链接到具体的 prompt 文件
ln -s prompts/vue/vue3-typescript.md .github/copilot-instructions.md

# 3. 提交
git add .github/prompts .github/copilot-instructions.md
git commit -m "Add Copilot prompts submodule"
git push

# 4. 团队成员克隆后初始化
git clone <project-repo>
git submodule update --init --recursive
```

**日常更新**:

```bash
# 更新到最新 prompts
cd .github/prompts
git pull origin main
cd ../..
git add .github/prompts
git commit -m "Update Copilot prompts"
```

---

### ✅ 推荐：本地符号链接

**适用场景**: 个人开发、本地多项目

**优点**:
- ✅ 修改立即生效，无需提交
- ✅ 多项目共享一份配置
- ✅ 便于快速迭代和测试

**实施步骤**:

```bash
# 1. 克隆 prompts 仓库到固定位置
cd ~/Projects  # 或其他固定路径
git clone https://github.com/ForLear/copilot-prompts.git

# 2. 在项目中创建符号链接
cd your-project
ln -s ~/Projects/copilot-prompts .github/prompts
ln -s prompts/vue/vue3-typescript.md .github/copilot-instructions.md

# 3. 添加到 .gitignore（团队可能有不同路径）
echo ".github/prompts" >> .gitignore
echo ".github/copilot-instructions.md" >> .gitignore
```

**日常更新**:

```bash
# 更新 prompts
cd ~/Projects/copilot-prompts
git pull origin main
# 所有项目立即生效！
```

---

### ⚠️ 不推荐：直接复制文件

**问题**:
- ❌ 每个项目独立维护，容易不一致
- ❌ 更新需要手动同步所有项目
- ❌ 无法追踪规范变更历史

**仅适用于**: 一次性项目、快速原型

---

## 🔄 VitaSage 项目的实践

当前 VitaSage 使用的是 **本地符号链接** 方案：

```
VitaSage/
└── .github/
    ├── prompts/                          → ../../copilot-prompts
    └── copilot-instructions.md           → prompts/industry/vitasage-recipe.md
```

**快速切换规范**:

```bash
# 使用项目脚本
./switch-prompt.sh vue3        # 通用 Vue 3
./switch-prompt.sh vitasage    # VitaSage 专用
./switch-prompt.sh typescript  # TypeScript 严格
./switch-prompt.sh i18n        # 国际化
```

---

## 📝 Prompt 文件编写规范

### 结构要求

每个 prompt 文件应包含：

1. **项目定位** (1-2 句) - 技术栈和应用场景
2. **核心原则** (3-5 条) - 最重要的开发准则
3. **关键架构模式** - 项目特有的模式和约定
4. **禁止模式** - 明确不允许的代码
5. **代码审查清单** - 可执行的检查项
6. **参考示例** - 指向实际代码文件

### 长度建议

- **通用规范**: 100-200 行
- **项目专用**: 150-300 行
- **领域规范**: 80-150 行

### 示例对比

```markdown
# ❌ 过于简单（无效）
使用 Vue 3 Composition API

# ✅ 具体可执行
**必须使用 Composition API** (`<script setup lang="ts">`)
```typescript
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@api'

// 国际化 (必须)
const { appContext } = getCurrentInstance()!
const $t = appContext.config.globalProperties.$t
\```
```

---

## 🔧 MCP 配置说明

### 为什么移除了 MCP prompts 配置？

GitHub 的 MCP 服务器主要用于：
- 访问 GitHub API (repos, issues, PRs)
- 代码搜索
- 仓库管理

**Copilot Instructions 文件** 通过不同机制加载：
- 直接读取 `.github/copilot-instructions.md`
- 无需在 MCP 中配置

### 当前 MCP 配置的作用

您的 `mcp.json` 中的 GitHub MCP 服务器用于：

```jsonc
{
  "io.github.github/github-mcp-server": {
    "type": "http",
    "url": "https://api.githubcopilot.com/mcp/",
    // 这是用于 GitHub API 访问，不是 prompts
  }
}
```

**用途**:
- 使用 `@github` 工具
- 搜索代码、创建 PR、管理 Issues
- 与 Copilot Instructions 是独立的功能

---

## 📚 相关资源

- [GitHub Copilot Instructions 官方文档](https://docs.github.com/en/copilot/customizing-copilot/adding-custom-instructions-for-github-copilot)
- [VS Code MCP 指南](https://code.visualstudio.com/docs/copilot/model-context-protocol)
- [Git Submodules 文档](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
