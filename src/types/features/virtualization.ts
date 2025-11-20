/**
 * @fileoverview Virtualization types
 * @module @tsdatagrid/types/features/virtualization
 */

/**
 * Virtualization mode
 */
export const enum VirtualizationMode {
  /** No virtualization */
  None = 'none',
  
  /** Vertical virtualization (rows) */
  Vertical = 'vertical',
  
  /** Horizontal virtualization (columns) */
  Horizontal = 'horizontal',
  
  /** Both vertical and horizontal */
  Both = 'both',
}

/**
 * Scroll mode
 */
export const enum ScrollMode {
  /** Standard scrolling */
  Standard = 'standard',
  
  /** Virtual scrolling */
  Virtual = 'virtual',
  
  /** Infinite scrolling */
  Infinite = 'infinite',
}

/**
 * Virtualization configuration
 */
export interface VirtualizationConfig {
  /** Virtualization mode */
  mode?: VirtualizationMode
  
  /** Row height */
  rowHeight?: number
  
  /** Column width */
  columnWidth?: number
  
  /** Buffer size (rows) */
  rowBuffer?: number
  
  /** Column buffer */
  columnBuffer?: number
  
  /** Enable row virtualization */
  enableRowVirtualization?: boolean
  
  /** Enable column virtualization */
  enableColumnVirtualization?: boolean
  
  /** Threshold (items before virtualization kicks in) */
  threshold?: number
  
  /** Scroll mode */
  scrollMode?: ScrollMode
  
  /** Preload pages */
  preloadPages?: number
}

/**
 * Virtual viewport
 */
export interface VirtualViewport {
  /** Viewport start index */
  startIndex: number
  
  /** Viewport end index */
  endIndex: number
  
  /** Visible rows */
  visibleRows: any[]
  
  /** Offset top */
  offsetTop: number
  
  /** Offset bottom */
  offsetBottom: number
  
  /** Total height */
  totalHeight: number
  
  /** Viewport height */
  viewportHeight: number
}

/**
 * Virtual scroll state
 */
export interface VirtualScrollState {
  /** Scroll top */
  scrollTop: number
  
  /** Scroll left */
  scrollLeft: number
  
  /** Viewport */
  viewport: VirtualViewport
  
  /** Is scrolling */
  isScrolling: boolean
  
  /** Last scroll time */
  lastScrollTime: number
}