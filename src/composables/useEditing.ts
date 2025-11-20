/**
 * @fileoverview Enhanced editing composable
 * @module composables/useEditing
 */

import { ref, computed } from 'vue'
import type { 
  Change, 
  EditingConfig, 
  EditingMode, 
  EditingState,
  ColumnField,
  ChangeType  // ✅ ADD THIS
} from '../types'
import type { ColumnDefinition } from '../types'
import type { GridEmit } from '../types'
import { validateRow } from '../utils/validators'
import { deepClone } from '../utils/object'

// ✅ FIXED: Import enum values
import { EditingMode as EditingModeEnum, ChangeType as ChangeTypeEnum } from '../types'

export function useEditing(
  config: EditingConfig = { 
    mode: EditingModeEnum.Row,  // ✅ Use enum
    allowUpdating: true, 
    allowAdding: true, 
    allowDeleting: true,
    confirmDelete: true
  },
  keyField: string = 'id',
  columns: () => ColumnDefinition[],
  emit?: GridEmit
) {
  const changes = ref<Change[]>([])
  const editRowKey = ref<any>(null)
  const editField = ref<string | null>(null)
  const errors = ref<Record<string, string>>({})
  const dirtyRows = ref<Set<any>>(new Set())
  const originalValues = ref<Map<any, any>>(new Map())
  const validationErrors = ref<Map<any, Record<string, string>>>(new Map())

  // ✅ FIXED: Properly handle mode with fallback
  const mode = computed<EditingMode>(() => {
    const configMode = config.mode
    // Handle both enum and string values for backward compatibility
    if (!configMode) return EditingModeEnum.Row
    if (typeof configMode === 'string') {
      // Convert string to enum
      switch (configMode) {
        case 'cell': return EditingModeEnum.Cell
        case 'row': return EditingModeEnum.Row
        case 'batch': return EditingModeEnum.Batch
        case 'popup': return EditingModeEnum.Popup
        case 'form': return EditingModeEnum.Form
        default: return EditingModeEnum.Row
      }
    }
    return configMode
  })

  const isEditing = computed(() => editRowKey.value !== null)
  const hasChanges = computed(() => changes.value.length > 0 || dirtyRows.value.size > 0)
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)
  
  // ===== EDITING STATE =====
  const editingState = computed<EditingState>(() => ({
    editRowKey: editRowKey.value,
    editField: editField.value as ColumnField | null,
    isEditing: isEditing.value,
    mode: mode.value,
    editingCell: editRowKey.value && editField.value 
      ? { rowKey: editRowKey.value, field: editField.value as any }
      : null,
    dirtyRows: dirtyRows.value,
    originalValues: originalValues.value,
    isRowEditing: (rowKey: any) => editRowKey.value === rowKey,
    isCellEditing: (rowKey: any, field: string) => 
      editRowKey.value === rowKey && editField.value === field
  }))

  // ===== START EDIT =====
  async function startEdit(key: any, field: string, rowData?: any): Promise<boolean> {
    if (!config.allowUpdating && !config.allowAdding) return false
    
    // Save original value if not already saved
    if (rowData && !originalValues.value.has(key)) {
      originalValues.value.set(key, deepClone(rowData))
    }
    
    // Cancel previous edit if in cell mode
    if (mode.value === EditingModeEnum.Cell && isEditing.value) {
      const shouldCancel = await confirmCancel()
      if (!shouldCancel) return false
      cancelEdit()
    }
    
    editRowKey.value = key
    editField.value = field
    errors.value = {}
    
    emit?.('edit-start', { 
      row: rowData, 
      rowKey: key, 
      changes: {},
      mode: mode.value,
      isNew: false,
      cancel: false
    })
    
    return true
  }

  // ===== CANCEL EDIT =====
  function cancelEdit(restoreOriginal: boolean = true) {
    if (!isEditing.value) return
    
    const key = editRowKey.value
    
    if (restoreOriginal && originalValues.value.has(key)) {
      const original = originalValues.value.get(key)
      emit?.('edit-cancel', { 
        row: original, 
        rowKey: key,
        changes: {},
        mode: mode.value,
        isNew: false,
        cancel: false
      })
    }
    
    // Clear state
    editRowKey.value = null
    editField.value = null
    errors.value = {}
    
    // Don't remove from dirtyRows in batch mode
    if (mode.value !== EditingModeEnum.Batch) {
      dirtyRows.value.delete(key)
      originalValues.value.delete(key)
      validationErrors.value.delete(key)
    }
  }

  // ===== SAVE EDIT =====
  async function saveEdit(rowData: Record<string, any>, validateOnly: boolean = false): Promise<boolean> {
    if (!editRowKey.value) return false
    
    const key = editRowKey.value
    
    try {
      // Validate
      const validation = await validateRow(rowData, columns(), {})
      
      if (!validation.isValid) {
        errors.value = validation.errors
        validationErrors.value.set(key, validation.errors)
        
        emit?.('validation', {
          row: rowData,
          rowKey: key,
          field: editField.value || '',
          value: editField.value ? rowData[editField.value] : undefined,
          errors: validation.errors,
          isValid: false
        })
        
        return false
      }
      
      if (validateOnly) return true
      
      // Check if actually changed
      const original = originalValues.value.get(key)
      const hasActualChanges = original && !deepEqual(original, rowData)
      
      if (!hasActualChanges && mode.value !== EditingModeEnum.Batch) {
        cancelEdit(false)
        return true
      }
      
      // ✅ FIXED: Use enum
      const change: Change = { 
        type: ChangeTypeEnum.Update,  // ✅ Use enum
        key, 
        data: hasActualChanges ? getChangedFields(original, rowData) : rowData
      }
      
      if (mode.value === EditingModeEnum.Batch) {
        // In batch mode, accumulate changes
        const existingIndex = changes.value.findIndex(c => c.key === key)
        if (existingIndex >= 0) {
          changes.value[existingIndex] = change
        } else {
          changes.value.push(change)
        }
        dirtyRows.value.add(key)
        
        // Clear editing state but keep in dirty
        editRowKey.value = null
        editField.value = null
      } else {
        // In row/cell mode, emit immediately
        changes.value.push(change)
        
        emit?.('edit-end', {
          row: rowData,
          rowKey: key,
          changes: change.data,
          mode: mode.value,
          isNew: false,
          cancel: false
        })
        
        emit?.('row-updated', {
          row: rowData,
          rowKey: key,
          changes: change.data,
          mode: mode.value,
          isNew: false,
          cancel: false
        })
        
        // Clear state
        cancelEdit(false)
      }
      
      // Clear validation errors
      validationErrors.value.delete(key)
      errors.value = {}
      
      return true
    } catch (error) {
      console.error('Save edit error:', error)
      errors.value = { general: 'Save failed' }
      
      emit?.('validation', {
        row: rowData,
        rowKey: key,
        field: '',
        value: undefined,
        errors: errors.value,
        isValid: false
      })
      
      return false
    }
  }

  // ===== ADD ROW =====
  async function addRow(rowData: Record<string, any>): Promise<boolean> {
    if (!config.allowAdding) return false
    
    try {
      const validation = await validateRow(rowData, columns(), {})
      
      if (!validation.isValid) {
        errors.value = validation.errors
        
        emit?.('validation', {
          row: rowData,
          rowKey: null as any,
          field: '',
          value: undefined,
          errors: validation.errors,
          isValid: false
        })
        
        return false
      }

      // ✅ FIXED: Use enum
      const change: Change = { 
        type: ChangeTypeEnum.Insert,  // ✅ Use enum
        key: rowData[keyField] as any,
        data: rowData 
      }
      
      changes.value.push(change)
      
      emit?.('row-inserted', {
        row: rowData,
        rowKey: rowData[keyField],
        changes: rowData,
        mode: mode.value,
        isNew: true,
        cancel: false
      })
      
      errors.value = {}
      return true
    } catch (error) {
      console.error('Add row error:', error)
      errors.value = { general: 'Add failed' }
      
      emit?.('validation', {
        row: rowData,
        rowKey: null as any,
        field: '',
        value: undefined,
        errors: errors.value,
        isValid: false
      })
      
      return false
    }
  }

  // ===== DELETE ROW =====
  async function deleteRow(key: any, rowData?: any, rowIndex: number = -1): Promise<boolean> {
    if (!config.allowDeleting) return false
    
    // Confirm deletion
    if (config.confirmDelete) {
      const confirmed = await confirmDelete(rowData)
      if (!confirmed) return false
    }
    
    // ✅ FIXED: Use enum
    const change: Change = { 
      type: ChangeTypeEnum.Remove,  // ✅ Use enum
      key,
      data: {}
    }
    changes.value.push(change)
    
    // Remove from dirty rows and original values
    dirtyRows.value.delete(key)
    originalValues.value.delete(key)
    validationErrors.value.delete(key)
    
    emit?.('row-removed', {
      row: rowData,
      rowKey: key,
      rowIndex: rowIndex,
      cancel: false
    })
    
    return true
  }

  // ===== DELETE SELECTED ROWS =====
  async function deleteSelectedRows(keys: any[], rowsData?: Map<any, { row: any; index: number }>): Promise<number> {
    if (!config.allowDeleting) return 0
    
    let deletedCount = 0
    
    for (const key of keys) {
      const rowInfo = rowsData?.get(key)
      const deleted = await deleteRow(key, rowInfo?.row, rowInfo?.index ?? -1)
      if (deleted) deletedCount++
    }
    
    return deletedCount
  }

  // ===== SAVE ALL CHANGES =====
  async function saveChanges(): Promise<{ success: boolean; savedCount: number; errors: any[] }> {
    const savedChanges: Change[] = []
    const saveErrors: any[] = []
    
    for (const change of changes.value) {
      try {
        // Emit change for external handling
        emit?.('edit-end', {
          row: change.data,
          rowKey: change.key,
          changes: change.data,
          mode: mode.value,
          isNew: change.type === ChangeTypeEnum.Insert,  // ✅ Use enum
          cancel: false
        })
        
        savedChanges.push(change)
      } catch (error) {
        saveErrors.push({ change, error })
      }
    }
    
    // Clear saved changes
    changes.value = changes.value.filter(c => !savedChanges.includes(c))
    
    // Clear dirty rows and original values for saved changes
    savedChanges.forEach(change => {
      if (change.key) {
        dirtyRows.value.delete(change.key)
        originalValues.value.delete(change.key)
        validationErrors.value.delete(change.key)
      }
    })
    
    return {
      success: saveErrors.length === 0,
      savedCount: savedChanges.length,
      errors: saveErrors
    }
  }

  // ===== CANCEL ALL CHANGES =====
  function cancelChanges() {
    changes.value = []
    dirtyRows.value.clear()
    originalValues.value.clear()
    validationErrors.value.clear()
    cancelEdit()
  }

  // ===== HELPERS =====
  function isRowEditing(key: any): boolean {
    return editRowKey.value === key
  }

  function isCellEditing(rowKey: any, field: string): boolean {
    return editRowKey.value === rowKey && editField.value === field
  }

  function isRowDirty(key: any): boolean {
    return dirtyRows.value.has(key)
  }

  function getRowErrors(key: any): Record<string, string> | undefined {
    return validationErrors.value.get(key)
  }

  function hasRowErrors(key: any): boolean {
    return validationErrors.value.has(key)
  }

  async function validateRowData(rowData: Record<string, any>): Promise<boolean> {
    try {
      const validation = await validateRow(rowData, columns(), {})
      errors.value = validation.isValid ? {} : validation.errors
      return validation.isValid
    } catch (error) {
      console.error('Validation error:', error)
      errors.value = { general: 'Validation failed' }
      return false
    }
  }

  async function validateField(field: string, value: any, rowData: Record<string, any>): Promise<boolean> {
    const column = columns().find(c => c.field === field)
    if (!column?.validator) return true
    
    try {
      const result = await column.validator(value, rowData)
      
      if (result !== true) {
        errors.value[field] = typeof result === 'string' ? result : 'Invalid value'
        return false
      }
      
      delete errors.value[field]
      return true
    } catch (error) {
      errors.value[field] = 'Validation error'
      return false
    }
  }

  function getOriginalValue(key: any): any {
    return originalValues.value.get(key)
  }

  function hasOriginalValue(key: any): boolean {
    return originalValues.value.has(key)
  }

  function restoreOriginalValue(key: any): any {
    const original = originalValues.value.get(key)
    if (original) {
      dirtyRows.value.delete(key)
      validationErrors.value.delete(key)
    }
    return original
  }

  // ===== UTILITY FUNCTIONS =====
  function getChangedFields(original: any, current: any): Record<string, any> {
    const changed: Record<string, any> = {}
    
    Object.keys(current).forEach(key => {
      if (!deepEqual(original[key], current[key])) {
        changed[key] = current[key]
      }
    })
    
    return changed
  }

  function deepEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (a == null || b == null) return false
    if (typeof a !== 'object' || typeof b !== 'object') return false
    
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)
    
    if (keysA.length !== keysB.length) return false
    
    return keysA.every(key => deepEqual(a[key], b[key]))
  }

  async function confirmCancel(): Promise<boolean> {
    if (!hasChanges.value) return true
    
    // Can be customized with a modal/dialog
    return confirm('Discard unsaved changes?')
  }

  async function confirmDelete(rowData?: any): Promise<boolean> {
    const message = config.confirmMessage || 'Are you sure you want to delete this row?'
    return confirm(message)
  }

  return {
    // State
    changes,
    editRowKey,
    editField,
    errors,
    isEditing,
    mode,
    hasChanges,
    hasErrors,
    dirtyRows,
    originalValues,
    validationErrors,
    editingState,
    
    // Methods
    startEdit,
    cancelEdit,
    saveEdit,
    addRow,
    deleteRow,
    deleteSelectedRows,
    saveChanges,
    cancelChanges,
    isRowEditing,
    isCellEditing,
    isRowDirty,
    getRowErrors,
    hasRowErrors,
    validateRowData,
    validateField,
    getOriginalValue,
    hasOriginalValue,
    restoreOriginalValue
  }
}