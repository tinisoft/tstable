/**
 * @fileoverview Enhanced OData utility
 * @module utils/odata
 */

import type {
  FilterCondition,
  LoadOptions,
  DataResult,
  DataSourceConfig,
  ColumnDefinition,
  SortDescriptor,
  GroupDescriptor,
} from '../types'
import { DataSourceType } from '../types/core/datasource'

export interface ODataOptions {
  $top?: number
  $skip?: number
  $count?: boolean
  $filter?: string
  $orderby?: string
  $select?: string
  $expand?: string
  $apply?: string
  $search?: string
}

export enum ODataVersion {
  V2 = '2',
  V3 = '3',
  V4 = '4',
}

// ===== ODATA QUERY BUILDER =====
export class ODataQueryBuilder {
  private options: ODataOptions = {}
  private filters: string[] = []
  private orderByParts: string[] = []
  private version: ODataVersion = ODataVersion.V4

  constructor(baseOptions: Partial<ODataOptions> = {}, version?: ODataVersion) {
    Object.assign(this.options, baseOptions)
    if (version) {
      this.version = version
    }
  }

  // ===== PAGINATION =====
  top(value: number): this {
    if (value < 0) throw new Error('$top must be non-negative')
    this.options.$top = value
    return this
  }

  skip(value: number): this {
    if (value < 0) throw new Error('$skip must be non-negative')
    this.options.$skip = value
    return this
  }

  // ===== SORTING =====
  orderBy(field: string, direction: 'asc' | 'desc' = 'asc'): this {
    const order = direction.toLowerCase() === 'desc' ? `${field} desc` : field
    this.orderByParts.push(order)
    this.options.$orderby = this.orderByParts.join(',')
    return this
  }

  clearOrderBy(): this {
    this.orderByParts = []
    delete this.options.$orderby
    return this
  }

  // ===== FILTERING =====
  filter(condition: FilterCondition): this {
    const filterStr = this.buildFilterString(condition)
    if (filterStr) {
      this.filters.push(filterStr)
      this.options.$filter = this.filters.join(' and ')
    }
    return this
  }

  clearFilters(): this {
    this.filters = []
    delete this.options.$filter
    return this
  }

  addFilter(filterStr: string): this {
    this.filters.push(filterStr)
    this.options.$filter = this.filters.join(' and ')
    return this
  }

  addFilters(conditions: FilterCondition[]): this {
    conditions.forEach((condition) => this.filter(condition))
    return this
  }

  // ===== SELECTION =====
  select(...fields: string[]): this {
    this.options.$select = fields.join(',')
    return this
  }

  // ===== EXPAND =====
  expand(...fields: string[]): this {
    this.options.$expand = fields.join(',')
    return this
  }

  // ===== COUNT =====
  count(include: boolean = true): this {
    this.options.$count = include
    return this
  }

  // ===== APPLY (for grouping/aggregation) =====
  apply(aggregation: string): this {
    this.options.$apply = aggregation
    return this
  }

  // ===== SEARCH =====
  search(term: string): this {
    if (term) {
      this.options.$search = term
    }
    return this
  }

  // ===== BUILD FILTER STRING =====
  public buildFilterString(condition: FilterCondition): string {
    const { field, operator, value, value2, caseSensitive = false } = condition

    const formatValue = (val: any): string => {
      if (val === null || val === undefined) return 'null'
      if (val === '') return "''"

      if (Array.isArray(val)) {
        return val.map((v) => formatValue(v)).join(',')
      }

      const type = this.inferType(val)

      switch (type) {
        case 'string':
          return `'${String(val).replace(/'/g, "''")}'`
        case 'date': {
          const date = new Date(val)
          if (isNaN(date.getTime())) throw new Error(`Invalid date: ${val}`)
          return date.toISOString()
        }
        case 'number':
          return String(val)
        case 'boolean':
          return String(val)
        case 'guid':
          return `${val}`
        default:
          return `'${String(val).replace(/'/g, "''")}'`
      }
    }

    const fieldStr = String(field)
    const fieldExpr = caseSensitive ? fieldStr : `tolower(${fieldStr})`
    const valueExpr = (val: any) => {
      const formatted = formatValue(val)
      return caseSensitive ? formatted : `tolower(${formatted})`
    }

    // Build filter expression based on operator
    switch (operator) {
      case 'equals':
        return `${fieldStr} eq ${formatValue(value)}`

      case 'notEquals':
        return `${fieldStr} ne ${formatValue(value)}`

      case 'greaterThan':
        return `${fieldStr} gt ${formatValue(value)}`

      case 'greaterThanOrEqual':
        return `${fieldStr} ge ${formatValue(value)}`

      case 'lessThan':
        return `${fieldStr} lt ${formatValue(value)}`

      case 'lessThanOrEqual':
        return `${fieldStr} le ${formatValue(value)}`

      case 'contains':
        return `contains(${fieldExpr}, ${valueExpr(value)})`

      case 'notContains':
        return `not contains(${fieldExpr}, ${valueExpr(value)})`

      case 'startsWith':
        return `startswith(${fieldExpr}, ${valueExpr(value)})`

      case 'endsWith':
        return `endswith(${fieldExpr}, ${valueExpr(value)})`

      case 'between':
        return `(${fieldStr} ge ${formatValue(value)} and ${fieldStr} le ${formatValue(value2)})`

      case 'in': {
        const values = Array.isArray(value) ? value : [value]
        if (values.length === 0) return `${fieldStr} eq null`

        const orConditions = values.map((v) => {
          if (v === null || v === '') {
            return `${fieldStr} eq null`
          }
          return `${fieldStr} eq ${formatValue(v)}`
        })

        return orConditions.length > 1 ? `(${orConditions.join(' or ')})` : orConditions[0]
      }

      case 'notIn': {
        const notValues = Array.isArray(value) ? value : [value]
        if (notValues.length === 0) return ''

        const notConditions = notValues.map((v) => {
          if (v === null || v === '') {
            return `${fieldStr} eq null`
          }
          return `${fieldStr} eq ${formatValue(v)}`
        })

        return `not (${notConditions.join(' or ')})`
      }

      case 'isNull':
        return `${fieldStr} eq null`

      case 'isNotNull':
        return `${fieldStr} ne null`

      case 'isEmpty':
        return `(${fieldStr} eq null or ${fieldStr} eq '')`

      case 'isNotEmpty':
        return `(${fieldStr} ne null and ${fieldStr} ne '')`

      // Date-specific operators
      case 'today': {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return `(${fieldStr} ge ${formatValue(today)} and ${fieldStr} lt ${formatValue(tomorrow)})`
      }

      case 'yesterday': {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        return `(${fieldStr} ge ${formatValue(yesterday)} and ${fieldStr} lt ${formatValue(today)})`
      }

      case 'thisWeek': {
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        return `(${fieldStr} ge ${formatValue(weekStart)} and ${fieldStr} lt ${formatValue(weekEnd)})`
      }

      case 'thisMonth': {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        return `(${fieldStr} ge ${formatValue(monthStart)} and ${fieldStr} lt ${formatValue(monthEnd)})`
      }

      case 'thisYear': {
        const now = new Date()
        const yearStart = new Date(now.getFullYear(), 0, 1)
        const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
        return `(${fieldStr} ge ${formatValue(yearStart)} and ${fieldStr} lt ${formatValue(yearEnd)})`
      }

      case 'dateRange':
        return `(${fieldStr} ge ${formatValue(value)} and ${fieldStr} le ${formatValue(value2)})`

      default:
        console.warn(`Unsupported filter operator: ${operator}`)
        return ''
    }
  }

  // ===== INFER TYPE =====
  private inferType(value: any): 'string' | 'number' | 'date' | 'boolean' | 'guid' {
    if (value === null || value === undefined) return 'string'

    if (typeof value === 'boolean') return 'boolean'
    if (typeof value === 'number') return 'number'
    if (value instanceof Date) return 'date'

    const str = String(value)
    
    // GUID pattern
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
      return 'guid'
    }
    
    // Number pattern
    if (/^-?\d+(\.\d+)?$/.test(str) && !isNaN(Number(str))) {
      return 'number'
    }
    
    // Date pattern
    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
      return 'date'
    }
    
    // Boolean
    if (str.toLowerCase() === 'true' || str.toLowerCase() === 'false') {
      return 'boolean'
    }

    return 'string'
  }

  // ===== BUILD =====
  build(): ODataOptions {
    return { ...this.options }
  }

  // ===== TO QUERY STRING =====
  toQueryString(): string {
    const params = new URLSearchParams()
    Object.entries(this.build()).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== false) {
        params.append(key, String(value))
      }
    })
    return params.toString()
  }

  // ===== FROM LOAD OPTIONS =====
  static fromLoadOptions(
    options: LoadOptions,
    columns?: ColumnDefinition[]
  ): ODataQueryBuilder {
    const builder = new ODataQueryBuilder()

    // Pagination
    if (options.take) builder.top(options.take)
    if (options.skip) builder.skip(options.skip)

    // Sorting
    if (options.sort?.length) {
      builder.clearOrderBy()
      options.sort.forEach(({ field, direction }) => {
        if (direction) builder.orderBy(String(field), direction)
      })
    }

    // Filtering
    const filterStrings: string[] = []

    if (options.filter && options.filter.length > 0) {
      options.filter.forEach((filter) => {
        const filterStr = builder.buildFilterString(filter)
        if (filterStr) {
          filterStrings.push(filterStr)
        }
      })
    }

    // Search
    if (options.search && options.search.trim() && columns) {
      const searchTerm = options.search.trim().toLowerCase()

      const searchableColumns = columns.filter(
        (col) =>
          col.searchable !== false &&
          (col.type === 'string' || col.searchable === true)
      )

      if (searchableColumns.length > 0) {
        const searchFilters = searchableColumns.map(
          (col) => `contains(tolower(${String(col.field)}), '${searchTerm.replace(/'/g, "''")}')`
        )

        if (searchFilters.length > 0) {
          filterStrings.push(`(${searchFilters.join(' or ')})`)
        }
      }
    }

    if (filterStrings.length > 0) {
      builder.options.$filter = filterStrings.join(' and ')
    }

    // Selection
    if (options.select?.length) {
      builder.select(...options.select)
    }

    // Expand
    if (options.expand?.length) {
      builder.expand(...options.expand)
    }

    // Grouping
    if (options.group?.length) {
      const groupBy = options.group.map((g) => `groupby((${String(g.field)}))`).join(',')
      builder.apply(groupBy)
    }

    // Count
    builder.count(options.requireTotalCount !== false)

    return builder
  }

  // ===== FETCH ODATA =====
  static async fetchOData(
    url: string,
    options: ODataOptions,
    fetchOptions: RequestInit = {}
  ): Promise<DataResult<any>> {
    try {
      const params = new URLSearchParams()
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== false) {
          params.append(key, String(value))
        }
      })

      const fullUrl = `${url}${url.includes('?') ? '&' : '?'}${params.toString()}`

      console.log('🔷 OData Request:', fullUrl)

      const response = await fetch(fullUrl, {
        ...fetchOptions,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      const data = result.value || result.data || result
      const totalCount =
        result['@odata.count'] ||
        result['odata.count'] ||
        result.count ||
        (Array.isArray(data) ? data.length : 0)

      return {
        data: Array.isArray(data) ? data : [],
        totalCount,
        metadata: result,
      }
    } catch (error) {
      console.error('OData fetch error:', error)
      return {
        data: [],
        totalCount: 0,
        error: {
          code: 'FETCH_ERROR',
          message: error instanceof Error ? error.message : String(error),
        },
      }
    }
  }

  // ===== CREATE DATA SOURCE =====
  static createDataSource(config: DataSourceConfig): ODataDataSource {
    return new ODataDataSource(config)
  }
}

// ===== ODATA DATA SOURCE =====
export class ODataDataSource {
  private config: DataSourceConfig
  private cache: Map<string, { data: DataResult; timestamp: number }> = new Map()
  private cacheDuration = 5 * 60 * 1000 // 5 minutes

  constructor(config: DataSourceConfig) {
    this.config = {
      ...config,
      type: DataSourceType.OData,
      pageSize: config.pageSize ?? 50,
      serverPaging: config.serverPaging ?? true,
      serverSorting: config.serverSorting ?? true,
      serverFiltering: config.serverFiltering ?? true,
      serverGrouping: config.serverGrouping ?? false,
    }

    if (!this.config.url) {
      throw new Error('OData URL is required for ODataDataSource')
    }
  }

  async load(options: LoadOptions = {}): Promise<DataResult<any>> {
    // Check cache
    const cacheKey = this.getCacheKey(options)
    if (this.config.cache) {
      const cached = this.getFromCache(cacheKey)
      if (cached) {
        console.log('✅ Using cached OData result')
        return cached
      }
    }

    const queryOptions = ODataQueryBuilder.fromLoadOptions(options).build()
    const result = await ODataQueryBuilder.fetchOData(
      this.config.url!,
      queryOptions,
      this.config.fetchOptions
    )

    // Store in cache
    if (this.config.cache && result.data) {
      this.setToCache(cacheKey, result)
    }

    return result
  }

  async reload(): Promise<DataResult<any>> {
    this.clearCache()
    return this.load({})
  }

  updateConfig(updates: Partial<DataSourceConfig>): void {
    Object.assign(this.config, updates)

    if (updates.url === undefined && !this.config.url) {
      throw new Error('OData URL is required')
    }
  }

  getQueryOptions(options: LoadOptions = {}): ODataOptions {
    return ODataQueryBuilder.fromLoadOptions(options).build()
  }

  async executeQuery(options: ODataOptions): Promise<DataResult<any>> {
    return ODataQueryBuilder.fetchOData(
      this.config.url!,
      options,
      this.config.fetchOptions
    )
  }

  // ===== CACHE MANAGEMENT =====
  private getCacheKey(options: LoadOptions): string {
    return JSON.stringify({
      skip: options.skip,
      take: options.take,
      sort: options.sort,
      filter: options.filter,
      group: options.group,
      search: options.search,
    })
  }

  private getFromCache(key: string): DataResult | null {
    const cached = this.cache.get(key)
    if (!cached) return null

    const isExpired = Date.now() - cached.timestamp > this.cacheDuration
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setToCache(key: string, data: DataResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })

    // Limit cache size
    if (this.cache.size > 50) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) this.cache.delete(firstKey)
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}

// ===== HELPER FUNCTIONS =====

/**
 * Build OData filter from conditions
 */
export function buildODataFilter(conditions: FilterCondition[]): string {
  const builder = new ODataQueryBuilder()
  conditions.forEach((condition) => builder.filter(condition))
  return builder.build().$filter || ''
}

/**
 * Build OData orderby from sort descriptors
 */
export function buildODataOrderBy(sorts: SortDescriptor[]): string {
  const parts = sorts.map((sort) => {
    const fieldStr = String(sort.field)
    return sort.direction === 'desc' ? `${fieldStr} desc` : fieldStr
  })
  return parts.join(',')
}

/**
 * Build OData groupby from group descriptors
 */
export function buildODataGroupBy(groups: GroupDescriptor[]): string {
  return groups.map((g) => `groupby((${String(g.field)}))`).join(',')
}

/**
 * Parse OData error response
 */
export function parseODataError(response: any): { code: string; message: string } {
  if (response.error) {
    return {
      code: response.error.code || 'ODATA_ERROR',
      message: response.error.message || 'OData request failed',
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'Unknown OData error',
  }
}

/**
 * Validate OData query parameters
 */
export function validateODataQuery(options: ODataOptions): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check $top
  if (options.$top !== undefined && options.$top < 0) {
    errors.push('$top must be non-negative');
  }
  
  // Check $skip
  if (options.$skip !== undefined && options.$skip < 0) {
    errors.push('$skip must be non-negative');
  }
  
  // Check $filter syntax (basic)
  if (options.$filter && typeof options.$filter !== 'string') {
    errors.push('$filter must be a string');
  }
  
  // Check $orderby syntax (basic)
  if (options.$orderby && typeof options.$orderby !== 'string') {
    errors.push('$orderby must be a string');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}