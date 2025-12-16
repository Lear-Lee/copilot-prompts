# Copilot 配置文件 .gitignore 通用指南

> 适用于所有使用 GitHub Copilot 和 MCP 工具的项目

## 🎯 核心原则

**自动生成的 Copilot 配置文件不应提交到版本控制系统**

### 为什么？

1. **避免配置冲突** - 不同开发者有不同的偏好
2. **保持仓库清洁** - 类似 build/、node_modules/
3. **灵活定制** - 每人可以独立调整配置
4. **减少噪音** - 避免无意义的提交和合并冲突

---

## 📋 各语言/框架配置

### JavaScript/TypeScript 项目

#### .gitignore 配置
```gitignore
# Copilot 配置(自动生成)
.github/copilot-instructions.md
.vscode/copilot-*.json
```

#### 推荐文件结构
```
project/
├── .gitignore
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    ├── copilot-instructions.template.md  # ✅ 提交(模板)
    └── README.md                          # ✅ 提交(说明)
```

#### 适用项目
- React、Vue、Angular 应用
- Node.js 后端
- Next.js、Nuxt.js 全栈应用
- TypeScript 库

---

### Python 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
.copilot/

# 也可以添加到已有的 Python .gitignore
```

#### 推荐文件结构
```
project/
├── .gitignore
├── pyproject.toml
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    └── copilot-instructions.template.md  # ✅ 提交
```

#### 适用项目
- Django、Flask Web 应用
- FastAPI 后端
- 数据科学项目
- Python 包开发

---

### Flutter/Dart 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
```

#### 推荐文件结构
```
project/
├── .gitignore
├── pubspec.yaml
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    ├── copilot-instructions.template.md  # ✅ 提交
    └── README.md                          # ✅ 提交
```

#### 适用项目
- Flutter 移动应用
- Flutter Web/Desktop
- Dart 后端服务

**详细指南**: [docs/guides/FLUTTER_GUIDE.md](FLUTTER_GUIDE.md)

---

### Java/Kotlin 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
.idea/copilot*
```

#### 推荐文件结构
```
project/
├── .gitignore
├── build.gradle / pom.xml
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    └── copilot-instructions.template.md  # ✅ 提交
```

#### 适用项目
- Spring Boot 应用
- Android 应用
- Gradle/Maven 项目

---

### Go 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
```

#### 推荐文件结构
```
project/
├── .gitignore
├── go.mod
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    └── copilot-instructions.template.md  # ✅ 提交
```

#### 适用项目
- Go Web 服务
- CLI 工具
- 微服务

---

### Rust 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
```

#### 推荐文件结构
```
project/
├── .gitignore
├── Cargo.toml
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    └── copilot-instructions.template.md  # ✅ 提交
```

#### 适用项目
- Rust 应用程序
- WebAssembly 项目
- 系统工具

---

### C#/.NET 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
.vs/copilot*
```

#### 推荐文件结构
```
project/
├── .gitignore
├── *.csproj
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    └── copilot-instructions.template.md  # ✅ 提交
```

#### 适用项目
- ASP.NET Core 应用
- .NET MAUI 应用
- Unity 游戏

---

### Ruby 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
```

#### 推荐文件结构
```
project/
├── .gitignore
├── Gemfile
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    └── copilot-instructions.template.md  # ✅ 提交
```

#### 适用项目
- Rails 应用
- Sinatra API
- Ruby gems

---

### PHP 项目

#### .gitignore 配置
```gitignore
# Copilot 配置
.github/copilot-instructions.md
```

#### 推荐文件结构
```
project/
├── .gitignore
├── composer.json
└── .github/
    ├── copilot-instructions.md           # ❌ 不提交
    └── copilot-instructions.template.md  # ✅ 提交
```

#### 适用项目
- Laravel 应用
- Symfony 项目
- WordPress 插件

---

## 🚀 通用实施步骤

### 1. 新项目（推荐）

```bash
# 在项目初始化时添加
cd your-project
echo ".github/copilot-instructions.md" >> .gitignore
git add .gitignore
git commit -m "chore: add copilot config to gitignore"
```

### 2. 现有项目（已提交配置）

```bash
# 1. 备份为模板
cp .github/copilot-instructions.md \
   .github/copilot-instructions.template.md

# 2. 从 Git 删除但保留本地
git rm --cached .github/copilot-instructions.md

# 3. 添加到 .gitignore
echo ".github/copilot-instructions.md" >> .gitignore

# 4. 提交更改
git add .gitignore .github/copilot-instructions.template.md
git commit -m "chore: move copilot config to local only"

# 5. 推送到远程（团队需要重新生成配置）
git push
```

### 3. 团队成员配置

```bash
# 方式 A: 复制模板
cp .github/copilot-instructions.template.md \
   .github/copilot-instructions.md

# 方式 B: 使用 MCP 工具生成
# 在 VS Code Copilot Chat 中运行
mcp_copilot-promp_generate_config({ projectPath: "." })
```

---

## 📝 配置模板内容建议

### 最小模板内容

```markdown
# 项目开发规范 - Copilot 指令

## 🎯 核心原则
[你的项目核心开发原则]

## 🛠️ 技术栈
[你的项目技术栈]

## ⚠️ 强制工作流
**在编写代码前，必须调用 MCP 工具加载规范：**
\`\`\`
get_relevant_standards({ fileType: "your-type" })
\`\`\`

## 📐 编码规范
[具体的编码规范]
```

### 完整模板参考

查看各语言的示例：
- **Flutter**: [my_flutter/.github/copilot-instructions.template.md](../../my_flutter/.github/copilot-instructions.template.md)
- **Vue 3**: [VitaSage/.github/copilot-instructions.md](../../VitaSage/.github/copilot-instructions.md)

---

## 🔍 验证配置

### 检查 .gitignore 是否生效

```bash
# 应该输出 .gitignore 的规则
git check-ignore -v .github/copilot-instructions.md
```

### 检查文件状态

```bash
git status
# .github/copilot-instructions.md 不应出现在未跟踪文件中
```

---

## 📚 配置说明文档模板

在 `.github/README.md` 中添加说明：

```markdown
# GitHub Copilot 配置说明

## 📁 文件说明

### copilot-instructions.md
- **状态**: 自动生成，已加入 `.gitignore`
- **用途**: GitHub Copilot 的项目级配置
- **生成方式**: 使用 MCP 工具或复制模板

### copilot-instructions.template.md
- **状态**: 提交到版本控制，供团队参考
- **用途**: 配置模板文件
- **使用方式**: 新成员可以参考此模板

## 🚀 快速开始

1. **复制模板**
   \`\`\`bash
   cp .github/copilot-instructions.template.md \
      .github/copilot-instructions.md
   \`\`\`

2. **根据需要调整配置**

3. **开始开发**

## ❓ 常见问题

### Q: 为什么看不到 copilot-instructions.md?
A: 该文件已加入 `.gitignore`，不会同步。请自行生成。

### Q: 如何更新配置?
A: 直接编辑本地的 `.github/copilot-instructions.md` 文件。
```

---

## 🌟 最佳实践

### DO ✅

- ✅ 将 `copilot-instructions.md` 加入 `.gitignore`
- ✅ 提交 `copilot-instructions.template.md` 作为参考
- ✅ 在 README 中说明配置方法
- ✅ 团队规范更新时更新模板
- ✅ 提供清晰的配置文档

### DON'T ❌

- ❌ 提交个人配置到仓库
- ❌ 强制所有人使用相同配置
- ❌ 忘记添加 .gitignore 规则
- ❌ 不提供配置说明文档
- ❌ 配置文件包含敏感信息

---

## 📖 相关资源

### 项目内文档
- [Flutter 快速指南](FLUTTER_GUIDE.md)
- [配置优化详解](GITIGNORE_OPTIMIZATION.md)
- [快速参考卡片](GITIGNORE_QUICK_REFERENCE.md)

### 外部资源
- [GitHub .gitignore 模板](https://github.com/github/gitignore)
- [Git 忽略文件文档](https://git-scm.com/docs/gitignore)

---

## 💡 常见问题解答

### Q: 所有项目都需要这样做吗？
A: 推荐所有使用 Copilot 和 MCP 工具的团队项目都这样配置。

### Q: 个人项目需要吗？
A: 个人项目可以不用，但建议养成好习惯。

### Q: 如何处理已经提交的配置？
A: 使用 `git rm --cached` 删除追踪，保留本地文件。

### Q: 模板文件需要经常更新吗？
A: 当团队开发规范变更时更新，一般不频繁。

### Q: 能不能用其他方式共享配置？
A: 可以，但模板文件方式最简单且符合 Git 最佳实践。

---

**创建日期**: 2025-12-16  
**维护团队**: MTA团队(蘑菇与吐司的AI团队)  
**版本**: 1.0.0  
**适用范围**: 所有语言和框架
