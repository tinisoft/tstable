/**
 * @fileoverview Template types
 * @module @tsdatagrid/types/ui/templates
 */

import type { VNode } from 'vue'
import type { CellTemplateContext, ColumnDefinition, HeaderTemplateContext } from '../core/column'
import type { ActiveFilter } from '../features/filtering'
import type { SummaryResult } from '../features/summary'

/**
 * Template context base
 */
export interface TemplateContext {
  /** Grid instance */
  grid?: any
}

/**
 * Group header template context
 */
export interface GroupHeaderTemplateContext extends TemplateContext {
  /** Group key */
  groupKey: string
  
  /** Group value */
  groupValue: any
  
  /** Group count */
  count: number
  
  /** Group level */
  level: number
  
  /** Is expanded */
  isExpanded: boolean
}

/**
 * Summary template context
 */
export interface SummaryTemplateContext extends TemplateContext {
  /** Summary results */
  summaries: SummaryResult[]
}

/**
 * No data template context
 */
export interface NoDataTemplateContext extends TemplateContext {
  /** Has filters */
  hasFilters: boolean
  
  /** Has search */
  hasSearch: boolean
}

/**
 * Toolbar template context
 */
export interface ToolbarTemplateContext extends TemplateContext {
  /** Selected count */
  selectedCount: number
  
  /** Total count */
  totalCount: number
}

/**
 * Template function
 */
export type TemplateFunction<TContext = any> = (context: TContext) => VNode | string

/**
 * Grid templates
 */
export interface GridTemplates {
  /** Cell template */
  cell?: TemplateFunction<CellTemplateContext>
  
  /** Header cell template */
  headerCell?: TemplateFunction<HeaderTemplateContext>
  
  /** Group header template */
  groupHeader?: TemplateFunction<GroupHeaderTemplateContext>
  
  /** Summary template */
  summary?: TemplateFunction<SummaryTemplateContext>
  
  /** No data template */
  noData?: TemplateFunction<NoDataTemplateContext>
  
  /** Loading template */
  loading?: TemplateFunction<TemplateContext>
  
  /** Toolbar template */
  toolbar?: TemplateFunction<ToolbarTemplateContext>
  
  /** Active filters template */
  activeFilters?: TemplateFunction<{ filters: ActiveFilter[] }>
}