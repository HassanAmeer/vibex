import { useState, useEffect } from 'react';
import './style.css';
import ChatInterface from './components/ChatInterface';
import SettingsPanel from './components/SettingsPanel';
import LogsPanel from './components/LogsPanel';
import Toast from './components/Toast';
import { ChatMessage, ExtensionSettings, UsageStats } from '../types';

declare const acquireVsCodeApi: any;
const vscode = acquireVsCodeApi();

interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

const App: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [settings, setSettings] = useState<ExtensionSettings>({
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
    const [usageStats, setUsageStats] = useState<UsageStats>({});
    const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({});
    const [showSettings, setShowSettings] = useState(false);
    const [showLogs, setShowLogs] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [currentModel, setCurrentModel] = useState({
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile'
    });
    const [toolStatus, setToolStatus] = useState<{
        isRunning: boolean;
        tools: { id: number; name: string; args: any; status: 'pending' | 'running' | 'completed' }[];
    } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        console.log('🚀 App mounted, requesting initial data...');
        vscode.postMessage({ type: 'getSettings' });
        vscode.postMessage({ type: 'getChatHistory' });
        vscode.postMessage({ type: 'getUsageStats' });
        vscode.postMessage({ type: 'getAPIKeys' });

        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            console.log('📩 Received message from extension:', message.type, message.payload);

            switch (message.type) {
                case 'settings':
                    console.log('⚙️ Settings loaded:', message.payload);
                    setSettings(message.payload);
                    break;

                case 'chatHistory':
                    console.log('📜 Chat history loaded:', message.payload.length, 'messages');
                    setMessages(message.payload);
                    break;

                case 'usageStats':
                    console.log('📊 Usage stats loaded:', message.payload);
                    setUsageStats(message.payload);
                    break;

                case 'apiKeys': {
                    console.log('🔑 API Keys loaded:', message.payload);
                    const keysObj: { [key: string]: string } = {};
                    message.payload.forEach((apiKey: any) => {
                        keysObj[apiKey.provider] = apiKey.key;
                    });
                    setApiKeys(keysObj);
                    break;
                }

                case 'apiKeyStored':
                    console.log('✅ API Key stored success confirmation received for:', message.payload.provider);
                    showToast('✓ API key saved successfully!', 'success');
                    vscode.postMessage({ type: 'getAPIKeys' });
                    break;

                case 'apiKeyError':
                    console.error('❌ API Key storage failed:', message.payload.error);
                    showToast(message.payload.error || 'Failed to save API key', 'error');
                    break;

                case 'messageLoading':
                    console.log('⏳ AI is thinking...');
                    setIsLoading(true);
                    break;

                case 'messageResponse': {
                    console.log('🤖 AI Response received:', message.payload);
                    setIsLoading(false);
                    const newMessage: ChatMessage = {
                        id: Date.now().toString(),
                        role: 'assistant',
                        content: message.payload.content,
                        timestamp: Date.now(),
                        model: message.payload.model,
                        tokens: message.payload.tokens
                    };
                    setMessages(prev => [...prev, newMessage]);

                    if (message.payload.usedProvider && message.payload.usedProvider !== currentModel.provider) {
                        console.warn(`⚠️ Provider failover detected: ${currentModel.provider} -> ${message.payload.usedProvider}`);
                    }
                    break;
                }

                case 'messageError':
                    console.error('❌ Message handling error:', message.payload.error);
                    setIsLoading(false);
                    showToast(message.payload.error || 'Failed to send message', 'error');
                    break;

                case 'showSettings':
                    console.log('⚙️ Opening settings panel');
                    setShowSettings(true);
                    break;

                case 'chatCleared':
                    console.log('🧹 Chat cleared');
                    setMessages([]);
                    break;
                case 'toolExecutionStart':
                    console.log('🛠️ Tool execution started:', message.payload.tools.length, 'tools');
                    setToolStatus({
                        isRunning: true,
                        tools: message.payload.tools.map((t: any) => ({ ...t, status: 'pending' }))
                    });
                    break;

                case 'toolStatus':
                    console.log('🛠️ Tool status:', message.payload);
                    setToolStatus((prev: any) => {
                        if (!prev) return null;
                        const updatedTools = prev.tools.map((t: any) => {
                            if (t.id === message.payload.id) {
                                return { ...t, status: message.payload.status };
                            }
                            return t;
                        });
                        // Check if all completed
                        const allCompleted = updatedTools.every((t: any) => t.status === 'completed');
                        if (allCompleted) {
                            setTimeout(() => setToolStatus(null), 3000);
                        }
                        return { ...prev, tools: updatedTools };
                    });
                    break;

                case 'fileSystemResponse':
                    console.log('📁 File System Response:', message.payload);
                    if (message.payload.status === 'error') {
                        showToast(`Error: ${message.payload.error}`, 'error');
                    }
                    break;

                case 'codeAnalysis':
                    console.log('🔍 Code Analysis:', message.payload);
                    const { file, analysis, securityIssues, suggestions, metrics } = message.payload;
                    let analysisMsg = `📊 ${file}: Complexity ${metrics.complexity}, Maintainability ${metrics.maintainability}%`;

                    if (securityIssues.length > 0) {
                        showToast(`🔒 Security issues in ${file}`, 'error');
                    } else if (analysis.issues.length > 0) {
                        showToast(analysisMsg, 'info');
                    }
                    break;
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, [currentModel, toolStatus]);

    useEffect(() => {
        document.documentElement.style.setProperty('--primary-color', settings.theme.primaryColor);
        document.documentElement.style.setProperty('--accent-color', settings.theme.accentColor);
    }, [settings.theme]);

    const handleSendMessage = (content: string, attachments?: any[]) => {
        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: Date.now(),
            attachments
        };

        setMessages(prev => [...prev, userMessage]);

        vscode.postMessage({
            type: 'sendMessage',
            payload: {
                messages: [...messages, userMessage],
                provider: currentModel.provider,
                modelId: currentModel.modelId
            }
        });
    };

    const handleClearChat = () => {
        vscode.postMessage({ type: 'clearChat' });
    };

    const handleModelSwitch = (provider: string, modelId: string) => {
        setCurrentModel({ provider, modelId });
        vscode.postMessage({
            type: 'switchModel',
            payload: { provider, modelId }
        });
    };

    const handleSettingsUpdate = (newSettings: ExtensionSettings) => {
        setSettings(newSettings);
        vscode.postMessage({
            type: 'updateSettings',
            payload: newSettings
        });
    };

    const handleApplyCode = (code: string, filePath: string) => {
        vscode.postMessage({
            type: 'applyCode',
            payload: { code, filePath }
        });
    };

    return (
        <div className="app-container">
            <div className="toast-container">
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>

            {showLogs ? (
                <LogsPanel
                    show={showLogs}
                    onClose={() => setShowLogs(false)}
                />
            ) : showSettings ? (
                <SettingsPanel
                    settings={settings}
                    savedApiKeys={apiKeys}
                    onUpdate={handleSettingsUpdate}
                    onClose={() => setShowSettings(false)}
                />
            ) : (
                <ChatInterface
                    messages={messages}
                    isLoading={isLoading}
                    currentModel={currentModel}
                    settings={settings}
                    usageStats={usageStats}
                    toolStatus={toolStatus}
                    onSendMessage={handleSendMessage}
                    onClearChat={handleClearChat}
                    onModelSwitch={handleModelSwitch}
                    onOpenSettings={() => setShowSettings(true)}
                    onOpenLogs={() => setShowLogs(true)}
                    onApplyCode={handleApplyCode}
                />
            )}
        </div>
    );
};

export default App;
