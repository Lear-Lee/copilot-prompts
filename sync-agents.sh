#!/bin/zsh
# 同步 Custom Agents 到项目
# 用法: ./sync-agents.sh [project-path]

PROMPTS_DIR="/Users/pailasi/Work/copilot-prompts"
PROJECT_DIR="${1:-.}"

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "${BLUE}🔄 同步 Custom Agents 到项目${NC}"
echo "Prompts 仓库: $PROMPTS_DIR"
echo "目标项目: $PROJECT_DIR"
echo ""

# 检查目标目录
if [ ! -d "$PROJECT_DIR" ]; then
  echo "❌ 错误: 目录不存在 $PROJECT_DIR"
  exit 1
fi

# 创建 agents 目录
mkdir -p "$PROJECT_DIR/.github/agents"

# 复制 agent 文件
echo "${BLUE}📋 复制 agent 文件...${NC}"

agents=(
  "vitasage.agent.md"
  "vue3.agent.md"
  "typescript.agent.md"
  "i18n.agent.md"
)

for agent in "${agents[@]}"; do
  if [ -f "$PROMPTS_DIR/agents/$agent" ]; then
    cp "$PROMPTS_DIR/agents/$agent" "$PROJECT_DIR/.github/agents/"
    echo "${GREEN}✅${NC} $agent"
  else
    echo "⚠️  跳过 $agent (不存在)"
  fi
done

echo ""
echo "${GREEN}✅ 同步完成！${NC}"
echo ""
echo "💡 使用方法:"
echo "   1. 在 VS Code 中打开 Copilot Chat (Cmd+Shift+I)"
echo "   2. 输入 @vitasage 或 @vue3 或 @typescript 或 @i18n"
echo "   3. Agent 会根据对应规范生成代码"
echo ""
echo "🔄 更新 agents:"
echo "   cd $PROMPTS_DIR"
echo "   git pull origin main"
echo "   ./sync-agents.sh $PROJECT_DIR"
