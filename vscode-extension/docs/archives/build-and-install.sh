#!/bin/zsh
# Copilot Prompts Manager v1.2.0 - 编译和安装脚本

echo "🚀 开始编译 Copilot Prompts Manager v1.2.0..."
echo ""

cd "$(dirname "$0")"

# 1. 安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 2. 编译 TypeScript
echo "🔨 编译 TypeScript..."
npm run fetch:latest
npm run compile

if [ $? -ne 0 ]; then
    echo "❌ 编译失败"
    exit 1
fi

# 3. 打包扩展
echo "📦 打包扩展..."
npx vsce package --out copilot-prompts-manager-1.2.0.vsix

if [ $? -ne 0 ]; then
    echo "❌ 打包失败"
    exit 1
fi

echo ""
echo "✅ 编译成功！"
echo ""

# 4. 询问是否安装
read "install?是否立即安装到 VS Code? (y/n): "

if [[ $install == "y" || $install == "Y" ]]; then
    echo ""
    echo "📥 安装到 VS Code..."
    code --install-extension copilot-prompts-manager-1.2.0.vsix --force
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 安装成功！"
        echo ""
        echo "📋 更新内容 (v1.2.0):"
        echo "  ✅ 新增配置问题检查功能"
        echo "  ✅ 自动检测多文件夹工作区冲突"
        echo "  ✅ 移除全局应用按钮（自动应用到当前项目）"
        echo "  ✅ 备份文件检测和恢复"
        echo ""
        read "reload?是否重新加载 VS Code 窗口? (y/n): "
        
        if [[ $reload == "y" || $reload == "Y" ]]; then
            osascript -e 'tell application "Visual Studio Code" to activate'
            osascript -e 'tell application "System Events" to keystroke "r" using {command down, shift down}'
        else
            echo ""
            echo "💡 提示: 请手动重新加载 VS Code"
            echo "   Cmd + Shift + P → Developer: Reload Window"
        fi
    else
        echo "❌ 安装失败"
        exit 1
    fi
else
    echo ""
    echo "💡 手动安装命令:"
    echo "   code --install-extension copilot-prompts-manager-1.2.0.vsix --force"
fi

echo ""
echo "📖 查看更新日志:"
echo "   cat CHANGELOG-v1.2.0.md"
echo ""
