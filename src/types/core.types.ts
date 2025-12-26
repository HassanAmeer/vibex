/**
 * Core type definitions for the VibeAll extension
 * @module types/core.types
 */

/**
 * Represents a chat message in the conversation
 */
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
    model?: string;
    tokens?: number;
    attachments?: Attachment[];
    reasoning_details?: any;
}

/**
 * File attachment for messages
 */
export interface Attachment {
    type: 'file' | 'image' | 'code';
    name: string;
    content: string;
    language?: string;
}

/**
 * Extension settings configuration
 */
export interface ExtensionSettings {
    autoRunCommands: boolean;
    autoApplyEdits: boolean;
    showMiniDashboard: boolean;
    compactMode: boolean;
    alwaysShowPlan: boolean;
    planMode: boolean;
    theme: ThemeSettings;
}

/**
 * Theme configuration
 */
export interface ThemeSettings {
    primaryColor: string;
    accentColor: string;
    mode: 'dark' | 'light';
}

/**
 * Usage statistics per provider
 */
export interface UsageStats {
    [provider: string]: ProviderStats;
}

/**
 * Statistics for a single provider
 */
export interface ProviderStats {
    requests: number;
    tokens: number;
    lastUsed: number;
}

/**
 * Model information
 */
export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    contextWindow: number;
    maxTokens: number;
    features: string[];
    freeTier?: FreeTierInfo;
    pricing?: {
        prompt?: number;
        completion?: number;
        input?: number;
        output?: number;
    };
}

/**
 * Free tier information
 */
export interface FreeTierInfo {
    limit: string;
    resetPeriod: string;
}

/**
 * AI model response
 */
export interface StreamResponse {
    content: string;
    done: boolean;
    model?: string;
    tokens?: number;
    usage?: TokenUsage;
    reasoning_details?: any;
}

/**
 * Token usage information
 */
export interface TokenUsage {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
}

/**
 * Log entry for debugging
 */
export interface LogEntry {
    id: string;
    timestamp: number;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    details?: any;
}

/**
 * File system operation result
 */
export interface FileOperationResult {
    success: boolean;
    path: string;
    message?: string;
    error?: string;
}

/**
 * Tool execution status
 */
export interface ToolStatus {
    isRunning: boolean;
    tools: ToolInfo[];
}

/**
 * Individual tool information
 */
export interface ToolInfo {
    id: number;
    name: string;
    args: any;
    status: 'pending' | 'running' | 'completed' | 'error';
}

/**
 * Code analysis result
 */
export interface CodeAnalysisResult {
    file: string;
    language: string;
    metrics: CodeMetrics;
    issues: CodeIssue[];
    securityIssues: SecurityIssue[];
    suggestions: string[];
}

/**
 * Code quality metrics
 */
export interface CodeMetrics {
    lines: number;
    complexity: number;
    maintainability: number;
    functions?: number;
    classes?: number;
}

/**
 * Code issue detected during analysis
 */
export interface CodeIssue {
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
    column?: number;
    rule?: string;
}

/**
 * Security vulnerability
 */
export interface SecurityIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    type: string;
    line?: number;
    recommendation?: string;
}

/**
 * Project template definition
 */
export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    category: 'web' | 'api' | 'mobile' | 'desktop' | 'other';
    files: TemplateFile[];
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
}

/**
 * Template file definition
 */
export interface TemplateFile {
    path: string;
    content: string | (() => string);
    encoding?: 'utf8' | 'binary';
}

/**
 * API provider configuration
 */
export interface ProviderConfig {
    id: string;
    name: string;
    baseURL: string;
    requiresAuth: boolean;
    supportsStreaming: boolean;
    models: ModelInfo[];
}

/**
 * Error with additional context
 */
export interface ExtensionError extends Error {
    code?: string;
    context?: any;
    timestamp: number;
}

/**
 * Event emitted by the extension
 */
export interface ExtensionEvent<T = any> {
    type: string;
    payload: T;
    timestamp: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Cache entry
 */
export interface CacheEntry<T> {
    key: string;
    value: T;
    timestamp: number;
    ttl: number;
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    operation: string;
    duration: number;
    timestamp: number;
    metadata?: any;
}
