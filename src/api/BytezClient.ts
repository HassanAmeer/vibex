import { BaseAPIClient } from './BaseAPIClient';
import { StreamResponse } from '../types';

export class BytezClient extends BaseAPIClient {
    constructor(apiKey: string) {
        super(apiKey, 'https://api.bytez.com/models/v2');
    }

    async sendMessage(
        modelId: string,
        messages: any[]
    ): Promise<StreamResponse> {
        // Determine input format based on model type or just pass messages for LLMs
        // For non-chat models (like stable-diffusion), we might want to extract the last prompt.
        // But for now, let's implement the chat flow primarily.

        let input: any = messages;

        const isEmbedding = modelId.includes('sentence-transformers') ||
            modelId.includes('bge') ||
            modelId.includes('nomic') ||
            modelId.includes('clip') ||
            modelId.includes('siglip');

        const isMedia = modelId.includes('stable') ||
            modelId.includes('whisper') ||
            modelId.includes('bark');

        // Simple heuristic: if modelId implies image generation or embedding, use the last user message text
        if (isEmbedding || isMedia) {
            const lastMsg = messages[messages.length - 1];
            input = lastMsg ? lastMsg.content : '';
        }

        const requestBody: any = { input };

        // Only add params for models that support it (LLMs)
        // Whisper/Bark/Embeddings don't use 'max_tokens' in the same way or error out
        if (!isEmbedding && !modelId.includes('whisper') && !modelId.includes('bark')) {
            requestBody.params = {
                max_tokens: 1024,
                temperature: 0.7
            };
        }

        const response = await this.makeRequest(`/${modelId}`, requestBody);

        const data = await response.json();
        const output = data.output;

        // Handle output format which can vary
        let content = '';
        if (typeof output === 'string') {
            content = output;
        } else if (Array.isArray(output) && output[0] && output[0].content) {
            // Chat output: [{ role: 'assistant', content: '...' }]
            content = output[0].content;
        } else {
            content = JSON.stringify(output);
        }

        return {
            content: content,
            done: true,
            model: modelId,
            tokens: 0 // Usage not strictly returned in standard wrapper
        };
    }

    // Override makeRequest to custom format headers slightly different if needed
    // Client.ts says: Authorization: Key ${apiKey}
    protected async makeRequest(endpoint: string, body: any): Promise<Response> {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Key ${this.apiKey}`
        };

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Request Failed: ${response.status} ${response.statusText} - ${errorText}`);
        }

        return response;
    }
}
