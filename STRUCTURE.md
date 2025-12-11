# 项目结构说明

## 目录组织

```
copilot-prompts/                   # 根目录（GitHub 仓库）
├── agents/                        # Custom Agents 配置文件
│   ├── i18n.agent.md             # 国际化专用 Agent
│   ├── typescript.agent.md       # TypeScript 严格模式 Agent
│   ├── vitasage.agent.md         # VitaSage 专用 Agent
│   ├── vue3.agent.md             # Vue 3 通用 Agent
│   └── vscode-extension-dev.agent.md  # VS Code 扩展开发 Agent
│
├── common/                        # 通用开发规范
│   ├── i18n.md                   # 国际化最佳实践
│   └── typescript-strict.md      # TypeScript 严格模式指南
│
├── vue/                           # Vue 框架相关配置
│   └── vue3-typescript.md        # Vue 3 + TypeScript 项目配置
│
├── industry/                      # 行业专用配置
│   └── vitasage-recipe.md        # VitaSage 工业配方系统配置
│
├── vscode-extension/              # VS Code 扩展插件
│   ├── src/                      # 源代码
│   │   ├── extension.ts          # 扩展入口
│   │   ├── configManager.ts      # 配置管理器
│   │   ├── githubClient.ts       # GitHub API 客户端
│   │   ├── configValidator.ts    # 配置验证器
│   │   └── promptsProvider.ts    # TreeView 数据提供者
│   ├── out/                      # 编译输出（.gitignore）
│   ├── node_modules/             # 依赖包（.gitignore）
│   ├── scripts/                  # 构建脚本
│   │   └── build.sh              # 一键构建和安装
│   ├── docs/                     # 文档目录
│   │   ├── changelog/            # 各版本变更日志
│   │   ├── guides/               # 使用指南
│   │   ├── releases/             # 发布说明
│   │   ├── summaries/            # 功能总结
│   │   ├── tests/                # 测试记录
│   │   └── archives/             # 废弃文档归档
│   ├── package.json              # 扩展配置
│   ├── CHANGELOG.md              # 统一变更日志
│   └── README.md                 # 扩展说明
│
├── tools/                         # 辅助工具
│   └── agent-manager.html        # Web 可视化管理器（已废弃，使用扩展代替）
│
├── docs/                          # 项目文档
│   ├── DEPLOYMENT_SUMMARY.md     # 部署总结
│   └── SETUP_COMPLETE.md         # 安装完成指南
│
├── .github/                       # GitHub 配置
│   └── copilot-instructions.md   # 本项目自身的开发指南
│
├── AGENTS_GUIDE.md                # Agents 使用指南
├── BEST_PRACTICES.md              # 最佳实践文档
├── MANAGER_GUIDE.md               # 配置管理器使用指南
├── README.md                      # 主 README
└── .gitignore                     # Git 忽略规则
```

## 目录职责

### 配置源文件目录（GitHub 仓库核心）

- **agents/**: Custom Agents 源文件，由插件动态获取并复制到项目 `.github/agents/`
- **common/**: 通用开发规范，可作为 `copilot-instructions.md` 使用
- **vue/**: Vue 框架相关配置
- **industry/**: 行业特定配置

**说明**: 这些目录是 GitHub 仓库的核心内容，插件从这里获取配置文件。

### VS Code 扩展插件

- **vscode-extension/**: 完整的 VS Code 扩展项目
  - 编译、打包、安装为 `.vsix` 文件
  - 运行时从 GitHub 动态获取配置（从上述配置源目录）
  - 支持多工作区、配置验证、一键应用等功能

### 文档和工具

- **docs/**: 项目级文档
- **tools/**: 辅助工具（agent-manager.html 已被扩展取代）
- **AGENTS_GUIDE.md, BEST_PRACTICES.md, MANAGER_GUIDE.md**: 顶级指南文档

## 工作流程

### 开发模式（本地调试）

1. 修改配置文件（agents/, common/, vue/, industry/）
2. 扩展检测到本地仓库路径（`/Users/pailasi/Work/copilot-prompts`）
3. 优先从本地读取，GitHub 作为 fallback

### 生产模式（发布后）

1. 用户安装扩展
2. 扩展自动从 GitHub (`ForLear/copilot-prompts`) 获取最新配置
3. 应用到用户项目的 `.github/` 目录

### 配置应用路径

用户项目：
```
your-project/
└── .github/
    ├── copilot-instructions.md   # 主配置（自动应用到所有对话）
    └── agents/                    # Custom Agents（按需调用）
        ├── vue3.agent.md
        ├── typescript.agent.md
        └── ...
```

## .gitignore 策略

### 项目级忽略
```
.DS_Store                  # macOS 系统文件
.vscode/, .idea/           # 编辑器配置
```

### 扩展级忽略
```
vscode-extension/node_modules/   # 依赖包
vscode-extension/out/             # 编译输出
vscode-extension/*.vsix           # 打包文件
```

## 清理记录

### v1.3.0 清理（2025-12-11）

**vscode-extension/ 清理**:
- 删除根目录冗余文档（6个）
- 删除旧版本 VSIX (v1.2.0)
- 归档废弃脚本到 docs/archives/
- 创建统一 CHANGELOG.md
- 创建 scripts/build.sh

**根目录清理**:
- 删除废弃脚本：apply-global.sh, sync-agents.sh
- 删除临时文件：QUICK_REFERENCE.txt
- 整理工具：agent-manager.html → tools/
- 整理文档：DEPLOYMENT_SUMMARY.md, SETUP_COMPLETE.md → docs/

**保留配置源**:
- agents/, common/, vue/, industry/ 目录保持不变
- 这些是 GitHub 仓库的核心内容，供扩展动态获取

---

最后更新: 2025-12-11
版本: v1.3.0 Open Source Edition
