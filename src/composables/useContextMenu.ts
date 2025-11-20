/**
 * @fileoverview Context menu composable
 * @module composables/useContextMenu
 */

import { ref, computed } from 'vue'
import type { ContextMenuItem } from '../types/core/events'
import type { GridEmit } from '../types/core/events'
import { SortDirection } from '../types/features/sorting'

export interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  row?: any
  column?: any
  items: ContextMenuItem[]
}

export function useContextMenu<T = any>(emit?: GridEmit<T>) {
  const menuState = ref<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    items: []
  })
  
  const isVisible = computed(() => menuState.value.visible)
  
  // ===== SHOW MENU =====
  const show = (
    event: MouseEvent,
    row?: any,
    column?: any,
    customItems?: ContextMenuItem[]
  ) => {
    event.preventDefault()
    event.stopPropagation()
    
    const items = customItems || getDefaultItems(row, column)
    
    // ✅ Adjust position to prevent overflow
    const { x, y } = adjustPosition(event.clientX, event.clientY, items.length)
    
    menuState.value = {
      visible: true,
      x,
      y,
      row,
      column,
      items
    }
    
    emit?.('context-menu', {
      event,
      row,
      column,
      items,
      cancel: false
    })
    
    // Close menu on outside click
    setTimeout(() => {
      document.addEventListener('click', hide, { once: true })
      document.addEventListener('contextmenu', hide, { once: true })
    }, 0)
  }
  
  // ===== HIDE MENU =====
  const hide = () => {
    menuState.value = {
      ...menuState.value,
      visible: false
    }
  }
  
  // ===== ADJUST POSITION =====
  const adjustPosition = (x: number, y: number, itemCount: number) => {
    const menuWidth = 220
    const menuHeight = Math.min(itemCount * 36 + 8, 400)
    
    let adjustedX = x
    let adjustedY = y
    
    // Prevent horizontal overflow
    if (x + menuWidth > window.innerWidth) {
      adjustedX = window.innerWidth - menuWidth - 10
    }
    
    // Prevent vertical overflow
    if (y + menuHeight > window.innerHeight) {
      adjustedY = window.innerHeight - menuHeight - 10
    }
    
    // Ensure minimum position
    adjustedX = Math.max(10, adjustedX)
    adjustedY = Math.max(10, adjustedY)
    
    return { x: adjustedX, y: adjustedY }
  }
  
  // ===== DEFAULT ITEMS =====
  const getDefaultItems = (row?: any, column?: any): ContextMenuItem[] => {
    const items: ContextMenuItem[] = []
    
    // ✅ ROW CONTEXT MENU (when right-clicking on a row)
    if (row && !column) {
      items.push(
        {
          text: 'View Details',
          icon: '👁️',
          onClick: () => {
            console.log('View details:', row)
            hide()
          }
        },
        {
          text: 'Edit',
          icon: '✏️',
          onClick: () => {
            emit?.('row-click', { 
              row, 
              rowIndex: 0, 
              rowKey: row.id,
              cancel: false
            })
            hide()
          }
        },
        {
          text: 'Copy',
          icon: '📋',
          onClick: () => {
            navigator.clipboard.writeText(JSON.stringify(row, null, 2))
            console.log('Row copied:', row)
            hide()
          }
        },
        { text: '-' } as ContextMenuItem,
        {
          text: 'Delete',
          icon: '🗑️',
          onClick: () => {
            if (confirm(`Delete row?`)) {
              emit?.('row-removed', { 
                row, 
                rowIndex: 0, 
                rowKey: row.id,
                cancel: false
              })
            }
            hide()
          }
        }
      )
    }
    
    // ✅ COLUMN CONTEXT MENU (when right-clicking on a header)
    else if (column && !row) {
      items.push(
        // Sort Ascending
        {
          text: 'Sort Ascending',
          icon: '↑',
          onClick: () => {
            emit?.('sort-changed', [
              {
                // <-- emit the array
                field: column.field,
                direction: SortDirection.Ascending,
              },
            ]);
            hide();
          },
        },

        // Sort Descending
        {
          text: 'Sort Descending',
          icon: '↓',
          onClick: () => {
            emit?.('sort-changed', [
              {
                // <-- emit the array
                field: column.field,
                direction: SortDirection.Descending,
              },
            ]);
            hide();
          },
        },
        { text: '-' } as ContextMenuItem,
        {
          text: 'Filter',
          icon: '🔍',
          onClick: () => {
            console.log('Open filter for:', column.field)
            hide()
          }
        },
        {
          text: 'Group by this column',
          icon: '📊',
          onClick: () => {
            emit?.('group-changed', { 
              groups: [{ 
                field: column.field,
                expanded: true 
              }] 
            })
            hide()
          }
        },
        { text: '-' } as ContextMenuItem,
        {
          text: 'Hide Column',
          icon: '👁️‍🗨️',
          onClick: () => {
            console.log('Hide column:', column.field)
            hide()
          }
        }
      )
    }
    
    // ✅ CELL CONTEXT MENU (when right-clicking on a cell - both row and column)
    else if (row && column) {
      items.push(
        {
          text: 'Copy Cell Value',
          icon: '📋',
          onClick: () => {
            const value = row[column.field]
            navigator.clipboard.writeText(String(value || ''))
            console.log('Cell value copied:', value)
            hide()
          }
        },
        {
          text: 'Edit Cell',
          icon: '✏️',
          onClick: () => {
            console.log('Edit cell:', row, column.field)
            hide()
          }
        },
        { text: '-' } as ContextMenuItem,
        {
          text: 'Filter by this value',
          icon: '🔍',
          onClick: () => {
            const value = row[column.field]
            console.log('Filter by value:', column.field, value)
            hide()
          }
        }
      )
    }
    
    return items
  }
  
  // ===== ADD ITEM =====
  const addItem = (item: ContextMenuItem) => {
    menuState.value.items.push(item)
  }
  
  // ===== SET ITEMS =====
  const setItems = (items: ContextMenuItem[]) => {
    menuState.value.items = items
  }
  
  // ===== CLEAR ITEMS =====
  const clearItems = () => {
    menuState.value.items = []
  }
  
  // ===== REMOVE ITEM =====
  const removeItem = (text: string) => {
    menuState.value.items = menuState.value.items.filter(item => item.text !== text)
  }
  
  // ===== UPDATE POSITION =====
  const updatePosition = (x: number, y: number) => {
    const adjusted = adjustPosition(x, y, menuState.value.items.length)
    menuState.value.x = adjusted.x
    menuState.value.y = adjusted.y
  }
  
  // ===== CREATE SEPARATOR =====
  const createSeparator = (): ContextMenuItem => ({
    text: '-',
    disabled: true
  })
  
  // ===== CREATE ITEM =====
  const createItem = (
    text: string, 
    onClick: () => void,
    options?: {
      icon?: string
      disabled?: boolean
      items?: ContextMenuItem[]
    }
  ): ContextMenuItem => ({
    text,
    onClick,
    icon: options?.icon,
    disabled: options?.disabled,
    items: options?.items
  })
  
  return {
    // State
    menuState,
    isVisible,
    
    // Methods
    show,
    hide,
    addItem,
    setItems,
    clearItems,
    removeItem,
    getDefaultItems,
    updatePosition,
    
    // Utilities
    createSeparator,
    createItem
  }
}