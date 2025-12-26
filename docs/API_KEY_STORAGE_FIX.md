# API Key Storage Issue - Explanation & Solution

## 🔍 The Problem

When you save API keys in the **web preview** (`npm run web`), they work fine and show a toast. But when you install the extension in VS Code, the saved keys don't appear.

## 📊 Why This Happens

### Web Version (Browser - `npm run web`)
```javascript
// Location: src/webview/index.html (lines 45-46)
const mockApiKeys = JSON.parse(
    localStorage.getItem('vibeall_mock_keys') || '{...}'
);
```

**Storage:** Browser's `localStorage` (temporary, browser-specific)
- ✅ Works in web preview
- ❌ NOT available in VS Code extension
- 🗑️ Cleared when you clear browser data

### VS Code Extension (Installed VSIX)
```typescript
// Location: src/managers/StorageManager.ts (lines 17-21)
async storeAPIKey(provider: string, key: string): Promise<void> {
    const storageKey = `vibeall.apikey.${provider.toLowerCase()}`;
    await this.secretStorage.store(storageKey, key);
}
```

**Storage:** VS Code's `SecretStorage` API (secure, persistent)
- ✅ Encrypted storage
- ✅ Persists across VS Code sessions
- ✅ Secure (uses OS keychain)
- ⚠️ Requires proper message passing

## 🐛 The Root Cause

The issue is in the **message flow** between the webview and the extension:

### Current Flow (BROKEN):
```
User clicks "Save" in Settings
    ↓
Webview sends message to extension
    ↓
Extension receives message
    ↓
StorageManager.storeAPIKey() is called
    ↓
❌ Extension NEVER sends confirmation back to webview
    ↓
❌ Webview doesn't know key was saved
    ↓
❌ When settings panel reopens, it requests keys
    ↓
❌ Extension doesn't send the stored keys back
```

### What SHOULD Happen:
```
User clicks "Save"
    ↓
Webview sends 'saveAPIKey' message
    ↓
Extension saves to SecretStorage
    ↓
✅ Extension sends 'apiKeySaved' confirmation
    ↓
✅ Webview shows toast
    ↓
✅ Webview updates local state
    ↓
When settings reopens:
    ↓
Webview sends 'getAPIKeys' request
    ↓
✅ Extension sends all stored keys
    ↓
✅ Webview displays them
```

## 🔧 The Fix

### 1. Update Extension Message Handler

**File:** `src/extension.ts`

Add these message handlers:

```typescript
case 'getAPIKeys':
    // Send all stored API keys to webview
    const allKeys = await storageManager.getAllAPIKeys();
    const keysMap: any = {};
    allKeys.forEach(k => keysMap[k.provider] = k.key);
    sendMessage({
        type: 'apiKeysLoaded',
        payload: keysMap
    });
    break;

case 'saveAPIKey':
    // Save and confirm
    await storageManager.storeAPIKey(
        message.payload.provider,
        message.payload.key
    );
    sendMessage({
        type: 'apiKeySaved',
        payload: {
            provider: message.payload.provider,
            success: true
        }
    });
    break;

case 'deleteAPIKey':
    // Delete and confirm
    await storageManager.deleteAPIKey(message.payload.provider);
    sendMessage({
        type: 'apiKeyDeleted',
        payload: {
            provider: message.payload.provider,
            success: true
        }
    });
    break;
```

### 2. Update Webview App.tsx

**File:** `src/webview/App.tsx`

Add message handlers:

```typescript
case 'apiKeysLoaded':
    setApiKeys(message.payload);
    break;

case 'apiKeySaved':
    if (message.payload.success) {
        showToast(`API key for ${message.payload.provider} saved!`, 'success');
        // Request fresh keys
        vscode.postMessage({ type: 'getAPIKeys' });
    }
    break;

case 'apiKeyDeleted':
    if (message.payload.success) {
        showToast(`API key for ${message.payload.provider} deleted!`, 'success');
        // Update local state
        setApiKeys(prev => {
            const updated = { ...prev };
            delete updated[message.payload.provider];
            return updated;
        });
    }
    break;
```

### 3. Request Keys on Settings Open

**File:** `src/webview/components/SettingsPanel.tsx`

Add useEffect to load keys:

```typescript
useEffect(() => {
    // Request API keys when settings panel opens
    if (typeof vscode !== 'undefined') {
        vscode.postMessage({ type: 'getAPIKeys' });
    }
}, []);
```

## 📝 Complete Solution Implementation

I'll create the fixes now...

## 🎯 Why Web Version Works

The web version uses a **mock VS Code API** that stores everything in `localStorage`:

```javascript
// Mock storage (web only)
localStorage.setItem('vibeall_mock_keys', JSON.stringify(keys));
```

This is why:
- ✅ Keys persist in browser
- ✅ Toast shows immediately
- ✅ Keys reload on refresh

But this **ONLY works in the browser**, not in the actual VS Code extension!

## 🔐 Security Note

VS Code's `SecretStorage` is much more secure than `localStorage`:

| Feature | localStorage (Web) | SecretStorage (VS Code) |
|---------|-------------------|------------------------|
| Encryption | ❌ Plain text | ✅ Encrypted |
| Persistence | Browser only | OS Keychain |
| Security | Low | High |
| Cross-device | ❌ No | ✅ With Settings Sync |

## ✅ Summary

**Problem:** Extension doesn't send stored keys back to webview
**Solution:** Implement proper message passing for:
1. Loading keys on settings open
2. Confirming saves
3. Confirming deletions

Let me implement these fixes now!
