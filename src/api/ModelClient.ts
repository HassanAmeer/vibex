import { GroqClient } from './GroqClient';
import { GoogleClient } from './GoogleClient';
import { OpenAIClient } from './OpenAIClient';
import { AnthropicClient } from './AnthropicClient';
import { BytezClient } from './BytezClient';
import { BaseAPIClient } from './BaseAPIClient';

export interface ModelConfig {
    provider: string;
    modelId: string;
    apiKey?: string;
}

export class ModelClient {
    private clients: Map<string, BaseAPIClient> = new Map();

    constructor() {
        // Clients will be initialized when API keys are provided
    }

    setAPIKey(provider: string, apiKey: string): void {
        const normalizedProvider = provider.toLowerCase();
        switch (normalizedProvider) {
            case 'groq':
                this.clients.set('groq', new GroqClient(apiKey));
                break;
            case 'google':
                this.clients.set('google', new GoogleClient(apiKey));
                break;
            case 'anthropic':
                this.clients.set('anthropic', new AnthropicClient(apiKey));
                break;
            case 'openai':
            case 'cerebras':
            case 'deepseek':
            case 'sambanova':
            case 'xai':
            case 'novita':
            case 'aimlapi':
                this.clients.set(normalizedProvider, new OpenAIClient(apiKey, normalizedProvider));
                break;
            case 'bytez':
                this.clients.set('bytez', new BytezClient(apiKey));
                break;
        }
    }

    async sendMessage(config: ModelConfig, messages: any[]): Promise<any> {
        const { provider, modelId, apiKey } = config;

        // Set API key if provided
        if (apiKey) {
            this.setAPIKey(provider, apiKey);
        }

        const client = this.clients.get(provider.toLowerCase());
        if (!client) {
            throw new Error(`No API key configured for provider: ${provider}`);
        }

        return await client.sendMessage(modelId, messages);
    }

    hasClient(provider: string): boolean {
        return this.clients.has(provider.toLowerCase());
    }

    getAvailableProviders(): string[] {
        return Array.from(this.clients.keys());
    }
}
