/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
const CodebaseIndexer_1 = __webpack_require__(14);
const InlineCompletionProvider_1 = __webpack_require__(26);
const ChatEnhancer_1 = __webpack_require__(27);
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
    // Initialize new features
    let indexer;
    let completionProvider;
    const chatEnhancer = new ChatEnhancer_1.ChatEnhancer(modelClient);
    // Initialize codebase indexer
    async function initializeIndexer() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            log('warning', 'No workspace folder found, skipping indexing');
            return;
        }
        try {
            indexer = new CodebaseIndexer_1.CodebaseIndexer();
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Indexing codebase...',
                cancellable: false
            }, async (progress) => {
                await indexer.initialize(workspaceFolders[0].uri.fsPath);
                const stats = indexer.getStats();
                log('info', `Codebase indexed: ${stats.files} files, ${stats.chunks} code chunks`);
            });
            // Register autocomplete provider
            completionProvider = new InlineCompletionProvider_1.AIInlineCompletionProvider(modelClient, indexer);
            const completionDisposable = vscode.languages.registerInlineCompletionItemProvider({ pattern: '**' }, completionProvider);
            context.subscriptions.push(completionDisposable);
            log('info', 'Inline autocomplete enabled');
        }
        catch (error) {
            log('error', 'Failed to initialize indexer', error);
            vscode.window.showErrorMessage(`Failed to index codebase: ${error.message}`);
        }
    }
    // Auto-initialize on startup (after a short delay)
    setTimeout(() => {
        initializeIndexer();
    }, 2000);
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
                case 'getAPIKeys':
                    // Send all stored API keys to webview
                    try {
                        const allKeys = await storageManager.getAllAPIKeys();
                        const keysMap = {};
                        allKeys.forEach(k => keysMap[k.provider] = k.key);
                        sendMessage({
                            type: 'apiKeysLoaded',
                            payload: keysMap
                        });
                        log('info', `Loaded ${allKeys.length} API keys`);
                    }
                    catch (error) {
                        log('error', `Failed to load API keys: ${error.message}`);
                    }
                    break;
                case 'saveAPIKey':
                    // Save API key and send confirmation
                    try {
                        const { provider, key } = payload;
                        await storageManager.storeAPIKey(provider, key);
                        modelClient.setAPIKey(provider, key);
                        sendMessage({
                            type: 'apiKeySaved',
                            payload: { provider, success: true }
                        });
                        log('info', `Saved API key for ${provider}`);
                    }
                    catch (error) {
                        log('error', `Failed to save API key: ${error.message}`);
                        sendMessage({
                            type: 'apiKeyError',
                            payload: { error: error.message }
                        });
                    }
                    break;
                case 'deleteAPIKey':
                    // Delete API key and send confirmation
                    try {
                        const { provider } = payload;
                        await storageManager.deleteAPIKey(provider);
                        sendMessage({
                            type: 'apiKeyDeleted',
                            payload: { provider, success: true }
                        });
                        log('info', `Deleted API key for ${provider}`);
                    }
                    catch (error) {
                        log('error', `Failed to delete API key: ${error.message}`);
                    }
                    break;
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
            // Enhance last user message with @-mentions and slash commands
            const lastUserMsg = messagesWithContext.filter(m => m.role === 'user').pop();
            if (lastUserMsg) {
                try {
                    const enhanced = await chatEnhancer.enhanceMessage(lastUserMsg.content, provider, modelId);
                    if (enhanced.isSlashCommand) {
                        // Slash command was executed, return response directly
                        sendMessage({
                            type: 'messageResponse',
                            payload: {
                                content: enhanced.enhancedMessage,
                                model: modelId,
                                usedProvider: provider
                            }
                        });
                        log('info', `Slash command executed`);
                        return;
                    }
                    // Update message with enhanced content (includes @-mentions context)
                    lastUserMsg.content = enhanced.enhancedMessage;
                    log('info', `Message enhanced with mentions/context`);
                }
                catch (error) {
                    log('warning', `Chat enhancement failed: ${error.message}`);
                    // Continue with original message
                }
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
                        const { CodeAnalyzer } = await Promise.resolve().then(() => __importStar(__webpack_require__(28)));
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
    // New commands
    const indexCommand = vscode.commands.registerCommand('vibeall.indexCodebase', async () => {
        await initializeIndexer();
    });
    const toggleAutocompleteCommand = vscode.commands.registerCommand('vibeall.toggleAutocomplete', () => {
        if (completionProvider) {
            const config = vscode.workspace.getConfiguration('vibeall');
            const currentState = config.get('autocomplete.enabled', true);
            const newState = !currentState;
            config.update('autocomplete.enabled', newState, vscode.ConfigurationTarget.Global);
            completionProvider.setEnabled(newState);
            vscode.window.showInformationMessage(`Autocomplete ${newState ? 'enabled' : 'disabled'}`);
            log('info', `Autocomplete ${newState ? 'enabled' : 'disabled'}`);
        }
        else {
            vscode.window.showWarningMessage('Autocomplete not initialized yet');
        }
    });
    context.subscriptions.push(openCommand, settingsCommand, indexCommand, toggleAutocompleteCommand);
    // Show webview on activation
    showWebview();
}
function deactivate() {
    console.log('VibeAll extension is now deactivated');
}


/***/ }),
/* 1 */
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),
/* 3 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

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
        const providers = [
            'groq', 'google', 'openai', 'cerebras', 'deepseek', 'sambanova',
            'anthropic', 'xai', 'novita', 'bytez', 'aimlapi', 'openrouter'
        ];
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

"use strict";

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

"use strict";

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

"use strict";
module.exports = require("fs");

/***/ }),
/* 7 */
/***/ ((__unused_webpack_module, exports, __webpack_require__) => {

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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

"use strict";

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
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.CodebaseIndexer = void 0;
const vscode = __importStar(__webpack_require__(1));
const fs = __importStar(__webpack_require__(15));
const tree_sitter_1 = __importDefault(__webpack_require__(16));
const TypeScript = (__webpack_require__(21).typescript);
const JavaScript = __webpack_require__(24);
class CodebaseIndexer {
    constructor() {
        this.index = new Map();
        this.watchers = [];
        this.parser = new tree_sitter_1.default();
    }
    async initialize(workspacePath) {
        console.log('🔍 Starting codebase indexing...');
        // Find all code files
        const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}', '**/node_modules/**');
        let indexed = 0;
        for (const file of files) {
            await this.indexFile(file.fsPath);
            indexed++;
            if (indexed % 10 === 0) {
                console.log(`Indexed ${indexed}/${files.length} files`);
            }
        }
        // Setup file watchers
        this.setupWatchers(workspacePath);
        console.log(`✅ Indexing complete! ${indexed} files indexed.`);
        vscode.window.showInformationMessage(`✅ Indexed ${indexed} files`);
    }
    async indexFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            // Set language based on file extension
            const language = filePath.match(/\.tsx?$/)
                ? TypeScript
                : JavaScript;
            this.parser.setLanguage(language);
            const tree = this.parser.parse(content);
            // Extract code chunks
            const chunks = this.extractChunks(tree, content, filePath);
            this.index.set(filePath, chunks);
        }
        catch (error) {
            console.error(`Failed to index ${filePath}:`, error);
        }
    }
    extractChunks(tree, text, filePath) {
        const chunks = [];
        const cursor = tree.walk();
        const visit = () => {
            const node = cursor.currentNode;
            // Extract functions, classes, methods
            if (node.type === 'function_declaration' ||
                node.type === 'class_declaration' ||
                node.type === 'method_definition' ||
                node.type === 'arrow_function' ||
                node.type === 'function_expression') {
                chunks.push({
                    content: text.slice(node.startIndex, node.endIndex),
                    filePath,
                    type: node.type,
                    startLine: node.startPosition.row,
                    endLine: node.endPosition.row
                });
            }
            if (cursor.gotoFirstChild()) {
                do {
                    visit();
                } while (cursor.gotoNextSibling());
                cursor.gotoParent();
            }
        };
        visit();
        return chunks;
    }
    search(query, limit = 5) {
        const results = [];
        const queryLower = query.toLowerCase();
        for (const chunks of this.index.values()) {
            for (const chunk of chunks) {
                if (chunk.content.toLowerCase().includes(queryLower)) {
                    results.push(chunk);
                    if (results.length >= limit) {
                        return results;
                    }
                }
            }
        }
        return results;
    }
    setupWatchers(workspacePath) {
        const watcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(workspacePath, '**/*.{ts,tsx,js,jsx}'));
        watcher.onDidChange(async (uri) => {
            console.log(`File changed: ${uri.fsPath}`);
            await this.indexFile(uri.fsPath);
        });
        watcher.onDidCreate(async (uri) => {
            console.log(`File created: ${uri.fsPath}`);
            await this.indexFile(uri.fsPath);
        });
        watcher.onDidDelete((uri) => {
            console.log(`File deleted: ${uri.fsPath}`);
            this.index.delete(uri.fsPath);
        });
        this.watchers.push(watcher);
    }
    getStats() {
        let totalChunks = 0;
        for (const chunks of this.index.values()) {
            totalChunks += chunks.length;
        }
        return {
            files: this.index.size,
            chunks: totalChunks
        };
    }
    dispose() {
        this.watchers.forEach(w => w.dispose());
    }
}
exports.CodebaseIndexer = CodebaseIndexer;


/***/ }),
/* 15 */
/***/ ((module) => {

"use strict";
module.exports = require("fs/promises");

/***/ }),
/* 16 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const binding = __webpack_require__(17)(__dirname);
const {Query, Parser, NodeMethods, Tree, TreeCursor, LookaheadIterator} = binding;

const util = __webpack_require__(20);

/*
 * Tree
 */

const {rootNode, rootNodeWithOffset, edit} = Tree.prototype;

Object.defineProperty(Tree.prototype, 'rootNode', {
  get() {
    /*
      Due to a race condition arising from Jest's worker pool, "this"
      has no knowledge of the native extension if the extension has not
      yet loaded when multiple Jest tests are being run simultaneously.
      If the extension has correctly loaded, "this" should be an instance 
      of the class whose prototype we are acting on (in this case, Tree).
      Furthermore, the race condition sometimes results in the function in 
      question being undefined even when the context is correct, so we also 
      perform a null function check.
    */
    if (this instanceof Tree && rootNode) {
      return unmarshalNode(rootNode.call(this), this);
    }
  },
  // Jest worker pool may attempt to override property due to race condition,
  // we don't want to error on this
  configurable: true
});

Tree.prototype.rootNodeWithOffset = function(offset_bytes, offset_extent) {
  return unmarshalNode(rootNodeWithOffset.call(this, offset_bytes, offset_extent.row, offset_extent.column), this);
}

Tree.prototype.edit = function(arg) {
  if (this instanceof Tree && edit) {
    edit.call(
      this,
      arg.startPosition.row, arg.startPosition.column,
      arg.oldEndPosition.row, arg.oldEndPosition.column,
      arg.newEndPosition.row, arg.newEndPosition.column,
      arg.startIndex,
      arg.oldEndIndex,
      arg.newEndIndex
    );
  }
};

Tree.prototype.walk = function() {
  return this.rootNode.walk()
};

/*
 * Node
 */

class SyntaxNode {
  constructor(tree) {
    this.tree = tree;
  }

  [util.inspect.custom]() {
    return this.constructor.name + ' {\n' +
      '  type: ' + this.type + ',\n' +
      '  startPosition: ' + pointToString(this.startPosition) + ',\n' +
      '  endPosition: ' + pointToString(this.endPosition) + ',\n' +
      '  childCount: ' + this.childCount + ',\n' +
      '}'
  }

  get id() {
    marshalNode(this);
    return NodeMethods.id(this.tree);
  }

  get typeId() {
    marshalNode(this);
    return NodeMethods.typeId(this.tree);
  }

  get grammarId() {
    marshalNode(this);
    return NodeMethods.grammarId(this.tree);
  }

  get type() {
    marshalNode(this);
    return NodeMethods.type(this.tree);
  }

  get grammarType() {
    marshalNode(this);
    return NodeMethods.grammarType(this.tree);
  }

  get isExtra() {
    marshalNode(this);
    return NodeMethods.isExtra(this.tree);
  }

  get isNamed() {
    marshalNode(this);
    return NodeMethods.isNamed(this.tree);
  }

  get isMissing() {
    marshalNode(this);
    return NodeMethods.isMissing(this.tree);
  }

  get hasChanges() {
    marshalNode(this);
    return NodeMethods.hasChanges(this.tree);
  }

  get hasError() {
    marshalNode(this);
    return NodeMethods.hasError(this.tree);
  }

  get isError() {
    marshalNode(this);
    return NodeMethods.isError(this.tree);
  }

  get text() {
    return this.tree.getText(this);
  }

  get startPosition() {
    marshalNode(this);
    NodeMethods.startPosition(this.tree);
    return unmarshalPoint();
  }

  get endPosition() {
    marshalNode(this);
    NodeMethods.endPosition(this.tree);
    return unmarshalPoint();
  }

  get startIndex() {
    marshalNode(this);
    return NodeMethods.startIndex(this.tree);
  }

  get endIndex() {
    marshalNode(this);
    return NodeMethods.endIndex(this.tree);
  }

  get parent() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.parent(this.tree), this.tree);
  }

  get children() {
    marshalNode(this);
    return unmarshalNodes(NodeMethods.children(this.tree), this.tree);
  }

  get namedChildren() {
    marshalNode(this);
    return unmarshalNodes(NodeMethods.namedChildren(this.tree), this.tree);
  }

  get childCount() {
    marshalNode(this);
    return NodeMethods.childCount(this.tree);
  }

  get namedChildCount() {
    marshalNode(this);
    return NodeMethods.namedChildCount(this.tree);
  }

  get firstChild() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.firstChild(this.tree), this.tree);
  }

  get firstNamedChild() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.firstNamedChild(this.tree), this.tree);
  }

  get lastChild() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.lastChild(this.tree), this.tree);
  }

  get lastNamedChild() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.lastNamedChild(this.tree), this.tree);
  }

  get nextSibling() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.nextSibling(this.tree), this.tree);
  }

  get nextNamedSibling() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.nextNamedSibling(this.tree), this.tree);
  }

  get previousSibling() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.previousSibling(this.tree), this.tree);
  }

  get previousNamedSibling() {
    marshalNode(this);
    return unmarshalNode(NodeMethods.previousNamedSibling(this.tree), this.tree);
  }

  get parseState() {
    marshalNode(this);
    return NodeMethods.parseState(this.tree);
  }

  get nextParseState() {
    marshalNode(this);
    return NodeMethods.nextParseState(this.tree);
  }

  get descendantCount() {
    marshalNode(this);
    return NodeMethods.descendantCount(this.tree);
  }

  toString() {
    marshalNode(this);
    return NodeMethods.toString(this.tree);
  }

  child(index) {
    marshalNode(this);
    return unmarshalNode(NodeMethods.child(this.tree, index), this.tree);
  }

  namedChild(index) {
    marshalNode(this);
    return unmarshalNode(NodeMethods.namedChild(this.tree, index), this.tree);
  }

  childForFieldName(fieldName) {
    marshalNode(this);
    return unmarshalNode(NodeMethods.childForFieldName(this.tree, fieldName), this.tree);
  }

  childForFieldId(fieldId) {
    marshalNode(this);
    return unmarshalNode(NodeMethods.childForFieldId(this.tree, fieldId), this.tree);
  }

  fieldNameForChild(childIndex) {
    marshalNode(this);
    return NodeMethods.fieldNameForChild(this.tree, childIndex);
  }

  childrenForFieldName(fieldName) {
    marshalNode(this);
    return unmarshalNodes(NodeMethods.childrenForFieldName(this.tree, fieldName), this.tree);
  }

  childrenForFieldId(fieldId) {
    marshalNode(this);
    return unmarshalNodes(NodeMethods.childrenForFieldId(this.tree, fieldId), this.tree);
  }

  firstChildForIndex(index) {
    marshalNode(this);
    return unmarshalNode(NodeMethods.firstChildForIndex(this.tree, index), this.tree);
  }

  firstNamedChildForIndex(index) {
    marshalNode(this);
    return unmarshalNode(NodeMethods.firstNamedChildForIndex(this.tree, index), this.tree);
  }

  namedDescendantForIndex(start, end) {
    marshalNode(this);
    if (end == null) end = start;
    return unmarshalNode(NodeMethods.namedDescendantForIndex(this.tree, start, end), this.tree);
  }

  descendantForIndex(start, end) {
    marshalNode(this);
    if (end == null) end = start;
    return unmarshalNode(NodeMethods.descendantForIndex(this.tree, start, end), this.tree);
  }

  descendantsOfType(types, start, end) {
    marshalNode(this);
    if (typeof types === 'string') types = [types]
    return unmarshalNodes(NodeMethods.descendantsOfType(this.tree, types, start, end), this.tree);
  }

  namedDescendantForPosition(start, end) {
    marshalNode(this);
    if (end == null) end = start;
    return unmarshalNode(NodeMethods.namedDescendantForPosition(this.tree, start, end), this.tree);
  }

  descendantForPosition(start, end) {
    marshalNode(this);
    if (end == null) end = start;
    return unmarshalNode(NodeMethods.descendantForPosition(this.tree, start, end), this.tree);
  }

  closest(types) {
    marshalNode(this);
    if (typeof types === 'string') types = [types]
    return unmarshalNode(NodeMethods.closest(this.tree, types), this.tree);
  }

  walk () {
    marshalNode(this);
    const cursor = NodeMethods.walk(this.tree);
    cursor.tree = this.tree;
    unmarshalNode(cursor.currentNode, this.tree);
    return cursor;
  }
}

/*
 * Parser
 */

const {parse, setLanguage} = Parser.prototype;
const languageSymbol = Symbol('parser.language');

Parser.prototype.setLanguage = function(language) {
  if (this instanceof Parser && setLanguage) {
    setLanguage.call(this, language);
  }
  this[languageSymbol] = language;
  if (!language.nodeSubclasses) {
    initializeLanguageNodeClasses(language)
  }
  return this;
};

Parser.prototype.getLanguage = function(_language) {
  return this[languageSymbol] || null;
};

Parser.prototype.parse = function(input, oldTree, {bufferSize, includedRanges}={}) {
  let getText, treeInput = input
  if (typeof input === 'string') {
    const inputString = input;
    input = (offset, _position) => inputString.slice(offset)
    getText = getTextFromString
  } else {
    getText = getTextFromFunction
  }
  const tree = this instanceof Parser && parse
    ? parse.call(
      this,
      input,
      oldTree,
      bufferSize,
      includedRanges,
    )
    : undefined;

  if (tree) {
    tree.input = treeInput
    tree.getText = getText
    tree.language = this.getLanguage()
  }
  return tree
};

/*
 * TreeCursor
 */

const {startPosition, endPosition, currentNode} = TreeCursor.prototype;

Object.defineProperties(TreeCursor.prototype, {
  currentNode: {
    get() {
      if (this instanceof TreeCursor && currentNode) {
        return unmarshalNode(currentNode.call(this), this.tree);
      }
    },
    configurable: true
  },
  startPosition: {
    get() {
      if (this instanceof TreeCursor && startPosition) {
        startPosition.call(this);
        return unmarshalPoint();
      }
    },
    configurable: true
  },
  endPosition: {
    get() {
      if (this instanceof TreeCursor && endPosition) {
        endPosition.call(this);
        return unmarshalPoint();
      }
    },
    configurable: true
  },
  nodeText: {
    get() {
      return this.tree.getText(this)
    },
    configurable: true
  }
});

/*
 * Query
 */

const {_matches, _captures} = Query.prototype;

const PREDICATE_STEP_TYPE = {
  DONE: 0,
  CAPTURE: 1,
  STRING: 2,
}

const ZERO_POINT = { row: 0, column: 0 };

Query.prototype._init = function() {
  /*
   * Initialize predicate functions
   * format: [type1, value1, type2, value2, ...]
   */
  const predicateDescriptions = this._getPredicates();
  const patternCount = predicateDescriptions.length;

  const setProperties = new Array(patternCount);
  const assertedProperties = new Array(patternCount);
  const refutedProperties = new Array(patternCount);
  const predicates = new Array(patternCount);

  const FIRST  = 0
  const SECOND = 2
  const THIRD  = 4

  for (let i = 0; i < predicateDescriptions.length; i++) {
    predicates[i] = [];

    for (let j = 0; j < predicateDescriptions[i].length; j++) {

      const steps = predicateDescriptions[i][j];
      const stepsLength = steps.length / 2;

      if (steps[FIRST] !== PREDICATE_STEP_TYPE.STRING) {
        throw new Error('Predicates must begin with a literal value');
      }

      const operator = steps[FIRST + 1];

      let isPositive = true;
      let matchAll = true;
      let captureName;
      switch (operator) {
        case 'any-not-eq?':
        case 'not-eq?':
          isPositive = false;
        case 'any-eq?':
        case 'eq?':
          if (stepsLength !== 3) throw new Error(
            `Wrong number of arguments to \`#eq?\` predicate. Expected 2, got ${stepsLength - 1}`
          );
          if (steps[SECOND] !== PREDICATE_STEP_TYPE.CAPTURE) throw new Error(
            `First argument of \`#eq?\` predicate must be a capture. Got "${steps[SECOND + 1]}"`
          );
          matchAll = !operator.startsWith('any-');
          if (steps[THIRD] === PREDICATE_STEP_TYPE.CAPTURE) {
            const captureName1 = steps[SECOND + 1];
            const captureName2 = steps[THIRD + 1];
            predicates[i].push(function (captures) {
              let nodes_1 = [];
              let nodes_2 = [];
              for (const c of captures) {
                if (c.name === captureName1) nodes_1.push(c.node);
                if (c.name === captureName2) nodes_2.push(c.node);
              }
              let compare = (n1, n2, positive) => {
                return positive ?
                  n1.text === n2.text :
                  n1.text !== n2.text;
              };
              return matchAll
                ? nodes_1.every(n1 => nodes_2.some(n2 => compare(n1, n2, isPositive)))
                : nodes_1.some(n1 => nodes_2.some(n2 => compare(n1, n2, isPositive)));
            });
          } else {
            captureName = steps[SECOND + 1];
            const stringValue = steps[THIRD + 1];
            let matches = (n) => n.text === stringValue;
            let doesNotMatch = (n) => n.text !== stringValue;
            predicates[i].push(function (captures) {
              let nodes = [];
              for (const c of captures) {
                if (c.name === captureName) nodes.push(c.node);
              }
              let test = isPositive ? matches : doesNotMatch;
              return matchAll
                ? nodes.every(test)
                : nodes.some(test);
            });
          }
          break;

        case 'any-not-match?':
        case 'not-match?':
          isPositive = false;
        case 'any-match?':
        case 'match?':
          if (stepsLength !== 3) throw new Error(
            `Wrong number of arguments to \`#match?\` predicate. Expected 2, got ${stepsLength - 1}.`
          );
          if (steps[SECOND] !== PREDICATE_STEP_TYPE.CAPTURE) throw new Error(
            `First argument of \`#match?\` predicate must be a capture. Got "${steps[SECOND + 1]}".`
          );
          if (steps[THIRD] !== PREDICATE_STEP_TYPE.STRING) throw new Error(
            `Second argument of \`#match?\` predicate must be a string. Got @${steps[THIRD + 1]}.`
          );
          captureName = steps[SECOND + 1];
          const regex = new RegExp(steps[THIRD + 1]);
          matchAll = !operator.startsWith('any-');
          predicates[i].push(function (captures) {
            const nodes = [];
            for (const c of captures) {
              if (c.name === captureName) nodes.push(c.node.text);
            }
            let test = (text, positive) => {
              return positive ?
                regex.test(text) :
                !regex.test(text);
            };
            if (nodes.length === 0) return !isPositive;
            return matchAll
              ? nodes.every(text => test(text, isPositive))
              : nodes.some(text => test(text, isPositive))
            });
          break;

        case 'set!':
          if (stepsLength < 2 || stepsLength > 3) throw new Error(
            `Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${stepsLength - 1}.`
          );
          if (steps.some((s, i) => (i % 2 !== 1) && s !== PREDICATE_STEP_TYPE.STRING)) throw new Error(
            `Arguments to \`#set!\` predicate must be a strings.".`
          );
          if (!setProperties[i]) setProperties[i] = {};
          setProperties[i][steps[SECOND + 1]] = steps[THIRD] ? steps[THIRD + 1] : null;
          break;

        case 'is?':
        case 'is-not?':
          if (stepsLength < 2 || stepsLength > 3) throw new Error(
            `Wrong number of arguments to \`#${operator}\` predicate. Expected 1 or 2. Got ${stepsLength - 1}.`
          );
          if (steps.some((s, i) => (i % 2 !== 1) && s !== PREDICATE_STEP_TYPE.STRING)) throw new Error(
            `Arguments to \`#${operator}\` predicate must be a strings.".`
          );
          const properties = operator === 'is?' ? assertedProperties : refutedProperties;
          if (!properties[i]) properties[i] = {};
          properties[i][steps[SECOND + 1]] = steps[THIRD] ? steps[THIRD + 1] : null;
          break;

        case 'not-any-of?':
          isPositive = false;
        case 'any-of?':
          if (stepsLength < 2) throw new Error(
            `Wrong number of arguments to \`#${operator}\` predicate. Expected at least 1. Got ${stepsLength - 1}.`
          );
          if (steps[SECOND] !== PREDICATE_STEP_TYPE.CAPTURE) throw new Error(
            `First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`
          );
          stringValues = [];
          for (let k = THIRD; k < 2 * stepsLength; k += 2) {
            if (steps[k] !== PREDICATE_STEP_TYPE.STRING) throw new Error(
              `Arguments to \`#${operator}\` predicate must be a strings.".`
            );
            stringValues.push(steps[k + 1]);
          }
          captureName = steps[SECOND + 1];
          predicates[i].push(function (captures) {
            const nodes = [];
            for (const c of captures) {
              if (c.name === captureName) nodes.push(c.node.text);
            }
            if (nodes.length === 0) return !isPositive;
            return nodes.every(text => stringValues.includes(text)) === isPositive;
          });
          break;

        default:
          throw new Error(`Unknown query predicate \`#${steps[FIRST + 1]}\``);
      }
    }
  }

  this.predicates = Object.freeze(predicates);
  this.setProperties = Object.freeze(setProperties);
  this.assertedProperties = Object.freeze(assertedProperties);
  this.refutedProperties = Object.freeze(refutedProperties);
}

Query.prototype.matches = function(
  node,
  {
    startPosition = ZERO_POINT,
    endPosition = ZERO_POINT,
    startIndex = 0,
    endIndex = 0,
    matchLimit = 0xFFFFFFFF,
    maxStartDepth = 0xFFFFFFFF
  } = {}
) {
  marshalNode(node);
  const [returnedMatches, returnedNodes] = _matches.call(this, node.tree,
    startPosition.row, startPosition.column,
    endPosition.row, endPosition.column,
    startIndex, endIndex, matchLimit, maxStartDepth
  );
  const nodes = unmarshalNodes(returnedNodes, node.tree);
  const results = [];

  let i = 0
  let nodeIndex = 0;
  while (i < returnedMatches.length) {
    const patternIndex = returnedMatches[i++];
    const captures = [];

    while (i < returnedMatches.length && typeof returnedMatches[i] === 'string') {
      const captureName = returnedMatches[i++];
      captures.push({
        name: captureName,
        node: nodes[nodeIndex++],
      })
    }

    if (this.predicates[patternIndex].every(p => p(captures))) {
      const result = {pattern: patternIndex, captures};
      const setProperties = this.setProperties[patternIndex];
      const assertedProperties = this.assertedProperties[patternIndex];
      const refutedProperties = this.refutedProperties[patternIndex];
      if (setProperties) result.setProperties = setProperties;
      if (assertedProperties) result.assertedProperties = assertedProperties;
      if (refutedProperties) result.refutedProperties = refutedProperties;
      results.push(result);
    }
  }

  return results;
}

Query.prototype.captures = function(
  node,
  {
    startPosition = ZERO_POINT,
    endPosition = ZERO_POINT,
    startIndex = 0,
    endIndex = 0,
    matchLimit = 0xFFFFFFFF,
    maxStartDepth = 0xFFFFFFFF
  } = {}
) {
  marshalNode(node);
  const [returnedMatches, returnedNodes] = _captures.call(this, node.tree,
    startPosition.row, startPosition.column,
    endPosition.row, endPosition.column,
    startIndex, endIndex, matchLimit, maxStartDepth
  );
  const nodes = unmarshalNodes(returnedNodes, node.tree);
  const results = [];

  let i = 0
  let nodeIndex = 0;
  while (i < returnedMatches.length) {
    const patternIndex = returnedMatches[i++];
    const captureIndex = returnedMatches[i++];
    const captures = [];

    while (i < returnedMatches.length && typeof returnedMatches[i] === 'string') {
      const captureName = returnedMatches[i++];
      captures.push({
        name: captureName,
        node: nodes[nodeIndex++],
      })
    }

    if (this.predicates[patternIndex].every(p => p(captures))) {
      const result = captures[captureIndex];
      const setProperties = this.setProperties[patternIndex];
      const assertedProperties = this.assertedProperties[patternIndex];
      const refutedProperties = this.refutedProperties[patternIndex];
      if (setProperties) result.setProperties = setProperties;
      if (assertedProperties) result.assertedProperties = assertedProperties;
      if (refutedProperties) result.refutedProperties = refutedProperties;
      results.push(result);
    }
  }

  return results;
}

/*
 * LookaheadIterator
 */

LookaheadIterator.prototype[Symbol.iterator] = function() {
  const self = this;
  return {
    next() {
      if (self._next()) {
        return {done: false, value: self.currentType};
      }

      return {done: true, value: ''};
    },
  };
}

/*
 * Other functions
 */

function getTextFromString (node) {
  return this.input.substring(node.startIndex, node.endIndex);
}

function getTextFromFunction ({startIndex, endIndex}) {
  const {input} = this
  let result = '';
  const goalLength = endIndex - startIndex;
  while (result.length < goalLength) {
    const text = input(startIndex + result.length);
    result += text;
  }
  return result.slice(0, goalLength);
}

const {pointTransferArray} = binding;

const NODE_FIELD_COUNT = 6;
const ERROR_TYPE_ID = 0xFFFF

function getID(buffer, offset) {
  const low  = BigInt(buffer[offset]);
  const high = BigInt(buffer[offset + 1]);
  return (high << 32n) + low;
}

function unmarshalNode(value, tree, offset = 0, cache = null) {
  /* case 1: node from the tree cache */
  if (typeof value === 'object') {
    const node = value;
    return node;
  }

  /* case 2: node being transferred */
  const nodeTypeId = value;
  const NodeClass = nodeTypeId === ERROR_TYPE_ID
    ? SyntaxNode
    : tree.language.nodeSubclasses[nodeTypeId];

  const {nodeTransferArray} = binding;
  const id = getID(nodeTransferArray, offset)
  if (id === 0n) {
    return null
  }

  let cachedResult;
  if (cache && (cachedResult = cache.get(id)))
    return cachedResult;

  const result = new NodeClass(tree);
  for (let i = 0; i < NODE_FIELD_COUNT; i++) {
    result[i] = nodeTransferArray[offset + i];
  }

  if (cache)
    cache.set(id, result);
  else
    tree._cacheNode(result);

  return result;
}

function unmarshalNodes(nodes, tree) {
  const cache = new Map();

  let offset = 0;
  for (let i = 0, {length} = nodes; i < length; i++) {
    const node = unmarshalNode(nodes[i], tree, offset, cache);
    if (node !== nodes[i]) {
      nodes[i] = node;
      offset += NODE_FIELD_COUNT
    }
  }

  tree._cacheNodes(Array.from(cache.values()));

  return nodes;
}

function marshalNode(node) {
  if (!(node.tree instanceof Tree)){
    throw new TypeError("SyntaxNode must belong to a Tree")
  }
  const {nodeTransferArray} = binding;
  for (let i = 0; i < NODE_FIELD_COUNT; i++) {
    nodeTransferArray[i] = node[i];
  }
}

function unmarshalPoint() {
  return {row: pointTransferArray[0], column: pointTransferArray[1]};
}

function pointToString(point) {
  return `{row: ${point.row}, column: ${point.column}}`;
}

function initializeLanguageNodeClasses(language) {
  const nodeTypeNamesById = binding.getNodeTypeNamesById(language);
  const nodeFieldNamesById = binding.getNodeFieldNamesById(language);
  const nodeTypeInfo = language.nodeTypeInfo || [];

  const nodeSubclasses = [];
  for (let id = 0, n = nodeTypeNamesById.length; id < n; id++) {
    nodeSubclasses[id] = SyntaxNode;

    const typeName = nodeTypeNamesById[id];
    if (!typeName) continue;

    const typeInfo = nodeTypeInfo.find(info => info.named && info.type === typeName);
    if (!typeInfo) continue;

    const fieldNames = [];
    let classBody = '\n';
    if (typeInfo.fields) {
      for (const fieldName in typeInfo.fields) {
        const fieldId = nodeFieldNamesById.indexOf(fieldName);
        if (fieldId === -1) continue;
        if (typeInfo.fields[fieldName].multiple) {
          const getterName = camelCase(fieldName) + 'Nodes';
          fieldNames.push(getterName);
          classBody += `
            get ${getterName}() {
              marshalNode(this);
              return unmarshalNodes(NodeMethods.childNodesForFieldId(this.tree, ${fieldId}), this.tree);
            }
          `.replace(/\s+/g, ' ') + '\n';
        } else {
          const getterName = camelCase(fieldName, false) + 'Node';
          fieldNames.push(getterName);
          classBody += `
            get ${getterName}() {
              marshalNode(this);
              return unmarshalNode(NodeMethods.childNodeForFieldId(this.tree, ${fieldId}), this.tree);
            }
          `.replace(/\s+/g, ' ') + '\n';
        }
      }
    }

    const className = camelCase(typeName, true) + 'Node';
    const nodeSubclass = eval(`class ${className} extends SyntaxNode {${classBody}}; ${className}`);
    nodeSubclass.prototype.type = typeName;
    nodeSubclass.prototype.fields = Object.freeze(fieldNames.sort())
    nodeSubclasses[id] = nodeSubclass;
  }

  language.nodeSubclasses = nodeSubclasses
}

function camelCase(name, upperCase) {
  name = name.replace(/_(\w)/g, (_match, letter) => letter.toUpperCase());
  if (upperCase) name = name[0].toUpperCase() + name.slice(1);
  return name;
}

module.exports = Parser;
module.exports.Query = Query;
module.exports.Tree = Tree;
module.exports.SyntaxNode = SyntaxNode;
module.exports.TreeCursor = TreeCursor;
module.exports.LookaheadIterator = LookaheadIterator;


/***/ }),
/* 17 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const runtimeRequire =  true ? require : 0 // eslint-disable-line
if (typeof runtimeRequire.addon === 'function') { // if the platform supports native resolving prefer that
  module.exports = runtimeRequire.addon.bind(runtimeRequire)
} else { // else use the runtime version here
  module.exports = __webpack_require__(18)
}


/***/ }),
/* 18 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var fs = __webpack_require__(6)
var path = __webpack_require__(2)
var os = __webpack_require__(19)

// Workaround to fix webpack's build warnings: 'the request of a dependency is an expression'
var runtimeRequire =  true ? require : 0 // eslint-disable-line

var vars = (process.config && process.config.variables) || {}
var prebuildsOnly = !!process.env.PREBUILDS_ONLY
var abi = process.versions.modules // TODO: support old node where this is undef
var runtime = isElectron() ? 'electron' : (isNwjs() ? 'node-webkit' : 'node')

var arch = process.env.npm_config_arch || os.arch()
var platform = process.env.npm_config_platform || os.platform()
var libc = process.env.LIBC || (isAlpine(platform) ? 'musl' : 'glibc')
var armv = process.env.ARM_VERSION || (arch === 'arm64' ? '8' : vars.arm_version) || ''
var uv = (process.versions.uv || '').split('.')[0]

module.exports = load

function load (dir) {
  return runtimeRequire(load.resolve(dir))
}

load.resolve = load.path = function (dir) {
  dir = path.resolve(dir || '.')

  try {
    var name = runtimeRequire(path.join(dir, 'package.json')).name.toUpperCase().replace(/-/g, '_')
    if (process.env[name + '_PREBUILD']) dir = process.env[name + '_PREBUILD']
  } catch (err) {}

  if (!prebuildsOnly) {
    var release = getFirst(path.join(dir, 'build/Release'), matchBuild)
    if (release) return release

    var debug = getFirst(path.join(dir, 'build/Debug'), matchBuild)
    if (debug) return debug
  }

  var prebuild = resolve(dir)
  if (prebuild) return prebuild

  var nearby = resolve(path.dirname(process.execPath))
  if (nearby) return nearby

  var target = [
    'platform=' + platform,
    'arch=' + arch,
    'runtime=' + runtime,
    'abi=' + abi,
    'uv=' + uv,
    armv ? 'armv=' + armv : '',
    'libc=' + libc,
    'node=' + process.versions.node,
    process.versions.electron ? 'electron=' + process.versions.electron : '',
     true ? 'webpack=true' : 0 // eslint-disable-line
  ].filter(Boolean).join(' ')

  throw new Error('No native build was found for ' + target + '\n    loaded from: ' + dir + '\n')

  function resolve (dir) {
    // Find matching "prebuilds/<platform>-<arch>" directory
    var tuples = readdirSync(path.join(dir, 'prebuilds')).map(parseTuple)
    var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0]
    if (!tuple) return

    // Find most specific flavor first
    var prebuilds = path.join(dir, 'prebuilds', tuple.name)
    var parsed = readdirSync(prebuilds).map(parseTags)
    var candidates = parsed.filter(matchTags(runtime, abi))
    var winner = candidates.sort(compareTags(runtime))[0]
    if (winner) return path.join(prebuilds, winner.file)
  }
}

function readdirSync (dir) {
  try {
    return fs.readdirSync(dir)
  } catch (err) {
    return []
  }
}

function getFirst (dir, filter) {
  var files = readdirSync(dir).filter(filter)
  return files[0] && path.join(dir, files[0])
}

function matchBuild (name) {
  return /\.node$/.test(name)
}

function parseTuple (name) {
  // Example: darwin-x64+arm64
  var arr = name.split('-')
  if (arr.length !== 2) return

  var platform = arr[0]
  var architectures = arr[1].split('+')

  if (!platform) return
  if (!architectures.length) return
  if (!architectures.every(Boolean)) return

  return { name, platform, architectures }
}

function matchTuple (platform, arch) {
  return function (tuple) {
    if (tuple == null) return false
    if (tuple.platform !== platform) return false
    return tuple.architectures.includes(arch)
  }
}

function compareTuples (a, b) {
  // Prefer single-arch prebuilds over multi-arch
  return a.architectures.length - b.architectures.length
}

function parseTags (file) {
  var arr = file.split('.')
  var extension = arr.pop()
  var tags = { file: file, specificity: 0 }

  if (extension !== 'node') return

  for (var i = 0; i < arr.length; i++) {
    var tag = arr[i]

    if (tag === 'node' || tag === 'electron' || tag === 'node-webkit') {
      tags.runtime = tag
    } else if (tag === 'napi') {
      tags.napi = true
    } else if (tag.slice(0, 3) === 'abi') {
      tags.abi = tag.slice(3)
    } else if (tag.slice(0, 2) === 'uv') {
      tags.uv = tag.slice(2)
    } else if (tag.slice(0, 4) === 'armv') {
      tags.armv = tag.slice(4)
    } else if (tag === 'glibc' || tag === 'musl') {
      tags.libc = tag
    } else {
      continue
    }

    tags.specificity++
  }

  return tags
}

function matchTags (runtime, abi) {
  return function (tags) {
    if (tags == null) return false
    if (tags.runtime && tags.runtime !== runtime && !runtimeAgnostic(tags)) return false
    if (tags.abi && tags.abi !== abi && !tags.napi) return false
    if (tags.uv && tags.uv !== uv) return false
    if (tags.armv && tags.armv !== armv) return false
    if (tags.libc && tags.libc !== libc) return false

    return true
  }
}

function runtimeAgnostic (tags) {
  return tags.runtime === 'node' && tags.napi
}

function compareTags (runtime) {
  // Precedence: non-agnostic runtime, abi over napi, then by specificity.
  return function (a, b) {
    if (a.runtime !== b.runtime) {
      return a.runtime === runtime ? -1 : 1
    } else if (a.abi !== b.abi) {
      return a.abi ? -1 : 1
    } else if (a.specificity !== b.specificity) {
      return a.specificity > b.specificity ? -1 : 1
    } else {
      return 0
    }
  }
}

function isNwjs () {
  return !!(process.versions && process.versions.nw)
}

function isElectron () {
  if (process.versions && process.versions.electron) return true
  if (process.env.ELECTRON_RUN_AS_NODE) return true
  return typeof window !== 'undefined' && window.process && window.process.type === 'renderer'
}

function isAlpine (platform) {
  return platform === 'linux' && fs.existsSync('/etc/alpine-release')
}

// Exposed for unit tests
// TODO: move to lib
load.parseTags = parseTags
load.matchTags = matchTags
load.compareTags = compareTags
load.parseTuple = parseTuple
load.matchTuple = matchTuple
load.compareTuples = compareTuples


/***/ }),
/* 19 */
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),
/* 20 */
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),
/* 21 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const root = (__webpack_require__(2).join)(__dirname, "..", "..");

module.exports = __webpack_require__(17)(root);

try {
  module.exports.typescript.nodeTypeInfo = __webpack_require__(22);
  module.exports.tsx.nodeTypeInfo = __webpack_require__(23);
} catch (_) { }


/***/ }),
/* 22 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[{"type":"declaration","named":true,"subtypes":[{"type":"abstract_class_declaration","named":true},{"type":"ambient_declaration","named":true},{"type":"class_declaration","named":true},{"type":"enum_declaration","named":true},{"type":"function_declaration","named":true},{"type":"function_signature","named":true},{"type":"generator_function_declaration","named":true},{"type":"import_alias","named":true},{"type":"interface_declaration","named":true},{"type":"internal_module","named":true},{"type":"lexical_declaration","named":true},{"type":"module","named":true},{"type":"type_alias_declaration","named":true},{"type":"variable_declaration","named":true}]},{"type":"expression","named":true,"subtypes":[{"type":"as_expression","named":true},{"type":"assignment_expression","named":true},{"type":"augmented_assignment_expression","named":true},{"type":"await_expression","named":true},{"type":"binary_expression","named":true},{"type":"glimmer_template","named":true},{"type":"instantiation_expression","named":true},{"type":"internal_module","named":true},{"type":"new_expression","named":true},{"type":"primary_expression","named":true},{"type":"satisfies_expression","named":true},{"type":"ternary_expression","named":true},{"type":"type_assertion","named":true},{"type":"unary_expression","named":true},{"type":"update_expression","named":true},{"type":"yield_expression","named":true}]},{"type":"pattern","named":true,"subtypes":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"rest_pattern","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},{"type":"primary_expression","named":true,"subtypes":[{"type":"array","named":true},{"type":"arrow_function","named":true},{"type":"call_expression","named":true},{"type":"class","named":true},{"type":"false","named":true},{"type":"function_expression","named":true},{"type":"generator_function","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"meta_property","named":true},{"type":"non_null_expression","named":true},{"type":"null","named":true},{"type":"number","named":true},{"type":"object","named":true},{"type":"parenthesized_expression","named":true},{"type":"regex","named":true},{"type":"string","named":true},{"type":"subscript_expression","named":true},{"type":"super","named":true},{"type":"template_string","named":true},{"type":"this","named":true},{"type":"true","named":true},{"type":"undefined","named":true}]},{"type":"primary_type","named":true,"subtypes":[{"type":"array_type","named":true},{"type":"conditional_type","named":true},{"type":"const","named":false},{"type":"existential_type","named":true},{"type":"flow_maybe_type","named":true},{"type":"generic_type","named":true},{"type":"index_type_query","named":true},{"type":"intersection_type","named":true},{"type":"literal_type","named":true},{"type":"lookup_type","named":true},{"type":"nested_type_identifier","named":true},{"type":"object_type","named":true},{"type":"parenthesized_type","named":true},{"type":"predefined_type","named":true},{"type":"template_literal_type","named":true},{"type":"this_type","named":true},{"type":"tuple_type","named":true},{"type":"type_identifier","named":true},{"type":"type_query","named":true},{"type":"union_type","named":true}]},{"type":"statement","named":true,"subtypes":[{"type":"break_statement","named":true},{"type":"continue_statement","named":true},{"type":"debugger_statement","named":true},{"type":"declaration","named":true},{"type":"do_statement","named":true},{"type":"empty_statement","named":true},{"type":"export_statement","named":true},{"type":"expression_statement","named":true},{"type":"for_in_statement","named":true},{"type":"for_statement","named":true},{"type":"if_statement","named":true},{"type":"import_statement","named":true},{"type":"labeled_statement","named":true},{"type":"return_statement","named":true},{"type":"statement_block","named":true},{"type":"switch_statement","named":true},{"type":"throw_statement","named":true},{"type":"try_statement","named":true},{"type":"while_statement","named":true},{"type":"with_statement","named":true}]},{"type":"type","named":true,"subtypes":[{"type":"call_expression","named":true},{"type":"constructor_type","named":true},{"type":"function_type","named":true},{"type":"infer_type","named":true},{"type":"member_expression","named":true},{"type":"primary_type","named":true},{"type":"readonly_type","named":true}]},{"type":"abstract_class_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"abstract_method_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"accessibility_modifier","named":true,"fields":{}},{"type":"adding_type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"ambient_declaration","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"declaration","named":true},{"type":"property_identifier","named":true},{"type":"statement_block","named":true},{"type":"type","named":true}]}},{"type":"arguments","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"expression","named":true},{"type":"spread_element","named":true}]}},{"type":"array","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"expression","named":true},{"type":"spread_element","named":true}]}},{"type":"array_pattern","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"assignment_pattern","named":true},{"type":"pattern","named":true}]}},{"type":"array_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"primary_type","named":true}]}},{"type":"arrow_function","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"statement_block","named":true}]},"parameter":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":false,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"as_expression","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true},{"type":"type","named":true}]}},{"type":"asserts","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"this","named":true},{"type":"type_predicate","named":true}]}},{"type":"asserts_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"asserts","named":true}]}},{"type":"assignment_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"assignment_pattern","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"pattern","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"augmented_assignment_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"%=","named":false},{"type":"&&=","named":false},{"type":"&=","named":false},{"type":"**=","named":false},{"type":"*=","named":false},{"type":"+=","named":false},{"type":"-=","named":false},{"type":"/=","named":false},{"type":"<<=","named":false},{"type":">>=","named":false},{"type":">>>=","named":false},{"type":"??=","named":false},{"type":"^=","named":false},{"type":"|=","named":false},{"type":"||=","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"await_expression","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"binary_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"private_property_identifier","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"!=","named":false},{"type":"!==","named":false},{"type":"%","named":false},{"type":"&","named":false},{"type":"&&","named":false},{"type":"*","named":false},{"type":"**","named":false},{"type":"+","named":false},{"type":"-","named":false},{"type":"/","named":false},{"type":"<","named":false},{"type":"<<","named":false},{"type":"<=","named":false},{"type":"==","named":false},{"type":"===","named":false},{"type":">","named":false},{"type":">=","named":false},{"type":">>","named":false},{"type":">>>","named":false},{"type":"??","named":false},{"type":"^","named":false},{"type":"in","named":false},{"type":"instanceof","named":false},{"type":"|","named":false},{"type":"||","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"break_statement","named":true,"fields":{"label":{"multiple":false,"required":false,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"call_expression","named":true,"fields":{"arguments":{"multiple":false,"required":true,"types":[{"type":"arguments","named":true},{"type":"template_string","named":true}]},"function":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"import","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"call_signature","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"catch_clause","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"parameter":{"multiple":false,"required":false,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"object_pattern","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]}}},{"type":"class","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"class_body","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"abstract_method_signature","named":true},{"type":"class_static_block","named":true},{"type":"index_signature","named":true},{"type":"method_definition","named":true},{"type":"method_signature","named":true},{"type":"public_field_definition","named":true}]}},{"type":"class_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"class_heritage","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"extends_clause","named":true},{"type":"implements_clause","named":true}]}},{"type":"class_static_block","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]}}},{"type":"computed_property_name","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"conditional_type","named":true,"fields":{"alternative":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"left":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"constraint","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"construct_signature","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"constructor_type","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"type":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"continue_statement","named":true,"fields":{"label":{"multiple":false,"required":false,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"debugger_statement","named":true,"fields":{}},{"type":"decorator","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"call_expression","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true}]}},{"type":"default_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"do_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"else_clause","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]}},{"type":"empty_statement","named":true,"fields":{}},{"type":"enum_assignment","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"enum_body","named":true,"fields":{"name":{"multiple":true,"required":false,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"enum_assignment","named":true}]}},{"type":"enum_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"enum_body","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}}},{"type":"existential_type","named":true,"fields":{}},{"type":"export_clause","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"export_specifier","named":true}]}},{"type":"export_specifier","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}}},{"type":"export_statement","named":true,"fields":{"declaration":{"multiple":false,"required":false,"types":[{"type":"declaration","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"source":{"multiple":false,"required":false,"types":[{"type":"string","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"export_clause","named":true},{"type":"expression","named":true},{"type":"identifier","named":true},{"type":"namespace_export","named":true}]}},{"type":"expression_statement","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"extends_clause","named":true,"fields":{"type_arguments":{"multiple":true,"required":false,"types":[{"type":"type_arguments","named":true}]},"value":{"multiple":true,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"extends_type_clause","named":true,"fields":{"type":{"multiple":true,"required":true,"types":[{"type":"generic_type","named":true},{"type":"nested_type_identifier","named":true},{"type":"type_identifier","named":true}]}}},{"type":"finally_clause","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]}}},{"type":"flow_maybe_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"primary_type","named":true}]}},{"type":"for_in_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"kind":{"multiple":false,"required":false,"types":[{"type":"const","named":false},{"type":"let","named":false},{"type":"var","named":false}]},"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"in","named":false},{"type":"of","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}}},{"type":"for_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"empty_statement","named":true},{"type":"expression_statement","named":true}]},"increment":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]},"initializer":{"multiple":false,"required":true,"types":[{"type":"empty_statement","named":true},{"type":"expression_statement","named":true},{"type":"lexical_declaration","named":true},{"type":"variable_declaration","named":true}]}}},{"type":"formal_parameters","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"optional_parameter","named":true},{"type":"required_parameter","named":true}]}},{"type":"function_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"function_expression","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"function_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"function_type","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":true,"types":[{"type":"asserts","named":true},{"type":"type","named":true},{"type":"type_predicate","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"generator_function","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"generator_function_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"generic_type","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"nested_type_identifier","named":true},{"type":"type_identifier","named":true}]},"type_arguments":{"multiple":false,"required":true,"types":[{"type":"type_arguments","named":true}]}}},{"type":"glimmer_template","named":true,"fields":{"close_tag":{"multiple":false,"required":true,"types":[{"type":"glimmer_closing_tag","named":true}]},"open_tag":{"multiple":false,"required":true,"types":[{"type":"glimmer_opening_tag","named":true}]}}},{"type":"identifier","named":true,"fields":{}},{"type":"if_statement","named":true,"fields":{"alternative":{"multiple":false,"required":false,"types":[{"type":"else_clause","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]}}},{"type":"implements_clause","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"import","named":true,"fields":{}},{"type":"import_alias","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true}]}},{"type":"import_attribute","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"object","named":true}]}},{"type":"import_clause","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true},{"type":"named_imports","named":true},{"type":"namespace_import","named":true}]}},{"type":"import_require_clause","named":true,"fields":{"source":{"multiple":false,"required":true,"types":[{"type":"string","named":true}]}},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"import_specifier","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}}},{"type":"import_statement","named":true,"fields":{"source":{"multiple":false,"required":false,"types":[{"type":"string","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"import_attribute","named":true},{"type":"import_clause","named":true},{"type":"import_require_clause","named":true}]}},{"type":"index_signature","named":true,"fields":{"index_type":{"multiple":false,"required":false,"types":[{"type":"type","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"sign":{"multiple":false,"required":false,"types":[{"type":"+","named":false},{"type":"-","named":false}]},"type":{"multiple":false,"required":true,"types":[{"type":"adding_type_annotation","named":true},{"type":"omitting_type_annotation","named":true},{"type":"opting_type_annotation","named":true},{"type":"type_annotation","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"mapped_type_clause","named":true}]}},{"type":"index_type_query","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"primary_type","named":true}]}},{"type":"infer_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true},{"type":"type_identifier","named":true}]}},{"type":"instantiation_expression","named":true,"fields":{"function":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"import","named":true},{"type":"member_expression","named":true},{"type":"subscript_expression","named":true}]},"type_arguments":{"multiple":false,"required":true,"types":[{"type":"type_arguments","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},{"type":"interface_body","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"call_signature","named":true},{"type":"construct_signature","named":true},{"type":"export_statement","named":true},{"type":"index_signature","named":true},{"type":"method_signature","named":true},{"type":"property_signature","named":true}]}},{"type":"interface_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"interface_body","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"extends_type_clause","named":true}]}},{"type":"internal_module","named":true,"fields":{"body":{"multiple":false,"required":false,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true},{"type":"string","named":true}]}}},{"type":"intersection_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"jsx_attribute","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"jsx_element","named":true},{"type":"jsx_expression","named":true},{"type":"jsx_namespace_name","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]}},{"type":"jsx_closing_element","named":true,"fields":{"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]}}},{"type":"jsx_element","named":true,"fields":{"close_tag":{"multiple":false,"required":true,"types":[{"type":"jsx_closing_element","named":true}]},"open_tag":{"multiple":false,"required":true,"types":[{"type":"jsx_opening_element","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"html_character_reference","named":true},{"type":"jsx_element","named":true},{"type":"jsx_expression","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"jsx_text","named":true}]}},{"type":"jsx_expression","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true},{"type":"spread_element","named":true}]}},{"type":"jsx_namespace_name","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"jsx_opening_element","named":true,"fields":{"attribute":{"multiple":true,"required":false,"types":[{"type":"jsx_attribute","named":true},{"type":"jsx_expression","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"jsx_self_closing_element","named":true,"fields":{"attribute":{"multiple":true,"required":false,"types":[{"type":"jsx_attribute","named":true},{"type":"jsx_expression","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"jsx_text","named":true,"fields":{}},{"type":"labeled_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"label":{"multiple":false,"required":true,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"lexical_declaration","named":true,"fields":{"kind":{"multiple":false,"required":true,"types":[{"type":"const","named":false},{"type":"let","named":false}]}},"children":{"multiple":true,"required":true,"types":[{"type":"variable_declarator","named":true}]}},{"type":"literal_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"false","named":true},{"type":"null","named":true},{"type":"number","named":true},{"type":"string","named":true},{"type":"true","named":true},{"type":"unary_expression","named":true},{"type":"undefined","named":true}]}},{"type":"lookup_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"mapped_type_clause","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"type","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"member_expression","named":true,"fields":{"object":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"import","named":true}]},"optional_chain":{"multiple":false,"required":false,"types":[{"type":"optional_chain","named":true}]},"property":{"multiple":false,"required":true,"types":[{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true}]}}},{"type":"meta_property","named":true,"fields":{}},{"type":"method_definition","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"method_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"module","named":true,"fields":{"body":{"multiple":false,"required":false,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true},{"type":"string","named":true}]}}},{"type":"named_imports","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"import_specifier","named":true}]}},{"type":"namespace_export","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}},{"type":"namespace_import","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"nested_identifier","named":true,"fields":{"object":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"member_expression","named":true}]},"property":{"multiple":false,"required":true,"types":[{"type":"property_identifier","named":true}]}}},{"type":"nested_type_identifier","named":true,"fields":{"module":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]}}},{"type":"new_expression","named":true,"fields":{"arguments":{"multiple":false,"required":false,"types":[{"type":"arguments","named":true}]},"constructor":{"multiple":false,"required":true,"types":[{"type":"primary_expression","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"non_null_expression","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"object","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"method_definition","named":true},{"type":"pair","named":true},{"type":"shorthand_property_identifier","named":true},{"type":"spread_element","named":true}]}},{"type":"object_assignment_pattern","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"object_pattern","named":true},{"type":"shorthand_property_identifier_pattern","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"object_pattern","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"object_assignment_pattern","named":true},{"type":"pair_pattern","named":true},{"type":"rest_pattern","named":true},{"type":"shorthand_property_identifier_pattern","named":true}]}},{"type":"object_type","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"call_signature","named":true},{"type":"construct_signature","named":true},{"type":"export_statement","named":true},{"type":"index_signature","named":true},{"type":"method_signature","named":true},{"type":"property_signature","named":true}]}},{"type":"omitting_type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"opting_type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"optional_chain","named":true,"fields":{}},{"type":"optional_parameter","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"pattern":{"multiple":false,"required":false,"types":[{"type":"pattern","named":true},{"type":"this","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"optional_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"override_modifier","named":true,"fields":{}},{"type":"pair","named":true,"fields":{"key":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"pair_pattern","named":true,"fields":{"key":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"assignment_pattern","named":true},{"type":"pattern","named":true}]}}},{"type":"parenthesized_expression","named":true,"fields":{"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]}},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"parenthesized_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"predefined_type","named":true,"fields":{}},{"type":"program","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"hash_bang_line","named":true},{"type":"statement","named":true}]}},{"type":"property_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"public_field_definition","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"readonly_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"regex","named":true,"fields":{"flags":{"multiple":false,"required":false,"types":[{"type":"regex_flags","named":true}]},"pattern":{"multiple":false,"required":true,"types":[{"type":"regex_pattern","named":true}]}}},{"type":"required_parameter","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"rest_pattern","named":true}]},"pattern":{"multiple":false,"required":false,"types":[{"type":"pattern","named":true},{"type":"this","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"rest_pattern","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]}},{"type":"rest_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"return_statement","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"satisfies_expression","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true},{"type":"type","named":true}]}},{"type":"sequence_expression","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"spread_element","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"statement_block","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]}},{"type":"string","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"escape_sequence","named":true},{"type":"html_character_reference","named":true},{"type":"string_fragment","named":true}]}},{"type":"subscript_expression","named":true,"fields":{"index":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"number","named":true},{"type":"predefined_type","named":true},{"type":"sequence_expression","named":true},{"type":"string","named":true}]},"object":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"optional_chain":{"multiple":false,"required":false,"types":[{"type":"optional_chain","named":true}]}}},{"type":"switch_body","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"switch_case","named":true},{"type":"switch_default","named":true}]}},{"type":"switch_case","named":true,"fields":{"body":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}}},{"type":"switch_default","named":true,"fields":{"body":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]}}},{"type":"switch_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"switch_body","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"template_literal_type","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"string_fragment","named":true},{"type":"template_type","named":true}]}},{"type":"template_string","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"escape_sequence","named":true},{"type":"string_fragment","named":true},{"type":"template_substitution","named":true}]}},{"type":"template_substitution","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"template_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"infer_type","named":true},{"type":"primary_type","named":true}]}},{"type":"ternary_expression","named":true,"fields":{"alternative":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"throw_statement","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"try_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"finalizer":{"multiple":false,"required":false,"types":[{"type":"finally_clause","named":true}]},"handler":{"multiple":false,"required":false,"types":[{"type":"catch_clause","named":true}]}}},{"type":"tuple_type","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"optional_parameter","named":true},{"type":"optional_type","named":true},{"type":"required_parameter","named":true},{"type":"rest_type","named":true},{"type":"type","named":true}]}},{"type":"type_alias_declaration","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"type_arguments","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"type_assertion","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true},{"type":"type_arguments","named":true}]}},{"type":"type_parameter","named":true,"fields":{"constraint":{"multiple":false,"required":false,"types":[{"type":"constraint","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"default_type","named":true}]}}},{"type":"type_parameters","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type_parameter","named":true}]}},{"type":"type_predicate","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"this","named":true}]},"type":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"type_predicate_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type_predicate","named":true}]}},{"type":"type_query","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"call_expression","named":true},{"type":"identifier","named":true},{"type":"instantiation_expression","named":true},{"type":"member_expression","named":true},{"type":"subscript_expression","named":true},{"type":"this","named":true}]}},{"type":"unary_expression","named":true,"fields":{"argument":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"number","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"!","named":false},{"type":"+","named":false},{"type":"-","named":false},{"type":"delete","named":false},{"type":"typeof","named":false},{"type":"void","named":false},{"type":"~","named":false}]}}},{"type":"union_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"update_expression","named":true,"fields":{"argument":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"++","named":false},{"type":"--","named":false}]}}},{"type":"variable_declaration","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"variable_declarator","named":true}]}},{"type":"variable_declarator","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"object_pattern","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}}},{"type":"while_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"with_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"object":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"yield_expression","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},{"type":"!","named":false},{"type":"!=","named":false},{"type":"!==","named":false},{"type":"\\"","named":false},{"type":"${","named":false},{"type":"%","named":false},{"type":"%=","named":false},{"type":"&","named":false},{"type":"&&","named":false},{"type":"&&=","named":false},{"type":"&=","named":false},{"type":"\'","named":false},{"type":"(","named":false},{"type":")","named":false},{"type":"*","named":false},{"type":"**","named":false},{"type":"**=","named":false},{"type":"*=","named":false},{"type":"+","named":false},{"type":"++","named":false},{"type":"+=","named":false},{"type":"+?:","named":false},{"type":",","named":false},{"type":"-","named":false},{"type":"--","named":false},{"type":"-=","named":false},{"type":"-?:","named":false},{"type":".","named":false},{"type":"...","named":false},{"type":"/","named":false},{"type":"/=","named":false},{"type":"/>","named":false},{"type":":","named":false},{"type":";","named":false},{"type":"<","named":false},{"type":"</","named":false},{"type":"<<","named":false},{"type":"<<=","named":false},{"type":"<=","named":false},{"type":"=","named":false},{"type":"==","named":false},{"type":"===","named":false},{"type":"=>","named":false},{"type":">","named":false},{"type":">=","named":false},{"type":">>","named":false},{"type":">>=","named":false},{"type":">>>","named":false},{"type":">>>=","named":false},{"type":"?","named":false},{"type":"?.","named":false},{"type":"?:","named":false},{"type":"??","named":false},{"type":"??=","named":false},{"type":"@","named":false},{"type":"[","named":false},{"type":"]","named":false},{"type":"^","named":false},{"type":"^=","named":false},{"type":"`","named":false},{"type":"abstract","named":false},{"type":"accessor","named":false},{"type":"any","named":false},{"type":"as","named":false},{"type":"asserts","named":false},{"type":"async","named":false},{"type":"await","named":false},{"type":"boolean","named":false},{"type":"break","named":false},{"type":"case","named":false},{"type":"catch","named":false},{"type":"class","named":false},{"type":"comment","named":true},{"type":"const","named":false},{"type":"continue","named":false},{"type":"debugger","named":false},{"type":"declare","named":false},{"type":"default","named":false},{"type":"delete","named":false},{"type":"do","named":false},{"type":"else","named":false},{"type":"enum","named":false},{"type":"escape_sequence","named":true},{"type":"export","named":false},{"type":"extends","named":false},{"type":"false","named":true},{"type":"finally","named":false},{"type":"for","named":false},{"type":"from","named":false},{"type":"function","named":false},{"type":"get","named":false},{"type":"glimmer_closing_tag","named":true},{"type":"glimmer_opening_tag","named":true},{"type":"global","named":false},{"type":"hash_bang_line","named":true},{"type":"html_character_reference","named":true},{"type":"html_comment","named":true},{"type":"if","named":false},{"type":"implements","named":false},{"type":"import","named":false},{"type":"in","named":false},{"type":"infer","named":false},{"type":"instanceof","named":false},{"type":"interface","named":false},{"type":"is","named":false},{"type":"keyof","named":false},{"type":"let","named":false},{"type":"module","named":false},{"type":"namespace","named":false},{"type":"never","named":false},{"type":"new","named":false},{"type":"null","named":true},{"type":"number","named":true},{"type":"number","named":false},{"type":"object","named":false},{"type":"of","named":false},{"type":"override","named":false},{"type":"private","named":false},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"protected","named":false},{"type":"public","named":false},{"type":"readonly","named":false},{"type":"regex_flags","named":true},{"type":"regex_pattern","named":true},{"type":"require","named":false},{"type":"return","named":false},{"type":"satisfies","named":false},{"type":"set","named":false},{"type":"shorthand_property_identifier","named":true},{"type":"shorthand_property_identifier_pattern","named":true},{"type":"statement_identifier","named":true},{"type":"static","named":false},{"type":"string","named":false},{"type":"string_fragment","named":true},{"type":"super","named":true},{"type":"switch","named":false},{"type":"symbol","named":false},{"type":"target","named":false},{"type":"this","named":true},{"type":"this_type","named":true},{"type":"throw","named":false},{"type":"true","named":true},{"type":"try","named":false},{"type":"type","named":false},{"type":"type_identifier","named":true},{"type":"typeof","named":false},{"type":"undefined","named":true},{"type":"unique symbol","named":false},{"type":"unknown","named":false},{"type":"using","named":false},{"type":"var","named":false},{"type":"void","named":false},{"type":"while","named":false},{"type":"with","named":false},{"type":"yield","named":false},{"type":"{","named":false},{"type":"{|","named":false},{"type":"|","named":false},{"type":"|=","named":false},{"type":"||","named":false},{"type":"||=","named":false},{"type":"|}","named":false},{"type":"}","named":false},{"type":"~","named":false}]');

/***/ }),
/* 23 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[{"type":"declaration","named":true,"subtypes":[{"type":"abstract_class_declaration","named":true},{"type":"ambient_declaration","named":true},{"type":"class_declaration","named":true},{"type":"enum_declaration","named":true},{"type":"function_declaration","named":true},{"type":"function_signature","named":true},{"type":"generator_function_declaration","named":true},{"type":"import_alias","named":true},{"type":"interface_declaration","named":true},{"type":"internal_module","named":true},{"type":"lexical_declaration","named":true},{"type":"module","named":true},{"type":"type_alias_declaration","named":true},{"type":"variable_declaration","named":true}]},{"type":"expression","named":true,"subtypes":[{"type":"as_expression","named":true},{"type":"assignment_expression","named":true},{"type":"augmented_assignment_expression","named":true},{"type":"await_expression","named":true},{"type":"binary_expression","named":true},{"type":"glimmer_template","named":true},{"type":"instantiation_expression","named":true},{"type":"internal_module","named":true},{"type":"jsx_element","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"new_expression","named":true},{"type":"primary_expression","named":true},{"type":"satisfies_expression","named":true},{"type":"ternary_expression","named":true},{"type":"unary_expression","named":true},{"type":"update_expression","named":true},{"type":"yield_expression","named":true}]},{"type":"pattern","named":true,"subtypes":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"rest_pattern","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},{"type":"primary_expression","named":true,"subtypes":[{"type":"array","named":true},{"type":"arrow_function","named":true},{"type":"call_expression","named":true},{"type":"class","named":true},{"type":"false","named":true},{"type":"function_expression","named":true},{"type":"generator_function","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"meta_property","named":true},{"type":"non_null_expression","named":true},{"type":"null","named":true},{"type":"number","named":true},{"type":"object","named":true},{"type":"parenthesized_expression","named":true},{"type":"regex","named":true},{"type":"string","named":true},{"type":"subscript_expression","named":true},{"type":"super","named":true},{"type":"template_string","named":true},{"type":"this","named":true},{"type":"true","named":true},{"type":"undefined","named":true}]},{"type":"primary_type","named":true,"subtypes":[{"type":"array_type","named":true},{"type":"conditional_type","named":true},{"type":"const","named":false},{"type":"existential_type","named":true},{"type":"flow_maybe_type","named":true},{"type":"generic_type","named":true},{"type":"index_type_query","named":true},{"type":"intersection_type","named":true},{"type":"literal_type","named":true},{"type":"lookup_type","named":true},{"type":"nested_type_identifier","named":true},{"type":"object_type","named":true},{"type":"parenthesized_type","named":true},{"type":"predefined_type","named":true},{"type":"template_literal_type","named":true},{"type":"this_type","named":true},{"type":"tuple_type","named":true},{"type":"type_identifier","named":true},{"type":"type_query","named":true},{"type":"union_type","named":true}]},{"type":"statement","named":true,"subtypes":[{"type":"break_statement","named":true},{"type":"continue_statement","named":true},{"type":"debugger_statement","named":true},{"type":"declaration","named":true},{"type":"do_statement","named":true},{"type":"empty_statement","named":true},{"type":"export_statement","named":true},{"type":"expression_statement","named":true},{"type":"for_in_statement","named":true},{"type":"for_statement","named":true},{"type":"if_statement","named":true},{"type":"import_statement","named":true},{"type":"labeled_statement","named":true},{"type":"return_statement","named":true},{"type":"statement_block","named":true},{"type":"switch_statement","named":true},{"type":"throw_statement","named":true},{"type":"try_statement","named":true},{"type":"while_statement","named":true},{"type":"with_statement","named":true}]},{"type":"type","named":true,"subtypes":[{"type":"call_expression","named":true},{"type":"constructor_type","named":true},{"type":"function_type","named":true},{"type":"infer_type","named":true},{"type":"member_expression","named":true},{"type":"primary_type","named":true},{"type":"readonly_type","named":true}]},{"type":"abstract_class_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"abstract_method_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"accessibility_modifier","named":true,"fields":{}},{"type":"adding_type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"ambient_declaration","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"declaration","named":true},{"type":"property_identifier","named":true},{"type":"statement_block","named":true},{"type":"type","named":true}]}},{"type":"arguments","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"expression","named":true},{"type":"spread_element","named":true}]}},{"type":"array","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"expression","named":true},{"type":"spread_element","named":true}]}},{"type":"array_pattern","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"assignment_pattern","named":true},{"type":"pattern","named":true}]}},{"type":"array_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"primary_type","named":true}]}},{"type":"arrow_function","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"statement_block","named":true}]},"parameter":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":false,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"as_expression","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true},{"type":"type","named":true}]}},{"type":"asserts","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"this","named":true},{"type":"type_predicate","named":true}]}},{"type":"asserts_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"asserts","named":true}]}},{"type":"assignment_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"assignment_pattern","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"pattern","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"augmented_assignment_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"%=","named":false},{"type":"&&=","named":false},{"type":"&=","named":false},{"type":"**=","named":false},{"type":"*=","named":false},{"type":"+=","named":false},{"type":"-=","named":false},{"type":"/=","named":false},{"type":"<<=","named":false},{"type":">>=","named":false},{"type":">>>=","named":false},{"type":"??=","named":false},{"type":"^=","named":false},{"type":"|=","named":false},{"type":"||=","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"await_expression","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"binary_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"private_property_identifier","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"!=","named":false},{"type":"!==","named":false},{"type":"%","named":false},{"type":"&","named":false},{"type":"&&","named":false},{"type":"*","named":false},{"type":"**","named":false},{"type":"+","named":false},{"type":"-","named":false},{"type":"/","named":false},{"type":"<","named":false},{"type":"<<","named":false},{"type":"<=","named":false},{"type":"==","named":false},{"type":"===","named":false},{"type":">","named":false},{"type":">=","named":false},{"type":">>","named":false},{"type":">>>","named":false},{"type":"??","named":false},{"type":"^","named":false},{"type":"in","named":false},{"type":"instanceof","named":false},{"type":"|","named":false},{"type":"||","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"break_statement","named":true,"fields":{"label":{"multiple":false,"required":false,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"call_expression","named":true,"fields":{"arguments":{"multiple":false,"required":true,"types":[{"type":"arguments","named":true},{"type":"template_string","named":true}]},"function":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"import","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"call_signature","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"catch_clause","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"parameter":{"multiple":false,"required":false,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"object_pattern","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]}}},{"type":"class","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"class_body","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"abstract_method_signature","named":true},{"type":"class_static_block","named":true},{"type":"index_signature","named":true},{"type":"method_definition","named":true},{"type":"method_signature","named":true},{"type":"public_field_definition","named":true}]}},{"type":"class_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"class_heritage","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"extends_clause","named":true},{"type":"implements_clause","named":true}]}},{"type":"class_static_block","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]}}},{"type":"computed_property_name","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"conditional_type","named":true,"fields":{"alternative":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"left":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"constraint","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"construct_signature","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"constructor_type","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"type":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"continue_statement","named":true,"fields":{"label":{"multiple":false,"required":false,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"debugger_statement","named":true,"fields":{}},{"type":"decorator","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"call_expression","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true}]}},{"type":"default_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"do_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"else_clause","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]}},{"type":"empty_statement","named":true,"fields":{}},{"type":"enum_assignment","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"enum_body","named":true,"fields":{"name":{"multiple":true,"required":false,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"enum_assignment","named":true}]}},{"type":"enum_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"enum_body","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}}},{"type":"existential_type","named":true,"fields":{}},{"type":"export_clause","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"export_specifier","named":true}]}},{"type":"export_specifier","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}}},{"type":"export_statement","named":true,"fields":{"declaration":{"multiple":false,"required":false,"types":[{"type":"declaration","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"source":{"multiple":false,"required":false,"types":[{"type":"string","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"export_clause","named":true},{"type":"expression","named":true},{"type":"identifier","named":true},{"type":"namespace_export","named":true}]}},{"type":"expression_statement","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"extends_clause","named":true,"fields":{"type_arguments":{"multiple":true,"required":false,"types":[{"type":"type_arguments","named":true}]},"value":{"multiple":true,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"extends_type_clause","named":true,"fields":{"type":{"multiple":true,"required":true,"types":[{"type":"generic_type","named":true},{"type":"nested_type_identifier","named":true},{"type":"type_identifier","named":true}]}}},{"type":"finally_clause","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]}}},{"type":"flow_maybe_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"primary_type","named":true}]}},{"type":"for_in_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"kind":{"multiple":false,"required":false,"types":[{"type":"const","named":false},{"type":"let","named":false},{"type":"var","named":false}]},"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"in","named":false},{"type":"of","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}}},{"type":"for_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"empty_statement","named":true},{"type":"expression_statement","named":true}]},"increment":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]},"initializer":{"multiple":false,"required":true,"types":[{"type":"empty_statement","named":true},{"type":"expression_statement","named":true},{"type":"lexical_declaration","named":true},{"type":"variable_declaration","named":true}]}}},{"type":"formal_parameters","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"optional_parameter","named":true},{"type":"required_parameter","named":true}]}},{"type":"function_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"function_expression","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"function_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"function_type","named":true,"fields":{"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":true,"types":[{"type":"asserts","named":true},{"type":"type","named":true},{"type":"type_predicate","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"generator_function","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"generator_function_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}}},{"type":"generic_type","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"nested_type_identifier","named":true},{"type":"type_identifier","named":true}]},"type_arguments":{"multiple":false,"required":true,"types":[{"type":"type_arguments","named":true}]}}},{"type":"glimmer_template","named":true,"fields":{"close_tag":{"multiple":false,"required":true,"types":[{"type":"glimmer_closing_tag","named":true}]},"open_tag":{"multiple":false,"required":true,"types":[{"type":"glimmer_opening_tag","named":true}]}}},{"type":"identifier","named":true,"fields":{}},{"type":"if_statement","named":true,"fields":{"alternative":{"multiple":false,"required":false,"types":[{"type":"else_clause","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]}}},{"type":"implements_clause","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"import","named":true,"fields":{}},{"type":"import_alias","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true}]}},{"type":"import_attribute","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"object","named":true}]}},{"type":"import_clause","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true},{"type":"named_imports","named":true},{"type":"namespace_import","named":true}]}},{"type":"import_require_clause","named":true,"fields":{"source":{"multiple":false,"required":true,"types":[{"type":"string","named":true}]}},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"import_specifier","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}}},{"type":"import_statement","named":true,"fields":{"source":{"multiple":false,"required":false,"types":[{"type":"string","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"import_attribute","named":true},{"type":"import_clause","named":true},{"type":"import_require_clause","named":true}]}},{"type":"index_signature","named":true,"fields":{"index_type":{"multiple":false,"required":false,"types":[{"type":"type","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"sign":{"multiple":false,"required":false,"types":[{"type":"+","named":false},{"type":"-","named":false}]},"type":{"multiple":false,"required":true,"types":[{"type":"adding_type_annotation","named":true},{"type":"omitting_type_annotation","named":true},{"type":"opting_type_annotation","named":true},{"type":"type_annotation","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"mapped_type_clause","named":true}]}},{"type":"index_type_query","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"primary_type","named":true}]}},{"type":"infer_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true},{"type":"type_identifier","named":true}]}},{"type":"instantiation_expression","named":true,"fields":{"function":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"import","named":true},{"type":"member_expression","named":true},{"type":"subscript_expression","named":true}]},"type_arguments":{"multiple":false,"required":true,"types":[{"type":"type_arguments","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},{"type":"interface_body","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"call_signature","named":true},{"type":"construct_signature","named":true},{"type":"export_statement","named":true},{"type":"index_signature","named":true},{"type":"method_signature","named":true},{"type":"property_signature","named":true}]}},{"type":"interface_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"interface_body","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"extends_type_clause","named":true}]}},{"type":"internal_module","named":true,"fields":{"body":{"multiple":false,"required":false,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true},{"type":"string","named":true}]}}},{"type":"intersection_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"jsx_attribute","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"jsx_element","named":true},{"type":"jsx_expression","named":true},{"type":"jsx_namespace_name","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]}},{"type":"jsx_closing_element","named":true,"fields":{"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]}}},{"type":"jsx_element","named":true,"fields":{"close_tag":{"multiple":false,"required":true,"types":[{"type":"jsx_closing_element","named":true}]},"open_tag":{"multiple":false,"required":true,"types":[{"type":"jsx_opening_element","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"html_character_reference","named":true},{"type":"jsx_element","named":true},{"type":"jsx_expression","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"jsx_text","named":true}]}},{"type":"jsx_expression","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true},{"type":"spread_element","named":true}]}},{"type":"jsx_namespace_name","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"jsx_opening_element","named":true,"fields":{"attribute":{"multiple":true,"required":false,"types":[{"type":"jsx_attribute","named":true},{"type":"jsx_expression","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"jsx_self_closing_element","named":true,"fields":{"attribute":{"multiple":true,"required":false,"types":[{"type":"jsx_attribute","named":true},{"type":"jsx_expression","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"jsx_text","named":true,"fields":{}},{"type":"labeled_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"label":{"multiple":false,"required":true,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"lexical_declaration","named":true,"fields":{"kind":{"multiple":false,"required":true,"types":[{"type":"const","named":false},{"type":"let","named":false}]}},"children":{"multiple":true,"required":true,"types":[{"type":"variable_declarator","named":true}]}},{"type":"literal_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"false","named":true},{"type":"null","named":true},{"type":"number","named":true},{"type":"string","named":true},{"type":"true","named":true},{"type":"unary_expression","named":true},{"type":"undefined","named":true}]}},{"type":"lookup_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"mapped_type_clause","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"type","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"member_expression","named":true,"fields":{"object":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"import","named":true}]},"optional_chain":{"multiple":false,"required":false,"types":[{"type":"optional_chain","named":true}]},"property":{"multiple":false,"required":true,"types":[{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true}]}}},{"type":"meta_property","named":true,"fields":{}},{"type":"method_definition","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"method_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]},"return_type":{"multiple":false,"required":false,"types":[{"type":"asserts_annotation","named":true},{"type":"type_annotation","named":true},{"type":"type_predicate_annotation","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"module","named":true,"fields":{"body":{"multiple":false,"required":false,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true},{"type":"string","named":true}]}}},{"type":"named_imports","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"import_specifier","named":true}]}},{"type":"namespace_export","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}},{"type":"namespace_import","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"nested_identifier","named":true,"fields":{"object":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"member_expression","named":true}]},"property":{"multiple":false,"required":true,"types":[{"type":"property_identifier","named":true}]}}},{"type":"nested_type_identifier","named":true,"fields":{"module":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"nested_identifier","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]}}},{"type":"new_expression","named":true,"fields":{"arguments":{"multiple":false,"required":false,"types":[{"type":"arguments","named":true}]},"constructor":{"multiple":false,"required":true,"types":[{"type":"primary_expression","named":true}]},"type_arguments":{"multiple":false,"required":false,"types":[{"type":"type_arguments","named":true}]}}},{"type":"non_null_expression","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"object","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"method_definition","named":true},{"type":"pair","named":true},{"type":"shorthand_property_identifier","named":true},{"type":"spread_element","named":true}]}},{"type":"object_assignment_pattern","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"object_pattern","named":true},{"type":"shorthand_property_identifier_pattern","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"object_pattern","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"object_assignment_pattern","named":true},{"type":"pair_pattern","named":true},{"type":"rest_pattern","named":true},{"type":"shorthand_property_identifier_pattern","named":true}]}},{"type":"object_type","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"call_signature","named":true},{"type":"construct_signature","named":true},{"type":"export_statement","named":true},{"type":"index_signature","named":true},{"type":"method_signature","named":true},{"type":"property_signature","named":true}]}},{"type":"omitting_type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"opting_type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"optional_chain","named":true,"fields":{}},{"type":"optional_parameter","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"pattern":{"multiple":false,"required":false,"types":[{"type":"pattern","named":true},{"type":"this","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"optional_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"override_modifier","named":true,"fields":{}},{"type":"pair","named":true,"fields":{"key":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"pair_pattern","named":true,"fields":{"key":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"assignment_pattern","named":true},{"type":"pattern","named":true}]}}},{"type":"parenthesized_expression","named":true,"fields":{"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]}},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"parenthesized_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"predefined_type","named":true,"fields":{}},{"type":"program","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"hash_bang_line","named":true},{"type":"statement","named":true}]}},{"type":"property_signature","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"public_field_definition","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"readonly_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"regex","named":true,"fields":{"flags":{"multiple":false,"required":false,"types":[{"type":"regex_flags","named":true}]},"pattern":{"multiple":false,"required":true,"types":[{"type":"regex_pattern","named":true}]}}},{"type":"required_parameter","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"rest_pattern","named":true}]},"pattern":{"multiple":false,"required":false,"types":[{"type":"pattern","named":true},{"type":"this","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"accessibility_modifier","named":true},{"type":"override_modifier","named":true}]}},{"type":"rest_pattern","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"non_null_expression","named":true},{"type":"object_pattern","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]}},{"type":"rest_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"return_statement","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"satisfies_expression","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true},{"type":"type","named":true}]}},{"type":"sequence_expression","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"spread_element","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"statement_block","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]}},{"type":"string","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"escape_sequence","named":true},{"type":"html_character_reference","named":true},{"type":"string_fragment","named":true}]}},{"type":"subscript_expression","named":true,"fields":{"index":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"number","named":true},{"type":"predefined_type","named":true},{"type":"sequence_expression","named":true},{"type":"string","named":true}]},"object":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"optional_chain":{"multiple":false,"required":false,"types":[{"type":"optional_chain","named":true}]}}},{"type":"switch_body","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"switch_case","named":true},{"type":"switch_default","named":true}]}},{"type":"switch_case","named":true,"fields":{"body":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}}},{"type":"switch_default","named":true,"fields":{"body":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]}}},{"type":"switch_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"switch_body","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"template_literal_type","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"string_fragment","named":true},{"type":"template_type","named":true}]}},{"type":"template_string","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"escape_sequence","named":true},{"type":"string_fragment","named":true},{"type":"template_substitution","named":true}]}},{"type":"template_substitution","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"template_type","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"infer_type","named":true},{"type":"primary_type","named":true}]}},{"type":"ternary_expression","named":true,"fields":{"alternative":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"throw_statement","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"try_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"finalizer":{"multiple":false,"required":false,"types":[{"type":"finally_clause","named":true}]},"handler":{"multiple":false,"required":false,"types":[{"type":"catch_clause","named":true}]}}},{"type":"tuple_type","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"optional_parameter","named":true},{"type":"optional_type","named":true},{"type":"required_parameter","named":true},{"type":"rest_type","named":true},{"type":"type","named":true}]}},{"type":"type_alias_declaration","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"type_parameters":{"multiple":false,"required":false,"types":[{"type":"type_parameters","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"type_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}},{"type":"type_arguments","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"type_parameter","named":true,"fields":{"constraint":{"multiple":false,"required":false,"types":[{"type":"constraint","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"type_identifier","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"default_type","named":true}]}}},{"type":"type_parameters","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type_parameter","named":true}]}},{"type":"type_predicate","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"this","named":true}]},"type":{"multiple":false,"required":true,"types":[{"type":"type","named":true}]}}},{"type":"type_predicate_annotation","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"type_predicate","named":true}]}},{"type":"type_query","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"call_expression","named":true},{"type":"identifier","named":true},{"type":"instantiation_expression","named":true},{"type":"member_expression","named":true},{"type":"subscript_expression","named":true},{"type":"this","named":true}]}},{"type":"unary_expression","named":true,"fields":{"argument":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"number","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"!","named":false},{"type":"+","named":false},{"type":"-","named":false},{"type":"delete","named":false},{"type":"typeof","named":false},{"type":"void","named":false},{"type":"~","named":false}]}}},{"type":"union_type","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"type","named":true}]}},{"type":"update_expression","named":true,"fields":{"argument":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"++","named":false},{"type":"--","named":false}]}}},{"type":"variable_declaration","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"variable_declarator","named":true}]}},{"type":"variable_declarator","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"object_pattern","named":true}]},"type":{"multiple":false,"required":false,"types":[{"type":"type_annotation","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}}},{"type":"while_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"with_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"object":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"yield_expression","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},{"type":"!","named":false},{"type":"!=","named":false},{"type":"!==","named":false},{"type":"\\"","named":false},{"type":"${","named":false},{"type":"%","named":false},{"type":"%=","named":false},{"type":"&","named":false},{"type":"&&","named":false},{"type":"&&=","named":false},{"type":"&=","named":false},{"type":"\'","named":false},{"type":"(","named":false},{"type":")","named":false},{"type":"*","named":false},{"type":"**","named":false},{"type":"**=","named":false},{"type":"*=","named":false},{"type":"+","named":false},{"type":"++","named":false},{"type":"+=","named":false},{"type":"+?:","named":false},{"type":",","named":false},{"type":"-","named":false},{"type":"--","named":false},{"type":"-=","named":false},{"type":"-?:","named":false},{"type":".","named":false},{"type":"...","named":false},{"type":"/","named":false},{"type":"/=","named":false},{"type":"/>","named":false},{"type":":","named":false},{"type":";","named":false},{"type":"<","named":false},{"type":"</","named":false},{"type":"<<","named":false},{"type":"<<=","named":false},{"type":"<=","named":false},{"type":"=","named":false},{"type":"==","named":false},{"type":"===","named":false},{"type":"=>","named":false},{"type":">","named":false},{"type":">=","named":false},{"type":">>","named":false},{"type":">>=","named":false},{"type":">>>","named":false},{"type":">>>=","named":false},{"type":"?","named":false},{"type":"?.","named":false},{"type":"?:","named":false},{"type":"??","named":false},{"type":"??=","named":false},{"type":"@","named":false},{"type":"[","named":false},{"type":"]","named":false},{"type":"^","named":false},{"type":"^=","named":false},{"type":"`","named":false},{"type":"abstract","named":false},{"type":"accessor","named":false},{"type":"any","named":false},{"type":"as","named":false},{"type":"asserts","named":false},{"type":"async","named":false},{"type":"await","named":false},{"type":"boolean","named":false},{"type":"break","named":false},{"type":"case","named":false},{"type":"catch","named":false},{"type":"class","named":false},{"type":"comment","named":true},{"type":"const","named":false},{"type":"continue","named":false},{"type":"debugger","named":false},{"type":"declare","named":false},{"type":"default","named":false},{"type":"delete","named":false},{"type":"do","named":false},{"type":"else","named":false},{"type":"enum","named":false},{"type":"escape_sequence","named":true},{"type":"export","named":false},{"type":"extends","named":false},{"type":"false","named":true},{"type":"finally","named":false},{"type":"for","named":false},{"type":"from","named":false},{"type":"function","named":false},{"type":"get","named":false},{"type":"glimmer_closing_tag","named":true},{"type":"glimmer_opening_tag","named":true},{"type":"global","named":false},{"type":"hash_bang_line","named":true},{"type":"html_character_reference","named":true},{"type":"html_comment","named":true},{"type":"if","named":false},{"type":"implements","named":false},{"type":"import","named":false},{"type":"in","named":false},{"type":"infer","named":false},{"type":"instanceof","named":false},{"type":"interface","named":false},{"type":"is","named":false},{"type":"keyof","named":false},{"type":"let","named":false},{"type":"module","named":false},{"type":"namespace","named":false},{"type":"never","named":false},{"type":"new","named":false},{"type":"null","named":true},{"type":"number","named":true},{"type":"number","named":false},{"type":"object","named":false},{"type":"of","named":false},{"type":"override","named":false},{"type":"private","named":false},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"protected","named":false},{"type":"public","named":false},{"type":"readonly","named":false},{"type":"regex_flags","named":true},{"type":"regex_pattern","named":true},{"type":"require","named":false},{"type":"return","named":false},{"type":"satisfies","named":false},{"type":"set","named":false},{"type":"shorthand_property_identifier","named":true},{"type":"shorthand_property_identifier_pattern","named":true},{"type":"statement_identifier","named":true},{"type":"static","named":false},{"type":"string","named":false},{"type":"string_fragment","named":true},{"type":"super","named":true},{"type":"switch","named":false},{"type":"symbol","named":false},{"type":"target","named":false},{"type":"this","named":true},{"type":"this_type","named":true},{"type":"throw","named":false},{"type":"true","named":true},{"type":"try","named":false},{"type":"type","named":false},{"type":"type_identifier","named":true},{"type":"typeof","named":false},{"type":"undefined","named":true},{"type":"unique symbol","named":false},{"type":"unknown","named":false},{"type":"using","named":false},{"type":"var","named":false},{"type":"void","named":false},{"type":"while","named":false},{"type":"with","named":false},{"type":"yield","named":false},{"type":"{","named":false},{"type":"{|","named":false},{"type":"|","named":false},{"type":"|=","named":false},{"type":"||","named":false},{"type":"||=","named":false},{"type":"|}","named":false},{"type":"}","named":false},{"type":"~","named":false}]');

/***/ }),
/* 24 */
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

const root = (__webpack_require__(2).join)(__dirname, "..", "..");

module.exports = __webpack_require__(17)(root);

try {
  module.exports.nodeTypeInfo = __webpack_require__(25);
} catch (_) {}


/***/ }),
/* 25 */
/***/ ((module) => {

"use strict";
module.exports = /*#__PURE__*/JSON.parse('[{"type":"declaration","named":true,"subtypes":[{"type":"class_declaration","named":true},{"type":"function_declaration","named":true},{"type":"generator_function_declaration","named":true},{"type":"lexical_declaration","named":true},{"type":"variable_declaration","named":true}]},{"type":"expression","named":true,"subtypes":[{"type":"assignment_expression","named":true},{"type":"augmented_assignment_expression","named":true},{"type":"await_expression","named":true},{"type":"binary_expression","named":true},{"type":"glimmer_template","named":true},{"type":"jsx_element","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"new_expression","named":true},{"type":"primary_expression","named":true},{"type":"ternary_expression","named":true},{"type":"unary_expression","named":true},{"type":"update_expression","named":true},{"type":"yield_expression","named":true}]},{"type":"pattern","named":true,"subtypes":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"object_pattern","named":true},{"type":"rest_pattern","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},{"type":"primary_expression","named":true,"subtypes":[{"type":"array","named":true},{"type":"arrow_function","named":true},{"type":"call_expression","named":true},{"type":"class","named":true},{"type":"false","named":true},{"type":"function_expression","named":true},{"type":"generator_function","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"meta_property","named":true},{"type":"null","named":true},{"type":"number","named":true},{"type":"object","named":true},{"type":"parenthesized_expression","named":true},{"type":"regex","named":true},{"type":"string","named":true},{"type":"subscript_expression","named":true},{"type":"super","named":true},{"type":"template_string","named":true},{"type":"this","named":true},{"type":"true","named":true},{"type":"undefined","named":true}]},{"type":"statement","named":true,"subtypes":[{"type":"break_statement","named":true},{"type":"continue_statement","named":true},{"type":"debugger_statement","named":true},{"type":"declaration","named":true},{"type":"do_statement","named":true},{"type":"empty_statement","named":true},{"type":"export_statement","named":true},{"type":"expression_statement","named":true},{"type":"for_in_statement","named":true},{"type":"for_statement","named":true},{"type":"if_statement","named":true},{"type":"import_statement","named":true},{"type":"labeled_statement","named":true},{"type":"return_statement","named":true},{"type":"statement_block","named":true},{"type":"switch_statement","named":true},{"type":"throw_statement","named":true},{"type":"try_statement","named":true},{"type":"while_statement","named":true},{"type":"with_statement","named":true}]},{"type":"arguments","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"expression","named":true},{"type":"spread_element","named":true}]}},{"type":"array","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"expression","named":true},{"type":"spread_element","named":true}]}},{"type":"array_pattern","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"assignment_pattern","named":true},{"type":"pattern","named":true}]}},{"type":"arrow_function","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"statement_block","named":true}]},"parameter":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":false,"types":[{"type":"formal_parameters","named":true}]}}},{"type":"assignment_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"object_pattern","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"assignment_pattern","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"pattern","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"augmented_assignment_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"%=","named":false},{"type":"&&=","named":false},{"type":"&=","named":false},{"type":"**=","named":false},{"type":"*=","named":false},{"type":"+=","named":false},{"type":"-=","named":false},{"type":"/=","named":false},{"type":"<<=","named":false},{"type":">>=","named":false},{"type":">>>=","named":false},{"type":"??=","named":false},{"type":"^=","named":false},{"type":"|=","named":false},{"type":"||=","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"await_expression","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"binary_expression","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"private_property_identifier","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"!=","named":false},{"type":"!==","named":false},{"type":"%","named":false},{"type":"&","named":false},{"type":"&&","named":false},{"type":"*","named":false},{"type":"**","named":false},{"type":"+","named":false},{"type":"-","named":false},{"type":"/","named":false},{"type":"<","named":false},{"type":"<<","named":false},{"type":"<=","named":false},{"type":"==","named":false},{"type":"===","named":false},{"type":">","named":false},{"type":">=","named":false},{"type":">>","named":false},{"type":">>>","named":false},{"type":"??","named":false},{"type":"^","named":false},{"type":"in","named":false},{"type":"instanceof","named":false},{"type":"|","named":false},{"type":"||","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"break_statement","named":true,"fields":{"label":{"multiple":false,"required":false,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"call_expression","named":true,"fields":{"arguments":{"multiple":false,"required":true,"types":[{"type":"arguments","named":true},{"type":"template_string","named":true}]},"function":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"import","named":true}]},"optional_chain":{"multiple":false,"required":false,"types":[{"type":"optional_chain","named":true}]}}},{"type":"catch_clause","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"parameter":{"multiple":false,"required":false,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"object_pattern","named":true}]}}},{"type":"class","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"class_body","named":true,"fields":{"member":{"multiple":true,"required":false,"types":[{"type":"class_static_block","named":true},{"type":"field_definition","named":true},{"type":"method_definition","named":true}]},"template":{"multiple":true,"required":false,"types":[{"type":"glimmer_template","named":true}]}}},{"type":"class_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"class_body","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"class_heritage","named":true}]}},{"type":"class_heritage","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"class_static_block","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]}}},{"type":"computed_property_name","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"continue_statement","named":true,"fields":{"label":{"multiple":false,"required":false,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"debugger_statement","named":true,"fields":{}},{"type":"decorator","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"call_expression","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true}]}},{"type":"do_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"else_clause","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]}},{"type":"empty_statement","named":true,"fields":{}},{"type":"export_clause","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"export_specifier","named":true}]}},{"type":"export_specifier","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}}},{"type":"export_statement","named":true,"fields":{"declaration":{"multiple":false,"required":false,"types":[{"type":"declaration","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"source":{"multiple":false,"required":false,"types":[{"type":"string","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},"children":{"multiple":false,"required":false,"types":[{"type":"export_clause","named":true},{"type":"namespace_export","named":true}]}},{"type":"expression_statement","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"field_definition","named":true,"fields":{"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"property":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}}},{"type":"finally_clause","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]}}},{"type":"for_in_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"kind":{"multiple":false,"required":false,"types":[{"type":"const","named":false},{"type":"let","named":false},{"type":"var","named":false}]},"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"object_pattern","named":true},{"type":"parenthesized_expression","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"in","named":false},{"type":"of","named":false}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}}},{"type":"for_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"empty_statement","named":true},{"type":"expression_statement","named":true}]},"increment":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]},"initializer":{"multiple":false,"required":true,"types":[{"type":"empty_statement","named":true},{"type":"expression_statement","named":true},{"type":"lexical_declaration","named":true},{"type":"variable_declaration","named":true}]}}},{"type":"formal_parameters","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"assignment_pattern","named":true},{"type":"pattern","named":true}]}},{"type":"function_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]}}},{"type":"function_expression","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]}}},{"type":"generator_function","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]}}},{"type":"generator_function_declaration","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]}}},{"type":"glimmer_template","named":true,"fields":{"close_tag":{"multiple":false,"required":true,"types":[{"type":"glimmer_closing_tag","named":true}]},"open_tag":{"multiple":false,"required":true,"types":[{"type":"glimmer_opening_tag","named":true}]}}},{"type":"if_statement","named":true,"fields":{"alternative":{"multiple":false,"required":false,"types":[{"type":"else_clause","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]}}},{"type":"import","named":true,"fields":{}},{"type":"import_attribute","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"object","named":true}]}},{"type":"import_clause","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true},{"type":"named_imports","named":true},{"type":"namespace_import","named":true}]}},{"type":"import_specifier","named":true,"fields":{"alias":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}}},{"type":"import_statement","named":true,"fields":{"source":{"multiple":false,"required":true,"types":[{"type":"string","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"import_attribute","named":true},{"type":"import_clause","named":true}]}},{"type":"jsx_attribute","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"jsx_element","named":true},{"type":"jsx_expression","named":true},{"type":"jsx_namespace_name","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]}},{"type":"jsx_closing_element","named":true,"fields":{"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]}}},{"type":"jsx_element","named":true,"fields":{"close_tag":{"multiple":false,"required":true,"types":[{"type":"jsx_closing_element","named":true}]},"open_tag":{"multiple":false,"required":true,"types":[{"type":"jsx_opening_element","named":true}]}},"children":{"multiple":true,"required":false,"types":[{"type":"html_character_reference","named":true},{"type":"jsx_element","named":true},{"type":"jsx_expression","named":true},{"type":"jsx_self_closing_element","named":true},{"type":"jsx_text","named":true}]}},{"type":"jsx_expression","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true},{"type":"spread_element","named":true}]}},{"type":"jsx_namespace_name","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"jsx_opening_element","named":true,"fields":{"attribute":{"multiple":true,"required":false,"types":[{"type":"jsx_attribute","named":true},{"type":"jsx_expression","named":true}]},"name":{"multiple":false,"required":false,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]}}},{"type":"jsx_self_closing_element","named":true,"fields":{"attribute":{"multiple":true,"required":false,"types":[{"type":"jsx_attribute","named":true},{"type":"jsx_expression","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"jsx_namespace_name","named":true},{"type":"member_expression","named":true}]}}},{"type":"jsx_text","named":true,"fields":{}},{"type":"labeled_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"label":{"multiple":false,"required":true,"types":[{"type":"statement_identifier","named":true}]}}},{"type":"lexical_declaration","named":true,"fields":{"kind":{"multiple":false,"required":true,"types":[{"type":"const","named":false},{"type":"let","named":false}]}},"children":{"multiple":true,"required":true,"types":[{"type":"variable_declarator","named":true}]}},{"type":"member_expression","named":true,"fields":{"object":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"import","named":true}]},"optional_chain":{"multiple":false,"required":false,"types":[{"type":"optional_chain","named":true}]},"property":{"multiple":false,"required":true,"types":[{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true}]}}},{"type":"meta_property","named":true,"fields":{}},{"type":"method_definition","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"decorator":{"multiple":true,"required":false,"types":[{"type":"decorator","named":true}]},"name":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"parameters":{"multiple":false,"required":true,"types":[{"type":"formal_parameters","named":true}]}}},{"type":"named_imports","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"import_specifier","named":true}]}},{"type":"namespace_export","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true},{"type":"string","named":true}]}},{"type":"namespace_import","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"identifier","named":true}]}},{"type":"new_expression","named":true,"fields":{"arguments":{"multiple":false,"required":false,"types":[{"type":"arguments","named":true}]},"constructor":{"multiple":false,"required":true,"types":[{"type":"new_expression","named":true},{"type":"primary_expression","named":true}]}}},{"type":"object","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"method_definition","named":true},{"type":"pair","named":true},{"type":"shorthand_property_identifier","named":true},{"type":"spread_element","named":true}]}},{"type":"object_assignment_pattern","named":true,"fields":{"left":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"object_pattern","named":true},{"type":"shorthand_property_identifier_pattern","named":true}]},"right":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"object_pattern","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"object_assignment_pattern","named":true},{"type":"pair_pattern","named":true},{"type":"rest_pattern","named":true},{"type":"shorthand_property_identifier_pattern","named":true}]}},{"type":"pair","named":true,"fields":{"key":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"pair_pattern","named":true,"fields":{"key":{"multiple":false,"required":true,"types":[{"type":"computed_property_name","named":true},{"type":"number","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"string","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"assignment_pattern","named":true},{"type":"pattern","named":true}]}}},{"type":"parenthesized_expression","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"program","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"hash_bang_line","named":true},{"type":"statement","named":true}]}},{"type":"regex","named":true,"fields":{"flags":{"multiple":false,"required":false,"types":[{"type":"regex_flags","named":true}]},"pattern":{"multiple":false,"required":true,"types":[{"type":"regex_pattern","named":true}]}}},{"type":"rest_pattern","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"member_expression","named":true},{"type":"object_pattern","named":true},{"type":"subscript_expression","named":true},{"type":"undefined","named":true}]}},{"type":"return_statement","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"sequence_expression","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"spread_element","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}},{"type":"statement_block","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]}},{"type":"string","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"escape_sequence","named":true},{"type":"html_character_reference","named":true},{"type":"string_fragment","named":true}]}},{"type":"subscript_expression","named":true,"fields":{"index":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]},"object":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"optional_chain":{"multiple":false,"required":false,"types":[{"type":"optional_chain","named":true}]}}},{"type":"switch_body","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"switch_case","named":true},{"type":"switch_default","named":true}]}},{"type":"switch_case","named":true,"fields":{"body":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}}},{"type":"switch_default","named":true,"fields":{"body":{"multiple":true,"required":false,"types":[{"type":"statement","named":true}]}}},{"type":"switch_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"switch_body","named":true}]},"value":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"template_string","named":true,"fields":{},"children":{"multiple":true,"required":false,"types":[{"type":"escape_sequence","named":true},{"type":"string_fragment","named":true},{"type":"template_substitution","named":true}]}},{"type":"template_substitution","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"ternary_expression","named":true,"fields":{"alternative":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"consequence":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]}}},{"type":"throw_statement","named":true,"fields":{},"children":{"multiple":false,"required":true,"types":[{"type":"expression","named":true},{"type":"sequence_expression","named":true}]}},{"type":"try_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement_block","named":true}]},"finalizer":{"multiple":false,"required":false,"types":[{"type":"finally_clause","named":true}]},"handler":{"multiple":false,"required":false,"types":[{"type":"catch_clause","named":true}]}}},{"type":"unary_expression","named":true,"fields":{"argument":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"!","named":false},{"type":"+","named":false},{"type":"-","named":false},{"type":"delete","named":false},{"type":"typeof","named":false},{"type":"void","named":false},{"type":"~","named":false}]}}},{"type":"update_expression","named":true,"fields":{"argument":{"multiple":false,"required":true,"types":[{"type":"expression","named":true}]},"operator":{"multiple":false,"required":true,"types":[{"type":"++","named":false},{"type":"--","named":false}]}}},{"type":"variable_declaration","named":true,"fields":{},"children":{"multiple":true,"required":true,"types":[{"type":"variable_declarator","named":true}]}},{"type":"variable_declarator","named":true,"fields":{"name":{"multiple":false,"required":true,"types":[{"type":"array_pattern","named":true},{"type":"identifier","named":true},{"type":"object_pattern","named":true}]},"value":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}}},{"type":"while_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"condition":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"with_statement","named":true,"fields":{"body":{"multiple":false,"required":true,"types":[{"type":"statement","named":true}]},"object":{"multiple":false,"required":true,"types":[{"type":"parenthesized_expression","named":true}]}}},{"type":"yield_expression","named":true,"fields":{},"children":{"multiple":false,"required":false,"types":[{"type":"expression","named":true}]}},{"type":"!","named":false},{"type":"!=","named":false},{"type":"!==","named":false},{"type":"\\"","named":false},{"type":"${","named":false},{"type":"%","named":false},{"type":"%=","named":false},{"type":"&","named":false},{"type":"&&","named":false},{"type":"&&=","named":false},{"type":"&=","named":false},{"type":"\'","named":false},{"type":"(","named":false},{"type":")","named":false},{"type":"*","named":false},{"type":"**","named":false},{"type":"**=","named":false},{"type":"*=","named":false},{"type":"+","named":false},{"type":"++","named":false},{"type":"+=","named":false},{"type":",","named":false},{"type":"-","named":false},{"type":"--","named":false},{"type":"-=","named":false},{"type":".","named":false},{"type":"...","named":false},{"type":"/","named":false},{"type":"/=","named":false},{"type":"/>","named":false},{"type":":","named":false},{"type":";","named":false},{"type":"<","named":false},{"type":"</","named":false},{"type":"<<","named":false},{"type":"<<=","named":false},{"type":"<=","named":false},{"type":"=","named":false},{"type":"==","named":false},{"type":"===","named":false},{"type":"=>","named":false},{"type":">","named":false},{"type":">=","named":false},{"type":">>","named":false},{"type":">>=","named":false},{"type":">>>","named":false},{"type":">>>=","named":false},{"type":"?","named":false},{"type":"??","named":false},{"type":"??=","named":false},{"type":"@","named":false},{"type":"[","named":false},{"type":"]","named":false},{"type":"^","named":false},{"type":"^=","named":false},{"type":"`","named":false},{"type":"as","named":false},{"type":"async","named":false},{"type":"await","named":false},{"type":"break","named":false},{"type":"case","named":false},{"type":"catch","named":false},{"type":"class","named":false},{"type":"comment","named":true},{"type":"const","named":false},{"type":"continue","named":false},{"type":"debugger","named":false},{"type":"default","named":false},{"type":"delete","named":false},{"type":"do","named":false},{"type":"else","named":false},{"type":"escape_sequence","named":true},{"type":"export","named":false},{"type":"extends","named":false},{"type":"false","named":true},{"type":"finally","named":false},{"type":"for","named":false},{"type":"from","named":false},{"type":"function","named":false},{"type":"get","named":false},{"type":"glimmer_closing_tag","named":true},{"type":"glimmer_opening_tag","named":true},{"type":"hash_bang_line","named":true},{"type":"html_character_reference","named":true},{"type":"html_comment","named":true},{"type":"identifier","named":true},{"type":"if","named":false},{"type":"import","named":false},{"type":"in","named":false},{"type":"instanceof","named":false},{"type":"let","named":false},{"type":"new","named":false},{"type":"null","named":true},{"type":"number","named":true},{"type":"of","named":false},{"type":"optional_chain","named":true},{"type":"private_property_identifier","named":true},{"type":"property_identifier","named":true},{"type":"regex_flags","named":true},{"type":"regex_pattern","named":true},{"type":"return","named":false},{"type":"set","named":false},{"type":"shorthand_property_identifier","named":true},{"type":"shorthand_property_identifier_pattern","named":true},{"type":"statement_identifier","named":true},{"type":"static","named":false},{"type":"static get","named":false},{"type":"string_fragment","named":true},{"type":"super","named":true},{"type":"switch","named":false},{"type":"target","named":false},{"type":"this","named":true},{"type":"throw","named":false},{"type":"true","named":true},{"type":"try","named":false},{"type":"typeof","named":false},{"type":"undefined","named":true},{"type":"var","named":false},{"type":"void","named":false},{"type":"while","named":false},{"type":"with","named":false},{"type":"yield","named":false},{"type":"{","named":false},{"type":"|","named":false},{"type":"|=","named":false},{"type":"||","named":false},{"type":"||=","named":false},{"type":"}","named":false},{"type":"~","named":false}]');

/***/ }),
/* 26 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
exports.AIInlineCompletionProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
class AIInlineCompletionProvider {
    constructor(modelClient, indexer) {
        this.enabled = true;
        this.modelClient = modelClient;
        this.indexer = indexer;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    async provideInlineCompletionItems(document, position, context, token) {
        if (!this.enabled) {
            return undefined;
        }
        // Debounce
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(async () => {
                try {
                    const completion = await this.generateCompletion(document, position, token);
                    if (completion && completion.trim().length > 0 && !token.isCancellationRequested) {
                        resolve([
                            new vscode.InlineCompletionItem(completion, new vscode.Range(position, position))
                        ]);
                    }
                    else {
                        resolve(undefined);
                    }
                }
                catch (error) {
                    console.error('Autocomplete error:', error);
                    resolve(undefined);
                }
            }, 300); // 300ms debounce
        });
    }
    async generateCompletion(document, position, token) {
        // Get code before cursor
        const codeBefore = document.getText(new vscode.Range(new vscode.Position(Math.max(0, position.line - 20), 0), position));
        // Get code after cursor (for context)
        const codeAfter = document.getText(new vscode.Range(position, new vscode.Position(Math.min(document.lineCount, position.line + 5), 0)));
        // Search codebase for relevant code
        const query = codeBefore.slice(-100); // Last 100 chars
        const relevantCode = this.indexer.search(query, 3);
        // Build context from relevant code
        const context = relevantCode
            .map(chunk => `// From ${chunk.filePath}\n${chunk.content}`)
            .join('\n\n');
        // Build prompt
        const prompt = `You are an expert code completion AI. Complete the code naturally and concisely.

File: ${document.fileName}
Language: ${document.languageId}

${context ? `Relevant code from project:\n${context}\n\n` : ''}Code before cursor:
${codeBefore}

Code after cursor:
${codeAfter}

Complete the code at the cursor position. Output ONLY the completion text, no explanations or markdown.
Rules:
- Match the existing code style
- Keep it concise (1-3 lines max)
- Don't repeat code that's already there
- Ensure proper indentation

Completion:`;
        if (token.isCancellationRequested) {
            return undefined;
        }
        // Use fast model (Groq Llama 3.3 70B)
        try {
            const response = await this.modelClient.sendMessage({ provider: 'groq', modelId: 'llama-3.3-70b-versatile' }, [{ role: 'user', content: prompt }]);
            // Extract completion
            let completion = response.content.trim();
            // Remove markdown code blocks if present
            completion = completion.replace(/```[\w]*\n?/g, '').trim();
            // Remove any leading/trailing quotes
            completion = completion.replace(/^["']|["']$/g, '');
            return completion;
        }
        catch (error) {
            console.error('AI completion error:', error);
            // If Groq fails, try Cerebras as fallback
            try {
                const response = await this.modelClient.sendMessage({ provider: 'cerebras', modelId: 'llama3.1-8b' }, [{ role: 'user', content: prompt }]);
                return response.content.trim().replace(/```[\w]*\n?/g, '').trim();
            }
            catch (fallbackError) {
                console.error('Fallback completion error:', fallbackError);
                return undefined;
            }
        }
    }
}
exports.AIInlineCompletionProvider = AIInlineCompletionProvider;


/***/ }),
/* 27 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

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
exports.ChatEnhancer = void 0;
const vscode = __importStar(__webpack_require__(1));
class ChatEnhancer {
    constructor(modelClient) {
        this.modelClient = modelClient;
    }
    /**
     * Parse @-mentions from message
     * Example: "Explain @src/App.tsx" -> ["src/App.tsx"]
     */
    parseMentions(text) {
        const regex = /@([\w\/\.\-]+)/g;
        const mentions = [];
        let match;
        while ((match = regex.exec(text)) !== null) {
            mentions.push(match[1]);
        }
        return mentions;
    }
    /**
     * Fetch content of mentioned files
     */
    async fetchMentionedFiles(mentions) {
        let context = '';
        for (const mention of mentions) {
            try {
                // Try to find the file in workspace
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders)
                    continue;
                const rootPath = workspaceFolders[0].uri.fsPath;
                const filePath = mention.startsWith('/') ? mention : `${rootPath}/${mention}`;
                const uri = vscode.Uri.file(filePath);
                const content = await vscode.workspace.fs.readFile(uri);
                const text = Buffer.from(content).toString('utf8');
                context += `\n\n// File: ${mention}\n${text}`;
            }
            catch (error) {
                console.error(`Failed to read ${mention}:`, error);
                context += `\n\n// File: ${mention} (not found)`;
            }
        }
        return context;
    }
    /**
     * Check if message starts with a slash command
     */
    parseSlashCommand(text) {
        const match = text.match(/^\/(fix|explain|test|refactor|docs|optimize)(\s+(.*))?$/);
        if (match) {
            return {
                command: match[1],
                args: match[3] || ''
            };
        }
        return null;
    }
    /**
     * Handle slash commands
     */
    async handleSlashCommand(command, code, provider, modelId) {
        const prompts = {
            fix: `You are an expert debugger. Fix any errors in this code and explain what was wrong:

\`\`\`
${code}
\`\`\`

Provide the fixed code and explanation.`,
            explain: `You are an expert code explainer. Explain what this code does in clear, simple terms:

\`\`\`
${code}
\`\`\`

Provide a detailed explanation.`,
            test: `You are an expert test writer. Generate comprehensive unit tests for this code:

\`\`\`
${code}
\`\`\`

Use the appropriate testing framework (Jest, Mocha, etc.) based on the code.`,
            refactor: `You are an expert code reviewer. Refactor this code to improve:
- Readability
- Performance
- Maintainability
- Best practices

Original code:
\`\`\`
${code}
\`\`\`

Provide the refactored code with explanations of changes.`,
            docs: `You are an expert technical writer. Add comprehensive JSDoc/documentation comments to this code:

\`\`\`
${code}
\`\`\`

Include parameter descriptions, return types, and examples where appropriate.`,
            optimize: `You are an expert performance engineer. Optimize this code for better performance:

\`\`\`
${code}
\`\`\`

Provide the optimized code and explain the performance improvements.`
        };
        const prompt = prompts[command];
        if (!prompt) {
            throw new Error(`Unknown command: /${command}`);
        }
        try {
            const response = await this.modelClient.sendMessage({ provider, modelId }, [{ role: 'user', content: prompt }]);
            return response.content;
        }
        catch (error) {
            throw new Error(`Failed to execute /${command}: ${error.message}`);
        }
    }
    /**
     * Get selected code from active editor
     */
    getSelectedCode() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }
        const selection = editor.selection;
        if (selection.isEmpty) {
            // If no selection, get current line
            const line = editor.document.lineAt(selection.active.line);
            return line.text;
        }
        return editor.document.getText(selection);
    }
    /**
     * Enhance message with mentions and handle slash commands
     */
    async enhanceMessage(message, provider, modelId) {
        // Check for slash command
        const slashCommand = this.parseSlashCommand(message);
        if (slashCommand) {
            const selectedCode = this.getSelectedCode();
            if (!selectedCode) {
                throw new Error('Please select code to use slash commands');
            }
            const response = await this.handleSlashCommand(slashCommand.command, selectedCode, provider, modelId);
            return {
                enhancedMessage: response,
                isSlashCommand: true
            };
        }
        // Parse mentions
        const mentions = this.parseMentions(message);
        if (mentions.length === 0) {
            return {
                enhancedMessage: message,
                isSlashCommand: false
            };
        }
        // Fetch mentioned files
        const context = await this.fetchMentionedFiles(mentions);
        // Enhance message with context
        const enhancedMessage = `${context}\n\n${message}`;
        return {
            enhancedMessage,
            isSlashCommand: false
        };
    }
}
exports.ChatEnhancer = ChatEnhancer;


/***/ }),
/* 28 */
/***/ ((__unused_webpack_module, exports) => {

"use strict";

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