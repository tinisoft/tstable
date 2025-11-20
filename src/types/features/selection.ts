/**
 * @fileoverview Selection types
 * @module @tsdatagrid/types/features/selection
 */

import type { RowKey } from '../core/base'

/**
 * Selection mode type
 */
export const enum SelectionModeType {
  /** No selection */
  None = 'none',
  
  /** Single row selection */
  Single = 'single',
  
  /** Multiple row selection */
  Multiple = 'multiple',
}

/**
 * Selection persistence
 */
export const enum SelectionPersistence {
  /** Per page */
  Page = 'page',
  
  /** Across all data */
  Data = 'data',
  
  /** Session storage */
  Session = 'session',
  
  /** Local storage */
  Local = 'local',
}

/**
 * Selection mode configuration
 */
export interface SelectionMode {
  /** Mode type */
  mode: SelectionModeType
  
  /** Show checkboxes */
  checkboxes?: boolean
  
  /** Checkbox position */
  checkboxPosition?: 'left' | 'right'
  
  /** Allow select all */
  allowSelectAll?: boolean
  
  /** Select on row click */
  selectOnRowClick?: boolean
  
  /** Deselect on row click */
  deselectOnRowClick?: boolean
  
  /** Persistence mode */
  persistence?: SelectionPersistence
  
  /** Key field */
  keyField?: string
  
  /** Show selection column */
  showSelectionColumn?: boolean
  
  /** Selection column width */
  selectionColumnWidth?: number
}

/**
 * Selection state
 */
export interface SelectionState {
  /** Selected keys */
  selectedKeys: Set<RowKey>
  
  /** Selected indices (page-based) */
  selectedIndices: Set<number>
  
  /** Selected rows */
  selectedRows: any[]
  
  /** Selection mode */
  mode: SelectionModeType
  
  /** All selected (for current page/data) */
  allSelected?: boolean
  
  /** Some selected (for current page/data) */
  someSelected?: boolean
}

/**
 * Selection configuration
 */
export interface SelectionConfig {
  /** Enable selection */
  enabled?: boolean
  
  /** Selection mode */
  mode?: SelectionMode
  
  /** Allowed selection callback */
  allowSelection?: (row: any) => boolean
  
  /** Maximum selections */
  maxSelections?: number
}

/**
 * Selection change event
 */
export interface SelectionChangeEvent<T = any> {
  /** Selected keys */
  selectedKeys: RowKey[]
  
  /** Selected rows */
  selectedRows: T[]
  
  /** Added keys */
  addedKeys: RowKey[]
  
  /** Removed keys */
  removedKeys: RowKey[]
  
  /** Added rows */
  addedRows: T[]
  
  /** Removed rows */
  removedRows: T[]
}