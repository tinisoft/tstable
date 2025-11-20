/**
 * @fileoverview Enhanced selection composable
 * @module composables/useSelection
 */
import { ref, computed, watch, onMounted } from 'vue'
import { 
  SelectionMode, 
  SelectionState, 
  SelectionEvent,
  SelectionModeType,
  SelectionPersistence
} from '../types'
import type { GridEmit } from '../types'

export function useSelection<T>(
  mode: SelectionMode = { mode: SelectionModeType.Multiple, checkboxes: true },
  keyField: string = 'id',
  emit?: GridEmit<T>
) {
  const selectedKeys = ref<Set<any>>(new Set())
  const lastSelectedIndex = ref<number>(-1)

  const selectedCount = computed(() => selectedKeys.value.size)
  const hasSelection = computed(() => selectedKeys.value.size > 0)

  const selectionState = computed<SelectionState>(() => ({
    selectedKeys: selectedKeys.value,
    selectedIndices: new Set(),
    selectedRows: [],
    mode: mode.mode
  }))

  // ===== IS SELECTED =====
  const isSelected = (item: T): boolean => {
    const key = (item as any)[keyField]
    return selectedKeys.value.has(key)
  }

  // ===== TOGGLE SELECTION =====
  const toggleSelection = (item: T, index?: number, shiftKey: boolean = false) => {
    const key = (item as any)[keyField]
    if (key === undefined) {
      console.warn(`Row missing keyField: ${keyField}`, item)
      return
    }

    if (mode.mode === SelectionModeType.None) {
      console.warn('Selection mode is "none", cannot select')
      return
    }

    const wasSelected = selectedKeys.value.has(key)
    const addedKeys: any[] = []
    const removedKeys: any[] = []

    if (mode.mode === SelectionModeType.Single) {
      // Single selection: clear all and select this one
      const previousKeys = Array.from(selectedKeys.value)
      selectedKeys.value.clear()
      
      if (!wasSelected) {
        selectedKeys.value.add(key)
        addedKeys.push(key)
      }
      
      removedKeys.push(...previousKeys)
    } else {
      // Multiple selection
      if (wasSelected) {
        selectedKeys.value.delete(key)
        removedKeys.push(key)
      } else {
        selectedKeys.value.add(key)
        addedKeys.push(key)
      }
    }

    if (index !== undefined) {
      lastSelectedIndex.value = index
    }

    emitSelectionChanged(addedKeys, removedKeys)
  }

  // ===== SELECT RANGE =====
  const selectRange = (startIndex: number, endIndex: number, items: T[]) => {
    if (mode.mode !== SelectionModeType.Multiple) return

    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    const addedKeys: any[] = []

    for (let i = start; i <= end && i < items.length; i++) {
      const key = (items[i] as any)[keyField]
      if (key !== undefined && !selectedKeys.value.has(key)) {
        selectedKeys.value.add(key)
        addedKeys.push(key)
      }
    }

    emitSelectionChanged(addedKeys, [])
  }

  // ===== SELECT ALL =====
  const selectAll = (items: T[], allData: boolean = false) => {
    if (mode.mode !== SelectionModeType.Multiple) {
      console.warn('selectAll only works in multiple selection mode')
      return
    }

    const targetItems = allData ? (items as any).dataSource?.data || items : items
    const addedKeys: any[] = []

    targetItems.forEach((item: any) => {
      const key = item[keyField]
      if (key !== undefined && !selectedKeys.value.has(key)) {
        selectedKeys.value.add(key)
        addedKeys.push(key)
      }
    })

    emitSelectionChanged(addedKeys, [])
  }

  // ===== DESELECT ALL =====
  const deselectAll = () => {
    const removedKeys = Array.from(selectedKeys.value)
    selectedKeys.value.clear()
    lastSelectedIndex.value = -1

    emitSelectionChanged([], removedKeys)
  }

  // ===== SELECT =====
  const select = (item: T) => {
    const key = (item as any)[keyField]
    if (key === undefined) return

    if (!selectedKeys.value.has(key)) {
      if (mode.mode === SelectionModeType.Single) {
        const previousKeys = Array.from(selectedKeys.value)
        selectedKeys.value.clear()
        selectedKeys.value.add(key)
        emitSelectionChanged([key], previousKeys)
      } else {
        selectedKeys.value.add(key)
        emitSelectionChanged([key], [])
      }
    }
  }

  // ===== DESELECT =====
  const deselect = (item: T) => {
    const key = (item as any)[keyField]
    if (key === undefined) return

    if (selectedKeys.value.has(key)) {
      selectedKeys.value.delete(key)
      emitSelectionChanged([], [key])
    }
  }

  // ===== SELECT BY KEY =====
  const selectByKey = (key: any) => {
    if (!selectedKeys.value.has(key)) {
      if (mode.mode === SelectionModeType.Single) {
        const previousKeys = Array.from(selectedKeys.value)
        selectedKeys.value.clear()
        selectedKeys.value.add(key)
        emitSelectionChanged([key], previousKeys)
      } else {
        selectedKeys.value.add(key)
        emitSelectionChanged([key], [])
      }
    }
  }

  // ===== DESELECT BY KEY =====
  const deselectByKey = (key: any) => {
    if (selectedKeys.value.has(key)) {
      selectedKeys.value.delete(key)
      emitSelectionChanged([], [key])
    }
  }

  // ===== SELECT BY KEYS =====
  const selectByKeys = (keys: any[]) => {
    const addedKeys: any[] = []

    if (mode.mode === SelectionModeType.Single && keys.length > 0) {
      const previousKeys = Array.from(selectedKeys.value)
      selectedKeys.value.clear()
      selectedKeys.value.add(keys[0])
      emitSelectionChanged([keys[0]], previousKeys)
      return
    }

    keys.forEach(key => {
      if (!selectedKeys.value.has(key)) {
        selectedKeys.value.add(key)
        addedKeys.push(key)
      }
    })

    if (addedKeys.length > 0) {
      emitSelectionChanged(addedKeys, [])
    }
  }

  // ===== DESELECT BY KEYS =====
  const deselectByKeys = (keys: any[]) => {
    const removedKeys: any[] = []

    keys.forEach(key => {
      if (selectedKeys.value.has(key)) {
        selectedKeys.value.delete(key)
        removedKeys.push(key)
      }
    })

    if (removedKeys.length > 0) {
      emitSelectionChanged([], removedKeys)
    }
  }

  // ===== IS ALL SELECTED =====
  const isAllSelected = (items: T[]): boolean => {
    if (items.length === 0) return false
    return items.every(item => selectedKeys.value.has((item as any)[keyField]))
  }

  // ===== IS SOME SELECTED =====
  const isSomeSelected = (items: T[]): boolean => {
    return items.some(item => selectedKeys.value.has((item as any)[keyField])) && !isAllSelected(items)
  }

  // ===== TOGGLE SELECT ALL =====
  const toggleSelectAll = (items: T[]) => {
    if (isAllSelected(items)) {
      // Deselect all from current page/items
      const keysToRemove = items.map(item => (item as any)[keyField])
      deselectByKeys(keysToRemove)
    } else {
      selectAll(items)
    }
  }

  // ===== GET SELECTED ITEMS =====
  const getSelectedItems = (allItems: T[]): T[] => {
    return allItems.filter(item => selectedKeys.value.has((item as any)[keyField]))
  }

  // ===== GET SELECTED KEYS =====
  const getSelectedKeys = (): any[] => {
    return Array.from(selectedKeys.value)
  }

  // ===== SET SELECTED KEYS =====
  const setSelectedKeys = (keys: any[]) => {
    const previousKeys = Array.from(selectedKeys.value)
    selectedKeys.value = new Set(keys)

    const addedKeys = keys.filter(k => !previousKeys.includes(k))
    const removedKeys = previousKeys.filter(k => !keys.includes(k))

    emitSelectionChanged(addedKeys, removedKeys)
  }

  // ===== CLEAR SELECTION =====
  const clearSelection = () => {
    deselectAll()
  }

  // ===== INVERT SELECTION =====
  const invertSelection = (allItems: T[]) => {
    if (mode.mode !== SelectionModeType.Multiple) return

    const allKeys = allItems.map(item => (item as any)[keyField])
    const newSelection = new Set(allKeys.filter(key => !selectedKeys.value.has(key)))

    const addedKeys = Array.from(newSelection).filter(k => !selectedKeys.value.has(k))
    const removedKeys = Array.from(selectedKeys.value).filter(k => !newSelection.has(k))

    selectedKeys.value = newSelection

    emitSelectionChanged(addedKeys, removedKeys)
  }

  // ===== SELECT FILTERED =====
  const selectFiltered = (filteredItems: T[]) => {
    if (mode.mode !== SelectionModeType.Multiple) return

    const addedKeys: any[] = []
    filteredItems.forEach(item => {
      const key = (item as any)[keyField]
      if (key !== undefined && !selectedKeys.value.has(key)) {
        selectedKeys.value.add(key)
        addedKeys.push(key)
      }
    })

    emitSelectionChanged(addedKeys, [])
  }

  // ===== EMIT SELECTION CHANGED =====
  const emitSelectionChanged = (addedKeys: any[], removedKeys: any[]) => {
    const event: SelectionEvent<T> = {
      selectedKeys: Array.from(selectedKeys.value),
      selectedRows: [], // Will be populated by the grid component
      addedKeys,
      removedKeys,
      mode: mode.mode === SelectionModeType.Single ? 'single' : 'multiple',
      cancel: false
    }

    emit?.('selection-changed', event)
    emit?.('state-changed', { state: { selection: selectedKeys.value } })
  }

  // ===== PERSISTENCE =====
  const saveSelectionToStorage = () => {
    if (mode.persistence === SelectionPersistence.Session) {
      sessionStorage.setItem(`grid-selection-${keyField}`, JSON.stringify(Array.from(selectedKeys.value)))
    } else if (mode.persistence === SelectionPersistence.Local) {
      localStorage.setItem(`grid-selection-${keyField}`, JSON.stringify(Array.from(selectedKeys.value)))
    }
  }

  const loadSelectionFromStorage = () => {
    let saved: string | null = null

    if (mode.persistence === SelectionPersistence.Session) {
      saved = sessionStorage.getItem(`grid-selection-${keyField}`)
    } else if (mode.persistence === SelectionPersistence.Local) {
      saved = localStorage.getItem(`grid-selection-${keyField}`)
    }

    if (saved) {
      try {
        const keys = JSON.parse(saved)
        selectedKeys.value = new Set(keys)
      } catch (error) {
        console.error('Failed to load selection from storage:', error)
      }
    }
  }

  const clearSelectionFromStorage = () => {
    if (mode.persistence === SelectionPersistence.Session) {
      sessionStorage.removeItem(`grid-selection-${keyField}`)
    } else if (mode.persistence === SelectionPersistence.Local) {
      localStorage.removeItem(`grid-selection-${keyField}`)
    }
  }

  // Watch for selection changes to persist
  if (mode.persistence) {
    watch(selectedKeys, () => {
      saveSelectionToStorage()
    }, { deep: true })

    onMounted(() => {
      loadSelectionFromStorage()
    })
  }

  return {
    // State
    selectedKeys,
    selectedCount,
    hasSelection,
    selectionState,

    // Methods
    isSelected,
    toggleSelection,
    selectRange,
    selectAll,
    deselectAll,
    select,
    deselect,
    selectByKey,
    deselectByKey,
    selectByKeys,
    deselectByKeys,
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    getSelectedItems,
    getSelectedKeys,
    setSelectedKeys,
    clearSelection,
    invertSelection,
    selectFiltered,

    // Persistence
    saveSelectionToStorage,
    loadSelectionFromStorage,
    clearSelectionFromStorage
  }
}