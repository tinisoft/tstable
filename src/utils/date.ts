/**
 * @fileoverview Date manipulation utilities
 * @module utils/date
 */

/**
 * Format date
 */
export function formatDateString(
  date: Date | string | number,
  format: string = 'YYYY-MM-DD'
): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return ''
  }
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * Parse date string
 */
export function parseDate(dateStr: string, format: string = 'YYYY-MM-DD'): Date | null {
  try {
    // Simple parsing for common formats
    if (format === 'YYYY-MM-DD') {
      const [year, month, day] = dateStr.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    
    if (format === 'MM/DD/YYYY') {
      const [month, day, year] = dateStr.split('/').map(Number)
      return new Date(year, month - 1, day)
    }
    
    // Fallback to native parsing
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Add days to date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Add months to date
 */
export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

/**
 * Add years to date
 */
export function addYears(date: Date, years: number): Date {
  const result = new Date(date)
  result.setFullYear(result.getFullYear() + years)
  return result
}

/**
 * Get start of day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get start of week
 */
export function startOfWeek(date: Date, weekStartsOn: number = 0): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn
  
  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of week
 */
export function endOfWeek(date: Date, weekStartsOn: number = 0): Date {
  const result = startOfWeek(date, weekStartsOn)
  result.setDate(result.getDate() + 6)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date): Date {
  const result = new Date(date)
  result.setDate(1)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + 1, 0)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get start of year
 */
export function startOfYear(date: Date): Date {
  const result = new Date(date)
  result.setMonth(0, 1)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Get end of year
 */
export function endOfYear(date: Date): Date {
  const result = new Date(date)
  result.setMonth(11, 31)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Get difference in days
 */
export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  const utc1 = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate())
  const utc2 = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate())
  
  return Math.floor((utc1 - utc2) / msPerDay)
}

/**
 * Get difference in hours
 */
export function differenceInHours(dateLeft: Date, dateRight: Date): number {
  const msPerHour = 60 * 60 * 1000
  return Math.floor((dateLeft.getTime() - dateRight.getTime()) / msPerHour)
}

/**
 * Get difference in minutes
 */
export function differenceInMinutes(dateLeft: Date, dateRight: Date): number {
  const msPerMinute = 60 * 1000
  return Math.floor((dateLeft.getTime() - dateRight.getTime()) / msPerMinute)
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = addDays(new Date(), -1)
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  )
}

/**
 * Check if date is this week
 */
export function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)
  
  return date >= weekStart && date <= weekEnd
}

/**
 * Check if date is this month
 */
export function isThisMonth(date: Date): boolean {
  const now = new Date()
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  )
}

/**
 * Check if date is this year
 */
export function isThisYear(date: Date): boolean {
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
}

/**
 * Check if date is weekend
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Check if date is valid
 */
export function isValidDate(date: any): boolean {
  return date instanceof Date && !isNaN(date.getTime())
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelative(date: Date, baseDate: Date = new Date()): string {
  const diffMs = baseDate.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffSeconds < 60) {
    return 'just now'
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks !== 1 ? 's' : ''} ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months !== 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} year${years !== 1 ? 's' : ''} ago`
  }
}