/**
 * @fileoverview Data source types
 * @module @tsdatagrid/types/core/datasource
 */

import type { FilterCondition } from '../features/filtering'
import type { SortDescriptor } from '../features/sorting'
import type { GroupDescriptor } from '../features/grouping'
import type { ErrorInfo } from './base'

/**
 * Data source type
 */
export const enum DataSourceType {
  Local = 'local',
  Array = 'array',
  OData = 'odata',
  WebAPI = 'webapi',
  Custom = 'custom',
}

/**
 * Data source mode
 */
export const enum DataSourceMode {
  /** All operations on client */
  Client = 'client',
  
  /** All operations on server */
  Server = 'server',
  
  /** Hybrid mode */
  Hybrid = 'hybrid',
}

/**
 * OData version
 */
export const enum ODataVersion {
  V2 = '2',
  V3 = '3',
  V4 = '4',
}

/**
 * HTTP method
 */
export const enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

/**
 * Load options for server requests
 */
export interface LoadOptions {
  /** Skip count (for pagination) */
  skip?: number
  
  /** Take count (page size) */
  take?: number
  
  /** Sort descriptors */
  sort?: SortDescriptor[]
  
  /** Filter conditions */
  filter?: FilterCondition[]
  
  /** Group descriptors */
  group?: GroupDescriptor[]
  
  /** Search term */
  search?: string
  
  /** Select fields (projection) */
  select?: string[]
  
  /** Expand relations */
  expand?: string[]
  
  /** Require total count */
  requireTotalCount?: boolean
  
  /** Custom parameters */
  customParams?: Record<string, any>
  
  /** Request timestamp */
  timestamp?: number
}

/**
 * Data result from server
 */
export interface DataResult<T = any> {
  /** Data rows */
  data: T[]
  
  /** Total count (all data, not just current page) */
  totalCount: number
  
  /** Summary values */
  summary?: Record<string, any>
  
  /** Group count */
  groupCount?: number
  
  /** Actual page size returned */
  actualPageSize?: number
  
  /** Server page size limit */
  serverPageSizeLimit?: number
  
  /** Error information */
  error?: ErrorInfo
  
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * OData configuration
 */
export interface ODataConfig {
  /** OData version */
  version?: ODataVersion
  
  /** Service URL */
  url: string
  
  /** Entity set name */
  entitySet?: string
  
  /** Key field */
  key?: string
  
  /** Request timeout (ms) */
  timeout?: number
  
  /** Use JSONP */
  jsonp?: boolean
  
  /** With credentials */
  withCredentials?: boolean
  
  /** Before send callback */
  beforeSend?: (options: LoadOptions) => LoadOptions | Promise<LoadOptions>
  
  /** Error handler */
  errorHandler?: (error: ErrorInfo) => void
}

/**
 * Custom store configuration
 */
export interface CustomStoreConfig<T = any> {
  /** Load data */
  load: (options: LoadOptions) => Promise<DataResult<T>> | DataResult<T>
  
  /** Insert row */
  insert?: (values: Partial<T>) => Promise<T> | T
  
  /** Update row */
  update?: (key: any, values: Partial<T>) => Promise<T> | T
  
  /** Remove row */
  remove?: (key: any) => Promise<void> | void
  
  /** Get by key */
  byKey?: (key: any) => Promise<T | undefined> | T | undefined
  
  /** Total count */
  totalCount?: (options: LoadOptions) => Promise<number> | number
  
  /** Key expression */
  key?: keyof T | string
  
  /** Cache enabled */
  cacheEnabled?: boolean
  
  /** Cache expiration (ms) */
  cacheExpiration?: number
}

/**
 * Data source configuration
 */
export interface DataSourceConfig<T = any> {
  // ===== CORE =====
  
  /** Data source type */
  type?: DataSourceType
  
  /** Data source mode */
  mode?: DataSourceMode
  
  /** Local data array */
  data?: T[]
  
  /** Remote URL */
  url?: string
  
  /** Key field */
  key?: keyof T | string
  
  // ===== PAGINATION =====
  
  /** Default page size */
  pageSize?: number
  
  /** Server-side paging */
  serverPaging?: boolean
  
  // ===== SORTING =====
  
  /** Server-side sorting */
  serverSorting?: boolean
  
  /** Default sort */
  defaultSort?: SortDescriptor[]
  
  // ===== FILTERING =====
  
  /** Server-side filtering */
  serverFiltering?: boolean
  
  /** Default filter */
  defaultFilter?: FilterCondition[]
  
  // ===== GROUPING =====
  
  /** Server-side grouping */
  serverGrouping?: boolean
  
  /** Default group */
  defaultGroup?: GroupDescriptor[]
  
  // ===== SEARCH =====
  
  /** Server-side search */
  serverSearch?: boolean
  
  /** Search fields */
  searchFields?: string[]
  
  /** Search debounce (ms) */
  searchDebounce?: number
  
  // ===== REQUEST =====
  
  /** Fetch options */
  fetchOptions?: RequestInit
  
  /** Request headers */
  headers?: Record<string, string>
  
  /** Request timeout (ms) */
  timeout?: number
  
  /** Retry count */
  retryCount?: number
  
  /** Retry delay (ms) */
  retryDelay?: number
  
  // ===== CONFIGURATION =====
  
  /** OData configuration */
  odata?: ODataConfig
  
  /** Custom store */
  customStore?: CustomStoreConfig<T>
  
  /** Transform response */
  transformResponse?: (response: any) => DataResult<T>
  
  /** Transform request */
  transformRequest?: (options: LoadOptions) => any
  
  // ===== CACHING =====
  
  /** Enable caching */
  cache?: boolean
  
  /** Cache duration (ms) */
  cacheDuration?: number
  
  /** Cache key generator */
  cacheKeyGenerator?: (options: LoadOptions) => string
  
  // ===== EVENTS =====
  
  /** Before load */
  onBeforeLoad?: (options: LoadOptions) => LoadOptions | Promise<LoadOptions> | void
  
  /** After load */
  onAfterLoad?: (result: DataResult<T>) => DataResult<T> | void
  
  /** Load error */
  onLoadError?: (error: ErrorInfo) => void
  
  /** Change */
  onChange?: (data: T[]) => void
  
  // ===== STATE =====
  
  /** Current filters */
  currentFilters?: FilterCondition[]
  
  /** Current sorts */
  currentSorts?: SortDescriptor[]
  
  /** Current groups */
  currentGroups?: GroupDescriptor[]
  
  // ===== METADATA =====
  
  /** Additional metadata */
  metadata?: Record<string, any>
}

/**
 * Data source instance
 */
export interface IDataSource<T = any> {
  /** Load data */
  load(options?: LoadOptions): Promise<DataResult<T>>
  
  /** Reload data */
  reload(): Promise<DataResult<T>>
  
  /** Insert row */
  insert(values: Partial<T>): Promise<T>
  
  /** Update row */
  update(key: any, values: Partial<T>): Promise<T>
  
  /** Remove row */
  remove(key: any): Promise<void>
  
  /** Get by key */
  byKey(key: any): Promise<T | undefined>
  
  /** Get total count */
  totalCount(): Promise<number>
  
  /** Clear cache */
  clearCache(): void
  
  /** Dispose */
  dispose(): void
}

/**
 * Type guard: Check if config is OData
 */
export function isODataConfig(config: DataSourceConfig): config is Required<Pick<DataSourceConfig, 'odata'>> {
  return config.type === DataSourceType.OData || !!config.odata
}

/**
 * Type guard: Check if config is Custom Store
 */
export function isCustomStoreConfig(config: DataSourceConfig): config is Required<Pick<DataSourceConfig, 'customStore'>> {
  return config.type === DataSourceType.Custom || !!config.customStore
}