import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import Parser from 'tree-sitter';
const TypeScript = require('tree-sitter-typescript').typescript;
const JavaScript = require('tree-sitter-javascript');

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
        console.log('🔍 Starting codebase indexing...');

        // Find all code files
        const files = await vscode.workspace.findFiles(
            '**/*.{ts,tsx,js,jsx}',
            '**/node_modules/**'
        );

        let indexed = 0;
        for (const file of files) {
            await this.indexFile(file.fsPath);
            indexed++;

            if (indexed % 10 === 0) {
                console.log(`Indexed ${indexed}/${files.length} files`);
            }
        }

        // Setup file watchers
        this.setupWatchers(workspacePath);

        console.log(`✅ Indexing complete! ${indexed} files indexed.`);
        vscode.window.showInformationMessage(`✅ Indexed ${indexed} files`);
    }

    async indexFile(filePath: string) {
        try {
            const content = await fs.readFile(filePath, 'utf8');

            // Set language based on file extension
            const language = filePath.match(/\.tsx?$/)
                ? TypeScript
                : JavaScript;

            this.parser.setLanguage(language);
            const tree = this.parser.parse(content);

            // Extract code chunks
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

            // Extract functions, classes, methods
            if (
                node.type === 'function_declaration' ||
                node.type === 'class_declaration' ||
                node.type === 'method_definition' ||
                node.type === 'arrow_function' ||
                node.type === 'function_expression'
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
        const queryLower = query.toLowerCase();

        for (const chunks of this.index.values()) {
            for (const chunk of chunks) {
                if (chunk.content.toLowerCase().includes(queryLower)) {
                    results.push(chunk);
                    if (results.length >= limit) {
                        return results;
                    }
                }
            }
        }

        return results;
    }

    private setupWatchers(workspacePath: string) {
        const watcher = vscode.workspace.createFileSystemWatcher(
            new vscode.RelativePattern(workspacePath, '**/*.{ts,tsx,js,jsx}')
        );

        watcher.onDidChange(async (uri) => {
            console.log(`File changed: ${uri.fsPath}`);
            await this.indexFile(uri.fsPath);
        });

        watcher.onDidCreate(async (uri) => {
            console.log(`File created: ${uri.fsPath}`);
            await this.indexFile(uri.fsPath);
        });

        watcher.onDidDelete((uri) => {
            console.log(`File deleted: ${uri.fsPath}`);
            this.index.delete(uri.fsPath);
        });

        this.watchers.push(watcher);
    }

    getStats() {
        let totalChunks = 0;
        for (const chunks of this.index.values()) {
            totalChunks += chunks.length;
        }
        return {
            files: this.index.size,
            chunks: totalChunks
        };
    }

    dispose() {
        this.watchers.forEach(w => w.dispose());
    }
}
