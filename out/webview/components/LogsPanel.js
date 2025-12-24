"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
require("./LogsPanel.css");
const LogsPanel = ({ onClose }) => {
    const [logs, setLogs] = (0, react_1.useState)([]);
    const [filter, setFilter] = (0, react_1.useState)('all');
    (0, react_1.useEffect)(() => {
        // Request logs from extension
        const vscode = window.acquireVsCodeApi?.();
        if (vscode) {
            console.log('Requesting logs...');
            vscode.postMessage({ type: 'getLogs' });
        }
        const messageHandler = (event) => {
            const message = event.data;
            if (message.type === 'logs') {
                console.log('Received logs:', message.payload);
                setLogs(message.payload || []);
            }
            else if (message.type === 'newLog') {
                setLogs(prev => [...prev, message.payload]);
            }
        };
        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);
    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };
    const getLogIcon = (level) => {
        switch (level) {
            case 'error':
                return '🔴';
            case 'warning':
                return '⚠️';
            case 'info':
                return 'ℹ️';
            case 'debug':
                return '🐛';
            default:
                return '📝';
        }
    };
    const filteredLogs = filter === 'all'
        ? logs
        : logs.filter(log => log.level === filter);
    const clearLogs = () => {
        setLogs([]);
        const vscode = window.acquireVsCodeApi?.();
        if (vscode) {
            vscode.postMessage({ type: 'clearLogs' });
        }
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "logs-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "logs-header", children: [(0, jsx_runtime_1.jsxs)("div", { className: "header-left", children: [(0, jsx_runtime_1.jsx)("button", { className: "back-button", onClick: onClose, children: "\u2190 Back" }), (0, jsx_runtime_1.jsx)("h2", { children: "\uD83D\uDCCB Logs & Diagnostics" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "logs-actions", children: [(0, jsx_runtime_1.jsxs)("select", { className: "logs-filter", value: filter, onChange: (e) => setFilter(e.target.value), children: [(0, jsx_runtime_1.jsx)("option", { value: "all", children: "All Logs" }), (0, jsx_runtime_1.jsx)("option", { value: "info", children: "Info" }), (0, jsx_runtime_1.jsx)("option", { value: "warning", children: "Warnings" }), (0, jsx_runtime_1.jsx)("option", { value: "error", children: "Errors" }), (0, jsx_runtime_1.jsx)("option", { value: "debug", children: "Debug" })] }), (0, jsx_runtime_1.jsx)("button", { className: "clear-logs-button", onClick: clearLogs, children: "\uD83D\uDDD1\uFE0F Clear" })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "logs-content", children: filteredLogs.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "empty-logs", children: [(0, jsx_runtime_1.jsx)("p", { children: "No logs to display" }), (0, jsx_runtime_1.jsx)("p", { className: "hint", children: "Run some commands to generate logs" })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "logs-list", children: filteredLogs.map((log) => ((0, jsx_runtime_1.jsxs)("div", { className: `log-entry log-${log.level}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "log-header", children: [(0, jsx_runtime_1.jsx)("span", { className: "log-icon", children: getLogIcon(log.level) }), (0, jsx_runtime_1.jsx)("span", { className: "log-level", children: log.level.toUpperCase() }), (0, jsx_runtime_1.jsx)("span", { className: "log-timestamp", children: formatTimestamp(log.timestamp) })] }), (0, jsx_runtime_1.jsx)("div", { className: "log-message", children: log.message }), log.details && ((0, jsx_runtime_1.jsx)("div", { className: "log-details", children: (0, jsx_runtime_1.jsx)("pre", { children: JSON.stringify(log.details, null, 2) }) }))] }, log.id))) })) })] }));
};
exports.default = LogsPanel;
//# sourceMappingURL=LogsPanel.js.map