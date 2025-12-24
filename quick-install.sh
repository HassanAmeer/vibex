#!/bin/bash
# Quick fix for dependencies - bypasses terminal issues

EXTENSION_DIR="/Users/mac/.vscode/extensions/vibeall"

echo "🔧 Installing React types and dependencies..."
echo ""

# Install using absolute path
cd "$EXTENSION_DIR" 2>/dev/null || {
    echo "Using absolute path installation..."
    /usr/local/bin/npm install --prefix "$EXTENSION_DIR" \
        react@^18.2.0 \
        react-dom@^18.2.0 \
        @types/react@^18.2.0 \
        @types/react-dom@^18.2.0 \
        @types/vscode@^1.85.0 \
        @types/node@20.x \
        typescript@^5.3.3 \
        webpack@^5.89.0 \
        webpack-cli@^5.1.4 \
        ts-loader@^9.5.1 \
        css-loader@^6.8.1 \
        style-loader@^3.3.3
    exit 0
}

# If cd worked, use normal npm
npm install

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "Now run: npm run compile"
