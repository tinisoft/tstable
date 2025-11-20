/**
 * @fileoverview String manipulation utilities
 * @module utils/string
 */

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalize all words
 */
export function titleCase(str: string): string {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ')
}

/**
 * Convert to camelCase
 */
export function camelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, chr => chr.toLowerCase())
}

/**
 * Convert to PascalCase
 */
export function pascalCase(str: string): string {
  const camel = camelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/**
 * Convert to snake_case
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/\s+/g, '_')
}

/**
 * Convert to kebab-case
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '-$1')
    .toLowerCase()
    .replace(/^-/, '')
    .replace(/\s+/g, '-')
}

/**
 * Truncate string
 */
export function truncate(
  str: string,
  length: number,
  suffix: string = '...'
): string {
  if (str.length <= length) return str
  return str.slice(0, length - suffix.length) + suffix
}

/**
 * Pad start
 */
export function padStart(
  str: string,
  length: number,
  char: string = ' '
): string {
  return str.padStart(length, char)
}

/**
 * Pad end
 */
export function padEnd(
  str: string,
  length: number,
  char: string = ' '
): string {
  return str.padEnd(length, char)
}

/**
 * Remove whitespace
 */
export function trim(str: string): string {
  return str.trim()
}

/**
 * Remove all whitespace
 */
export function removeWhitespace(str: string): string {
  return str.replace(/\s+/g, '')
}

/**
 * Escape HTML
 */
export function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

/**
 * Unescape HTML
 */
export function unescapeHtml(str: string): string {
  const div = document.createElement('div')
  div.innerHTML = str
  return div.textContent || ''
}

/**
 * Slugify string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Count occurrences
 */
export function countOccurrences(str: string, search: string): number {
  return (str.match(new RegExp(search, 'g')) || []).length
}

/**
 * Reverse string
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('')
}

/**
 * Check if string is empty
 */
export function isEmpty(str: string | null | undefined): boolean {
  return !str || str.trim().length === 0
}

/**
 * Check if string contains
 */
export function contains(
  str: string,
  search: string,
  caseSensitive: boolean = false
): boolean {
  if (caseSensitive) {
    return str.includes(search)
  }
  return str.toLowerCase().includes(search.toLowerCase())
}

/**
 * Replace all occurrences
 */
export function replaceAll(
  str: string,
  search: string,
  replace: string
): string {
  return str.split(search).join(replace)
}

/**
 * Word count
 */
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).length
}

/**
 * Character count (excluding spaces)
 */
export function charCount(str: string, includeSpaces: boolean = true): number {
  if (includeSpaces) {
    return str.length
  }
  return str.replace(/\s/g, '').length
}

/**
 * Extract numbers from string
 */
export function extractNumbers(str: string): number[] {
  const matches = str.match(/\d+/g)
  return matches ? matches.map(Number) : []
}

/**
 * Format bytes
 */
export function formatBytesString(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format number with commas
 */
export function formatNumberString(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Parse template string
 */
export function template(
  str: string,
  data: Record<string, any>
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : match
  })
}