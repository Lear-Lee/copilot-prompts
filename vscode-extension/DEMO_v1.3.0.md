# v1.3.0 功能演示

快速了解 v1.3.0 的新功能

---

## 🎬 演示 1: 智能问题检测

### 操作步骤
1. 按 `Ctrl+Shift+P`
2. 输入 "检查配置"
3. 选择 "Copilot Prompts: 检查配置问题"

### 预期效果
```
🔍 配置检查结果:
❌ 错误: 0 个
⚠️ 警告: 1 个
ℹ️ 信息: 2 个

════════════════════════
$(workspace) 工作区问题
════════════════════════
⚠️ 检测到多个项目都有配置文件
   当前生效: vita-age-control-system
   其他项目: weipin
   [3 个解决方案]

════════════════════════
$(file) 文件问题
════════════════════════
ℹ️ weipin 未配置 Copilot Prompts
   建议为此项目创建独立配置
   [2 个解决方案]
```

---

## 🎬 演示 2: 多选修复方案

### 操作步骤
1. 从问题列表选择一个问题
2. 查看解决方案列表

### 预期效果
```
解决方案: 检测到多个项目都有配置文件

1. 查看冲突详情
   └─ 显示所有配置文件位置
   
2. 备份非活动项目配置
   └─ 保留第一个项目配置，备份其他
   
3. 为每个项目创建独立配置
   └─ 基于当前配置生成各项目配置
   
4. $(close) 取消
```

### 选择方案后
- ✅ 立即执行操作
- ✅ 显示确认对话框（如需要）
- ✅ 提示操作结果
- ✅ 询问是否重新检查

---

## 🎬 演示 3: 批量修复

### 操作步骤
1. 运行配置检查
2. 选择 "$(tools) 批量修复所有问题"
3. 确认操作

### 预期效果
```
发现 3 个可自动修复的问题，是否继续？
[修复] [取消]

执行中...
✅ 添加 Agent frontmatter
✅ 创建缺失的 Prompt
✅ 重命名文件为规范格式

批量修复完成: 3 个成功, 0 个失败

是否重新检查配置？
[重新检查] [稍后]
```

---

## 🎬 演示 4: 导出检查报告

### 操作步骤
1. 运行配置检查
2. 选择 "$(export) 导出检查报告"

### 预期效果
```
报告已生成: copilot-prompts-check-2025-12-10-19-30-45.md
[打开] [关闭]
```

### 报告内容
````markdown
# Copilot Prompts 配置检查报告

生成时间: 2025-12-10 19:30:45

## 问题概览
- ❌ 错误: 0 个
- ⚠️ 警告: 1 个
- ℹ️ 信息: 2 个

## 工作区问题

### ⚠️ 检测到多个项目都有配置文件

**详情**: 当前生效: vita-age-control-system
其他项目: weipin

**相关文件**:
- `d:\Work\vita-age-control-system\.github\copilot-instructions.md`
- `d:\Work\weipin\.github\copilot-instructions.md`

**解决方案**:
- 查看冲突详情 - 显示所有配置文件位置
- 备份非活动项目配置 - 保留第一个项目配置，备份其他
- 为每个项目创建独立配置 - 基于当前配置生成各项目配置

...
````

---

## 🎬 演示 5: Agent 文件检查

### 创建测试文件
```bash
cd "d:\Work\RN\copilot-prompts\agents"
echo "# Test Agent" > test-demo.agent.md
```

### 运行检查

**检测结果**:
```
❌ Agent 文件缺少 frontmatter: test-demo.agent.md
必须包含 YAML frontmatter 配置
[2 个解决方案]
```

### 选择修复

**方案 1: 自动添加模板 frontmatter**
```
执行中...
✅ 已添加 frontmatter

文件内容更新为:
---
description: '描述信息'
tools: ['edit', 'search']
---

# Test Agent
```

---

## 🎬 演示 6: 引用关系检查

### 创建引用
编辑 `agents/vitasage.agent.md`，添加：
```markdown
参考: prompts/common/nonexistent-demo.md
```

### 运行检查

**检测结果**:
```
❌ Agent 引用的 Prompt 不存在: vitasage.agent.md
引用路径: prompts/common/nonexistent-demo.md
[3 个解决方案]
```

### 选择方案

**方案 1: 创建缺失的 Prompt**
```
执行中...
✅ 已创建文件: prompts/common/nonexistent-demo.md
📝 已打开文件供编辑

文件内容:
# nonexistent-demo

```

**方案 3: 查看所有可用 Prompts**
```
当前可用的 Prompts:

common/
  - i18n.md
  - typescript-strict.md

industry/
  - vitasage-recipe.md

vue/
  - vue3-typescript.md
```

---

## 🎬 演示 7: 重复文件检测

### 创建重复文件
```bash
echo "# Test" > copilot-prompts/common/duplicate-demo.md
echo "# Test" > copilot-prompts/industry/duplicate-demo.md
```

### 运行检查

**检测结果**:
```
⚠️ 发现重复的文件名: duplicate-demo.md
存在于: common/duplicate-demo.md, industry/duplicate-demo.md
[3 个解决方案]
```

### 选择方案

**方案 2: 对比文件内容**
- ✅ 打开 VS Code diff 视图
- ✅ 并排显示两个文件
- ✅ 高亮差异部分

---

## 📊 功能对比

### 问题检测

| 功能 | v1.2.0 | v1.3.0 |
|------|--------|--------|
| 检查项 | 3 项 | **8 项** ✨ |
| 分类显示 | ❌ | ✅ 5 大类 |
| 图标标识 | ❌ | ✅ VSCode Icons |
| 详细说明 | 简单 | **丰富** ✨ |

### 问题修复

| 功能 | v1.2.0 | v1.3.0 |
|------|--------|--------|
| 解决方案数 | 1 个 | **1-3 个** ✨ |
| 方案描述 | ❌ | ✅ 详细说明 |
| 自动修复 | 部分 | **全面** ✨ |
| 批量操作 | ❌ | ✅ 支持 |
| 导出报告 | ❌ | ✅ Markdown |

---

## 🎯 核心价值

### 提高效率
- **自动检测**: 无需手动排查
- **一键修复**: 减少重复劳动
- **批量处理**: 节省时间

### 降低错误
- **引用验证**: 避免引用失效
- **格式检查**: 确保配置规范
- **重复检测**: 防止命名冲突

### 改善体验
- **分类清晰**: 快速定位问题
- **多选方案**: 灵活处理方式
- **详细说明**: 理解问题本质

---

## 📚 更多信息

- [完整更新日志](./CHANGELOG-v1.3.0.md)
- [测试指南](./TEST_v1.3.0.md)
- [快速验证](./QUICK_TEST.md)

---

**立即体验新功能！** 🚀

按 `Ctrl+Shift+P` → 输入 "检查配置" → 开始探索
