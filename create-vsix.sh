#!/bin/bash
# Create VSIX package without using npm run

echo "📦 Creating VSIX Package..."
echo ""

cd /Users/mac/.vscode/extensions/vibeall || exit 1

# Make sure it's built first
if [ ! -f "dist/extension.js" ]; then
    echo "⚠️  Extension not built yet. Building first..."
    ./build-extension.sh
fi

echo "🎁 Packaging extension..."
/usr/local/bin/npx -y @vscode/vsce package --out vibeall-v1.0.2.vsix

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ VSIX CREATED SUCCESSFULLY!"
    echo ""
    ls -lh vibeall-v1.0.2.vsix
    echo ""
    echo "📍 Location: $(pwd)/vibeall-v1.0.2.vsix"
    echo ""
    echo "🚀 To Install:"
    echo "  1. Cmd+Shift+P → 'Install from VSIX'"
    echo "  2. Select: vibeall-v1.0.2.vsix"
else
    echo "❌ Packaging failed"
    exit 1
fi
