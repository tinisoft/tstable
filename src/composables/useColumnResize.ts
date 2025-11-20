/**
 * @fileoverview Column resizing composable
 * @module composables/useColumnResize
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { ColumnDefinition } from '../types/core/column'
import type { GridEmit } from '../types/core/events'

export interface ResizeState {
  isResizing: boolean
  resizingColumn: string | null
  startX: number
  startWidth: number
  currentWidth: number
}

export function useColumnResize<T = any>(
  columns: () => ColumnDefinition[],
  minWidth: number = 50,
  maxWidth: number = 1000,
  emit?: GridEmit<T>
) {
  const resizeState = ref<ResizeState>({
    isResizing: false,
    resizingColumn: null,
    startX: 0,
    startWidth: 0,
    currentWidth: 0
  })
  
  const columnWidths = ref<Record<string, number>>({})
  
  const isResizing = computed(() => resizeState.value.isResizing)
  
  // ===== INITIALIZE WIDTHS =====
  const initializeWidths = () => {
    columns().forEach(col => {
      if (col.width && !columnWidths.value[col.field]) {
        columnWidths.value[col.field] = typeof col.width === 'number' 
          ? col.width 
          : parseWidth(col.width)
      }
    })
  }
  
  const parseWidth = (width: string | number): number => {
    if (typeof width === 'number') return width
    
    // Remove 'px' suffix if present
    const parsed = parseInt(width.replace('px', ''))
    return isNaN(parsed) ? 150 : parsed // Default to 150
  }
  
  // ===== START RESIZE =====
  const startResize = (
    field: string,
    event: MouseEvent,
    currentWidth: number
  ) => {
    const column = columns().find(c => c.field === field)
    if (!column || column.resizable === false) return
    
    resizeState.value = {
      isResizing: true,
      resizingColumn: field,
      startX: event.clientX,
      startWidth: currentWidth,
      currentWidth
    }
    
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    
    event.preventDefault()
  }
  
  // ===== ON RESIZE =====
  const onResize = (event: MouseEvent) => {
    if (!resizeState.value.isResizing || !resizeState.value.resizingColumn) return
    
    const diff = event.clientX - resizeState.value.startX
    let newWidth = resizeState.value.startWidth + diff
    
    // Apply min/max constraints
    const column = columns().find(c => c.field === resizeState.value.resizingColumn)
    const min = column?.minWidth ?? minWidth
    const max = column?.maxWidth ?? maxWidth
    
    newWidth = Math.max(min, Math.min(max, newWidth))
    
    resizeState.value.currentWidth = newWidth
    columnWidths.value[resizeState.value.resizingColumn] = newWidth
  }
  
  // ===== END RESIZE =====
  const endResize = () => {
    if (!resizeState.value.isResizing || !resizeState.value.resizingColumn) return
    
    const field = resizeState.value.resizingColumn
    const width = resizeState.value.currentWidth
    const column = columns().find(c => c.field === field)
    
    if (column) {
      // Use hyphenated event name with correct payload structure
      emit?.('column-resized', {
        column,
        oldValue: resizeState.value.startWidth,
        newValue: width,
        width,
        cancel: false
      })
    }
    
    resizeState.value = {
      isResizing: false,
      resizingColumn: null,
      startX: 0,
      startWidth: 0,
      currentWidth: 0
    }
    
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  
  // ===== AUTO SIZE COLUMN =====
  const autoSizeColumn = (field: string, data: any[]) => {
    const column = columns().find(c => c.field === field)
    if (!column) return
    
    // Measure header width
    const headerWidth = measureText(column.title, '14px bold')
    
    // Measure content width (sample first 100 rows)
    const sampleData = data.slice(0, 100)
    const contentWidths = sampleData.map(row => {
      const value = row[field]
      const formatted = column.formatter 
        ? String(column.formatter(value, row, column))
        : String(value ?? '')
      return measureText(formatted, '14px normal')
    })
    
    const maxContentWidth = Math.max(...contentWidths, 0)
    const calculatedWidth = Math.max(headerWidth, maxContentWidth) + 32 // Add padding
    
    // Apply constraints
    const min = column.minWidth ?? minWidth
    const max = column.maxWidth ?? maxWidth
    const finalWidth = Math.max(min, Math.min(max, calculatedWidth))
    
    const oldWidth = columnWidths.value[field] || 0
    columnWidths.value[field] = finalWidth
    
    // Use hyphenated event name
    emit?.('column-resized', {
      column,
      oldValue: oldWidth,
      newValue: finalWidth,
      width: finalWidth,
      cancel: false
    })
  }
  
  // ===== AUTO SIZE ALL COLUMNS =====
  const autoSizeAllColumns = (data: any[]) => {
    columns()
      .filter(col => col.resizable !== false)
      .forEach(col => autoSizeColumn(col.field, data))
  }
  
  // ===== MEASURE TEXT WIDTH =====
  const measureText = (text: string, font: string): number => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return 150
    
    context.font = font
    const metrics = context.measureText(text)
    return Math.ceil(metrics.width)
  }
  
  // ===== GET COLUMN WIDTH =====
  const getColumnWidth = (field: string): number | undefined => {
    return columnWidths.value[field]
  }
  
  // ===== SET COLUMN WIDTH =====
  const setColumnWidth = (field: string, width: number) => {
    const column = columns().find(c => c.field === field)
    if (column) {
      const oldWidth = columnWidths.value[field]
      columnWidths.value[field] = width
      
      emit?.('column-resized', {
        column,
        oldValue: oldWidth,
        newValue: width,
        width,
        cancel: false
      })
    }
  }
  
  // ===== RESET WIDTHS =====
  const resetWidths = () => {
    columnWidths.value = {}
    initializeWidths()
    
    emit?.('state-changed', {
      state: {
        columnWidths: { ...columnWidths.value }
      } as any
    })
  }
  
  // ===== EVENT LISTENERS =====
  const handleMouseMove = (event: MouseEvent) => {
    if (resizeState.value.isResizing) {
      onResize(event)
    }
  }
  
  const handleMouseUp = () => {
    if (resizeState.value.isResizing) {
      endResize()
    }
  }
  
  onMounted(() => {
    initializeWidths()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  })
  
  onBeforeUnmount(() => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  })
  
  return {
    // State
    resizeState,
    columnWidths,
    isResizing,
    
    // Methods
    startResize,
    onResize,
    endResize,
    autoSizeColumn,
    autoSizeAllColumns,
    getColumnWidth,
    setColumnWidth,
    resetWidths
  }
}