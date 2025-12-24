// Core type definitions for VibeAll extension

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    model?: string;
    tokens?: number;
    attachments?: any[];
}

export interface ExtensionSettings {
    autoRunCommands: boolean;
    autoApplyEdits: boolean;
    showMiniDashboard: boolean;
    compactMode: boolean;
    alwaysShowPlan: boolean;
    planMode: boolean;
    theme: {
        primaryColor: string;
        accentColor: string;
        mode: 'light' | 'dark';
    };
}

export interface UsageStats {
    [provider: string]: {
        requests: number;
        tokens: number;
        lastUsed: number;
    };
}

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    contextWindow: number;
    maxTokens: number;
    pricing?: {
        input: number;
        output: number;
    };
    features: string[];
    freeTier?: {
        limit: string;
        resetPeriod: string;
    };
}

export interface APIKey {
    provider: string;
    key: string;
    isValid: boolean;
}

export interface ProviderConfig {
    name: string;
    baseURL: string;
    models: ModelInfo[];
    requiresAuth: boolean;
}

export interface StreamResponse {
    content: string;
    done: boolean;
    model?: string;
    tokens?: number;
}

export interface ErrorResponse {
    error: string;
    code?: string;
    provider?: string;
}

export interface ContextFile {
    path: string;
    content: string;
    language: string;
}

export interface DiagnosticInfo {
    file: string;
    line: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
}
