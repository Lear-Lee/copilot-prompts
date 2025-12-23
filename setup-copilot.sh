#!/bin/bash

# Copilot Prompts 自动配置脚本
# 用途：分析项目并自动生成/应用编码规范
# 维护者：MTA团队（蘑菇与吐司的AI团队）
# 版本：v1.5.0 (v1.1.0 更新：代码质量保障)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 显示使用说明
show_usage() {
    cat << EOF
使用方法:
  $0 [选项] <项目路径>

选项:
  -c, --config <配置ID>    使用指定的配置方案（如 strict）
  -a, --auto              自动分析项目并生成配置
  -l, --list              列出所有可用配置
  -h, --help              显示帮助信息

示例:
  $0 /path/to/project                    # 交互式配置
  $0 -a /path/to/project                 # 自动分析并配置
  $0 -c strict /path/to/project          # 使用严格配置（单行书写+强制国际化）
  $0 -l                                  # 列出可用配置

EOF
}

# 列出所有可用配置
list_configs() {
    print_header "可用配置方案"
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    CONFIGS_DIR="$SCRIPT_DIR/configs"
    
    echo "通用配置:"
    echo "  - standard      Element Plus 标准配置"
    echo ""
    
    echo "项目配置:"
    if [ -d "$CONFIGS_DIR" ]; then
        for config in "$CONFIGS_DIR"/*.json; do
            if [ -f "$config" ]; then
                config_name=$(basename "$config" .json)
                config_id=$(echo "$config_name" | sed 's/element-plus-//')
                desc=$(grep -o '"name": "[^"]*"' "$config" | head -1 | cut -d'"' -f4)
                echo "  - $config_id      $desc"
            fi
        done
    fi
    echo ""
    
    echo "自定义配置:"
    echo "  使用 -a 选项自动分析项目生成"
    echo ""
}

# 检测项目技术栈
detect_tech_stack() {
    local project_path=$1
    local tech_stack=()
    
    # 不输出带颜色的消息，直接检测
    
    # 检测前端框架
    if [ -f "$project_path/package.json" ]; then
        if grep -q '"vue"' "$project_path/package.json"; then
            tech_stack+=("vue")
            if grep -q '"vue".*"3\.' "$project_path/package.json"; then
                tech_stack+=("vue3")
            fi
        fi
        if grep -q '"react"' "$project_path/package.json"; then
            tech_stack+=("react")
        fi
        if grep -q '"angular"' "$project_path/package.json"; then
            tech_stack+=("angular")
        fi
        
        # 检测 UI 库
        if grep -q '"element-plus"' "$project_path/package.json"; then
            tech_stack+=("element-plus")
        fi
        if grep -q '"ant-design-vue"' "$project_path/package.json"; then
            tech_stack+=("ant-design-vue")
        fi
        if grep -q '"pinia"' "$project_path/package.json"; then
            tech_stack+=("pinia")
        fi
        if grep -q '"vue-i18n"' "$project_path/package.json"; then
            tech_stack+=("i18n")
        fi
    fi
    
    # 检测后端框架
    if [ -f "$project_path/package.json" ]; then
        if grep -q '"express"' "$project_path/package.json"; then
            tech_stack+=("express")
        fi
        if grep -q '"nestjs"' "$project_path/package.json"; then
            tech_stack+=("nestjs")
        fi
    fi
    
    if [ -f "$project_path/go.mod" ]; then
        tech_stack+=("go")
    fi
    
    if [ -f "$project_path/requirements.txt" ] || [ -f "$project_path/pyproject.toml" ]; then
        tech_stack+=("python")
        if grep -q "fastapi" "$project_path/requirements.txt" 2>/dev/null; then
            tech_stack+=("fastapi")
        fi
        if grep -q "django" "$project_path/requirements.txt" 2>/dev/null; then
            tech_stack+=("django")
        fi
    fi
    
    # 检测语言
    if [ -f "$project_path/tsconfig.json" ]; then
        tech_stack+=("typescript")
    fi
    
    # 检测微信小程序
    if [ -f "$project_path/project.config.json" ]; then
        tech_stack+=("wechat-miniprogram")
        # 检查是否有云开发
        if [ -d "$project_path/cloudfunctions" ]; then
            tech_stack+=("cloud-functions")
        fi
    fi
    
    # 检测 Flutter
    if [ -f "$project_path/pubspec.yaml" ]; then
        tech_stack+=("flutter")
        if grep -q "flutter:" "$project_path/pubspec.yaml"; then
            tech_stack+=("dart")
        fi
    fi
    
    echo "${tech_stack[@]}"
}

# 自动检测代码风格（判断是否应该使用 strict 配置）
detect_code_style() {
    local project_path=$1
    local single_line_count=0
    local multi_line_count=0
    local total_count=0
    
    # 检查是否有 Vue 文件
    if [ ! -d "$project_path/src" ]; then
        echo "standard"
        return
    fi
    
    # 查找 Vue 文件中的 Element Plus 组件
    # 检测 <el- 开头的标签，统计单行和多行写法的数量
    while IFS= read -r vue_file; do
        if [ -f "$vue_file" ]; then
            # 查找 <el- 开头的行
            while IFS= read -r line; do
                # 检查这一行是否包含结束标签 > 或 />
                if echo "$line" | grep -q '<el-.*[/>]'; then
                    # 单行写法（开始标签和属性在同一行）
                    ((single_line_count++))
                    ((total_count++))
                elif echo "$line" | grep -q '<el-'; then
                    # 可能是多行写法的开始
                    ((multi_line_count++))
                    ((total_count++))
                fi
            done < <(grep -n '<el-' "$vue_file" 2>/dev/null || true)
        fi
    done < <(find "$project_path/src" -name "*.vue" 2>/dev/null | head -20 || true)
    
    # 如果没有检测到任何 Element Plus 组件，使用 standard
    if [ $total_count -eq 0 ]; then
        echo "standard"
        return
    fi
    
    # 计算单行写法的比例
    local single_line_ratio=$((single_line_count * 100 / total_count))
    
    # 如果单行写法占比超过 60%，使用 strict 配置
    if [ $single_line_ratio -gt 60 ]; then
        echo "strict"
    else
        echo "standard"
    fi
}

# 配置 VS Code MCP
configure_vscode_mcp() {
    local project_path=$1
    local vscode_dir="$project_path/.vscode"
    local mcp_file="$vscode_dir/mcp.json"
    local settings_file="$vscode_dir/settings.json"
    
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    MCP_SERVER_PATH="$SCRIPT_DIR/mcp-server/build/index.js"
    
    mkdir -p "$vscode_dir"
    
    print_info "配置 VS Code MCP..."
    
    # 创建 mcp.json
    cat > "$mcp_file" << EOF
{
  "servers": {
    "copilot-prompts": {
      "command": "node",
      "args": [
        "$MCP_SERVER_PATH"
      ],
      "env": {},
      "autoStart": true
    }
  }
}
EOF
    
    # 更新或创建 settings.json
    if [ -f "$settings_file" ]; then
        # 如果 settings.json 已存在，需要合并配置
        print_info "更新现有 settings.json..."
        # 这里简单处理，如果已有 MCP 配置则跳过
        if ! grep -q "github.copilot.chat.mcp.enabled" "$settings_file"; then
            # 移除最后的 } 然后追加配置
            sed -i '' '$d' "$settings_file"
            cat >> "$settings_file" << EOF
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.configFile": "\${workspaceFolder}/.vscode/mcp.json",
  "github.copilot.chat.mcp.autoStart": true
}
EOF
        fi
    else
        # 创建新的 settings.json
        cat > "$settings_file" << EOF
{
  "github.copilot.chat.mcp.enabled": true,
  "github.copilot.chat.mcp.configFile": "\${workspaceFolder}/.vscode/mcp.json",
  "github.copilot.chat.mcp.autoStart": true
}
EOF
    fi
    
    print_success "已配置 VS Code MCP"
}

# 生成 .github/copilot-instructions.md（最小化配置）
generate_copilot_instructions() {
    local project_path=$1
    local config_id=$2
    local tech_stack=$3
    
    local github_dir="$project_path/.github"
    local instructions_file="$github_dir/copilot-instructions.md"
    local project_name=$(basename "$project_path")
    
    mkdir -p "$github_dir"
    
    print_info "生成 copilot-instructions.md..."
    
    cat > "$instructions_file" << 'EOF'
<!-- 此文件由 Copilot Prompts setup-copilot.sh 生成 -->
<!-- 你可以添加自定义内容，使用 CUSTOM_START/CUSTOM_END 标记保护 -->
<!-- 示例: -->
<!-- CUSTOM_START -->
<!-- 你的自定义规范 -->
<!-- CUSTOM_END -->

EOF

    # 添加作用域声明 - 防止跨项目污染
    cat >> "$instructions_file" << EOF
<!-- 🎯 作用域：此配置仅适用于当前项目 -->
<!-- 项目名称: $project_name -->
<!-- 项目路径: $project_path -->

EOF

    cat >> "$instructions_file" << 'EOF'
# 项目开发规范 - Copilot 指令

## ⚠️ 强制执行检查点

> **此检查点的优先级高于本文件的所有其他内容**

在执行**任何**以下操作前，必须先完成规范加载验证：

### 受限操作清单

- ❌ 创建任何代码文件（.vue、.ts、.tsx、.js 等）
- ❌ 修改任何代码文件
- ❌ 使用 `replace_string_in_file` 或 `multi_replace_string_in_file`
- ❌ 生成任何代码片段

### 强制验证流程

EOF

    # 添加动态项目名称到验证流程
    cat >> "$instructions_file" << EOF
1. **检查项目作用域** - 确认当前操作的文件路径包含 \`/$project_name/\`
2. **加载相关规范** - 根据文件类型调用对应的 MCP 工具：
   - Vue 文件 → \`get_smart_standards\` 或 \`use_preset\`
   - TypeScript 文件 → \`get_smart_standards\` 或 \`use_preset\`
   - 其他文件 → 根据实际情况选择
3. **验证加载成功** - 确认工具返回了规范内容
4. **声明已加载** - 在响应中明确说明：\`✅ 已加载规范: [工具名称]\`

EOF

    cat >> "$instructions_file" << 'EOF'
### 违规处理

- 如果未加载规范就生成代码 → **此操作无效，必须重新执行**
- 如果出现语法错误 → **深刻反思，检查是否遵循了规范**
- 如果出现低级错误 → **停止操作，重新加载规范后再继续**

---

EOF

    # 添加 AI 可识别的作用域限制
    cat >> "$instructions_file" << EOF
## 🎯 作用域限制

**⚠️ 此配置仅在以下情况生效：**

1. 当前编辑的文件路径包含: \`/$project_name/\`
2. 或当前工作目录为: \`$project_path\`

**如果你在其他项目工作（如 $project_name 之外的项目），请完全忽略此配置文件中的所有规范和指令。**

---

EOF

    # 添加元信息
    cat >> "$instructions_file" << EOF
> 📌 **自动配置信息**
> - 生成时间: $(date +%Y-%m-%d)
> - 配置方案: $config_id
> - 技术栈: $tech_stack

---

EOF

    # 如果有 Element Plus，添加配置方案信息
    if [[ "$tech_stack" == *"element-plus"* ]] && [ "$config_id" != "standard" ] && [ "$config_id" != "generic" ]; then
        cat >> "$instructions_file" << EOF
## 📦 配置方案

**方案ID**: $config_id

> 详细规则请参考: \`configs/element-plus-$config_id.json\`

---

EOF
    fi

    # 添加强制工作流（核心部分）
    cat >> "$instructions_file" << 'EOF'
## 🎯 核心代码规范（自动加载）

以下规范始终生效，无需手动调用：

1. **禁止创建文档** - 生成代码时不要创建 .md 文档（除非明确要求）
2. **充分注释** - 重要代码必须添加注释说明复杂逻辑、业务规则
3. **去 AI 化** - 注释禁止使用表情符号、过度热情语气，保持专业简洁

---

## ⚠️ 强制工作流

**在进行任何代码生成或修改之前，必须先调用 MCP 工具加载相关规范！**

根据文件类型和场景，调用相应的 MCP 工具：

1. **Vue 文件** → `get_relevant_standards({ fileType: "vue" })`
2. **TypeScript 文件** → `get_relevant_standards({ fileType: "ts" })`
3. **React 组件** → `get_relevant_standards({ fileType: "tsx" })`
4. **使用特定库时**：
   - Element Plus: `get_relevant_standards({ imports: ["element-plus"] })`
   - Pinia: `get_relevant_standards({ imports: ["pinia"] })`
   - Vue Router: `get_relevant_standards({ imports: ["vue-router"] })`
5. **特定场景**：
   - API 调用: `get_relevant_standards({ scenario: "API 调用" })`
   - 国际化: `get_relevant_standards({ scenario: "国际化" })`

### 标准流程

1. ✅ **强制**: 加载规范 → 2. 理解需求 → 3. 编写代码 → 4. 验证规范

---

## 📚 技术栈规范

本项目使用以下技术（规范内容由 Copilot 通过 MCP 工具实时加载）：

EOF

    # 根据技术栈添加规范引用
    if [[ "$tech_stack" == *"vue3"* ]] || [[ "$tech_stack" == *"vue"* ]]; then
        cat >> "$instructions_file" << 'EOF'
### Vue 3 开发

- **文件类型**: `.vue`
- **规范加载**: `get_relevant_standards({ fileType: "vue" })`
- **核心要求**: Composition API、TypeScript、响应式最佳实践

EOF
    fi
    
    if [[ "$tech_stack" == *"typescript"* ]]; then
        cat >> "$instructions_file" << 'EOF'
### TypeScript

- **文件类型**: `.ts`, `.tsx`
- **规范加载**: `get_relevant_standards({ fileType: "ts" })`
- **核心要求**: 严格类型、避免 any、完整的类型定义

EOF
    fi
    
    if [[ "$tech_stack" == *"element-plus"* ]]; then
        cat >> "$instructions_file" << EOF
### Element Plus

- **规范加载**: \`get_relevant_standards({ imports: ["element-plus"], config: "$config_id" })\`
- **配置方案**: $config_id
EOF
        
        if [ "$config_id" = "strict" ]; then
            cat >> "$instructions_file" << 'EOF'
- **关键要求**: 
  - 表格必须添加 border
  - 表格必须高亮当前行
  - 所有文本必须国际化
  - 组件属性使用单行书写
EOF
        fi
        cat >> "$instructions_file" << 'EOF'

EOF
    fi
    
    if [[ "$tech_stack" == *"pinia"* ]]; then
        cat >> "$instructions_file" << 'EOF'
### 状态管理 (Pinia)

- **规范加载**: `get_relevant_standards({ imports: ["pinia"] })`
- **核心要求**: Setup Store 优先、TypeScript 类型定义

EOF
    fi
    
    if [[ "$tech_stack" == *"i18n"* ]] || [[ "$tech_stack" == *"vue-i18n"* ]]; then
        cat >> "$instructions_file" << 'EOF'
### 国际化

- **规范加载**: `get_relevant_standards({ scenario: "国际化" })`
- **强制要求**: 所有 UI 文本必须使用 `$t()` 函数，禁止硬编码中文

EOF
    fi
    
    if [[ "$tech_stack" == *"wechat-miniprogram"* ]]; then
        cat >> "$instructions_file" << 'EOF'
### 微信小程序

- **规范加载**: `get_relevant_standards({ fileType: "wxml" })` 或 `get_relevant_standards({ fileType: "js", imports: ["wx"] })`
- **核心要求**: 
  - 遵循微信小程序开发规范
  - 使用小程序原生组件和 API
  - Page/Component 生命周期管理
  - 云开发最佳实践（如适用）

EOF
    fi
    
    if [[ "$tech_stack" == *"flutter"* ]]; then
        cat >> "$instructions_file" << 'EOF'
### Flutter 开发

- **规范加载**: `get_relevant_standards({ fileType: "dart" })`
- **核心要求**: 
  - Widget 组件化
  - 状态管理（Provider/Riverpod/Bloc）
  - Material Design 或 Cupertino 设计规范

EOF
    fi

    # 添加自定义规范章节
    cat >> "$instructions_file" << 'EOF'
---

## 📝 自定义规范

<!-- CUSTOM_START -->
<!-- 你的自定义规范 -->
<!-- CUSTOM_END -->
EOF
    
    print_success "已生成 $instructions_file"
}

# 主逻辑
main() {
    local project_path=""
    local config_id=""
    local auto_detect=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -c|--config)
                config_id="$2"
                shift 2
                ;;
            -a|--auto)
                auto_detect=true
                shift
                ;;
            -l|--list)
                list_configs
                exit 0
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                project_path="$1"
                shift
                ;;
        esac
    done
    
    # 检查项目路径
    if [ -z "$project_path" ]; then
        print_error "请指定项目路径"
        show_usage
        exit 1
    fi
    
    if [ ! -d "$project_path" ]; then
        print_error "项目路径不存在: $project_path"
        exit 1
    fi
    
    print_header "Copilot Prompts 自动配置"
    
    print_info "正在分析项目技术栈..."
    
    # 检测技术栈
    tech_stack=$(detect_tech_stack "$project_path")
    
    print_info "检测到技术栈:"
    for tech in $tech_stack; do
        echo "  - $tech"
    done
    echo ""
    
    # 确定配置方案
    if [ -z "$config_id" ]; then
        if [ "$auto_detect" = true ]; then
            # 自动选择配置
            if [[ "$tech_stack" == *"element-plus"* ]]; then
                # 检测代码风格
                print_info "正在分析代码风格..."
                detected_style=$(detect_code_style "$project_path")
                config_id="$detected_style"
                
                if [ "$config_id" = "strict" ]; then
                    print_info "✓ 检测到单行书写风格，使用严格配置"
                else
                    print_info "✓ 检测到标准风格，使用标准配置"
                fi
            else
                config_id="generic"
                print_info "使用通用配置: $config_id"
            fi
        else
            # 交互式选择
            echo "请选择配置方案:"
            echo "  1) standard - 标准配置（Element Plus 官方推荐）"
            echo "  2) strict - 严格配置（单行书写+强制国际化）"
            echo "  3) custom - 自定义配置"
            read -p "请输入选项 (1-3): " choice
            
            case $choice in
                1) config_id="standard" ;;
                2) config_id="strict" ;;
                3) 
                    read -p "请输入自定义配置 ID: " config_id
                    ;;
                *) 
                    print_error "无效选项"
                    exit 1
                    ;;
            esac
        fi
    fi
    
    print_info "使用配置方案: $config_id"
    
    # 配置 VS Code MCP
    configure_vscode_mcp "$project_path"
    
    # 生成配置文件
    generate_copilot_instructions "$project_path" "$config_id" "$tech_stack"
    
    print_header "配置完成"
    print_success "项目已配置完成！"
    print_info "已配置文件："
    echo "  - $project_path/.vscode/mcp.json"
    echo "  - $project_path/.vscode/settings.json"
    echo "  - $project_path/.github/copilot-instructions.md"
    echo ""
    
    print_warning "⚠️  重要：MCP 配置不会立即生效"
    echo ""
    
    print_info "🔄 让配置生效的方法："
    echo ""
    echo "【方法1】重新加载 VS Code 窗口（推荐）"
    echo "  1. 按 Cmd+Shift+P (macOS) 或 Ctrl+Shift+P (Windows)"
    echo "  2. 输入 'Reload Window'"
    echo "  3. 按回车"
    echo ""
    
    echo "【方法2】完全重启 VS Code"
    echo "  1. 完全退出 VS Code (Cmd+Q)"
    echo "  2. 重新打开项目"
    echo ""
    
    echo "【方法3】使用快捷命令（自动执行）"
    read -p "是否立即重新加载 VS Code 窗口？(y/N): " reload_choice
    if [[ "$reload_choice" =~ ^[Yy]$ ]]; then
        print_info "正在尝试重新加载 VS Code..."
        # 检测当前是否在 VS Code 终端中运行
        if [ -n "$VSCODE_PID" ] || [ -n "$TERM_PROGRAM" ]; then
            # 通过 code 命令重新加载窗口
            if command -v code &> /dev/null; then
                code --reuse-window "$project_path"
                print_success "已发送重载命令到 VS Code"
            else
                print_warning "未找到 code 命令，请手动重载窗口"
            fi
        else
            print_warning "未检测到 VS Code 环境，请手动重载窗口"
        fi
    fi
    echo ""
    
    print_info "✅ 验证 MCP 是否生效："
    echo "  1. 打开 Copilot Chat (Cmd/Ctrl + Shift + I)"
    echo "  2. 输入: '@workspace 列出可用的编码规范工具'"
    echo "  3. 应该能看到 get_relevant_standards 等工具"
    echo ""
    
    print_info "💡 使用示例："
    echo "  - 在 Vue 文件中，Copilot 会自动获取 Vue3 规范"
    echo "  - 在 TypeScript 文件中，会自动获取 TS 规范"
    echo "  - Chat 提问会自动应用项目配置"
    echo ""
}

# 执行主函数
main "$@"
