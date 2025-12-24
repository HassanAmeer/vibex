import React, { useEffect, useRef } from 'react';
import { ChatMessage } from '../../types';
import './MessageList.css';

interface MessageListProps {
    messages: ChatMessage[];
    isLoading: boolean;
    onApplyCode: (code: string, filePath: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    onApplyCode
}: MessageListProps) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const extractCodeBlocks = (content: string) => {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(content)) !== null) {
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: content.substring(lastIndex, match.index)
                });
            }

            parts.push({
                type: 'code',
                content: match[2].trim(),
                language: match[1] || 'plaintext'
            });

            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < content.length) {
            parts.push({
                type: 'text',
                content: content.substring(lastIndex)
            });
        }

        return parts.length > 0 ? parts : [{ type: 'text', content }];
    };

    if (messages.length === 0 && !isLoading) {
        return (
            <div className="message-list">
                <div className="empty-state">
                    <div className="empty-icon">🚀</div>
                    <h2>Welcome to VibeAll!</h2>
                    <p className="version-tag">v1.0.2</p>
                    <p>Start a conversation with your AI coding assistant</p>
                    <div className="quick-actions">
                        <div className="quick-action">💻 Write code</div>
                        <div className="quick-action">🐛 Debug errors</div>
                        <div className="quick-action">📝 Explain code</div>
                        <div className="quick-action">✨ Refactor</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="message-list">
            {messages.map((message) => (
                <div key={message.id} className={`message message-${message.role}`}>
                    <div className="message-header">
                        <span className="message-role">
                            {message.role === 'user' ? '👤 You' : '🤖 Assistant'}
                        </span>
                        {message.model && (
                            <span className="message-model">{message.model}</span>
                        )}
                        {message.tokens && (
                            <span className="message-tokens">{message.tokens} tokens</span>
                        )}
                    </div>
                    <div className="message-content">
                        {extractCodeBlocks(message.content).map((part, index) => {
                            if (part.type === 'code') {
                                return (
                                    <div key={index} className="code-block">
                                        <div className="code-header">
                                            <span className="code-language">{part.language}</span>
                                            <button
                                                className="code-copy-button"
                                                onClick={() => navigator.clipboard.writeText(part.content)}
                                            >
                                                📋 Copy
                                            </button>
                                            <button
                                                className="code-apply-button"
                                                onClick={() => onApplyCode(part.content, '')}
                                            >
                                                ✨ Apply
                                            </button>
                                        </div>
                                        <pre><code>{part.content}</code></pre>
                                    </div>
                                );
                            }
                            return <p key={index}>{part.content}</p>;
                        })}
                    </div>
                </div>
            ))}

            {isLoading && (
                <div className="message message-assistant">
                    <div className="message-header">
                        <span className="message-role">🤖 Assistant</span>
                    </div>
                    <div className="message-content">
                        <div className="loading-indicator">
                            <span className="loading-dot"></span>
                            <span className="loading-dot"></span>
                            <span className="loading-dot"></span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
