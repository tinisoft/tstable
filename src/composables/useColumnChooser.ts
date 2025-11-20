/**
 * @fileoverview Enhanced column chooser composable
 * @module composables/useColumnChooser
 */

import { ref, computed, watch } from 'vue'
import type { ColumnDefinition } from '../types/core/column'
import type { GridEmit } from '../types/core/events'

export function useColumnChooser<T = any>(
  columns: () => ColumnDefinition[],
  emit?: GridEmit<T>
) {
  const isVisible = ref(false)
  const columnVisibility = ref<Record<string, boolean>>({})
  const columnOrder = ref<string[]>(columns().map(c => c.field))
  const searchTerm = ref('')
  const selectedCategory = ref<string | null>(null)

  // ===== INITIALIZE VISIBILITY =====
  const initializeVisibility = () => {
    const visibility: Record<string, boolean> = {}
    columns().forEach((col) => {
      visibility[col.field] = col.visible !== false
    })
    columnVisibility.value = visibility
  }

  initializeVisibility()

  // ===== FILTERED COLUMNS =====
  const filteredColumns = computed(() => {
    let cols = columns()

    if (searchTerm.value) {
      const search = searchTerm.value.toLowerCase()
      cols = cols.filter(col =>
        col.title.toLowerCase().includes(search) ||
        col.field.toLowerCase().includes(search)
      )
    }

    if (selectedCategory.value) {
      cols = cols.filter(col => col.metadata?.category === selectedCategory.value)
    }

    return cols
  })

  // ===== CATEGORIES =====
  const categories = computed(() => {
    const cats = new Set<string>()
    columns().forEach(col => {
      if (col.metadata?.category) {
        cats.add(col.metadata.category)
      }
    })
    return Array.from(cats)
  })

  // ===== VISIBLE COLUMNS =====
  const visibleColumns = computed<ColumnDefinition[]>(() => {
    return columnOrder.value
      .map(field => columns().find(col => col.field === field)!)
      .filter(col => col && isColumnVisible(col.field))
  })

  // ===== HIDDEN COLUMNS =====
  const hiddenColumns = computed<ColumnDefinition[]>(() => {
    return columnOrder.value
      .map(field => columns().find(col => col.field === field)!)
      .filter(col => col && !isColumnVisible(col.field))
  })

  const visibleCount = computed(() => visibleColumns.value.length)
  const hiddenCount = computed(() => hiddenColumns.value.length)

  // ===== CAN HIDE =====
  const canHide = (field: string): boolean => {
    const column = columns().find(c => c.field === field)
    if (!column) return false
    if (column.locked) return false
    if (column.showInColumnChooser === false) return false
    return visibleCount.value > 1
  }

  // ===== CAN SHOW =====
  const canShow = (field: string): boolean => {
    const column = columns().find(c => c.field === field)
    return !!column && !column.locked
  }

  // ===== SHOW/HIDE MODAL =====
  function show() {
    isVisible.value = true
  }

  function hide() {
    isVisible.value = false
    searchTerm.value = ''
    selectedCategory.value = null
  }

  // ===== TOGGLE COLUMN =====
  function toggleColumn(field: string) {
    const column = columns().find(c => c.field === field)
    if (!column) return

    const isCurrentlyVisible = columnVisibility.value[field]

    if (isCurrentlyVisible && !canHide(field)) {
      console.warn('Cannot hide column - at least one column must remain visible')
      return
    }

    if (column.locked) {
      console.warn('Cannot toggle locked column')
      return
    }

    columnVisibility.value[field] = !isCurrentlyVisible
  }

  // ===== SHOW COLUMN =====
  function showColumn(field: string) {
    const column = columns().find(c => c.field === field)
    if (column && canShow(field)) {
      columnVisibility.value[field] = true
    }
  }

  // ===== HIDE COLUMN =====
  function hideColumn(field: string) {
    const column = columns().find(c => c.field === field)
    if (column && canHide(field)) {
      columnVisibility.value[field] = false
    }
  }

  // ===== REORDER COLUMNS =====
  function reorderColumns(fromIndex: number, toIndex: number) {
    const newOrder = [...columnOrder.value]
    const [moved] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, moved)
    columnOrder.value = newOrder
  }

  // ===== APPLY CHANGES ===== ✅ FIXED - Don't emit here
  function applyChanges(changes: { 
    visibility: Record<string, boolean>
    order: string[] 
  }) {
    const willBeVisible = Object.keys(changes.visibility).filter(
      field => changes.visibility[field]
    )

    if (willBeVisible.length === 0) {
      console.warn('Cannot hide all columns')
      return
    }

    // ✅ Just update the state - don't emit
    // Parent will handle emitting
    Object.keys(changes.visibility).forEach(field => {
      const column = columns().find(c => c.field === field)
      if (column && !column.locked && column.showInColumnChooser !== false) {
        columnVisibility.value[field] = changes.visibility[field]
      }
    })

    columnOrder.value = [...changes.order]
  }

  // ===== IS COLUMN VISIBLE =====
  function isColumnVisible(field: string): boolean {
    return columnVisibility.value[field] ?? true
  }

  // ===== SHOW ALL COLUMNS =====
  function showAllColumns() {
    Object.keys(columnVisibility.value).forEach(field => {
      const column = columns().find(c => c.field === field)
      if (column && !column.locked) {
        columnVisibility.value[field] = true
      }
    })
  }

  // ===== HIDE ALL COLUMNS =====
  function hideAllColumns() {
    const lockedFields = columns().filter(c => c.locked).map(c => c.field)
    let keptOne = false
    
    Object.keys(columnVisibility.value).forEach(field => {
      const column = columns().find(c => c.field === field)
      if (!column) return
      
      if (lockedFields.includes(field)) {
        columnVisibility.value[field] = true
      } else if (!keptOne) {
        columnVisibility.value[field] = true
        keptOne = true
      } else {
        columnVisibility.value[field] = false
      }
    })
  }

  // ===== RESET TO DEFAULT =====
  function resetToDefault() {
    initializeVisibility()
    columnOrder.value = columns().map(c => c.field)
  }

  // ===== SHOW ONLY =====
  function showOnly(fields: string[]) {
    Object.keys(columnVisibility.value).forEach(field => {
      const column = columns().find(c => c.field === field)
      if (column && !column.locked) {
        columnVisibility.value[field] = fields.includes(field)
      }
    })
  }

  // ===== GET VISIBLE FIELDS =====
  function getVisibleFields(): string[] {
    return Object.keys(columnVisibility.value).filter(
      f => columnVisibility.value[f]
    )
  }

  // ===== GET HIDDEN FIELDS =====
  function getHiddenFields(): string[] {
    return Object.keys(columnVisibility.value).filter(
      f => !columnVisibility.value[f]
    )
  }

  // ===== WATCH COLUMNS CHANGES =====
  watch(columns, () => {
    const currentFields = columns().map(c => c.field)
    const newFields = currentFields.filter(f => !columnOrder.value.includes(f))
    
    if (newFields.length > 0) {
      columnOrder.value = [...columnOrder.value, ...newFields]
    }
    
    columnOrder.value = columnOrder.value.filter(f => currentFields.includes(f))
    initializeVisibility()
  })

  return {
    // State
    isVisible,
    columnVisibility,
    columnOrder,
    searchTerm,
    selectedCategory,
    
    // Computed
    visibleColumns,
    hiddenColumns,
    filteredColumns,
    categories,
    visibleCount,
    hiddenCount,
    
    // Methods
    show,
    hide,
    toggleColumn,
    showColumn,
    hideColumn,
    reorderColumns,
    applyChanges,
    isColumnVisible,
    showAllColumns,
    hideAllColumns,
    resetToDefault,
    showOnly,
    getVisibleFields,
    getHiddenFields,
    canHide,
    canShow
  }
}