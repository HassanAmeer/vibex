import * as vscode from 'vscode';
import { LiveDBClient } from '../services/LiveDBClient';

export interface APIKey {
    provider: string;
    key: string;
}

export class StorageManager {
    private context: vscode.ExtensionContext;
    private secretStorage: vscode.SecretStorage;
    private liveDB: LiveDBClient;
    private userId: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.secretStorage = context.secrets;
        this.liveDB = new LiveDBClient();

        // Generate or retrieve user ID for LiveDB
        this.userId = this.getUserId();
    }

    /**
     * Get or create a unique user ID for LiveDB
     */
    private getUserId(): string {
        let userId = this.context.globalState.get<string>('vibeall.userId');

        if (!userId) {
            // Generate a unique user ID
            userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            this.context.globalState.update('vibeall.userId', userId);
            console.log('[StorageManager] Generated new user ID:', userId);
        }

        return userId;
    }

    async storeAPIKey(provider: string, key: string): Promise<void> {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;

        // Store locally in VS Code secret storage
        await this.secretStorage.store(storageKey, key);
        console.log(`[StorageManager] Stored API key for ${provider} locally`);

        // Sync to LiveDB cloud
        try {
            const synced = await this.liveDB.storeAPIKey(provider, key, this.userId);
            if (synced) {
                console.log(`[StorageManager] ✅ Synced ${provider} API key to LiveDB`);
            }
        } catch (error) {
            console.error(`[StorageManager] Failed to sync ${provider} to LiveDB:`, error);
            // Continue even if cloud sync fails - local storage is primary
        }
    }

    async getAPIKey(provider: string): Promise<string | undefined> {
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;

        // Try local storage first
        let key = await this.secretStorage.get(storageKey);

        // If not found locally, try LiveDB
        if (!key) {
            try {
                const cloudKey = await this.liveDB.getAPIKey(provider, this.userId);
                if (cloudKey && cloudKey.key) {
                    // Store locally for future use
                    await this.secretStorage.store(storageKey, cloudKey.key);
                    console.log(`[StorageManager] Retrieved ${provider} API key from LiveDB`);
                    key = cloudKey.key;
                }
            } catch (error) {
                console.error(`[StorageManager] Failed to get ${provider} from LiveDB:`, error);
            }
        }

        return key;
    }

    async getAllAPIKeys(): Promise<APIKey[]> {
        const providers = [
            'groq', 'google', 'openai', 'cerebras', 'deepseek', 'sambanova',
            'anthropic', 'xai', 'novita', 'bytez', 'aimlapi', 'openrouter'
        ];
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
        const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;

        // Delete from local storage
        await this.secretStorage.delete(storageKey);
        console.log(`[StorageManager] Deleted API key for ${provider} locally`);

        // Delete from LiveDB
        try {
            await this.liveDB.deleteAPIKey(provider, this.userId);
            console.log(`[StorageManager] ✅ Deleted ${provider} API key from LiveDB`);
        } catch (error) {
            console.error(`[StorageManager] Failed to delete ${provider} from LiveDB:`, error);
        }
    }

    /**
     * Sync all API keys from LiveDB to local storage
     */
    async syncFromCloud(): Promise<number> {
        try {
            console.log('[StorageManager] 🔄 Syncing API keys from LiveDB...');
            const cloudKeys = await this.liveDB.syncFromCloud(this.userId);

            for (const cloudKey of cloudKeys) {
                const storageKey = `vibeall.apikey.${cloudKey.provider.toLowerCase()}`;
                await this.secretStorage.store(storageKey, cloudKey.key);
            }

            console.log(`[StorageManager] ✅ Synced ${cloudKeys.length} API keys from LiveDB`);
            return cloudKeys.length;
        } catch (error) {
            console.error('[StorageManager] Failed to sync from LiveDB:', error);
            return 0;
        }
    }

    /**
     * Sync all local API keys to LiveDB
     */
    async syncToCloud(): Promise<boolean> {
        try {
            console.log('[StorageManager] 🔄 Syncing API keys to LiveDB...');
            const localKeys = await this.getAllAPIKeys();
            return await this.liveDB.syncToCloud(localKeys, this.userId);
        } catch (error) {
            console.error('[StorageManager] Failed to sync to LiveDB:', error);
            return false;
        }
    }

    /**
     * Test LiveDB connection
     */
    async testLiveDBConnection(): Promise<boolean> {
        return await this.liveDB.testConnection();
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
