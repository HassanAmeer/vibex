import * as vscode from 'vscode';
import { ModelClient } from '../api/ModelClient';

export class ChatEnhancer {
    private modelClient: ModelClient;

    constructor(modelClient: ModelClient) {
        this.modelClient = modelClient;
    }

    /**
     * Parse @-mentions from message
     * Example: "Explain @src/App.tsx" -> ["src/App.tsx"]
     */
    parseMentions(text: string): string[] {
        const regex = /@([\w\/\.\-]+)/g;
        const mentions: string[] = [];
        let match;

        while ((match = regex.exec(text)) !== null) {
            mentions.push(match[1]);
        }

        return mentions;
    }

    /**
     * Fetch content of mentioned files
     */
    async fetchMentionedFiles(mentions: string[]): Promise<string> {
        let context = '';

        for (const mention of mentions) {
            try {
                // Try to find the file in workspace
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) continue;

                const rootPath = workspaceFolders[0].uri.fsPath;
                const filePath = mention.startsWith('/') ? mention : `${rootPath}/${mention}`;

                const uri = vscode.Uri.file(filePath);
                const content = await vscode.workspace.fs.readFile(uri);
                const text = Buffer.from(content).toString('utf8');

                context += `\n\n// File: ${mention}\n${text}`;
            } catch (error) {
                console.error(`Failed to read ${mention}:`, error);
                context += `\n\n// File: ${mention} (not found)`;
            }
        }

        return context;
    }

    /**
     * Check if message starts with a slash command
     */
    parseSlashCommand(text: string): { command: string; args: string } | null {
        const match = text.match(/^\/(fix|explain|test|refactor|docs|optimize)(\s+(.*))?$/);
        if (match) {
            return {
                command: match[1],
                args: match[3] || ''
            };
        }
        return null;
    }

    /**
     * Handle slash commands
     */
    async handleSlashCommand(
        command: string,
        code: string,
        provider: string,
        modelId: string
    ): Promise<string> {
        const prompts: Record<string, string> = {
            fix: `You are an expert debugger. Fix any errors in this code and explain what was wrong:

\`\`\`
${code}
\`\`\`

Provide the fixed code and explanation.`,

            explain: `You are an expert code explainer. Explain what this code does in clear, simple terms:

\`\`\`
${code}
\`\`\`

Provide a detailed explanation.`,

            test: `You are an expert test writer. Generate comprehensive unit tests for this code:

\`\`\`
${code}
\`\`\`

Use the appropriate testing framework (Jest, Mocha, etc.) based on the code.`,

            refactor: `You are an expert code reviewer. Refactor this code to improve:
- Readability
- Performance
- Maintainability
- Best practices

Original code:
\`\`\`
${code}
\`\`\`

Provide the refactored code with explanations of changes.`,

            docs: `You are an expert technical writer. Add comprehensive JSDoc/documentation comments to this code:

\`\`\`
${code}
\`\`\`

Include parameter descriptions, return types, and examples where appropriate.`,

            optimize: `You are an expert performance engineer. Optimize this code for better performance:

\`\`\`
${code}
\`\`\`

Provide the optimized code and explain the performance improvements.`
        };

        const prompt = prompts[command];
        if (!prompt) {
            throw new Error(`Unknown command: /${command}`);
        }

        try {
            const response = await this.modelClient.sendMessage(
                { provider, modelId },
                [{ role: 'user', content: prompt }]
            );

            return response.content;
        } catch (error: any) {
            throw new Error(`Failed to execute /${command}: ${error.message}`);
        }
    }

    /**
     * Get selected code from active editor
     */
    getSelectedCode(): string | null {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return null;
        }

        const selection = editor.selection;
        if (selection.isEmpty) {
            // If no selection, get current line
            const line = editor.document.lineAt(selection.active.line);
            return line.text;
        }

        return editor.document.getText(selection);
    }

    /**
     * Enhance message with mentions and handle slash commands
     */
    async enhanceMessage(
        message: string,
        provider: string,
        modelId: string
    ): Promise<{ enhancedMessage: string; isSlashCommand: boolean }> {

        // Check for slash command
        const slashCommand = this.parseSlashCommand(message);
        if (slashCommand) {
            const selectedCode = this.getSelectedCode();
            if (!selectedCode) {
                throw new Error('Please select code to use slash commands');
            }

            const response = await this.handleSlashCommand(
                slashCommand.command,
                selectedCode,
                provider,
                modelId
            );

            return {
                enhancedMessage: response,
                isSlashCommand: true
            };
        }

        // Parse mentions
        const mentions = this.parseMentions(message);
        if (mentions.length === 0) {
            return {
                enhancedMessage: message,
                isSlashCommand: false
            };
        }

        // Fetch mentioned files
        const context = await this.fetchMentionedFiles(mentions);

        // Enhance message with context
        const enhancedMessage = `${context}\n\n${message}`;

        return {
            enhancedMessage,
            isSlashCommand: false
        };
    }
}
