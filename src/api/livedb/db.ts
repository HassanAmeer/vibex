const BASE_URL = 'https://link.thelocalrent.com/api/db';
const AUTH_TOKEN = '37160f2e00721d906831565829ae1de7';
const PROJECT_NAME = 'vibex';
const USERS_COLLECTION = 'users';

const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
};

// User Document Interface
export interface UserDocument {
    id?: string;
    email: string;
    api_keys: {
        [provider: string]: string;  // e.g., { openai: 'sk-xxx', anthropic: 'sk-xxx' }
    };
    request_limit: number;          // Default: 1000
    requests_used: number;          // Tracks usage
    secret_key: string;             // 16-character generated key
    created_at: string;
    updated_at: string;
}

// Generate a 16-character secret key
export const generateSecretKey = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 16; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Login or create user by email
export const loginUserByEmail = async (email: string): Promise<UserDocument | null> => {
    try {
        // First, check if user exists
        const existingUser = await getUserByEmail(email);

        if (existingUser) {
            console.log('[DB] ✅ User found:', email);
            return existingUser;
        }

        // Create new user with default values
        console.log('[DB] Creating new user:', email);
        const newUser: Omit<UserDocument, 'id'> = {
            email,
            api_keys: {},
            request_limit: 1000,
            requests_used: 0,
            secret_key: generateSecretKey(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const response = await fetch(`${BASE_URL}/${PROJECT_NAME}/${USERS_COLLECTION}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(newUser)
        });

        if (!response.ok) {
            console.error('[DB] Failed to create user:', await response.text());
            return null;
        }

        const result = await response.json();
        console.log('[DB] ✅ User created:', email, result);

        // Return the created user
        return await getUserByEmail(email);
    } catch (error) {
        console.error('[DB] Login error:', error);
        return null;
    }
};

// Get user by email
export const getUserByEmail = async (email: string): Promise<UserDocument | null> => {
    try {
        const response = await fetch(`${BASE_URL}/${PROJECT_NAME}/${USERS_COLLECTION}?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            return null;
        }

        const result = await response.json();

        if (result && result.success && result.data && result.data.length > 0) {
            return result.data[0] as UserDocument;
        }

        return null;
    } catch (error) {
        console.error('[DB] Get user error:', error);
        return null;
    }
};

// Update user's API keys
export const updateUserAPIKeys = async (
    email: string,
    apiKeys: { [provider: string]: string }
): Promise<UserDocument | null> => {
    try {
        const user = await getUserByEmail(email);

        if (!user || !user.id) {
            console.error('[DB] User not found:', email);
            return null;
        }

        // Merge existing and new API keys
        const updatedApiKeys = { ...user.api_keys, ...apiKeys };

        const response = await fetch(`${BASE_URL}/${PROJECT_NAME}/${USERS_COLLECTION}/${user.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                ...user,
                api_keys: updatedApiKeys,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('[DB] Failed to update API keys:', await response.text());
            return null;
        }

        console.log('[DB] ✅ API keys updated for:', email);
        return await getUserByEmail(email);
    } catch (error) {
        console.error('[DB] Update API keys error:', error);
        return null;
    }
};

// Increment request usage
export const incrementUserRequests = async (email: string, count: number = 1): Promise<UserDocument | null> => {
    try {
        const user = await getUserByEmail(email);

        if (!user || !user.id) {
            console.error('[DB] User not found:', email);
            return null;
        }

        const newUsage = (user.requests_used || 0) + count;

        const response = await fetch(`${BASE_URL}/${PROJECT_NAME}/${USERS_COLLECTION}/${user.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                ...user,
                requests_used: newUsage,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('[DB] Failed to update request count:', await response.text());
            return null;
        }

        console.log('[DB] ✅ Request usage updated:', email, `${newUsage}/${user.request_limit}`);
        return await getUserByEmail(email);
    } catch (error) {
        console.error('[DB] Increment requests error:', error);
        return null;
    }
};

// Check if user has remaining requests
export const checkRequestLimit = async (email: string): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> => {
    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return { allowed: false, used: 0, limit: 0, remaining: 0 };
        }

        const used = user.requests_used || 0;
        const limit = user.request_limit || 1000;
        const remaining = Math.max(0, limit - used);

        return {
            allowed: used < limit,
            used,
            limit,
            remaining
        };
    } catch (error) {
        console.error('[DB] Check limit error:', error);
        return { allowed: false, used: 0, limit: 0, remaining: 0 };
    }
};

// Get user usage stats
export const getUserUsageStats = async (email: string): Promise<{
    requestsUsed: number;
    requestLimit: number;
    remainingRequests: number;
    usagePercentage: number;
    secretKey: string;
    apiKeysConfigured: string[];
} | null> => {
    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return null;
        }

        const used = user.requests_used || 0;
        const limit = user.request_limit || 1000;

        return {
            requestsUsed: used,
            requestLimit: limit,
            remainingRequests: Math.max(0, limit - used),
            usagePercentage: Math.round((used / limit) * 100),
            secretKey: user.secret_key,
            apiKeysConfigured: Object.keys(user.api_keys || {})
        };
    } catch (error) {
        console.error('[DB] Get usage stats error:', error);
        return null;
    }
};

// Regenerate secret key
export const regenerateSecretKey = async (email: string): Promise<string | null> => {
    try {
        const user = await getUserByEmail(email);

        if (!user || !user.id) {
            console.error('[DB] User not found:', email);
            return null;
        }

        const newSecretKey = generateSecretKey();

        const response = await fetch(`${BASE_URL}/${PROJECT_NAME}/${USERS_COLLECTION}/${user.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                ...user,
                secret_key: newSecretKey,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('[DB] Failed to regenerate secret key:', await response.text());
            return null;
        }

        console.log('[DB] ✅ Secret key regenerated for:', email);
        return newSecretKey;
    } catch (error) {
        console.error('[DB] Regenerate secret key error:', error);
        return null;
    }
};

// Update user request limit (admin function)
export const updateUserRequestLimit = async (email: string, newLimit: number): Promise<UserDocument | null> => {
    try {
        const user = await getUserByEmail(email);

        if (!user || !user.id) {
            console.error('[DB] User not found:', email);
            return null;
        }

        const response = await fetch(`${BASE_URL}/${PROJECT_NAME}/${USERS_COLLECTION}/${user.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                ...user,
                request_limit: newLimit,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('[DB] Failed to update request limit:', await response.text());
            return null;
        }

        console.log('[DB] ✅ Request limit updated for:', email, 'New limit:', newLimit);
        return await getUserByEmail(email);
    } catch (error) {
        console.error('[DB] Update request limit error:', error);
        return null;
    }
};

// Reset user request usage (admin function)
export const resetUserRequestUsage = async (email: string): Promise<UserDocument | null> => {
    try {
        const user = await getUserByEmail(email);

        if (!user || !user.id) {
            console.error('[DB] User not found:', email);
            return null;
        }

        const response = await fetch(`${BASE_URL}/${PROJECT_NAME}/${USERS_COLLECTION}/${user.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                ...user,
                requests_used: 0,
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            console.error('[DB] Failed to reset request usage:', await response.text());
            return null;
        }

        console.log('[DB] ✅ Request usage reset for:', email);
        return await getUserByEmail(email);
    } catch (error) {
        console.error('[DB] Reset usage error:', error);
        return null;
    }
};

export const getProjects = async () => {
    const response = await fetch(`${BASE_URL}/projects`, {
        method: 'GET',
        headers
    });
    return response.json();
};

export const createProject = async (name: string, description: string) => {
    const response = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ name, description })
    });
    return response.json();
};

export const getCollections = async (projectName: string) => {
    const response = await fetch(`${BASE_URL}/${projectName}`, {
        method: 'GET',
        headers
    });
    return response.json();
};

// export const createCollection = async (projectName: string, collectionName: string) => {
//   const response = await fetch(`${BASE_URL}/${projectName}`, {
//     method: 'POST',
//     headers,
//     body: JSON.stringify({ Collection: collectionName })
//   });
//   return response.json();
// };

export const createDocument = async (projectName: string, collectionName: string, data: any) => {
    const response = await fetch(`${BASE_URL}/${projectName}/${collectionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });
    return response.json();
};

export const updateDocument = async (projectName: string, collectionName: string, id: string | number, data: any) => {
    const response = await fetch(`${BASE_URL}/${projectName}/${collectionName}/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
    });
    return response.json();
};

export const deleteDocument = async (projectName: string, collectionName: string, id: string | number) => {
    const response = await fetch(`${BASE_URL}/${projectName}/${collectionName}/${id}`, {
        method: 'DELETE',
        headers
    });
    return response.json();
};