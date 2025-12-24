import React, { useState } from 'react';
import { BreadcrumbSelector } from './BreadcrumbSelector';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import UsageDashboard from './UsageDashboard';
import { Icons } from './Icons';
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
    const [showDashboard, setShowDashboard] = useState(false);

    return (
        <div className={`chat-interface ${settings.compactMode ? 'compact' : ''}`}>
            {/* Header: Action Icons */}
            <div className="chat-header">
                <div className="header-left">
                    {/* Space for future left-side items or branding */}
                </div>

                <div className="header-actions">
                    <button className="icon-btn" onClick={onOpenLogs} title="Logs">
                        <Icons.Logs />
                    </button>

                    {settings.showMiniDashboard && (
                        <button className="icon-btn" onClick={() => setShowDashboard(!showDashboard)} title="Dashboard">
                            <Icons.Dashboard />
                        </button>
                    )}

                    <button className="icon-btn" onClick={onOpenSettings} title="Settings">
                        <Icons.Settings />
                    </button>

                    <div className="separator-vertical"></div>

                    <button className="icon-btn danger" onClick={onClearChat} title="Clear All">
                        <Icons.Clear />
                    </button>
                </div>
            </div>

            {/* Main Content: Messages or Dashboard */}
            {showDashboard && (
                <div className="dashboard-overlay">
                    <UsageDashboard
                        stats={usageStats}
                        onClose={() => setShowDashboard(false)}
                    />
                </div>
            )}

            <MessageList
                messages={messages}
                isLoading={isLoading}
                onApplyCode={onApplyCode}
            />

            {/* Footer: Input and Breadcrumbs */}
            <div className="chat-footer">
                <ChatInput
                    onSend={onSendMessage}
                    disabled={isLoading}
                />
                <div className="model-bar">
                    <BreadcrumbSelector
                        currentProvider={currentModel.provider}
                        currentModelId={currentModel.modelId}
                        onSelect={onModelSwitch}
                    />
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
