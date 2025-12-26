# 🔑 API Key Setup Guide

## Error: "User not found" (401 Unauthorized)

This means you need to add an API key for the AI provider you're using.

---

## ✅ Quick Fix (5 minutes)

### Step 1: Get a FREE API Key

**Recommended: Groq (Fastest & Free)**
1. Go to: https://console.groq.com/
2. Sign up (free)
3. Click "API Keys"
4. Create new key
5. Copy it

**Alternative: Cerebras (Ultra Fast)**
1. Go to: https://cloud.cerebras.ai/
2. Sign up (free)
3. Get API key

**Alternative: Google Gemini**
1. Go to: https://aistudio.google.com/
2. Get API key (free tier)

---

### Step 2: Add API Key to VibeAll

#### Method 1: Via Extension UI
1. Open VibeAll chat panel
2. Click ⚙️ **Settings** icon
3. Find your provider (e.g., "Groq")
4. Click 👁️ to show input field
5. Paste your API key
6. Click 💾 **Save**

#### Method 2: Via VS Code Settings
1. Press `Cmd+Shift+P`
2. Type "VibeAll: Open Settings"
3. Add your API key

---

### Step 3: Select Model

1. In VibeAll chat
2. Click the model selector (bottom of input)
3. Choose provider (e.g., Groq)
4. Choose model (e.g., Llama 3.3 70B)

---

## 🎯 Recommended Free Models

### For Autocomplete (Speed is key)
- **Groq**: `llama-3.3-70b-versatile` (Very fast!)
- **Cerebras**: `llama3.1-8b` (Ultra fast!)

### For Chat (Quality is key)
- **Groq**: `llama-3.3-70b-versatile`
- **Google**: `gemini-1.5-flash`
- **Anthropic**: `claude-3-5-sonnet` (Best quality, paid)

---

## 🔧 Troubleshooting

### Still getting 401 error?
1. **Check API key is saved**:
   - Open Settings
   - Verify key is visible (click 👁️)
   - Re-save if needed

2. **Check API key is valid**:
   - Go to provider's website
   - Verify key is active
   - Check usage limits

3. **Try different provider**:
   - If OpenRouter fails, try Groq
   - If Groq fails, try Cerebras

### "No API key found" error?
- Make sure you clicked **Save** after pasting
- Try reloading VS Code window (`Cmd+R`)

---

## 📊 Free Tier Limits

| Provider | Free Tier | Speed | Quality |
|----------|-----------|-------|---------|
| **Groq** | 14,400 req/day | ⚡⚡⚡ | ⭐⭐⭐⭐ |
| **Cerebras** | Unlimited beta | ⚡⚡⚡⚡ | ⭐⭐⭐ |
| **Google** | 1,500 req/day | ⚡⚡ | ⭐⭐⭐⭐ |
| **OpenRouter** | Varies | ⚡⚡ | ⭐⭐⭐⭐ |

---

## ✅ Verification

After adding API key:

1. **Test Chat**:
   - Type: "Hello"
   - Should get response

2. **Test Autocomplete**:
   - Open a .ts file
   - Start typing
   - Should see suggestions

3. **Test @-Mentions**:
   - Type: `@src/extension.ts`
   - Should include file

4. **Test Slash Commands**:
   - Select code
   - Type: `/explain`
   - Should explain code

---

## 🎉 You're All Set!

Once you add an API key, all features will work:
- ✅ Autocomplete
- ✅ Chat
- ✅ @-Mentions
- ✅ Slash Commands

**Enjoy your AI Code Agent! 🚀**
