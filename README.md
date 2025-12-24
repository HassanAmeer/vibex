# VibeAll - AI Coding Assistant

🚀 The Ultimate VS Code Extension for Vibe Coding with Multiple AI Providers

## Features

- 🤖 **Multi-Provider Support**: Groq, Google Gemini, Cerebras, SambaNova, OpenAI, Anthropic
- ⚡ **Smart Failover**: Automatically switches providers if one fails
- 🎨 **Beautiful UI**: Deep orange gradient theme with smooth animations
- 📊 **Usage Dashboard**: Track your API usage across all providers
- 🔑 **Secure API Keys**: Encrypted storage using VS Code SecretStorage
- 💬 **Context-Aware Chat**: Understands your code and workspace
- ✨ **Code Application**: Apply AI-generated code directly to files
- 📋 **Activity Logs**: Real-time logging of all actions
- 🎯 **Toast Notifications**: Visual feedback for all operations

## Version 1.0.2

### New Features:
- ✅ Toast notification system
- ✅ Activity logs panel with filtering
- ✅ Pre-filled Cerebras API key
- ✅ Comprehensive logging (frontend + backend)
- ✅ Enhanced error handling
- ✅ Visual success confirmations

## Installation

1. Download `vibeall-v1.0.2.vsix`
2. Open VS Code
3. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
4. Type "Install from VSIX"
5. Select the downloaded file
6. Reload VS Code

## Usage

1. Click the 🚀 icon in the sidebar
2. Click ⚙️ to open settings
3. Add your API keys (Cerebras key is pre-filled!)
4. Start chatting with AI
5. Click 📋 to view activity logs

## API Keys

Get free API keys from:
- **Groq**: https://console.groq.com
- **Google Gemini**: https://makersuite.google.com/app/apikey
- **Cerebras**: https://cloud.cerebras.ai
- **SambaNova**: https://cloud.sambanova.ai
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com

## Development

```bash
npm install
npm run compile
# Press F5 to test
```

## Build

```bash
npm run package
npx @vscode/vsce package
```

## License

MIT

## Support

For issues and feature requests, please visit our GitHub repository.

---

Made with ❤️ for the coding community
