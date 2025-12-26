#!/bin/bash
# Create VSIX package without using npm run

echo "📦 Creating VSIX Package..."
echo ""

cd /Users/mac/Documents/react/vibex || exit 1

# Make sure it's built first
if [ ! -f "dist/extension.js" ]; then
    echo "⚠️  Extension not built yet. Building first..."
    ./build.sh
fi

echo "🎁 Packaging extension..."
/usr/local/bin/npx -y @vscode/vsce package --out vibex-v1.0.2.vsix

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ VSIX CREATED SUCCESSFULLY!"
    echo ""
    ls -lh vibex-v1.0.2.vsix
    echo ""
    echo "📍 Location: $(pwd)/vibex-v1.0.2.vsix"
    echo ""
    echo "🚀 To Install:"
    echo "  1. Cmd+Shift+P → 'Install from VSIX'"
    echo "  2. Select: vibex-v1.0.2.vsix"
else
    echo "❌ Packaging failed"
    exit 1
fi
