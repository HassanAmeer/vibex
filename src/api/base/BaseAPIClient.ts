/**
 * Base API Client
 * Provides common functionality for all API clients
 * @module api/base/BaseAPIClient
 */

import { IAPIClient, APIRequest, APIResponse, APIError, AuthCredentials } from '../../types/api.types';

/**
 * Abstract base class for API clients
 */
export abstract class BaseAPIClient implements IAPIClient {
    protected apiKey: string;
    protected baseURL: string;
    protected timeout: number = 30000;
    protected headers: Record<string, string> = {};

    constructor(apiKey: string, baseURL: string) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
        this.initializeHeaders();
    }

    /**
     * Initialize default headers
     */
    protected initializeHeaders(): void {
        this.headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
        };
    }

    /**
     * Get authentication headers
     * Override this in subclasses for custom auth
     */
    protected getAuthHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.apiKey}`
        };
    }

    /**
     * Make an HTTP request
     */
    protected async makeRequest<T = any>(
        endpoint: string,
        options: Partial<APIRequest> = {}
    ): Promise<APIResponse<T>> {
        const url = `${this.baseURL}${endpoint}`;
        const config: RequestInit = {
            method: options.method || 'POST',
            headers: {
                ...this.headers,
                ...options.headers
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: AbortSignal.timeout(this.timeout)
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw this.createError(response.status, data);
            }

            return {
                data,
                status: response.status,
                headers: this.parseHeaders(response.headers)
            };
        } catch (error: any) {
            if (error.name === 'AbortError') {
                throw this.createError(408, { message: 'Request timeout' });
            }
            throw error;
        }
    }

    /**
     * Create a standardized error
     */
    protected createError(statusCode: number, data: any): APIError {
        return {
            code: `HTTP_${statusCode}`,
            message: data.error?.message || data.message || 'Unknown error',
            details: data,
            statusCode
        };
    }

    /**
     * Parse response headers
     */
    protected parseHeaders(headers: Headers): Record<string, string> {
        const result: Record<string, string> = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    /**
     * Check if client is properly configured
     */
    public isConfigured(): boolean {
        return Boolean(this.apiKey && this.baseURL);
    }

    /**
     * Set timeout for requests
     */
    public setTimeout(ms: number): void {
        this.timeout = ms;
    }

    /**
     * Add custom header
     */
    public addHeader(key: string, value: string): void {
        this.headers[key] = value;
    }

    /**
     * Abstract method to send message
     * Must be implemented by subclasses
     */
    abstract sendMessage(modelId: string, messages: any[]): Promise<any>;
}
