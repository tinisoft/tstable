/**
 * @fileoverview Editing types
 * @module @tsdatagrid/types/features/editing
 */

import type { RowKey, ColumnField } from '../core/base'

/**
 * Editing mode
 */
export const enum EditingMode {
  /** Row editing */
  Row = 'row',
  
  /** Cell editing */
  Cell = 'cell',
  
  /** Batch editing */
  Batch = 'batch',
  
  /** Popup/Form editing */
  Popup = 'popup',
  
  /** Inline form */
  Form = 'form',
}

/**
 * Change type
 */
export const enum ChangeType {
  Insert = 'insert',
  Update = 'update',
  Remove = 'remove',
}

/**
 * Change descriptor
 */
export interface Change<T = any> {
  /** Change type */
  type: ChangeType
  
  /** Row key */
  key: RowKey
  
  /** Changed data */
  data: Partial<T>
  
  /** Original data (for updates) */
  originalData?: T
  
  /** Timestamp */
  timestamp?: Date
}

/**
 * Editing configuration
 */
export interface EditingConfig {
  /** Editing mode */
  mode?: EditingMode
  
  /** Allow updating */
  allowUpdating?: boolean
  
  /** Allow adding */
  allowAdding?: boolean
  
  /** Allow deleting */
  allowDeleting?: boolean
  
  /** Confirm before delete */
  confirmDelete?: boolean
  
  /** Confirm message */
  confirmMessage?: string
  
  /** Use icons in editing buttons */
  useIcons?: boolean
  
  /** Start edit action (click, dblclick) */
  startEditAction?: 'click' | 'dblclick'
  
  /** Select text on edit start */
  selectTextOnEditStart?: boolean
  
  /** Refresh mode after save */
  refreshMode?: 'full' | 'reshape' | 'repaint'
  
  /** New row position */
  newRowPosition?: 'first' | 'last' | 'pageTop' | 'pageBottom'
  
  /** Show editor always (for batch mode) */
  showEditorAlways?: boolean
  
  /** Popup options */
  popup?: PopupEditingOptions
  
  /** Form options */
  form?: FormEditingOptions
}

/**
 * Popup editing options
 */
export interface PopupEditingOptions {
  /** Popup title */
  title?: string
  
  /** Popup width */
  width?: number | string
  
  /** Popup height */
  height?: number | string
  
  /** Show title */
  showTitle?: boolean
  
  /** Show close button */
  showCloseButton?: boolean
  
  /** Close on outside click */
  closeOnOutsideClick?: boolean
  
  /** Fullscreen */
  fullscreen?: boolean
  
  /** Position */
  position?: { x: number; y: number } | 'center'
}

/**
 * Form editing options
 */
export interface FormEditingOptions {
  /** Form label location */
  labelLocation?: 'left' | 'top'
  
  /** Form label width */
  labelWidth?: number | string
  
  /** Column count */
  colCount?: number
  
  /** Custom form items */
  items?: FormItem[]
}

/**
 * Form item
 */
export interface FormItem {
  /** Data field */
  dataField?: string
  
  /** Label */
  label?: string
  
  /** Editor type */
  editorType?: string
  
  /** Editor options */
  editorOptions?: any
  
  /** Visible */
  visible?: boolean
  
  /** Colspan */
  colSpan?: number
  
  /** CSS class */
  cssClass?: string
}

/**
 * Editing state
 */
export interface EditingState {
  /** Editing row key */
  editRowKey: RowKey | null
  
  /** Editing field */
  editField: ColumnField | null
  
  /** Is editing */
  isEditing: boolean
  
  /** Edit mode */
  mode: EditingMode
  
  /** Editing cell */
  editingCell?: { rowKey: RowKey; field: ColumnField } | null
  
  /** Changes (for batch mode) */
  changes?: Change[]
  
  /** Dirty rows */
  dirtyRows?: Set<RowKey>
  
  /** Original values (for cancel) */
  originalValues?: Map<RowKey, any>
  
  /** Validation errors */
  validationErrors?: Map<RowKey, Record<string, string>>
  
  /** Is row editing */
  isRowEditing?: (rowKey: RowKey) => boolean
  
  /** Is cell editing */
  isCellEditing?: (rowKey: RowKey, field: ColumnField) => boolean
  
  /** Is row dirty */
  isRowDirty?: (rowKey: RowKey) => boolean
  
  /** Has changes */
  hasChanges?: () => boolean
}

/**
 * Edit context
 */
export interface EditContext<T = any> {
  /** Row data */
  row: T
  
  /** Row key */
  rowKey: RowKey
  
  /** Field name */
  field?: ColumnField
  
  /** Is new row */
  isNew: boolean
  
  /** Changes */
  changes: Partial<T>
  
  /** Original value */
  originalValue?: any
}

/**
 * Type guard: Check if value is Change
 */
export function isChange(value: any): value is Change {
  return value && typeof value === 'object' && 'type' in value && 'key' in value
}