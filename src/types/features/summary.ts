/**
 * @fileoverview Summary types
 * @module @tsdatagrid/types/features/summary
 */

import type { ColumnField } from '../core/base'

/**
 * Summary type
 */
export const enum SummaryType {
  Sum = 'sum',
  Avg = 'avg',
  Min = 'min',
  Max = 'max',
  Count = 'count',
  DistinctCount = 'distinctCount',
  Median = 'median',
  StdDev = 'stdDev',
  Variance = 'variance',
  First = 'first',
  Last = 'last',
  Concat = 'concat',
  Custom = 'custom',
}

/**
 * Summary scope
 */
export const enum SummaryScope {
  /** All data */
  All = 'all',
  
  /** Current page */
  Page = 'page',
  
  /** Group */
  Group = 'group',
  
  /** Both all and group */
  Both = 'both',
}

/**
 * Summary position
 */
export const enum SummaryPosition {
  Footer = 'footer',
  Header = 'header',
  Both = 'both',
}

/**
 * Summary configuration
 */
export interface SummaryConfig {
  /** Field name */
  field: ColumnField | string
  
  /** Summary type */
  type: SummaryType
  
  /** Display label */
  label?: string
  
  /** Scope */
  scope?: SummaryScope
  
  /** Position */
  position?: SummaryPosition
  
  /** Formatter */
  formatter?: (value: any, summaryType: SummaryType) => string | number
  
  /** Custom calculation */
  customCalculation?: (data: any[], field: string) => any
  
  /** Separator (for concat) */
  separator?: string
  
  /** Precision (decimal places) */
  precision?: number
  
  /** Show label */
  showLabel?: boolean
  
  /** CSS class */
  cssClass?: string
  
  /** Alignment */
  alignment?: 'left' | 'center' | 'right'
  
  /** Value template */
  valueTemplate?: (value: any) => string
}

/**
 * Summary result
 */
export interface SummaryResult {
  /** Field name */
  field: string
  
  /** Summary type */
  type: SummaryType
  
  /** Calculated value */
  value: any
  
  /** Formatted value */
  formattedValue: string
  
  /** Scope */
  scope: SummaryScope
}

/**
 * Summary state
 */
export interface SummaryState {
  /** Summary configurations */
  configs: SummaryConfig[]
  
  /** Calculated summaries */
  results: SummaryResult[]
  
  /** Group summaries */
  groupSummaries?: Map<string, SummaryResult[]>
}