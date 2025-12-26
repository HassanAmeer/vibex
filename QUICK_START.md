# VibeAll - Quick Start Guide

## 🚀 Build Augment-Style AI Code Agent

This guide helps you add intelligent autocomplete and codebase awareness to your existing VibeAll extension.

---

## Step 1: Install Dependencies

```bash
cd /Users/mac/Documents/react/vibex

npm install tree-sitter tree-sitter-typescript tree-sitter-javascript
```

---

## Step 2: Create Codebase Indexer

Create `src/indexing/CodebaseIndexer.ts`:

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';
import JavaScript from 'tree-sitter-javascript';

interface CodeChunk {
  content: string;
  filePath: string;
  type: string;
  startLine: number;
}

export class CodebaseIndexer {
  private parser: Parser;
  private index: Map<string, CodeChunk[]> = new Map();

  constructor() {
    this.parser = new Parser();
  }

  async initialize(workspacePath: string) {
    const files = await vscode.workspace.findFiles(
      '**/*.{ts,tsx,js,jsx}',
      '**/node_modules/**'
    );

    for (const file of files) {
      await this.indexFile(file.fsPath);
    }

    this.setupWatchers(workspacePath);
    console.log(`✅ Indexed ${files.length} files`);
  }

  async indexFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const language = filePath.match(/\.tsx?$/) 
        ? TypeScript.typescript 
        : JavaScript;
      
      this.parser.setLanguage(language);
      const tree = this.parser.parse(content);
      const chunks = this.extractChunks(tree, content, filePath);
      this.index.set(filePath, chunks);
    } catch (error) {
      console.error(`Failed to index ${filePath}:`, error);
    }
  }

  private extractChunks(tree: Parser.Tree, text: string, filePath: string): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const cursor = tree.walk();

    const visit = () => {
      const node = cursor.currentNode;
      if (['function_declaration', 'class_declaration', 'method_definition'].includes(node.type)) {
        chunks.push({
          content: text.slice(node.startIndex, node.endIndex),
          filePath,
          type: node.type,
          startLine: node.startPosition.row
        });
      }
      if (cursor.gotoFirstChild()) {
        do { visit(); } while (cursor.gotoNextSibling());
        cursor.gotoParent();
      }
    };

    visit();
    return chunks;
  }

  search(query: string, limit: number = 5): CodeChunk[] {
    const results: CodeChunk[] = [];
    for (const chunks of this.index.values()) {
      for (const chunk of chunks) {
        if (chunk.content.toLowerCase().includes(query.toLowerCase())) {
          results.push(chunk);
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }

  private setupWatchers(workspacePath: string) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(workspacePath, '**/*.{ts,tsx,js,jsx}')
    );
    watcher.onDidChange(uri => this.indexFile(uri.fsPath));
    watcher.onDidCreate(uri => this.indexFile(uri.fsPath));
    watcher.onDidDelete(uri => this.index.delete(uri.fsPath));
  }
}
```

---

## Step 3: Create Autocomplete Provider

Create `src/autocomplete/InlineCompletionProvider.ts`:

```typescript
import * as vscode from 'vscode';
import { ModelClient } from '../api/ModelClient';
import { CodebaseIndexer } from '../indexing/CodebaseIndexer';

export class AIInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  private modelClient: ModelClient;
  private indexer: CodebaseIndexer;
  private debounceTimer?: NodeJS.Timeout;

  constructor(modelClient: ModelClient, indexer: CodebaseIndexer) {
    this.modelClient = modelClient;
    this.indexer = indexer;
  }

  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.InlineCompletionItem[] | undefined> {
    
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        try {
          const codeBefore = document.getText(
            new vscode.Range(
              new vscode.Position(Math.max(0, position.line - 20), 0),
              position
            )
          );

          const relevantCode = this.indexer.search(codeBefore.slice(-100));

          const prompt = `Complete this code:

${relevantCode.map(c => c.content).join('\n\n')}

Current:
${codeBefore}

Output only the completion:`;

          const response = await this.modelClient.sendMessage(
            { provider: 'groq', modelId: 'llama-3.3-70b-versatile' },
            [{ role: 'user', content: prompt }]
          );

          const completion = response.content.trim();
          
          if (completion) {
            resolve([new vscode.InlineCompletionItem(completion)]);
          } else {
            resolve(undefined);
          }
        } catch (error) {
          console.error('Autocomplete error:', error);
          resolve(undefined);
        }
      }, 300);
    });
  }
}
```

---

## Step 4: Update extension.ts

Add to your `src/extension.ts`:

```typescript
import { CodebaseIndexer } from './indexing/CodebaseIndexer';
import { AIInlineCompletionProvider } from './autocomplete/InlineCompletionProvider';

// Inside activate function:
let indexer: CodebaseIndexer | undefined;

// Initialize indexer
const workspaceFolders = vscode.workspace.workspaceFolders;
if (workspaceFolders && workspaceFolders.length > 0) {
  indexer = new CodebaseIndexer();
  
  vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Indexing codebase...',
  }, async () => {
    await indexer!.initialize(workspaceFolders[0].uri.fsPath);
  });

  // Register autocomplete
  const completionProvider = new AIInlineCompletionProvider(modelClient, indexer);
  context.subscriptions.push(
    vscode.languages.registerInlineCompletionItemProvider(
      { pattern: '**' },
      completionProvider
    )
  );
}
```

---

## Step 5: Add @-Mentions to Chat

Update your chat handler to support @-mentions:

```typescript
// In your chat message handler
function parseMentions(text: string): string[] {
  const regex = /@([\w\/\.\-]+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}

async function handleMessage(message: string) {
  const mentions = parseMentions(message);
  
  let context = '';
  for (const mention of mentions) {
    try {
      const uri = vscode.Uri.file(mention);
      const content = await vscode.workspace.fs.readFile(uri);
      context += `\n\n// File: ${mention}\n${Buffer.from(content).toString('utf8')}`;
    } catch (error) {
      console.error(`Failed to read ${mention}:`, error);
    }
  }
  
  const enrichedMessage = context + '\n\n' + message;
  // Send to AI...
}
```

---

## Step 6: Add Slash Commands

```typescript
async function handleSlashCommand(command: string, code: string) {
  const prompts = {
    '/fix': 'Fix any errors in this code:\n',
    '/explain': 'Explain what this code does:\n',
    '/test': 'Generate unit tests for this code:\n',
    '/refactor': 'Refactor this code for better quality:\n',
    '/docs': 'Add JSDoc documentation to this code:\n'
  };

  const prompt = prompts[command as keyof typeof prompts];
  if (!prompt) return null;

  const response = await modelClient.sendMessage(
    { provider: 'groq', modelId: 'llama-3.3-70b-versatile' },
    [{ role: 'user', content: prompt + code }]
  );

  return response.content;
}

// In message handler
const slashMatch = message.match(/^\/(fix|explain|test|refactor|docs)/);
if (slashMatch) {
  const command = slashMatch[0];
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    const selection = editor.document.getText(editor.selection);
    return await handleSlashCommand(command, selection);
  }
}
```

---

## Step 7: Test Everything

```bash
# 1. Compile
npm run compile

# 2. Launch Extension Development Host
# Press F5 in VS Code

# 3. Test autocomplete
# - Open a TypeScript file
# - Start typing
# - Wait 300ms
# - See ghost text suggestion
# - Press Tab to accept

# 4. Test @-mentions
# - Open VibeAll chat
# - Type: "Explain @src/extension.ts"
# - Should include file content in context

# 5. Test slash commands
# - Select some code
# - Type: "/explain"
# - Should explain the selected code
```

---

## 🌐 Simple Website (Optional)

Create a simple landing page:

```bash
# 1. Create Next.js site
npx create-next-app@latest website --typescript --tailwind --app

cd website

# 2. Edit app/page.tsx
# Add hero section, features, download button

# 3. Deploy to Vercel
npm run build
vercel deploy
```

---

## ✅ You're Done!

You now have:
- ✅ Intelligent autocomplete
- ✅ Codebase awareness
- ✅ @-mentions in chat
- ✅ Slash commands

**Just like Augment Code, but with your own models! 🚀**

---

## 📝 Configuration

Add to `package.json`:

```json
{
  "contributes": {
    "configuration": {
      "title": "VibeAll",
      "properties": {
        "vibeall.autocomplete.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable inline autocomplete"
        },
        "vibeall.autocomplete.debounceMs": {
          "type": "number",
          "default": 300,
          "description": "Debounce delay (ms)"
        }
      }
    }
  }
}
```

---

## 🐛 Troubleshooting

**Autocomplete not showing?**
- Check VS Code output channel for errors
- Verify API key is set
- Try reloading window (Cmd+R)

**Indexing slow?**
- Exclude large folders in `.vscodeignore`
- Reduce file types indexed

**High memory usage?**
- Limit index size
- Clear index periodically

---

**Need help? Check the logs in VS Code Output panel (View → Output → VibeAll)**
