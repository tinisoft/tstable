/**
 * @fileoverview Column definition types
 * @module @tsdatagrid/types/core/column
 */

import type { VNode, Component } from 'vue'
import type { Alignment, ColumnField } from './base'
import type { SortDirection } from '../features/sorting'
import type { FilterCondition } from '../features/filtering'
import type { AggregateFunction } from '../features/grouping'
import type { ValidationRule } from '../validation/validators'

/**
 * Column data types
 */
export const enum ColumnType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  DateTime = 'datetime',
  Boolean = 'boolean',
  Currency = 'currency',
  Percent = 'percent',
  Custom = 'custom',
}

/**
 * Column format types
 */
export const enum ColumnFormat {
  Currency = 'currency',
  Percent = 'percent',
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
  Number = 'number',
  Decimal = 'decimal',
  Custom = 'custom',
}

/**
 * Editor types for cell editing
 */
export const enum EditorType {
  Text = 'text',
  Number = 'number',
  Date = 'date',
  DateTime = 'datetime',
  Time = 'time',
  Select = 'select',
  Autocomplete = 'autocomplete',
  Checkbox = 'checkbox',
  Radio = 'radio',
  Textarea = 'textarea',
  Custom = 'custom',
}

/**
 * Editor configuration
 */
export interface EditorConfig<T = any> {
  /** Editor type */
  type: EditorType
  
  /** Options for select/autocomplete editors */
  options?: T[] | { value: T; label: string; disabled?: boolean }[]
  
  /** Data source for remote options */
  dataSource?: () => Promise<T[]>
  
  /** Min value (number/date editors) */
  min?: number | Date
  
  /** Max value (number/date editors) */
  max?: number | Date
  
  /** Step increment */
  step?: number
  
  /** Format string */
  format?: string
  
  /** Placeholder text */
  placeholder?: string
  
  /** Custom editor component */
  component?: Component
  
  /** Editor props */
  props?: Record<string, any>
  
  /** Disabled state */
  disabled?: boolean | ((row: any) => boolean)
  
  /** Readonly state */
  readonly?: boolean | ((row: any) => boolean)
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  /** Filter type */
  type?: 'text' | 'number' | 'date' | 'boolean' | 'list' | 'custom'
  
  /** Available operators */
  operators?: string[]
  
  /** Show search in filter dropdown */
  showSearch?: boolean
  
  /** Placeholder text */
  placeholder?: string
  
  /** Custom filter component */
  component?: Component
  
  /** Debounce delay (ms) */
  debounce?: number
  
  /** Case sensitive filtering */
  caseSensitive?: boolean
  
  /** Filter mode */
  mode?: 'menu' | 'row' | 'both'
}

/**
 * Column lookup configuration
 */
export interface ColumnLookup<T = any> {
  /** Data source */
  dataSource: T[] | (() => Promise<T[]>)
  
  /** Value field */
  valueExpr: keyof T | string
  
  /** Display field */
  displayExpr: keyof T | string
  
  /** Allow clearing */
  allowClearing?: boolean
  
  /** Search enabled */
  searchEnabled?: boolean
}

/**
 * Cell template context
 */
export interface CellTemplateContext<TRow = any, TValue = any> {
  /** Row data */
  row: TRow
  
  /** Cell value */
  value: TValue
  
  /** Column definition */
  column: ColumnDefinition
  
  /** Row index */
  rowIndex: number
  
  /** Column index */
  columnIndex: number
  
  /** Is editing */
  isEditing: boolean
  
  /** Display value */
  displayValue: string
}

/**
 * Header template context
 */
export interface HeaderTemplateContext {
  /** Column definition */
  column: ColumnDefinition
  
  /** Column index */
  columnIndex: number
  
  /** Sort descriptor */
  sortDescriptor?: { field: string; direction: SortDirection }
  
  /** Filter descriptor */
  filterDescriptor?: FilterCondition
}

/**
 * Column formatting options
 */
export interface FormatOptions {
  /** Number of decimal places */
  precision?: number
  
  /** Currency code (USD, EUR, etc.) */
  currencyCode?: string
  
  /** Date format pattern */
  dateFormat?: string
  
  /** Locale for formatting */
  locale?: string
  
  /** Use grouping separator */
  useGrouping?: boolean
  
  /** Custom format function */
  formatter?: (value: any) => string
}

/**
 * Column definition
 */
export interface ColumnDefinition<TRow = any, TValue = any> {
  // ===== CORE PROPERTIES =====
  
  /** Unique field identifier */
  field: ColumnField | string
  
  /** Column header title */
  title: string
  
  /** Data type */
  type?: ColumnType
  
  /** Column width */
  width?: number | string
  
  /** Minimum width */
  minWidth?: number
  
  /** Maximum width */
  maxWidth?: number
  
  /** Column alignment */
  alignment?: Alignment
  
  /** Visible state */
  visible?: boolean
  
  // ===== FORMATTING =====
  
  /** Format type */
  format?: ColumnFormat | string
  
  /** Format options */
  formatOptions?: FormatOptions
  
  /** Custom formatter function */
  formatter?: (value: TValue, row: TRow, column: ColumnDefinition) => string | number | VNode
  
  /** Value getter */
  valueGetter?: (row: TRow) => TValue
  
  /** Value setter */
  valueSetter?: (row: TRow, value: TValue) => void
  
  /** Calculate cell value */
  calculateCellValue?: (row: TRow) => TValue
  
  /** Calculate display value */
  calculateDisplayValue?: (row: TRow) => string
  
  // ===== FEATURES =====
  
  /** Allow sorting */
  sortable?: boolean
  
  /** Allow filtering */
  filterable?: boolean
  
  /** Allow grouping */
  groupable?: boolean
  
  /** Allow editing */
  editable?: boolean | ((row: TRow) => boolean)
  
  /** Allow resizing */
  resizable?: boolean
  
  /** Allow reordering */
  reorderable?: boolean
  
  /** Include in search */
  searchable?: boolean
  
  /** Lock column (freeze) */
  locked?: boolean
  
  /** Lock position */
  lockPosition?: 'left' | 'right'
  
  /** Allow hiding */
  allowHiding?: boolean
  
  /** Allow column chooser */
  showInColumnChooser?: boolean
  
  // ===== CONFIGURATION =====
  
  /** Filter configuration */
  filterConfig?: FilterConfig
  
  /** Editor configuration */
  editor?: EditorConfig
  
  /** Lookup configuration */
  lookup?: ColumnLookup
  
  /** Validation rules */
  validationRules?: ValidationRule[]
  
  /** Custom validation */
  validator?: (value: TValue, row: TRow) => boolean | string | Promise<boolean | string>
  
  // ===== TEMPLATES =====
  
  /** Cell template */
  cellTemplate?: (context: CellTemplateContext<TRow, TValue>) => VNode | string
  
  /** Header template */
  headerTemplate?: (context: HeaderTemplateContext) => VNode | string
  
  /** Edit template */
  editTemplate?: (context: CellTemplateContext<TRow, TValue>) => VNode
  
  /** Filter template */
  filterTemplate?: (column: ColumnDefinition) => VNode
  
  /** Group template */
  groupTemplate?: (data: any) => VNode | string
  
  // ===== STYLING =====
  
  /** CSS class */
  cssClass?: string
  
  /** Header CSS class */
  headerCssClass?: string
  
  /** Cell CSS class */
  cellCssClass?: string | ((row: TRow) => string)
  
  /** Custom attributes */
  customAttributes?: Record<string, any>
  
  // ===== DEFAULTS =====
  
  /** Default sort direction */
  defaultSortOrder?: SortDirection
  
  /** Default sort index */
  defaultSortIndex?: number
  
  /** Default filter value */
  defaultFilterValue?: any
  
  /** Default group index */
  defaultGroupIndex?: number
  
  // ===== AGGREGATION =====
  
  /** Aggregate function */
  aggregate?: AggregateFunction
  
  /** Show aggregate in group footer */
  showInGroupFooter?: boolean
  
  /** Aggregate template */
  aggregateTemplate?: (aggregateValue: any) => VNode | string
  
  // ===== SEARCH =====
  
  /** Search weight for ranking */
  searchWeight?: number
  
  /** Search transform */
  searchTransform?: (value: TValue) => string
  
  // ===== EXPORT =====
  
  /** Include in export */
  exportable?: boolean
  
  /** Export value getter */
  exportValue?: (row: TRow) => any
  
  // ===== EVENTS =====
  
  /** Cell click handler */
  onCellClick?: (e: { row: TRow; value: TValue; event: MouseEvent }) => void
  
  /** Cell double click handler */
  onCellDblClick?: (e: { row: TRow; value: TValue; event: MouseEvent }) => void
  
  /** Cell prepared */
  onCellPrepared?: (e: { row: TRow; value: TValue; cellElement: HTMLElement }) => void
  
  // ===== METADATA =====
  
  /** Column metadata */
  metadata?: Record<string, any>
  
  /** Column tags */
  tags?: string[]
  
  /** Column category */
  category?: string
  
  /** Column description */
  description?: string
  
  // ===== BACKWARD COMPATIBILITY =====
  
  /** @deprecated Use sortable */
  allowSorting?: boolean
  
  /** @deprecated Use filterable */
  allowFiltering?: boolean
  
  /** @deprecated Use editable */
  allowEditing?: boolean
  
  /** @deprecated Use resizable */
  allowResizing?: boolean
}

/**
 * Column band (multi-row headers)
 */
export interface ColumnBand {
  /** Band caption */
  caption: string
  
  /** Child columns */
  columns: (ColumnDefinition | ColumnBand)[]
  
  /** Alignment */
  alignment?: Alignment
  
  /** CSS class */
  cssClass?: string
  
  /** Visible */
  visible?: boolean
}

/**
 * Column collection
 */
export interface ColumnCollection {
  /** All columns */
  all: ColumnDefinition[]
  
  /** Visible columns */
  visible: ColumnDefinition[]
  
  /** Locked columns */
  locked: ColumnDefinition[]
  
  /** Sortable columns */
  sortable: ColumnDefinition[]
  
  /** Filterable columns */
  filterable: ColumnDefinition[]
  
  /** Editable columns */
  editable: ColumnDefinition[]
  
  /** Searchable columns */
  searchable: ColumnDefinition[]
}

/**
 * Type guard: Check if value is ColumnDefinition
 */
export function isColumnDefinition(value: any): value is ColumnDefinition {
  return value && typeof value === 'object' && 'field' in value && 'title' in value
}

/**
 * Type guard: Check if value is ColumnBand
 */
export function isColumnBand(value: any): value is ColumnBand {
  return value && typeof value === 'object' && 'caption' in value && 'columns' in value
}