"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleClient = void 0;
const BaseAPIClient_1 = require("./BaseAPIClient");
class GoogleClient extends BaseAPIClient_1.BaseAPIClient {
    constructor(apiKey) {
        super(apiKey, 'https://generativelanguage.googleapis.com/v1beta');
    }
    async sendMessage(modelId, messages) {
        // Convert messages to Gemini format
        const contents = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));
        const response = await fetch(`${this.baseURL}/models/${modelId}:generateContent?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });
        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }
        const data = await response.json();
        return {
            content: data.candidates[0].content.parts[0].text,
            done: true,
            model: modelId,
            tokens: data.usageMetadata?.totalTokenCount
        };
    }
}
exports.GoogleClient = GoogleClient;
//# sourceMappingURL=GoogleClient.js.map