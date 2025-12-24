"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqClient = void 0;
const BaseAPIClient_1 = require("./BaseAPIClient");
class GroqClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey) {
        super(apiKey, 'https://api.groq.com/openai/v1');
    }
    async sendMessage(modelId, messages) {
        const response = await this.makeRequest('/chat/completions', {
            model: modelId,
            messages,
            temperature: 0.7,
            max_tokens: 8192
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
exports.GroqClient = GroqClient;
//# sourceMappingURL=GroqClient.js.map