/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(__webpack_require__(1));
const path = __importStar(__webpack_require__(2));
const StorageManager_1 = __webpack_require__(3);
const ContextManager_1 = __webpack_require__(4);
const FileSystemManager_1 = __webpack_require__(5);
const ModelClient_1 = __webpack_require__(7);
function activate(context) {
    console.log('VibeAll extension is now active!');
    const storageManager = new StorageManager_1.StorageManager(context);
    const contextManager = new ContextManager_1.ContextManager();
    const fileSystemManager = new FileSystemManager_1.FileSystemManager();
    const modelClient = new ModelClient_1.ModelClient();
    // Output channel for logging
    const outputChannel = vscode.window.createOutputChannel('VibeAll');
    // In-memory logs
    let logs = [];
    function log(level, message, details) {
        const entry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            level,
            message,
            details
        };
        logs.push(entry);
        // Keep only last 1000 logs
        if (logs.length > 1000) {
            logs = logs.slice(logs.length - 1000);
        }
        // Send to output channel
        const timestamp = new Date(entry.timestamp).toLocaleTimeString();
        outputChannel.appendLine(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
        if (details) {
            outputChannel.appendLine(JSON.stringify(details, null, 2));
        }
        // Broadcast to webview
        sendMessage({
            type: 'newLog',
            payload: entry
        });
    }
    // Load API keys on startup
    loadAPIKeys();
    async function loadAPIKeys() {
        try {
            const apiKeys = await storageManager.getAllAPIKeys();
            apiKeys.forEach(({ provider, key }) => {
                modelClient.setAPIKey(provider, key);
                log('info', `Loaded API key for ${provider}`, { keyLength: key.length });
            });
            log('info', `Loaded ${apiKeys.length} API keys`);
        }
        catch (error) {
            log('error', 'Failed to load API keys', error);
        }
    }
    // Create webview panel
    let currentPanel = undefined;
    const showWebview = () => {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;
        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
            return;
        }
        currentPanel = vscode.window.createWebviewPanel('vibeall', 'VibeAll AI Assistant', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
                vscode.Uri.file(path.join(context.extensionPath, 'dist'))
            ]
        });
        const webviewUri = currentPanel.webview.asWebviewUri(vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js')));
        currentPanel.webview.html = getWebviewContent(webviewUri);
        // Handle messages from webview
        currentPanel.webview.onDidReceiveMessage(async (message) => {
            await handleWebviewMessage(message);
        }, undefined, context.subscriptions);
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        }, null, context.subscriptions);
    };
    async function handleWebviewMessage(message) {
        const { type, payload } = message;
        try {
            switch (type) {
                case 'getSettings':
                    sendMessage({
                        type: 'settings',
                        payload: storageManager.getSettings()
                    });
                    break;
                case 'updateSettings':
                    await storageManager.updateSettings(payload);
                    log('info', 'Settings updated');
                    break;
                case 'getChatHistory':
                    sendMessage({
                        type: 'chatHistory',
                        payload: storageManager.getChatHistory()
                    });
                    break;
                case 'clearChat':
                    await storageManager.clearChatHistory();
                    sendMessage({ type: 'chatCleared' });
                    log('info', 'Chat history cleared');
                    break;
                case 'getLogs':
                    sendMessage({
                        type: 'logs',
                        payload: logs
                    });
                    break;
                case 'clearLogs':
                    logs = [];
                    sendMessage({
                        type: 'logs',
                        payload: []
                    });
                    break;
                case 'getUsageStats':
                    sendMessage({
                        type: 'usageStats',
                        payload: storageManager.getUsageStats()
                    });
                    break;
                case 'getAPIKeys': {
                    const apiKeys = await storageManager.getAllAPIKeys();
                    sendMessage({
                        type: 'apiKeys',
                        payload: apiKeys
                    });
                    break;
                }
                case 'storeAPIKey':
                    try {
                        const { provider, key } = payload;
                        await storageManager.storeAPIKey(provider, key);
                        modelClient.setAPIKey(provider, key);
                        log('info', `API key stored for ${provider}`);
                        sendMessage({
                            type: 'apiKeyStored',
                            payload: { provider }
                        });
                    }
                    catch (error) {
                        log('error', `Failed to store API key: ${error.message}`);
                        sendMessage({
                            type: 'apiKeyError',
                            payload: { error: error.message }
                        });
                    }
                    break;
                case 'sendMessage':
                    await handleAIMessage(payload);
                    break;
                case 'switchModel':
                    log('info', `Switched model to ${payload.provider} / ${payload.modelId}`);
                    break;
                case 'applyCode':
                    await applyCodeToFile(payload.code, payload.filePath);
                    break;
                case 'fileSystemAction':
                    await handleFileSystemAction(payload);
                    break;
                default:
                    console.log(`[VibeAll] Unknown message type: ${type}`);
            }
        }
        catch (error) {
            console.error(`[VibeAll] Error handling message:`, error);
            log('error', `Error handling message ${type}`, error);
            sendMessage({
                type: 'error',
                payload: { error: error.message }
            });
        }
    }
    async function handleAIMessage(payload) {
        const { messages, provider, modelId } = payload;
        sendMessage({ type: 'messageLoading' });
        log('info', `Processing message with ${provider} (${modelId})`);
        try {
            // System Prompt with Tool Definitions
            const systemPrompt = `You are VibeAll, an advanced AI coding assistant.
You can perform file operations. To do so, output a single JSON block strictly in this format:
\`\`\`json
{
  "tools": [
    { "name": "createDirectory", "args": { "path": "project_name" } },
    { "name": "createFile", "args": { "path": "project_name/src/index.ts", "content": "..." } }
  ]
}
\`\`\`
IMPORTANT Rules:
1. ALWAYS create a root folder for the project first (e.g., "my-app"). All subsequent files must be inside this folder.
2. Use "createDirectory" explicitly for subdirectories (e.g., "my-app/src").
3. Use "createInGen" ONLY for quick isolated temporary tests.
4. For full projects, use "createFile" and "createDirectory".
5. Output the JSON block at the end of your response.`;
            // Add system prompt
            let messagesWithContext = [...messages];
            if (messagesWithContext.length > 0) {
                messagesWithContext.unshift({ role: 'system', content: systemPrompt });
            }
            // Add retrieved context
            if (context) {
                const firstUserMsg = messagesWithContext.find(m => m.role === 'user');
                if (firstUserMsg) {
                    firstUserMsg.content = `[Context Files]:\n${context}\n\n${firstUserMsg.content}`;
                }
            }
            // Ensure API key is loaded
            if (!modelClient.hasClient(provider)) {
                const apiKey = await storageManager.getAPIKey(provider);
                if (apiKey) {
                    modelClient.setAPIKey(provider, apiKey);
                }
                else {
                    throw new Error(`No API key found for ${provider}. Please add one in settings.`);
                }
            }
            // Send to AI
            const response = await modelClient.sendMessage({ provider, modelId }, messagesWithContext);
            // Parse and Execute Tools
            const content = response.content;
            // Try matching code blocks first
            let toolJsonString = null;
            const codeBlockRegex = /```(?:json)?\s*({[\s\S]*?"tools"[\s\S]*?})\s*```/;
            const match = content.match(codeBlockRegex);
            if (match) {
                toolJsonString = match[1];
            }
            else {
                // Fallback: try to find a raw JSON object containing "tools"
                const rawJsonRegex = /({[\s\S]*?"tools"\s*:\s*\[[\s\S]*?}\s*])/;
                const rawMatch = content.match(rawJsonRegex);
                if (rawMatch) {
                    toolJsonString = rawMatch[1];
                }
            }
            if (toolJsonString) {
                try {
                    // unexpected token cleanup (sometimes models output trailing commas)
                    // This is a simple parse try.
                    const toolData = JSON.parse(toolJsonString);
                    if (toolData.tools && Array.isArray(toolData.tools)) {
                        log('info', `Found ${toolData.tools.length} tools to execute`);
                        await executeTools(toolData.tools);
                    }
                }
                catch (e) {
                    log('error', 'Failed to parse tool JSON', e);
                    console.error('Raw JSON string that failed:', toolJsonString);
                }
            }
            else {
                // Fallback: Parse standard code blocks as file creations
                log('info', 'No tool JSON found, attempting to parse code blocks');
                const extractedTools = parseCodeBlocksToTools(content);
                if (extractedTools.length > 0) {
                    log('info', `Found ${extractedTools.length} code blocks to turn into files`);
                    await executeTools(extractedTools);
                }
                else {
                    log('info', 'No executable content found in response');
                }
            }
            // Save chat history
            const updatedMessages = [
                ...messages,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: response.content,
                    timestamp: Date.now(),
                    model: modelId,
                    tokens: response.usage?.total_tokens,
                    reasoning_details: response.reasoning_details
                }
            ];
            await storageManager.saveChatHistory(updatedMessages);
            // Update usage stats
            const stats = storageManager.getUsageStats();
            if (!stats[provider]) {
                stats[provider] = { requests: 0, tokens: 0, lastUsed: 0 };
            }
            stats[provider].requests += 1;
            stats[provider].tokens += (response.usage?.total_tokens || 0);
            stats[provider].lastUsed = Date.now();
            await storageManager.updateUsageStats(stats);
            sendMessage({
                type: 'messageResponse',
                payload: {
                    content: response.content,
                    model: modelId,
                    tokens: response.usage?.total_tokens,
                    usedProvider: provider,
                    reasoning_details: response.reasoning_details
                }
            });
            log('info', `AI Response received from ${provider}`, { tokens: response.usage?.total_tokens });
        }
        catch (error) {
            log('error', `AI processing failed: ${error.message}`, error);
            sendMessage({
                type: 'messageError',
                payload: { error: error.message }
            });
        }
    }
    async function applyCodeToFile(code, _filePath) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            await editor.edit(editBuilder => {
                const document = editor.document;
                const lastLine = document.lineAt(document.lineCount - 1);
                const range = new vscode.Range(new vscode.Position(0, 0), lastLine.range.end);
                editBuilder.replace(range, code);
            });
            vscode.window.showInformationMessage('Code applied successfully!');
            log('info', 'Code applied to file');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to apply code: ${error.message}`);
            log('error', 'Failed to apply code', error);
        }
    }
    async function handleFileSystemAction(payload) {
        const { action, path: filePath, content } = payload;
        try {
            let result;
            switch (action) {
                case 'createFile':
                    result = await fileSystemManager.createFile(filePath, content);
                    // Analyze code if it's a code file
                    if (content && filePath.match(/\.(ts|js|tsx|jsx|py|java)$/)) {
                        const { CodeAnalyzer } = await Promise.resolve().then(() => __importStar(__webpack_require__(14)));
                        const ext = filePath.split('.').pop() || '';
                        const langMap = { ts: 'typescript', js: 'javascript', tsx: 'typescript', jsx: 'javascript', py: 'python' };
                        const language = langMap[ext] || ext;
                        const analysis = CodeAnalyzer.analyzeCode(content, language);
                        const securityIssues = CodeAnalyzer.detectSecurityIssues(content);
                        const suggestions = CodeAnalyzer.generateSuggestions(content, language);
                        if (analysis.issues.length > 0 || securityIssues.length > 0) {
                            sendMessage({
                                type: 'codeAnalysis',
                                payload: {
                                    file: filePath,
                                    analysis,
                                    securityIssues,
                                    suggestions,
                                    metrics: analysis.metrics
                                }
                            });
                        }
                    }
                    log('info', `Created file: ${result}`);
                    break;
                case 'createDirectory':
                    result = await fileSystemManager.createDirectory(filePath);
                    log('info', `Created directory: ${result}`);
                    break;
                case 'readFile':
                    result = await fileSystemManager.readFile(filePath);
                    log('info', `Read file: ${filePath}`);
                    break;
                case 'listFiles':
                    result = await fileSystemManager.listFiles(filePath);
                    log('info', `Listed directory: ${filePath}`);
                    break;
                case 'createInGen':
                    result = await fileSystemManager.createInGen(filePath, content);
                    log('info', `Created in /gen: ${result}`);
                    break;
                default:
                    throw new Error(`Unknown file command: ${action}`);
            }
            sendMessage({
                type: 'fileSystemResponse',
                payload: { action, result, status: 'success' }
            });
        }
        catch (error) {
            log('error', `File system action failed: ${action}`, error);
            sendMessage({
                type: 'fileSystemResponse',
                payload: { action, error: error.message, status: 'error' }
            });
        }
    }
    // Helper to execute tools with UI updates
    async function executeTools(tools) {
        sendMessage({
            type: 'toolExecutionStart',
            payload: {
                tools: tools.map((t, i) => ({ ...t, id: i }))
            }
        });
        for (let i = 0; i < tools.length; i++) {
            const tool = tools[i];
            sendMessage({
                type: 'toolStatus',
                payload: {
                    id: i,
                    status: 'running',
                    tool: tool.name,
                    path: tool.args.path || tool.args.filename
                }
            });
            try {
                await handleFileSystemAction({ action: tool.name, ...tool.args });
                sendMessage({
                    type: 'toolStatus',
                    payload: { id: i, status: 'completed' }
                });
            }
            catch (toolError) {
                sendMessage({
                    type: 'toolStatus',
                    payload: { id: i, status: 'error' }
                });
                log('error', `Tool error: ${tool.name}`, toolError);
            }
        }
    }
    function parseCodeBlocksToTools(content) {
        const tools = [];
        // Regex to match code blocks: ```lang ... ```
        const blockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        let match;
        while ((match = blockRegex.exec(content)) !== null) {
            const lang = match[1] || 'txt';
            const code = match[2];
            // Heuristic: Look inside the code (first few lines) for a comment like "// filename: src/file.ts"
            // or look at the text immediately preceding the block
            // 1. Check inside code
            let filename = null;
            const commentMatch = code.match(/^(?:\/\/|#|<!--)\s*(?:filename|file):\s*([^\s\n]+)/m);
            if (commentMatch) {
                filename = commentMatch[1];
            }
            // 2. Check preceding text (look back from match.index)
            if (!filename) {
                const precedingText = content.substring(Math.max(0, match.index - 100), match.index);
                // Look for bold filename or explicit mention: "**index.html**" or "In `script.js`:"
                const nameMatch = precedingText.match(/(?:`|\*\*)([\w-]+\.\w+)(?:`|\*\*)?/);
                if (nameMatch) {
                    filename = nameMatch[1];
                }
            }
            // 3. Fallback based on language
            if (!filename) {
                const ext = lang === 'javascript' ? 'js' : lang === 'typescript' ? 'ts' : lang === 'python' ? 'py' : lang;
                filename = `generated_file_${tools.length + 1}.${ext}`;
            }
            // Sanitize filename (remove quotes/paths if too complex, or just accept)
            filename = filename.trim();
            tools.push({
                name: 'createFile',
                args: {
                    path: filename, // Best effort path
                    content: code
                }
            });
        }
        return tools;
    }
    function sendMessage(message) {
        if (currentPanel) {
            currentPanel.webview.postMessage(message);
        }
    }
    function getWebviewContent(webviewUri) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VibeAll AI Assistant</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            overflow: hidden;
        }
        #root {
            width: 100vw;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script src="${webviewUri}"></script>
</body>
</html>`;
    }
    // Register commands
    const openCommand = vscode.commands.registerCommand('vibeall.open', showWebview);
    const settingsCommand = vscode.commands.registerCommand('vibeall.openSettings', () => {
        showWebview();
        setTimeout(() => {
            sendMessage({ type: 'showSettings' });
        }, 500);
    });
    context.subscriptions.push(openCommand, settingsCommand);
    // Show webview on activation
    showWebview();
}
function deactivate() {
    console.log('VibeAll extension is now deactivated');
}


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("path");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.StorageManager = void 0;
class StorageManager {
    constructor(context) {
        this.context = context;
        this.secretStorage = context.secrets;
    }
    async storeAPIKey(provider, key) {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;
        await this.secretStorage.store(storageKey, key);
        console.log(`[StorageManager] Stored API key for ${provider}`);
    }
    async getAPIKey(provider) {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;
        const key = await this.secretStorage.get(storageKey);
        return key;
    }
    async getAllAPIKeys() {
        const providers = ['groq', 'google', 'openai', 'cerebras', 'deepseek', 'sambanova', 'anthropic'];
        const keys = [];
        for (const provider of providers) {
            const key = await this.getAPIKey(provider);
            if (key) {
                keys.push({ provider, key });
            }
        }
        return keys;
    }
    async deleteAPIKey(provider) {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;
        await this.secretStorage.delete(storageKey);
        console.log(`[StorageManager] Deleted API key for ${provider}`);
    }
    // Settings storage
    getSettings() {
        return this.context.globalState.get('vibeall.settings', {
            autoRunCommands: false,
            autoApplyEdits: false,
            showMiniDashboard: true,
            compactMode: false,
            alwaysShowPlan: false,
            planMode: false,
            theme: {
                primaryColor: '#FF5722',
                accentColor: '#FF9800',
                mode: 'dark'
            }
        });
    }
    async updateSettings(settings) {
        await this.context.globalState.update('vibeall.settings', settings);
        console.log('[StorageManager] Settings updated');
    }
    // Chat history storage
    getChatHistory() {
        return this.context.globalState.get('vibeall.chatHistory', []);
    }
    async saveChatHistory(messages) {
        await this.context.globalState.update('vibeall.chatHistory', messages);
    }
    async clearChatHistory() {
        await this.context.globalState.update('vibeall.chatHistory', []);
        console.log('[StorageManager] Chat history cleared');
    }
    // Usage stats storage
    getUsageStats() {
        return this.context.globalState.get('vibeall.usageStats', {});
    }
    async updateUsageStats(stats) {
        await this.context.globalState.update('vibeall.usageStats', stats);
    }
}
exports.StorageManager = StorageManager;


/***/ }),
/* 4 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ContextManager = void 0;
const vscode = __importStar(__webpack_require__(1));
class ContextManager {
    async getActiveFileContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }
        const document = editor.document;
        const selection = editor.selection;
        let context = `File: ${document.fileName}\n`;
        context += `Language: ${document.languageId}\n\n`;
        if (!selection.isEmpty) {
            context += `Selected code:\n\`\`\`${document.languageId}\n`;
            context += document.getText(selection);
            context += '\n```\n';
        }
        else {
            context += `Full file content:\n\`\`\`${document.languageId}\n`;
            context += document.getText();
            context += '\n```\n';
        }
        return context;
    }
    async getWorkspaceContext() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return '';
        }
        let context = 'Workspace Information:\n';
        context += `Root: ${workspaceFolders[0].uri.fsPath}\n`;
        // Get package.json if it exists
        try {
            const packageJsonUri = vscode.Uri.joinPath(workspaceFolders[0].uri, 'package.json');
            const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
            const packageJson = JSON.parse(packageJsonContent.toString());
            context += '\nProject Dependencies:\n';
            if (packageJson.dependencies) {
                context += 'Dependencies: ' + Object.keys(packageJson.dependencies).join(', ') + '\n';
            }
            if (packageJson.devDependencies) {
                context += 'DevDependencies: ' + Object.keys(packageJson.devDependencies).join(', ') + '\n';
            }
        }
        catch (error) {
            // package.json doesn't exist or can't be read
        }
        return context;
    }
    async getDiagnosticsContext() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        if (diagnostics.length === 0) {
            return '';
        }
        let context = '\nCurrent Errors/Warnings:\n';
        diagnostics.forEach((diagnostic, index) => {
            const severity = diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'ERROR' : 'WARNING';
            context += `${index + 1}. [${severity}] Line ${diagnostic.range.start.line + 1}: ${diagnostic.message}\n`;
        });
        return context;
    }
    async getFullContext() {
        const fileContext = await this.getActiveFileContext();
        const workspaceContext = await this.getWorkspaceContext();
        const diagnosticsContext = await this.getDiagnosticsContext();
        return `${workspaceContext}\n${fileContext}\n${diagnosticsContext}`;
    }
}
exports.ContextManager = ContextManager;


/***/ }),
/* 5 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.FileSystemManager = void 0;
const vscode = __importStar(__webpack_require__(1));
const fs = __importStar(__webpack_require__(6));
const path = __importStar(__webpack_require__(2));
class FileSystemManager {
    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        this.sandboxRoot = this.workspaceRoot ? path.join(this.workspaceRoot, 'gen') : '';
    }
    getAbsolutePath(relativePath) {
        if (!this.workspaceRoot) {
            throw new Error('No workspace open');
        }
        // If it already looks absolute and starts with workspace root, keep it. 
        // Otherwise join with workspace root.
        if (path.isAbsolute(relativePath)) {
            if (!relativePath.startsWith(this.workspaceRoot)) {
                // For security/safety, strictly simpler to just require relative paths or paths inside workspace
                // But for now, let's assume valid inputs or re-root them.
                return relativePath;
            }
            return relativePath;
        }
        return path.join(this.workspaceRoot, relativePath);
    }
    ensureSandbox(filePath) {
        if (!filePath.startsWith(this.sandboxRoot)) {
            // If strictly enforcing sandbox. 
            // The user wants a 'gen' folder for testing, but also 'update code' for general work.
            // We 'll use a flag or method distinction later. For now, assume we can write anywhere if allowed.
        }
    }
    async createFile(filePath, content) {
        const fullPath = this.getAbsolutePath(filePath);
        await this.ensureDirectoryExists(path.dirname(fullPath));
        await fs.promises.writeFile(fullPath, content, 'utf8');
        return fullPath;
    }
    async createDirectory(dirPath) {
        const fullPath = this.getAbsolutePath(dirPath);
        await fs.promises.mkdir(fullPath, { recursive: true });
        return fullPath;
    }
    async readFile(filePath) {
        const fullPath = this.getAbsolutePath(filePath);
        return await fs.promises.readFile(fullPath, 'utf8');
    }
    async listFiles(dirPath) {
        const fullPath = this.getAbsolutePath(dirPath);
        const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
        return entries.map(entry => {
            return path.join(dirPath, entry.name);
        });
    }
    async deleteFile(filePath) {
        const fullPath = this.getAbsolutePath(filePath);
        await fs.promises.unlink(fullPath);
    }
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.promises.access(dirPath);
        }
        catch {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }
    // Helper for the 'gen' folder requirement
    async createInGen(filename, content) {
        if (!this.workspaceRoot)
            throw new Error('No workspace');
        const genPath = path.join(this.workspaceRoot, 'gen', filename);
        await this.createFile(genPath, content);
        return genPath;
    }
}
exports.FileSystemManager = FileSystemManager;


/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ModelClient = void 0;
const GroqClient_1 = __webpack_require__(8);
const GoogleClient_1 = __webpack_require__(10);
const OpenAIClient_1 = __webpack_require__(11);
const AnthropicClient_1 = __webpack_require__(12);
const BytezClient_1 = __webpack_require__(13);
class ModelClient {
    constructor() {
        this.clients = new Map();
        // Clients will be initialized when API keys are provided
    }
    setAPIKey(provider, apiKey) {
        const normalizedProvider = provider.toLowerCase();
        switch (normalizedProvider) {
            case 'groq':
                this.clients.set('groq', new GroqClient_1.GroqClient(apiKey));
                break;
            case 'google':
                this.clients.set('google', new GoogleClient_1.GoogleClient(apiKey));
                break;
            case 'anthropic':
                this.clients.set('anthropic', new AnthropicClient_1.AnthropicClient(apiKey));
                break;
            case 'openai':
            case 'cerebras':
            case 'deepseek':
            case 'sambanova':
            case 'xai':
            case 'novita':
            case 'aimlapi':
            case 'openrouter':
                this.clients.set(normalizedProvider, new OpenAIClient_1.OpenAIClient(apiKey, normalizedProvider));
                break;
            case 'bytez':
                this.clients.set('bytez', new BytezClient_1.BytezClient(apiKey));
                break;
        }
    }
    async sendMessage(config, messages) {
        const { provider, modelId, apiKey } = config;
        // Set API key if provided
        if (apiKey) {
            this.setAPIKey(provider, apiKey);
        }
        const client = this.clients.get(provider.toLowerCase());
        if (!client) {
            throw new Error(`No API key configured for provider: ${provider}`);
        }
        return await client.sendMessage(modelId, messages);
    }
    hasClient(provider) {
        return this.clients.has(provider.toLowerCase());
    }
    getAvailableProviders() {
        return Array.from(this.clients.keys());
    }
}
exports.ModelClient = ModelClient;


/***/ }),
/* 8 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GroqClient = void 0;
const BaseAPIClient_1 = __webpack_require__(9);
class GroqClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey) {
        super(apiKey, 'https://api.groq.com/openai/v1');
    }
    async sendMessage(modelId, messages) {
        const response = await this.makeRequest('/chat/completions', {
            model: modelId,
            messages,
            temperature: 0.7,
            max_tokens: 8192
        });
        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            done: true,
            model: data.model,
            tokens: data.usage?.total_tokens
        };
    }
}
exports.GroqClient = GroqClient;


/***/ }),
/* 9 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BaseAPIClient = void 0;
class BaseAPIClient {
    constructor(apiKey, baseURL) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }
    async makeRequest(endpoint, body, options) {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                ...options?.headers
            },
            body: JSON.stringify(body),
            ...options
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return response;
    }
}
exports.BaseAPIClient = BaseAPIClient;


/***/ }),
/* 10 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.GoogleClient = void 0;
const BaseAPIClient_1 = __webpack_require__(9);
class GoogleClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey) {
        super(apiKey, 'https://generativelanguage.googleapis.com/v1beta');
    }
    async sendMessage(modelId, messages) {
        // Convert messages to Gemini format
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        const response = await fetch(`${this.baseURL}/models/${modelId}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }
        const data = await response.json();
        return {
            content: data.candidates[0].content.parts[0].text,
            done: true,
            model: modelId,
            tokens: data.usageMetadata?.totalTokenCount
        };
    }
}
exports.GoogleClient = GoogleClient;


/***/ }),
/* 11 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.OpenAIClient = void 0;
const BaseAPIClient_1 = __webpack_require__(9);
class OpenAIClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey, provider = 'openai') {
        const baseURLs = {
            'openai': 'https://api.openai.com/v1',
            'cerebras': 'https://api.cerebras.ai/v1',
            'deepseek': 'https://api.deepseek.com/v1',
            'sambanova': 'https://api.sambanova.ai/v1',
            'xai': 'https://api.x.ai/v1',
            'novita': 'https://api.novita.ai/openai',
            'aimlapi': 'https://api.aimlapi.com/v1',
            'openrouter': 'https://openrouter.ai/api/v1'
        };
        super(apiKey, baseURLs[provider] || baseURLs['openai']);
        this.provider = provider;
    }
    async sendMessage(modelId, messages) {
        const payload = {
            model: modelId,
            messages,
            temperature: 0.7,
            max_tokens: modelId === 'kat-coder' ? 1000 : 4096
        };
        // Enable reasoning for OpenRouter thinking models
        if (this.provider === 'openrouter' && (modelId.includes('think') || modelId.includes('reason'))) {
            payload.reasoning = { enabled: true };
        }
        const response = await this.makeRequest('/chat/completions', payload);
        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            done: true,
            model: data.model,
            tokens: data.usage?.total_tokens,
            reasoning_details: data.choices[0].message.reasoning_details
        };
    }
}
exports.OpenAIClient = OpenAIClient;


/***/ }),
/* 12 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.AnthropicClient = void 0;
const BaseAPIClient_1 = __webpack_require__(9);
class AnthropicClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey) {
        super(apiKey, 'https://api.anthropic.com/v1');
    }
    async sendMessage(modelId, messages) {
        // Extract system message if present (Anthropic requires it top-level)
        let systemPrompt = '';
        const anthropicMessages = messages.filter(msg => {
            if (msg.role === 'system') {
                systemPrompt += msg.content + '\n';
                return false;
            }
            return true;
        });
        const body = {
            model: modelId,
            messages: anthropicMessages,
            max_tokens: 8192,
            system: systemPrompt.trim() || undefined
        };
        const response = await fetch(`${this.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey, // Anthropic uses x-api-key
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        return {
            content: data.content[0].text,
            done: true,
            model: data.model,
            tokens: data.usage?.output_tokens
        };
    }
}
exports.AnthropicClient = AnthropicClient;


/***/ }),
/* 13 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.BytezClient = void 0;
const BaseAPIClient_1 = __webpack_require__(9);
class BytezClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey) {
        super(apiKey, 'https://api.bytez.com/models/v2');
    }
    async sendMessage(modelId, messages) {
        // Determine input format based on model type or just pass messages for LLMs
        // For non-chat models (like stable-diffusion), we might want to extract the last prompt.
        // But for now, let's implement the chat flow primarily.
        let input = messages;
        const isEmbedding = modelId.includes('sentence-transformers') ||
            modelId.includes('bge') ||
            modelId.includes('nomic') ||
            modelId.includes('clip') ||
            modelId.includes('siglip');
        const isMedia = modelId.includes('stable') ||
            modelId.includes('whisper') ||
            modelId.includes('bark');
        // Simple heuristic: if modelId implies image generation or embedding, use the last user message text
        if (isEmbedding || isMedia) {
            const lastMsg = messages[messages.length - 1];
            input = lastMsg ? lastMsg.content : '';
        }
        const requestBody = { input };
        // Only add params for models that support it (LLMs)
        // Whisper/Bark/Embeddings don't use 'max_tokens' in the same way or error out
        if (!isEmbedding && !modelId.includes('whisper') && !modelId.includes('bark')) {
            requestBody.params = {
                max_tokens: 1024,
                temperature: 0.7
            };
        }
        const response = await this.makeRequest(`/${modelId}`, requestBody);
        const data = await response.json();
        const output = data.output;
        // Handle output format which can vary
        let content = '';
        if (typeof output === 'string') {
            content = output;
        }
        else if (Array.isArray(output) && output[0] && output[0].content) {
            // Chat output: [{ role: 'assistant', content: '...' }]
            content = output[0].content;
        }
        else {
            content = JSON.stringify(output);
        }
        return {
            content: content,
            done: true,
            model: modelId,
            tokens: 0 // Usage not strictly returned in standard wrapper
        };
    }
    // Override makeRequest to custom format headers slightly different if needed
    // Client.ts says: Authorization: Key ${apiKey}
    async makeRequest(endpoint, body) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Key ${this.apiKey}`
        };
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return response;
    }
}
exports.BytezClient = BytezClient;


/***/ }),
/* 14 */
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CodeAnalyzer = void 0;
class CodeAnalyzer {
    /**
     * Analyze code for common issues and patterns
     */
    static analyzeCode(code, language) {
        const issues = [];
        const metrics = {
            lines: 0,
            complexity: 0,
            maintainability: 100
        };
        const lines = code.split('\n');
        metrics.lines = lines.length;
        // Basic complexity analysis
        let complexity = 1;
        const complexityPatterns = [
            /if\s*\(/g,
            /else\s+if\s*\(/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /case\s+/g,
            /catch\s*\(/g,
            /\&\&/g,
            /\|\|/g
        ];
        complexityPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });
        metrics.complexity = complexity;
        metrics.maintainability = Math.max(0, 100 - (complexity * 2));
        // Check for common issues
        this.checkCommonIssues(code, language, issues);
        return { issues, metrics };
    }
    static checkCommonIssues(code, language, issues) {
        // Check for console.log (should use proper logging)
        if (language === 'javascript' || language === 'typescript') {
            const consoleMatches = code.match(/console\.(log|warn|error)/g);
            if (consoleMatches && consoleMatches.length > 3) {
                issues.push({
                    severity: 'warning',
                    message: `Found ${consoleMatches.length} console statements. Consider using a proper logging library.`,
                    line: 0
                });
            }
            // Check for var usage
            const varMatches = code.match(/\bvar\s+/g);
            if (varMatches) {
                issues.push({
                    severity: 'warning',
                    message: 'Use const or let instead of var',
                    line: 0
                });
            }
            // Check for == instead of ===
            const looseEqualityMatches = code.match(/[^=!]==[^=]/g);
            if (looseEqualityMatches) {
                issues.push({
                    severity: 'warning',
                    message: 'Use === instead of == for equality checks',
                    line: 0
                });
            }
        }
        // Check for TODO comments
        const todoMatches = code.match(/\/\/\s*TODO|\/\*\s*TODO|\#\s*TODO/gi);
        if (todoMatches) {
            issues.push({
                severity: 'info',
                message: `Found ${todoMatches.length} TODO comment(s)`,
                line: 0
            });
        }
        // Check for long lines
        const lines = code.split('\n');
        const longLines = lines.filter(line => line.length > 120);
        if (longLines.length > 0) {
            issues.push({
                severity: 'info',
                message: `${longLines.length} line(s) exceed 120 characters`,
                line: 0
            });
        }
    }
    /**
     * Generate suggestions for code improvement
     */
    static generateSuggestions(code, language) {
        const suggestions = [];
        // Check for missing error handling
        if (language === 'javascript' || language === 'typescript') {
            if (code.includes('async') && !code.includes('try')) {
                suggestions.push('Add try-catch blocks for async functions');
            }
            if (code.includes('fetch') && !code.includes('catch')) {
                suggestions.push('Add error handling for fetch requests');
            }
            // Check for missing JSDoc
            const functionMatches = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g);
            if (functionMatches && !code.includes('/**')) {
                suggestions.push('Add JSDoc comments to document functions');
            }
        }
        // Check for code organization
        if (code.length > 500 && !code.includes('class') && !code.includes('function')) {
            suggestions.push('Consider breaking code into smaller functions or classes');
        }
        return suggestions;
    }
    /**
     * Detect potential security issues
     */
    static detectSecurityIssues(code) {
        const issues = [];
        // Check for eval usage
        if (code.includes('eval(')) {
            issues.push({
                severity: 'critical',
                message: 'Avoid using eval() - it can execute arbitrary code',
                type: 'code-injection'
            });
        }
        // Check for innerHTML usage
        if (code.includes('innerHTML')) {
            issues.push({
                severity: 'high',
                message: 'Using innerHTML can lead to XSS vulnerabilities. Consider using textContent or sanitization.',
                type: 'xss'
            });
        }
        // Check for hardcoded credentials
        const credentialPatterns = [
            /password\s*=\s*["'][^"']+["']/i,
            /api[_-]?key\s*=\s*["'][^"']+["']/i,
            /secret\s*=\s*["'][^"']+["']/i,
            /token\s*=\s*["'][^"']+["']/i
        ];
        credentialPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                issues.push({
                    severity: 'critical',
                    message: 'Hardcoded credentials detected. Use environment variables instead.',
                    type: 'hardcoded-secrets'
                });
            }
        });
        return issues;
    }
}
exports.CodeAnalyzer = CodeAnalyzer;


/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	var __webpack_export_target__ = exports;
/******/ 	for(var __webpack_i__ in __webpack_exports__) __webpack_export_target__[__webpack_i__] = __webpack_exports__[__webpack_i__];
/******/ 	if(__webpack_exports__.__esModule) Object.defineProperty(__webpack_export_target__, "__esModule", { value: true });
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map