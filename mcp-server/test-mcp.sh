#!/bin/bash

# Copilot Prompts MCP Server 测试脚本

echo "🧪 测试 MCP 服务器..."
echo ""

# 测试项目路径
TEST_PROJECT="/Users/pailasi/Work/VitaSage"

if [ ! -d "$TEST_PROJECT" ]; then
    echo "❌ 测试项目不存在: $TEST_PROJECT"
    exit 1
fi

echo "✅ 测试项目存在: $TEST_PROJECT"
echo ""

# 检查编译产物
if [ ! -f "build/index.js" ]; then
    echo "❌ MCP 服务器未编译，正在编译..."
    npm run build
fi

echo "✅ MCP 服务器已编译"
echo ""

# 测试 analyze_project 工具
echo "📊 测试 1: 分析项目"
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"analyze_project","arguments":{"projectPath":"'$TEST_PROJECT'"}}}' | node build/index.js 2>&1 | head -n 20

echo ""
echo "---"
echo ""

# 测试 list_available_agents 工具  
echo "📋 测试 2: 列出可用 Agents"
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | node build/index.js 2>&1 | head -n 30

echo ""
echo "✅ 测试完成！"
echo ""
echo "💡 下一步："
echo "1. 重启 Claude Desktop"
echo "2. 在对话中尝试: '分析 $TEST_PROJECT 项目'"
echo "3. 或尝试: '为 $TEST_PROJECT 生成 Copilot 配置'"
