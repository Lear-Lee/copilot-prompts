#!/bin/bash

# 测试"选择目标工作区并应用配置"功能
# 验证配置文件是否正确生成到指定工作区

echo "======================================"
echo "测试: 选择目标工作区并应用配置"
echo "======================================"
echo ""

# 定义测试项目
PROJECTS=(
    "/Users/pailasi/Work/weipin"
    "/Users/pailasi/Work/VitaSage"
    "/Users/pailasi/Work/Omipay.userCenter"
)

# 测试函数
test_project() {
    local project_path=$1
    local project_name=$(basename "$project_path")
    
    echo "📁 测试项目: $project_name"
    echo "路径: $project_path"
    
    # 检查 .github 目录
    if [ ! -d "$project_path/.github" ]; then
        echo "❌ .github 目录不存在"
        return 1
    fi
    echo "✅ .github 目录存在"
    
    # 检查配置文件
    local config_file="$project_path/.github/copilot-instructions.md"
    if [ ! -f "$config_file" ]; then
        echo "❌ copilot-instructions.md 文件不存在"
        return 1
    fi
    echo "✅ copilot-instructions.md 存在"
    
    # 检查文件头部警告
    if grep -q "此文件由 Copilot Prompts Manager 插件自动生成" "$config_file"; then
        echo "✅ 包含自动生成警告"
    else
        echo "⚠️  缺少自动生成警告"
    fi
    
    # 检查配置列表
    if grep -q "## 📋 应用的 Prompt 列表" "$config_file"; then
        echo "✅ 包含配置列表"
        
        # 统计配置数量
        local count=$(grep -c "^- \*\*.*\*\* (" "$config_file" || echo "0")
        echo "   配置数量: $count 个"
    else
        echo "❌ 缺少配置列表"
    fi
    
    # 检查 .gitignore
    local gitignore_file="$project_path/.gitignore"
    if [ -f "$gitignore_file" ]; then
        if grep -q ".github/copilot-instructions.md" "$gitignore_file"; then
            echo "✅ 已添加到 .gitignore"
        else
            echo "⚠️  未添加到 .gitignore"
        fi
    else
        echo "⚠️  .gitignore 文件不存在"
    fi
    
    # 文件大小
    local file_size=$(ls -lh "$config_file" | awk '{print $5}')
    echo "   文件大小: $file_size"
    
    # 最后修改时间
    local mod_time=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M:%S" "$config_file")
    echo "   最后修改: $mod_time"
    
    echo ""
    return 0
}

# 测试所有项目
echo "开始测试..."
echo ""

SUCCESS=0
FAILED=0

for project in "${PROJECTS[@]}"; do
    if test_project "$project"; then
        ((SUCCESS++))
    else
        ((FAILED++))
    fi
    echo "--------------------------------------"
    echo ""
done

# 总结
echo "======================================"
echo "测试总结"
echo "======================================"
echo "✅ 通过: $SUCCESS 个项目"
echo "❌ 失败: $FAILED 个项目"
echo ""

# 额外验证：比较配置内容
echo "======================================"
echo "配置内容验证"
echo "======================================"
echo ""

echo "weipin 项目的配置:"
grep "## 📋 应用的 Prompt 列表" -A 15 /Users/pailasi/Work/weipin/.github/copilot-instructions.md | grep "^- \*\*"
echo ""

echo "VitaSage 项目的配置:"
grep "## 📋 应用的 Prompt 列表" -A 15 /Users/pailasi/Work/VitaSage/.github/copilot-instructions.md | grep "^- \*\*"
echo ""

echo "Omipay.userCenter 项目的配置:"
grep "## 📋 应用的 Prompt 列表" -A 15 /Users/pailasi/Work/Omipay.userCenter/.github/copilot-instructions.md | grep "^- \*\*"
echo ""

# 测试工具栏按钮是否存在
echo "======================================"
echo "检查插件命令注册"
echo "======================================"
echo ""

# 检查 package.json 中的命令
if [ -f "/Users/pailasi/Work/copilot-prompts/vscode-extension/package.json" ]; then
    echo "检查 selectTarget 命令:"
    if grep -q "copilotPrompts.selectTarget" /Users/pailasi/Work/copilot-prompts/vscode-extension/package.json; then
        echo "✅ selectTarget 命令已注册"
        
        # 检查是否在菜单中
        if grep -A 5 "copilotPrompts.selectTarget" /Users/pailasi/Work/copilot-prompts/vscode-extension/package.json | grep -q "view == copilotPromptsTree"; then
            echo "✅ selectTarget 命令已添加到菜单"
        else
            echo "❌ selectTarget 命令未添加到菜单"
        fi
    else
        echo "❌ selectTarget 命令未注册"
    fi
fi

echo ""
echo "======================================"
echo "测试完成"
echo "======================================"
