"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./style.css");
const ChatInterface_1 = __importDefault(require("./components/ChatInterface"));
const SettingsPanel_1 = __importDefault(require("./components/SettingsPanel"));
const LogsPanel_1 = __importDefault(require("./components/LogsPanel"));
const Toast_1 = __importDefault(require("./components/Toast"));
const vscode = acquireVsCodeApi();
const App = () => {
    const [messages, setMessages] = (0, react_1.useState)([]);
    const [settings, setSettings] = (0, react_1.useState)({
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
    const [usageStats, setUsageStats] = (0, react_1.useState)({});
    const [apiKeys, setApiKeys] = (0, react_1.useState)({});
    const [showSettings, setShowSettings] = (0, react_1.useState)(false);
    const [showLogs, setShowLogs] = (0, react_1.useState)(false);
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [toasts, setToasts] = (0, react_1.useState)([]);
    const [currentModel, setCurrentModel] = (0, react_1.useState)({
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile'
    });
    const showToast = (message, type) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
    };
    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };
    (0, react_1.useEffect)(() => {
        vscode.postMessage({ type: 'getSettings' });
        vscode.postMessage({ type: 'getChatHistory' });
        vscode.postMessage({ type: 'getUsageStats' });
        vscode.postMessage({ type: 'getAPIKeys' });
        const messageHandler = (event) => {
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
                    const keysObj = {};
                    message.payload.forEach((apiKey) => {
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
                    const newMessage = {
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
    (0, react_1.useEffect)(() => {
        document.documentElement.style.setProperty('--primary-color', settings.theme.primaryColor);
        document.documentElement.style.setProperty('--accent-color', settings.theme.accentColor);
    }, [settings.theme]);
    const handleSendMessage = (content, attachments) => {
        const userMessage = {
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
    const handleModelSwitch = (provider, modelId) => {
        setCurrentModel({ provider, modelId });
        vscode.postMessage({
            type: 'switchModel',
            payload: { provider, modelId }
        });
    };
    const handleSettingsUpdate = (newSettings) => {
        setSettings(newSettings);
        vscode.postMessage({
            type: 'updateSettings',
            payload: newSettings
        });
    };
    const handleApplyCode = (code, filePath) => {
        vscode.postMessage({
            type: 'applyCode',
            payload: { code, filePath }
        });
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "app-container", children: [(0, jsx_runtime_1.jsx)("div", { className: "toast-container", children: toasts.map(toast => ((0, jsx_runtime_1.jsx)(Toast_1.default, { message: toast.message, type: toast.type, onClose: () => removeToast(toast.id) }, toast.id))) }), showLogs ? ((0, jsx_runtime_1.jsx)(LogsPanel_1.default, { onClose: () => setShowLogs(false) })) : showSettings ? ((0, jsx_runtime_1.jsx)(SettingsPanel_1.default, { settings: settings, savedApiKeys: apiKeys, onUpdate: handleSettingsUpdate, onClose: () => setShowSettings(false) })) : ((0, jsx_runtime_1.jsx)(ChatInterface_1.default, { messages: messages, isLoading: isLoading, currentModel: currentModel, settings: settings, usageStats: usageStats, onSendMessage: handleSendMessage, onClearChat: handleClearChat, onModelSwitch: handleModelSwitch, onOpenSettings: () => setShowSettings(true), onOpenLogs: () => setShowLogs(true), onApplyCode: handleApplyCode }))] }));
};
exports.default = App;
//# sourceMappingURL=App.js.map