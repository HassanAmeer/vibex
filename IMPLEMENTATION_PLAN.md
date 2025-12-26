# AI Code Agent - Implementation Plan
## Augment-Style Extension + Website

> **Goal**: Build an AI coding assistant VS Code extension with intelligent autocomplete, codebase awareness, and a simple companion website.

---

## 🎯 What We're Building

### 1. **VS Code Extension** (Priority)
- ✅ Intelligent inline autocomplete (like Copilot)
- ✅ Codebase-aware chat interface
- ✅ @-mentions for files/symbols
- ✅ Slash commands (/fix, /explain, /test)
- ✅ Multi-model AI support (10+ providers)
- ✅ Code analysis and suggestions

### 2. **Website** (Simple)
- ✅ Landing page with features
- ✅ Documentation
- ✅ Download/install instructions
- ✅ Demo videos
- ✅ Settings sync (optional)

### 3. **What We're NOT Building**
- ❌ Complex backend infrastructure
- ❌ Database systems
- ❌ Team collaboration features
- ❌ Enterprise features
- ❌ Mobile apps

---

## 🏗️ Architecture (Simplified)

```
┌─────────────────────────────────────┐
│      VS Code Extension              │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Autocomplete │  │    Chat     │ │
│  └──────┬───────┘  └──────┬──────┘ │
│         │                 │        │
│         └────────┬────────┘        │
│                  │                 │
│         ┌────────▼────────┐        │
│         │ Context Engine  │        │
│         │ (Local Index)   │        │
│         └────────┬────────┘        │
│                  │                 │
│         ┌────────▼────────┐        │
│         │  AI Providers   │        │
│         │  (10+ Models)   │        │
│         └─────────────────┘        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      Simple Website                 │
│      (Static - Vercel)              │
│                                     │
│  - Landing page                     │
│  - Documentation                    │
│  - Download links                   │
│  - Demo videos                      │
└─────────────────────────────────────┘
```

---

## 🚀 Core Features

### Feature 1: Intelligent Autocomplete

**What it does**: Real-time code suggestions as you type

**Implementation**:
```typescript
// src/autocomplete/InlineCompletionProvider.ts
import * as vscode from 'vscode';

export class AIInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
  async provideInlineCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): Promise<vscode.InlineCompletionItem[]> {
    
    // Get context
    const codeBefore = document.getText(
      new vscode.Range(new vscode.Position(Math.max(0, position.line - 20), 0), position)
    );
    
    // Get relevant code from codebase (using local index)
    const relevantCode = await this.searchCodebase(codeBefore);
    
    // Call AI model (fast one like Groq)
    const completion = await this.getCompletion(codeBefore, relevantCode);
    
    // Return suggestion
    return [new vscode.InlineCompletionItem(completion)];
  }
}
```

**Key Points**:
- Use fast models (Groq Llama 3.3 70B, Cerebras)
- Target <300ms latency
- Local codebase indexing (no backend needed)
- Debounce 300ms

---

### Feature 2: Codebase Awareness

**What it does**: Understands your entire project for better suggestions

**Implementation**:
```typescript
// src/indexing/CodebaseIndexer.ts
import Parser from 'tree-sitter';
import TypeScript from 'tree-sitter-typescript';

export class CodebaseIndexer {
  private index: Map<string, CodeChunk[]> = new Map();
  
  async indexWorkspace(workspacePath: string) {
    // Find all code files
    const files = await vscode.workspace.findFiles('**/*.{ts,tsx,js,jsx}');
    
    for (const file of files) {
      await this.indexFile(file.fsPath);
    }
  }
  
  async indexFile(filePath: string) {
    // Parse with tree-sitter
    const content = await fs.readFile(filePath, 'utf8');
    const tree = this.parser.parse(content);
    
    // Extract functions, classes, etc.
    const chunks = this.extractChunks(tree, content, filePath);
    
    // Store in local index (in-memory or SQLite)
    this.index.set(filePath, chunks);
  }
  
  search(query: string): CodeChunk[] {
    // Simple text search (can upgrade to embeddings later)
    const results: CodeChunk[] = [];
    for (const chunks of this.index.values()) {
      results.push(...chunks.filter(c => c.content.includes(query)));
    }
    return results;
  }
}
```

**Key Points**:
- Use tree-sitter for parsing
- Store index locally (in-memory or SQLite)
- No cloud/backend needed
- Incremental updates with file watchers

---

### Feature 3: Enhanced Chat

**What it does**: Chat with AI about your code, with @-mentions and slash commands

**Implementation**:
```typescript
// src/chat/ChatHandler.ts

// Parse @-mentions
function parseMentions(text: string): string[] {
  const regex = /@([\w\/\.\-]+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
}

// Handle slash commands
async function handleSlashCommand(command: string, code: string) {
  switch (command) {
    case '/fix':
      return await fixCode(code);
    case '/explain':
      return await explainCode(code);
    case '/test':
      return await generateTests(code);
    case '/refactor':
      return await refactorCode(code);
    case '/docs':
      return await addDocumentation(code);
  }
}

// Enhanced message handler
async function handleMessage(message: string) {
  // Parse mentions
  const mentions = parseMentions(message);
  
  // Fetch mentioned files
  let context = '';
  for (const mention of mentions) {
    const fileContent = await readFile(mention);
    context += `\n\n// File: ${mention}\n${fileContent}`;
  }
  
  // Check for slash command
  const slashMatch = message.match(/^\/(fix|explain|test|refactor|docs)/);
  if (slashMatch) {
    const command = slashMatch[0];
    const selectedCode = getSelectedCode();
    return await handleSlashCommand(command, selectedCode);
  }
  
  // Regular chat with context
  return await sendToAI(message, context);
}
```

**Key Points**:
- @-mentions: `@src/App.tsx`
- Slash commands: `/fix`, `/explain`, `/test`, `/refactor`, `/docs`
- All processing happens locally
- No backend needed

---

## 🛠️ Technology Stack

### VS Code Extension
```json
{
  "core": "TypeScript",
  "framework": "VS Code Extension API",
  "ui": "React (Webview)",
  "parsing": "tree-sitter",
  "storage": "VS Code Storage API (local)",
  "ai": "Direct API calls to providers"
}
```

### Website (Static)
```json
{
  "framework": "Next.js 14 (Static Export)",
  "styling": "Tailwind CSS",
  "hosting": "Vercel (free tier)",
  "content": "Markdown (MDX)"
}
```

### AI Providers (Direct API)
- OpenAI (GPT-4, o1)
- Anthropic (Claude 3.5)
- Google (Gemini)
- Groq (Llama 3.3 70B - fast!)
- Cerebras (ultra-fast)
- OpenRouter (aggregator)

---

## 📁 Project Structure

```
vibex/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── autocomplete/
│   │   └── InlineCompletionProvider.ts
│   ├── indexing/
│   │   └── CodebaseIndexer.ts
│   ├── chat/
│   │   └── ChatHandler.ts
│   ├── api/
│   │   └── ModelClient.ts        # AI provider clients
│   ├── webview/
│   │   └── components/
│   │       └── ChatInterface.tsx
│   └── utils/
│       └── CodeAnalyzer.ts
├── website/                       # Simple Next.js site
│   ├── app/
│   │   ├── page.tsx              # Landing page
│   │   ├── docs/
│   │   └── download/
│   └── public/
└── package.json
```

---

## 🎯 Implementation Steps

### Step 1: Enhance Existing Extension

**You already have**:
- ✅ Multi-model AI support
- ✅ Chat interface
- ✅ File operations
- ✅ Code analysis

**Add these features**:

#### 1.1 Codebase Indexing
```bash
npm install tree-sitter tree-sitter-typescript tree-sitter-javascript
```

Create `src/indexing/CodebaseIndexer.ts` (see code above)

#### 1.2 Inline Autocomplete
Register the completion provider:
```typescript
// In extension.ts
const completionProvider = new AIInlineCompletionProvider();
context.subscriptions.push(
  vscode.languages.registerInlineCompletionItemProvider(
    { pattern: '**' },
    completionProvider
  )
);
```

#### 1.3 @-Mentions & Slash Commands
Update chat handler to parse mentions and commands (see code above)

---

### Step 2: Create Simple Website

```bash
# Create Next.js site
npx create-next-app@latest website --typescript --tailwind --app

cd website

# Create pages
mkdir -p app/docs app/download

# Build static site
npm run build
npm run export

# Deploy to Vercel
vercel deploy
```

**Website Structure**:
```
website/
├── app/
│   ├── page.tsx           # Landing page
│   │   - Hero section
│   │   - Features showcase
│   │   - Demo video
│   │   - Download button
│   ├── docs/
│   │   └── page.tsx       # Documentation
│   └── download/
│       └── page.tsx       # Download/install guide
└── public/
    ├── demo.mp4           # Demo video
    └── vibeall.vsix       # Extension file
```

---

## 💻 Code Examples

### Complete Autocomplete Implementation

```typescript
// src/autocomplete/InlineCompletionProvider.ts
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
    position: vscode.Position,
    context: vscode.InlineCompletionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.InlineCompletionItem[] | undefined> {
    
    // Debounce
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    return new Promise((resolve) => {
      this.debounceTimer = setTimeout(async () => {
        try {
          // Get context
          const codeBefore = document.getText(
            new vscode.Range(
              new vscode.Position(Math.max(0, position.line - 20), 0),
              position
            )
          );

          // Search codebase
          const relevantCode = this.indexer.search(codeBefore.slice(-100));

          // Build prompt
          const prompt = `Complete this code:

${relevantCode.map(c => c.content).join('\n\n')}

Current code:
${codeBefore}

Complete at cursor. Output only the completion:`;

          // Call AI (use fast model)
          const response = await this.modelClient.sendMessage(
            { provider: 'groq', modelId: 'llama-3.3-70b-versatile' },
            [{ role: 'user', content: prompt }]
          );

          const completion = response.content.trim();

          if (completion && completion.length > 0) {
            resolve([
              new vscode.InlineCompletionItem(
                completion,
                new vscode.Range(position, position)
              )
            ]);
          } else {
            resolve(undefined);
          }
        } catch (error) {
          console.error('Autocomplete error:', error);
          resolve(undefined);
        }
      }, 300); // 300ms debounce
    });
  }
}
```

### Complete Indexer Implementation

```typescript
// src/indexing/CodebaseIndexer.ts
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
  endLine: number;
}

export class CodebaseIndexer {
  private parser: Parser;
  private index: Map<string, CodeChunk[]> = new Map();
  private watchers: vscode.FileSystemWatcher[] = [];

  constructor() {
    this.parser = new Parser();
  }

  async initialize(workspacePath: string) {
    console.log('Indexing workspace...');
    
    // Find all code files
    const files = await vscode.workspace.findFiles(
      '**/*.{ts,tsx,js,jsx}',
      '**/node_modules/**'
    );

    // Index each file
    for (const file of files) {
      await this.indexFile(file.fsPath);
    }

    // Setup file watchers
    this.setupWatchers(workspacePath);

    console.log(`Indexed ${files.length} files`);
  }

  async indexFile(filePath: string) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      // Set language
      const language = filePath.endsWith('.ts') || filePath.endsWith('.tsx')
        ? TypeScript.typescript
        : JavaScript;
      
      this.parser.setLanguage(language);
      const tree = this.parser.parse(content);

      // Extract chunks
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
      
      if (
        node.type === 'function_declaration' ||
        node.type === 'class_declaration' ||
        node.type === 'method_definition'
      ) {
        chunks.push({
          content: text.slice(node.startIndex, node.endIndex),
          filePath,
          type: node.type,
          startLine: node.startPosition.row,
          endLine: node.endPosition.row
        });
      }

      if (cursor.gotoFirstChild()) {
        do {
          visit();
        } while (cursor.gotoNextSibling());
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
          if (results.length >= limit) break;
        }
      }
      if (results.length >= limit) break;
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

    this.watchers.push(watcher);
  }

  dispose() {
    this.watchers.forEach(w => w.dispose());
  }
}
```

---

## 🌐 Simple Website

### Landing Page (website/app/page.tsx)

```tsx
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold text-white mb-6">
          VibeAll AI Code Agent
        </h1>
        <p className="text-2xl text-gray-300 mb-8">
          Intelligent autocomplete, codebase awareness, and AI chat for VS Code
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/download"
            className="px-8 py-4 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700"
          >
            Download Extension
          </a>
          <a
            href="/docs"
            className="px-8 py-4 bg-gray-800 text-white rounded-lg text-lg font-semibold hover:bg-gray-700"
          >
            Documentation
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          Features
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            title="Intelligent Autocomplete"
            description="Real-time code suggestions as you type, powered by AI"
            icon="⚡"
          />
          <FeatureCard
            title="Codebase Awareness"
            description="Understands your entire project for better suggestions"
            icon="🧠"
          />
          <FeatureCard
            title="AI Chat"
            description="Chat with AI about your code, with @-mentions and slash commands"
            icon="💬"
          />
        </div>
      </section>

      {/* Demo Video */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-white text-center mb-12">
          See It In Action
        </h2>
        <div className="max-w-4xl mx-auto">
          <video
            className="w-full rounded-lg shadow-2xl"
            controls
            poster="/demo-thumbnail.jpg"
          >
            <source src="/demo.mp4" type="video/mp4" />
          </video>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ title, description, icon }: any) {
  return (
    <div className="bg-gray-800 p-8 rounded-lg">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}
```

---

## 🚀 Quick Start

### For Extension Development

```bash
# 1. Install dependencies
npm install tree-sitter tree-sitter-typescript tree-sitter-javascript

# 2. Add autocomplete provider
# Create src/autocomplete/InlineCompletionProvider.ts (see code above)

# 3. Add indexer
# Create src/indexing/CodebaseIndexer.ts (see code above)

# 4. Update extension.ts
# Register providers and initialize indexer

# 5. Test
# Press F5 to launch Extension Development Host
```

### For Website

```bash
# 1. Create Next.js site
npx create-next-app@latest website --typescript --tailwind --app

# 2. Create pages
# Add landing page, docs, download page

# 3. Build and deploy
cd website
npm run build
vercel deploy
```

---

## ✅ Success Criteria

### Extension Must Have
- [x] Multi-model AI support (already done!)
- [ ] Inline autocomplete (<300ms)
- [ ] Codebase indexing (local)
- [ ] @-mentions in chat
- [ ] Slash commands (/fix, /explain, /test)

### Website Must Have
- [ ] Landing page
- [ ] Documentation
- [ ] Download instructions
- [ ] Demo video

### What We Don't Need
- ❌ Backend servers
- ❌ Databases
- ❌ User authentication
- ❌ Team features
- ❌ Complex infrastructure

---

## 📝 Next Steps

1. **Add Autocomplete** (1-2 days)
   - Implement InlineCompletionProvider
   - Test with fast models (Groq)

2. **Add Indexing** (1-2 days)
   - Implement CodebaseIndexer
   - Setup file watchers

3. **Enhance Chat** (1 day)
   - Add @-mention parsing
   - Add slash commands

4. **Create Website** (1 day)
   - Build landing page
   - Add documentation
   - Deploy to Vercel

**Total Time: ~1 week for MVP**

---

**That's it! Simple, focused, and ready to build! 🚀**
