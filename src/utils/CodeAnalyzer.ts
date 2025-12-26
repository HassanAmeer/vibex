import * as vscode from 'vscode';

export class CodeAnalyzer {
    /**
     * Analyze code for common issues and patterns
     */
    static analyzeCode(code: string, language: string): CodeAnalysis {
        const issues: CodeIssue[] = [];
        const metrics: CodeMetrics = {
            lines: 0,
            complexity: 0,
            maintainability: 100
        };

        const lines = code.split('\n');
        metrics.lines = lines.length;

        // Basic complexity analysis
        let complexity = 1;
        const complexityPatterns = [
            /if\s*\(/g,
            /else\s+if\s*\(/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /case\s+/g,
            /catch\s*\(/g,
            /\&\&/g,
            /\|\|/g
        ];

        complexityPatterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches) {
                complexity += matches.length;
            }
        });

        metrics.complexity = complexity;
        metrics.maintainability = Math.max(0, 100 - (complexity * 2));

        // Check for common issues
        this.checkCommonIssues(code, language, issues);

        return { issues, metrics };
    }

    private static checkCommonIssues(code: string, language: string, issues: CodeIssue[]) {
        // Check for console.log (should use proper logging)
        if (language === 'javascript' || language === 'typescript') {
            const consoleMatches = code.match(/console\.(log|warn|error)/g);
            if (consoleMatches && consoleMatches.length > 3) {
                issues.push({
                    severity: 'warning',
                    message: `Found ${consoleMatches.length} console statements. Consider using a proper logging library.`,
                    line: 0
                });
            }

            // Check for var usage
            const varMatches = code.match(/\bvar\s+/g);
            if (varMatches) {
                issues.push({
                    severity: 'warning',
                    message: 'Use const or let instead of var',
                    line: 0
                });
            }

            // Check for == instead of ===
            const looseEqualityMatches = code.match(/[^=!]==[^=]/g);
            if (looseEqualityMatches) {
                issues.push({
                    severity: 'warning',
                    message: 'Use === instead of == for equality checks',
                    line: 0
                });
            }
        }

        // Check for TODO comments
        const todoMatches = code.match(/\/\/\s*TODO|\/\*\s*TODO|\#\s*TODO/gi);
        if (todoMatches) {
            issues.push({
                severity: 'info',
                message: `Found ${todoMatches.length} TODO comment(s)`,
                line: 0
            });
        }

        // Check for long lines
        const lines = code.split('\n');
        const longLines = lines.filter(line => line.length > 120);
        if (longLines.length > 0) {
            issues.push({
                severity: 'info',
                message: `${longLines.length} line(s) exceed 120 characters`,
                line: 0
            });
        }
    }

    /**
     * Generate suggestions for code improvement
     */
    static generateSuggestions(code: string, language: string): string[] {
        const suggestions: string[] = [];

        // Check for missing error handling
        if (language === 'javascript' || language === 'typescript') {
            if (code.includes('async') && !code.includes('try')) {
                suggestions.push('Add try-catch blocks for async functions');
            }

            if (code.includes('fetch') && !code.includes('catch')) {
                suggestions.push('Add error handling for fetch requests');
            }

            // Check for missing JSDoc
            const functionMatches = code.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g);
            if (functionMatches && !code.includes('/**')) {
                suggestions.push('Add JSDoc comments to document functions');
            }
        }

        // Check for code organization
        if (code.length > 500 && !code.includes('class') && !code.includes('function')) {
            suggestions.push('Consider breaking code into smaller functions or classes');
        }

        return suggestions;
    }

    /**
     * Detect potential security issues
     */
    static detectSecurityIssues(code: string): SecurityIssue[] {
        const issues: SecurityIssue[] = [];

        // Check for eval usage
        if (code.includes('eval(')) {
            issues.push({
                severity: 'critical',
                message: 'Avoid using eval() - it can execute arbitrary code',
                type: 'code-injection'
            });
        }

        // Check for innerHTML usage
        if (code.includes('innerHTML')) {
            issues.push({
                severity: 'high',
                message: 'Using innerHTML can lead to XSS vulnerabilities. Consider using textContent or sanitization.',
                type: 'xss'
            });
        }

        // Check for hardcoded credentials
        const credentialPatterns = [
            /password\s*=\s*["'][^"']+["']/i,
            /api[_-]?key\s*=\s*["'][^"']+["']/i,
            /secret\s*=\s*["'][^"']+["']/i,
            /token\s*=\s*["'][^"']+["']/i
        ];

        credentialPatterns.forEach(pattern => {
            if (pattern.test(code)) {
                issues.push({
                    severity: 'critical',
                    message: 'Hardcoded credentials detected. Use environment variables instead.',
                    type: 'hardcoded-secrets'
                });
            }
        });

        return issues;
    }
}

export interface CodeAnalysis {
    issues: CodeIssue[];
    metrics: CodeMetrics;
}

export interface CodeIssue {
    severity: 'error' | 'warning' | 'info';
    message: string;
    line: number;
}

export interface CodeMetrics {
    lines: number;
    complexity: number;
    maintainability: number;
}

export interface SecurityIssue {
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    type: string;
}
