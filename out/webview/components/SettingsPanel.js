"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const theme_1 = require("../../constants/theme");
require("./SettingsPanel.css");
const SettingsPanel = ({ settings, savedApiKeys, onUpdate, onClose }) => {
    const [localSettings, setLocalSettings] = (0, react_1.useState)(settings);
    // Pre-fill Cerebras key if not already saved
    const [apiKeys, setApiKeys] = (0, react_1.useState)({
        ...savedApiKeys,
        cerebras: savedApiKeys.cerebras || 'csk-5pmk8d42rjn3jmj2wm3n49c8net4hfyd8ffpr33y4m8xv4pm'
    });
    const [savedKeys, setSavedKeys] = (0, react_1.useState)({});
    // Log when component mounts
    (0, react_1.useEffect)(() => {
        console.log('🔧 SettingsPanel mounted');
        console.log('📦 Saved API Keys received:', savedApiKeys);
        console.log('🔑 Current API Keys state:', apiKeys);
    }, []);
    const handleToggle = (key) => {
        const newSettings = {
            ...localSettings,
            [key]: !localSettings[key]
        };
        console.log('⚙️ Settings toggled:', key, '→', !localSettings[key]);
        setLocalSettings(newSettings);
        onUpdate(newSettings);
    };
    const handleThemeChange = (presetName) => {
        const preset = theme_1.THEME_PRESETS[presetName];
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
    const handleAPIKeyChange = (provider, value) => {
        console.log('✏️ API key changed for:', provider, '(length:', value.length, ')');
        setApiKeys({ ...apiKeys, [provider]: value });
        if (savedKeys[provider]) {
            setSavedKeys({ ...savedKeys, [provider]: false });
        }
    };
    const saveAPIKey = (provider) => {
        const vscode = window.acquireVsCodeApi?.();
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
        }
        else {
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
    return ((0, jsx_runtime_1.jsxs)("div", { className: "settings-panel", children: [(0, jsx_runtime_1.jsxs)("div", { className: "settings-header", children: [(0, jsx_runtime_1.jsx)("button", { className: "back-button", onClick: onClose, children: "\u2190 Back to Chat" }), (0, jsx_runtime_1.jsx)("h2", { children: "\u2699\uFE0F Settings" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "settings-content", children: [(0, jsx_runtime_1.jsxs)("section", { className: "settings-section", children: [(0, jsx_runtime_1.jsx)("h3", { children: "\uD83D\uDD11 API Keys" }), (0, jsx_runtime_1.jsx)("p", { className: "section-description", children: "Configure your API keys for different providers" }), providers.map(provider => ((0, jsx_runtime_1.jsxs)("div", { className: "api-key-input", children: [(0, jsx_runtime_1.jsxs)("label", { children: [provider.emoji, " ", provider.name] }), (0, jsx_runtime_1.jsxs)("div", { className: "input-group", children: [(0, jsx_runtime_1.jsx)("input", { type: "password", value: apiKeys[provider.id] || '', onChange: (e) => handleAPIKeyChange(provider.id, e.target.value), placeholder: `Enter ${provider.name} API key` }), (0, jsx_runtime_1.jsx)("button", { className: `save-key-button ${savedKeys[provider.id] ? 'saved' : ''}`, onClick: () => saveAPIKey(provider.id), disabled: !apiKeys[provider.id], children: savedKeys[provider.id] ? '✓ Saved' : 'Save' })] }), savedKeys[provider.id] && ((0, jsx_runtime_1.jsx)("div", { className: "success-message", children: "\u2713 API key saved securely" }))] }, provider.id)))] }), (0, jsx_runtime_1.jsxs)("section", { className: "settings-section", children: [(0, jsx_runtime_1.jsx)("h3", { children: "\uD83C\uDFA8 Theme" }), (0, jsx_runtime_1.jsx)("div", { className: "theme-presets", children: Object.keys(theme_1.THEME_PRESETS).map(presetName => ((0, jsx_runtime_1.jsx)("button", { className: "theme-preset", onClick: () => handleThemeChange(presetName), children: presetName }, presetName))) })] }), (0, jsx_runtime_1.jsxs)("section", { className: "settings-section", children: [(0, jsx_runtime_1.jsx)("h3", { children: "\u26A1 Preferences" }), (0, jsx_runtime_1.jsxs)("div", { className: "toggle-group", children: [(0, jsx_runtime_1.jsxs)("label", { className: "toggle-item", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: localSettings.autoRunCommands, onChange: () => handleToggle('autoRunCommands') }), (0, jsx_runtime_1.jsx)("span", { children: "Auto-run commands" })] }), (0, jsx_runtime_1.jsxs)("label", { className: "toggle-item", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: localSettings.autoApplyEdits, onChange: () => handleToggle('autoApplyEdits') }), (0, jsx_runtime_1.jsx)("span", { children: "Auto-apply edits" })] }), (0, jsx_runtime_1.jsxs)("label", { className: "toggle-item", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: localSettings.showMiniDashboard, onChange: () => handleToggle('showMiniDashboard') }), (0, jsx_runtime_1.jsx)("span", { children: "Show usage dashboard" })] }), (0, jsx_runtime_1.jsxs)("label", { className: "toggle-item", children: [(0, jsx_runtime_1.jsx)("input", { type: "checkbox", checked: localSettings.compactMode, onChange: () => handleToggle('compactMode') }), (0, jsx_runtime_1.jsx)("span", { children: "Compact mode" })] })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "settings-footer", children: (0, jsx_runtime_1.jsx)("p", { className: "version-info", children: "VibeAll v1.0.2" }) })] })] }));
};
exports.default = SettingsPanel;
//# sourceMappingURL=SettingsPanel.js.map