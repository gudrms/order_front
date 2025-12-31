export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';
export interface AppError {
    id: string;
    message: string;
    severity: ErrorSeverity;
    code?: string;
    timestamp: Date | string;
    meta?: Record<string, any>;
}
export interface ErrorLogEntry {
    id: string;
    errorCode: string;
    message: string;
    severity: ErrorSeverity;
    stackTrace?: string;
    userAgent?: string;
    url?: string;
    userId?: string;
    storeId?: string;
    metadata?: Record<string, any>;
    createdAt: Date | string;
}
export interface CreateErrorLogRequest {
    errorCode: string;
    message: string;
    severity: ErrorSeverity;
    stackTrace?: string;
    url?: string;
    metadata?: Record<string, any>;
}
