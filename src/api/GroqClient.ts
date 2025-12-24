import { BaseAPIClient } from './BaseAPIClient';
import { StreamResponse } from '../types';

export class GroqClient extends BaseAPIClient {
    constructor(apiKey: string) {
        super(apiKey, 'https://api.groq.com/openai/v1');
    }

    async sendMessage(
        modelId: string,
        messages: any[]
    ): Promise<StreamResponse> {
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
