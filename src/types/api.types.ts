/**
 * API-related type definitions
 * @module types/api.types
 */

/**
 * Base API request configuration
 */
export interface APIRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
}

/**
 * Base API response
 */
export interface APIResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
    error?: APIError;
}

/**
 * API error details
 */
export interface APIError {
    code: string;
    message: string;
    details?: any;
    statusCode?: number;
}

/**
 * Chat completion request
 */
export interface ChatCompletionRequest {
    model: string;
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
    reasoning?: ReasoningConfig;
}

/**
 * Reasoning configuration for advanced models
 */
export interface ReasoningConfig {
    enabled: boolean;
    budget?: number;
}

/**
 * Chat message for API
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Chat completion response
 */
export interface ChatCompletionResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: CompletionChoice[];
    usage?: TokenUsage;
}

/**
 * Completion choice
 */
export interface CompletionChoice {
    index: number;
    message: ChatMessage;
    finish_reason: string;
    reasoning_details?: any;
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

/**
 * Streaming chunk
 */
export interface StreamChunk {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: StreamChoice[];
}

/**
 * Streaming choice
 */
export interface StreamChoice {
    index: number;
    delta: {
        role?: string;
        content?: string;
    };
    finish_reason: string | null;
}

/**
 * API client interface
 */
export interface IAPIClient {
    /**
     * Send a chat completion request
     */
    sendMessage(modelId: string, messages: ChatMessage[]): Promise<ChatCompletionResponse>;

    /**
     * Stream a chat completion
     */
    streamMessage?(modelId: string, messages: ChatMessage[]): AsyncGenerator<StreamChunk>;

    /**
     * Check if the client is properly configured
     */
    isConfigured(): boolean;

    /**
     * Get available models
     */
    getModels?(): Promise<string[]>;
}

/**
 * Rate limiter configuration
 */
export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    retryAfter?: number;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
    remaining: number;
    reset: number;
    limit: number;
}

/**
 * Authentication credentials
 */
export interface AuthCredentials {
    type: 'bearer' | 'api-key' | 'oauth';
    value: string;
    expiresAt?: number;
}

/**
 * Request retry configuration
 */
export interface RetryConfig {
    maxRetries: number;
    backoffMs: number;
    retryableErrors: string[];
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
    event: string;
    data: any;
    timestamp: number;
    signature?: string;
}
