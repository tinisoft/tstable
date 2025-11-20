/**
 * @fileoverview Column reordering composable
 * @module composables/useColumnReorder
 */

import { ref, computed } from 'vue'
import type { ColumnDefinition } from '../types/core/column'
import type { GridEmit } from '../types/core/events'

export interface DragState {
  isDragging: boolean
  dragColumn: string | null
  dragStartIndex: number
  dropTargetIndex: number | null
  dragElement: HTMLElement | null
}

export function useColumnReorder<T = any>(
  columns: () => ColumnDefinition[],
  emit?: GridEmit<T>
) {
  const columnOrder = ref<string[]>(columns().map(c => c.field))
  const dragState = ref<DragState>({
    isDragging: false,
    dragColumn: null,
    dragStartIndex: -1,
    dropTargetIndex: null,
    dragElement: null
  })
  
  const isDragging = computed(() => dragState.value.isDragging)
  
  // ===== ORDERED COLUMNS =====
  const orderedColumns = computed(() => {
    return columnOrder.value
      .map(field => columns().find(c => c.field === field))
      .filter(Boolean) as ColumnDefinition[]
  })
  
  // ===== START DRAG =====
  const startDrag = (field: string, event: DragEvent) => {
    const column = columns().find(c => c.field === field)
    if (!column || column.locked || column.reorderable === false) {
      event.preventDefault()
      return
    }
    
    const index = columnOrder.value.indexOf(field)
    
    dragState.value = {
      isDragging: true,
      dragColumn: field,
      dragStartIndex: index,
      dropTargetIndex: null,
      dragElement: event.target as HTMLElement
    }
    
    // Set drag data
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', field)
    }
    
    // Add dragging class
    if (dragState.value.dragElement) {
      dragState.value.dragElement.classList.add('dragging')
    }
  }
  
  // ===== ON DRAG OVER =====
  const onDragOver = (field: string, event: DragEvent) => {
    if (!dragState.value.isDragging || dragState.value.dragColumn === field) return
    
    event.preventDefault()
    
    const column = columns().find(c => c.field === field)
    if (column?.locked) return
    
    const dropIndex = columnOrder.value.indexOf(field)
    dragState.value.dropTargetIndex = dropIndex
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }
  
  // ===== ON DROP =====
  const onDrop = (field: string, event: DragEvent) => {
    if (!dragState.value.isDragging || !dragState.value.dragColumn) return
    
    event.preventDefault()
    
    const dragColumn = dragState.value.dragColumn
    const fromIndex = columnOrder.value.indexOf(dragColumn)
    const toIndex = columnOrder.value.indexOf(field)
    
    if (fromIndex !== toIndex) {
      reorderColumn(fromIndex, toIndex)
    }
    
    endDrag()
  }
  
  // ===== END DRAG =====
  const endDrag = () => {
    if (dragState.value.dragElement) {
      dragState.value.dragElement.classList.remove('dragging')
    }
    
    dragState.value = {
      isDragging: false,
      dragColumn: null,
      dragStartIndex: -1,
      dropTargetIndex: null,
      dragElement: null
    }
  }
  
  // ===== REORDER COLUMN =====
  const reorderColumn = (fromIndex: number, toIndex: number) => {
    const newOrder = [...columnOrder.value]
    const [movedColumn] = newOrder.splice(fromIndex, 1)
    newOrder.splice(toIndex, 0, movedColumn)
    
    columnOrder.value = newOrder
    
    const column = columns().find(c => c.field === movedColumn)
    if (column && emit) {
      emit('column-reordered', { 
        oldIndex: fromIndex, 
        newIndex: toIndex, 
        column
      })
    }
  }
  
  // ===== MOVE COLUMN =====
  const moveColumn = (field: string, direction: 'left' | 'right') => {
    const currentIndex = columnOrder.value.indexOf(field)
    if (currentIndex === -1) return
    
    const newIndex = direction === 'left' 
      ? Math.max(0, currentIndex - 1)
      : Math.min(columnOrder.value.length - 1, currentIndex + 1)
    
    if (newIndex !== currentIndex) {
      reorderColumn(currentIndex, newIndex)
    }
  }
  
  // ===== MOVE TO START =====
  const moveToStart = (field: string) => {
    const currentIndex = columnOrder.value.indexOf(field)
    if (currentIndex > 0) {
      reorderColumn(currentIndex, 0)
    }
  }
  
  // ===== MOVE TO END =====
  const moveToEnd = (field: string) => {
    const currentIndex = columnOrder.value.indexOf(field)
    if (currentIndex < columnOrder.value.length - 1) {
      reorderColumn(currentIndex, columnOrder.value.length - 1)
    }
  }
  
  // ===== SET COLUMN ORDER =====
  const setColumnOrder = (order: string[]) => {
    columnOrder.value = [...order]
    
    // Emit state change
    emit?.('state-changed', {
      state: {
        columnOrder: [...columnOrder.value]
      } as any
    })
  }
  
  // ===== RESET ORDER =====
  const resetOrder = () => {
    columnOrder.value = columns().map(c => c.field)
    
    emit?.('state-changed', {
      state: {
        columnOrder: [...columnOrder.value]
      } as any
    })
  }
  
  // ===== GET COLUMN INDEX =====
  const getColumnIndex = (field: string): number => {
    return columnOrder.value.indexOf(field)
  }
  
  return {
    // State
    columnOrder,
    orderedColumns,
    dragState,
    isDragging,
    
    // Methods
    startDrag,
    onDragOver,
    onDrop,
    endDrag,
    reorderColumn,
    moveColumn,
    moveToStart,
    moveToEnd,
    setColumnOrder,
    resetOrder,
    getColumnIndex
  }
}