"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./MessageList.css");
const MessageList = ({ messages, isLoading, onApplyCode }) => {
    const messagesEndRef = (0, react_1.useRef)(null);
    (0, react_1.useEffect)(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    const extractCodeBlocks = (content) => {
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        const parts = [];
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
        return ((0, jsx_runtime_1.jsx)("div", { className: "message-list", children: (0, jsx_runtime_1.jsxs)("div", { className: "empty-state", children: [(0, jsx_runtime_1.jsx)("div", { className: "empty-icon", children: "\uD83D\uDE80" }), (0, jsx_runtime_1.jsx)("h2", { children: "Welcome to VibeAll!" }), (0, jsx_runtime_1.jsx)("p", { className: "version-tag", children: "v1.0.2" }), (0, jsx_runtime_1.jsx)("p", { children: "Start a conversation with your AI coding assistant" }), (0, jsx_runtime_1.jsxs)("div", { className: "quick-actions", children: [(0, jsx_runtime_1.jsx)("div", { className: "quick-action", children: "\uD83D\uDCBB Write code" }), (0, jsx_runtime_1.jsx)("div", { className: "quick-action", children: "\uD83D\uDC1B Debug errors" }), (0, jsx_runtime_1.jsx)("div", { className: "quick-action", children: "\uD83D\uDCDD Explain code" }), (0, jsx_runtime_1.jsx)("div", { className: "quick-action", children: "\u2728 Refactor" })] })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "message-list", children: [messages.map((message) => ((0, jsx_runtime_1.jsxs)("div", { className: `message message-${message.role}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "message-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "message-role", children: message.role === 'user' ? '👤 You' : '🤖 Assistant' }), message.model && ((0, jsx_runtime_1.jsx)("span", { className: "message-model", children: message.model })), message.tokens && ((0, jsx_runtime_1.jsxs)("span", { className: "message-tokens", children: [message.tokens, " tokens"] }))] }), (0, jsx_runtime_1.jsx)("div", { className: "message-content", children: extractCodeBlocks(message.content).map((part, index) => {
                            if (part.type === 'code') {
                                return ((0, jsx_runtime_1.jsxs)("div", { className: "code-block", children: [(0, jsx_runtime_1.jsxs)("div", { className: "code-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "code-language", children: part.language }), (0, jsx_runtime_1.jsx)("button", { className: "code-copy-button", onClick: () => navigator.clipboard.writeText(part.content), children: "\uD83D\uDCCB Copy" }), (0, jsx_runtime_1.jsx)("button", { className: "code-apply-button", onClick: () => onApplyCode(part.content, ''), children: "\u2728 Apply" })] }), (0, jsx_runtime_1.jsx)("pre", { children: (0, jsx_runtime_1.jsx)("code", { children: part.content }) })] }, index));
                            }
                            return (0, jsx_runtime_1.jsx)("p", { children: part.content }, index);
                        }) })] }, message.id))), isLoading && ((0, jsx_runtime_1.jsxs)("div", { className: "message message-assistant", children: [(0, jsx_runtime_1.jsx)("div", { className: "message-header", children: (0, jsx_runtime_1.jsx)("span", { className: "message-role", children: "\uD83E\uDD16 Assistant" }) }), (0, jsx_runtime_1.jsx)("div", { className: "message-content", children: (0, jsx_runtime_1.jsxs)("div", { className: "loading-indicator", children: [(0, jsx_runtime_1.jsx)("span", { className: "loading-dot" }), (0, jsx_runtime_1.jsx)("span", { className: "loading-dot" }), (0, jsx_runtime_1.jsx)("span", { className: "loading-dot" })] }) })] })), (0, jsx_runtime_1.jsx)("div", { ref: messagesEndRef })] }));
};
exports.default = MessageList;
//# sourceMappingURL=MessageList.js.map