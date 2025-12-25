import { BaseAPIClient } from './BaseAPIClient';
import { StreamResponse } from '../types';

export class AnthropicClient extends BaseAPIClient {
    constructor(apiKey: string) {
        super(apiKey, 'https://api.anthropic.com/v1');
    }

    async sendMessage(
        modelId: string,
        messages: any[]
    ): Promise<StreamResponse> {
        // Extract system message if present (Anthropic requires it top-level)
        let systemPrompt = '';
        const anthropicMessages = messages.filter(msg => {
            if (msg.role === 'system') {
                systemPrompt += msg.content + '\n';
                return false;
            }
            return true;
        });

        const body = {
            model: modelId,
            messages: anthropicMessages,
            max_tokens: 8192,
            system: systemPrompt.trim() || undefined
        };

        const response = await fetch(`${this.baseURL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey, // Anthropic uses x-api-key
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();

        return {
            content: data.content[0].text,
            done: true,
            model: data.model,
            tokens: data.usage?.output_tokens
        };
    }
}
