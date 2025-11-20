/**
 * @fileoverview Accessibility utilities
 * @module utils/accessibility
 */

import type { AriaAttributes } from '../types'
import { AriaRole } from '../types'

/**
 * Generate ARIA attributes for grid
 */
export function getGridAriaAttributes(totalRows: number, totalColumns: number): AriaAttributes {
  return {
    role: AriaRole.Grid,
    'aria-rowcount': totalRows,
    'aria-colcount': totalColumns,
    'aria-multiselectable': true
  }
}

/**
 * Generate ARIA attributes for row
 */
export function getRowAriaAttributes(
  rowIndex: number,
  isSelected: boolean,
  isExpanded?: boolean
): AriaAttributes {
  return {
    role: AriaRole.Row,
    'aria-rowindex': rowIndex + 1,
    'aria-selected': isSelected,
    ...(isExpanded !== undefined && { 'aria-expanded': isExpanded })
  }
}

/**
 * Generate ARIA attributes for cell
 */
export function getCellAriaAttributes(
  rowIndex: number,
  columnIndex: number,
  isEditing: boolean = false
): AriaAttributes {
  return {
    role: AriaRole.GridCell,
    'aria-rowindex': rowIndex + 1,
    'aria-colindex': columnIndex + 1,
    'aria-readonly': !isEditing
  }
}

/**
 * Generate ARIA attributes for column header
 */
export function getColumnHeaderAriaAttributes(
  columnIndex: number,
  sortDirection?: 'ascending' | 'descending' | 'none'
): AriaAttributes {
  return {
    role: AriaRole.ColumnHeader,
    'aria-colindex': columnIndex + 1,
    ...(sortDirection && { 'aria-sort': sortDirection })
  }
}

/**
 * Announce to screen reader
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message
  
  document.body.appendChild(announcement)
  
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Add screen reader only class
 */
export function addSROnlyClass(): string {
  return 'sr-only'
}

/**
 * Focus element with screen reader announcement
 */
export function focusWithAnnouncement(
  element: HTMLElement,
  announcement: string
): void {
  element.focus()
  announceToScreenReader(announcement)
}

/**
 * Get accessible label for action
 */
export function getActionLabel(action: string, context?: any): string {
  const labels: Record<string, string> = {
    sort: 'Sort column',
    filter: 'Filter column',
    group: 'Group by column',
    edit: 'Edit row',
    delete: 'Delete row',
    select: 'Select row',
    expand: 'Expand group',
    collapse: 'Collapse group'
  }
  
  return labels[action] || action
}