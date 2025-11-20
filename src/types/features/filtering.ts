/**
 * @fileoverview Filtering types
 * @module @tsdatagrid/types/features/filtering
 */

import { ColumnField, DataType } from '../core/base'
import type { ColumnDefinition } from '../core/column'

/**
 * Filter operator
 */
export const enum FilterOperator {
  // String operators
  Equals = 'equals',
  NotEquals = 'notEquals',
  Contains = 'contains',
  NotContains = 'notContains',
  StartsWith = 'startsWith',
  EndsWith = 'endsWith',
  
  // Number/Date operators
  GreaterThan = 'greaterThan',
  GreaterThanOrEqual = 'greaterThanOrEqual',
  LessThan = 'lessThan',
  LessThanOrEqual = 'lessThanOrEqual',
  Between = 'between',
  
  // Array operators
  In = 'in',
  NotIn = 'notIn',
  
  // Null operators
  IsNull = 'isNull',
  IsNotNull = 'isNotNull',
  IsEmpty = 'isEmpty',
  IsNotEmpty = 'isNotEmpty',
  
  // Date operators
  Today = 'today',
  Yesterday = 'yesterday',
  ThisWeek = 'thisWeek',
  LastWeek = 'lastWeek',
  ThisMonth = 'thisMonth',
  LastMonth = 'lastMonth',
  ThisYear = 'thisYear',
  LastYear = 'lastYear',
  DateRange = 'dateRange',
  
  // Custom
  Custom = 'custom',
}

/**
 * Filter condition
 */
export interface FilterCondition {
  /** Field name */
  field: ColumnField | string
  
  /** Filter operator */
  operator: FilterOperator
  
  /** Filter value */
  value: any
  
  /** Second value (for between operator) */
  value2?: any
  
  /** Case sensitive */
  caseSensitive?: boolean
  
  /** Data type */
  dataType?: DataType
  
  /** Custom filter function */
  customFilter?: (rowValue: any, filterValue: any) => boolean
}

/**
 * Filter group logical operator
 */
export const enum FilterLogic {
  And = 'and',
  Or = 'or',
}

/**
 * Filter group
 */
export interface FilterGroup {
  /** Logic operator */
  logic: FilterLogic
  
  /** Filters */
  filters: (FilterCondition | FilterGroup)[]
}

/**
 * Active filter display
 */
export interface ActiveFilter extends FilterCondition {
  /** Display value */
  displayValue: string
  
  /** Column title */
  columnTitle: string
  
  /** Removable */
  removable: boolean
  
  /** Column definition */
  column?: ColumnDefinition
}

/**
 * Filter state
 */
export interface FilterState {
  /** Filter conditions */
  filters: FilterCondition[]
  
  /** Active filters */
  activeFilters: ActiveFilter[]
  
  /** Filter groups */
  filterGroups?: FilterGroup[]
  
  /** Quick filter text */
  quickFilter?: string
}

/**
 * Unique value filter option
 */
export interface UniqueValueFilterOption {
  /** Value */
  value: any
  
  /** Label */
  label: string
  
  /** Count */
  count: number
  
  /** Selected */
  selected: boolean
}

/**
 * Filter popup state
 */
export interface FilterPopupState {
  /** Field name */
  field: string
  
  /** Visible */
  visible: boolean
  
  /** Selected values */
  selectedValues?: any[]
  
  /** Search term */
  searchTerm?: string
  
  /** Loading */
  loading?: boolean
  
  /** Unique values */
  uniqueValues?: UniqueValueFilterOption[]
  
  /** Position */
  position?: { x: number; y: number }
}

/**
 * Filter mode
 */
export const enum FilterMode {
  /** Filter row */
  Row = 'row',
  
  /** Filter menu */
  Menu = 'menu',
  
  /** Both row and menu */
  Both = 'both',
}

/**
 * Filter configuration
 */
export interface FilteringConfig {
  /** Enable filtering */
  enabled?: boolean
  
  /** Filter mode */
  mode?: FilterMode
  
  /** Show filter row */
  showFilterRow?: boolean
  
  /** Show filter menu */
  showFilterMenu?: boolean
  
  /** Show clear button */
  showClearButton?: boolean
  
  /** Filter debounce (ms) */
  debounce?: number
  
  /** Case sensitive by default */
  caseSensitive?: boolean
  
  /** Allow multiple filters per column */
  allowMultipleFilters?: boolean
}

/**
 * Operator metadata
 */
export interface OperatorMetadata {
  /** Operator */
  operator: FilterOperator
  
  /** Display text */
  text: string
  
  /** Icon */
  icon?: string
  
  /** Requires value */
  requiresValue: boolean
  
  /** Requires second value */
  requiresSecondValue?: boolean
  
  /** Compatible data types */
  dataTypes: DataType[]
}

/**
 * Filter operators by data type
 */
export const FILTER_OPERATORS: Record<DataType, FilterOperator[]> = {
  [DataType.String]: [
    FilterOperator.Equals,
    FilterOperator.NotEquals,
    FilterOperator.Contains,
    FilterOperator.NotContains,
    FilterOperator.StartsWith,
    FilterOperator.EndsWith,
    FilterOperator.IsNull,
    FilterOperator.IsNotNull,
    FilterOperator.IsEmpty,
    FilterOperator.IsNotEmpty,
  ],
  [DataType.Number]: [
    FilterOperator.Equals,
    FilterOperator.NotEquals,
    FilterOperator.GreaterThan,
    FilterOperator.GreaterThanOrEqual,
    FilterOperator.LessThan,
    FilterOperator.LessThanOrEqual,
    FilterOperator.Between,
    FilterOperator.IsNull,
    FilterOperator.IsNotNull,
  ],
  [DataType.Date]: [
    FilterOperator.Equals,
    FilterOperator.NotEquals,
    FilterOperator.GreaterThan,
    FilterOperator.GreaterThanOrEqual,
    FilterOperator.LessThan,
    FilterOperator.LessThanOrEqual,
    FilterOperator.Between,
    FilterOperator.Today,
    FilterOperator.Yesterday,
    FilterOperator.ThisWeek,
    FilterOperator.LastWeek,
    FilterOperator.ThisMonth,
    FilterOperator.LastMonth,
    FilterOperator.ThisYear,
    FilterOperator.LastYear,
    FilterOperator.IsNull,
    FilterOperator.IsNotNull,
  ],
  [DataType.DateTime]: [
    FilterOperator.Equals,
    FilterOperator.NotEquals,
    FilterOperator.GreaterThan,
    FilterOperator.GreaterThanOrEqual,
    FilterOperator.LessThan,
    FilterOperator.LessThanOrEqual,
    FilterOperator.Between,
    FilterOperator.Today,
    FilterOperator.Yesterday,
    FilterOperator.IsNull,
    FilterOperator.IsNotNull,
  ],
  [DataType.Boolean]: [
    FilterOperator.Equals,
    FilterOperator.NotEquals,
    FilterOperator.IsNull,
    FilterOperator.IsNotNull,
  ],
  [DataType.Object]: [
    FilterOperator.IsNull,
    FilterOperator.IsNotNull,
  ],
  [DataType.Array]: [
    FilterOperator.In,
    FilterOperator.NotIn,
    FilterOperator.IsEmpty,
    FilterOperator.IsNotEmpty,
  ],
}

/**
 * Type guard: Check if value is FilterCondition
 */
export function isFilterCondition(value: any): value is FilterCondition {
  return value && typeof value === 'object' && 'field' in value && 'operator' in value
}

/**
 * Type guard: Check if value is FilterGroup
 */
export function isFilterGroup(value: any): value is FilterGroup {
  return value && typeof value === 'object' && 'logic' in value && 'filters' in value
}