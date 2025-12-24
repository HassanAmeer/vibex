import React from 'react';
import { UsageStats } from '../../types';
import './UsageDashboard.css';

interface UsageDashboardProps {
    stats: UsageStats;
    onClose: () => void;
}

const UsageDashboard: React.FC<UsageDashboardProps> = ({
    stats,
    onClose
}: UsageDashboardProps) => {
    const totalRequests = Object.values(stats).reduce((sum, stat) => sum + stat.requests, 0);
    const totalTokens = Object.values(stats).reduce((sum, stat) => sum + stat.tokens, 0);

    return (
        <div className="usage-dashboard">
            <div className="dashboard-header">
                <h3>📊 Usage Statistics</h3>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-value">{totalRequests}</div>
                    <div className="stat-label">Total Requests</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{(totalTokens / 1000).toFixed(1)}K</div>
                    <div className="stat-label">Total Tokens</div>
                </div>
            </div>

            <div className="provider-stats">
                {Object.entries(stats).map(([provider, stat]) => (
                    <div key={provider} className="provider-stat">
                        <div className="provider-name">
                            {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </div>
                        <div className="provider-details">
                            <span>{stat.requests} requests</span>
                            <span>{(stat.tokens / 1000).toFixed(1)}K tokens</span>
                        </div>
                        <div className="provider-last-used">
                            Last used: {new Date(stat.lastUsed).toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            {Object.keys(stats).length === 0 && (
                <div className="no-stats">
                    <p>No usage data yet</p>
                    <p className="hint">Start chatting to see statistics</p>
                </div>
            )}
        </div>
    );
};

export default UsageDashboard;
