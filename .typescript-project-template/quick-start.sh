#!/bin/bash

###############################################################################
# TypeScript Project Quick Start Script
# Last Updated: October 16, 2025
#
# Usage: ./quick-start.sh /path/to/your/new/project
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if target directory is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: No target directory provided${NC}"
  echo "Usage: ./quick-start.sh /path/to/your/new/project"
  exit 1
fi

TARGET_DIR="$1"
TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}🚀 TypeScript Project Quick Start${NC}"
echo "Template: $TEMPLATE_DIR"
echo "Target: $TARGET_DIR"
echo ""

# Create target directory if it doesn't exist
if [ ! -d "$TARGET_DIR" ]; then
  echo -e "${YELLOW}Creating target directory...${NC}"
  mkdir -p "$TARGET_DIR"
fi

cd "$TARGET_DIR"

# Copy template files
echo -e "${GREEN}📦 Copying template files...${NC}"

echo "  → .husky/"
cp -r "$TEMPLATE_DIR/.husky" .

echo "  → .github/"
cp -r "$TEMPLATE_DIR/.github" .

echo "  → .vscode/"
cp -r "$TEMPLATE_DIR/.vscode" .

echo "  → Configuration files"
cp "$TEMPLATE_DIR/.lintstagedrc.js" .
cp "$TEMPLATE_DIR/.eslintrc.js" .
cp "$TEMPLATE_DIR/.prettierrc.js" .
cp "$TEMPLATE_DIR/tsconfig.json" .

echo "  → Documentation"
cp "$TEMPLATE_DIR/DEVELOPMENT_WORKFLOW.md" .
cp "$TEMPLATE_DIR/SETUP_CHECKLIST.md" .

# Handle package.json
if [ -f "package.json" ]; then
  echo -e "${YELLOW}⚠️  package.json already exists${NC}"
  echo "  → Saving template as package.template.json"
  cp "$TEMPLATE_DIR/package.template.json" ./package.template.json
  echo "  → Please merge dependencies manually"
else
  echo "  → package.json"
  cp "$TEMPLATE_DIR/package.template.json" ./package.json
fi

# Make husky hooks executable
echo -e "${GREEN}🔧 Making hooks executable...${NC}"
chmod +x .husky/pre-commit
chmod +x .husky/pre-push

# Initialize git if not already initialized
if [ ! -d ".git" ]; then
  echo -e "${GREEN}📁 Initializing Git repository...${NC}"
  git init
fi

echo ""
echo -e "${GREEN}✅ Template copied successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. cd $TARGET_DIR"
echo "  2. pnpm install"
echo "  3. pnpm prepare"
echo "  4. Review SETUP_CHECKLIST.md"
echo ""
echo -e "${GREEN}Happy coding with zero TypeScript errors! 🎉${NC}"
