/**
 * @fileoverview Pagination types
 * @module @tsdatagrid/types/features/pagination
 */

/**
 * Pagination mode
 */
export const enum PaginationMode {
  /** Client-side pagination */
  Client = 'client',
  
  /** Server-side pagination */
  Server = 'server',
  
  /** Virtual scrolling (infinite) */
  Virtual = 'virtual',
}

/**
 * Pagination configuration
 */
export interface PaginationConfig {
  /** Enable pagination */
  enabled?: boolean
  
  /** Pagination mode */
  mode?: PaginationMode
  
  /** Page size */
  pageSize?: number
  
  /** Available page sizes */
  pageSizes?: number[]
  
  /** Show page size selector */
  showPageSizes?: boolean
  
  /** Show pagination info */
  showInfo?: boolean
  
  /** Show first/last buttons */
  showFirstLast?: boolean
  
  /** Show previous/next buttons */
  showPrevNext?: boolean
  
  /** Max visible pages */
  maxVisiblePages?: number
  
  /** Info template */
  infoTemplate?: string
  
  /** Current page (1-based) */
  page?: number
  
  /** Total pages */
  totalPages?: number
  
  /** Total items */
  total?: number
}

/**
 * Pagination state
 */
export interface PaginationState {
  /** Current page (1-based) */
  page: number
  
  /** Page size */
  pageSize: number
  
  /** Total items */
  totalItems: number
  
  /** Total pages */
  totalPages: number
  
  /** Start index (0-based) */
  startIndex: number
  
  /** End index (0-based) */
  endIndex: number
  
  /** Has previous page */
  hasPrevious: boolean
  
  /** Has next page */
  hasNext: boolean
  
  /** Visible page numbers */
  visiblePages: number[]
}

/**
 * Page change event
 */
export interface PageChangeEvent {
  /** New page */
  page: number
  
  /** Page size */
  pageSize: number
  
  /** Previous page */
  previousPage: number
  
  /** Skip count */
  skip: number
  
  /** Take count */
  take: number
}