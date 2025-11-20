/**
 * @fileoverview Enhanced column searcher utility
 * @module utils/column-searcher
 */

import type { ColumnDefinition } from '../types/core/column'
import { SearchMode, type SearchConfig, type SearchMatch, type SearchResult } from '../types/features/searching'
import { debounce } from './performance'

export class ColumnSearcher {
  private columns: ColumnDefinition[]
  private config: Required<SearchConfig>
  private cache: Map<string, SearchResult[]> = new Map()
  private searchIndex: Map<string, Set<number>> | null = null

  constructor(columns: ColumnDefinition[], config: Partial<SearchConfig> = {}) {
    this.columns = columns
    this.config = {
      enabled: true,
      mode: SearchMode.Contains,
      caseSensitive: false,
      debounce: 300,
      minLength: 2,
      highlight: true,
      highlightClass: 'search-highlight',
      showMatchCount: false,
      placeholder: 'Search...',
      fields: [],
      ...config
    }

    if (!Array.isArray(this.config.fields)) {
      this.config.fields = []
    }
  }

  // ===== BUILD SEARCH INDEX =====
  private buildSearchIndex(data: any[]): void {
    const fields = this.getSearchableFields()
    this.searchIndex = new Map()

    data.forEach((row, rowIndex) => {
      fields.forEach((field) => {
        const value = String(row[field] || '').toLowerCase().trim()

        // Index full value
        if (!this.searchIndex!.has(value)) {
          this.searchIndex!.set(value, new Set())
        }
        this.searchIndex!.get(value)!.add(rowIndex)

        // Index words
        const words = value.split(/\s+/)
        words.forEach((word) => {
          if (word.length >= 2) {
            if (!this.searchIndex!.has(word)) {
              this.searchIndex!.set(word, new Set())
            }
            this.searchIndex!.get(word)!.add(rowIndex)
          }
        })

        // Index n-grams for partial matching
        for (let i = 0; i <= value.length - 2; i++) {
          const ngram = value.substring(i, i + 2)
          if (!this.searchIndex!.has(ngram)) {
            this.searchIndex!.set(ngram, new Set())
          }
          this.searchIndex!.get(ngram)!.add(rowIndex)
        }
      })
    })
  }

  // ===== SEARCH WITH INDEX =====
  private searchWithIndex(data: any[], term: string): Set<number> {
    if (!this.searchIndex) {
      this.buildSearchIndex(data)
    }

    const searchTerm = this.config.caseSensitive ? term : term.toLowerCase()
    const matchingIndices = new Set<number>()

    // Search for exact matches
    if (this.searchIndex!.has(searchTerm)) {
      this.searchIndex!.get(searchTerm)!.forEach((idx) => matchingIndices.add(idx))
    }

    // Search for partial matches using n-grams
    if (searchTerm.length >= 2) {
      for (let i = 0; i <= searchTerm.length - 2; i++) {
        const ngram = searchTerm.substring(i, i + 2)
        if (this.searchIndex!.has(ngram)) {
          this.searchIndex!.get(ngram)!.forEach((idx) => matchingIndices.add(idx))
        }
      }
    }

    return matchingIndices
  }

  // ===== SEARCH =====
  search(data: any[], term: string, immediate = false): SearchResult[] {
    if (!this.config.enabled || !term || term.length < this.config.minLength) {
      return data.map((row, index) => ({
        row,
        rowKey: this.getRowKey(row, index),
        score: 0,
        matches: []
      } as SearchResult))
    }

    const cacheKey = `${term}-${this.config.mode}-${data.length}`
    
    if (this.cache.has(cacheKey) && !immediate) {
      return this.cache.get(cacheKey)!
    }

    if (immediate) {
      const results = this.performSearch(data, term)
      this.cache.set(cacheKey, results)
      return results
    } else {
      const debouncedSearch = debounce(() => {
        const results = this.performSearch(data, term)
        this.cache.set(cacheKey, results)
      }, this.config.debounce)
      debouncedSearch()
      return []
    }
  }

  // ===== PERFORM SEARCH =====
  private performSearch(data: any[], term: string): SearchResult[] {
    const searchTerm = this.config.caseSensitive ? term : term.toLowerCase()
    const searchableFields = this.getSearchableFields()

    // Use index for better performance on large datasets
    let candidateIndices: Set<number> | null = null
    if (data.length > 100) {
      candidateIndices = this.searchWithIndex(data, searchTerm)
    }

    const results = data
      .map((row, index) => {
        // Skip if not in candidate set
        if (candidateIndices && !candidateIndices.has(index)) {
          return null
        }
        return this.calculateScore(row, searchableFields, searchTerm, index)
      })
      .filter((result): result is SearchResult => result !== null && result.score > 0)
      .sort((a, b) => b.score - a.score)

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    return results
  }

  // ===== CALCULATE SCORE =====
  private calculateScore(
    row: any,
    fields: string[],
    searchTerm: string,
    rowIndex: number
  ): SearchResult {
    let score = 0
    const matches: SearchMatch[] = []

    fields.forEach((field) => {
      const value = row[field]
      if (value == null) return

      const stringValue = String(value)
      const compareValue = this.config.caseSensitive
        ? stringValue
        : stringValue.toLowerCase()

      const matchInfo = this.findMatch(compareValue, searchTerm, field, value, stringValue)
      if (matchInfo) {
        matches.push(matchInfo)

        const column = this.columns.find((c) => c.field === field)
        const weight = column?.searchWeight ?? 1
        score += (matchInfo.score ?? 0) * weight
      }
    })

    // Position boost (earlier rows score slightly higher)
    if (score > 0) {
      score += Math.max(0, (100 - rowIndex) * 0.001)
    }

    return { 
      row, 
      rowKey: this.getRowKey(row, rowIndex), 
      score, 
      matches 
    }
  }

  // ===== FIND MATCH =====
  private findMatch(
    compareValue: string,
    searchTerm: string,
    field: string,
    originalValue: any,
    stringValue: string
  ): SearchMatch | null {
    switch (this.config.mode) {
      case 'startsWith':
        if (compareValue.startsWith(searchTerm)) {
          return {
            field,
            value: originalValue,
            match: stringValue,
            startIndex: 0,
            endIndex: searchTerm.length,
            score: 100
          }
        }
        break

      case 'equals':
        if (compareValue === searchTerm) {
          return {
            field,
            value: originalValue,
            match: stringValue,
            startIndex: 0,
            endIndex: searchTerm.length,
            score: 200
          }
        }
        break

      case 'contains':
      default: {
        const index = compareValue.indexOf(searchTerm)
        if (index !== -1) {
          // Score higher for earlier matches
          const positionBonus = Math.max(0, 25 - index * 0.5)
          return {
            field,
            value: originalValue,
            match: stringValue,
            startIndex: index,
            endIndex: index + searchTerm.length,
            score: 50 + positionBonus
          }
        }
        break
      }
    }

    return null
  }

  // ===== GET ROW KEY =====
  private getRowKey(row: any, index: number): any {
    return row?.id ?? row?.key ?? index
  }

  // ===== GET SEARCHABLE FIELDS =====
  getSearchableFields(): string[] {
    let fields: string[] =
      this.config.fields && this.config.fields.length > 0
        ? this.config.fields.map(f => String(f))
        : this.columns
            .filter(
              (col) =>
                col.visible !== false &&
                col.searchable !== false &&
                col.type !== 'boolean' &&
                String(col.field) !== '__selection__'
            )
            .map((col) => String(col.field))

    return [...new Set(fields)]
  }

  // ===== CLEAR CACHE =====
  clearCache(): void {
    this.cache.clear()
    this.searchIndex = null
  }

  // ===== GET HIGHLIGHT HTML =====
  getHighlightHTML(value: any, matches: SearchMatch[]): string {
    if (!this.config.highlight || !matches.length) {
      return String(value ?? '')
    }

    let result = String(value ?? '')
    const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex)

    sortedMatches.forEach(({ startIndex, endIndex }) => {
      if (startIndex >= 0 && endIndex <= result.length) {
        const before = result.substring(0, startIndex)
        const match = result.substring(startIndex, endIndex)
        const after = result.substring(endIndex)
        const highlightClass = this.config.highlightClass || 'search-highlight'
        result = `${before}<mark class="${highlightClass}">${match}</mark>${after}`
      }
    })

    return result
  }

  // ===== SEARCH WITH FILTERS =====
  searchWithFilters(
    data: any[],
    term: string,
    filters: Record<string, any> = {}
  ): SearchResult[] {
    let filteredData = data

    Object.entries(filters).forEach(([field, filterValue]) => {
      if (filterValue != null) {
        filteredData = filteredData.filter((row) => {
          const value = row[field]
          return (
            value != null &&
            String(value).toLowerCase().includes(String(filterValue).toLowerCase())
          )
        })
      }
    })

    return this.search(filteredData, term, true)
  }

  // ===== UPDATE COLUMNS =====
  updateColumns(columns: ColumnDefinition[]): void {
    this.columns = columns
    this.clearCache()
  }

  // ===== GET STATS =====
  getStats(): { cacheSize: number; searchableFields: number; indexSize: number } {
    return {
      cacheSize: this.cache.size,
      searchableFields: this.getSearchableFields().length,
      indexSize: this.searchIndex?.size || 0
    }
  }

  // ===== REBUILD INDEX =====
  rebuildIndex(data: any[]): void {
    this.buildSearchIndex(data)
  }
}

// ===== FACTORY FUNCTIONS =====
export const createColumnSearcher = (
  columns: ColumnDefinition[],
  config?: Partial<SearchConfig>
): ColumnSearcher => {
  return new ColumnSearcher(columns, config)
}

export const useColumnSearch = (
  columns: ColumnDefinition[],
  config?: Partial<SearchConfig>
) => {
  const searcher = new ColumnSearcher(columns, config)

  return {
    search: searcher.search.bind(searcher),
    searchWithFilters: searcher.searchWithFilters.bind(searcher),
    clearCache: searcher.clearCache.bind(searcher),
    getSearchableFields: searcher.getSearchableFields.bind(searcher),
    getStats: searcher.getStats.bind(searcher),
    highlight: searcher.getHighlightHTML.bind(searcher),
    updateColumns: searcher.updateColumns.bind(searcher),
    rebuildIndex: searcher.rebuildIndex.bind(searcher)
  }
}