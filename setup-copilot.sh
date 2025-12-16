#!/bin/bash

# Copilot Prompts 自动配置脚本
# 用途：分析项目并自动生成/应用编码规范
# 维护者：MTA团队（蘑菇与吐司的AI团队）

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
  -c, --config <配置ID>    使用指定的配置方案（如 vitasage）
  -a, --auto              自动分析项目并生成配置
  -l, --list              列出所有可用配置
  -h, --help              显示帮助信息

示例:
  $0 /path/to/project                    # 交互式配置
  $0 -a /path/to/project                 # 自动分析并配置
  $0 -c vitasage /path/to/VitaSage      # 使用 vitasage 配置
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
    
    print_info "正在分析项目技术栈..."
    
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
    
    echo "${tech_stack[@]}"
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

# 生成 .github/copilot-instructions.md
generate_copilot_instructions() {
    local project_path=$1
    local config_id=$2
    local tech_stack=$3
    
    local github_dir="$project_path/.github"
    local instructions_file="$github_dir/copilot-instructions.md"
    
    mkdir -p "$github_dir"
    
    print_info "生成 copilot-instructions.md..."
    
    cat > "$instructions_file" << EOF
# 项目开发规范 - Copilot 指令

> 自动生成时间: $(date +%Y-%m-%d)  
> 配置方案: $config_id

## 🎯 核心原则

1. **类型安全** - 充分利用类型系统
2. **代码一致性** - 遵循项目现有风格
3. **最小改动** - 只修改必要的代码
4. **错误处理** - 完善的异常处理机制

---

## 🛠️ 技术栈

检测到的技术栈: $tech_stack

---

## 📋 应用的规范

### 自动加载规范

通过 MCP 工具自动加载相关规范：

EOF

    # 根据技术栈添加规范引用
    if [[ "$tech_stack" == *"vue"* ]]; then
        cat >> "$instructions_file" << EOF
- **Vue 3 规范**: \`get_relevant_standards({ fileType: "vue" })\`
EOF
    fi
    
    if [[ "$tech_stack" == *"typescript"* ]]; then
        cat >> "$instructions_file" << EOF
- **TypeScript 规范**: \`get_relevant_standards({ fileType: "ts" })\`
EOF
    fi
    
    if [[ "$tech_stack" == *"element-plus"* ]]; then
        cat >> "$instructions_file" << EOF
- **Element Plus 规范**: \`get_relevant_standards({ imports: ["element-plus"], config: "$config_id" })\`

**Element Plus 配置方案**: \`$config_id\`
EOF
    fi
    
    if [[ "$tech_stack" == *"i18n"* ]]; then
        cat >> "$instructions_file" << EOF
- **国际化规范**: \`get_relevant_standards({ scenario: "国际化" })\`

**国际化要求**: 所有 UI 文本必须使用 \`\$t()\` 函数
EOF
    fi
    
    if [[ "$tech_stack" == *"pinia"* ]]; then
        cat >> "$instructions_file" << EOF
- **状态管理规范**: \`get_relevant_standards({ imports: ["pinia"] })\`
EOF
    fi
    
    # 添加 API 层规范
    cat >> "$instructions_file" << EOF

### API 层规范

- **API 调用**: \`get_relevant_standards({ scenario: "API 调用" })\`

---

## 📝 工作流

1. **代码生成前**: 自动检查是否符合项目规范
2. **代码生成中**: 优先使用项目现有模式
3. **代码生成后**: 自我检查类型安全和代码风格

---

**维护团队**: MTA团队（蘑菇与吐司的AI团队）  
**配置版本**: 1.0.0  
**更新日期**: $(date +%Y-%m-%d)
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
                config_id="standard"
                print_info "自动选择配置: $config_id"
            else
                config_id="generic"
                print_info "使用通用配置: $config_id"
            fi
        else
            # 交互式选择
            echo "请选择配置方案:"
            echo "  1) standard - 标准配置"
            echo "  2) vitasage - VitaSage 配置"
            echo "  3) custom - 自定义配置"
            read -p "请输入选项 (1-3): " choice
            
            case $choice in
                1) config_id="standard" ;;
                2) config_id="vitasage" ;;
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
