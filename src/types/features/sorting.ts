/**
 * @fileoverview Sorting types
 * @module @tsdatagrid/types/features/sorting
 */

import type { ColumnField, Comparator } from '../core/base'
import type { ColumnDefinition } from '../core/column'

/**
 * Sort direction
 */
export const enum SortDirection {
  Ascending = 'asc',
  Descending = 'desc',
}

/**
 * Sort descriptor
 */
export interface SortDescriptor {
  /** Field name */
  field: ColumnField | string
  
  /** Sort direction */
  direction: SortDirection
  
  /** Sort index (for multi-sort) */
  index?: number
  
  /** Custom comparator */
  comparator?: Comparator<any>
  
  /** Column definition */
  column?: ColumnDefinition
}

/**
 * Sort state
 */
export interface SortState {
  /** Sort descriptors */
  descriptors: SortDescriptor[]
  
  /** Multi-sort enabled */
  multiSort: boolean
}

/**
 * Sort mode
 */
export const enum SortMode {
  /** Single column sort */
  Single = 'single',
  
  /** Multiple column sort */
  Multiple = 'multiple',
}

/**
 * Sort configuration
 */
export interface SortingConfig {
  /** Enable sorting */
  enabled?: boolean
  
  /** Sort mode */
  mode?: SortMode
  
  /** Allow unsort (clear sort) */
  allowUnsort?: boolean
  
  /** Show sort index for multi-sort */
  showSortIndex?: boolean
  
  /** Ascending by default */
  ascendingByDefault?: boolean
  
  /** Max sort levels */
  maxSortLevels?: number
  
  /** Sort null values first */
  sortNullsFirst?: boolean
  
  /** Case sensitive sorting */
  caseSensitive?: boolean
}

/**
 * Sort cycle
 */
export type SortCycle = [null, SortDirection.Ascending, SortDirection.Descending]

/**
 * Sort comparer function
 */
export type SortComparer<T = any> = (a: T, b: T, direction: SortDirection) => number

/**
 * Type guard: Check if value is SortDescriptor
 */
export function isSortDescriptor(value: any): value is SortDescriptor {
  return value && typeof value === 'object' && 'field' in value && 'direction' in value
}

/**
 * Toggle sort direction
 */
export function toggleSortDirection(
  current: SortDirection | null,
  allowUnsort = true
): SortDirection | null {
  if (!current) return SortDirection.Ascending
  if (current === SortDirection.Ascending) return SortDirection.Descending
  return allowUnsort ? null : SortDirection.Ascending
}