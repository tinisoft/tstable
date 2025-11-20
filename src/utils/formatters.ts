/**
 * @fileoverview Enhanced formatting utility
 * @module utils/formatters
 */

import type { ColumnDefinition } from '../types/core/column'
import { ColumnFormat, ColumnType } from '../types/core/column'

export interface FormatOptions {
  locale?: string
  currency?: string
  dateStyle?: 'short' | 'medium' | 'long' | 'full'
  timeStyle?: 'short' | 'medium' | 'long' | 'full'
  decimals?: number
  highlightNegative?: boolean
  nullDisplay?: string
  format?: 'datetime' | 'short' | 'medium' | 'long' | 'full'
  useGrouping?: boolean
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  timeZone?: string
}

const defaultOptions: FormatOptions = {
  locale: 'en-US',
  currency: 'USD',
  nullDisplay: '',
  useGrouping: true
}

// ===== CACHE FOR FORMATTERS =====
const formatterCache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>()

const getOrCreateFormatter = <T extends Intl.NumberFormat | Intl.DateTimeFormat>(
  cacheKey: string,
  factory: () => T
): T => {
  if (!formatterCache.has(cacheKey)) {
    formatterCache.set(cacheKey, factory())
  }
  return formatterCache.get(cacheKey) as T
}

// ===== FORMAT CURRENCY =====
export const formatCurrency = (
  value: number | string,
  options: FormatOptions & { currency?: string } = {}
): string => {
  const num = Number(value)
  if (isNaN(num)) return options.nullDisplay || defaultOptions.nullDisplay || ''
  
  const locale = options.locale || defaultOptions.locale
  const currency = options.currency || defaultOptions.currency
  const cacheKey = `currency-${locale}-${currency}`
  
  const formatter = getOrCreateFormatter(
    cacheKey,
    () => new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: options.minimumFractionDigits,
      maximumFractionDigits: options.maximumFractionDigits
    })
  )
  
  return formatter.format(num)
}

// ===== FORMAT PERCENT =====
export const formatPercent = (
  value: number | string,
  options: FormatOptions & { decimals?: number; multiplier?: number } = {}
): string => {
  const num = Number(value)
  if (isNaN(num)) return options.nullDisplay || defaultOptions.nullDisplay || ''
  
  const locale = options.locale || defaultOptions.locale
  const decimals = options.decimals ?? 2
  const multiplier = options.multiplier ?? 100 // If value is 0.5, multiply by 100 to get 50%
  const cacheKey = `percent-${locale}-${decimals}`
  
  const formatter = getOrCreateFormatter(
    cacheKey,
    () => new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  )
  
  return formatter.format(num / multiplier)
}

// ===== FORMAT NUMBER =====
export const formatNumber = (
  value: number | string,
  options: FormatOptions & { decimals?: number } = {}
): string => {
  const num = Number(value)
  if (isNaN(num)) return options.nullDisplay || defaultOptions.nullDisplay || ''
  
  const locale = options.locale || defaultOptions.locale
  const decimals = options.decimals ?? 2
  const useGrouping = options.useGrouping ?? true
  const cacheKey = `number-${locale}-${decimals}-${useGrouping}`
  
  const formatter = getOrCreateFormatter(
    cacheKey,
    () => new Intl.NumberFormat(locale, {
      minimumFractionDigits: options.minimumFractionDigits ?? 0,
      maximumFractionDigits: options.maximumFractionDigits ?? decimals,
      useGrouping
    })
  )
  
  const formatted = formatter.format(num)
  
  if (options.highlightNegative && num < 0) {
    return `<span class="negative">${formatted}</span>`
  }
  
  return formatted
}

// ===== FORMAT DATE =====
export const formatDate = (
  value: any,
  options: FormatOptions = {}
): string => {
  let date: Date
  
  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'string' || typeof value === 'number') {
    date = new Date(value)
  } else {
    return options.nullDisplay || defaultOptions.nullDisplay || ''
  }
  
  if (isNaN(date.getTime())) {
    return options.nullDisplay || defaultOptions.nullDisplay || ''
  }

  const locale = options.locale || defaultOptions.locale
  const { dateStyle, timeStyle, format, timeZone } = options

  let formatOptions: Intl.DateTimeFormatOptions = {}

  if (format === 'datetime') {
    formatOptions = {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone
    }
  } else if (format && ['short', 'medium', 'long', 'full'].includes(format)) {
    formatOptions = {
      dateStyle: format as 'short' | 'medium' | 'long' | 'full',
      timeZone
    }
  } else {
    formatOptions = {
      dateStyle: dateStyle || 'short',
      timeStyle,
      timeZone
    }
  }

  const cacheKey = `date-${locale}-${JSON.stringify(formatOptions)}`
  
  const formatter = getOrCreateFormatter(
    cacheKey,
    () => new Intl.DateTimeFormat(locale, formatOptions)
  )

  return formatter.format(date)
}

// ===== FORMAT DATETIME =====
export const formatDateTime = (
  value: any,
  options: FormatOptions = {}
): string => {
  return formatDate(value, {
    ...options,
    dateStyle: options.dateStyle || 'short',
    timeStyle: options.timeStyle || 'short'
  })
}

// ===== FORMAT TIME =====
export const formatTime = (
  value: any,
  options: FormatOptions = {}
): string => {
  return formatDate(value, {
    ...options,
    timeStyle: options.timeStyle || 'short'
  })
}

// ===== FORMAT BOOLEAN =====
export const formatBoolean = (
  value: boolean | string | number,
  options?: { trueText?: string; falseText?: string; nullText?: string }
): string => {
  if (value == null) return options?.nullText || ''
  const boolValue = Boolean(value)
  return boolValue ? (options?.trueText || 'Yes') : (options?.falseText || 'No')
}

// ===== FORMAT BYTES =====
export const formatBytes = (
  bytes: number | string,
  decimals: number = 2
): string => {
  const num = Number(bytes)
  if (isNaN(num) || num === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(num) / Math.log(k))

  return `${parseFloat((num / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

// ===== FORMAT PHONE =====
export const formatPhone = (
  value: string | number,
  format: 'US' | 'international' = 'US'
): string => {
  const cleaned = String(value).replace(/\D/g, '')
  
  if (format === 'US') {
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
  }
  
  return String(value)
}

// ===== FORMAT SSN =====
export const formatSSN = (value: string | number): string => {
  const cleaned = String(value).replace(/\D/g, '')
  
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`
  }
  
  return String(value)
}

// ===== FORMAT CREDIT CARD =====
export const formatCreditCard = (value: string | number): string => {
  const cleaned = String(value).replace(/\D/g, '')
  const groups = cleaned.match(/.{1,4}/g) || []
  return groups.join(' ')
}

// ===== FORMAT LOOKUP =====
export const formatLookup = (
  value: any,
  lookupData: any[],
  keyField: string,
  displayField: string
): string => {
  const item = lookupData.find((item) => item[keyField] === value)
  return item ? String(item[displayField] ?? value) : String(value ?? '')
}

// ===== FORMAT ARRAY =====
export const formatArray = (
  value: any[],
  options: {
    separator?: string
    maxItems?: number
    moreText?: string
  } = {}
): string => {
  if (!Array.isArray(value)) return String(value ?? '')
  
  const { separator = ', ', maxItems, moreText = 'more' } = options
  
  if (maxItems && value.length > maxItems) {
    const shown = value.slice(0, maxItems)
    const remaining = value.length - maxItems
    return `${shown.join(separator)} (+${remaining} ${moreText})`
  }
  
  return value.join(separator)
}

// ===== FORMAT DURATION =====
export const formatDuration = (
  milliseconds: number,
  options: {
    format?: 'long' | 'short' | 'compact'
    maxUnits?: number
  } = {}
): string => {
  const { format = 'short', maxUnits = 2 } = options
  
  const units = [
    { label: 'day', short: 'd', value: 86400000 },
    { label: 'hour', short: 'h', value: 3600000 },
    { label: 'minute', short: 'm', value: 60000 },
    { label: 'second', short: 's', value: 1000 },
    { label: 'millisecond', short: 'ms', value: 1 }
  ]
  
  const parts: string[] = []
  let remaining = Math.abs(milliseconds)
  
  for (const unit of units) {
    if (parts.length >= maxUnits) break
    
    const count = Math.floor(remaining / unit.value)
    if (count > 0) {
      remaining -= count * unit.value
      
      if (format === 'long') {
        parts.push(`${count} ${unit.label}${count !== 1 ? 's' : ''}`)
      } else if (format === 'short') {
        parts.push(`${count}${unit.short}`)
      } else {
        parts.push(`${count}${unit.short}`)
      }
    }
  }
  
  const result = parts.join(format === 'long' ? ', ' : ' ')
  return milliseconds < 0 ? `-${result}` : result
}

// ===== FORMAT RELATIVE TIME =====
export const formatRelativeTime = (
  date: Date | string | number,
  baseDate: Date = new Date()
): string => {
  const d = date instanceof Date ? date : new Date(date)
  const base = baseDate instanceof Date ? baseDate : new Date(baseDate)
  
  const diffMs = base.getTime() - d.getTime()
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)
  
  const future = diffMs < 0
  const prefix = future ? 'in ' : ''
  const suffix = future ? '' : ' ago'
  
  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${prefix}${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}${suffix}`
  } else if (diffHours < 24) {
    return `${prefix}${diffHours} hour${diffHours !== 1 ? 's' : ''}${suffix}`
  } else if (diffDays < 7) {
    return `${prefix}${diffDays} day${diffDays !== 1 ? 's' : ''}${suffix}`
  } else if (diffWeeks < 4) {
    return `${prefix}${diffWeeks} week${diffWeeks !== 1 ? 's' : ''}${suffix}`
  } else if (diffMonths < 12) {
    return `${prefix}${diffMonths} month${diffMonths !== 1 ? 's' : ''}${suffix}`
  } else {
    return `${prefix}${diffYears} year${diffYears !== 1 ? 's' : ''}${suffix}`
  }
}

// ===== FORMAT ORDINAL =====
export const formatOrdinal = (n: number): string => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ===== INFER TYPE =====
const inferType = (value: any): ColumnType => {
  if (value instanceof Date) return ColumnType.Date
  if (typeof value === 'boolean') return ColumnType.Boolean
  if (typeof value === 'number') return ColumnType.Number
  return ColumnType.String
}

// ===== MAIN FORMAT VALUE =====
export function formatValue(
  value: any,
  row: any,
  column: ColumnDefinition,
  options: FormatOptions = {}
): string {
  // Use custom formatter if provided
  if (column.formatter) {
    try {
      const result = column.formatter(value, row, column)
      return typeof result === 'string' ? result : String(result ?? '')
    } catch (error) {
      console.warn('Custom formatter error:', error)
    }
  }

  // Handle null/undefined
  if (value == null) {
    return options.nullDisplay ?? defaultOptions.nullDisplay ?? ''
  }

  const colType = column.type || inferType(value)
  const colFormat = column.format

  // Type-based formatting
  switch (colType) {
    case ColumnType.Number:
      if (colFormat === ColumnFormat.Currency) return formatCurrency(value, options)
      if (colFormat === ColumnFormat.Percent) return formatPercent(value, options)
      return formatNumber(value, options)

    case ColumnType.Currency:
      return formatCurrency(value, options)

    case ColumnType.Percent:
      return formatPercent(value, options)

    case ColumnType.Date:
      return formatDate(value, {
        ...options,
        dateStyle: options.dateStyle || 'short'
      })

    case ColumnType.DateTime:
      return formatDateTime(value, options)

    case ColumnType.Boolean:
      return formatBoolean(value)

    case ColumnType.String:
    default:
      return String(value)
  }
}

// ===== BATCH FORMATTING =====
export const formatRowValues = (
  row: any,
  columns: ColumnDefinition[],
  options: FormatOptions = {}
): Record<string, string> => {
  return columns.reduce((formatted, col) => {
    const value = row[String(col.field)]
    formatted[String(col.field)] = formatValue(value, row, col, options)
    return formatted
  }, {} as Record<string, string>)
}

// ===== SAFE FORMAT =====
export const safeFormatValue = (
  value: any,
  row: any,
  column: ColumnDefinition,
  options: FormatOptions = {}
): string => {
  try {
    return formatValue(value, row, column, options)
  } catch (error) {
    console.error('Formatting error:', error)
    return String(value ?? '')
  }
}

// ===== CLEAR CACHE =====
export const clearFormatterCache = () => {
  formatterCache.clear()
}

// ===== GET CACHE SIZE =====
export const getFormatterCacheSize = (): number => {
  return formatterCache.size
}

// ===== CUSTOM FORMATTERS =====
export const customFormatters = new Map<string, (value: any, options?: any) => string>()

export const registerFormatter = (
  name: string,
  formatter: (value: any, options?: any) => string
) => {
  customFormatters.set(name, formatter)
}

export const getFormatter = (name: string) => {
  return customFormatters.get(name)
}

export const hasFormatter = (name: string): boolean => {
  return customFormatters.has(name)
}