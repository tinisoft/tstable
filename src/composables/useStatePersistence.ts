/**
 * @fileoverview Enhanced state persistence composable
 * @module composables/useStatePersistence
 */

import { watch, onMounted, onBeforeUnmount } from 'vue'
import { GridState, SelectionState, SelectionModeType } from '../types'
import type { GridEmit } from '../types'
import { debounce } from '../utils/performance'

export interface PersistenceOptions {
  debounceTime?: number
  storage?: 'local' | 'session'
  version?: string
  compress?: boolean
  includeData?: boolean
}

export function useStatePersistence<T = any>(
  stateKey: string,
  getState: () => GridState<T>,
  setState?: (state: Partial<GridState<T>>) => void,
  emit?: GridEmit<T>,
  options: PersistenceOptions = {}
) {
  const storageKey = `tsdatagrid-state-${stateKey}`
  const versionKey = `${storageKey}-version`
  
  const defaultOptions: Required<PersistenceOptions> = {
    debounceTime: 500,
    storage: 'local',
    version: '1.0',
    compress: false,
    includeData: false
  }
  
  const opts = { ...defaultOptions, ...options }
  
  const storage = opts.storage === 'local' ? localStorage : sessionStorage

  // ===== SAVE STATE =====
  const saveState = () => {
    try {
      const currentState = getState()
      
      // Create serializable state
      const stateToSave = {
        columns: currentState.columns.map(c => ({
          field: c.field,
          width: c.width,
          visible: c.visible,
          locked: c.locked
        })),
        filters: currentState.filters,
        sorting: currentState.sorting,
        grouping: currentState.grouping,
        pagination: {
          page: currentState.pagination.page,
          pageSize: currentState.pagination.pageSize
        },
        // ✅ FIX: Access selectedKeys from SelectionState
        selection: {
          selectedKeys: Array.from(currentState.selection.selectedKeys),
          mode: currentState.selection.mode
        },
        columnOrder: currentState.columnOrder,
        columnVisibility: currentState.columnVisibility,
        columnWidths: currentState.columnWidths,
        expandedGroups: Array.from(currentState.expandedGroups),
        scrollPosition: currentState.scrollPosition,
        // ✅ FIX: Access search.term instead of searchTerm
        searchTerm: currentState.search?.term || '',
        timestamp: new Date().toISOString(),
        version: opts.version
      }
      
      // Optionally include data
      if (opts.includeData) {
        (stateToSave as any).data = currentState.data
      }
      
      let serialized = JSON.stringify(stateToSave)
      
      // Optional compression (simple)
      if (opts.compress) {
        serialized = compressState(serialized)
      }
      
      storage.setItem(storageKey, serialized)
      storage.setItem(versionKey, opts.version)
      
      emit?.('state-saved', { state: stateToSave })
      
      console.log('✅ Grid state saved:', stateKey)
    } catch (error) {
      console.error('Failed to save grid state:', error)
      // ✅ FIX: Use kebab-case event name
      emit?.('data-error', { error: { code: 'SAVE_ERROR', message: 'Failed to save state' } })
    }
  }

  // ===== LOAD STATE =====
  const loadState = (): Partial<GridState<T>> | null => {
    try {
      let saved = storage.getItem(storageKey)
      if (!saved) return null
      
      const savedVersion = storage.getItem(versionKey)
      
      // Check version compatibility
      if (savedVersion && savedVersion !== opts.version) {
        console.warn(`State version mismatch: ${savedVersion} vs ${opts.version}`)
        // Optionally migrate or clear old state
        // clearState()
        // return null
      }
      
      // Decompress if needed
      if (opts.compress) {
        saved = decompressState(saved)
      }
      
      const parsed = JSON.parse(saved)
      
      // ✅ FIX: Reconstruct proper SelectionState
      const selectionState: SelectionState = {
        selectedKeys: new Set(parsed.selection?.selectedKeys || []),
        selectedIndices: new Set(),
        selectedRows: [],
        mode: parsed.selection?.mode || 'multiple'
      }
      
      // Reconstruct state
      const loadedState: Partial<GridState<T>> = {
        filters: parsed.filters || [],
        sorting: parsed.sorting || [],
        grouping: parsed.grouping || [],
        pagination: parsed.pagination || {},
        // ✅ FIX: Use proper SelectionState object
        selection: selectionState,
        columnOrder: parsed.columnOrder || [],
        columnVisibility: parsed.columnVisibility || {},
        columnWidths: parsed.columnWidths || {},
        expandedGroups: new Set(parsed.expandedGroups || []),
        scrollPosition: parsed.scrollPosition || { x: 0, y: 0 },
        // ✅ FIX: Reconstruct search state if needed
        search: parsed.searchTerm ? {
          term: parsed.searchTerm,
          results: [],
          totalMatches: 0,
          isSearching: false,
          highlightedRows: new Set()
        } : undefined,
        loading: false,
        error: undefined
      }
      
      // Apply state if setState is provided
      if (setState) {
        setState(loadedState)
      }
      
      emit?.('state-loaded', { state: loadedState })
      emit?.('state-changed', { state: loadedState })
      
      console.log('✅ Grid state loaded:', stateKey)
      
      return loadedState
    } catch (error) {
      console.error('Failed to load grid state:', error)
      emit?.('data-error', { error: { code: 'LOAD_ERROR', message: 'Failed to load state' } })
      return null
    }
  }

  // ===== CLEAR STATE =====
  const clearState = () => {
    try {
      storage.removeItem(storageKey)
      storage.removeItem(versionKey)
      emit?.('state-changed', { state: {} })
      console.log('✅ Grid state cleared:', stateKey)
    } catch (error) {
      console.error('Failed to clear grid state:', error)
    }
  }

  // ===== AUTO SAVE =====
  const debouncedSave = debounce(saveState, opts.debounceTime)

  const enableAutoSave = () => {
    // Watch state changes and auto-save
    const unwatch = watch(
      getState,
      () => {
        debouncedSave()
      },
      { deep: true }
    )
    
    return unwatch
  }

  // ===== EXPORT STATE =====
  const exportState = (): string => {
    const state = getState()
    
    // Convert Sets and Maps to arrays for JSON serialization
    const exportableState = {
      ...state,
      selection: {
        selectedKeys: Array.from(state.selection.selectedKeys),
        mode: state.selection.mode
      },
      expandedGroups: Array.from(state.expandedGroups),
      search: state.search ? {
        ...state.search,
        highlightedRows: Array.from(state.search.highlightedRows)
      } : undefined
    }
    
    return JSON.stringify(exportableState, null, 2)
  }

  // ===== IMPORT STATE =====
  const importState = (stateJson: string): boolean => {
    try {
      const parsed = JSON.parse(stateJson)
      
      // Reconstruct non-serializable types
      if (parsed.selection) {
        parsed.selection = {
          selectedKeys: new Set(parsed.selection.selectedKeys || []),
          selectedIndices: new Set(),
          selectedRows: [],
          mode: parsed.selection.mode || 'multiple'
        } as SelectionState
      }
      
      if (parsed.expandedGroups) {
        parsed.expandedGroups = new Set(parsed.expandedGroups)
      }
      
      if (parsed.search?.highlightedRows) {
        parsed.search.highlightedRows = new Set(parsed.search.highlightedRows)
      }
      
      if (setState) {
        setState(parsed)
      }
      
      // Also save to storage
      saveState()
      
      return true
    } catch (error) {
      console.error('Failed to import state:', error)
      return false
    }
  }

  // ===== RESET TO DEFAULT =====
  const resetToDefault = () => {
    clearState()
    
    if (setState) {
      const defaultSelection: SelectionState = {
        selectedKeys: new Set(),
        selectedIndices: new Set(),
        selectedRows: [],
        mode: SelectionModeType.Multiple
      }
      
      setState({
        filters: [],
        sorting: [],
        grouping: [],
        selection: defaultSelection,
        columnOrder: [],
        columnVisibility: {},
        expandedGroups: new Set(),
        search: undefined
      })
    }
  }

  // ===== GET STATE SIZE =====
  const getStateSize = (): number => {
    const saved = storage.getItem(storageKey)
    return saved ? new Blob([saved]).size : 0
  }

  // ===== COMPRESSION HELPERS =====
  const compressState = (data: string): string => {
    // Simple compression: remove whitespace
    return data.replace(/\s+/g, '')
  }

  const decompressState = (data: string): string => {
    // For simple compression, no decompression needed
    return data
  }

  // ===== LIFECYCLE =====
  let unwatchAutoSave: (() => void) | null = null

  onMounted(() => {
    // Auto-load on mount
    loadState()
    
    // Enable auto-save
    unwatchAutoSave = enableAutoSave()
  })

  onBeforeUnmount(() => {
    // Save before unmount
    saveState()
    
    // Cleanup
    if (unwatchAutoSave) {
      unwatchAutoSave()
    }
  })

  return {
    // Methods
    saveState,
    loadState,
    clearState,
    exportState,
    importState,
    resetToDefault,
    getStateSize,
    
    // Configuration
    options: opts
  }
}