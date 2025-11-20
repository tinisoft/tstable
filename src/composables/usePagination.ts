/**
 * @fileoverview Enhanced pagination composable
 * @module composables/usePagination
 */

import { ref, computed, watch } from 'vue'
import type { PaginationConfig, PaginationState, GridEmit } from '../types'

export function usePagination(
  config: PaginationConfig = { 
    pageSize: 20, 
    pageSizes: [10, 20, 50, 100], 
    showInfo: true, 
    showPageSizes: true 
  },
  emit?: GridEmit
) {
  // Reactive state
  const currentPage = ref(config.page || 1)
  const pageSize = ref(config.pageSize || 20)
  const totalItems = ref(config.total || 0)

  // Computed properties
  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(totalItems.value / pageSize.value))
  })

  const skip = computed(() => (currentPage.value - 1) * pageSize.value)
  const take = computed(() => pageSize.value)

  const startRecord = computed(() => {
    if (totalItems.value === 0) return 0
    return skip.value + 1
  })

  const endRecord = computed(() => {
    return Math.min(skip.value + pageSize.value, totalItems.value)
  })

  const canGoNext = computed(() => currentPage.value < totalPages.value)
  const canGoPrevious = computed(() => currentPage.value > 1)
  const canGoFirst = computed(() => currentPage.value > 1)
  const canGoLast = computed(() => currentPage.value < totalPages.value)

  const availablePageSizes = computed(() => config.pageSizes || [10, 20, 50, 100])

  const paginationState = computed<PaginationState>(() => ({
    page: currentPage.value,
    pageSize: pageSize.value,
    totalItems: totalItems.value,
    totalPages: totalPages.value,
    startIndex: skip.value,
    endIndex: Math.min(skip.value + pageSize.value, totalItems.value) - 1,
    hasPrevious: canGoPrevious.value,
    hasNext: canGoNext.value,
    visiblePages: getPageNumbers()
  }))

  const paginationInfo = computed(() => {
    if (totalItems.value === 0) return 'No records'
    return `Showing ${startRecord.value} to ${endRecord.value} of ${totalItems.value.toLocaleString()} records`
  })

  // Watch for total items changes
  watch(totalItems, (newTotal) => {
    const maxPage = Math.max(1, Math.ceil(newTotal / pageSize.value))
    if (currentPage.value > maxPage) {
      console.log('📄 Adjusting current page due to total items change')
      currentPage.value = maxPage
    }
  })

  // Watch for page size changes
  watch(pageSize, (newSize, oldSize) => {
    if (oldSize && newSize !== oldSize) {
      // Recalculate page to maintain approximate position
      const oldStartIndex = (currentPage.value - 1) * oldSize
      const newPage = Math.max(1, Math.min(
        Math.floor(oldStartIndex / newSize) + 1, 
        totalPages.value
      ))
      
      if (newPage !== currentPage.value) {
        currentPage.value = newPage
      }
    }
  })

  // ===== EMIT EVENTS =====
  const emitPageChanged = () => {
    // Emit page-changed event (kebab-case)
    emit?.('page-changed', { 
      page: currentPage.value, 
      pageSize: pageSize.value 
    })
    
    // Emit state-changed event (kebab-case)
    emit?.('state-changed', { 
      state: { 
        pagination: { 
          page: currentPage.value, 
          pageSize: pageSize.value,
          totalItems: totalItems.value,
          totalPages: totalPages.value
        } 
      } 
    })
  }

  // ===== GO TO PAGE =====
  const goToPage = (page: number): boolean => {
    const targetPage = Math.max(1, Math.min(page, totalPages.value))
    
    if (targetPage !== currentPage.value) {
      const previousPage = currentPage.value
      currentPage.value = targetPage
      
      emitPageChanged()
      
      return true
    }
    return false
  }

  // ===== NEXT PAGE =====
  const nextPage = (): boolean => {
    if (canGoNext.value) {
      return goToPage(currentPage.value + 1)
    }
    return false
  }

  // ===== PREVIOUS PAGE =====
  const previousPage = (): boolean => {
    if (canGoPrevious.value) {
      return goToPage(currentPage.value - 1)
    }
    return false
  }

  // ===== FIRST PAGE =====
  const firstPage = (): boolean => {
    return goToPage(1)
  }

  // ===== LAST PAGE =====
  const lastPage = (): boolean => {
    return goToPage(totalPages.value)
  }

  // ===== CHANGE PAGE SIZE =====
  const changePageSize = (size: number): boolean => {
    if (availablePageSizes.value.includes(size) && size !== pageSize.value) {
      const oldSize = pageSize.value
      const oldStartIndex = skip.value
      
      pageSize.value = size
      
      // Emit page-size-changed event (kebab-case)
      emit?.('page-size-changed', { pageSize: pageSize.value })
      
      // Recalculate current page to maintain approximate position
      const newPage = Math.max(1, Math.min(
        Math.floor(oldStartIndex / size) + 1,
        totalPages.value
      ))
      
      if (newPage !== currentPage.value) {
        currentPage.value = newPage
      }
      
      // Emit page-changed event
      emitPageChanged()
      
      return true
    }
    return false
  }

  // ===== RESET =====
  const reset = () => {
    currentPage.value = 1
    pageSize.value = config.pageSize || 20
    totalItems.value = 0
    
    emitPageChanged()
  }

  // ===== GET PAGE NUMBERS =====
  const getPageNumbers = (maxVisible: number = 7): number[] => {
    const pages: number[] = []
    const total = totalPages.value
    const current = currentPage.value
    
    if (total <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
    } else {
      // Show smart pagination
      const halfVisible = Math.floor(maxVisible / 2)
      let start = Math.max(1, current - halfVisible)
      let end = Math.min(total, start + maxVisible - 1)
      
      if (end - start + 1 < maxVisible) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  // ===== GET PAGE NUMBERS WITH ELLIPSIS =====
  const getPageNumbersWithEllipsis = (maxVisible: number = 7): Array<number | 'ellipsis'> => {
    const pages: Array<number | 'ellipsis'> = []
    const total = totalPages.value
    const current = currentPage.value
    
    if (total <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= total; i++) {
        pages.push(i)
      }
      return pages
    }
    
    // Always show first page
    pages.push(1)
    
    const halfVisible = Math.floor((maxVisible - 2) / 2) // -2 for first and last
    let start = Math.max(2, current - halfVisible)
    let end = Math.min(total - 1, current + halfVisible)
    
    // Adjust if near start
    if (current <= halfVisible + 2) {
      end = Math.min(total - 1, maxVisible - 1)
      start = 2
    }
    
    // Adjust if near end
    if (current >= total - halfVisible - 1) {
      start = Math.max(2, total - maxVisible + 2)
      end = total - 1
    }
    
    // Add ellipsis before start if needed
    if (start > 2) {
      pages.push('ellipsis')
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    // Add ellipsis after end if needed
    if (end < total - 1) {
      pages.push('ellipsis')
    }
    
    // Always show last page
    if (total > 1) {
      pages.push(total)
    }
    
    return pages
  }

  // ===== SET PAGE (without emitting) =====
  const setPage = (page: number) => {
    const targetPage = Math.max(1, Math.min(page, totalPages.value))
    currentPage.value = targetPage
  }

  // ===== SET PAGE SIZE (without emitting) =====
  const setPageSize = (size: number) => {
    if (availablePageSizes.value.includes(size)) {
      pageSize.value = size
    }
  }

  // ===== SET TOTAL ITEMS =====
  const setTotalItems = (total: number) => {
    totalItems.value = Math.max(0, total)
  }

  // ===== UPDATE CONFIG =====
  const updateConfig = (newConfig: Partial<PaginationConfig>) => {
    if (newConfig.pageSize && newConfig.pageSize !== pageSize.value) {
      changePageSize(newConfig.pageSize)
    }
    if (newConfig.page && newConfig.page !== currentPage.value) {
      goToPage(newConfig.page)
    }
    if (newConfig.total !== undefined) {
      setTotalItems(newConfig.total)
    }
  }

  // ===== GET RANGE INFO =====
  const getRangeInfo = (): { start: number; end: number; total: number } => {
    return {
      start: startRecord.value,
      end: endRecord.value,
      total: totalItems.value
    }
  }

  // ===== GET PAGE INFO =====
  const getPageInfo = (): string => {
    return paginationInfo.value
  }

  // ===== HAS PAGES =====
  const hasPages = computed(() => totalPages.value > 1)

  // ===== IS FIRST PAGE =====
  const isFirstPage = computed(() => currentPage.value === 1)

  // ===== IS LAST PAGE =====
  const isLastPage = computed(() => currentPage.value === totalPages.value)

  // ===== IS PAGE =====
  const isPage = (page: number): boolean => {
    return currentPage.value === page
  }

  // ===== CAN GO TO PAGE =====
  const canGoToPage = (page: number): boolean => {
    return page >= 1 && page <= totalPages.value && page !== currentPage.value
  }

  // ===== GET PAGINATED DATA =====
  const getPaginatedData = <T>(data: T[]): T[] => {
    const start = skip.value
    const end = start + pageSize.value
    return data.slice(start, end)
  }

  return {
    // State
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    skip,
    take,
    startRecord,
    endRecord,
    canGoNext,
    canGoPrevious,
    canGoFirst,
    canGoLast,
    availablePageSizes,
    paginationState,
    paginationInfo,
    isFirstPage,
    isLastPage,
    hasPages,
    
    // Methods
    goToPage,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    changePageSize,
    reset,
    getPageNumbers,
    getPageNumbersWithEllipsis,
    updateConfig,
    setPage,
    setPageSize,
    setTotalItems,
    getRangeInfo,
    getPageInfo,
    isPage,
    canGoToPage,
    getPaginatedData
  }
}