/**
 * @fileoverview Grouping types
 * @module @tsdatagrid/types/features/grouping
 */

import type { ColumnField } from '../core/base'
import type { ColumnDefinition } from '../core/column'

/**
 * Aggregate function
 */
export const enum AggregateFunction {
  Sum = 'sum',
  Avg = 'avg',
  Min = 'min',
  Max = 'max',
  Count = 'count',
  DistinctCount = 'distinctCount',
  Median = 'median',
  StdDev = 'stdDev',
  Variance = 'variance',
  First = 'first',
  Last = 'last',
  Custom = 'custom',
}

/**
 * Aggregate descriptor
 */
export interface AggregateDescriptor {
  /** Field name */
  field: ColumnField | string
  
  /** Aggregate function */
  aggregate: AggregateFunction
  
  /** Display format */
  format?: string
  
  /** Custom calculation */
  customCalculation?: (data: any[], field: string) => any
  
  /** Formatter */
  formatter?: (value: any) => string
}

/**
 * Group descriptor
 */
export interface GroupDescriptor {
  /** Field name */
  field: ColumnField | string
  
  /** Expanded by default */
  expanded?: boolean
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
  
  /** Group index */
  index?: number
  
  /** Aggregates */
  aggregates?: AggregateDescriptor[]
  
  /** Custom group value */
  groupValue?: (item: any) => any
  
  /** Custom group key */
  groupKey?: (item: any) => string
  
  /** Column definition */
  column?: ColumnDefinition
}

/**
 * Grouped row
 */
export interface GroupedRow<T = any> {
  /** Group key */
  key: string
  
  /** Group field */
  field: ColumnField | string
  
  /** Group value */
  value: any
  
  /** Items in group */
  items: T[]
  
  /** Group level (0-based) */
  level: number
  
  /** Expanded state */
  expanded: boolean
  
  /** Is group row */
  isGroup: boolean
  
  /** Count */
  count: number
  
  /** Aggregates */
  aggregates?: Record<string, any>
  
  /** Summary */
  summary?: GroupSummary
  
  /** Children groups */
  children?: GroupedRow<T>[]
}

/**
 * Group summary
 */
export interface GroupSummary {
  /** Count */
  count: number
  
  /** Aggregate values */
  aggregates: Record<string, any>
}

/**
 * Grouping configuration
 */
export interface GroupingConfig {
  /** Enable grouping */
  enabled?: boolean
  
  /** Auto expand all groups */
  autoExpandAll?: boolean
  
  /** Allow collapsing */
  allowCollapsing?: boolean
  
  /** Group panel visible */
  groupPanelVisible?: boolean
  
  /** Show group column */
  showGroupColumn?: boolean
  
  /** Group column width */
  groupColumnWidth?: number
  
  /** Expand mode */
  expandMode?: 'rowClick' | 'buttonClick'
  
  /** Default expanded level */
  defaultExpandedLevel?: number
  
  /** Summary position */
  summaryPosition?: 'footer' | 'header' | 'both'
}

/**
 * Grouping state
 */
export interface GroupingState {
  /** Group descriptors */
  descriptors: GroupDescriptor[]
  
  /** Grouped data */
  groupedData: GroupedRow[]
  
  /** Expanded groups */
  expandedGroups: Set<string>
  
  /** Collapsed groups */
  collapsedGroups: Set<string>
}

/**
 * Group panel item
 */
export interface GroupPanelItem {
  /** Field name */
  field: ColumnField | string
  
  /** Display text */
  text: string
  
  /** Sort direction */
  sortDirection?: 'asc' | 'desc'
  
  /** Index */
  index: number
  
  /** Removable */
  removable?: boolean
}

/**
 * Type guard: Check if row is grouped row
 */
export function isGroupedRow(row: any): row is GroupedRow {
  return row && typeof row === 'object' && row.isGroup === true
}