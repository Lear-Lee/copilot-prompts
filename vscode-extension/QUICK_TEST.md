# 快速验证测试

本文档提供快速验证 v1.3.0 新功能的最小化测试步骤。

---

## 🚀 快速开始

### 前提条件
- [ ] 已安装 Node.js (>= 18.0.0)
- [ ] 已安装 VSCode (>= 1.85.0)
- [ ] 已编译插件 (`npm run compile`)

### 启动测试
1. 按 `F5` 启动扩展开发主机
2. 在新窗口中打开当前工作区

---

## ⚡ 5 分钟核心功能测试

### 测试 1: 检查命令可用（1 分钟）

**步骤**:
1. 按 `Ctrl+Shift+P` 打开命令面板
2. 输入 "Copilot Prompts: 检查配置问题"
3. 执行命令

**预期**:
- ✅ 命令出现在列表中
- ✅ 能够执行
- ✅ 显示检查结果（即使没有问题）

**通过标准**:
- 显示 "✅ 未发现配置问题" 或问题列表

---

### 测试 2: 问题分组显示（1 分钟）

**步骤**:
1. 如果检查结果为"未发现问题"，先创建一个测试问题：
   ```bash
   cd "d:\Work\RN\copilot-prompts\agents"
   echo "# Test Agent" > test.md
   ```
2. 重新运行检查命令

**预期**:
- ✅ 显示问题统计（错误/警告/信息数量）
- ✅ 问题按类别分组
- ✅ 每个问题显示解决方案数量

**通过标准**:
- 能看到 "$(symbol-ruler) 格式问题" 分组
- 显示 "agents 目录中的文件命名不规范: test.md"

---

### 测试 3: 解决方案选择（2 分钟）

**步骤**:
1. 从问题列表中选择一个问题
2. 查看解决方案列表
3. 选择 "重命名为 Agent 格式"

**预期**:
- ✅ 显示解决方案列表
- ✅ 每个方案有清晰描述
- ✅ 执行后显示成功提示
- ✅ 文件被重命名为 `test.agent.md`

**通过标准**:
- 文件重命名成功
- 显示 "✅ 已重命名" 提示

---

### 测试 4: 批量修复（1 分钟）

**步骤**:
1. 创建另一个测试问题：
   ```bash
   cd "d:\Work\RN\copilot-prompts\agents"
   echo "# Another Test" > another-test.agent.md
   ```
2. 运行检查命令
3. 选择 "$(tools) 批量修复所有问题"

**预期**:
- ✅ 显示可修复问题数量
- ✅ 显示确认对话框
- ✅ 执行后显示统计信息

**通过标准**:
- 显示 "批量修复完成: X 个成功, 0 个失败"
- frontmatter 被自动添加

---

## ✅ 测试通过标准

所有 4 个快速测试通过 = v1.3.0 核心功能正常

---

## 🧹 清理测试文件

```powershell
# 删除测试文件
cd "d:\Work\RN\copilot-prompts\vscode-extension"

# 如果测试创建了这些文件，删除它们
rm "d:\Work\RN\copilot-prompts\agents\test.md" -ErrorAction SilentlyContinue
rm "d:\Work\RN\copilot-prompts\agents\test.agent.md" -ErrorAction SilentlyContinue
rm "d:\Work\RN\copilot-prompts\agents\another-test.agent.md" -ErrorAction SilentlyContinue
```

---

## 📊 测试结果记录

```
测试时间: ________
VSCode 版本: ________

[✅/❌] 测试 1: 检查命令可用
[✅/❌] 测试 2: 问题分组显示
[✅/❌] 测试 3: 解决方案选择
[✅/❌] 测试 4: 批量修复

总体评价: ________

发现的问题:
1. 
2. 
```

---

## 🐛 常见问题

### Q: 运行检查命令没有反应？
A: 检查控制台是否有错误信息（`Ctrl+Shift+I` 打开开发者工具）

### Q: 找不到命令？
A: 确保插件已激活（查看侧边栏是否有 Copilot Prompts 图标）

### Q: 批量修复没有效果？
A: 确认问题是否支持自动修复（标签中包含"自动"或"添加"）

---

**快速验证完成后，可以进行完整测试 → `TEST_v1.3.0.md`**
