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
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const StorageManager_1 = require("./managers/StorageManager");
const ContextManager_1 = require("./managers/ContextManager");
const ModelClient_1 = require("./api/ModelClient");
function activate(context) {
    console.log('VibeAll extension is now active!');
    const storageManager = new StorageManager_1.StorageManager(context);
    const contextManager = new ContextManager_1.ContextManager();
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
            // Get context
            const context = await contextManager.getFullContext();
            // Add context to the first message if available
            const messagesWithContext = [...messages];
            if (context && messagesWithContext.length > 0) {
                messagesWithContext[0].content = `${context}\n\n${messagesWithContext[0].content}`;
            }
            // Ensure API key is loaded
            if (!modelClient.hasClient(provider)) {
                // Try to load from storage one more time
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
            // Save chat history
            const updatedMessages = [
                ...messages,
                {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: response.content,
                    timestamp: Date.now(),
                    model: modelId,
                    tokens: response.usage?.total_tokens
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
                    usedProvider: provider
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
//# sourceMappingURL=extension.js.map