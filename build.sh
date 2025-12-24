#!/bin/bash
# VibeAll Extension - Build and Package Script

echo "🚀 Building VibeAll Extension v1.0.2"
echo "====================================="
echo ""

cd "$(dirname "$0")"

echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔨 Compiling TypeScript..."
npm run compile

echo ""
echo "✅ Build complete!"
echo ""
echo "📍 Next steps:"
echo "  1. Press F5 to test in VS Code"
echo "  2. Or run: npx @vscode/vsce package"
echo ""
