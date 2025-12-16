# Copilot Prompts 自动配置脚本使用指南

> 通用的项目规范自动配置工具，支持前端、后端、全栈项目

---

## 🚀 快速开始

### 方式 1: 自动配置（推荐）

```bash
# 自动检测技术栈并配置
cd /path/to/copilot-prompts
./scripts/setup-project-standards.sh -a /path/to/your/project
```

### 方式 2: 指定配置

```bash
# 使用 vitasage 配置
./scripts/setup-project-standards.sh -c vitasage /Users/pailasi/Work/VitaSage

# 使用标准配置
./scripts/setup-project-standards.sh -c standard /path/to/project
```

### 方式 3: 交互式配置

```bash
# 脚本会询问选择哪个配置
./scripts/setup-project-standards.sh /path/to/project
```

---

## 📋 功能说明

### 自动检测技术栈

脚本会自动检测：

**前端框架**:
- Vue 2/3
- React
- Angular

**UI 库**:
- Element Plus
- Ant Design Vue
- Naive UI

**状态管理**:
- Pinia
- Vuex
- Redux

**工具库**:
- Vue I18n
- Vite
- Webpack

**后端框架**:
- Express (Node.js)
- NestJS (Node.js)
- FastAPI (Python)
- Django (Python)
- Go 标准库

**语言**:
- TypeScript
- JavaScript
- Python
- Go

### 生成的文件

```
your-project/
└── .github/
    └── copilot-instructions.md    # 自动生成的规范文件
```

---

## 🎯 支持的配置方案

### 查看所有配置

```bash
./scripts/setup-project-standards.sh -l
```

### 预设配置

| 配置 ID | 适用场景 | 特点 |
|---------|---------|------|
| standard | 通用项目 | Element Plus 官方推荐 |
| vitasage | 工业配方系统 | 严格国际化、统一样式 |
| generic | 非前端项目 | 通用编码规范 |

### 自定义配置

未来支持基于项目自动生成配置。

---

## 📖 使用示例

### 示例 1: 配置 VitaSage 项目

```bash
cd /Users/pailasi/Work/copilot-prompts

./scripts/setup-project-standards.sh \
  -c vitasage \
  /Users/pailasi/Work/VitaSage
```

**输出**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Copilot Prompts 自动配置
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ 正在分析项目技术栈...
ℹ 检测到技术栈:
  - vue
  - vue3
  - element-plus
  - pinia
  - i18n
  - typescript

ℹ 使用配置方案: vitasage
ℹ 生成 copilot-instructions.md...
✓ 已生成 /Users/pailasi/Work/VitaSage/.github/copilot-instructions.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  配置完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ 项目已配置完成！
ℹ 下一步：
  1. 重启 VS Code (Cmd+Shift+P → Reload Window)
  2. 开始使用 GitHub Copilot
  3. AI 将自动遵循项目规范生成代码
```

---

### 示例 2: 配置 Python 后端项目

```bash
./scripts/setup-project-standards.sh -a /path/to/fastapi-project
```

**检测结果**:
- Python
- FastAPI
- TypeScript (如果有前端)

**生成的 copilot-instructions.md** 会包含:
- Python 编码规范
- FastAPI 最佳实践
- API 设计规范
- 数据库操作规范

---

### 示例 3: 配置 Go 项目

```bash
./scripts/setup-project-standards.sh -a /path/to/go-project
```

**生成的规范**:
- Go 代码风格（gofmt）
- 错误处理模式
- 并发编程规范
- 包组织规范

---

## 🔧 高级用法

### 为现有项目更新配置

```bash
# 重新运行脚本会覆盖现有的 copilot-instructions.md
./scripts/setup-project-standards.sh -c vitasage /Users/pailasi/Work/VitaSage
```

### 批量配置多个项目

```bash
# 创建批处理脚本
cat > batch-setup.sh << 'EOF'
#!/bin/bash
SCRIPT_DIR="/Users/pailasi/Work/copilot-prompts/scripts"

$SCRIPT_DIR/setup-project-standards.sh -c vitasage /Users/pailasi/Work/VitaSage
$SCRIPT_DIR/setup-project-standards.sh -c standard /Users/pailasi/Work/project2
$SCRIPT_DIR/setup-project-standards.sh -a /Users/pailasi/Work/project3
EOF

chmod +x batch-setup.sh
./batch-setup.sh
```

---

## 🐛 故障排除

### Q: 脚本提示"权限被拒绝"

**A**: 添加执行权限
```bash
chmod +x /Users/pailasi/Work/copilot-prompts/scripts/setup-project-standards.sh
```

### Q: 检测不到技术栈

**A**: 确保项目有以下文件之一:
- `package.json` (Node.js 项目)
- `requirements.txt` 或 `pyproject.toml` (Python 项目)
- `go.mod` (Go 项目)

### Q: 配置没有生效

**A**: 
1. 确认 `.github/copilot-instructions.md` 已生成
2. 重启 VS Code (Cmd+Shift+P → Reload Window)
3. 在 Copilot Chat 中测试

---

## 📝 生成的文件示例

### Vue 3 + Element Plus 项目

```markdown
# 项目开发规范 - Copilot 指令

> 自动生成时间: 2025-12-16  
> 配置方案: vitasage

## 🎯 核心原则

1. **类型安全** - 充分利用类型系统
2. **代码一致性** - 遵循项目现有风格
3. **最小改动** - 只修改必要的代码
4. **错误处理** - 完善的异常处理机制

---

## 🛠️ 技术栈

检测到的技术栈: vue vue3 element-plus pinia i18n typescript

---

## 📋 应用的规范

### 自动加载规范

- **Vue 3 规范**: `get_relevant_standards({ fileType: "vue" })`
- **TypeScript 规范**: `get_relevant_standards({ fileType: "ts" })`
- **Element Plus 规范**: `get_relevant_standards({ imports: ["element-plus"], config: "vitasage" })`
- **国际化规范**: `get_relevant_standards({ scenario: "国际化" })`
- **状态管理规范**: `get_relevant_standards({ imports: ["pinia"] })`

**Element Plus 配置方案**: `vitasage`
**国际化要求**: 所有 UI 文本必须使用 `$t()` 函数

### API 层规范

- **API 调用**: `get_relevant_standards({ scenario: "API 调用" })`

---

## 📝 工作流

1. **代码生成前**: 自动检查是否符合项目规范
2. **代码生成中**: 优先使用项目现有模式
3. **代码生成后**: 自我检查类型安全和代码风格
```

---

## 🚀 扩展功能（未来）

- [ ] 支持更多后端框架（Spring Boot、Laravel 等）
- [ ] 自动分析现有代码生成配置
- [ ] 配置模板库
- [ ] 团队配置共享
- [ ] 配置版本管理

---

**脚本位置**: `copilot-prompts/scripts/setup-project-standards.sh`  
**维护团队**: MTA团队（蘑菇与吐司的AI团队）  
**更新时间**: 2025-12-16
