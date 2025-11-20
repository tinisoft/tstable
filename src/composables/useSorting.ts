/**
 * @fileoverview Enhanced sorting composable
 * @module composables/useSorting
 */

import { ref, computed } from 'vue'
import { SortDescriptor, SortDirection, SortState, ColumnType } from '../types'
import type { ColumnDefinition } from '../types'
import type { GridEmit } from '../types'

export function useSorting<T = any>(
  columns: () => ColumnDefinition[],
  multiSort: boolean = false,
  emit?: GridEmit<T>
) {
// Initialize with default sort if any
  const getDefaultSorts = (): SortDescriptor[] => {
    const defaults = columns()
      .filter(c => c.defaultSortOrder)
      .map((c, index) => ({ 
        field: c.field, 
        direction: c.defaultSortOrder!,
        index: c.defaultSortIndex ?? index
      }))
    
    const sorted = [...defaults].sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    return sorted
  }

  const sortDescriptors = ref<SortDescriptor[]>(getDefaultSorts())

  const sortState = computed<SortState>(() => ({
    descriptors: sortDescriptors.value,
    multiSort
  }))

  const hasSorting = computed(() => sortDescriptors.value.length > 0)
  const sortCount = computed(() => sortDescriptors.value.length)

  // ===== TOGGLE SORT =====
  const toggleSort = (field: string, allowUnsort: boolean = true) => {
    const column = columns().find(c => c.field === field)
    if (!column || column.sortable === false) return
    
    const existingIndex = sortDescriptors.value.findIndex(s => s.field === field)
    const existing = existingIndex >= 0 ? sortDescriptors.value[existingIndex] : null
    
    if (!multiSort) {
      // ✅ SINGLE SORT MODE
      if (existing) {
        const nextDir = getNextDirection(existing.direction, allowUnsort)
        sortDescriptors.value = nextDir === null 
          ? [] 
          : [{ field, direction: nextDir, column }]
      } else {
        sortDescriptors.value = [{ field, direction: SortDirection.Ascending, column }]
      }
    } else {
      // ✅ MULTI SORT MODE
      let newDescriptors: SortDescriptor[] = []
      
      if (existing) {
        const nextDir = getNextDirection(existing.direction, allowUnsort)
        if (nextDir === null) {
          // Remove this sort
          newDescriptors = sortDescriptors.value.filter(s => s.field !== field)
        } else {
          // Update direction
          newDescriptors = sortDescriptors.value.map((s, idx) => 
            idx === existingIndex 
              ? { field, direction: nextDir, index: idx, column }
              : { ...s, index: idx < existingIndex ? idx : idx - 1 }
          )
        }
      } else {
        // Add new sort
        newDescriptors = [
          ...sortDescriptors.value.map((s, idx) => ({ ...s, index: idx })),
          { field, direction: SortDirection.Ascending, index: sortDescriptors.value.length, column }
        ]
      }
      
      sortDescriptors.value = newDescriptors
    }
    
    emitSortChanged()
  }

  // ===== GET NEXT DIRECTION =====
  const getNextDirection = (current: SortDirection | null, allowUnsort: boolean = true): SortDirection | null => {
    if (!current || current === null) return SortDirection.Ascending
    if (current === SortDirection.Ascending) return SortDirection.Descending
    if (current === SortDirection.Descending) return allowUnsort ? null : SortDirection.Ascending
    return SortDirection.Ascending
  }

  // ===== GET SORT DIRECTION =====
  const getSortDirection = (field: string): SortDirection | null => {
    return sortDescriptors.value.find(s => s.field === field)?.direction || null
  }

  // ===== GET SORT INDEX =====
  const getSortIndex = (field: string): number => {
    const index = sortDescriptors.value.findIndex(s => s.field === field)
    return index >= 0 ? index + 1 : 0
  }

  // ===== IS SORTED =====
  const isSorted = (field: string): boolean => {
    return sortDescriptors.value.some(s => s.field === field)
  }

  // ===== CLEAR SORT =====
  const clearSort = () => {
    sortDescriptors.value = []
    emitSortChanged()
  }

  // ===== SET SORT =====
  const setSort = (field: string, direction: SortDirection | null) => {
    const column = columns().find(c => c.field === field)
    
    if (!multiSort) {
      // Single sort mode
      if (direction === null) {
        sortDescriptors.value = []
      } else {
        sortDescriptors.value = [{ field, direction, column }]
      }
    } else {
      // Multi sort mode
      const existingIndex = sortDescriptors.value.findIndex(s => s.field === field)
      
      if (existingIndex >= 0) {
        if (direction === null) {
          sortDescriptors.value = sortDescriptors.value.filter(s => s.field !== field)
        } else {
          sortDescriptors.value[existingIndex].direction = direction
        }
      } else if (direction !== null) {
        sortDescriptors.value.push({ 
          field, 
          direction, 
          index: sortDescriptors.value.length,
          column 
        })
      }
    }
    
    emitSortChanged()
  }

  // ===== SET SORTS =====
  const setSorts = (sorts: SortDescriptor[]) => {
    sortDescriptors.value = sorts.map((s, index) => ({
      ...s,
      index,
      column: columns().find(c => c.field === s.field)
    }))
    emitSortChanged()
  }

  // ===== ADD SORT =====
  const addSort = (field: string, direction: SortDirection) => {
    const column = columns().find(c => c.field === field)
    
    if (!multiSort) {
      sortDescriptors.value = [{ field, direction, column }]
    } else {
      const existing = sortDescriptors.value.find(s => s.field === field)
      if (existing) {
        existing.direction = direction
      } else {
        sortDescriptors.value.push({ 
          field, 
          direction, 
          index: sortDescriptors.value.length,
          column 
        })
      }
    }
    
    emitSortChanged()
  }

  // ===== REMOVE SORT =====
  const removeSort = (field: string) => {
    sortDescriptors.value = sortDescriptors.value.filter(s => s.field !== field)
    emitSortChanged()
  }

  // ===== REORDER SORT =====
  const reorderSort = (field: string, newIndex: number) => {
    const currentIndex = sortDescriptors.value.findIndex(s => s.field === field)
    if (currentIndex === -1) return
    
    const [descriptor] = sortDescriptors.value.splice(currentIndex, 1)
    sortDescriptors.value.splice(newIndex, 0, descriptor)
    
    // Update indices
    sortDescriptors.value.forEach((s, idx) => {
      s.index = idx
    })
    
    emitSortChanged()
  }

  // ===== SORT DATA =====
  const sortData = <TData = T>(data: TData[]): TData[] => {
    if (sortDescriptors.value.length === 0) return data
    
    return [...data].sort((a, b) => {
      for (const sort of sortDescriptors.value) {
        const column = columns().find(c => c.field === sort.field)
        
        // Get values
        let aVal = (a as any)[sort.field]
        let bVal = (b as any)[sort.field]
        
        // Use custom comparator if provided
        if (sort.comparator) {
          const result = sort.comparator(aVal, bVal)
          if (result !== 0) {
            return sort.direction === SortDirection.Ascending ? result : -result
          }
          continue
        }
        
        // Type conversion
        if (column) {
          if (column.type === ColumnType.Number || column.type === ColumnType.Currency || column.type === ColumnType.Percent) {
            aVal = aVal != null ? Number(aVal) : null
            bVal = bVal != null ? Number(bVal) : null
          } else if (column.type === ColumnType.Date || column.type === ColumnType.DateTime) {
            aVal = aVal ? new Date(aVal) : null
            bVal = bVal ? new Date(bVal) : null
          }
        }
        
        // Null handling
        if (aVal == null && bVal == null) continue
        if (aVal == null) return sort.direction === SortDirection.Ascending ? 1 : -1
        if (bVal == null) return sort.direction === SortDirection.Ascending ? -1 : 1
        
        if (aVal === bVal) continue
        
        const modifier = sort.direction === SortDirection.Ascending ? 1 : -1
        
        // Type-specific comparison
        if (aVal instanceof Date && bVal instanceof Date) {
          return (aVal.getTime() - bVal.getTime()) * modifier
        } else if (typeof aVal === 'string' && typeof bVal === 'string') {
          return aVal.localeCompare(bVal) * modifier
        } else {
          return (aVal > bVal ? 1 : -1) * modifier
        }
      }
      return 0
    })
  }

  // ===== EMIT SORT CHANGED =====
  const emitSortChanged = () => {
    if (emit) {
      emit('sort-changed', sortDescriptors.value)
    }
    
    emit?.('state-changed', { state: { sorting: sortDescriptors.value } })
  }

  // ===== IS MULTI SORT =====
  const isMultiSort = computed(() => multiSort)

  return {
    // State
    sortDescriptors,
    sortState,
    hasSorting,
    sortCount,
    isMultiSort,
    
    // Methods
    toggleSort,
    getSortDirection,
    getSortIndex,
    isSorted,
    clearSort,
    setSort,
    setSorts,
    addSort,
    removeSort,
    reorderSort,
    sortData
  }
}