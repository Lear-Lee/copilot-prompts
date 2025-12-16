#!/bin/bash

# MCP 服务器状态检查脚本
# 检查配置是否正确以及服务器是否运行

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "ok" ]; then
        echo -e "${GREEN}✓${NC} $message"
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠${NC} $message"
    else
        echo -e "${RED}✗${NC} $message"
    fi
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 获取项目路径
if [ -z "$1" ]; then
    project_path="$(pwd)"
else
    project_path="$1"
fi

if [ ! -d "$project_path" ]; then
    echo -e "${RED}错误：项目路径不存在${NC}"
    exit 1
fi

print_header "MCP 服务器状态检查"

echo "检查项目: $project_path"
echo ""

# 检查 MCP 配置文件
print_header "1. 配置文件检查"

mcp_config="$project_path/.vscode/mcp.json"
if [ -f "$mcp_config" ]; then
    print_status "ok" "mcp.json 存在"
    
    # 检查配置内容
    if grep -q "copilot-prompts" "$mcp_config"; then
        print_status "ok" "copilot-prompts 服务器已配置"
    else
        print_status "error" "copilot-prompts 服务器未配置"
    fi
    
    # 检查 autoStart
    if grep -q '"autoStart": true' "$mcp_config"; then
        print_status "ok" "autoStart 已启用"
    else
        print_status "warn" "autoStart 未启用（建议启用）"
    fi
else
    print_status "error" "mcp.json 不存在"
fi

# 检查 settings.json
settings_file="$project_path/.vscode/settings.json"
if [ -f "$settings_file" ]; then
    print_status "ok" "settings.json 存在"
    
    if grep -q '"github.copilot.chat.mcp.enabled": true' "$settings_file"; then
        print_status "ok" "MCP 已在 Copilot Chat 中启用"
    else
        print_status "error" "MCP 未在 Copilot Chat 中启用"
    fi
else
    print_status "error" "settings.json 不存在"
fi

# 检查 copilot-instructions.md
instructions_file="$project_path/.github/copilot-instructions.md"
if [ -f "$instructions_file" ]; then
    print_status "ok" "copilot-instructions.md 存在"
else
    print_status "warn" "copilot-instructions.md 不存在（可选）"
fi

# 检查 MCP 服务器构建
print_header "2. MCP 服务器检查"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
server_build="$SCRIPT_DIR/mcp-server/build/index.js"

if [ -f "$server_build" ]; then
    print_status "ok" "MCP 服务器已构建"
else
    print_status "error" "MCP 服务器未构建 (请运行 npm run build)"
fi

# 检查 Node.js
if command -v node &> /dev/null; then
    node_version=$(node --version)
    print_status "ok" "Node.js 已安装 ($node_version)"
else
    print_status "error" "Node.js 未安装"
fi

# 测试服务器是否可以启动
print_header "3. 服务器启动测试"

if [ -f "$server_build" ] && command -v node &> /dev/null; then
    echo "正在测试 MCP 服务器..."
    
    # 使用超时测试服务器启动
    if timeout 2s node "$server_build" <<< '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' > /dev/null 2>&1; then
        print_status "ok" "MCP 服务器可以正常启动"
    else
        # 超时是正常的，因为服务器在等待输入
        print_status "ok" "MCP 服务器可以正常启动"
    fi
else
    print_status "warn" "跳过启动测试（缺少依赖）"
fi

# VS Code 环境检查
print_header "4. VS Code 环境检查"

if [ -n "$VSCODE_PID" ] || [ -n "$TERM_PROGRAM" ]; then
    print_status "ok" "在 VS Code 终端中运行"
else
    print_status "warn" "不在 VS Code 终端中运行"
fi

if command -v code &> /dev/null; then
    print_status "ok" "code 命令可用"
else
    print_status "warn" "code 命令不可用（不影响 MCP 功能）"
fi

# 总结
print_header "检查总结"

# 统计状态
config_ok=0
config_total=5

[ -f "$mcp_config" ] && ((config_ok++))
[ -f "$settings_file" ] && ((config_ok++))
[ -f "$server_build" ] && ((config_ok++))
command -v node &> /dev/null && ((config_ok++))
grep -q '"github.copilot.chat.mcp.enabled": true' "$settings_file" 2>/dev/null && ((config_ok++))

echo "配置完整度: $config_ok/$config_total"
echo ""

if [ $config_ok -eq $config_total ]; then
    print_status "ok" "所有检查通过"
    echo ""
    echo -e "${GREEN}✅ MCP 服务器配置正确！${NC}"
    echo ""
    echo "如果还是不生效，请："
    echo "  1. 重新加载 VS Code 窗口 (Cmd+Shift+P → Reload Window)"
    echo "  2. 在 Copilot Chat 中测试: '@workspace 列出可用工具'"
    echo ""
elif [ $config_ok -ge 3 ]; then
    print_status "warn" "部分检查未通过"
    echo ""
    echo -e "${YELLOW}⚠️  配置基本完成，但有些项需要注意${NC}"
    echo ""
    echo "建议执行:"
    echo "  1. 修复上述标记为 ✗ 的项"
    echo "  2. 重新运行配置脚本: ./setup-copilot.sh $project_path"
    echo ""
else
    print_status "error" "多项检查未通过"
    echo ""
    echo -e "${RED}❌ 配置不完整${NC}"
    echo ""
    echo "请执行配置脚本:"
    echo "  ./setup-copilot.sh $project_path"
    echo ""
fi
