# ✅ Copilot Prompts 仓库配置完成

## 📦 已创建的内容

### 1. 本地仓库结构
```
/Users/pailasi/Work/copilot-prompts/
├── README.md                    # 使用指南
├── .gitignore                   # Git 忽略文件
├── vue/
│   └── vue3-typescript.md      # Vue 3 + TypeScript 规范
├── common/
│   ├── typescript-strict.md    # TypeScript 严格模式
│   └── i18n.md                 # 国际化最佳实践
└── industry/
    └── vitasage-recipe.md      # VitaSage 专用规范
```

### 2. VitaSage 项目集成
- ✅ 创建符号链接: `.github/prompts` → `copilot-prompts`
- ✅ 设置默认 prompt: `copilot-instructions.md` → VitaSage 专用规范
- ✅ 添加切换脚本: `switch-prompt.sh`
- ✅ 创建使用指南: `.github/PROMPTS_GUIDE.md`

## 🚀 下一步操作

### 1. 推送到 GitHub (必须)

前往 https://github.com/new 创建私有仓库:
- Repository name: `copilot-prompts`
- Privacy: ✅ Private
- ❌ 不勾选 "Add a README file"

然后执行:
```bash
cd /Users/pailasi/Work/copilot-prompts
git remote add origin https://github.com/ForLear/copilot-prompts.git
git push -u origin main
```

### 2. 在其他项目中使用

#### 方法 A: 符号链接 (本地开发)
```bash
cd /path/to/your-project
ln -s /Users/pailasi/Work/copilot-prompts .github/prompts
ln -s prompts/vue/vue3-typescript.md .github/copilot-instructions.md
```

#### 方法 B: Git Submodule (推荐用于团队)
```bash
cd /path/to/your-project
git submodule add https://github.com/ForLear/copilot-prompts.git .github/prompts
ln -s prompts/vue/vue3-typescript.md .github/copilot-instructions.md
```

### 3. 验证配置

在 VS Code 中:
1. 打开 Copilot Chat (`Cmd+Shift+I`)
2. 输入: `@workspace 当前项目的开发规范是什么?`
3. Copilot 应该会引用 prompt 文件中的内容

## 📝 日常使用

### 在 VitaSage 项目中切换 prompt
```bash
cd /Users/pailasi/Work/VitaSage

# 查看可用 prompts
./switch-prompt.sh

# 切换到不同的规范
./switch-prompt.sh vue3        # 通用 Vue 3 规范
./switch-prompt.sh typescript  # TypeScript 严格模式
./switch-prompt.sh i18n        # 国际化规范
./switch-prompt.sh vitasage    # VitaSage 专用规范（默认）
```

### 更新 prompts
```bash
cd /Users/pailasi/Work/copilot-prompts
# 编辑 .md 文件
git add .
git commit -m "Update prompts"
git push

# 在使用项目中更新
cd /Users/pailasi/Work/VitaSage/.github/prompts
git pull
```

## 🎯 最佳实践建议

1. **项目初期**: 使用通用规范快速上手
   ```bash
   ./switch-prompt.sh vue3
   ```

2. **项目成熟**: 使用专用规范保持一致性
   ```bash
   ./switch-prompt.sh vitasage
   ```

3. **特定功能开发**: 临时切换到领域规范
   ```bash
   ./switch-prompt.sh i18n  # 开发国际化功能时
   ```

4. **Code Review**: 确保使用项目专用规范
   ```bash
   ./switch-prompt.sh vitasage
   ```

## 📚 文档位置

- 主 README: `/Users/pailasi/Work/copilot-prompts/README.md`
- VitaSage 使用指南: `/Users/pailasi/Work/VitaSage/.github/PROMPTS_GUIDE.md`
- 本文档: `/Users/pailasi/Work/copilot-prompts/SETUP_COMPLETE.md`

## ✨ 已完成功能

- [x] 创建中央 prompts 仓库
- [x] 编写 4 个不同类型的 prompt 文件
- [x] VitaSage 项目集成
- [x] 创建 prompt 切换脚本
- [x] 编写完整的使用文档
- [ ] 推送到 GitHub（待您完成）

---

**下一步**: 请在 GitHub 创建私有仓库并推送代码！
