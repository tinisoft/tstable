/**
 * @fileoverview Infinite scrolling composable - COMPLETE IMPLEMENTATION
 * @module composables/useInfiniteScroll
 */

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { GridEmit } from '../types'

export interface InfiniteScrollConfig {
  /** Items per page */
  pageSize?: number
  
  /** Distance from bottom to trigger load (px) */
  threshold?: number
  
  /** Enable infinite scroll */
  enabled?: boolean
  
  /** Load first page automatically */
  initialLoad?: boolean
  
  /** Use Intersection Observer instead of scroll event */
  useIntersectionObserver?: boolean
  
  /** Debounce scroll events (ms) */
  scrollDebounce?: number
  
  /** Auto-load more if content doesn't fill container */
  autoLoadMore?: boolean
}

export interface InfiniteScrollResult {
  /** Loaded data */
  data: any[]
  
  /** Has more data to load */
  hasMore: boolean
  
  /** Total count (optional) */
  totalCount?: number
}

export function useInfiniteScroll(
  loadMore: (page: number, pageSize: number) => Promise<InfiniteScrollResult>,
  config: InfiniteScrollConfig = {},
  emit?: GridEmit
) {
  // ===== STATE =====
  const data = ref<any[]>([])
  const currentPage = ref(1)
  const isLoading = ref(false)
  const hasMore = ref(true)
  const error = ref<Error | null>(null)
  const scrollContainer = ref<HTMLElement | null>(null)
  const sentinelElement = ref<HTMLElement | null>(null)
  const totalCount = ref<number>(0)
  const observer = ref<IntersectionObserver | null>(null)
  const scrollTimeout = ref<number | null>(null)
  
  // ===== CONFIG WITH DEFAULTS =====
  const defaultConfig: Required<InfiniteScrollConfig> = {
    pageSize: 20,
    threshold: 200,
    enabled: true,
    initialLoad: true,
    useIntersectionObserver: true, // ✅ Prefer IO for better performance
    scrollDebounce: 150,
    autoLoadMore: true,
  }
  
  const scrollConfig = computed(() => ({ ...defaultConfig, ...config }))
  
  // ===== COMPUTED =====
  const canLoadMore = computed(() => 
    scrollConfig.value.enabled && 
    hasMore.value && 
    !isLoading.value &&
    !error.value
  )
  
  const progress = computed(() => {
    if (totalCount.value === 0) return 0
    return Math.min((data.value.length / totalCount.value) * 100, 100)
  })
  
  const isComplete = computed(() => !hasMore.value && data.value.length > 0)
  
  // ===== LOAD NEXT PAGE =====
  const loadNextPage = async () => {
    if (!canLoadMore.value) {
      console.log('⏸️ Cannot load more:', {
        enabled: scrollConfig.value.enabled,
        hasMore: hasMore.value,
        isLoading: isLoading.value,
        hasError: !!error.value
      })
      return
    }
    
    isLoading.value = true
    error.value = null
    
    const startTime = performance.now()
    const loadingPage = currentPage.value
    
    console.log(`📥 Loading page ${loadingPage} (${scrollConfig.value.pageSize} items)...`)
    
    // Emit loading event
    emit?.('data-loading')
    
    try {
      const result = await loadMore(loadingPage, scrollConfig.value.pageSize)
      
      // Validate result
      if (!result || !Array.isArray(result.data)) {
        throw new Error('Invalid result format from loadMore')
      }
      
      // Append new data
      const newItems = result.data
      data.value = [...data.value, ...newItems]
      hasMore.value = result.hasMore
      
      // Update total count if provided
      if (result.totalCount !== undefined) {
        totalCount.value = result.totalCount
      } else {
        // Estimate total count
        if (!result.hasMore) {
          totalCount.value = data.value.length
        }
      }
      
      currentPage.value++
      
      const duration = performance.now() - startTime
      
      console.log(`✅ Loaded page ${loadingPage}:`, {
        newItems: newItems.length,
        totalItems: data.value.length,
        hasMore: hasMore.value,
        duration: `${duration.toFixed(0)}ms`,
        progress: `${progress.value.toFixed(1)}%`
      })
      
      // Emit data-loaded event
      emit?.('data-loaded', {
        data: newItems,
        totalCount: totalCount.value || data.value.length,
        duration
      })
      
      // Auto-load more if needed
      if (scrollConfig.value.autoLoadMore && hasMore.value) {
        setTimeout(() => checkAndLoadMore(), 100)
      }
      
    } catch (e: any) {
      error.value = e as Error
      
      console.error(`❌ Error loading page ${loadingPage}:`, e)
      
      // Emit error event
      emit?.('data-error', { 
        error: {
          code: 'INFINITE_SCROLL_ERROR',
          message: error.value.message,
          details: { page: loadingPage }
        }
      })
    } finally {
      isLoading.value = false
    }
  }
  
  // ===== SCROLL HANDLER =====
  const handleScroll = () => {
    if (!scrollContainer.value || !canLoadMore.value) return
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer.value
    const distanceToBottom = scrollHeight - scrollTop - clientHeight
    
    if (distanceToBottom < scrollConfig.value.threshold) {
      console.log(`📜 Scroll threshold reached (${distanceToBottom.toFixed(0)}px from bottom)`)
      
      // Debounce scroll events
      if (scrollTimeout.value) {
        clearTimeout(scrollTimeout.value)
      }
      
      scrollTimeout.value = setTimeout(() => {
        loadNextPage()
      }, scrollConfig.value.scrollDebounce) as any
    }
  }
  
  // ===== INTERSECTION OBSERVER =====
  const setupIntersectionObserver = () => {
    if (!sentinelElement.value || observer.value) return
    
    console.log('👁️ Setting up Intersection Observer')
    
    observer.value = new IntersectionObserver(
      (entries) => {
        const sentinel = entries[0]
        
        if (sentinel.isIntersecting && canLoadMore.value) {
          console.log('🎯 Sentinel visible - loading more')
          loadNextPage()
        }
      },
      {
        root: scrollContainer.value,
        rootMargin: `${scrollConfig.value.threshold}px`,
        threshold: 0
      }
    )
    
    observer.value.observe(sentinelElement.value)
  }
  
  const cleanupIntersectionObserver = () => {
    if (observer.value) {
      console.log('🧹 Cleaning up Intersection Observer')
      observer.value.disconnect()
      observer.value = null
    }
  }
  
  // ===== CHECK AND LOAD MORE =====
  const checkAndLoadMore = () => {
    if (!scrollContainer.value || !canLoadMore.value) return
    
    const { scrollHeight, clientHeight } = scrollContainer.value
    
    // If content doesn't fill the container, load more
    if (scrollHeight <= clientHeight) {
      console.log('📏 Content too short - auto-loading more')
      loadNextPage()
    }
  }
  
  // ===== RESET =====
  const reset = () => {
    console.log('🔄 Resetting infinite scroll')
    data.value = []
    currentPage.value = 1
    hasMore.value = true
    error.value = null
    isLoading.value = false
    totalCount.value = 0
  }
  
  // ===== RELOAD =====
  const reload = async () => {
    console.log('🔃 Reloading infinite scroll')
    reset()
    await loadNextPage()
  }
  
  // ===== ATTACH SCROLL CONTAINER =====
  const attachScrollContainer = (element: HTMLElement | null) => {
    console.log('📦 Attaching scroll container:', !!element)
    
    // Cleanup old container
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.value) {
        clearTimeout(scrollTimeout.value)
      }
    }
    
    scrollContainer.value = element
    
    // Setup new container
    if (scrollContainer.value && !scrollConfig.value.useIntersectionObserver) {
      scrollContainer.value.addEventListener('scroll', handleScroll, { passive: true })
    }
    
    // Re-setup intersection observer if needed
    if (scrollConfig.value.useIntersectionObserver && sentinelElement.value) {
      cleanupIntersectionObserver()
      setupIntersectionObserver()
    }
    
    // Check if we need to load more immediately
    if (scrollConfig.value.autoLoadMore && hasMore.value) {
      setTimeout(() => checkAndLoadMore(), 100)
    }
  }
  
  // ===== ATTACH SENTINEL =====
  const attachSentinel = (element: HTMLElement | null) => {
    console.log('🎯 Attaching sentinel:', !!element)
    
    cleanupIntersectionObserver()
    sentinelElement.value = element
    
    if (scrollConfig.value.useIntersectionObserver && element) {
      setupIntersectionObserver()
    }
  }
  
  // ===== RETRY AFTER ERROR =====
  const retry = async () => {
    if (!error.value) return
    console.log('🔁 Retrying after error')
    error.value = null
    await loadNextPage()
  }
  
  // ===== LIFECYCLE =====
  onMounted(() => {
    console.log('🚀 Infinite scroll mounted', scrollConfig.value)
    
    if (scrollConfig.value.initialLoad) {
      // Delay initial load to ensure DOM is ready
      setTimeout(() => {
        loadNextPage()
      }, 0)
    }
  })
  
  onBeforeUnmount(() => {
    console.log('👋 Infinite scroll unmounting')
    
    if (scrollContainer.value) {
      scrollContainer.value.removeEventListener('scroll', handleScroll)
    }
    
    if (scrollTimeout.value) {
      clearTimeout(scrollTimeout.value)
    }
    
    cleanupIntersectionObserver()
  })
  
  // ===== WATCHERS =====
  watch(
    () => scrollConfig.value.enabled,
    (enabled) => {
      console.log('⚙️ Infinite scroll enabled changed:', enabled)
      if (enabled && data.value.length === 0 && scrollConfig.value.initialLoad) {
        loadNextPage()
      }
    }
  )
  
  watch(
    () => data.value.length,
    () => {
      // Auto-load more if content doesn't fill container
      if (scrollConfig.value.autoLoadMore) {
        setTimeout(() => checkAndLoadMore(), 100)
      }
    }
  )
  
  watch(
    () => scrollConfig.value.useIntersectionObserver,
    (useIO) => {
      if (useIO && sentinelElement.value) {
        setupIntersectionObserver()
      } else {
        cleanupIntersectionObserver()
      }
    }
  )
  
  return {
    // State
    data,
    currentPage,
    isLoading,
    hasMore,
    error,
    canLoadMore,
    scrollContainer,
    sentinelElement,
    totalCount,
    progress,
    isComplete,
    
    // Methods
    loadNextPage,
    reset,
    reload,
    retry,
    attachScrollContainer,
    attachSentinel,
    checkAndLoadMore,
    setupIntersectionObserver,
    cleanupIntersectionObserver,
  }
}