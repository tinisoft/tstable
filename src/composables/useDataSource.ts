/**
 * @fileoverview Enhanced data source composable with caching and retry logic
 * @module composables/useDataSource
 */

import { ref, computed, watch, onBeforeUnmount } from 'vue';
import {
  DataSourceConfig,
  DataResult,
  LoadOptions,
  DataSourceType,
  FilterCondition,
  ColumnType,
  FilterOperator,
} from '../types';
import type { ColumnDefinition } from '../types';
import { ODataQueryBuilder } from '../utils/odata';
import { GridError, GridErrorCode } from '../utils/error-handling';

export interface DataSourceState {
  loading: boolean;
  loaded: boolean;
  error: Error | null;
  retryCount: number;
  lastLoadTime: Date | null;
}

// Extended DataResult with pagination info
export interface ExtendedDataResult<T = any> extends DataResult<T> {
  skip?: number;
  take?: number;
  actualPageSize?: number;
  serverPageSizeLimit?: number;
}

export function useDataSource(config: DataSourceConfig, columns: () => ColumnDefinition[]) {
  const data = ref<any[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const loaded = ref(false);
  const error = ref<Error | null>(null);
  const currentLoadOptions = ref<LoadOptions>({});
  const retryCount = ref(0);
  const lastLoadTime = ref<Date | null>(null);

  // ===== CACHE =====
  const cache = new Map<string, { data: any[]; total: number; timestamp: number }>();
  const cacheEnabled = computed(() => config.cache ?? false);
  const cacheDuration = computed(() => config.cacheDuration ?? 5 * 60 * 1000); // 5 minutes

  // Fix: Import and use DataSourceType enum
  const isLocal = computed(
    () =>
      config.type === DataSourceType.Array ||
      config.type === DataSourceType.Local ||
      (!config.type && !!config.data)
  );

  // ===== STATE =====
  const state = computed<DataSourceState>(() => ({
    loading: loading.value,
    loaded: loaded.value,
    error: error.value,
    retryCount: retryCount.value,
    lastLoadTime: lastLoadTime.value,
  }));

  // ===== CACHE KEY GENERATOR =====
  const generateCacheKey = (options: LoadOptions): string => {
    if (config.cacheKeyGenerator) {
      return config.cacheKeyGenerator(options);
    }
    return JSON.stringify({
      skip: options.skip,
      take: options.take,
      sort: options.sort,
      filter: options.filter,
      group: options.group,
      search: options.search,
    });
  };

  // ===== GET FROM CACHE =====
  const getFromCache = (key: string): { data: any[]; total: number } | null => {
    if (!cacheEnabled.value) return null;

    const cached = cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cacheDuration.value;
    if (isExpired) {
      cache.delete(key);
      return null;
    }

    return { data: cached.data, total: cached.total };
  };

  // ===== SET TO CACHE =====
  const setToCache = (key: string, data: any[], total: number) => {
    if (!cacheEnabled.value) return;

    cache.set(key, {
      data: [...data],
      total,
      timestamp: Date.now(),
    });

    // Limit cache size (max 50 entries)
    if (cache.size > 50) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
  };

  // ===== CLEAR CACHE =====
  const clearCache = () => {
    cache.clear();
  };

  // ===== LOAD =====
  const load = async (options: LoadOptions = {}): Promise<ExtendedDataResult> => {
    loading.value = true;
    error.value = null;

    // Detect filter/search changes and reset pagination
    const previousOptions = { ...currentLoadOptions.value };
    const filtersChanged =
      JSON.stringify(previousOptions.filter) !== JSON.stringify(options.filter);
    const searchChanged = previousOptions.search !== options.search;

    if (filtersChanged || searchChanged) {
      console.log('🔄 Filters/Search changed - resetting pagination');
      options.skip = 0;
    }

    currentLoadOptions.value = { ...options };

    // Check cache
    const cacheKey = generateCacheKey(options);
    const cached = getFromCache(cacheKey);
    if (cached) {
      console.log('✅ Using cached data');
      data.value = cached.data;
      total.value = cached.total;
      loading.value = false;
      loaded.value = true;
      lastLoadTime.value = new Date();
      return {
        data: cached.data,
        totalCount: cached.total, // ✅ Use totalCount for consistency
        skip: options.skip,
        take: options.take,
      };
    }

    // Before load hook
    if (config.onBeforeLoad) {
      const modifiedOptions = await config.onBeforeLoad(options);
      if (modifiedOptions) {
        Object.assign(options, modifiedOptions);
      }
    }

    try {
      let result: ExtendedDataResult;

      if (isLocal.value) {
        result = loadLocal(options);
      }
      // ✅ FIXED: Check for custom type first
      else if (config.type === DataSourceType.Custom || config.customStore) {
        result = await loadCustomStore(options);
      } else if (config.type === DataSourceType.OData || config.type === ('odata' as any)) {
        result = await loadOData(options);
      } else {
        throw new GridError(
          GridErrorCode.CONFIG_INVALID_DATASOURCE,
          `Unsupported data source type: ${config.type || 'undefined'}. Use 'local', 'odata', or 'custom'.`
        );
      }

      data.value = result.data;
      total.value = result.totalCount; // Fix: use totalCount
      loaded.value = true;
      retryCount.value = 0;
      lastLoadTime.value = new Date();

      // Set cache
      setToCache(cacheKey, result.data, result.totalCount); // Fix: use totalCount

      // After load hook
      if (config.onAfterLoad) {
        const modifiedResult = config.onAfterLoad(result);
        if (modifiedResult) {
          result = { ...result, ...modifiedResult };
        }
      }

      // Add pagination info
      result.skip = options.skip;
      result.take = options.take;

      return result;
    } catch (e) {
      error.value = e as Error;

      // Error hook
      if (config.onLoadError) {
        config.onLoadError({
          code: 'LOAD_ERROR',
          message: String(e),
        });
      }

      console.error('Data source error:', e);

      return {
        data: [],
        totalCount: 0, // Fix: use totalCount
        error: {
          code: 'LOAD_ERROR',
          message: error.value?.message || String(e),
        },
      };
    } finally {
      loading.value = false;
    }
  };

  // ===== LOAD WITH RETRY =====
  const loadWithRetry = async (
    options: LoadOptions = {},
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<ExtendedDataResult> => {
    for (let i = 0; i <= maxRetries; i++) {
      try {
        retryCount.value = i;
        const result = await load(options);

        if (!result.error) {
          return result;
        }

        if (i < maxRetries) {
          console.log(`Retry ${i + 1}/${maxRetries} after ${retryDelay}ms`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      } catch (e) {
        if (i === maxRetries) {
          throw e;
        }
      }
    }

    return { data: [], totalCount: 0 }; // Fix: use totalCount
  };

  // ===== LOAD LOCAL =====
  const loadLocal = (options: LoadOptions): ExtendedDataResult => {
    let result = [...(config.data || [])];

    // Apply search
    if (options.search && options.search.trim()) {
      const searchTerm = options.search.toLowerCase();
      const searchFields = config.searchFields || columns().map((c) => String(c.field));

      result = result.filter((row) =>
        searchFields.some((field) => {
          const value = String(row[field] || '').toLowerCase();
          return value.includes(searchTerm);
        })
      );
    }

    // Apply filters
    if (options.filter && options.filter.length) {
      result = result.filter((row) => options.filter!.every((f) => applyFilter(row, f)));
    }

    // Apply sorting
    if (options.sort && options.sort.length) {
      result = sortData(result, options.sort);
    }

    const totalBeforePaging = result.length;

    // Apply pagination
    if (options.skip !== undefined && options.take !== undefined) {
      const start = options.skip;
      const end = start + options.take;
      result = result.slice(start, end);
    }

    return {
      data: result,
      totalCount: totalBeforePaging, // Fix: use totalCount
      skip: options.skip,
      take: options.take,
    };
  };

  // ===== LOAD ODATA =====
  const loadOData = async (options: LoadOptions): Promise<ExtendedDataResult> => {
    if (!config.url) {
      throw new GridError(GridErrorCode.CONFIG_INVALID_DATASOURCE, 'OData URL is required');
    }

    const hasGrouping = options.group && options.group.length > 0;

    const queryBuilder = ODataQueryBuilder.fromLoadOptions(options, columns());
    const odataOptions = queryBuilder.build();

    console.log('🔷 OData Query Options:', {
      ...odataOptions,
      requestedPageSize: options.take,
      requestedSkip: options.skip,
      hasGrouping,
      currentPage: options.skip && options.take ? Math.floor(options.skip / options.take) + 1 : 1,
    });

    const params = new URLSearchParams();
    Object.entries(odataOptions).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== false) {
        params.append(key, String(value));
      }
    });

    const fullUrl = `${config.url}${config.url.includes('?') ? '&' : '?'}${params.toString()}`;
    console.log('🔷 OData Request URL:', fullUrl);

    // Timeout handling
    const timeout = config.timeout || 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...config.headers,
          ...config.fetchOptions?.headers,
        },
        signal: controller.signal,
        ...config.fetchOptions,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 401) {
          throw new GridError(GridErrorCode.DATA_UNAUTHORIZED, 'Unauthorized access');
        }
        throw new GridError(
          GridErrorCode.DATA_NETWORK_ERROR,
          `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Transform response if needed
      const transformedResult = config.transformResponse
        ? config.transformResponse(result)
        : result;

      // Handle grouped data
      if (hasGrouping && transformedResult.value && options.group) {
        // Fix: Extract field names from GroupDescriptor[]
        const groupFields = options.group.map((g) => String(g.field));
        const groupedData = transformODataGroups(transformedResult.value, groupFields);
        
        return {
          data: groupedData,
          totalCount: transformedResult['@odata.count'] || groupedData.length, // Fix: use totalCount
          skip: options.skip,
          take: options.take,
          metadata: transformedResult, // Fix: use metadata instead of extra
        };
      }

      // Regular data
      const data = transformedResult.value || transformedResult.data || transformedResult;
      const totalCount =
        transformedResult['@odata.count'] ||
        transformedResult['odata.count'] ||
        transformedResult.count ||
        (Array.isArray(data) ? data.length : 0);

      const actualRecordsReturned = Array.isArray(data) ? data.length : 0;
      const requestedPageSize = options.take || 0;

      if (
        actualRecordsReturned < requestedPageSize &&
        options.skip !== undefined &&
        options.skip + actualRecordsReturned < totalCount
      ) {
        console.warn(
          `⚠️ Server returned only ${actualRecordsReturned} records instead of requested ${requestedPageSize}`
        );
        (config as any).__serverPageSizeLimit = actualRecordsReturned;
      }

      return {
        data: Array.isArray(data) ? data : [],
        totalCount: totalCount, // Fix: use totalCount
        skip: options.skip,
        take: actualRecordsReturned,
        actualPageSize: actualRecordsReturned,
        serverPageSizeLimit: (config as any).__serverPageSizeLimit,
        metadata: transformedResult, // Fix: use metadata instead of extra
      };
    } catch (e: any) {
      clearTimeout(timeoutId);

      if (e.name === 'AbortError') {
        throw new GridError(GridErrorCode.DATA_TIMEOUT, `Request timeout after ${timeout}ms`);
      }

      throw e;
    }
  };

  // ===== LOAD CUSTOM STORE =====
  const loadCustomStore = async (options: LoadOptions): Promise<ExtendedDataResult> => {
    if (!config.customStore || !config.customStore.load) {
      throw new GridError(
        GridErrorCode.CONFIG_INVALID_DATASOURCE,
        'Custom store must have a "load" function. Use: { type: "custom", customStore: { load: async (options) => {...} } }'
      );
    }

    console.log('🔧 Loading from custom store with options:', options);

    const result = await config.customStore.load(options);

    console.log('✅ Custom store returned:', {
      dataLength: result.data?.length || 0,
      totalCount: result.totalCount,
    });

    return {
      data: result.data || [],
      totalCount: result.totalCount || result.data?.length || 0,
      skip: options.skip,
      take: options.take,
    };
  };

  // ===== TRANSFORM ODATA GROUPS =====
  const transformODataGroups = (odataGroups: any[], groupFields: string[]): any[] => {
    return odataGroups.flatMap((group) => ({
      key: groupFields.map((field) => group[field]).join('|'),
      field: groupFields[0],
      value: group[groupFields[0]],
      items: group.Items || [],
      level: 0,
      expanded: true,
      isGroup: true,
    }));
  };

  // ===== SORT DATA =====
  const sortData = (items: any[], sorts: any[]): any[] => {
    return [...items].sort((a, b) => {
      for (const sort of sorts) {
        const column = columns().find((c) => c.field === sort.field);
        let aVal = a[sort.field];
        let bVal = b[sort.field];

        if (column) {
          // Fix: Use ColumnType enum
          if (column.type === ColumnType.Number) {
            aVal = aVal != null ? Number(aVal) : null;
            bVal = bVal != null ? Number(bVal) : null;
          } else if (column.type === ColumnType.Date || column.type === ColumnType.DateTime) {
            aVal = aVal ? new Date(aVal) : null;
            bVal = bVal ? new Date(bVal) : null;
          }
        }

        if (aVal == null && bVal == null) continue;
        if (aVal == null) return sort.direction === 'asc' ? 1 : -1;
        if (bVal == null) return sort.direction === 'asc' ? -1 : 1;

        if (aVal === bVal) continue;

        const modifier = sort.direction === 'asc' ? 1 : -1;

        if (aVal instanceof Date && bVal instanceof Date) {
          return (aVal.getTime() - bVal.getTime()) * modifier;
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * modifier;
        } else {
          return (aVal > bVal ? 1 : -1) * modifier;
        }
      }
      return 0;
    });
  };

  // ===== APPLY FILTER =====
  const applyFilter = (row: any, filter: FilterCondition): boolean => {
    const value = row[filter.field];
    const filterValue = filter.value;

    // Fix: Use FilterOperator enum (cast for now since strings are used)
    switch (filter.operator) {
      case FilterOperator.Equals:
        return value === filterValue;
      case FilterOperator.NotEquals:
        return value !== filterValue;
      case FilterOperator.Contains:
        return String(value || '')
          .toLowerCase()
          .includes(String(filterValue || '').toLowerCase());
      case FilterOperator.StartsWith:
        return String(value || '')
          .toLowerCase()
          .startsWith(String(filterValue || '').toLowerCase());
      case FilterOperator.EndsWith:
        return String(value || '')
          .toLowerCase()
          .endsWith(String(filterValue || '').toLowerCase());
      case FilterOperator.GreaterThan:
        return Number(value) > Number(filterValue);
      case FilterOperator.GreaterThanOrEqual:
        return Number(value) >= Number(filterValue);
      case FilterOperator.LessThan:
        return Number(value) < Number(filterValue);
      case FilterOperator.LessThanOrEqual:
        return Number(value) <= Number(filterValue);
      case FilterOperator.In:
        if (Array.isArray(filterValue)) {
          if (value === null || value === undefined || value === '') {
            return filterValue.includes(null) || filterValue.includes('');
          }
          return filterValue.includes(value);
        }
        return false;
      case FilterOperator.Between:
        return Number(value) >= Number(filterValue) && Number(value) <= Number(filter.value2);
      case FilterOperator.IsNull:
        return value === null || value === undefined;
      case FilterOperator.IsNotNull:
        return value !== null && value !== undefined;
      case FilterOperator.IsEmpty:
        return value === null || value === undefined || value === '';
      case FilterOperator.IsNotEmpty:
        return value !== null && value !== undefined && value !== '';
      default:
        return true;
    }
  };

  // ===== RELOAD =====
  const reload = async (): Promise<ExtendedDataResult> => {
    clearCache();
    return load(currentLoadOptions.value);
  };

  // ===== INSERT =====
  const insert = async (values: any): Promise<any> => {
    if (config.customStore?.insert) {
      return config.customStore.insert(values);
    }

    // For local data
    if (isLocal.value && config.data) {
      config.data.push(values);
      await reload();
      return values;
    }

    throw new GridError(GridErrorCode.OP_EDIT_FAILED, 'Insert operation not supported');
  };

  // ===== UPDATE =====
  const update = async (key: any, values: any): Promise<any> => {
    if (config.customStore?.update) {
      return config.customStore.update(key, values);
    }

    // For local data
    if (isLocal.value && config.data) {
      const keyField = String(config.key || 'id');
      const index = config.data.findIndex((row) => row[keyField] === key);
      if (index >= 0) {
        Object.assign(config.data[index], values);
        await reload();
        return config.data[index];
      }
    }

    throw new GridError(GridErrorCode.OP_EDIT_FAILED, 'Update operation not supported');
  };

  // ===== REMOVE =====
  const remove = async (key: any): Promise<void> => {
    if (config.customStore?.remove) {
      return config.customStore.remove(key);
    }

    // For local data
    if (isLocal.value && config.data) {
      const keyField = String(config.key || 'id');
      const index = config.data.findIndex((row) => row[keyField] === key);
      if (index >= 0) {
        config.data.splice(index, 1);
        await reload();
        return;
      }
    }

    throw new GridError(GridErrorCode.OP_DELETE_FAILED, 'Remove operation not supported');
  };

  // ===== BY KEY =====
  const byKey = async (key: any): Promise<any | undefined> => {
    if (config.customStore?.byKey) {
      return config.customStore.byKey(key);
    }

    const keyField = String(config.key || 'id');
    return data.value.find((row) => row[keyField] === key);
  };

  // ===== WATCH DATA CHANGES =====
  watch(
    () => config.data,
    () => {
      if (isLocal.value && config.data) {
        clearCache();
        load();
      }
    },
    { immediate: true, deep: false }
  );

  // ===== CLEANUP =====
  onBeforeUnmount(() => {
    clearCache();
  });

  return {
    // State
    data,
    total,
    loading,
    loaded,
    error,
    state,
    isLocal,
    currentLoadOptions,
    retryCount,
    lastLoadTime,

    // Methods
    load,
    reload,
    loadWithRetry,
    insert,
    update,
    remove,
    byKey,
    clearCache,
  };
}
