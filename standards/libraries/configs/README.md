# Element Plus 配置管理

本目录存储不同项目/团队的 Element Plus 使用习惯配置。

## 📁 配置文件列表

### 预设配置

- **element-plus-vitasage.json** - VitaSage 工业配方系统配置
  - 严格国际化、统一表格样式
  - 100% border + highlight-current-row
  - 90% link 操作按钮

### 自定义配置

通过 MCP 工具生成的自定义配置将保存在此目录：

```
configs/
├── element-plus-vitasage.json       # 预设配置
├── element-plus-{your-project}.json  # 自动生成的配置
└── README.md                         # 本文件
```

## 🛠️ 生成自定义配置

### 方法 1: 使用 MCP 工具

```typescript
// 分析项目并生成配置
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
