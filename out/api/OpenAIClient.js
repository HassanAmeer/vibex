"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIClient = void 0;
const BaseAPIClient_1 = require("./BaseAPIClient");
class OpenAIClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey, provider = 'openai') {
        const baseURLs = {
            'openai': 'https://api.openai.com/v1',
            'cerebras': 'https://api.cerebras.ai/v1',
            'deepseek': 'https://api.deepseek.com/v1',
            'sambanova': 'https://api.sambanova.ai/v1'
        };
        super(apiKey, baseURLs[provider] || baseURLs['openai']);
    }
    async sendMessage(modelId, messages) {
        const response = await this.makeRequest('/chat/completions', {
            model: modelId,
            messages,
            temperature: 0.7,
            max_tokens: 4096
        });
        const data = await response.json();
        return {
            content: data.choices[0].message.content,
            done: true,
            model: data.model,
            tokens: data.usage?.total_tokens
        };
    }
}
exports.OpenAIClient = OpenAIClient;
//# sourceMappingURL=OpenAIClient.js.map