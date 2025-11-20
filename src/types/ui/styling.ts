/**
 * @fileoverview Styling types
 * @module @tsdatagrid/types/ui/styling
 */

import type { GridTheme } from '../core/base'

/**
 * CSS class configuration
 */
export interface CssClassConfig {
  /** Grid container */
  grid?: string
  
  /** Header */
  header?: string
  
  /** Header row */
  headerRow?: string
  
  /** Header cell */
  headerCell?: string
  
  /** Body */
  body?: string
  
  /** Row */
  row?: string
  
  /** Cell */
  cell?: string
  
  /** Footer */
  footer?: string
  
  /** Toolbar */
  toolbar?: string
  
  /** Pagination */
  pagination?: string
  
  /** Group panel */
  groupPanel?: string
  
  /** Filter row */
  filterRow?: string
  
  /** Summary row */
  summaryRow?: string
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /** Theme name */
  name: GridTheme | string
  
  /** CSS classes */
  cssClasses?: CssClassConfig
  
  /** CSS variables */
  cssVariables?: Record<string, string>
  
  /** Custom CSS */
  customCss?: string
}

/**
 * Style configuration
 */
export interface StyleConfig {
  /** Theme */
  theme?: ThemeConfig
  
  /** Row height */
  rowHeight?: number
  
  /** Header height */
  headerHeight?: number
  
  /** Footer height */
  footerHeight?: number
  
  /** Cell padding */
  cellPadding?: number | string
  
  /** Border style */
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none'
  
  /** Border color */
  borderColor?: string
  
  /** Stripe rows */
  stripeRows?: boolean
  
  /** Hover effect */
  hoverEffect?: boolean
  
  /** Focus effect */
  focusEffect?: boolean
}