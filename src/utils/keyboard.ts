/**
 * @fileoverview Keyboard utilities
 * @module utils/keyboard
 */

export interface KeyboardEventInfo {
  key: string
  code: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  isModifierKey: boolean
  isNavigationKey: boolean
  isEditingKey: boolean
}

/**
 * Parse keyboard event
 */
export function parseKeyboardEvent(event: KeyboardEvent): KeyboardEventInfo {
  return {
    key: event.key,
    code: event.code,
    ctrlKey: event.ctrlKey,
    shiftKey: event.shiftKey,
    altKey: event.altKey,
    metaKey: event.metaKey,
    isModifierKey: isModifierKey(event.key),
    isNavigationKey: isNavigationKey(event.key),
    isEditingKey: isEditingKey(event.key)
  }
}

/**
 * Check if key is modifier
 */
export function isModifierKey(key: string): boolean {
  return ['Control', 'Shift', 'Alt', 'Meta'].includes(key)
}

/**
 * Check if key is navigation
 */
export function isNavigationKey(key: string): boolean {
  return [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Home', 'End', 'PageUp', 'PageDown'
  ].includes(key)
}

/**
 * Check if key is editing
 */
export function isEditingKey(key: string): boolean {
  return ['Enter', 'Escape', 'F2', 'Delete', 'Backspace'].includes(key)
}

/**
 * Check if key combination matches
 */
export function matchesKeyCombo(
  event: KeyboardEvent,
  key: string,
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
): boolean {
  if (event.key !== key) return false
  
  if (modifiers) {
    if (modifiers.ctrl !== undefined && event.ctrlKey !== modifiers.ctrl) return false
    if (modifiers.shift !== undefined && event.shiftKey !== modifiers.shift) return false
    if (modifiers.alt !== undefined && event.altKey !== modifiers.alt) return false
    if (modifiers.meta !== undefined && event.metaKey !== modifiers.meta) return false
  }
  
  return true
}

/**
 * Get keyboard shortcut string
 */
export function getShortcutString(
  key: string,
  modifiers?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
): string {
  const parts: string[] = []
  
  if (modifiers?.ctrl) parts.push('Ctrl')
  if (modifiers?.shift) parts.push('Shift')
  if (modifiers?.alt) parts.push('Alt')
  if (modifiers?.meta) parts.push('Cmd')
  
  parts.push(key)
  
  return parts.join('+')
}

/**
 * Prevent default key behavior
 */
export function preventDefaultKeys(
  event: KeyboardEvent,
  keys: string[]
): boolean {
  if (keys.includes(event.key)) {
    event.preventDefault()
    return true
  }
  return false
}

/**
 * Create keyboard event handler
 */
export function createKeyHandler(
  handlers: Record<string, (event: KeyboardEvent) => void>
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const key = event.key
    const handler = handlers[key]
    
    if (handler) {
      handler(event)
    }
  }
}