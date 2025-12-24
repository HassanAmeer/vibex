"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextManager = void 0;
const vscode = __importStar(require("vscode"));
class ContextManager {
    async getActiveFileContext() {
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
        }
        else {
            context += `Full file content:\n\`\`\`${document.languageId}\n`;
            context += document.getText();
            context += '\n```\n';
        }
        return context;
    }
    async getWorkspaceContext() {
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
        }
        catch (error) {
            // package.json doesn't exist or can't be read
        }
        return context;
    }
    async getDiagnosticsContext() {
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
    async getFullContext() {
        const fileContext = await this.getActiveFileContext();
        const workspaceContext = await this.getWorkspaceContext();
        const diagnosticsContext = await this.getDiagnosticsContext();
        return `${workspaceContext}\n${fileContext}\n${diagnosticsContext}`;
    }
}
exports.ContextManager = ContextManager;
//# sourceMappingURL=ContextManager.js.map