/**
 * @fileoverview Keyboard navigation types
 * @module @tsdatagrid/types/features/keyboard
 */

import type { RowKey, ColumnField } from '../core/base'

/**
 * Keyboard key
 */
export const enum Key {
  ArrowUp = 'ArrowUp',
  ArrowDown = 'ArrowDown',
  ArrowLeft = 'ArrowLeft',
  ArrowRight = 'ArrowRight',
  Enter = 'Enter',
  Escape = 'Escape',
  Tab = 'Tab',
  Space = 'Space',
  Home = 'Home',
  End = 'End',
  PageUp = 'PageUp',
  PageDown = 'PageDown',
  Delete = 'Delete',
  Backspace = 'Backspace',
  F2 = 'F2',
  A = 'a',
  C = 'c',
  V = 'v',
  X = 'x',
  Z = 'z',
  Y = 'y',
}

/**
 * Keyboard action
 */
export const enum KeyboardAction {
  NavigateUp = 'navigateUp',
  NavigateDown = 'navigateDown',
  NavigateLeft = 'navigateLeft',
  NavigateRight = 'navigateRight',
  NavigateFirst = 'navigateFirst',
  NavigateLast = 'navigateLast',
  NavigatePageUp = 'navigatePageUp',
  NavigatePageDown = 'navigatePageDown',
  SelectRow = 'selectRow',
  SelectAll = 'selectAll',
  DeselectAll = 'deselectAll',
  EditCell = 'editCell',
  SaveEdit = 'saveEdit',
  CancelEdit = 'cancelEdit',
  DeleteRow = 'deleteRow',
  Copy = 'copy',
  Paste = 'paste',
  Cut = 'cut',
  Undo = 'undo',
  Redo = 'redo',
  ExpandGroup = 'expandGroup',
  CollapseGroup = 'collapseGroup',
}

/**
 * Keyboard shortcut
 */
export interface KeyboardShortcut {
  /** Key */
  key: Key | string
  
  /** Ctrl key */
  ctrlKey?: boolean
  
  /** Shift key */
  shiftKey?: boolean
  
  /** Alt key */
  altKey?: boolean
  
  /** Meta key */
  metaKey?: boolean
  
  /** Action */
  action: KeyboardAction
  
  /** Description */
  description?: string
  
  /** Enabled */
  enabled?: boolean
}

/**
 * Focus position
 */
export interface FocusPosition {
  /** Row key */
  rowKey: RowKey
  
  /** Column field */
  columnField: ColumnField
  
  /** Row index */
  rowIndex: number
  
  /** Column index */
  columnIndex: number
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavigationConfig {
  /** Enable keyboard navigation */
  enabled?: boolean
  
  /** Enable cell navigation */
  cellNavigation?: boolean
  
  /** Enable row navigation */
  rowNavigation?: boolean
  
  /** Enable editing shortcuts */
  editingShortcuts?: boolean
  
  /** Enable selection shortcuts */
  selectionShortcuts?: boolean
  
  /** Enable clipboard shortcuts */
  clipboardShortcuts?: boolean
  
  /** Custom shortcuts */
  customShortcuts?: KeyboardShortcut[]
  
  /** Enter key action */
  enterKeyAction?: 'startEdit' | 'moveFocus' | 'none'
  
  /** Enter key direction */
  enterKeyDirection?: 'down' | 'right' | 'none'
  
  /** Edit on key press */
  editOnKeyPress?: boolean
}

/**
 * Keyboard navigation state
 */
export interface KeyboardNavigationState {
  /** Focused position */
  focusedPosition: FocusPosition | null
  
  /** Focus visible */
  focusVisible: boolean
  
  /** Active shortcuts */
  activeShortcuts: KeyboardShortcut[]
}