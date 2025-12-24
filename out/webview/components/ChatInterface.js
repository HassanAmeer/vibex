"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const ModelSelector_1 = __importDefault(require("./ModelSelector"));
const MessageList_1 = __importDefault(require("./MessageList"));
const ChatInput_1 = __importDefault(require("./ChatInput"));
const UsageDashboard_1 = __importDefault(require("./UsageDashboard"));
require("./ChatInterface.css");
const ChatInterface = ({ messages, isLoading, currentModel, settings, usageStats, onSendMessage, onClearChat, onModelSwitch, onOpenSettings, onOpenLogs, onApplyCode }) => {
    const [showModelSelector, setShowModelSelector] = (0, react_1.useState)(false);
    const [showDashboard, setShowDashboard] = (0, react_1.useState)(false);
    return ((0, jsx_runtime_1.jsxs)("div", { className: `chat-interface ${settings.compactMode ? 'compact' : ''}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "chat-header", children: [(0, jsx_runtime_1.jsx)("div", { className: "header-left", children: (0, jsx_runtime_1.jsxs)("button", { className: "model-selector-button", onClick: () => setShowModelSelector(!showModelSelector), children: [(0, jsx_runtime_1.jsx)("span", { className: "model-icon", children: "\uD83E\uDD16" }), (0, jsx_runtime_1.jsx)("span", { className: "model-name", children: currentModel.modelId }), (0, jsx_runtime_1.jsx)("span", { className: "dropdown-icon", children: showModelSelector ? '▲' : '▼' })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "header-right", children: [(0, jsx_runtime_1.jsx)("button", { className: "icon-button", onClick: onOpenLogs, title: "View Logs", children: "\uD83D\uDCCB" }), settings.showMiniDashboard && ((0, jsx_runtime_1.jsx)("button", { className: "icon-button", onClick: () => setShowDashboard(!showDashboard), title: "Usage Stats", children: "\uD83D\uDCCA" })), (0, jsx_runtime_1.jsx)("button", { className: "icon-button", onClick: onOpenSettings, title: "Settings", children: "\u2699\uFE0F" }), (0, jsx_runtime_1.jsx)("button", { className: "icon-button", onClick: onClearChat, title: "Clear Chat", children: "\uD83D\uDDD1\uFE0F" })] })] }), showModelSelector && ((0, jsx_runtime_1.jsx)(ModelSelector_1.default, { currentModel: currentModel, onSelect: (provider, modelId) => {
                    onModelSwitch(provider, modelId);
                    setShowModelSelector(false);
                }, onClose: () => setShowModelSelector(false) })), showDashboard && ((0, jsx_runtime_1.jsx)(UsageDashboard_1.default, { stats: usageStats, onClose: () => setShowDashboard(false) })), (0, jsx_runtime_1.jsx)(MessageList_1.default, { messages: messages, isLoading: isLoading, onApplyCode: onApplyCode }), (0, jsx_runtime_1.jsx)(ChatInput_1.default, { onSend: onSendMessage, disabled: isLoading })] }));
};
exports.default = ChatInterface;
//# sourceMappingURL=ChatInterface.js.map