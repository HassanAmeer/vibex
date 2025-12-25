import React, { useState, useEffect } from 'react';
import { ExtensionSettings } from '../../types';
import { THEME_PRESETS } from '../../constants/theme';
import { Icons } from './Icons';
import './SettingsPanel.css';

interface SettingsPanelProps {
    settings: ExtensionSettings;
    savedApiKeys: { [key: string]: string };
    onUpdate: (settings: ExtensionSettings) => void;
    onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
    settings,
    savedApiKeys,
    onUpdate,
    onClose
}: SettingsPanelProps) => {
    const [localSettings, setLocalSettings] = useState(settings);
    const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
        ...savedApiKeys
    });
    const [savedKeysKey, setSavedKeysKey] = useState<{ [key: string]: boolean }>({});
    const [hiddenKeys, setHiddenKeys] = useState<{ [key: string]: boolean }>({});

    // Initialize hidden state (all hidden by default)
    useEffect(() => {
        const initialHiddenState: any = {};
        providers.forEach(p => initialHiddenState[p.id] = true);
        setHiddenKeys(initialHiddenState);
    }, []);

    const handleToggle = (key: keyof ExtensionSettings) => {
        const newSettings = {
            ...localSettings,
            [key]: !localSettings[key]
        };
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };

    const handleThemeChange = (presetName: string) => {
        const preset = THEME_PRESETS[presetName as keyof typeof THEME_PRESETS];
        const newSettings = {
            ...localSettings,
            theme: {
                ...localSettings.theme,
                primaryColor: preset.primaryColor,
                accentColor: preset.accentColor
            }
        };
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };

    const handleAPIKeyChange = (provider: string, value: string) => {
        setApiKeys({ ...apiKeys, [provider]: value });
        setSavedKeysKey({ ...savedKeysKey, [provider]: false });
    };

    const toggleKeyVisibility = (provider: string) => {
        setHiddenKeys(prev => ({
            ...prev,
            [provider]: !prev[provider]
        }));
    };

    const deleteAPIKey = (provider: string) => {
        setApiKeys(prev => ({ ...prev, [provider]: '' }));
        // Logic to clear from backend if needed, for now just UI clear
        const vscode = (window as any).acquireVsCodeApi?.();
        if (vscode) {
            // We can send a store empty key or a delete command if backend supports it
            // reusing storeAPIKey with empty string usually works or add deleteAPIKey command
            vscode.postMessage({
                type: 'storeAPIKey',
                payload: { provider, key: '' }
            });
        }
    };

    const saveAPIKey = (provider: string) => {
        const vscode = (window as any).acquireVsCodeApi?.();
        const key = apiKeys[provider];

        if (vscode && key) {
            vscode.postMessage({
                type: 'storeAPIKey',
                payload: { provider, key }
            });
            setSavedKeysKey({ ...savedKeysKey, [provider]: true });
            setTimeout(() => {
                setSavedKeysKey({ ...savedKeysKey, [provider]: false });
            }, 3000);
        }
    };

    const providers = [
        { id: 'groq', name: 'Groq', emoji: '⚡' },
        { id: 'google', name: 'Google', emoji: '🔮' },
        { id: 'cerebras', name: 'Cerebras', emoji: '🧠' },
        { id: 'sambanova', name: 'SambaNova', emoji: '🚀' },
        { id: 'openai', name: 'OpenAI', emoji: '🤖' },
        { id: 'anthropic', name: 'Anthropic', emoji: '🎭' },
        { id: 'xai', name: 'xAI (Grok)', emoji: '🚀' },
        { id: 'novita', name: 'Novita', emoji: '🐱' },
        { id: 'bytez', name: 'Bytez', emoji: '🎲' },
        { id: 'aimlapi', name: 'AimlAPI', emoji: '🤖' },
        { id: 'openrouter', name: 'OpenRouter', emoji: '⚡' }
    ];

    return (
        <div className="settings-panel">
            <div className="settings-header">
                <button className="back-button" onClick={onClose}>
                    <Icons.Back />
                    <span>Back to Chat</span>
                </button>
                <h2>Settings</h2>
            </div>

            <div className="settings-content">

                {/* Theme Section */}
                <section className="settings-section">
                    <h3>🎨 Theme</h3>
                    <div className="color-grid">
                        {Object.entries(THEME_PRESETS).map(([name, theme]) => (
                            <div
                                key={name}
                                className="color-box"
                                style={{ background: theme.primaryColor }}
                                onClick={() => handleThemeChange(name)}
                                title={name}
                            >
                                {localSettings.theme.primaryColor === theme.primaryColor && (
                                    <div className="check-mark">✓</div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* API Keys Section */}
                <section className="settings-section">
                    <h3>🔑 API Keys</h3>
                    <div className="api-keys-list">
                        {providers.map(provider => (
                            <div key={provider.id} className="api-key-item">
                                <div className="key-header">
                                    <span className="provider-name">{provider.name}</span>
                                </div>
                                <div className="key-input-wrapper">
                                    <input
                                        type={hiddenKeys[provider.id] ? "password" : "text"}
                                        value={apiKeys[provider.id] || ''}
                                        onChange={(e) => handleAPIKeyChange(provider.id, e.target.value)}
                                        placeholder={`Enter ${provider.name} Key`}
                                    />
                                    <button className="action-btn" onClick={() => toggleKeyVisibility(provider.id)}>
                                        {hiddenKeys[provider.id] ? <Icons.Eye /> : <Icons.EyeOff />}
                                    </button>
                                    <button className="action-btn" onClick={() => deleteAPIKey(provider.id)}>
                                        <Icons.Clear />
                                    </button>
                                    <button
                                        className={`action-btn save-btn ${savedKeysKey[provider.id] ? 'success' : ''}`}
                                        onClick={() => saveAPIKey(provider.id)}
                                        disabled={!apiKeys[provider.id]}
                                    >
                                        <Icons.Save />
                                    </button>
                                </div>
                                {savedKeysKey[provider.id] && (
                                    <div className="mini-toast">Saved!</div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Preferences Section */}
                <section className="settings-section">
                    <h3>Preferences</h3>
                    <div className="toggle-group">
                        <label className="toggle-item">
                            <input
                                type="checkbox"
                                checked={localSettings.autoRunCommands}
                                onChange={() => handleToggle('autoRunCommands')}
                            />
                            <span>Auto-run commands</span>
                        </label>
                        <label className="toggle-item">
                            <input
                                type="checkbox"
                                checked={localSettings.autoApplyEdits}
                                onChange={() => handleToggle('autoApplyEdits')}
                            />
                            <span>Auto-apply edits</span>
                        </label>
                        <label className="toggle-item">
                            <input
                                type="checkbox"
                                checked={localSettings.showMiniDashboard}
                                onChange={() => handleToggle('showMiniDashboard')}
                            />
                            <span>Show usage dashboard</span>
                        </label>
                        <label className="toggle-item">
                            <input
                                type="checkbox"
                                checked={localSettings.compactMode}
                                onChange={() => handleToggle('compactMode')}
                            />
                            <span>Compact mode</span>
                        </label>
                    </div>
                </section>

                <div className="settings-footer">VibeAll v1.0.2</div>
            </div>
        </div>
    );
};

export default SettingsPanel;
