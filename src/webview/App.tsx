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

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    useEffect(() => {
        vscode.postMessage({ type: 'getSettings' });
        vscode.postMessage({ type: 'getChatHistory' });
        vscode.postMessage({ type: 'getUsageStats' });
        vscode.postMessage({ type: 'getAPIKeys' });

        const messageHandler = (event: MessageEvent) => {
            const message = event.data;

            switch (message.type) {
                case 'settings':
                    setSettings(message.payload);
                    break;

                case 'chatHistory':
                    setMessages(message.payload);
                    break;

                case 'usageStats':
                    setUsageStats(message.payload);
                    break;

                case 'apiKeys': {
                    const keysObj: { [key: string]: string } = {};
                    message.payload.forEach((apiKey: any) => {
                        keysObj[apiKey.provider] = apiKey.key;
                    });
                    setApiKeys(keysObj);
                    break;
                }

                case 'apiKeyStored':
                    showToast('✓ API key saved successfully!', 'success');
                    vscode.postMessage({ type: 'getAPIKeys' });
                    break;

                case 'apiKeyError':
                    showToast(message.payload.error || 'Failed to save API key', 'error');
                    break;

                case 'messageLoading':
                    setIsLoading(true);
                    break;

                case 'messageResponse': {
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
                        console.log(`Switched to ${message.payload.usedProvider} due to failover`);
                    }
                    break;
                }

                case 'messageError':
                    setIsLoading(false);
                    showToast(message.payload.error || 'Failed to send message', 'error');
                    console.error('Message error:', message.payload.error);
                    break;

                case 'showSettings':
                    setShowSettings(true);
                    break;

                case 'chatCleared':
                    setMessages([]);
                    break;
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, [currentModel]);

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
