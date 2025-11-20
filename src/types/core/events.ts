/**
 * @fileoverview Grid event types
 * @module @tsdatagrid/types/core/events
 */

import type { ColumnDefinition } from './column'
import type { FilterCondition, ActiveFilter } from '../features/filtering'
import type { SortDescriptor } from '../features/sorting'
import type { GroupDescriptor } from '../features/grouping'
import type { EditingMode } from '../features/editing'
import type { ExportConfig } from '../features/export'
import type { ErrorInfo, CancellableEvent } from './base'

/**
 * Row event
 */
export interface RowEvent<T = any> extends CancellableEvent {
  /** Row data */
  row: T
  
  /** Row index */
  rowIndex: number
  
  /** Row key */
  rowKey: any
  
  /** Mouse event */
  event?: MouseEvent
  
  /** Column (for cell events) */
  column?: ColumnDefinition
  
  /** Handled flag */
  handled?: boolean
}

/**
 * Cell event
 */
export interface CellEvent<T = any> extends RowEvent<T> {
  /** Column definition */
  column: ColumnDefinition
  
  /** Cell value */
  value: any
  
  /** Column index */
  columnIndex: number
  
  /** Display value */
  displayValue: string
}

/**
 * Edit event
 */
export interface EditEvent<T = any> extends CancellableEvent {
  /** Row data */
  row: T
  
  /** Row key */
  rowKey: any
  
  /** Changes */
  changes: Partial<T>
  
  /** Edit mode */
  mode: EditingMode
  
  /** Is new row */
  isNew: boolean
}

/**
 * Validation event
 */
export interface ValidationEvent<T = any> {
  /** Row data */
  row: T
  
  /** Row key */
  rowKey: any
  
  /** Field name */
  field: string
  
  /** Field value */
  value: any
  
  /** Validation errors */
  errors: Record<string, string>
  
  /** Is valid */
  isValid: boolean
}

/**
 * Selection event
 */
export interface SelectionEvent<T = any> extends CancellableEvent {
  /** Selected keys */
  selectedKeys: any[]
  
  /** Selected rows */
  selectedRows: T[]
  
  /** Added keys */
  addedKeys?: any[]
  
  /** Removed keys */
  removedKeys?: any[]
  
  /** Selection mode */
  mode: 'single' | 'multiple'
}

/**
 * Data event
 */
export interface DataEvent<T = any> {
  /** Data */
  data: T[]
  
  /** Total count */
  totalCount: number
  
  /** Load options */
  loadOptions?: any
  
  /** Duration (ms) */
  duration?: number
}

/**
 * Export event
 */
export interface ExportEvent extends CancellableEvent {
  /** Export configuration */
  config: ExportConfig
  
  /** Export data */
  data?: any[]
  
  /** File blob */
  file?: Blob
  
  /** Download URL */
  url?: string
}

/**
 * Column event
 */
export interface ColumnEvent extends CancellableEvent {
  /** Column */
  column: ColumnDefinition
  
  /** Old value */
  oldValue?: any
  
  /** New value */
  newValue?: any
}

/**
 * Context menu event
 */
export interface ContextMenuEvent<T = any> extends CancellableEvent {
  /** Row data */
  row?: T
  
  /** Column */
  column?: ColumnDefinition
  
  /** Mouse event */
  event: MouseEvent
  
  /** Menu items */
  items?: ContextMenuItem[]
}

/**
 * Context menu item
 */
export interface ContextMenuItem {
  /** Item text */
  text: string
  
  /** Item icon */
  icon?: string
  
  /** Disabled */
  disabled?: boolean
  
  /** On click */
  onClick?: () => void
  
  /** Children */
  items?: ContextMenuItem[]
}

/**
 * Keyboard event
 */
export interface GridKeyboardEvent extends CancellableEvent {
  /** Key code */
  key: string
  
  /** Ctrl key */
  ctrlKey: boolean
  
  /** Shift key */
  shiftKey: boolean
  
  /** Alt key */
  altKey: boolean
  
  /** Meta key */
  metaKey: boolean
  
  /** Target element */
  target: HTMLElement
  
  /** Original event */
  event: KeyboardEvent
}

/**
 * Grid events interface
 */
export interface GridEvents<T = any> {
  // ===== ROW EVENTS =====
  
  /** Row click */
  'row-click': (e: RowEvent<T>) => void
  
  /** Row double click */
  'row-dblclick': (e: RowEvent<T>) => void
  
  /** Row context menu */
  'row-contextmenu': (e: ContextMenuEvent<T>) => void
  
  /** Row prepared */
  'row-prepared': (e: RowEvent<T>) => void
  
  // ===== CELL EVENTS =====
  
  /** Cell click */
  'cell-click': (e: CellEvent<T>) => void
  
  /** Cell double click */
  'cell-dblclick': (e: CellEvent<T>) => void
  
  /** Cell prepared */
  'cell-prepared': (e: CellEvent<T>) => void
  
  // ===== EDIT EVENTS =====
  
  /** Edit start */
  'edit-start': (e: EditEvent<T>) => void
  
  /** Edit end */
  'edit-end': (e: EditEvent<T>) => void
  
  /** Edit cancel */
  'edit-cancel': (e: EditEvent<T>) => void
  
  /** Row inserting */
  'row-inserting': (e: EditEvent<T>) => void
  
  /** Row inserted */
  'row-inserted': (e: EditEvent<T>) => void
  
  /** Row updating */
  'row-updating': (e: EditEvent<T>) => void
  
  /** Row updated */
  'row-updated': (e: EditEvent<T>) => void
  
  /** Row removing */
  'row-removing': (e: RowEvent<T>) => void
  
  /** Row removed */
  'row-removed': (e: RowEvent<T>) => void
  
  /** Validation */
  'validation': (e: ValidationEvent<T>) => void
  
  // ===== SELECTION EVENTS =====
  
  /** Selection changed */
  'selection-changed': (e: SelectionEvent<T>) => void
  
  // ===== DATA EVENTS =====
  
  /** Data loading */
  'data-loading': () => void
  
  /** Data loaded */
  'data-loaded': (e: DataEvent<T>) => void
  
  /** Data error */
  'data-error': (e: { error: ErrorInfo }) => void
  
  // ===== FILTER EVENTS =====
  
  /** Filter changed */
  'filter-changed': (e: { filters: FilterCondition[]; activeFilters: ActiveFilter[] }) => void
  
  /** Filter cleared */
  'filter-cleared': () => void
  
  // ===== SORT EVENTS =====
  
  /** Sort changed */
 'sort-changed': (sort: SortDescriptor[]) => void
  
  // ===== GROUP EVENTS =====
  
  /** Group changed */
  'group-changed': (e: { groups: GroupDescriptor[] }) => void
  
  /** Group expanded */
  'group-expanded': (e: { group: any }) => void
  
  /** Group collapsed */
  'group-collapsed': (e: { group: any }) => void
  
  // ===== PAGINATION EVENTS =====
  
  /** Page changed */
  'page-changed': (e: { page: number; pageSize: number }) => void
  
  /** Page size changed */
  'page-size-changed': (e: { pageSize: number }) => void
  
  // ===== EXPORT EVENTS =====
  
  /** Export starting */
  'export-starting': (e: ExportEvent) => void
  
  /** Export complete */
  'export-complete': (e: ExportEvent) => void
  
  // ===== COLUMN EVENTS =====
  
  /** Column resized */
  'column-resized': (e: ColumnEvent & { width: number }) => void
  
  /** Column reordered */
  'column-reordered': (e: { oldIndex: number; newIndex: number; column: ColumnDefinition }) => void
  
  /** Column visibility changed */
  'column-visibility-changed': (e: ColumnEvent & { visible: boolean }) => void
  
  // ===== STATE EVENTS =====
  
  /** State changed */
  'state-changed': (e: { state: any }) => void
  
  /** State loaded */
  'state-loaded': (e: { state: any }) => void
  
  /** State saved */
  'state-saved': (e: { state: any }) => void
  
  // ===== SEARCH EVENTS =====
  
  /** Search changed */
  'search': (e: { term: string }) => void
  
  // ===== KEYBOARD EVENTS =====
  
  /** Key down */
  'key-down': (e: GridKeyboardEvent) => void
  
  /** Key up */
  'key-up': (e: GridKeyboardEvent) => void
  
  // ===== CONTEXT MENU =====
  
  /** Context menu */
  'context-menu': (e: ContextMenuEvent<T>) => void
  
  // ===== LIFECYCLE =====
  
  /** Initialized */
  'initialized': () => void
  
  /** Disposed */
  'disposed': () => void
}

/**
 * Event emitter type
 */
export type GridEmit<T = any> = <K extends keyof GridEvents<T>>(
  event: K,
  ...args: Parameters<GridEvents<T>[K]>
) => void