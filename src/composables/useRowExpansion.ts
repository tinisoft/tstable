/**
 * @fileoverview Row expansion composable (for master-detail)
 * @module composables/useRowExpansion
 */

import { ref, computed } from 'vue'
import type { GridEmit, RowKey } from '../types'

export interface RowExpansionConfig {
  /** Allow multiple rows to be expanded simultaneously */
  allowMultiple?: boolean
  
  /** Expand row when clicking anywhere on the row */
  expandOnRowClick?: boolean
  
  /** Auto-collapse other rows when expanding a new one */
  autoCollapse?: boolean
  
  /** Default expanded state for all rows */
  defaultExpanded?: boolean
}

export interface RowExpansionState {
  /** Set of expanded row keys */
  expandedRows: Set<any>
  
  /** Count of expanded rows */
  expandedCount: number
  
  /** Has any expanded rows */
  hasExpandedRows: boolean
}

export function useRowExpansion(
  keyField: string = 'id',
  config: RowExpansionConfig = {},
  emit?: GridEmit
) {
  const expandedRows = ref<Set<any>>(new Set())
  
  const expandedCount = computed(() => expandedRows.value.size)
  const hasExpandedRows = computed(() => expandedRows.value.size > 0)
  
  const defaultConfig: Required<RowExpansionConfig> = {
    allowMultiple: true,
    expandOnRowClick: false,
    autoCollapse: false,
    defaultExpanded: false
  }
  
  const expansionConfig = computed(() => ({ ...defaultConfig, ...config }))
  
  // ===== IS EXPANDED =====
  const isExpanded = (row: any): boolean => {
    if (!row) return false
    const key = row[keyField]
    return expandedRows.value.has(key)
  }
  
  // ===== IS EXPANDED BY KEY =====
  const isExpandedByKey = (key: any): boolean => {
    return expandedRows.value.has(key)
  }
  
  // ===== TOGGLE EXPANSION =====
  const toggleExpansion = (row: any, rowIndex: number = 0) => {
    const key = row[keyField]
    
    if (expandedRows.value.has(key)) {
      collapse(row, rowIndex)
    } else {
      expand(row, rowIndex)
    }
  }
  
  // ===== EXPAND =====
  const expand = (row: any, rowIndex: number = 0) => {
    const key = row[keyField]
    
    // Already expanded
    if (expandedRows.value.has(key)) return
    
    // If auto-collapse or not allowing multiple, collapse all others
    if (expansionConfig.value.autoCollapse || !expansionConfig.value.allowMultiple) {
      collapseAll()
    }
    
    expandedRows.value.add(key)
    
    // Force reactivity
    expandedRows.value = new Set(expandedRows.value)
    
    // Emit row-click event (fixed: event is undefined, not null)
    emit?.('row-click', { 
      row, 
      rowKey: key as RowKey,
      rowIndex,
      cancel: false,
      event: undefined // Changed from null to undefined
    })
    
    // Emit state-changed event (fixed: kebab-case)
    emit?.('state-changed', { 
      state: { 
        expandedRows: Array.from(expandedRows.value) 
      } 
    })
  }
  
  // ===== COLLAPSE =====
  const collapse = (row: any, rowIndex: number = 0) => {
    const key = row[keyField]
    
    // Not expanded
    if (!expandedRows.value.has(key)) return
    
    expandedRows.value.delete(key)
    
    // Force reactivity
    expandedRows.value = new Set(expandedRows.value)
    
    // Emit row-click event (fixed: event is undefined, not null)
    emit?.('row-click', { 
      row, 
      rowKey: key as RowKey,
      rowIndex,
      cancel: false,
      event: undefined // Changed from null to undefined
    })
    
    // Emit state-changed event (fixed: kebab-case)
    emit?.('state-changed', { 
      state: { 
        expandedRows: Array.from(expandedRows.value) 
      } 
    })
  }
  
  // ===== EXPAND ALL =====
  const expandAll = (rows: any[]) => {
    if (!expansionConfig.value.allowMultiple) {
      console.warn('expandAll requires allowMultiple: true')
      return
    }
    
    rows.forEach(row => {
      const key = row[keyField]
      expandedRows.value.add(key)
    })
    
    // Force reactivity
    expandedRows.value = new Set(expandedRows.value)
    
    // Emit state-changed event (fixed: kebab-case)
    emit?.('state-changed', { 
      state: { 
        expandedRows: Array.from(expandedRows.value) 
      } 
    })
  }
  
  // ===== COLLAPSE ALL =====
  const collapseAll = () => {
    if (expandedRows.value.size === 0) return
    
    expandedRows.value.clear()
    
    // Force reactivity
    expandedRows.value = new Set(expandedRows.value)
    
    // Emit state-changed event (fixed: kebab-case)
    emit?.('state-changed', { 
      state: { 
        expandedRows: [] 
      } 
    })
  }
  
  // ===== SET EXPANDED ROWS =====
  const setExpandedRows = (keys: any[]) => {
    expandedRows.value = new Set(keys)
    
    // Emit state-changed event (fixed: kebab-case)
    emit?.('state-changed', { 
      state: { 
        expandedRows: keys 
      } 
    })
  }
  
  // ===== GET EXPANDED ROWS =====
  const getExpandedRows = (): any[] => {
    return Array.from(expandedRows.value)
  }
  
  // ===== EXPAND BY KEY =====
  const expandByKey = (key: any) => {
    if (!expandedRows.value.has(key)) {
      if (expansionConfig.value.autoCollapse || !expansionConfig.value.allowMultiple) {
        collapseAll()
      }
      
      expandedRows.value.add(key)
      expandedRows.value = new Set(expandedRows.value)
      
      emit?.('state-changed', { 
        state: { 
          expandedRows: Array.from(expandedRows.value) 
        } 
      })
    }
  }
  
  // ===== COLLAPSE BY KEY =====
  const collapseByKey = (key: any) => {
    if (expandedRows.value.has(key)) {
      expandedRows.value.delete(key)
      expandedRows.value = new Set(expandedRows.value)
      
      emit?.('state-changed', { 
        state: { 
          expandedRows: Array.from(expandedRows.value) 
        } 
      })
    }
  }
  
  // ===== TOGGLE BY KEY =====
  const toggleByKey = (key: any) => {
    if (expandedRows.value.has(key)) {
      collapseByKey(key)
    } else {
      expandByKey(key)
    }
  }
  
  // ===== GET EXPANSION STATE =====
  const getExpansionState = (): RowExpansionState => {
    return {
      expandedRows: expandedRows.value,
      expandedCount: expandedCount.value,
      hasExpandedRows: hasExpandedRows.value
    }
  }
  
  // ===== RESTORE EXPANSION STATE =====
  const restoreExpansionState = (state: RowExpansionState) => {
    expandedRows.value = new Set(state.expandedRows)
  }
  
  // ===== RESET =====
  const reset = () => {
    expandedRows.value.clear()
    expandedRows.value = new Set()
  }
  
  return {
    // State
    expandedRows,
    expandedCount,
    hasExpandedRows,
    config: expansionConfig,
    
    // Methods
    isExpanded,
    isExpandedByKey,
    toggleExpansion,
    expand,
    collapse,
    expandAll,
    collapseAll,
    setExpandedRows,
    getExpandedRows,
    expandByKey,
    collapseByKey,
    toggleByKey,
    getExpansionState,
    restoreExpansionState,
    reset
  }
}