"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_REGISTRY = void 0;
exports.getModelById = getModelById;
exports.getProviderModels = getProviderModels;
exports.MODEL_REGISTRY = {
    groq: [
        {
            id: 'llama-3.3-70b-versatile',
            name: 'Llama 3.3 70B',
            provider: 'groq',
            contextWindow: 128000,
            maxTokens: 32768,
            features: ['fast', 'versatile', 'reasoning'],
            freeTier: {
                limit: '14,400 requests/day',
                resetPeriod: 'daily'
            }
        },
        {
            id: 'llama-3.1-8b-instant',
            name: 'Llama 3.1 8B Instant',
            provider: 'groq',
            contextWindow: 128000,
            maxTokens: 8192,
            features: ['ultra-fast', 'instant'],
            freeTier: {
                limit: '30 requests/min',
                resetPeriod: 'minute'
            }
        }
    ],
    google: [
        {
            id: 'gemini-2.0-flash-exp',
            name: 'Gemini 2.0 Flash',
            provider: 'google',
            contextWindow: 1000000,
            maxTokens: 8192,
            features: ['multimodal', 'fast', 'experimental'],
            freeTier: {
                limit: '1500 requests/day',
                resetPeriod: 'daily'
            }
        },
        {
            id: 'gemini-1.5-flash',
            name: 'Gemini 1.5 Flash',
            provider: 'google',
            contextWindow: 1000000,
            maxTokens: 8192,
            features: ['multimodal', 'fast'],
            freeTier: {
                limit: '1500 requests/day',
                resetPeriod: 'daily'
            }
        }
    ],
    cerebras: [
        {
            id: 'llama3.1-8b',
            name: 'Llama 3.1 8B',
            provider: 'cerebras',
            contextWindow: 8192,
            maxTokens: 8192,
            features: ['ultra-fast', 'efficient'],
            freeTier: {
                limit: 'Unlimited (rate limited)',
                resetPeriod: 'none'
            }
        },
        {
            id: 'llama3.1-70b',
            name: 'Llama 3.1 70B',
            provider: 'cerebras',
            contextWindow: 8192,
            maxTokens: 8192,
            features: ['powerful', 'fast'],
            freeTier: {
                limit: 'Unlimited (rate limited)',
                resetPeriod: 'none'
            }
        }
    ],
    sambanova: [
        {
            id: 'Meta-Llama-3.1-8B-Instruct',
            name: 'Llama 3.1 8B',
            provider: 'sambanova',
            contextWindow: 8192,
            maxTokens: 8192,
            features: ['fast', 'efficient'],
            freeTier: {
                limit: 'Generous free tier',
                resetPeriod: 'monthly'
            }
        },
        {
            id: 'Meta-Llama-3.1-70B-Instruct',
            name: 'Llama 3.1 70B',
            provider: 'sambanova',
            contextWindow: 8192,
            maxTokens: 8192,
            features: ['powerful', 'accurate'],
            freeTier: {
                limit: 'Generous free tier',
                resetPeriod: 'monthly'
            }
        }
    ],
    openai: [
        {
            id: 'gpt-4o-mini',
            name: 'GPT-4o Mini',
            provider: 'openai',
            contextWindow: 128000,
            maxTokens: 16384,
            features: ['fast', 'affordable', 'multimodal'],
            pricing: {
                input: 0.00015,
                output: 0.0006
            }
        },
        {
            id: 'gpt-4o',
            name: 'GPT-4o',
            provider: 'openai',
            contextWindow: 128000,
            maxTokens: 16384,
            features: ['powerful', 'multimodal', 'latest'],
            pricing: {
                input: 0.0025,
                output: 0.01
            }
        }
    ],
    anthropic: [
        {
            id: 'claude-3-5-sonnet-20241022',
            name: 'Claude 3.5 Sonnet',
            provider: 'anthropic',
            contextWindow: 200000,
            maxTokens: 8192,
            features: ['powerful', 'reasoning', 'coding'],
            pricing: {
                input: 0.003,
                output: 0.015
            }
        },
        {
            id: 'claude-3-5-haiku-20241022',
            name: 'Claude 3.5 Haiku',
            provider: 'anthropic',
            contextWindow: 200000,
            maxTokens: 8192,
            features: ['fast', 'affordable'],
            pricing: {
                input: 0.0008,
                output: 0.004
            }
        }
    ]
};
function getModelById(modelId) {
    for (const provider in exports.MODEL_REGISTRY) {
        const model = exports.MODEL_REGISTRY[provider].find(m => m.id === modelId);
        if (model) {
            return model;
        }
    }
    return undefined;
}
function getProviderModels(provider) {
    return exports.MODEL_REGISTRY[provider] || [];
}
//# sourceMappingURL=models.js.map