/**
 * @fileoverview Undo/Redo composable with improved type safety
 * @module composables/useUndo
 */

import { ref, computed } from 'vue'
import type { Change } from '../types'
import type { GridEmit } from '../types'

// ✅ More flexible state interface
export interface UndoState<T = any> {
  changes: Change<any>[]
  data: any[]
  timestamp: Date
  description?: string
}

// ✅ Type-safe state builder
export interface UndoStateInput<T = any> {
  changes: Change<T>[]
  data: T[]
  description?: string
}

export function useUndo<T = any>(
  maxHistorySize: number = 50,
  emit?: GridEmit
) {
  const history = ref<UndoState[]>([])
  const currentIndex = ref(-1)
  
  const canUndo = computed(() => currentIndex.value > 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)
  
  // ===== SAVE STATE =====
  const saveState = (input: UndoStateInput<T>) => {
    // Remove any states after current index (when new change is made after undo)
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }
    
    // Add new state
    const newState: UndoState = {
      changes: [...input.changes],
      data: [...input.data],
      timestamp: new Date(),
      description: input.description
    }
    
    history.value.push(newState)
    currentIndex.value = history.value.length - 1
    
    // Limit history size
    if (history.value.length > maxHistorySize) {
      history.value.shift()
      currentIndex.value--
    }
    
    emit?.('state-changed', {
      state: { 
        undoHistory: history.value.length,
        canUndo: canUndo.value,
        canRedo: canRedo.value
      }
    })
  }
  
  // ===== UNDO =====
  const undo = (): UndoState | null => {
    if (!canUndo.value) return null
    
    currentIndex.value--
    const state = history.value[currentIndex.value]
    
    emit?.('state-changed', {
      state: { 
        undoState: state,
        canUndo: canUndo.value,
        canRedo: canRedo.value
      }
    })
    
    return state
  }
  
  // ===== REDO =====
  const redo = (): UndoState | null => {
    if (!canRedo.value) return null
    
    currentIndex.value++
    const state = history.value[currentIndex.value]
    
    emit?.('state-changed', {
      state: { 
        redoState: state,
        canUndo: canUndo.value,
        canRedo: canRedo.value
      }
    })
    
    return state
  }
  
  // ===== CLEAR HISTORY =====
  const clearHistory = () => {
    history.value = []
    currentIndex.value = -1
    
    emit?.('state-changed', {
      state: { 
        undoHistory: 0,
        canUndo: false,
        canRedo: false
      }
    })
  }
  
  // ===== GET CURRENT STATE =====
  const getCurrentState = (): UndoState | null => {
    if (currentIndex.value >= 0 && currentIndex.value < history.value.length) {
      return history.value[currentIndex.value]
    }
    return null
  }
  
  // ===== GET HISTORY =====
  const getHistory = (): UndoState[] => {
    return [...history.value]
  }
  
  // ===== GET HISTORY COUNT =====
  const getHistoryCount = () => history.value.length
  
  // ===== GO TO STATE =====
  const goToState = (index: number): UndoState | null => {
    if (index < 0 || index >= history.value.length) return null
    
    currentIndex.value = index
    const state = history.value[currentIndex.value]
    
    emit?.('state-changed', {
      state: {
        currentState: state,
        canUndo: canUndo.value,
        canRedo: canRedo.value
      }
    })
    
    return state
  }
  
  return {
    // State
    canUndo,
    canRedo,
    currentIndex,
    
    // Methods
    saveState,
    undo,
    redo,
    clearHistory,
    getCurrentState,
    getHistory,
    getHistoryCount,
    goToState
  }
}