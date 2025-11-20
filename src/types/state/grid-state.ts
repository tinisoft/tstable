/**
 * @fileoverview Grid state management types
 * @module @tsdatagrid/types/state/grid-state
 */

import type { ColumnDefinition } from '../core/column'
import type { FilterCondition, ActiveFilter } from '../features/filtering'
import type { SortDescriptor } from '../features/sorting'
import type { GroupDescriptor, GroupedRow } from '../features/grouping'
import type { PaginationConfig } from '../features/pagination'
import type { SelectionState } from '../features/selection'
import type { EditingState } from '../features/editing'
import type { SummaryConfig, SummaryResult } from '../features/summary'
import type { SearchState } from '../features/searching'

/**
 * Grid state
 */
export interface GridState<T = any> {
  // ===== COLUMNS =====
  columns: ColumnDefinition[]
  visibleColumns: ColumnDefinition[]
  columnOrder: string[]
  columnWidths: Record<string, number | string>
  columnVisibility: Record<string, boolean>
  
  // ===== DATA =====
  data: T[]
  filteredData: T[]
  groupedData?: GroupedRow<T>[]
  totalCount: number
  
  // ===== FILTERING =====
  filters: FilterCondition[]
  activeFilters: ActiveFilter[]
  
  // ===== SORTING =====
  sorting: SortDescriptor[]
  
  // ===== GROUPING =====
  grouping: GroupDescriptor[]
  expandedGroups: Set<string>
  
  // ===== PAGINATION =====
  pagination: PaginationConfig & {
    page: number
    pageSize: number
    totalPages: number
    total: number
  }
  
  // ===== SELECTION =====
  selection: SelectionState
  
  // ===== EDITING =====
  editing?: EditingState
  
  // ===== SEARCH =====
  search?: SearchState
  
  // ===== SUMMARY =====
  summary?: {
    configs: SummaryConfig[]
    results: SummaryResult[]
  }
  
  // ===== UI STATE =====
  loading: boolean
  error?: string
  columnChooserVisible: boolean
  scrollPosition: { x: number; y: number }
  
  // ===== CHANGE TRACKING =====
  isDirty: boolean
  hasChanges: boolean
  validationErrors?: Map<any, Record<string, string>>
  
  // ===== METADATA =====
  timestamp: Date
  version: number
}

/**
 * Partial grid state (for updates)
 */
export type PartialGridState<T = any> = Partial<GridState<T>>

/**
 * Grid state snapshot
 */
export interface GridStateSnapshot<T = any> {
  /** State */
  state: GridState<T>
  
  /** Timestamp */
  timestamp: Date
  
  /** Description */
  description?: string
}