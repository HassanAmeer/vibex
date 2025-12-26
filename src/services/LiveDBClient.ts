/**
 * LiveDB Client for VibeAll
 * Handles API key storage and retrieval from LiveDB cloud database
 */

const LIVEDB_BASE_URL = 'https://link.thelocalrent.com/api/db';
const LIVEDB_TOKEN = '37160f2e00721d906831565829ae1de7';
const PROJECT_NAME = 'vibex';
const COLLECTION_NAME = 'api_keys';

interface APIKeyDocument {
    id?: string;
    provider: string;
    key: string;
    user_id: string;
    created_at?: string;
    updated_at?: string;
}

export class LiveDBClient {
    private baseUrl: string;
    private token: string;
    private project: string;

    constructor() {
        this.baseUrl = LIVEDB_BASE_URL;
        this.token = LIVEDB_TOKEN;
        this.project = PROJECT_NAME;
    }

    /**
     * Get headers for LiveDB requests
     */
    private getHeaders(includeContentType: boolean = true): HeadersInit {
        const headers: HeadersInit = {
            'Authorization': `Bearer ${this.token}`
        };
        if (includeContentType) {
            headers['Content-Type'] = 'application/json';
        }
        return headers;
    }

    /**
     * Store an API key in LiveDB
     */
    async storeAPIKey(provider: string, key: string, userId: string): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/${this.project}/${COLLECTION_NAME}`;

            console.log('[LiveDB] Attempting to store API key:', {
                provider,
                userId,
                url,
                keyLength: key.length
            });

            // Check if key already exists for this provider and user
            const existing = await this.getAPIKey(provider, userId);

            if (existing) {
                console.log('[LiveDB] Key exists, updating:', existing.id);
                // Update existing key
                return await this.updateAPIKey(existing.id!, provider, key, userId);
            }

            console.log('[LiveDB] Creating new key entry');

            // Create new key
            const payload = {
                provider,
                key,
                user_id: userId,
                created_at: new Date().toISOString()
            };

            console.log('[LiveDB] Request payload:', { ...payload, key: '***' });

            const response = await fetch(url, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });

            console.log('[LiveDB] Response status:', response.status, response.statusText);

            if (!response.ok) {
                const error = await response.text();
                console.error('[LiveDB] Store error response:', error);
                return false;
            }

            const result = await response.json();
            console.log('[LiveDB] ✅ API key stored successfully:', provider, result);
            return true;
        } catch (error) {
            console.error('[LiveDB] Failed to store API key:', error);
            if (error instanceof Error) {
                console.error('[LiveDB] Error details:', error.message, error.stack);
            }
            return false;
        }
    }

    /**
     * Get an API key from LiveDB
     */
    async getAPIKey(provider: string, userId: string): Promise<APIKeyDocument | null> {
        try {
            const url = `${this.baseUrl}/${this.project}/${COLLECTION_NAME}?provider=${provider}&user_id=${userId}`;

            console.log('[LiveDB] Getting API key:', { provider, userId, url });

            const response = await fetch(url, {
                headers: this.getHeaders(false)
            });

            console.log('[LiveDB] Get response status:', response.status);

            if (!response.ok) {
                console.log('[LiveDB] Get failed:', response.status);
                return null;
            }

            const result = await response.json();
            console.log('[LiveDB] Get response:', result);

            // LiveDB returns: { success: true, data: [...], meta: {...} }
            if (result && result.success && result.data && result.data.length > 0) {
                console.log('[LiveDB] ✅ Found API key:', result.data[0]);
                return result.data[0];
            }

            console.log('[LiveDB] No API key found for:', provider);
            return null;
        } catch (error) {
            console.error('[LiveDB] Failed to get API key:', error);
            return null;
        }
    }

    /**
     * Get all API keys for a user
     */
    async getAllAPIKeys(userId: string): Promise<APIKeyDocument[]> {
        try {
            const url = `${this.baseUrl}/${this.project}/${COLLECTION_NAME}?user_id=${userId}`;

            console.log('[LiveDB] Getting all API keys for user:', userId);

            const response = await fetch(url, {
                headers: this.getHeaders(false)
            });

            console.log('[LiveDB] Get all response status:', response.status);

            if (!response.ok) {
                console.log('[LiveDB] Get all failed:', response.status);
                return [];
            }

            const result = await response.json();
            console.log('[LiveDB] Get all response:', result);

            // LiveDB returns: { success: true, data: [...], meta: {...} }
            if (result && result.success && result.data) {
                console.log('[LiveDB] ✅ Found', result.data.length, 'API keys');
                return result.data;
            }

            return [];
        } catch (error) {
            console.error('[LiveDB] Failed to get all API keys:', error);
            return [];
        }
    }

    /**
     * Update an existing API key
     */
    async updateAPIKey(id: string, provider: string, key: string, userId: string): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/${this.project}/${COLLECTION_NAME}/${id}`;

            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    provider,
                    key,
                    user_id: userId,
                    updated_at: new Date().toISOString()
                })
            });

            if (!response.ok) {
                const error = await response.text();
                console.error('LiveDB update error:', error);
                return false;
            }

            console.log('✅ API key updated in LiveDB:', provider);
            return true;
        } catch (error) {
            console.error('Failed to update API key in LiveDB:', error);
            return false;
        }
    }

    /**
     * Delete an API key from LiveDB
     */
    async deleteAPIKey(provider: string, userId: string): Promise<boolean> {
        try {
            const existing = await this.getAPIKey(provider, userId);

            if (!existing || !existing.id) {
                return false;
            }

            const url = `${this.baseUrl}/${this.project}/${COLLECTION_NAME}/${existing.id}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: this.getHeaders(false)
            });

            if (!response.ok) {
                return false;
            }

            console.log('✅ API key deleted from LiveDB:', provider);
            return true;
        } catch (error) {
            console.error('Failed to delete API key from LiveDB:', error);
            return false;
        }
    }

    /**
     * Sync API keys from LiveDB to local storage
     */
    async syncFromCloud(userId: string): Promise<APIKeyDocument[]> {
        try {
            console.log('🔄 Syncing API keys from LiveDB...');
            const keys = await this.getAllAPIKeys(userId);
            console.log(`✅ Synced ${keys.length} API keys from LiveDB`);
            return keys;
        } catch (error) {
            console.error('Failed to sync from LiveDB:', error);
            return [];
        }
    }

    /**
     * Sync API keys from local storage to LiveDB
     */
    async syncToCloud(apiKeys: Array<{ provider: string; key: string }>, userId: string): Promise<boolean> {
        try {
            console.log('🔄 Syncing API keys to LiveDB...');

            for (const { provider, key } of apiKeys) {
                await this.storeAPIKey(provider, key, userId);
            }

            console.log(`✅ Synced ${apiKeys.length} API keys to LiveDB`);
            return true;
        } catch (error) {
            console.error('Failed to sync to LiveDB:', error);
            return false;
        }
    }

    /**
     * Test connection to LiveDB
     */
    async testConnection(): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/${this.project}`;

            const response = await fetch(url, {
                headers: this.getHeaders(false)
            });

            return response.ok;
        } catch (error) {
            console.error('LiveDB connection test failed:', error);
            return false;
        }
    }
}
