/**
 * @fileoverview Enhanced error handling utility
 * @module utils/error-handling
 */

import type { ErrorInfo } from '../types'

// ===== ERROR CODES =====
export enum GridErrorCode {
  // Data Source Errors (1xxx)
  DATA_LOAD_FAILED = 'DATA_LOAD_FAILED',
  DATA_INVALID_FORMAT = 'DATA_INVALID_FORMAT',
  DATA_NETWORK_ERROR = 'DATA_NETWORK_ERROR',
  DATA_TIMEOUT = 'DATA_TIMEOUT',
  DATA_UNAUTHORIZED = 'DATA_UNAUTHORIZED',
  DATA_FORBIDDEN = 'DATA_FORBIDDEN',
  DATA_NOT_FOUND = 'DATA_NOT_FOUND',
  DATA_SERVER_ERROR = 'DATA_SERVER_ERROR',
  DATA_PARSE_ERROR = 'DATA_PARSE_ERROR',
  
  // Validation Errors (2xxx)
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_TYPE = 'VALIDATION_INVALID_TYPE',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_DUPLICATE_VALUE = 'VALIDATION_DUPLICATE_VALUE',
  
  // Configuration Errors (3xxx)
  CONFIG_INVALID_COLUMN = 'CONFIG_INVALID_COLUMN',
  CONFIG_INVALID_DATASOURCE = 'CONFIG_INVALID_DATASOURCE',
  CONFIG_MISSING_KEY_FIELD = 'CONFIG_MISSING_KEY_FIELD',
  CONFIG_INVALID_PROPS = 'CONFIG_INVALID_PROPS',
  CONFIG_MISSING_REQUIRED = 'CONFIG_MISSING_REQUIRED',
  
  // Operation Errors (4xxx)
  OP_EDIT_FAILED = 'OP_EDIT_FAILED',
  OP_DELETE_FAILED = 'OP_DELETE_FAILED',
  OP_INSERT_FAILED = 'OP_INSERT_FAILED',
  OP_EXPORT_FAILED = 'OP_EXPORT_FAILED',
  OP_SORT_FAILED = 'OP_SORT_FAILED',
  OP_FILTER_FAILED = 'OP_FILTER_FAILED',
  OP_GROUP_FAILED = 'OP_GROUP_FAILED',
  OP_SEARCH_FAILED = 'OP_SEARCH_FAILED',
  OP_SELECTION_FAILED = 'OP_SELECTION_FAILED',
  
  // State Errors (5xxx)
  STATE_SAVE_FAILED = 'STATE_SAVE_FAILED',
  STATE_LOAD_FAILED = 'STATE_LOAD_FAILED',
  STATE_INVALID = 'STATE_INVALID',
  STATE_VERSION_MISMATCH = 'STATE_VERSION_MISMATCH',
  STATE_CORRUPTED = 'STATE_CORRUPTED',
  
  // Permission Errors (6xxx)
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_READ_ONLY = 'PERMISSION_READ_ONLY',
  PERMISSION_INSUFFICIENT = 'PERMISSION_INSUFFICIENT',
  
  // Generic
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  DEPRECATED = 'DEPRECATED',
}

// ===== ERROR SEVERITY =====
export enum ErrorSeverity {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Critical = 'critical',
}

// ===== GRID ERROR CLASS =====
export class GridError extends Error {
  code: GridErrorCode
  severity: ErrorSeverity
  details?: any
  timestamp: Date
  recoverable: boolean
  userMessage?: string
  technicalMessage?: string
  stackTrace?: string
  context?: Record<string, any>

  constructor(
    code: GridErrorCode,
    message: string,
    options: {
      severity?: ErrorSeverity
      details?: any
      recoverable?: boolean
      userMessage?: string
      context?: Record<string, any>
    } = {}
  ) {
    super(message)
    
    this.name = 'GridError'
    this.code = code
    this.severity = options.severity || this.inferSeverity(code)
    this.details = options.details
    this.timestamp = new Date()
    this.recoverable = options.recoverable ?? this.isRecoverable(code)
    this.userMessage = options.userMessage || this.generateUserMessage(code, message)
    this.technicalMessage = message
    this.context = options.context
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, GridError)
    }
    this.stackTrace = this.stack
  }

  private inferSeverity(code: GridErrorCode): ErrorSeverity {
    if (code.startsWith('DATA_')) {
      if (code.includes('TIMEOUT') || code.includes('NETWORK')) {
        return ErrorSeverity.Warning
      }
      return ErrorSeverity.Error
    }
    
    if (code.startsWith('VALIDATION_')) {
      return ErrorSeverity.Warning
    }
    
    if (code.startsWith('CONFIG_')) {
      return ErrorSeverity.Critical
    }
    
    if (code.startsWith('PERMISSION_')) {
      return ErrorSeverity.Error
    }
    
    return ErrorSeverity.Error
  }

  private isRecoverable(code: GridErrorCode): boolean {
    const unrecoverableCodes = [
      GridErrorCode.CONFIG_INVALID_DATASOURCE,
      GridErrorCode.CONFIG_MISSING_KEY_FIELD,
      GridErrorCode.CONFIG_INVALID_PROPS,
      GridErrorCode.PERMISSION_DENIED,
      GridErrorCode.STATE_CORRUPTED,
    ]
    
    return !unrecoverableCodes.includes(code)
  }

  private generateUserMessage(code: GridErrorCode, technicalMessage: string): string {
    const userMessages: Partial<Record<GridErrorCode, string>> = {
      [GridErrorCode.DATA_LOAD_FAILED]: 'Failed to load data. Please try again.',
      [GridErrorCode.DATA_NETWORK_ERROR]: 'Network error. Please check your connection.',
      [GridErrorCode.DATA_TIMEOUT]: 'Request timed out. Please try again.',
      [GridErrorCode.DATA_UNAUTHORIZED]: 'You are not authorized to access this data.',
      [GridErrorCode.VALIDATION_FAILED]: 'Please correct the validation errors.',
      [GridErrorCode.OP_EDIT_FAILED]: 'Failed to save changes. Please try again.',
      [GridErrorCode.OP_DELETE_FAILED]: 'Failed to delete. Please try again.',
      [GridErrorCode.STATE_SAVE_FAILED]: 'Failed to save grid state.',
      [GridErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform this action.',
    }
    
    return userMessages[code] || technicalMessage
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      message: this.message,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      recoverable: this.recoverable,
      context: this.context,
      stack: this.stackTrace,
    }
  }

  toString(): string {
    return `[${this.code}] ${this.severity.toUpperCase()}: ${this.message}`
  }
}

// ===== ERROR HANDLER =====
export class GridErrorHandler {
  private handlers: Map<GridErrorCode, Array<(error: GridError) => void>> = new Map()
  private globalHandlers: Array<(error: GridError) => void> = []
  private errorLog: GridError[] = []
  private maxLogSize = 100
  private enabled = true
  private reportToConsole = true

  // ===== REGISTER HANDLERS =====
  on(code: GridErrorCode, handler: (error: GridError) => void): () => void {
    if (!this.handlers.has(code)) {
      this.handlers.set(code, [])
    }
    
    this.handlers.get(code)!.push(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(code)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  onAny(handler: (error: GridError) => void): () => void {
    this.globalHandlers.push(handler)
    
    return () => {
      const index = this.globalHandlers.indexOf(handler)
      if (index > -1) {
        this.globalHandlers.splice(index, 1)
      }
    }
  }

  onSeverity(severity: ErrorSeverity, handler: (error: GridError) => void): () => void {
    return this.onAny((error) => {
      if (error.severity === severity) {
        handler(error)
      }
    })
  }

  // ===== HANDLE ERROR =====
  handle(error: GridError | Error | unknown): void {
    if (!this.enabled) return

    const gridError = this.normalizeError(error)
    
    // Log error
    this.logError(gridError)
    
    // Console output
    if (this.reportToConsole) {
      this.consoleOutput(gridError)
    }
    
    // Execute specific handlers
    const specificHandlers = this.handlers.get(gridError.code) || []
    specificHandlers.forEach((handler) => {
      try {
        handler(gridError)
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError)
      }
    })
    
    // Execute global handlers
    this.globalHandlers.forEach((handler) => {
      try {
        handler(gridError)
      } catch (handlerError) {
        console.error('Error in global error handler:', handlerError)
      }
    })
  }

  // ===== NORMALIZE ERROR =====
  private normalizeError(error: unknown): GridError {
    if (error instanceof GridError) {
      return error
    }
    
    if (error instanceof Error) {
      // Try to infer error type from message
      const code = this.inferErrorCode(error)
      return new GridError(code, error.message, {
        details: { originalError: error, stack: error.stack }
      })
    }
    
    return new GridError(
      GridErrorCode.UNKNOWN_ERROR,
      String(error),
      { details: { originalError: error } }
    )
  }

  private inferErrorCode(error: Error): GridErrorCode {
    const message = error.message.toLowerCase()
    
    if (message.includes('network') || message.includes('fetch')) {
      return GridErrorCode.DATA_NETWORK_ERROR
    }
    if (message.includes('timeout')) {
      return GridErrorCode.DATA_TIMEOUT
    }
    if (message.includes('unauthorized') || message.includes('401')) {
      return GridErrorCode.DATA_UNAUTHORIZED
    }
    if (message.includes('forbidden') || message.includes('403')) {
      return GridErrorCode.DATA_FORBIDDEN
    }
    if (message.includes('not found') || message.includes('404')) {
      return GridErrorCode.DATA_NOT_FOUND
    }
    if (message.includes('validation')) {
      return GridErrorCode.VALIDATION_FAILED
    }
    
    return GridErrorCode.UNKNOWN_ERROR
  }

  // ===== CONSOLE OUTPUT =====
  private consoleOutput(error: GridError): void {
    const style = this.getConsoleStyle(error.severity)
    
    console.groupCollapsed(
      `%c[${error.severity.toUpperCase()}] ${error.code}`,
      style
    )
    console.error('Message:', error.message)
    console.error('User Message:', error.userMessage)
    console.error('Timestamp:', error.timestamp.toISOString())
    console.error('Recoverable:', error.recoverable)
    
    if (error.details) {
      console.error('Details:', error.details)
    }
    
    if (error.context) {
      console.error('Context:', error.context)
    }
    
    if (error.stackTrace) {
      console.error('Stack:', error.stackTrace)
    }
    
    console.groupEnd()
  }

  private getConsoleStyle(severity: ErrorSeverity): string {
    const styles: Record<ErrorSeverity, string> = {
      [ErrorSeverity.Info]: 'color: #2196f3; font-weight: bold',
      [ErrorSeverity.Warning]: 'color: #ff9800; font-weight: bold',
      [ErrorSeverity.Error]: 'color: #f44336; font-weight: bold',
      [ErrorSeverity.Critical]: 'color: #fff; background: #f44336; font-weight: bold; padding: 2px 4px',
    }
    
    return styles[severity]
  }

  // ===== ERROR LOG =====
  private logError(error: GridError): void {
    this.errorLog.push(error)
    
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.shift()
    }
  }

  getLog(options: {
    severity?: ErrorSeverity
    code?: GridErrorCode
    limit?: number
    since?: Date
  } = {}): GridError[] {
    let filtered = [...this.errorLog]
    
    if (options.severity) {
      filtered = filtered.filter((e) => e.severity === options.severity)
    }
    
    if (options.code) {
      filtered = filtered.filter((e) => e.code === options.code)
    }
    
    if (options.since) {
      filtered = filtered.filter((e) => e.timestamp >= options.since!)
    }
    
    if (options.limit) {
      filtered = filtered.slice(-options.limit)
    }
    
    return filtered
  }

  clearLog(): void {
    this.errorLog = []
  }

  getLastError(): GridError | undefined {
    return this.errorLog[this.errorLog.length - 1]
  }

  getErrorCount(code?: GridErrorCode): number {
    if (code) {
      return this.errorLog.filter((e) => e.code === code).length
    }
    return this.errorLog.length
  }

  // ===== CONFIGURATION =====
  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  setMaxLogSize(size: number): void {
    this.maxLogSize = size
  }

  setReportToConsole(report: boolean): void {
    this.reportToConsole = report
  }

  // ===== CLEAR =====
  clear(): void {
    this.handlers.clear()
    this.globalHandlers = []
    this.errorLog = []
  }

  // ===== EXPORT =====
  exportLog(): string {
    return JSON.stringify(
      this.errorLog.map((e) => e.toJSON()),
      null,
      2
    )
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Wrap async operation with error handling
 */
export async function tryAsync<T>(
  operation: () => Promise<T>,
  errorCode: GridErrorCode,
  errorMessage?: string,
  options?: {
    recoverable?: boolean
    context?: Record<string, any>
  }
): Promise<{ success: true; data: T } | { success: false; error: GridError }> {
  try {
    const data = await operation()
    return { success: true, data }
  } catch (error) {
    const gridError = new GridError(
      errorCode,
      errorMessage || String(error),
      {
        details: { originalError: error },
        recoverable: options?.recoverable,
        context: options?.context,
      }
    )
    return { success: false, error: gridError }
  }
}

/**
 * Wrap sync operation with error handling
 */
export function trySync<T>(
  operation: () => T,
  errorCode: GridErrorCode,
  errorMessage?: string,
  options?: {
    recoverable?: boolean
    context?: Record<string, any>
  }
): { success: true; data: T } | { success: false; error: GridError } {
  try {
    const data = operation()
    return { success: true, data }
  } catch (error) {
    const gridError = new GridError(
      errorCode,
      errorMessage || String(error),
      {
        details: { originalError: error },
        recoverable: options?.recoverable,
        context: options?.context,
      }
    )
    return { success: false, error: gridError }
  }
}

/**
 * Validate and throw
 */
export function validateOrThrow(
  condition: boolean,
  code: GridErrorCode,
  message: string,
  details?: any
): asserts condition {
  if (!condition) {
    throw new GridError(code, message, { details, recoverable: false })
  }
}

/**
 * Assert not null
 */
export function assertNotNull<T>(
  value: T | null | undefined,
  code: GridErrorCode,
  message: string
): asserts value is T {
  if (value == null) {
    throw new GridError(code, message, { recoverable: false })
  }
}

// ===== ERROR CREATORS =====

export function createDataLoadError(
  message: string,
  details?: any
): GridError {
  return new GridError(GridErrorCode.DATA_LOAD_FAILED, message, {
    details,
    recoverable: true,
  })
}

export function createValidationError(
  message: string,
  field?: string,
  value?: any
): GridError {
  return new GridError(GridErrorCode.VALIDATION_FAILED, message, {
    details: { field, value },
    recoverable: true,
  })
}

export function createConfigError(message: string, details?: any): GridError {
  return new GridError(GridErrorCode.CONFIG_INVALID_PROPS, message, {
    details,
    recoverable: false,
  })
}

export function createOperationError(
  operation: string,
  message: string,
  details?: any
): GridError {
  const codeMap: Record<string, GridErrorCode> = {
    edit: GridErrorCode.OP_EDIT_FAILED,
    delete: GridErrorCode.OP_DELETE_FAILED,
    insert: GridErrorCode.OP_INSERT_FAILED,
    export: GridErrorCode.OP_EXPORT_FAILED,
    sort: GridErrorCode.OP_SORT_FAILED,
    filter: GridErrorCode.OP_FILTER_FAILED,
    group: GridErrorCode.OP_GROUP_FAILED,
    search: GridErrorCode.OP_SEARCH_FAILED,
  }

  return new GridError(
    codeMap[operation] || GridErrorCode.UNKNOWN_ERROR,
    message,
    {
      details,
      recoverable: true,
    }
  )
}

export function createNetworkError(
  statusCode: number,
  statusText: string,
  details?: any
): GridError {
  const codeMap: Record<number, GridErrorCode> = {
    401: GridErrorCode.DATA_UNAUTHORIZED,
    403: GridErrorCode.DATA_FORBIDDEN,
    404: GridErrorCode.DATA_NOT_FOUND,
    500: GridErrorCode.DATA_SERVER_ERROR,
    503: GridErrorCode.DATA_SERVER_ERROR,
  }

  return new GridError(
    codeMap[statusCode] || GridErrorCode.DATA_NETWORK_ERROR,
    `${statusCode}: ${statusText}`,
    {
      details: { statusCode, statusText, ...details },
      recoverable: statusCode < 500,
    }
  )
}

// ===== RECOVERY STRATEGIES =====

export interface RecoveryStrategy {
  canRecover(error: GridError): boolean
  recover(error: GridError): Promise<void>
}

export class RetryStrategy implements RecoveryStrategy {
  constructor(
    private maxRetries = 3,
    private delayMs = 1000,
    private backoffMultiplier = 2
  ) {}

  canRecover(error: GridError): boolean {
    return (
      error.recoverable &&
      [
        GridErrorCode.DATA_LOAD_FAILED,
        GridErrorCode.DATA_NETWORK_ERROR,
        GridErrorCode.DATA_TIMEOUT,
      ].includes(error.code)
    )
  }

  async recover(error: GridError): Promise<void> {
    let delay = this.delayMs

    for (let i = 0; i < this.maxRetries; i++) {
      console.log(`Retry attempt ${i + 1}/${this.maxRetries} after ${delay}ms`)
      await new Promise((resolve) => setTimeout(resolve, delay))

      // Retry logic would go here
      // For now, just log
      
      delay *= this.backoffMultiplier
    }
  }
}

export class FallbackStrategy implements RecoveryStrategy {
  constructor(private fallbackData: any[] = []) {}

  canRecover(error: GridError): boolean {
    return error.code === GridErrorCode.DATA_LOAD_FAILED
  }

  async recover(error: GridError): Promise<void> {
    console.log('Using fallback data', this.fallbackData)
    // Recovery logic would go here
  }
}

export class CacheStrategy implements RecoveryStrategy {
  constructor(private cache: Map<string, any> = new Map()) {}

  canRecover(error: GridError): boolean {
    return (
      error.recoverable &&
      [
        GridErrorCode.DATA_LOAD_FAILED,
        GridErrorCode.DATA_NETWORK_ERROR,
      ].includes(error.code)
    )
  }

  async recover(error: GridError): Promise<void> {
    console.log('Attempting to recover from cache')
    // Would check cache and return cached data
  }
}

// ===== GLOBAL ERROR HANDLER INSTANCE =====
export const globalErrorHandler = new GridErrorHandler()

// Setup default handlers
if (process.env.NODE_ENV === 'development') {
  globalErrorHandler.onAny((error) => {
    // Already logged by consoleOutput
  })
}

// Setup severity-based handlers
globalErrorHandler.onSeverity(ErrorSeverity.Critical, (error) => {
  console.error('CRITICAL ERROR:', error.toJSON())
  // Could send to error tracking service
})

// ===== ERROR BOUNDARY =====
export class ErrorBoundary {
  private strategies: RecoveryStrategy[] = []

  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy)
  }

  async handleError(error: GridError): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          await strategy.recover(error)
          return true
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError)
        }
      }
    }
    return false
  }
}

// ===== EXPORT DEFAULT INSTANCE =====
export const defaultErrorBoundary = new ErrorBoundary()
defaultErrorBoundary.addStrategy(new RetryStrategy())
defaultErrorBoundary.addStrategy(new CacheStrategy())
defaultErrorBoundary.addStrategy(new FallbackStrategy())