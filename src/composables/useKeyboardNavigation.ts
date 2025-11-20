/**
 * @fileoverview Keyboard navigation composable
 * @module composables/useKeyboardNavigation
 */

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { 
  KeyboardNavigationConfig, 
  FocusPosition, 
  KeyboardShortcut,
  Key,
  KeyboardAction,
  ColumnDefinition,
  ColumnField,
  RowKey,
  GridEmit
} from '../types'

export function useKeyboardNavigation(
  columns: () => ColumnDefinition[],
  data: () => any[],
  keyField: string = 'id',
  config: KeyboardNavigationConfig = {},
  emit?: GridEmit
) {
  const focusedPosition = ref<FocusPosition | null>(null)
  const focusVisible = ref(false)
  const gridElement = ref<HTMLElement | null>(null)
  
  const defaultConfig: Required<KeyboardNavigationConfig> = {
    enabled: true,
    cellNavigation: true,
    rowNavigation: true,
    editingShortcuts: true,
    selectionShortcuts: true,
    clipboardShortcuts: true,
    customShortcuts: [],
    enterKeyAction: 'startEdit',
    enterKeyDirection: 'down',
    editOnKeyPress: true,
  }
  
  const navigationConfig = computed(() => ({ ...defaultConfig, ...config }))
  
  // ===== BUILT-IN SHORTCUTS =====
  const defaultShortcuts: KeyboardShortcut[] = [
    // Navigation
    { key: Key.ArrowUp, action: KeyboardAction.NavigateUp, description: 'Move up' },
    { key: Key.ArrowDown, action: KeyboardAction.NavigateDown, description: 'Move down' },
    { key: Key.ArrowLeft, action: KeyboardAction.NavigateLeft, description: 'Move left' },
    { key: Key.ArrowRight, action: KeyboardAction.NavigateRight, description: 'Move right' },
    { key: Key.Home, action: KeyboardAction.NavigateFirst, description: 'First column' },
    { key: Key.End, action: KeyboardAction.NavigateLast, description: 'Last column' },
    { key: Key.Home, ctrlKey: true, action: KeyboardAction.NavigateFirst, description: 'First row' },
    { key: Key.End, ctrlKey: true, action: KeyboardAction.NavigateLast, description: 'Last row' },
    { key: Key.PageUp, action: KeyboardAction.NavigatePageUp, description: 'Page up' },
    { key: Key.PageDown, action: KeyboardAction.NavigatePageDown, description: 'Page down' },
    
    // Editing
    { key: Key.F2, action: KeyboardAction.EditCell, description: 'Edit cell', enabled: true },
    { key: Key.Enter, action: KeyboardAction.SaveEdit, description: 'Save edit' },
    { key: Key.Escape, action: KeyboardAction.CancelEdit, description: 'Cancel edit' },
    { key: Key.Delete, action: KeyboardAction.DeleteRow, description: 'Delete row' },
    
    // Selection
    { key: Key.Space, action: KeyboardAction.SelectRow, description: 'Toggle row selection' },
    { key: Key.A, ctrlKey: true, action: KeyboardAction.SelectAll, description: 'Select all' },
    { key: Key.A, ctrlKey: true, shiftKey: true, action: KeyboardAction.DeselectAll, description: 'Deselect all' },
    
    // Clipboard
    { key: Key.C, ctrlKey: true, action: KeyboardAction.Copy, description: 'Copy' },
    { key: Key.V, ctrlKey: true, action: KeyboardAction.Paste, description: 'Paste' },
    { key: Key.X, ctrlKey: true, action: KeyboardAction.Cut, description: 'Cut' },
    
    // Undo/Redo
    { key: Key.Z, ctrlKey: true, action: KeyboardAction.Undo, description: 'Undo' },
    { key: Key.Y, ctrlKey: true, action: KeyboardAction.Redo, description: 'Redo' },
  ]
  
  const activeShortcuts = computed(() => [
    ...defaultShortcuts,
    ...(navigationConfig.value.customShortcuts || [])
  ])
  
  // ===== FOCUS MANAGEMENT =====
  const setFocus = (rowKey: any, columnField: string | ColumnField) => {
    const rowIndex = data().findIndex(row => row[keyField] === rowKey)
    const columnIndex = columns().findIndex(col => col.field === columnField)
    
    if (rowIndex >= 0 && columnIndex >= 0) {
      focusedPosition.value = {
        rowKey: rowKey as RowKey,
        columnField: columnField as ColumnField,
        rowIndex,
        columnIndex
      }
      focusVisible.value = true
      
      // Emit state-changed event (fixed typo: was 'state-Changed')
      emit?.('state-changed', { 
        state: { focusedPosition: focusedPosition.value } 
      })
    }
  }
  
  const clearFocus = () => {
    focusedPosition.value = null
    focusVisible.value = false
    
    emit?.('state-changed', { 
      state: { focusedPosition: null } 
    })
  }
  
  const moveFocus = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (!focusedPosition.value || !navigationConfig.value.enabled) return
    
    const { rowIndex, columnIndex } = focusedPosition.value
    let newRowIndex = rowIndex
    let newColumnIndex = columnIndex
    
    const visibleColumns = columns().filter(col => col.visible !== false)
    const totalRows = data().length
    const totalColumns = visibleColumns.length
    
    switch (direction) {
      case 'up':
        if (navigationConfig.value.rowNavigation) {
          newRowIndex = Math.max(0, rowIndex - 1)
        }
        break
      case 'down':
        if (navigationConfig.value.rowNavigation) {
          newRowIndex = Math.min(totalRows - 1, rowIndex + 1)
        }
        break
      case 'left':
        if (navigationConfig.value.cellNavigation) {
          newColumnIndex = Math.max(0, columnIndex - 1)
        }
        break
      case 'right':
        if (navigationConfig.value.cellNavigation) {
          newColumnIndex = Math.min(totalColumns - 1, columnIndex + 1)
        }
        break
    }
    
    if (newRowIndex !== rowIndex || newColumnIndex !== columnIndex) {
      const newRow = data()[newRowIndex]
      const newColumn = visibleColumns[newColumnIndex]
      
      if (newRow && newColumn) {
        setFocus(newRow[keyField], newColumn.field)
      }
    }
  }
  
  const moveToFirstCell = () => {
    const firstRow = data()[0]
    const firstColumn = columns().find(col => col.visible !== false)
    if (firstRow && firstColumn) {
      setFocus(firstRow[keyField], firstColumn.field)
    }
  }
  
  const moveToLastCell = () => {
    const lastRow = data()[data().length - 1]
    const visibleColumns = columns().filter(col => col.visible !== false)
    const lastColumn = visibleColumns[visibleColumns.length - 1]
    if (lastRow && lastColumn) {
      setFocus(lastRow[keyField], lastColumn.field)
    }
  }
  
  const moveToFirstColumn = () => {
    if (!focusedPosition.value) return
    
    const firstColumn = columns().find(col => col.visible !== false)
    if (firstColumn) {
      setFocus(focusedPosition.value.rowKey, firstColumn.field)
    }
  }
  
  const moveToLastColumn = () => {
    if (!focusedPosition.value) return
    
    const visibleColumns = columns().filter(col => col.visible !== false)
    const lastColumn = visibleColumns[visibleColumns.length - 1]
    if (lastColumn) {
      setFocus(focusedPosition.value.rowKey, lastColumn.field)
    }
  }
  
  const moveToFirstRow = () => {
    if (!focusedPosition.value) return
    
    const firstRow = data()[0]
    if (firstRow) {
      setFocus(firstRow[keyField], focusedPosition.value.columnField)
    }
  }
  
  const moveToLastRow = () => {
    if (!focusedPosition.value) return
    
    const lastRow = data()[data().length - 1]
    if (lastRow) {
      setFocus(lastRow[keyField], focusedPosition.value.columnField)
    }
  }
  
  const movePage = (direction: 'up' | 'down', pageSize: number = 10) => {
    if (!focusedPosition.value) return
    
    const { rowIndex } = focusedPosition.value
    let newRowIndex = rowIndex
    
    if (direction === 'up') {
      newRowIndex = Math.max(0, rowIndex - pageSize)
    } else {
      newRowIndex = Math.min(data().length - 1, rowIndex + pageSize)
    }
    
    const newRow = data()[newRowIndex]
    if (newRow) {
      setFocus(newRow[keyField], focusedPosition.value.columnField)
    }
  }
  
  // ===== KEYBOARD EVENT HANDLER =====
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!navigationConfig.value.enabled) return
    
    const shortcut = findMatchingShortcut(event)
    if (!shortcut) return
    
    // Check if shortcut is enabled
    if (shortcut.enabled === false) return
    
    // Execute action
    const handled = executeAction(shortcut.action, event)
    
    if (handled) {
      event.preventDefault()
      event.stopPropagation()
    }
    
    // Emit key-down event
    emit?.('key-down', {
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: event.target as HTMLElement,
      event,
      cancel: false
    })
  }
  
  const handleKeyUp = (event: KeyboardEvent) => {
    if (!navigationConfig.value.enabled) return
    
    // Emit key-up event
    emit?.('key-up', {
      key: event.key,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      metaKey: event.metaKey,
      target: event.target as HTMLElement,
      event,
      cancel: false
    })
  }
  
  const findMatchingShortcut = (event: KeyboardEvent): KeyboardShortcut | undefined => {
    return activeShortcuts.value.find(shortcut => {
      const keyMatch = shortcut.key === event.key
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey || !shortcut.ctrlKey
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey || !shortcut.shiftKey
      const altMatch = !!shortcut.altKey === event.altKey || !shortcut.altKey
      const metaMatch = !!shortcut.metaKey === event.metaKey || !shortcut.metaKey
      
      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch
    })
  }
  
  const executeAction = (action: KeyboardAction, event: KeyboardEvent): boolean => {
    switch (action) {
      case KeyboardAction.NavigateUp:
        moveFocus('up')
        return true
        
      case KeyboardAction.NavigateDown:
        moveFocus('down')
        return true
        
      case KeyboardAction.NavigateLeft:
        moveFocus('left')
        return true
        
      case KeyboardAction.NavigateRight:
        moveFocus('right')
        return true
        
      case KeyboardAction.NavigateFirst:
        if (event.ctrlKey) {
          moveToFirstCell()
        } else {
          moveToFirstColumn()
        }
        return true
        
      case KeyboardAction.NavigateLast:
        if (event.ctrlKey) {
          moveToLastCell()
        } else {
          moveToLastColumn()
        }
        return true
        
      case KeyboardAction.NavigatePageUp:
        movePage('up')
        return true
        
      case KeyboardAction.NavigatePageDown:
        movePage('down')
        return true
        
      case KeyboardAction.EditCell:
        // Handled by parent component
        return false
        
      case KeyboardAction.SaveEdit:
        // Handled by parent component
        return false
        
      case KeyboardAction.CancelEdit:
        // Handled by parent component
        return false
        
      case KeyboardAction.DeleteRow:
        // Handled by parent component
        return false
        
      case KeyboardAction.SelectRow:
        // Handled by parent component
        return false
        
      case KeyboardAction.SelectAll:
        // Handled by parent component
        return false
        
      case KeyboardAction.DeselectAll:
        // Handled by parent component
        return false
        
      case KeyboardAction.Copy:
        // Handled by parent component or useClipboard
        return false
        
      case KeyboardAction.Paste:
        // Handled by parent component or useClipboard
        return false
        
      case KeyboardAction.Cut:
        // Handled by parent component or useClipboard
        return false
        
      case KeyboardAction.Undo:
        // Handled by parent component or useUndo
        return false
        
      case KeyboardAction.Redo:
        // Handled by parent component or useUndo
        return false
        
      case KeyboardAction.ExpandGroup:
        // Handled by parent component
        return false
        
      case KeyboardAction.CollapseGroup:
        // Handled by parent component
        return false
        
      default:
        return false
    }
  }
  
  // ===== ATTACH GRID ELEMENT =====
  const attachGridElement = (element: HTMLElement | null) => {
    // Cleanup old element
    if (gridElement.value) {
      gridElement.value.removeEventListener('keydown', handleKeyDown)
      gridElement.value.removeEventListener('keyup', handleKeyUp)
    }
    
    gridElement.value = element
    
    // Setup new element
    if (gridElement.value && navigationConfig.value.enabled) {
      gridElement.value.addEventListener('keydown', handleKeyDown)
      gridElement.value.addEventListener('keyup', handleKeyUp)
      gridElement.value.tabIndex = 0 // Make focusable
    }
  }
  
  // ===== LIFECYCLE =====
  onMounted(() => {
    if (navigationConfig.value.enabled && gridElement.value) {
      // Set initial focus
      if (data().length > 0) {
        moveToFirstCell()
      }
    }
  })
  
  onBeforeUnmount(() => {
    if (gridElement.value) {
      gridElement.value.removeEventListener('keydown', handleKeyDown)
      gridElement.value.removeEventListener('keyup', handleKeyUp)
    }
  })
  
  // ===== SHORTCUTS API =====
  const registerShortcut = (shortcut: KeyboardShortcut) => {
    if (!navigationConfig.value.customShortcuts) {
      navigationConfig.value.customShortcuts = []
    }
    navigationConfig.value.customShortcuts.push(shortcut)
  }
  
  const unregisterShortcut = (action: KeyboardAction) => {
    if (navigationConfig.value.customShortcuts) {
      navigationConfig.value.customShortcuts = navigationConfig.value.customShortcuts.filter(
        s => s.action !== action
      )
    }
  }
  
  const getShortcutDescription = (action: KeyboardAction): string | undefined => {
    const shortcut = activeShortcuts.value.find(s => s.action === action)
    return shortcut?.description
  }
  
  const getShortcutKeys = (action: KeyboardAction): string | undefined => {
    const shortcut = activeShortcuts.value.find(s => s.action === action)
    if (!shortcut) return undefined
    
    const keys: string[] = []
    if (shortcut.ctrlKey) keys.push('Ctrl')
    if (shortcut.shiftKey) keys.push('Shift')
    if (shortcut.altKey) keys.push('Alt')
    if (shortcut.metaKey) keys.push('Meta')
    keys.push(shortcut.key)
    
    return keys.join('+')
  }
  
  // ===== GET FOCUSED CELL VALUE =====
  const getFocusedCellValue = (): any => {
    if (!focusedPosition.value) return undefined
    
    const row = data().find(r => r[keyField] === focusedPosition.value?.rowKey)
    if (!row) return undefined
    
    return row[focusedPosition.value.columnField as string]
  }
  
  return {
    // State
    focusedPosition,
    focusVisible,
    gridElement,
    activeShortcuts,
    
    // Methods
    setFocus,
    clearFocus,
    moveFocus,
    moveToFirstCell,
    moveToLastCell,
    moveToFirstColumn,
    moveToLastColumn,
    moveToFirstRow,
    moveToLastRow,
    movePage,
    attachGridElement,
    registerShortcut,
    unregisterShortcut,
    getShortcutDescription,
    getShortcutKeys,
    getFocusedCellValue,
    
    // Config
    config: navigationConfig
  }
}