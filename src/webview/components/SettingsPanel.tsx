import React, { useState, useEffect } from 'react';
import { ExtensionSettings } from '../../types';
import { THEME_PRESETS } from '../../constants/theme';
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
    // Pre-fill Cerebras key if not already saved
    const [apiKeys, setApiKeys] = useState<{ [key: string]: string }>({
        ...savedApiKeys,
        cerebras: savedApiKeys.cerebras || 'csk-5pmk8d42rjn3jmj2wm3n49c8net4hfyd8ffpr33y4m8xv4pm'
    });
    const [savedKeys, setSavedKeys] = useState<{ [key: string]: boolean }>({});

    // Log when component mounts
    useEffect(() => {
        console.log('🔧 SettingsPanel mounted');
        console.log('📦 Saved API Keys received:', savedApiKeys);
        console.log('🔑 Current API Keys state:', apiKeys);
    }, []);

    const handleToggle = (key: keyof ExtensionSettings) => {
        const newSettings = {
            ...localSettings,
            [key]: !localSettings[key]
        };
        console.log('⚙️ Settings toggled:', key, '→', !localSettings[key]);
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
        console.log('🎨 Theme changed to:', presetName);
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };

    const handleAPIKeyChange = (provider: string, value: string) => {
        console.log('✏️ API key changed for:', provider, '(length:', value.length, ')');
        setApiKeys({ ...apiKeys, [provider]: value });
        if (savedKeys[provider]) {
            setSavedKeys({ ...savedKeys, [provider]: false });
        }
    };

    const saveAPIKey = (provider: string) => {
        const vscode = (window as any).acquireVsCodeApi?.();
        const key = apiKeys[provider];

        console.log('💾 Attempting to save API key for:', provider);
        console.log('🔑 Key length:', key?.length);
        console.log('📡 VS Code API available:', !!vscode);

        if (vscode && key) {
            console.log('✅ Sending storeAPIKey message to extension...');
            vscode.postMessage({
                type: 'storeAPIKey',
                payload: { provider, key }
            });

            setSavedKeys({ ...savedKeys, [provider]: true });

            console.log('⏰ Setting success indicator for 3 seconds');
            setTimeout(() => {
                setSavedKeys({ ...savedKeys, [provider]: false });
            }, 3000);
        } else {
            console.error('❌ Cannot save - VS Code API:', !!vscode, 'Key exists:', !!key);
        }
    };

    const providers = [
        { id: 'groq', name: 'Groq', emoji: '⚡' },
        { id: 'google', name: 'Google Gemini', emoji: '🔮' },
        { id: 'cerebras', name: 'Cerebras', emoji: '🧠' },
        { id: 'sambanova', name: 'SambaNova', emoji: '🚀' },
        { id: 'openai', name: 'OpenAI', emoji: '🤖' },
        { id: 'anthropic', name: 'Anthropic', emoji: '🎭' }
    ];

    return (
        <div className="settings-panel">
            <div className="settings-header">
                <h2>⚙️ Settings</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            <div className="settings-content">
                <section className="settings-section">
                    <h3>🔑 API Keys</h3>
                    <p className="section-description">
                        Configure your API keys for different providers
                    </p>
                    {providers.map(provider => (
                        <div key={provider.id} className="api-key-input">
                            <label>
                                {provider.emoji} {provider.name}
                            </label>
                            <div className="input-group">
                                <input
                                    type="password"
                                    value={apiKeys[provider.id] || ''}
                                    onChange={(e) => handleAPIKeyChange(provider.id, e.target.value)}
                                    placeholder={`Enter ${provider.name} API key`}
                                />
                                <button
                                    className={`save-key-button ${savedKeys[provider.id] ? 'saved' : ''}`}
                                    onClick={() => saveAPIKey(provider.id)}
                                    disabled={!apiKeys[provider.id]}
                                >
                                    {savedKeys[provider.id] ? '✓ Saved' : 'Save'}
                                </button>
                            </div>
                            {savedKeys[provider.id] && (
                                <div className="success-message">✓ API key saved securely</div>
                            )}
                        </div>
                    ))}
                </section>

                <section className="settings-section">
                    <h3>🎨 Theme</h3>
                    <div className="theme-presets">
                        {Object.keys(THEME_PRESETS).map(presetName => (
                            <button
                                key={presetName}
                                className="theme-preset"
                                onClick={() => handleThemeChange(presetName)}
                            >
                                {presetName}
                            </button>
                        ))}
                    </div>
                </section>

                <section className="settings-section">
                    <h3>⚡ Preferences</h3>
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

                <div className="settings-footer">
                    <p className="version-info">VibeAll v1.0.2</p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
