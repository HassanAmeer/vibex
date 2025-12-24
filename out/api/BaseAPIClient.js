"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseAPIClient = void 0;
class BaseAPIClient {
    constructor(apiKey, baseURL) {
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }
    async makeRequest(endpoint, body, options) {
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
exports.BaseAPIClient = BaseAPIClient;
//# sourceMappingURL=BaseAPIClient.js.map