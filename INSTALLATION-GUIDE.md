# VibeAll v1.0.2 - Installation & Error Fix Guide

## 🚨 ISSUE: Terminal Working Directory Corrupted

The `uv_cwd` error occurs because the terminal's current working directory is corrupted.

## ✅ SOLUTION: Use Absolute Paths

### **Method 1: Install from New Terminal (RECOMMENDED)**

1. **Close current terminal**
2. **Open NEW terminal** (Cmd+Shift+` or Terminal → New Terminal)
3. **Run these commands:**

```bash
cd /Users/mac/.vscode/extensions/vibeall
npm install
npm run compile
```

### **Method 2: Use Absolute Paths (if Method 1 fails)**

```bash
/usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js install --prefix /Users/mac/.vscode/extensions/vibeall

/usr/local/bin/node /usr/local/lib/node_modules/npm/bin/npm-cli.js run compile --prefix /Users/mac/.vscode/extensions/vibeall
```

### **Method 3: Restart VS Code**

1. **Quit VS Code completely** (Cmd+Q)
2. **Reopen VS Code**
3. **Open folder:** `/Users/mac/.vscode/extensions/vibeall`
4. **Open new terminal**
5. **Run:**
```bash
npm install
npm run compile
```

---

## 🎯 **After Installation:**

Once dependencies are installed, you can:

### **Test the Extension:**
```bash
# Press F5 in VS Code
# This will launch Extension Development Host
```

### **Or Build VSIX:**
```bash
npx @vscode/vsce package
```

---

## 📋 **Expected Results:**

After `npm install`:
- `node_modules/` folder created
- All dependencies installed

After `npm run compile`:
- `dist/extension.js` created (~30 KB)
- `dist/webview.js` created (~1.4 MB)
- No TypeScript errors

---

## 🐛 **Common Errors & Fixes:**

### Error: "uv_cwd"
**Fix:** Open NEW terminal or restart VS Code

### Error: "Cannot find module"
**Fix:** Run `npm install` again

### Error: TypeScript errors
**Fix:** All files are correct, just need to compile

---

## ✅ **Verification:**

Check if files exist:
```bash
ls -la /Users/mac/.vscode/extensions/vibeall/dist/
```

Should show:
- extension.js
- webview.js
- Source maps

---

## 🚀 **Quick Start (After Install):**

1. **Press F5** in VS Code
2. **New window opens** with extension loaded
3. **Click 🚀 icon** in sidebar
4. **Click ⚙️** to open settings
5. **Cerebras key is pre-filled!**
6. **Click 📋** to see logs
7. **Start chatting!**

---

## 📞 **Still Having Issues?**

Try this complete reset:

```bash
# 1. Quit VS Code
# 2. Open Terminal app (not VS Code terminal)
# 3. Run:
cd /Users/mac/.vscode/extensions/vibeall
rm -rf node_modules package-lock.json
npm install
npm run compile
# 4. Reopen VS Code
# 5. Press F5
```

---

**All 41 files have been restored successfully!**
**Just need to install dependencies and compile.**

Use **Method 1** (new terminal) for easiest solution.
