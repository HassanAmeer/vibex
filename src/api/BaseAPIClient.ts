import { StreamResponse } from '../types';

export abstract class BaseAPIClient {
    protected apiKey: string;
    protected baseURL: string;

    constructor(apiKey: string, baseURL: string) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }

    abstract sendMessage(
        modelId: string,
        messages: any[],
        options?: any
    ): Promise<StreamResponse>;

    protected async makeRequest(
        endpoint: string,
        body: any,
        options?: RequestInit
    ): Promise<Response> {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
                ...options?.headers
            },
            body: JSON.stringify(body),
            ...options
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        return response;
    }
}
