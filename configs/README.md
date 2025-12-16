# Copilot Prompts 配置文件

存放各团队/项目的自定义编码规范配置。

## 📁 配置文件列表

- **element-plus-vitasage.json** - VitaSage 团队 Element Plus 配置

## 🎯 使用配置

### 使用自动配置脚本（推荐）

```bash
# 使用 vitasage 配置
../setup-copilot.sh -c vitasage /path/to/project

# 列出所有可用配置
../setup-copilot.sh -l
```

### 在项目中声明配置

在项目的 `.github/copilot-instructions.md` 中：

```markdown
**Element Plus 配置方案**: `vitasage`
```
await mcp_copilot-promp_analyze_element_plus_usage({
  projectPath: "/path/to/your/project",
  outputConfigId: "my-company"  // 可选，默认自动生成
})
```

### 方法 2: 手动创建

复制 `element-plus-vitasage.json` 并修改配置项。

## 📖 配置结构说明

```json
{
  "configId": "唯一标识",
  "name": "配置名称",
  "description": "配置描述",
  "analyzedFrom": "项目路径（自动生成时填写）",
  "analyzedAt": "分析日期",
  "version": "版本号",
  "maintainer": "维护者",
  
  "rules": {
    "table": {
      "border": { "required": true/false, "frequency": 0-100 },
      // ... 更多配置
    }
  }
}
```

## 🔄 使用配置

### 在项目中声明

在 `.github/copilot-instructions.md` 中添加：

```markdown
## Element Plus 配置方案

使用方案: **vitasage**
```

### 通过 MCP 工具

```typescript
get_relevant_standards({ 
  imports: ["element-plus"],
  config: "vitasage"
})
```

## 📊 配置优先级

1. 项目 `.github/copilot-instructions.md` 声明的配置
2. MCP 工具参数指定的配置
3. 标准配置（standard）

---

**维护团队**: MTA团队（蘑菇与吐司的AI团队）  
**更新时间**: 2025-12-16
