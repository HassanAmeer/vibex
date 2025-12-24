"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageManager = void 0;
class StorageManager {
    constructor(context) {
        this.context = context;
        this.secretStorage = context.secrets;
    }
    async storeAPIKey(provider, key) {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;
        await this.secretStorage.store(storageKey, key);
        console.log(`[StorageManager] Stored API key for ${provider}`);
    }
    async getAPIKey(provider) {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;
        const key = await this.secretStorage.get(storageKey);
        return key;
    }
    async getAllAPIKeys() {
        const providers = ['groq', 'google', 'openai', 'cerebras', 'deepseek', 'sambanova', 'anthropic'];
        const keys = [];
        for (const provider of providers) {
            const key = await this.getAPIKey(provider);
            if (key) {
                keys.push({ provider, key });
            }
        }
        return keys;
    }
    async deleteAPIKey(provider) {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;
        await this.secretStorage.delete(storageKey);
        console.log(`[StorageManager] Deleted API key for ${provider}`);
    }
    // Settings storage
    getSettings() {
        return this.context.globalState.get('vibeall.settings', {
            autoRunCommands: false,
            autoApplyEdits: false,
            showMiniDashboard: true,
            compactMode: false,
            alwaysShowPlan: false,
            planMode: false,
            theme: {
                primaryColor: '#FF5722',
                accentColor: '#FF9800',
                mode: 'dark'
            }
        });
    }
    async updateSettings(settings) {
        await this.context.globalState.update('vibeall.settings', settings);
        console.log('[StorageManager] Settings updated');
    }
    // Chat history storage
    getChatHistory() {
        return this.context.globalState.get('vibeall.chatHistory', []);
    }
    async saveChatHistory(messages) {
        await this.context.globalState.update('vibeall.chatHistory', messages);
    }
    async clearChatHistory() {
        await this.context.globalState.update('vibeall.chatHistory', []);
        console.log('[StorageManager] Chat history cleared');
    }
    // Usage stats storage
    getUsageStats() {
        return this.context.globalState.get('vibeall.usageStats', {});
    }
    async updateUsageStats(stats) {
        await this.context.globalState.update('vibeall.usageStats', stats);
    }
}
exports.StorageManager = StorageManager;
//# sourceMappingURL=StorageManager.js.map