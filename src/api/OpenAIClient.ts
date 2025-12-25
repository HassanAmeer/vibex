import { BaseAPIClient } from './BaseAPIClient';
import { StreamResponse } from '../types';

export class OpenAIClient extends BaseAPIClient {
    private provider: string;

    constructor(apiKey: string, provider: string = 'openai') {
        const baseURLs: { [key: string]: string } = {
            'openai': 'https://api.openai.com/v1',
            'cerebras': 'https://api.cerebras.ai/v1',
            'deepseek': 'https://api.deepseek.com/v1',
            'sambanova': 'https://api.sambanova.ai/v1',
            'xai': 'https://api.x.ai/v1',
            'novita': 'https://api.novita.ai/openai',
            'aimlapi': 'https://api.aimlapi.com/v1',
            'openrouter': 'https://openrouter.ai/api/v1'
        };
        super(apiKey, baseURLs[provider] || baseURLs['openai']);
        this.provider = provider;
    }

    async sendMessage(
        modelId: string,
        messages: any[]
    ): Promise<StreamResponse> {
        const payload: any = {
            model: modelId,
            messages,
            temperature: 0.7,
            max_tokens: modelId === 'kat-coder' ? 1000 : 4096
        };

        // Enable reasoning for OpenRouter thinking models
        if (this.provider === 'openrouter' && (modelId.includes('think') || modelId.includes('reason'))) {
            payload.reasoning = { enabled: true };
        }

        const response = await this.makeRequest('/chat/completions', payload);

        const data = await response.json();

        return {
            content: data.choices[0].message.content,
            done: true,
            model: data.model,
            tokens: data.usage?.total_tokens,
            reasoning_details: data.choices[0].message.reasoning_details
        };
    }
}
