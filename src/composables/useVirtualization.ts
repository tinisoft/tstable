/**
 * @fileoverview Fixed virtualization composable with proper scroll handling
 * @module composables/useVirtualization
 */

import { ref, computed, watch, nextTick, onMounted, onUnmounted, triggerRef } from 'vue'
import type { Ref } from 'vue'
import {
  VirtualizationConfig,
  VirtualViewport,
  VirtualScrollState,
  VirtualizationMode,
  ScrollMode,
} from '../types'

export function useVirtualization(
  data: () => any[],
  config: VirtualizationConfig = {}
) {
  // ===== CONFIG =====
  const defaultConfig: Required<VirtualizationConfig> = {
    mode: VirtualizationMode.Vertical,
    rowHeight: 40,
    columnWidth: 150,
    rowBuffer: 5,
    columnBuffer: 3,
    enableRowVirtualization: true,
    enableColumnVirtualization: false,
    threshold: 50,
    scrollMode: ScrollMode.Virtual,
    preloadPages: 1,
  }

  const virtualConfig = computed(() => ({ ...defaultConfig, ...config }))

  // ===== STATE =====
  const scrollContainer: Ref<HTMLElement | null> = ref(null)
  const scrollTop = ref(0)
  const scrollLeft = ref(0)
  const containerHeight = ref(0)
  const containerWidth = ref(0)
  const isScrolling = ref(false)
  const lastScrollTime = ref(0)
  const isInitialized = ref(false)
  const forceUpdateTrigger = ref(0)

  // Performance tracking
  let scrollRAF: number | null = null
  let scrollTimeout: number | null = null
  let resizeObserver: ResizeObserver | null = null

  // ===== VIEWPORT CALCULATION =====
  const viewport = computed<VirtualViewport>(() => {
    // Dependencies
    const dataArray = data()
    const totalRows = dataArray.length
    const rowHeight = virtualConfig.value.rowHeight
    const buffer = virtualConfig.value.rowBuffer
    const currentScrollTop = scrollTop.value
    const currentContainerHeight = containerHeight.value
    
    // Force update trigger
    void forceUpdateTrigger.value

    // Check if virtualization should be active
    const shouldVirtualize = 
      virtualConfig.value.enableRowVirtualization && 
      isInitialized.value &&
      totalRows > 0 &&
      currentContainerHeight > 0

    if (!shouldVirtualize) {
      return {
        startIndex: 0,
        endIndex: totalRows,
        visibleRows: dataArray,
        offsetTop: 0,
        offsetBottom: 0,
        totalHeight: totalRows * rowHeight,
        viewportHeight: currentContainerHeight || (totalRows * rowHeight),
      }
    }

    // Calculate total height
    const totalHeight = totalRows * rowHeight
    
    // Ensure scroll is within bounds
    const maxScroll = Math.max(0, totalHeight - currentContainerHeight)
    const clampedScrollTop = Math.max(0, Math.min(currentScrollTop, maxScroll))
    
    // Calculate visible range
    const firstVisibleIndex = Math.floor(clampedScrollTop / rowHeight)
    const visibleRowCount = Math.ceil(currentContainerHeight / rowHeight)
    const lastVisibleIndex = Math.min(totalRows - 1, firstVisibleIndex + visibleRowCount - 1)
    
    // Apply buffer for smooth scrolling
    const startIndex = Math.max(0, firstVisibleIndex - buffer)
    const endIndex = Math.min(totalRows, lastVisibleIndex + buffer + 1)
    
    // Get visible rows
    const visibleRows = dataArray.slice(startIndex, endIndex)
    
    // Calculate spacers
    const offsetTop = startIndex * rowHeight
    const offsetBottom = Math.max(0, (totalRows - endIndex) * rowHeight)
    
    console.log('📊 Viewport:', {
      scroll: clampedScrollTop,
      range: `${startIndex}-${endIndex}`,
      visible: visibleRows.length,
      total: totalRows,
      firstVisible: firstVisibleIndex,
      lastVisible: lastVisibleIndex,
      offsetTop,
      offsetBottom,
      containerHeight: currentContainerHeight
    })
    
    return {
      startIndex,
      endIndex,
      visibleRows,
      offsetTop,
      offsetBottom,
      totalHeight,
      viewportHeight: currentContainerHeight,
    }
  })

  // ===== SCROLL STATE =====
  const scrollState = computed<VirtualScrollState>(() => ({
    scrollTop: scrollTop.value,
    scrollLeft: scrollLeft.value,
    viewport: viewport.value,
    isScrolling: isScrolling.value,
    lastScrollTime: lastScrollTime.value,
  }))

  // ===== SCROLL HANDLING =====
  const handleScroll = () => {
    if (!scrollContainer.value || !isInitialized.value) return

    const newScrollTop = scrollContainer.value.scrollTop
    const newScrollLeft = scrollContainer.value.scrollLeft

    // Always update scroll position
    scrollTop.value = newScrollTop
    scrollLeft.value = newScrollLeft
    isScrolling.value = true
    lastScrollTime.value = Date.now()
    
    // Force viewport recalculation
    forceUpdateTrigger.value++

    // Clear existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    // Set scrolling to false after delay
    scrollTimeout = window.setTimeout(() => {
      isScrolling.value = false
    }, 150)
  }

  const throttledHandleScroll = () => {
    if (scrollRAF) {
      cancelAnimationFrame(scrollRAF)
    }
    
    scrollRAF = requestAnimationFrame(() => {
      handleScroll()
    })
  }

  // ===== CONTAINER SIZE MANAGEMENT =====
  const updateContainerSize = (force: boolean = false): boolean => {
    if (!scrollContainer.value) return false

    const newHeight = scrollContainer.value.clientHeight
    const newWidth = scrollContainer.value.clientWidth

    if (force || newHeight !== containerHeight.value || newWidth !== containerWidth.value) {
      containerHeight.value = newHeight
      containerWidth.value = newWidth
      
      if (newHeight > 0) {
        isInitialized.value = true
        forceUpdateTrigger.value++
        return true
      }
    }
    
    return false
  }

  // ===== ATTACH/DETACH =====
  const attachContainer = async (el: HTMLElement | null) => {
    console.log('🔗 Attaching container:', !!el)
    
    // Cleanup old container
    if (scrollContainer.value && scrollContainer.value !== el) {
      detachContainer()
    }
    
    if (!el) {
      scrollContainer.value = null
      isInitialized.value = false
      return
    }
    
    scrollContainer.value = el
    
    // Wait for DOM
    await nextTick()
    
    // Initialize dimensions
    updateContainerSize(true)
    
    // Initialize scroll position
    scrollTop.value = el.scrollTop || 0
    scrollLeft.value = el.scrollLeft || 0
    
    // Setup listeners after initialization
    setupScrollListener()
    setupResizeObserver()
    
    // Retry if container not ready
    if (containerHeight.value === 0) {
      console.log('⏳ Container not ready, retrying...')
      await new Promise(resolve => setTimeout(resolve, 100))
      updateContainerSize(true)
    }
    
    if (containerHeight.value > 0) {
      isInitialized.value = true
      forceUpdateTrigger.value++
      console.log('✅ Virtualization ready:', {
        containerHeight: containerHeight.value,
        scrollTop: scrollTop.value,
        dataLength: data().length
      })
    }
  }

  const detachContainer = () => {
    console.log('🔌 Detaching container')
    
    cleanupScrollListener()
    cleanupResizeObserver()
    
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
      scrollTimeout = null
    }
    
    if (scrollRAF) {
      cancelAnimationFrame(scrollRAF)
      scrollRAF = null
    }
    
    scrollContainer.value = null
    isInitialized.value = false
    containerHeight.value = 0
    containerWidth.value = 0
    scrollTop.value = 0
    scrollLeft.value = 0
  }

  // ===== SETUP & CLEANUP =====
  const setupScrollListener = () => {
    if (!scrollContainer.value) return
    
    // Remove any existing listener
    scrollContainer.value.removeEventListener('scroll', throttledHandleScroll)
    
    // Add new listener with passive flag for better performance
    scrollContainer.value.addEventListener('scroll', throttledHandleScroll, { passive: true })
    
    console.log('👂 Scroll listener attached')
  }

  const cleanupScrollListener = () => {
    if (!scrollContainer.value) return
    scrollContainer.value.removeEventListener('scroll', throttledHandleScroll)
  }

  const setupResizeObserver = () => {
    if (!scrollContainer.value) return
    
    if (resizeObserver) {
      resizeObserver.disconnect()
    }

    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === scrollContainer.value) {
          const didUpdate = updateContainerSize()
          if (didUpdate) {
            console.log('📐 Container resized')
          }
        }
      }
    })

    resizeObserver.observe(scrollContainer.value)
  }

  const cleanupResizeObserver = () => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  // ===== UTILITY METHODS =====
  const scrollToIndex = (index: number, behavior: ScrollBehavior = 'smooth') => {
    if (!scrollContainer.value || !isInitialized.value) return

    const rowHeight = virtualConfig.value.rowHeight
    const targetScrollTop = Math.max(0, index * rowHeight)

    scrollContainer.value.scrollTo({
      top: targetScrollTop,
      behavior,
    })
  }

  const scrollToTop = () => {
    if (scrollContainer.value) {
      scrollContainer.value.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToBottom = () => {
    if (scrollContainer.value) {
      const maxScroll = scrollContainer.value.scrollHeight - scrollContainer.value.clientHeight
      scrollContainer.value.scrollTo({ top: maxScroll, behavior: 'smooth' })
    }
  }

  const isRowVisible = (index: number): boolean => {
    const vp = viewport.value
    return index >= vp.startIndex && index < vp.endIndex
  }

  const getVisibleRange = () => ({
    start: viewport.value.startIndex,
    end: viewport.value.endIndex,
    count: viewport.value.visibleRows.length
  })

  const forceUpdate = () => {
    forceUpdateTrigger.value++
  }

  // ===== WATCHERS =====
  
  // Watch data changes
  watch(() => data().length, (newLength) => {
    if (isInitialized.value && newLength > 0) {
      // Adjust scroll if necessary
      const maxScroll = Math.max(0, newLength * virtualConfig.value.rowHeight - containerHeight.value)
      if (scrollTop.value > maxScroll) {
        scrollTop.value = maxScroll
        if (scrollContainer.value) {
          scrollContainer.value.scrollTop = maxScroll
        }
      }
      forceUpdateTrigger.value++
    }
  })

  // ===== LIFECYCLE =====
  onUnmounted(() => {
    detachContainer()
  })

  // ===== PUBLIC API =====
  return {
    // State
    scrollContainer,
    scrollTop,
    scrollLeft,
    viewport,
    scrollState,
    isScrolling,
    containerHeight,
    containerWidth,
    isInitialized,
    
    // Methods
    attachContainer,
    detachContainer,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    updateContainerSize,
    forceUpdate,
    
    // Utils
    isRowVisible,
    getVisibleRange,
    
    // Config
    config: virtualConfig,
  }
}