/**
 * @fileoverview Clipboard utilities
 * @module utils/clipboard
 */

export interface ClipboardOptions {
  format?: 'text' | 'html' | 'both'
  mimeType?: string
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(
  text: string,
  options: ClipboardOptions = {}
): Promise<boolean> {
  try {
    const { format = 'text' } = options
    
    if (navigator.clipboard && navigator.clipboard.write && format === 'both') {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([text], { type: 'text/html' })
        })
      ])
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text)
    } else {
      // Fallback for older browsers
      return copyToClipboardFallback(text)
    }
    
    return true
  } catch (error) {
    console.error('Copy to clipboard failed:', error)
    return copyToClipboardFallback(text)
  }
}

/**
 * Fallback copy method for older browsers
 */
function copyToClipboardFallback(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  
  try {
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch (error) {
    document.body.removeChild(textarea)
    return false
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    if (navigator.clipboard) {
      return await navigator.clipboard.readText()
    }
    return null
  } catch (error) {
    console.error('Read from clipboard failed:', error)
    return null
  }
}

/**
 * Check if clipboard API is supported
 */
export function isClipboardSupported(): boolean {
  return !!navigator.clipboard
}

/**
 * Copy HTML table to clipboard
 */
export async function copyTableToClipboard(
  rows: any[][],
  headers?: string[]
): Promise<boolean> {
  const html = generateHTMLTable(rows, headers)
  const text = generateTSV(rows, headers)
  
  try {
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': new Blob([text], { type: 'text/plain' }),
          'text/html': new Blob([html], { type: 'text/html' })
        })
      ])
      return true
    } else {
      return copyToClipboard(text)
    }
  } catch (error) {
    console.error('Copy table failed:', error)
    return false
  }
}

function generateHTMLTable(rows: any[][], headers?: string[]): string {
  let html = '<table>'
  
  if (headers) {
    html += '<thead><tr>'
    headers.forEach(header => {
      html += `<th>${header}</th>`
    })
    html += '</tr></thead>'
  }
  
  html += '<tbody>'
  rows.forEach(row => {
    html += '<tr>'
    row.forEach(cell => {
      html += `<td>${cell ?? ''}</td>`
    })
    html += '</tr>'
  })
  html += '</tbody></table>'
  
  return html
}

function generateTSV(rows: any[][], headers?: string[]): string {
  let text = ''
  
  if (headers) {
    text += headers.join('\t') + '\n'
  }
  
  rows.forEach(row => {
    text += row.map(cell => String(cell ?? '')).join('\t') + '\n'
  })
  
  return text
}