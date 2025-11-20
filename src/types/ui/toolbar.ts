/**
 * @fileoverview Toolbar types
 * @module @tsdatagrid/types/ui/toolbar
 */

import type { Component, VNode } from 'vue'

/**
 * Toolbar action location
 */
export const enum ToolbarLocation {
  Before = 'before',
  After = 'after',
  Center = 'center',
}

/**
 * Toolbar action
 */
export interface ToolbarAction {
  /** Action ID */
  id?: string
  
  /** Display text */
  text?: string
  
  /** Icon (component or string) */
  icon?: Component | string
  
  /** CSS class */
  className?: string
  
  /** Disabled */
  disabled?: boolean | (() => boolean)
  
  /** Visible */
  visible?: boolean | (() => boolean)
  
  /** Tooltip */
  tooltip?: string
  
  /** Location */
  location?: ToolbarLocation
  
  /** On click handler */
  onClick?: () => void
  
  /** Template */
  template?: () => VNode
  
  /** Widget type */
  widget?: 'button' | 'menu' | 'separator' | 'custom'
  
  /** Menu items (for dropdown) */
  items?: ToolbarAction[]
}

/**
 * Toolbar configuration
 */
export interface ToolbarConfig {
  /** Show toolbar */
  visible?: boolean
  
  /** Actions */
  actions?: ToolbarAction[]
  
  /** Show refresh */
  showRefresh?: boolean
  
  /** Show export */
  showExport?: boolean
  
  /** Show column chooser */
  showColumnChooser?: boolean
  
  /** Show search */
  showSearch?: boolean
  
  /** Show add */
  showAdd?: boolean
  
  /** Show delete */
  showDelete?: boolean
  
  /** Custom template */
  template?: () => VNode
}