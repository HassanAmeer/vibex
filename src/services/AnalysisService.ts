/**
 * Analysis Service
 * Orchestrates code analysis operations
 * @module services/AnalysisService
 */

import { CodeAnalyzer } from '../utils/CodeAnalyzer';
import { CodeAnalysisResult, CodeMetrics, CodeIssue, SecurityIssue } from '../types/core.types';

/**
 * Service for code analysis operations
 */
export class AnalysisService {
    private static instance: AnalysisService;
    private cache: Map<string, CodeAnalysisResult> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    /**
     * Get singleton instance
     */
    public static getInstance(): AnalysisService {
        if (!AnalysisService.instance) {
            AnalysisService.instance = new AnalysisService();
        }
        return AnalysisService.instance;
    }

    /**
     * Analyze code file
     */
    public async analyzeFile(
        filePath: string,
        content: string,
        language: string
    ): Promise<CodeAnalysisResult> {
        // Check cache
        const cacheKey = this.getCacheKey(filePath, content);
        const cached = this.cache.get(cacheKey);

        if (cached && this.isCacheValid(cached)) {
            return cached;
        }

        // Perform analysis
        const analysis = CodeAnalyzer.analyzeCode(content, language);
        const securityIssues = CodeAnalyzer.detectSecurityIssues(content);
        const suggestions = CodeAnalyzer.generateSuggestions(content, language);

        const result: CodeAnalysisResult = {
            file: filePath,
            language,
            metrics: analysis.metrics,
            issues: analysis.issues,
            securityIssues,
            suggestions
        };

        // Cache result
        this.cache.set(cacheKey, result);
        this.cleanupCache();

        return result;
    }

    /**
     * Analyze multiple files
     */
    public async analyzeFiles(
        files: Array<{ path: string; content: string; language: string }>
    ): Promise<CodeAnalysisResult[]> {
        const results = await Promise.all(
            files.map(file => this.analyzeFile(file.path, file.content, file.language))
        );
        return results;
    }

    /**
     * Get analysis summary
     */
    public getAnalysisSummary(results: CodeAnalysisResult[]): AnalysisSummary {
        const totalFiles = results.length;
        const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
        const totalSecurityIssues = results.reduce((sum, r) => sum + r.securityIssues.length, 0);

        const avgComplexity = results.reduce((sum, r) => sum + r.metrics.complexity, 0) / totalFiles;
        const avgMaintainability = results.reduce((sum, r) => sum + r.metrics.maintainability, 0) / totalFiles;

        const criticalIssues = results.reduce((sum, r) =>
            sum + r.securityIssues.filter(i => i.severity === 'critical').length, 0
        );

        return {
            totalFiles,
            totalIssues,
            totalSecurityIssues,
            criticalIssues,
            averageComplexity: Math.round(avgComplexity * 10) / 10,
            averageMaintainability: Math.round(avgMaintainability * 10) / 10,
            filesWithIssues: results.filter(r => r.issues.length > 0).length,
            filesWithSecurityIssues: results.filter(r => r.securityIssues.length > 0).length
        };
    }

    /**
     * Generate cache key
     */
    private getCacheKey(filePath: string, content: string): string {
        // Simple hash based on file path and content length
        return `${filePath}:${content.length}`;
    }

    /**
     * Check if cache entry is valid
     */
    private isCacheValid(result: CodeAnalysisResult): boolean {
        // For now, always consider cache valid
        // In production, add timestamp checking
        return true;
    }

    /**
     * Clean up old cache entries
     */
    private cleanupCache(): void {
        if (this.cache.size > 100) {
            // Remove oldest entries
            const entries = Array.from(this.cache.entries());
            entries.slice(0, 50).forEach(([key]) => this.cache.delete(key));
        }
    }

    /**
     * Clear cache
     */
    public clearCache(): void {
        this.cache.clear();
    }
}

/**
 * Analysis summary interface
 */
export interface AnalysisSummary {
    totalFiles: number;
    totalIssues: number;
    totalSecurityIssues: number;
    criticalIssues: number;
    averageComplexity: number;
    averageMaintainability: number;
    filesWithIssues: number;
    filesWithSecurityIssues: number;
}
