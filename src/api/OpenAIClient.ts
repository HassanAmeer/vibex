import { BaseAPIClient } from './BaseAPIClient';
import { StreamResponse } from '../types';

export class OpenAIClient extends BaseAPIClient {
    constructor(apiKey: string, provider: string = 'openai') {
        const baseURLs: { [key: string]: string } = {
            'openai': 'https://api.openai.com/v1',
            'cerebras': 'https://api.cerebras.ai/v1',
            'deepseek': 'https://api.deepseek.com/v1',
            'sambanova': 'https://api.sambanova.ai/v1'
        };
        super(apiKey, baseURLs[provider] || baseURLs['openai']);
    }

    async sendMessage(
        modelId: string,
        messages: any[]
    ): Promise<StreamResponse> {
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
