/**
 * @fileoverview Loading state composable
 * @module composables/useLoadingState
 */

import { ref, computed } from 'vue'

export interface LoadingOptions {
  text?: string
  overlay?: boolean
  spinner?: boolean
  progress?: number
  cancellable?: boolean
}

export function useLoadingState() {
  const isLoading = ref(false)
  const loadingText = ref<string>('Loading...')
  const loadingProgress = ref<number>(0)
  const loadingOptions = ref<LoadingOptions>({})
  
  const hasProgress = computed(() => 
    loadingOptions.value.progress !== undefined && loadingOptions.value.progress >= 0
  )
  
  // ===== START LOADING =====
  const startLoading = (options?: LoadingOptions) => {
    isLoading.value = true
    loadingOptions.value = {
      text: 'Loading...',
      overlay: true,
      spinner: true,
      cancellable: false,
      ...options
    }
    
    if (options?.text) {
      loadingText.value = options.text
    }
    
    if (options?.progress !== undefined) {
      loadingProgress.value = options.progress
    }
  }
  
  // ===== STOP LOADING =====
  const stopLoading = () => {
    isLoading.value = false
    loadingProgress.value = 0
    loadingOptions.value = {}
  }
  
  // ===== UPDATE PROGRESS =====
  const updateProgress = (progress: number, text?: string) => {
    loadingProgress.value = Math.max(0, Math.min(100, progress))
    
    if (text) {
      loadingText.value = text
    }
  }
  
  // ===== UPDATE TEXT =====
  const updateText = (text: string) => {
    loadingText.value = text
  }
  
  // ===== WRAP ASYNC OPERATION =====
  const withLoading = async <T>(
    operation: () => Promise<T>,
    options?: LoadingOptions
  ): Promise<T> => {
    startLoading(options)
    try {
      return await operation()
    } finally {
      stopLoading()
    }
  }
  
  return {
    // State
    isLoading,
    loadingText,
    loadingProgress,
    loadingOptions,
    hasProgress,
    
    // Methods
    startLoading,
    stopLoading,
    updateProgress,
    updateText,
    withLoading
  }
}