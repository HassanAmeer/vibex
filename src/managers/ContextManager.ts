import * as vscode from 'vscode';

export class ContextManager {
    async getActiveFileContext(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        const document = editor.document;
        const selection = editor.selection;

        let context = `File: ${document.fileName}\n`;
        context += `Language: ${document.languageId}\n\n`;

        if (!selection.isEmpty) {
            context += `Selected code:\n\`\`\`${document.languageId}\n`;
            context += document.getText(selection);
            context += '\n```\n';
        } else {
            context += `Full file content:\n\`\`\`${document.languageId}\n`;
            context += document.getText();
            context += '\n```\n';
        }

        return context;
    }

    async getWorkspaceContext(): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
            return '';
        }

        let context = 'Workspace Information:\n';
        context += `Root: ${workspaceFolders[0].uri.fsPath}\n`;

        // Get package.json if it exists
        try {
            const packageJsonUri = vscode.Uri.joinPath(workspaceFolders[0].uri, 'package.json');
            const packageJsonContent = await vscode.workspace.fs.readFile(packageJsonUri);
            const packageJson = JSON.parse(packageJsonContent.toString());

            context += '\nProject Dependencies:\n';
            if (packageJson.dependencies) {
                context += 'Dependencies: ' + Object.keys(packageJson.dependencies).join(', ') + '\n';
            }
            if (packageJson.devDependencies) {
                context += 'DevDependencies: ' + Object.keys(packageJson.devDependencies).join(', ') + '\n';
            }
        } catch (error) {
            // package.json doesn't exist or can't be read
        }

        return context;
    }

    async getDiagnosticsContext(): Promise<string> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return '';
        }

        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        if (diagnostics.length === 0) {
            return '';
        }

        let context = '\nCurrent Errors/Warnings:\n';
        diagnostics.forEach((diagnostic, index) => {
            const severity = diagnostic.severity === vscode.DiagnosticSeverity.Error ? 'ERROR' : 'WARNING';
            context += `${index + 1}. [${severity}] Line ${diagnostic.range.start.line + 1}: ${diagnostic.message}\n`;
        });

        return context;
    }

    async getFullContext(): Promise<string> {
        const fileContext = await this.getActiveFileContext();
        const workspaceContext = await this.getWorkspaceContext();
        const diagnosticsContext = await this.getDiagnosticsContext();

        return `${workspaceContext}\n${fileContext}\n${diagnosticsContext}`;
    }
}
