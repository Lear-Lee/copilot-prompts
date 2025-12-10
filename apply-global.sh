#!/bin/bash

# Copilot Prompts - 全局配置应用脚本
# 用法: ./apply-global.sh

set -e

PROMPTS_DIR="/Users/pailasi/Work/copilot-prompts"
GLOBAL_CONFIG="$HOME/.vscode/copilot-instructions.md"

echo "🔧 应用 Copilot Prompts 到全局配置..."
echo ""

# 创建目录
mkdir -p "$HOME/.vscode"

# 备份旧配置
if [ -f "$GLOBAL_CONFIG" ]; then
    BACKUP="$GLOBAL_CONFIG.backup.$(date +%s)"
    cp "$GLOBAL_CONFIG" "$BACKUP"
    echo "✅ 已备份旧配置: $BACKUP"
fi

# 生成新配置
cat > "$GLOBAL_CONFIG" <<EOF
# AI 开发指南 (全局配置)

> 本文件自动生成，仅在本机生效，不会提交到 Git

---

EOF

# 追加所有默认 agents
cat "$PROMPTS_DIR/agents/vitasage.agent.md" >> "$GLOBAL_CONFIG"
echo "" >> "$GLOBAL_CONFIG"
echo "---" >> "$GLOBAL_CONFIG"
echo "" >> "$GLOBAL_CONFIG"

cat "$PROMPTS_DIR/agents/vue3.agent.md" >> "$GLOBAL_CONFIG"
echo "" >> "$GLOBAL_CONFIG"
echo "---" >> "$GLOBAL_CONFIG"
echo "" >> "$GLOBAL_CONFIG"

cat "$PROMPTS_DIR/agents/typescript.agent.md" >> "$GLOBAL_CONFIG"
echo "" >> "$GLOBAL_CONFIG"
echo "---" >> "$GLOBAL_CONFIG"
echo "" >> "$GLOBAL_CONFIG"

cat "$PROMPTS_DIR/agents/i18n.agent.md" >> "$GLOBAL_CONFIG"
echo "" >> "$GLOBAL_CONFIG"

# 添加元信息
cat >> "$GLOBAL_CONFIG" <<EOF

---

## 📋 应用的 Agents

- VitaSage Agent
- Vue 3 Agent  
- TypeScript Agent
- i18n Agent

生成时间: $(date '+%Y-%m-%d %H:%M:%S')
配置位置: $GLOBAL_CONFIG
EOF

echo ""
echo "✅ 全局配置已更新!"
echo "📍 位置: $GLOBAL_CONFIG"
echo "📊 大小: $(du -h "$GLOBAL_CONFIG" | cut -f1)"
echo "📝 行数: $(wc -l < "$GLOBAL_CONFIG") 行"
echo ""
echo "🔄 请重新加载 VS Code 使配置生效:"
echo "   Cmd + Shift + P → Developer: Reload Window"
echo ""
