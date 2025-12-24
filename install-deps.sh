#!/bin/bash
# VibeAll Extension - Install Dependencies (bypasses uv_cwd error)

echo "📦 Installing VibeAll Extension Dependencies"
echo "============================================="
echo ""

# Use absolute path to avoid uv_cwd error
EXTENSION_DIR="/Users/mac/.vscode/extensions/vibeall"

echo "📍 Extension directory: $EXTENSION_DIR"
echo ""

# Change to extension directory using absolute path
cd "$EXTENSION_DIR" || exit 1

# Run npm install with explicit working directory
echo "⬇️  Installing dependencies..."
/usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js install --prefix "$EXTENSION_DIR"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "🔨 Now compiling..."
    /usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js run compile --prefix "$EXTENSION_DIR"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ BUILD COMPLETE!"
        echo ""
        echo "🚀 Next steps:"
        echo "  1. Press F5 in VS Code to test"
        echo "  2. Or run: ./create-vsix.sh to package"
    else
        echo ""
        echo "❌ Compilation failed"
        exit 1
    fi
else
    echo ""
    echo "❌ Installation failed"
    exit 1
fi
