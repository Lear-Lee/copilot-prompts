#!/bin/bash
# 构建和安装脚本
set -e

echo "📦 编译 TypeScript..."
npm run compile

echo "📦 打包插件..."
vsce package

echo "✅ 安装插件..."
VSIX=$(ls -t copilot-prompts-manager-*.vsix | head -1)
code --install-extension "$VSIX" --force

echo "✅ 构建完成！请重启 VS Code。"
