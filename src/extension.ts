import * as vscode from 'vscode';
import * as path from 'path';
import { StorageManager } from './managers/StorageManager';
import { ContextManager } from './managers/ContextManager';
import { ModelClient } from './api/ModelClient';

interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    details?: any;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('VibeAll extension is now active!');

    const storageManager = new StorageManager(context);
    const contextManager = new ContextManager();
    const modelClient = new ModelClient();

    // Output channel for logging
    const outputChannel = vscode.window.createOutputChannel('VibeAll');

    // In-memory logs
    let logs: LogEntry[] = [];

    function log(level: 'info' | 'warning' | 'error' | 'debug', message: string, details?: any) {
        const entry: LogEntry = {
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
        } catch (error: any) {
            log('error', 'Failed to load API keys', error);
        }
    }

    // Create webview panel
    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    const showWebview = () => {
        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (currentPanel) {
            currentPanel.reveal(columnToShowIn);
            return;
        }

        currentPanel = vscode.window.createWebviewPanel(
            'vibeall',
            'VibeAll AI Assistant',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(context.extensionPath, 'dist'))
                ]
            }
        );

        const webviewUri = currentPanel.webview.asWebviewUri(
            vscode.Uri.file(path.join(context.extensionPath, 'dist', 'webview.js'))
        );

        currentPanel.webview.html = getWebviewContent(webviewUri);

        // Handle messages from webview
        currentPanel.webview.onDidReceiveMessage(
            async (message) => {
                await handleWebviewMessage(message);
            },
            undefined,
            context.subscriptions
        );

        currentPanel.onDidDispose(
            () => {
                currentPanel = undefined;
            },
            null,
            context.subscriptions
        );
    };

    async function handleWebviewMessage(message: any) {
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
                    } catch (error: any) {
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
        } catch (error: any) {
            console.error(`[VibeAll] Error handling message:`, error);
            log('error', `Error handling message ${type}`, error);
            sendMessage({
                type: 'error',
                payload: { error: error.message }
            });
        }
    }

    async function handleAIMessage(payload: any) {
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
                } else {
                    throw new Error(`No API key found for ${provider}. Please add one in settings.`);
                }
            }

            // Send to AI
            const response = await modelClient.sendMessage(
                { provider, modelId },
                messagesWithContext
            );

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

        } catch (error: any) {
            log('error', `AI processing failed: ${error.message}`, error);
            sendMessage({
                type: 'messageError',
                payload: { error: error.message }
            });
        }
    }

    async function applyCodeToFile(code: string, _filePath: string) {
        try {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }

            await editor.edit(editBuilder => {
                const document = editor.document;
                const lastLine = document.lineAt(document.lineCount - 1);
                const range = new vscode.Range(
                    new vscode.Position(0, 0),
                    lastLine.range.end
                );
                editBuilder.replace(range, code);
            });

            vscode.window.showInformationMessage('Code applied successfully!');
            log('info', 'Code applied to file');
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to apply code: ${error.message}`);
            log('error', 'Failed to apply code', error);
        }
    }

    function sendMessage(message: any) {
        if (currentPanel) {
            currentPanel.webview.postMessage(message);
        }
    }

    function getWebviewContent(webviewUri: vscode.Uri): string {
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

export function deactivate() {
    console.log('VibeAll extension is now deactivated');
}
