/**
 * @fileoverview Accessibility types
 * @module @tsdatagrid/types/features/accessibility
 */

/**
 * ARIA role
 */
export const enum AriaRole {
  Grid = 'grid',
  Row = 'row',
  RowHeader = 'rowheader',
  ColumnHeader = 'columnheader',
  GridCell = 'gridcell',
  Button = 'button',
  Checkbox = 'checkbox',
  Menu = 'menu',
  MenuItem = 'menuitem',
  Dialog = 'dialog',
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  /** Enable accessibility features */
  enabled?: boolean
  
  /** Enable ARIA labels */
  ariaLabels?: boolean
  
  /** Enable keyboard navigation */
  keyboardNavigation?: boolean
  
  /** Enable screen reader support */
  screenReaderSupport?: boolean
  
  /** Enable high contrast mode */
  highContrastMode?: boolean
  
  /** Announce changes */
  announceChanges?: boolean
  
  /** Custom ARIA labels */
  customAriaLabels?: Record<string, string>
}

/**
 * ARIA attributes
 */
export interface AriaAttributes {
  role?: AriaRole
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-selected'?: boolean
  'aria-checked'?: boolean | 'mixed'
  'aria-disabled'?: boolean
  'aria-readonly'?: boolean
  'aria-required'?: boolean
  'aria-invalid'?: boolean
  'aria-sort'?: 'ascending' | 'descending' | 'none'
  'aria-rowcount'?: number
  'aria-rowindex'?: number
  'aria-colcount'?: number
  'aria-colindex'?: number
  'aria-level'?: number
  'aria-setsize'?: number
  'aria-posinset'?: number
  'aria-multiselectable'?: boolean 
}

/**
 * Screen reader announcement
 */
export interface ScreenReaderAnnouncement {
  /** Message */
  message: string
  
  /** Priority */
  priority?: 'polite' | 'assertive'
  
  /** Delay (ms) */
  delay?: number
}