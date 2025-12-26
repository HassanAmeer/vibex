/**
 * Logger Utility
 * Centralized logging system with levels and formatting
 * @module utils/logger/Logger
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}

export interface LogEntry {
    timestamp: Date;
    level: LogLevel;
    message: string;
    context?: string;
    data?: any;
}

/**
 * Logger class for structured logging
 */
export class Logger {
    private static instance: Logger;
    private currentLevel: LogLevel = LogLevel.INFO;
    private logs: LogEntry[] = [];
    private maxLogs: number = 1000;
    private listeners: Array<(entry: LogEntry) => void> = [];

    /**
     * Get singleton instance
     */
    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    /**
     * Set log level
     */
    public setLevel(level: LogLevel): void {
        this.currentLevel = level;
    }

    /**
     * Debug log
     */
    public debug(message: string, context?: string, data?: any): void {
        this.log(LogLevel.DEBUG, message, context, data);
    }

    /**
     * Info log
     */
    public info(message: string, context?: string, data?: any): void {
        this.log(LogLevel.INFO, message, context, data);
    }

    /**
     * Warning log
     */
    public warn(message: string, context?: string, data?: any): void {
        this.log(LogLevel.WARN, message, context, data);
    }

    /**
     * Error log
     */
    public error(message: string, context?: string, data?: any): void {
        this.log(LogLevel.ERROR, message, context, data);
    }

    /**
     * Internal log method
     */
    private log(level: LogLevel, message: string, context?: string, data?: any): void {
        if (level < this.currentLevel) {
            return;
        }

        const entry: LogEntry = {
            timestamp: new Date(),
            level,
            message,
            context,
            data
        };

        this.logs.push(entry);
        this.trimLogs();
        this.notifyListeners(entry);
        this.writeToConsole(entry);
    }

    /**
     * Write to console
     */
    private writeToConsole(entry: LogEntry): void {
        const prefix = `[${this.formatTimestamp(entry.timestamp)}] [${LogLevel[entry.level]}]`;
        const contextStr = entry.context ? ` [${entry.context}]` : '';
        const message = `${prefix}${contextStr} ${entry.message}`;

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(message, entry.data);
                break;
            case LogLevel.INFO:
                console.info(message, entry.data);
                break;
            case LogLevel.WARN:
                console.warn(message, entry.data);
                break;
            case LogLevel.ERROR:
                console.error(message, entry.data);
                break;
        }
    }

    /**
     * Format timestamp
     */
    private formatTimestamp(date: Date): string {
        return date.toISOString();
    }

    /**
     * Trim logs to max size
     */
    private trimLogs(): void {
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
    }

    /**
     * Add log listener
     */
    public addListener(listener: (entry: LogEntry) => void): void {
        this.listeners.push(listener);
    }

    /**
     * Remove log listener
     */
    public removeListener(listener: (entry: LogEntry) => void): void {
        const index = this.listeners.indexOf(listener);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify listeners
     */
    private notifyListeners(entry: LogEntry): void {
        this.listeners.forEach(listener => {
            try {
                listener(entry);
            } catch (error) {
                console.error('Error in log listener:', error);
            }
        });
    }

    /**
     * Get all logs
     */
    public getLogs(level?: LogLevel): LogEntry[] {
        if (level !== undefined) {
            return this.logs.filter(log => log.level === level);
        }
        return [...this.logs];
    }

    /**
     * Clear logs
     */
    public clear(): void {
        this.logs = [];
    }

    /**
     * Export logs as JSON
     */
    public export(): string {
        return JSON.stringify(this.logs, null, 2);
    }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): ContextLogger {
    return new ContextLogger(context);
}

/**
 * Context-specific logger
 */
class ContextLogger {
    private logger: Logger;
    private context: string;

    constructor(context: string) {
        this.logger = Logger.getInstance();
        this.context = context;
    }

    public debug(message: string, data?: any): void {
        this.logger.debug(message, this.context, data);
    }

    public info(message: string, data?: any): void {
        this.logger.info(message, this.context, data);
    }

    public warn(message: string, data?: any): void {
        this.logger.warn(message, this.context, data);
    }

    public error(message: string, data?: any): void {
        this.logger.error(message, this.context, data);
    }
}
