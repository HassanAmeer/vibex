import React, { useState, useEffect } from 'react';
import './LogsPanel.css';

interface LogsPanelProps {
    onClose: () => void;
}

interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    details?: any;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ onClose }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [filter, setFilter] = useState<string>('all');

    useEffect(() => {
        // Request logs from extension
        const vscode = (window as any).acquireVsCodeApi?.();
        if (vscode) {
            console.log('Requesting logs...');
            vscode.postMessage({ type: 'getLogs' });
        }

        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'logs') {
                console.log('Received logs:', message.payload);
                setLogs(message.payload || []);
            } else if (message.type === 'newLog') {
                setLogs(prev => [...prev, message.payload]);
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);

    const formatTimestamp = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString();
    };

    const getLogIcon = (level: string) => {
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
        const vscode = (window as any).acquireVsCodeApi?.();
        if (vscode) {
            vscode.postMessage({ type: 'clearLogs' });
        }
    };

    return (
        <div className="logs-panel">
            <div className="logs-header">
                <div className="header-left">
                    <button className="back-button" onClick={onClose}>← Back</button>
                    <h2>📋 Logs & Diagnostics</h2>
                </div>

                <div className="logs-actions">
                    <select
                        className="logs-filter"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Logs</option>
                        <option value="info">Info</option>
                        <option value="warning">Warnings</option>
                        <option value="error">Errors</option>
                        <option value="debug">Debug</option>
                    </select>
                    <button className="clear-logs-button" onClick={clearLogs}>
                        🗑️ Clear
                    </button>
                </div>
            </div>

            <div className="logs-content">
                {filteredLogs.length === 0 ? (
                    <div className="empty-logs">
                        <p>No logs to display</p>
                        <p className="hint">Run some commands to generate logs</p>
                    </div>
                ) : (
                    <div className="logs-list">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className={`log-entry log-${log.level}`}>
                                <div className="log-header">
                                    <span className="log-icon">{getLogIcon(log.level)}</span>
                                    <span className="log-level">{log.level.toUpperCase()}</span>
                                    <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
                                </div>
                                <div className="log-message">{log.message}</div>
                                {log.details && (
                                    <div className="log-details">
                                        <pre>{JSON.stringify(log.details, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogsPanel;
