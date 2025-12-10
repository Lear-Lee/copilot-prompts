# 📦 v1.3.0 打包发布测试指南

## ✅ 打包成功

插件已成功打包为: `copilot-prompts-manager-1.3.0.vsix`

**文件位置**: `d:\Work\RN\copilot-prompts\vscode-extension\copilot-prompts-manager-1.3.0.vsix`

**文件大小**: 75.23 KB (24 个文件)

---

## 📋 打包内容

```
copilot-prompts-manager-1.3.0.vsix
├─ 核心代码 (out/)
│  ├─ configManager.js [11.62 KB]
│  ├─ configValidator.js [39.23 KB] ← 新增强
│  ├─ extension.js [14.07 KB]
│  └─ promptsProvider.js [4.25 KB]
│
├─ 文档
│  ├─ CHANGELOG-v1.3.0.md [8.13 KB] ← 新增
│  ├─ DEMO_v1.3.0.md [6.03 KB] ← 新增
│  ├─ OPTIMIZATION_SUMMARY.md [11.38 KB] ← 新增
│  ├─ QUICK_TEST.md [3.49 KB] ← 新增
│  ├─ RELEASE_v1.3.0.md [6.98 KB] ← 新增
│  ├─ TEST_v1.3.0.md [9.27 KB] ← 新增
│  ├─ README.md [7.96 KB]
│  └─ LICENSE [1.06 KB] ← 新增
│
└─ 资源 (media/)
   ├─ icon.png [17.49 KB]
   └─ icon.svg [0.68 KB]
```

---

## 🚀 安装测试方法

### 方法 1: VS Code 界面安装（推荐）

1. **打开 VS Code**
2. **打开扩展视图** (`Ctrl+Shift+X`)
3. **点击右上角的 `...` 菜单**
4. **选择 "从 VSIX 安装..."**
5. **选择文件**: `d:\Work\RN\copilot-prompts\vscode-extension\copilot-prompts-manager-1.3.0.vsix`
6. **点击 "安装"**
7. **重新加载窗口** (如提示)

### 方法 2: 命令行安装

如果 `code` 命令已添加到 PATH：

```powershell
# 进入插件目录
cd "d:\Work\RN\copilot-prompts\vscode-extension"

# 安装插件
code --install-extension copilot-prompts-manager-1.3.0.vsix
```

如果 `code` 命令不可用，使用完整路径：

```powershell
# Windows 默认路径
& "C:\Users\你的用户名\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd" --install-extension copilot-prompts-manager-1.3.0.vsix
```

### 方法 3: 手动复制

```powershell
# 复制到 VSCode 扩展目录
Copy-Item "copilot-prompts-manager-1.3.0.vsix" -Destination "$env:USERPROFILE\.vscode\extensions\"

# 然后在 VS Code 中安装
```

---

## 🧪 安装后验证

### 1. 检查插件状态

**打开扩展视图**:
- 按 `Ctrl+Shift+X`
- 搜索 "Copilot Prompts Manager"
- 确认版本号为 **1.3.0**
- 确认状态为 "已启用"

### 2. 检查侧边栏图标

**查看活动栏**:
- 应该看到 Copilot Prompts 图标
- 点击图标打开侧边栏
- 确认可以看到 Agents 和 Prompts 列表

### 3. 测试新功能

**运行配置检查**:
```
1. 按 Ctrl+Shift+P
2. 输入 "检查配置"
3. 选择 "Copilot Prompts: 检查配置问题"
4. 查看检查结果
```

**预期效果**:
- ✅ 显示问题统计
- ✅ 问题按类别分组
- ✅ 每个问题显示解决方案数量
- ✅ 可以选择解决方案
- ✅ 支持批量修复
- ✅ 支持导出报告

---

## 🔍 快速功能测试

### 测试 1: 基础检查（1 分钟）

```powershell
# 创建测试文件
cd "d:\Work\RN\copilot-prompts\agents"
echo "# Test Agent" > test-install.md
```

运行检查命令，应该检测到：
- ⚠️ 文件命名不规范（应为 .agent.md）

### 测试 2: 解决方案测试（1 分钟）

选择检测到的问题，应该看到：
- 解决方案 1: 重命名为 Agent 格式
- 解决方案 2: 移动到 prompts 目录

选择方案 1，验证文件被重命名为 `test-install.agent.md`

### 测试 3: 批量修复测试（1 分钟）

```powershell
# 创建多个测试文件
echo "# Another Test" > "d:\Work\RN\copilot-prompts\agents\test2.agent.md"
```

运行检查，选择"批量修复所有问题"，验证：
- ✅ frontmatter 被自动添加
- ✅ 显示修复统计

### 清理测试文件

```powershell
cd "d:\Work\RN\copilot-prompts\agents"
rm test-install.agent.md -ErrorAction SilentlyContinue
rm test2.agent.md -ErrorAction SilentlyContinue
```

---

## 📊 测试结果记录

```
安装时间: ________
安装方法: [ ] 界面安装  [ ] 命令行  [ ] 手动复制
安装结果: [ ] 成功  [ ] 失败

功能测试:
[ ] 插件正常激活
[ ] 侧边栏图标显示
[ ] 配置检查命令可用
[ ] 问题分类显示正确
[ ] 解决方案列表正常
[ ] 批量修复功能正常
[ ] 导出报告功能正常

性能测试:
[ ] 检查速度 < 5 秒
[ ] UI 无卡顿
[ ] 内存占用正常

发现的问题:
1. 
2. 
3. 

总体评价: ________
```

---

## 🐛 常见问题

### Q: 安装时提示"已安装旧版本"
A: 先卸载旧版本，再安装新版本

### Q: 插件未激活
A: 重新加载窗口 (`Ctrl+R`)

### Q: 找不到新功能
A: 确认版本号是否为 1.3.0

### Q: 检查命令不显示
A: 检查控制台错误 (`Ctrl+Shift+I`)

---

## 📚 完整测试

安装成功后，参考以下文档进行完整测试：

- **快速验证**: [QUICK_TEST.md](./QUICK_TEST.md) - 5 分钟核心功能测试
- **完整测试**: [TEST_v1.3.0.md](./TEST_v1.3.0.md) - 19 项详细测试
- **功能演示**: [DEMO_v1.3.0.md](./DEMO_v1.3.0.md) - 7 个演示场景
- **更新日志**: [CHANGELOG-v1.3.0.md](./CHANGELOG-v1.3.0.md) - 详细功能说明

---

## 🎉 发布流程

测试通过后，可以发布到市场：

```powershell
# 登录 VS Code Marketplace
vsce login forlear

# 发布新版本
vsce publish

# 或发布到本地/团队内部
# 直接分享 copilot-prompts-manager-1.3.0.vsix 文件
```

---

## 📦 打包信息

- **版本**: 1.3.0
- **发布日期**: 2025-12-10
- **文件大小**: 75.23 KB
- **包含文件**: 24 个
- **核心代码**: 4 个 JS 文件
- **文档**: 12 个 MD 文件
- **许可证**: MIT

---

**恭喜！v1.3.0 已成功打包，可以开始测试了！** 🚀

---

## 🔗 相关链接

- 打包文件: `d:\Work\RN\copilot-prompts\vscode-extension\copilot-prompts-manager-1.3.0.vsix`
- 源代码: `d:\Work\RN\copilot-prompts\vscode-extension\`
- 文档: 插件目录下的所有 .md 文件
