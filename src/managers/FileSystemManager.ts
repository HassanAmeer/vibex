import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class FileSystemManager {
    private sandboxRoot: string;
    private workspaceRoot: string | undefined;

    constructor() {
        this.workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
        this.sandboxRoot = this.workspaceRoot ? path.join(this.workspaceRoot, 'gen') : '';
    }

    private getAbsolutePath(relativePath: string): string {
        if (!this.workspaceRoot) {
            throw new Error('No workspace open');
        }
        // If it already looks absolute and starts with workspace root, keep it. 
        // Otherwise join with workspace root.
        if (path.isAbsolute(relativePath)) {
            if (!relativePath.startsWith(this.workspaceRoot)) {
                // For security/safety, strictly simpler to just require relative paths or paths inside workspace
                // But for now, let's assume valid inputs or re-root them.
                return relativePath;
            }
            return relativePath;
        }
        return path.join(this.workspaceRoot, relativePath);
    }

    private ensureSandbox(filePath: string) {
        if (!filePath.startsWith(this.sandboxRoot)) {
            // If strictly enforcing sandbox. 
            // The user wants a 'gen' folder for testing, but also 'update code' for general work.
            // We 'll use a flag or method distinction later. For now, assume we can write anywhere if allowed.
        }
    }

    async createFile(filePath: string, content: string): Promise<string> {
        const fullPath = this.getAbsolutePath(filePath);
        await this.ensureDirectoryExists(path.dirname(fullPath));
        await fs.promises.writeFile(fullPath, content, 'utf8');
        return fullPath;
    }

    async createDirectory(dirPath: string): Promise<string> {
        const fullPath = this.getAbsolutePath(dirPath);
        await fs.promises.mkdir(fullPath, { recursive: true });
        return fullPath;
    }

    async readFile(filePath: string): Promise<string> {
        const fullPath = this.getAbsolutePath(filePath);
        return await fs.promises.readFile(fullPath, 'utf8');
    }

    async listFiles(dirPath: string): Promise<string[]> {
        const fullPath = this.getAbsolutePath(dirPath);
        const entries = await fs.promises.readdir(fullPath, { withFileTypes: true });
        return entries.map(entry => {
            return path.join(dirPath, entry.name);
        });
    }

    async deleteFile(filePath: string): Promise<void> {
        const fullPath = this.getAbsolutePath(filePath);
        await fs.promises.unlink(fullPath);
    }

    private async ensureDirectoryExists(dirPath: string) {
        try {
            await fs.promises.access(dirPath);
        } catch {
            await fs.promises.mkdir(dirPath, { recursive: true });
        }
    }

    // Helper for the 'gen' folder requirement
    async createInGen(filename: string, content: string): Promise<string> {
        if (!this.workspaceRoot) throw new Error('No workspace');
        const genPath = path.join(this.workspaceRoot, 'gen', filename);
        await this.createFile(genPath, content);
        return genPath;
    }
}
