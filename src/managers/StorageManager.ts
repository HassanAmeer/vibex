import * as vscode from 'vscode';

export interface APIKey {
    provider: string;
    key: string;
}

export class StorageManager {
    private context: vscode.ExtensionContext;
    private secretStorage: vscode.SecretStorage;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.secretStorage = context.secrets;
    }

    async storeAPIKey(provider: string, key: string): Promise<void> {
        const storageKey = `vibeall.apikey.${provider}`;
        await this.secretStorage.store(storageKey, key);
        console.log(`[StorageManager] Stored API key for ${provider}`);
    }

    async getAPIKey(provider: string): Promise<string | undefined> {
        const storageKey = `vibeall.apikey.${provider}`;
        const key = await this.secretStorage.get(storageKey);
        return key;
    }

    async getAllAPIKeys(): Promise<APIKey[]> {
        const providers = ['groq', 'google', 'openai', 'cerebras', 'deepseek', 'sambanova'];
        const keys: APIKey[] = [];

        for (const provider of providers) {
            const key = await this.getAPIKey(provider);
            if (key) {
                keys.push({ provider, key });
            }
        }

        return keys;
    }

    async deleteAPIKey(provider: string): Promise<void> {
        const storageKey = `vibeall.apikey.${provider}`;
        await this.secretStorage.delete(storageKey);
        console.log(`[StorageManager] Deleted API key for ${provider}`);
    }

    // Settings storage
    getSettings(): any {
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

    async updateSettings(settings: any): Promise<void> {
        await this.context.globalState.update('vibeall.settings', settings);
        console.log('[StorageManager] Settings updated');
    }

    // Chat history storage
    getChatHistory(): any[] {
        return this.context.globalState.get('vibeall.chatHistory', []);
    }

    async saveChatHistory(messages: any[]): Promise<void> {
        await this.context.globalState.update('vibeall.chatHistory', messages);
    }

    async clearChatHistory(): Promise<void> {
        await this.context.globalState.update('vibeall.chatHistory', []);
        console.log('[StorageManager] Chat history cleared');
    }

    // Usage stats storage
    getUsageStats(): any {
        return this.context.globalState.get('vibeall.usageStats', {});
    }

    async updateUsageStats(stats: any): Promise<void> {
        await this.context.globalState.update('vibeall.usageStats', stats);
    }
}
