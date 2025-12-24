"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelClient = void 0;
const GroqClient_1 = require("./GroqClient");
const GoogleClient_1 = require("./GoogleClient");
const OpenAIClient_1 = require("./OpenAIClient");
class ModelClient {
    constructor() {
        this.clients = new Map();
        // Clients will be initialized when API keys are provided
    }
    setAPIKey(provider, apiKey) {
        const normalizedProvider = provider.toLowerCase();
        switch (normalizedProvider) {
            case 'groq':
                this.clients.set('groq', new GroqClient_1.GroqClient(apiKey));
                break;
            case 'google':
                this.clients.set('google', new GoogleClient_1.GoogleClient(apiKey));
                break;
            case 'openai':
            case 'cerebras':
            case 'deepseek':
            case 'sambanova':
            case 'anthropic':
                this.clients.set(normalizedProvider, new OpenAIClient_1.OpenAIClient(apiKey, normalizedProvider));
                break;
        }
    }
    async sendMessage(config, messages) {
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
    hasClient(provider) {
        return this.clients.has(provider.toLowerCase());
    }
    getAvailableProviders() {
        return Array.from(this.clients.keys());
    }
}
exports.ModelClient = ModelClient;
//# sourceMappingURL=ModelClient.js.map