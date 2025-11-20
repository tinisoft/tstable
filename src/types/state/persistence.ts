/**
 * @fileoverview State persistence types
 * @module @tsdatagrid/types/state/persistence
 */

import type { GridState } from './grid-state'

/**
 * Storage type
 */
export const enum StorageType {
  LocalStorage = 'localStorage',
  SessionStorage = 'sessionStorage',
  Memory = 'memory',
  Custom = 'custom',
}

/**
 * Persistence configuration
 */
export interface PersistenceConfig {
  /** Enable persistence */
  enabled?: boolean
  
  /** Storage type */
  storageType?: StorageType
  
  /** Storage key */
  storageKey?: string
  
  /** Save on change */
  saveOnChange?: boolean
  
  /** Debounce delay (ms) */
  debounce?: number
  
  /** Persist columns */
  persistColumns?: boolean
  
  /** Persist filters */
  persistFilters?: boolean
  
  /** Persist sorting */
  persistSorting?: boolean
  
  /** Persist grouping */
  persistGrouping?: boolean
  
  /** Persist pagination */
  persistPagination?: boolean
  
  /** Persist selection */
  persistSelection?: boolean
  
  /** Custom storage */
  customStorage?: IStorageProvider
}

/**
 * Storage provider interface
 */
export interface IStorageProvider {
  /** Get item */
  getItem(key: string): string | null | Promise<string | null>
  
  /** Set item */
  setItem(key: string, value: string): void | Promise<void>
  
  /** Remove item */
  removeItem(key: string): void | Promise<void>
  
  /** Clear all */
  clear(): void | Promise<void>
}

/**
 * Persisted state
 */
export interface PersistedState {
  /** Version */
  version: string
  
  /** Timestamp */
  timestamp: Date
  
  /** State */
  state: Partial<GridState>
}