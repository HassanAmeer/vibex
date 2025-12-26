# VibeAll - AI-Powered Vibe Coding Extension

[![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)](https://github.com/HassanAmeer/vibex)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

> The ultimate VS Code extension for "vibe coding" with AI - featuring intelligent code generation, real-time analysis, and seamless file management.

## ✨ Features

### 🤖 Multi-Model AI Support
- **10+ AI Providers**: Groq, OpenAI, Google, Cerebras, SambaNova, Anthropic, xAI, Novita, Bytez, AimlAPI, OpenRouter
- **Free Tier Models**: Access powerful models like Llama 3.3 70B, Gemini Flash, and more
- **Smart Model Selection**: Breadcrumb-style model picker for easy switching
- **Reasoning Support**: Advanced thinking models with detailed reasoning output

### 📁 Intelligent File Operations
- **Automated Code Generation**: Generate complete projects from simple prompts
- **Real-time Progress Tracking**: See exactly which files are being created
- **Code Analysis**: Automatic quality and security checks on generated code
- **Project Templates**: Quick-start templates for React, Node.js, and more
- **Sandbox Testing**: Isolated `/gen` folder for safe experimentation

### 🔍 Code Analysis & Quality
- **Complexity Metrics**: Track cyclomatic complexity and maintainability
- **Security Scanning**: Detect common vulnerabilities (XSS, code injection, hardcoded secrets)
- **Best Practices**: Get suggestions for code improvements
- **Error Detection**: Find potential issues before runtime

### 🎨 Modern UI/UX
- **Glassmorphic Design**: Beautiful, modern interface
- **Dark Mode First**: Optimized for comfortable coding
- **Real-time Feedback**: Live progress indicators and status updates
- **Responsive Layout**: Works seamlessly in any VS Code layout

### ⚙️ Advanced Settings
- **Secure API Key Management**: Encrypted storage with visibility toggle
- **Theme Customization**: Multiple color schemes
- **Session Analytics**: Track usage, tokens, and model performance
- **Comprehensive Logging**: Debug and monitor all operations

## 🚀 Quick Start

### Installation

1. **Download the VSIX**:
   ```bash
   # Clone the repository
   git clone https://github.com/HassanAmeer/vibex.git
   cd vibex
   
   # Install dependencies
   npm install
   
   # Build the extension
   npm run compile
   
   # Package as VSIX
   npx @vscode/vsce package
   ```

2. **Install in VS Code**:
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type "Extensions: Install from VSIX..."
   - Select the `vibeall-1.0.2.vsix` file

### Configuration

1. **Add API Keys**:
   - Click the ⚙️ Settings icon in the extension
   - Enter your API keys for desired providers
   - Keys are stored securely in VS Code's secret storage

2. **Select a Model**:
   - Click the model breadcrumb at the bottom
   - Choose your provider → Select your model
   - Start chatting!

## 💡 Usage Examples

### Generate a Complete Project

```
Prompt: "Create a Todo app with React, TypeScript, and Tailwind CSS"
```

The extension will:
1. Show a plan of all files to be created
2. Create project structure with proper folders
3. Generate all necessary files (components, styles, config)
4. Analyze code for quality and security
5. Provide feedback on potential improvements

### Analyze Existing Code

```
Prompt: "Analyze the code in src/App.tsx for security issues"
```

Get instant feedback on:
- Security vulnerabilities
- Code complexity
- Best practice violations
- Optimization opportunities

### Quick Prototyping

```
Prompt: "Create a simple Express API with user authentication"
```

Files are created in the `/gen` folder for safe testing before moving to your main project.

## 🛠️ Development

### Project Structure

```
vibex/
├── src/
│   ├── api/              # AI provider clients
│   ├── managers/         # Core functionality
│   ├── utils/            # Helper utilities
│   ├── webview/          # React UI components
│   └── extension.ts      # Main extension entry
├── dist/                 # Compiled output
├── media/                # Icons and assets
└── docs/                 # Documentation
```

### Build Commands

```bash
# Development mode with hot reload
npm run web

# Compile TypeScript
npm run compile

# Watch mode
npm run watch

# Production build
npm run package

# Create VSIX package
npx @vscode/vsce package
```

### Adding New Features

1. **New AI Provider**:
   - Add client in `src/api/`
   - Register in `ModelClient.ts`
   - Add models to `src/constants/models.ts`

2. **New Template**:
   - Add to `src/utils/ProjectTemplates.ts`
   - Define file structure and content

3. **UI Component**:
   - Create in `src/webview/components/`
   - Import in `App.tsx`

## 📊 Code Analysis Features

### Metrics Tracked
- **Lines of Code**: Total line count
- **Cyclomatic Complexity**: Measure of code complexity
- **Maintainability Score**: 0-100 rating

### Security Checks
- ✅ XSS vulnerabilities (innerHTML usage)
- ✅ Code injection (eval usage)
- ✅ Hardcoded credentials
- ✅ Unsafe patterns

### Best Practices
- ✅ Prefer const/let over var
- ✅ Use === instead of ==
- ✅ Add error handling for async code
- ✅ Document functions with JSDoc

## 🔐 Security & Privacy

- **Local-First**: All processing happens on your machine
- **Encrypted Storage**: API keys are encrypted
- **No Telemetry**: We don't collect any usage data
- **Sandboxed Execution**: File operations are restricted to workspace

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 Changelog

### v1.0.2 (Current)
- ✨ Added OpenRouter AI models support
- ✨ Implemented intelligent code analysis
- ✨ Added project template system
- ✨ Enhanced file operation progress tracking
- ✨ Improved error handling and logging
- 🐛 Fixed code block parsing issues
- 🐛 Improved tool execution reliability

### v1.0.1
- ✨ Added multiple AI provider support
- ✨ Implemented breadcrumb model selector
- ✨ Added session analytics
- 🎨 Redesigned UI with glassmorphism

### v1.0.0
- 🎉 Initial release
- ✨ Basic chat functionality
- ✨ File generation support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- All the amazing AI providers for their APIs
- VS Code team for the excellent extension API
- React team for the UI framework
- The open-source community

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/HassanAmeer/vibex/issues)
- **Discussions**: [GitHub Discussions](https://github.com/HassanAmeer/vibex/discussions)
- **Email**: support@vibeall.dev

## 🌟 Star History

If you find this project useful, please consider giving it a star on GitHub!

---

Made with ❤️ by the VibeAll team
