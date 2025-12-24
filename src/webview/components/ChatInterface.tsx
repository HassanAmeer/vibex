import { useState } from 'react';
import ModelSelector from './ModelSelector';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import UsageDashboard from './UsageDashboard';
import { ChatMessage, ExtensionSettings, UsageStats } from '../../types';
import './ChatInterface.css';

interface ChatInterfaceProps {
    messages: ChatMessage[];
    isLoading: boolean;
    currentModel: { provider: string; modelId: string };
    settings: ExtensionSettings;
    usageStats: UsageStats;
    onSendMessage: (content: string, attachments?: any[]) => void;
    onClearChat: () => void;
    onModelSwitch: (provider: string, modelId: string) => void;
    onOpenSettings: () => void;
    onOpenLogs: () => void;
    onApplyCode: (code: string, filePath: string) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
    messages,
    isLoading,
    currentModel,
    settings,
    usageStats,
    onSendMessage,
    onClearChat,
    onModelSwitch,
    onOpenSettings,
    onOpenLogs,
    onApplyCode
}: ChatInterfaceProps) => {
    const [showModelSelector, setShowModelSelector] = useState(false);
    const [showDashboard, setShowDashboard] = useState(false);

    return (
        <div className={`chat-interface ${settings.compactMode ? 'compact' : ''}`}>
            <div className="chat-header">
                <div className="header-left">
                    <button
                        className="model-selector-button"
                        onClick={() => setShowModelSelector(!showModelSelector)}
                    >
                        <span className="model-icon">🤖</span>
                        <span className="model-name">{currentModel.modelId}</span>
                        <span className="dropdown-icon">{showModelSelector ? '▲' : '▼'}</span>
                    </button>
                </div>

                <div className="header-right">
                    <button
                        className="icon-button"
                        onClick={onOpenLogs}
                        title="View Logs"
                    >
                        📋
                    </button>
                    {settings.showMiniDashboard && (
                        <button
                            className="icon-button"
                            onClick={() => setShowDashboard(!showDashboard)}
                            title="Usage Stats"
                        >
                            📊
                        </button>
                    )}
                    <button
                        className="icon-button"
                        onClick={onOpenSettings}
                        title="Settings"
                    >
                        ⚙️
                    </button>
                    <button
                        className="icon-button"
                        onClick={onClearChat}
                        title="Clear Chat"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            {showModelSelector && (
                <ModelSelector
                    currentModel={currentModel}
                    onSelect={(provider: string, modelId: string) => {
                        onModelSwitch(provider, modelId);
                        setShowModelSelector(false);
                    }}
                    onClose={() => setShowModelSelector(false)}
                />
            )}

            {showDashboard && (
                <UsageDashboard
                    stats={usageStats}
                    onClose={() => setShowDashboard(false)}
                />
            )}

            <MessageList
                messages={messages}
                isLoading={isLoading}
                onApplyCode={onApplyCode}
            />

            <ChatInput
                onSend={onSendMessage}
                disabled={isLoading}
            />
        </div>
    );
};

export default ChatInterface;
