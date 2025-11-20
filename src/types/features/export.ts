/**
 * @fileoverview Export types
 * @module @tsdatagrid/types/features/export
 */

/**
 * Export format
 */
export const enum ExportFormat {
  CSV = 'csv',
  Excel = 'excel',
  PDF = 'pdf',
  JSON = 'json',
  XML = 'xml',
  HTML = 'html',
}

/**
 * Export scope
 */
export const enum ExportScope {
  /** Current page */
  Page = 'page',
  
  /** All data */
  All = 'all',
  
  /** Selected rows */
  Selected = 'selected',
  
  /** Filtered data */
  Filtered = 'filtered',
}

/**
 * PDF orientation
 */
export const enum PDFOrientation {
  Portrait = 'portrait',
  Landscape = 'landscape',
}

/**
 * PDF page size
 */
export const enum PDFPageSize {
  A4 = 'a4',
  Letter = 'letter',
  Legal = 'legal',
  A3 = 'a3',
}

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Export format */
  format: ExportFormat
  
  /** File name */
  fileName?: string
  
  /** Export scope */
  scope?: ExportScope
  
  /** Columns to export (field names) */
  columns?: string[]
  
  /** Include headers */
  includeHeaders?: boolean
  
  /** Include footers */
  includeFooters?: boolean
  
  /** Include group rows */
  includeGroups?: boolean
  
  /** Auto download */
  autoDownload?: boolean
  
  /** Document title */
  title?: string
  
  /** Theme */
  theme?: 'striped' | 'grid' | 'plain'
  
  // CSV-specific
  /** CSV delimiter */
  delimiter?: string
  
  /** CSV encoding */
  encoding?: string
  
  /** CSV quote character */
  quoteChar?: string
  
  /** CSV escape character */
  escapeChar?: string
  
  // Excel-specific
  /** Sheet name */
  sheetName?: string
  
  /** Excel format (.xls or .xlsx) */
  excelFormat?: 'xls' | 'xlsx'
  
  /** Auto filter */
  autoFilter?: boolean
  
  /** Freeze headers */
  freezeHeaders?: boolean
  
  // PDF-specific
  /** PDF orientation */
  orientation?: PDFOrientation
  
  /** PDF page size */
  pageSize?: PDFPageSize
  
  /** Margins */
  margin?: { top: number; right: number; bottom: number; left: number }
  
  /** Header color (RGB) */
  headerColor?: [number, number, number]
  
  /** Font size */
  fontSize?: number
  
  /** Show page numbers */
  pageNumbers?: boolean
  
  /** Header text */
  headerText?: string
  
  /** Footer text */
  footerText?: string
  
  // Advanced
  /** Custom export function */
  customExport?: (data: any[], config: ExportConfig) => Blob | Promise<Blob>
  
  /** Pre-process data */
  preprocessData?: (data: any[]) => any[]
  
  /** Post-process blob */
  postprocessBlob?: (blob: Blob) => Blob
}

/**
 * Export options
 */
export interface ExportOptions {
  /** Data to export */
  data: any[]
  
  /** Columns */
  columns: string[]
  
  /** Format */
  format: ExportFormat
  
  /** File name */
  fileName: string
  
  /** Additional config */
  config?: Partial<ExportConfig>
}

/**
 * Export result
 */
export interface ExportResult {
  /** Success */
  success: boolean
  
  /** File blob */
  blob?: Blob
  
  /** Download URL */
  url?: string
  
  /** File name */
  fileName?: string
  
  /** Error */
  error?: string
  
  /** Duration (ms) */
  duration?: number
}