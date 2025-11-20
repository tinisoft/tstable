/**
 * @fileoverview Number utilities
 * @module utils/number
 */

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Round to decimal places
 */
export function round(value: number, decimals: number = 0): number {
  const multiplier = Math.pow(10, decimals)
  return Math.round(value * multiplier) / multiplier
}

/**
 * Format as currency
 */
export function formatCurrencyString(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(value)
}

/**
 * Parse number from string
 */
export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? null : parsed
}

/**
 * Check if value is number
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value)
}

/**
 * Check if value is integer
 */
export function isInteger(value: any): boolean {
  return isNumber(value) && Number.isInteger(value)
}

/**
 * Random number between min and max
 */
export function random(min: number, max: number, decimals: number = 0): number {
  const value = Math.random() * (max - min) + min
  return decimals > 0 ? round(value, decimals) : Math.floor(value)
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100
}

/**
 * Calculate average
 */
export function average(numbers: number[]): number {
  if (numbers.length === 0) return 0
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
}

/**
 * Calculate median
 */
export function median(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

/**
 * Calculate standard deviation
 */
export function standardDeviation(numbers: number[]): number {
  if (numbers.length === 0) return 0
  
  const avg = average(numbers)
  const squareDiffs = numbers.map(n => Math.pow(n - avg, 2))
  const avgSquareDiff = average(squareDiffs)
  
  return Math.sqrt(avgSquareDiff)
}

/**
 * Calculate sum
 */
export function sum(numbers: number[]): number {
  return numbers.reduce((total, n) => total + n, 0)
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1)
}

/**
 * Map value from one range to another
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin
}

/**
 * Check if number is in range
 */
export function inRange(
  value: number,
  min: number,
  max: number,
  inclusive: boolean = true
): boolean {
  return inclusive
    ? value >= min && value <= max
    : value > min && value < max
}

/**
 * Convert to ordinal (1st, 2nd, 3rd, etc.)
 */
export function toOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${round(bytes / Math.pow(k, i), decimals)} ${sizes[i]}`
}

/**
 * Calculate compound interest
 */
export function compoundInterest(
  principal: number,
  rate: number,
  years: number,
  timesCompounded: number = 1
): number {
  return principal * Math.pow(1 + rate / timesCompounded, timesCompounded * years)
}