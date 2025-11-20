/**
 * @fileoverview Logging utilities
 * @module utils/logger
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogOptions {
  level?: LogLevel
  prefix?: string
  timestamp?: boolean
  enabled?: boolean
}

export interface LogEntry {
  level: LogLevel
  message: string
  data?: any
  timestamp: Date
  prefix?: string
}

/**
 * Logger class
 */
export class Logger {
  private options: Required<LogOptions>
  private logs: LogEntry[] = []
  private maxLogs: number = 1000
  
  constructor(options: LogOptions = {}) {
    this.options = {
      level: 'info',
      prefix: '',
      timestamp: true,
      enabled: true,
      ...options
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    if (!this.options.enabled) return false
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.options.level)
  }
  
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const parts: string[] = []
    
    if (this.options.timestamp) {
      parts.push(`[${new Date().toISOString()}]`)
    }
    
    parts.push(`[${level.toUpperCase()}]`)
    
    if (this.options.prefix) {
      parts.push(`[${this.options.prefix}]`)
    }
    
    parts.push(message)
    
    return parts.join(' ')
  }
  
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return
    
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date(),
      prefix: this.options.prefix
    }
    
    this.logs.push(entry)
    
    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
    
    const formatted = this.formatMessage(level, message, data)
    
    switch (level) {
      case 'debug':
        console.debug(formatted, data)
        break
      case 'info':
        console.info(formatted, data)
        break
      case 'warn':
        console.warn(formatted, data)
        break
      case 'error':
        console.error(formatted, data)
        break
    }
  }
  
  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }
  
  info(message: string, data?: any): void {
    this.log('info', message, data)
  }
  
  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }
  
  error(message: string, data?: any): void {
    this.log('error', message, data)
  }
  
  getLogs(): LogEntry[] {
    return [...this.logs]
  }
  
  clearLogs(): void {
    this.logs = []
  }
  
  setLevel(level: LogLevel): void {
    this.options.level = level
  }
  
  enable(): void {
    this.options.enabled = true
  }
  
  disable(): void {
    this.options.enabled = false
  }
}

// Default logger instance
export const logger = new Logger({
  prefix: 'TSDataGrid',
  enabled: process.env.NODE_ENV === 'development'
})

/**
 * Create logger with prefix
 */
export function createLogger(prefix: string, options?: LogOptions): Logger {
  return new Logger({ ...options, prefix })
}