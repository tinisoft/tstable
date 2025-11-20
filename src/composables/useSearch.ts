/**
 * @fileoverview Enhanced search composable
 * @module composables/useSearch
 */

import { computed, ref, watch } from 'vue'
import { ColumnSearcher } from '../utils/column-searcher'
import type { ColumnDefinition, RowKey } from '../types'
import type { SearchConfig, SearchResult, SearchState } from '../types'
import type { GridEmit } from '../types'
import { debounce } from '../utils/performance'

export function useSearch<T = any>(
  data: () => T[],
  columns: () => ColumnDefinition[],
  config: SearchConfig = { enabled: true, minLength: 1, debounce: 300 },
  emit?: GridEmit<T>,
  getRowKey?: (row: T) => RowKey | string | number
) {
  const searchTerm = ref('')
  const results = ref<SearchResult<T>[]>([])
  const loading = ref(false)
  const highlightedRows = ref<Set<any>>(new Set())
  const activeMatchIndex = ref<number>()

  const searcher = new ColumnSearcher(columns(), config)

  // Default key getter - tries common key fields
  const defaultGetRowKey = (row: T): string => {
    if (getRowKey) {
      return String(getRowKey(row))
    }
    // Try common key field names
    const record = row as any
    if (record.id !== undefined) return String(record.id)
    if (record.key !== undefined) return String(record.key)
    if (record._id !== undefined) return String(record._id)
    // Fallback to using the row index or object reference
    const index = data().indexOf(row)
    return index !== -1 ? String(index) : String(row)
  }

  const searchState = computed<SearchState>(() => ({
    term: searchTerm.value,
    results: results.value,
    totalMatches: results.value.reduce((total, r) => total + r.matches.length, 0),
    isSearching: loading.value,
    highlightedRows: highlightedRows.value,
    activeMatchIndex: activeMatchIndex.value
  }))

  const hasResults = computed(() => results.value.length > 0)
  const hasSearchTerm = computed(() => !!searchTerm.value?.trim())
  const isSearching = computed(() => loading.value)

  // ===== EXECUTE SEARCH =====
  const executeSearch = () => {
    if (!config.enabled) {
      results.value = []
      return
    }

    const minLen = config.minLength || 1
    const term = searchTerm.value?.trim() || ''
    
    if (!term || term.length < minLen) {
      results.value = []
      highlightedRows.value.clear()
      activeMatchIndex.value = undefined
      emit?.('search', { term: '' })
      return
    }

    loading.value = true
    try {
      const currentData = data()
      const searchResults = searcher.search(currentData, term, true) as SearchResult<T>[]
      
      // Ensure each result has a proper rowKey
      results.value = searchResults.map(result => ({
        ...result,
        rowKey: result.rowKey || defaultGetRowKey(result.row)
      }))
      
      // Update highlighted rows using the rowKey from results
      highlightedRows.value = new Set(
        results.value.map(r => r.rowKey)
      )
      
      // Set first match as active
      if (results.value.length > 0) {
        activeMatchIndex.value = 0
      }
      
      emit?.('search', { term })
      
    } catch (error) {
      console.error('Search error:', error)
      results.value = []
      highlightedRows.value.clear()
      activeMatchIndex.value = undefined
    } finally {
      loading.value = false
    }
  }

  // ===== DEBOUNCED SEARCH =====
  const debouncedSearch = debounce(() => {
    executeSearch()
  }, config.debounce || 300)

  // ===== SEARCH =====
  const search = (term: string) => {
    searchTerm.value = term
  }

  // ===== CLEAR SEARCH =====
  const clearSearch = () => {
    if (config.enabled) {
      searchTerm.value = ''
      results.value = []
      highlightedRows.value.clear()
      activeMatchIndex.value = undefined
      emit?.('search', { term: '' })
    }
  }

  // ===== GET HIGHLIGHTED VALUE =====
  const getHighlightedValue = (row: T, field: string): string => {
    const result = results.value.find(r => r.row === row)
    if (!result) {
      const value = (row as any)[field]
      return String(value !== undefined && value !== null ? value : '')
    }

    const match = result.matches.find(m => m.field === field)
    if (!match) {
      const value = (row as any)[field]
      return String(value !== undefined && value !== null ? value : '')
    }

    return searcher.getHighlightHTML(match.value, [match])
  }

  // ===== IS ROW HIGHLIGHTED =====
  const isRowHighlighted = (row: T): boolean => {
    const rowKey = defaultGetRowKey(row)
    return highlightedRows.value.has(rowKey)
  }

  // ===== GET MATCH COUNT =====
  const getMatchCount = (row: T): number => {
    const result = results.value.find(r => r.row === row)
    return result?.matches.length || 0
  }

  // ===== GET MATCHES FOR ROW =====
  const getMatchesForRow = (row: T) => {
    return results.value.find(r => r.row === row)?.matches || []
  }

  // ===== SEARCH WITH FILTERS =====
  const searchWithFilters = (term: string, filters: Record<string, any>) => {
    if (!config.enabled) return

    loading.value = true
    try {
      const currentData = data()
      const searchResults = searcher.searchWithFilters(currentData, term, filters) as SearchResult<T>[]
      
      // Ensure each result has a proper rowKey
      results.value = searchResults.map(result => ({
        ...result,
        rowKey: result.rowKey || defaultGetRowKey(result.row)
      }))
      
      highlightedRows.value = new Set(
        results.value.map(r => r.rowKey)
      )
      
      if (results.value.length > 0) {
        activeMatchIndex.value = 0
      }
      
      emit?.('search', { term })
    } catch (error) {
      console.error('Search with filters error:', error)
      results.value = []
      activeMatchIndex.value = undefined
    } finally {
      loading.value = false
    }
  }

  // ===== NAVIGATE MATCHES =====
  const navigateToNextMatch = () => {
    if (!hasResults.value) return
    
    const totalMatches = results.value.reduce((total, r) => total + r.matches.length, 0)
    if (totalMatches === 0) return
    
    const currentIndex = activeMatchIndex.value ?? -1
    activeMatchIndex.value = (currentIndex + 1) % totalMatches
  }

  const navigateToPreviousMatch = () => {
    if (!hasResults.value) return
    
    const totalMatches = results.value.reduce((total, r) => total + r.matches.length, 0)
    if (totalMatches === 0) return
    
    const currentIndex = activeMatchIndex.value ?? 0
    activeMatchIndex.value = currentIndex === 0 ? totalMatches - 1 : currentIndex - 1
  }

  // ===== GET ACTIVE MATCH =====
  const getActiveMatch = () => {
    if (activeMatchIndex.value === undefined || !hasResults.value) return null
    
    let currentIndex = 0
    for (const result of results.value) {
      for (const match of result.matches) {
        if (currentIndex === activeMatchIndex.value) {
          return { result, match }
        }
        currentIndex++
      }
    }
    return null
  }

  // ===== GET SEARCHABLE FIELDS =====
  const getSearchableFields = (): string[] => {
    return searcher.getSearchableFields()
  }

  // ===== UPDATE CONFIG =====
  const updateConfig = (newConfig: Partial<SearchConfig>) => {
    Object.assign(config, newConfig)
    searcher.updateColumns(columns())
    
    if (searchTerm.value) {
      executeSearch()
    }
  }

  // ===== GET STATS =====
  const getStats = () => {
    return {
      ...searcher.getStats(),
      resultCount: results.value.length,
      totalMatches: searchState.value.totalMatches,
      hasResults: hasResults.value,
      term: searchTerm.value,
      activeMatchIndex: activeMatchIndex.value
    }
  }

  // ===== CLEAR CACHE =====
  const clearCache = () => {
    searcher.clearCache()
  }

  // ===== HIGHLIGHT CONFIG =====
  const updateHighlightConfig = (highlightClass?: string) => {
    if (highlightClass && config.highlightClass !== highlightClass) {
      config.highlightClass = highlightClass
      searcher.updateColumns(columns())
    }
  }

  // Watch searchTerm changes
  watch(searchTerm, () => {
    if (config.debounce && config.debounce > 0) {
      debouncedSearch()
    } else {
      executeSearch()
    }
  }, { immediate: false })

  // Watch data changes
  watch(data, () => {
    if (searchTerm.value?.trim()) {
      executeSearch()
    }
  }, { deep: false })

  // Watch columns changes
  watch(columns, (newColumns) => {
    searcher.updateColumns(newColumns)
    if (searchTerm.value?.trim()) {
      executeSearch()
    }
  }, { deep: false })

  // Watch enabled state
  watch(
    () => config.enabled,
    (enabled) => {
      if (!enabled) {
        clearSearch()
      }
    }
  )

  return {
    // State
    searchTerm,
    results,
    loading,
    highlightedRows,
    searchState,
    hasResults,
    hasSearchTerm,
    isSearching,
    activeMatchIndex,
    
    // Methods
    search,
    executeSearch,
    clearSearch,
    getHighlightedValue,
    isRowHighlighted,
    getMatchCount,
    getMatchesForRow,
    searchWithFilters,
    navigateToNextMatch,
    navigateToPreviousMatch,
    getActiveMatch,
    getSearchableFields,
    updateConfig,
    updateHighlightConfig,
    getStats,
    clearCache,
    
    // Computed
    enabled: computed(() => config.enabled),
    totalMatches: computed(() => searchState.value.totalMatches)
  }
}