/**
 * @fileoverview Search types
 * @module @tsdatagrid/types/features/searching
 */

import type { ColumnField } from '../core/base'

/**
 * Search mode
 */
export const enum SearchMode {
  /** Contains */
  Contains = 'contains',
  
  /** Starts with */
  StartsWith = 'startsWith',
  
  /** Equals */
  Equals = 'equals',
  
  /** Full-text search */
  FullText = 'fulltext',
}

/**
 * Search configuration
 */
export interface SearchConfig {
  /** Enable search */
  enabled: boolean
  
  /** Search fields */
  fields?: ColumnField[]
  
  /** Search mode */
  mode?: SearchMode
  
  /** Case sensitive */
  caseSensitive?: boolean
  
  /** Debounce delay (ms) */
  debounce?: number
  
  /** Minimum length */
  minLength?: number
  
  /** Highlight results */
  highlight?: boolean
  
  /** Highlight class */
  highlightClass?: string
  
  /** Show match count */
  showMatchCount?: boolean
  
  /** Search placeholder */
  placeholder?: string
}

/**
 * Search match
 */
export interface SearchMatch {
  /** Field name */
  field: string
  
  /** Field value */
  value: any
  
  /** Match text */
  match: string
  
  /** Start index */
  startIndex: number
  
  /** End index */
  endIndex: number
  
  /** Match score */
  score?: number
}

/**
 * Search result
 */
export interface SearchResult<T = any> {
  /** Row data */
  row: T
  
  /** Row key */
  rowKey: any
  
  /** Overall score */
  score: number
  
  /** Matches */
  matches: SearchMatch[]
  
  /** Highlighted row */
  highlightedRow?: T
}

/**
 * Search state
 */
export interface SearchState {
  /** Search term */
  term: string
  
  /** Search results */
  results: SearchResult[]
  
  /** Total matches */
  totalMatches: number
  
  /** Is searching */
  isSearching: boolean
  
  /** Highlighted rows */
  highlightedRows: Set<any>
  
  /** Active match index */
  activeMatchIndex?: number
}