import * as vscode from 'vscode';
import * as path from 'path';
import { StorageManager } from './managers/StorageManager';
import { ContextManager } from './managers/ContextManager';
import { FileSystemManager } from './managers/FileSystemManager';
import { ModelClient } from './api/ModelClient';
import { CodebaseIndexer } from './indexing/CodebaseIndexer';
import { AIInlineCompletionProvider } from './autocomplete/InlineCompletionProvider';
import { ChatEnhancer } from './chat/ChatEnhancer';

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
    const fileSystemManager = new FileSystemManager();
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
            // Try to sync from LiveDB first
            try {
                const syncedCount = await storageManager.syncFromCloud();
                if (syncedCount > 0) {
                    log('info', `✅ Synced ${syncedCount} API keys from LiveDB`);
                }
            } catch (syncError) {
                log('warning', 'Failed to sync from LiveDB, using local keys', syncError);
            }

            // Load all API keys (local + synced)
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

    // Initialize new features
    let indexer: CodebaseIndexer | undefined;
    let completionProvider: AIInlineCompletionProvider | undefined;
    const chatEnhancer = new ChatEnhancer(modelClient);

    // Initialize codebase indexer
    async function initializeIndexer() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            log('warning', 'No workspace folder found, skipping indexing');
            return;
        }

        try {
            indexer = new CodebaseIndexer();

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Indexing codebase...',
                cancellable: false
            }, async (progress) => {
                await indexer!.initialize(workspaceFolders[0].uri.fsPath);
                const stats = indexer!.getStats();
                log('info', `Codebase indexed: ${stats.files} files, ${stats.chunks} code chunks`);
            });

            // Register autocomplete provider
            completionProvider = new AIInlineCompletionProvider(modelClient, indexer);
            const completionDisposable = vscode.languages.registerInlineCompletionItemProvider(
                { pattern: '**' },
                completionProvider
            );
            context.subscriptions.push(completionDisposable);

            log('info', 'Inline autocomplete enabled');
        } catch (error: any) {
            log('error', 'Failed to initialize indexer', error);
            vscode.window.showErrorMessage(`Failed to index codebase: ${error.message}`);
        }
    }

    // Auto-initialize on startup (after a short delay)
    setTimeout(() => {
        initializeIndexer();
    }, 2000);

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

                case 'getAPIKeys':
                    // Send all stored API keys to webview
                    try {
                        const allKeys = await storageManager.getAllAPIKeys();
                        const keysMap: any = {};
                        allKeys.forEach(k => keysMap[k.provider] = k.key);
                        sendMessage({
                            type: 'apiKeysLoaded',
                            payload: keysMap
                        });
                        log('info', `Loaded ${allKeys.length} API keys`);
                    } catch (error: any) {
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
                    } catch (error: any) {
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
                    } catch (error: any) {
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

                case 'fileSystemAction':
                    await handleFileSystemAction(payload);
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
                    const enhanced = await chatEnhancer.enhanceMessage(
                        lastUserMsg.content,
                        provider,
                        modelId
                    );

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
                } catch (error: any) {
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
                } else {
                    throw new Error(`No API key found for ${provider}. Please add one in settings.`);
                }
            }

            // Send to AI
            const response = await modelClient.sendMessage(
                { provider, modelId },
                messagesWithContext
            );

            // Parse and Execute Tools
            const content = response.content;

            // Try matching code blocks first
            let toolJsonString = null;
            const codeBlockRegex = /```(?:json)?\s*({[\s\S]*?"tools"[\s\S]*?})\s*```/;
            const match = content.match(codeBlockRegex);

            if (match) {
                toolJsonString = match[1];
            } else {
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
                } catch (e) {
                    log('error', 'Failed to parse tool JSON', e);
                    console.error('Raw JSON string that failed:', toolJsonString);
                }
            } else {
                // Fallback: Parse standard code blocks as file creations
                log('info', 'No tool JSON found, attempting to parse code blocks');
                const extractedTools = parseCodeBlocksToTools(content);

                if (extractedTools.length > 0) {
                    log('info', `Found ${extractedTools.length} code blocks to turn into files`);
                    await executeTools(extractedTools);
                } else {
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

    async function handleFileSystemAction(payload: any) {
        const { action, path: filePath, content } = payload;
        try {
            let result;
            switch (action) {
                case 'createFile':
                    result = await fileSystemManager.createFile(filePath, content);

                    // Analyze code if it's a code file
                    if (content && filePath.match(/\.(ts|js|tsx|jsx|py|java)$/)) {
                        const { CodeAnalyzer } = await import('./utils/CodeAnalyzer');
                        const ext = filePath.split('.').pop() || '';
                        const langMap: any = { ts: 'typescript', js: 'javascript', tsx: 'typescript', jsx: 'javascript', py: 'python' };
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
        } catch (error: any) {
            log('error', `File system action failed: ${action}`, error);
            sendMessage({
                type: 'fileSystemResponse',
                payload: { action, error: error.message, status: 'error' }
            });
        }
    }


    // Helper to execute tools with UI updates
    async function executeTools(tools: any[]) {
        sendMessage({
            type: 'toolExecutionStart',
            payload: {
                tools: tools.map((t: any, i: number) => ({ ...t, id: i }))
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
            } catch (toolError: any) {
                sendMessage({
                    type: 'toolStatus',
                    payload: { id: i, status: 'error' }
                });
                log('error', `Tool error: ${tool.name}`, toolError);
            }
        }
    }

    function parseCodeBlocksToTools(content: string): any[] {
        const tools: any[] = [];
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

            vscode.window.showInformationMessage(
                `Autocomplete ${newState ? 'enabled' : 'disabled'}`
            );
            log('info', `Autocomplete ${newState ? 'enabled' : 'disabled'}`);
        } else {
            vscode.window.showWarningMessage('Autocomplete not initialized yet');
        }
    });

    // LiveDB sync commands
    const syncFromCloudCommand = vscode.commands.registerCommand('vibeall.syncFromCloud', async () => {
        try {
            const syncedCount = await storageManager.syncFromCloud();
            vscode.window.showInformationMessage(`✅ Synced ${syncedCount} API keys from LiveDB`);
            log('info', `Synced ${syncedCount} API keys from LiveDB`);

            // Reload API keys
            await loadAPIKeys();
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to sync from LiveDB: ${error.message}`);
            log('error', 'Failed to sync from LiveDB', error);
        }
    });

    const syncToCloudCommand = vscode.commands.registerCommand('vibeall.syncToCloud', async () => {
        try {
            const success = await storageManager.syncToCloud();
            if (success) {
                vscode.window.showInformationMessage('✅ API keys synced to LiveDB');
                log('info', 'API keys synced to LiveDB');
            } else {
                vscode.window.showWarningMessage('Failed to sync to LiveDB');
            }
        } catch (error: any) {
            vscode.window.showErrorMessage(`Failed to sync to LiveDB: ${error.message}`);
            log('error', 'Failed to sync to LiveDB', error);
        }
    });

    // Test LiveDB connection
    const testLiveDBCommand = vscode.commands.registerCommand('vibeall.testLiveDB', async () => {
        try {
            log('info', '🔍 Testing LiveDB connection...');

            // Test 1: Fetch users collection (existing data)
            const usersUrl = 'https://link.thelocalrent.com/api/db/vibex/users';
            log('info', `Fetching from: ${usersUrl}`);

            const usersResponse = await fetch(usersUrl, {
                headers: {
                    'Authorization': 'Bearer 37160f2e00721d906831565829ae1de7'
                }
            });

            log('info', `Users response status: ${usersResponse.status} ${usersResponse.statusText}`);

            if (!usersResponse.ok) {
                const errorText = await usersResponse.text();
                log('error', `Users fetch failed: ${errorText}`);
                vscode.window.showErrorMessage(`❌ LiveDB connection failed: ${usersResponse.status}`);
                return;
            }

            const usersData = await usersResponse.json();
            log('info', `✅ Users data received:`, usersData);

            if (usersData && usersData.data) {
                const userCount = usersData.data.length;
                vscode.window.showInformationMessage(`✅ LiveDB Connected! Found ${userCount} users in collection.`);
                log('info', `Found ${userCount} users:`, JSON.stringify(usersData.data, null, 2));

                // Test 2: Try to create a test API key
                log('info', '🔍 Testing API key creation...');
                const apiKeysUrl = 'https://link.thelocalrent.com/api/db/vibex/api_keys';

                const testPayload = {
                    provider: 'test_provider',
                    key: 'test_key_' + Date.now(),
                    user_id: 'test_user_' + Date.now(),
                    created_at: new Date().toISOString()
                };

                log('info', `Creating test API key:`, testPayload);

                const createResponse = await fetch(apiKeysUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer 37160f2e00721d906831565829ae1de7',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(testPayload)
                });

                log('info', `Create response status: ${createResponse.status} ${createResponse.statusText}`);

                if (createResponse.ok) {
                    const createResult = await createResponse.json();
                    log('info', `✅ Test API key created:`, createResult);
                    vscode.window.showInformationMessage(`✅ LiveDB fully working! Can read and write data.`);
                } else {
                    const createError = await createResponse.text();
                    log('error', `Create failed: ${createError}`);
                    vscode.window.showWarningMessage(`⚠️ Can read but cannot write to LiveDB`);
                }
            } else {
                vscode.window.showWarningMessage('⚠️ Connected but no data format unexpected');
                log('warning', 'Unexpected data format:', usersData);
            }

        } catch (error: any) {
            vscode.window.showErrorMessage(`❌ LiveDB test failed: ${error.message}`);
            log('error', 'LiveDB test failed:', error);
            if (error.stack) {
                log('error', 'Stack trace:', error.stack);
            }
        }
    });

    context.subscriptions.push(
        openCommand,
        settingsCommand,
        indexCommand,
        toggleAutocompleteCommand,
        syncFromCloudCommand,
        syncToCloudCommand,
        testLiveDBCommand
    );

    // Show webview on activation
    showWebview();
}

export function deactivate() {
    console.log('VibeAll extension is now deactivated');
}
