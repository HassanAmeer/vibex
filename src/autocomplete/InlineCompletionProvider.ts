import * as vscode from 'vscode';
import { ModelClient } from '../api/ModelClient';
import { CodebaseIndexer } from '../indexing/CodebaseIndexer';

export class AIInlineCompletionProvider implements vscode.InlineCompletionItemProvider {
    private modelClient: ModelClient;
    private indexer: CodebaseIndexer;
    private debounceTimer?: NodeJS.Timeout;
    private enabled: boolean = true;

    constructor(modelClient: ModelClient, indexer: CodebaseIndexer) {
        this.modelClient = modelClient;
        this.indexer = indexer;
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | undefined> {

        if (!this.enabled) {
            return undefined;
        }

        // Debounce
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        return new Promise((resolve) => {
            this.debounceTimer = setTimeout(async () => {
                try {
                    const completion = await this.generateCompletion(document, position, token);

                    if (completion && completion.trim().length > 0 && !token.isCancellationRequested) {
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

    private async generateCompletion(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): Promise<string | undefined> {

        // Get code before cursor
        const codeBefore = document.getText(
            new vscode.Range(
                new vscode.Position(Math.max(0, position.line - 20), 0),
                position
            )
        );

        // Get code after cursor (for context)
        const codeAfter = document.getText(
            new vscode.Range(
                position,
                new vscode.Position(Math.min(document.lineCount, position.line + 5), 0)
            )
        );

        // Search codebase for relevant code
        const query = codeBefore.slice(-100); // Last 100 chars
        const relevantCode = this.indexer.search(query, 3);

        // Build context from relevant code
        const context = relevantCode
            .map(chunk => `// From ${chunk.filePath}\n${chunk.content}`)
            .join('\n\n');

        // Build prompt
        const prompt = `You are an expert code completion AI. Complete the code naturally and concisely.

File: ${document.fileName}
Language: ${document.languageId}

${context ? `Relevant code from project:\n${context}\n\n` : ''}Code before cursor:
${codeBefore}

Code after cursor:
${codeAfter}

Complete the code at the cursor position. Output ONLY the completion text, no explanations or markdown.
Rules:
- Match the existing code style
- Keep it concise (1-3 lines max)
- Don't repeat code that's already there
- Ensure proper indentation

Completion:`;

        if (token.isCancellationRequested) {
            return undefined;
        }

        // Use fast model (Groq Llama 3.3 70B)
        try {
            const response = await this.modelClient.sendMessage(
                { provider: 'groq', modelId: 'llama-3.3-70b-versatile' },
                [{ role: 'user', content: prompt }]
            );

            // Extract completion
            let completion = response.content.trim();

            // Remove markdown code blocks if present
            completion = completion.replace(/```[\w]*\n?/g, '').trim();

            // Remove any leading/trailing quotes
            completion = completion.replace(/^["']|["']$/g, '');

            return completion;
        } catch (error: any) {
            console.error('AI completion error:', error);

            // If Groq fails, try Cerebras as fallback
            try {
                const response = await this.modelClient.sendMessage(
                    { provider: 'cerebras', modelId: 'llama3.1-8b' },
                    [{ role: 'user', content: prompt }]
                );
                return response.content.trim().replace(/```[\w]*\n?/g, '').trim();
            } catch (fallbackError) {
                console.error('Fallback completion error:', fallbackError);
                return undefined;
            }
        }
    }
}
