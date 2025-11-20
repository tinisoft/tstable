/**
 * @fileoverview Enhanced export composable
 * @module composables/useExport
 */

import { ref, computed } from 'vue'
import { exportGridData, EnhancedExportResult } from '../utils/export'
import { 
  ColumnDefinition, 
  ExportConfig, 
  ExportFormat,
  GridEmit,
  ExportEvent
} from '../types'

/**
 * Enhanced export result with additional metadata
 */

export function useExport(emit?: GridEmit) {
  const isExporting = ref(false)
  const exportProgress = ref(0)
  const lastExportResult = ref<EnhancedExportResult | null>(null)

  const canExport = computed(() => !isExporting.value)

  // ===== EXPORT DATA =====
  const exportData = async (
    data: any[],
    columns: ColumnDefinition[],
    config: ExportConfig
  ): Promise<EnhancedExportResult> => {
    if (isExporting.value) {
      console.warn('Export already in progress')
      return {
        success: false,
        blob: new Blob([]),
        fileName: config.fileName || 'export',
        rowCount: 0,
        columnCount: 0,
        error: 'Export already in progress'
      }
    }

    isExporting.value = true
    exportProgress.value = 0

    // Emit export starting event
    const exportEvent: ExportEvent = {
      config,
      cancel: false
    }
    emit?.('export-starting', exportEvent)

    // Check if cancelled
    if (exportEvent.cancel) {
      isExporting.value = false
      return {
        success: false,
        blob: new Blob([]),
        fileName: config.fileName || 'export',
        rowCount: 0,
        columnCount: 0,
        error: 'Export cancelled'
      }
    }

    try {
      // Filter visible columns if not specified
      const columnsToExport = config.columns
        ? columns.filter(col => config.columns!.includes(col.field as string))
        : columns.filter(col => col.visible !== false && col.exportable !== false)

      // Prepare data based on scope
      let dataToExport = [...data]

      if (config.scope) {
        switch (config.scope) {
          case 'page':
            // Data is already filtered by page
            break
          case 'selected':
            // Would need selected rows passed from outside
            break
          case 'filtered':
            // Data is already filtered
            break
          case 'all':
          default:
            // Export all data
            break
        }
      }

      // Update progress
      exportProgress.value = 25

      // Call export utility
      const result = await exportGridData(dataToExport, columnsToExport, config)

      // Update progress
      exportProgress.value = 100

      // Save result
      lastExportResult.value = result

      if (result.success) {
        // Emit export complete event
        const completeEvent: ExportEvent = {
          config,
          data: dataToExport,
          file: result.blob,
          url: result.url,
          cancel: false
        }
        emit?.('export-complete', completeEvent)
      }

      return result
    } catch (error) {
      const errorResult: EnhancedExportResult = {
        success: false,
        blob: new Blob([]),
        fileName: config.fileName || 'export',
        rowCount: 0,
        columnCount: 0,
        error: error instanceof Error ? error.message : 'Export failed'
      }

      lastExportResult.value = errorResult
      
      console.error('Export error:', error)
      return errorResult
    } finally {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  // ===== EXPORT TO CSV =====
  const exportToCSV = async (
    data: any[],
    columns: ColumnDefinition[],
    fileName: string = 'export.csv',
    options?: Partial<ExportConfig>
  ): Promise<EnhancedExportResult> => {
    return exportData(data, columns, {
      format: ExportFormat.CSV,
      fileName,
      includeHeaders: true,
      autoDownload: true,
      ...options
    })
  }

  // ===== EXPORT TO EXCEL =====
  const exportToExcel = async (
    data: any[],
    columns: ColumnDefinition[],
    fileName: string = 'export.xlsx',
    options?: Partial<ExportConfig>
  ): Promise<EnhancedExportResult> => {
    return exportData(data, columns, {
      format: ExportFormat.Excel,
      fileName,
      includeHeaders: true,
      autoDownload: true,
      ...options
    })
  }

  // ===== EXPORT TO PDF =====
  const exportToPDF = async (
    data: any[],
    columns: ColumnDefinition[],
    fileName: string = 'export.pdf',
    options?: Partial<ExportConfig>
  ): Promise<EnhancedExportResult> => {
    return exportData(data, columns, {
      format: ExportFormat.PDF,
      fileName,
      includeHeaders: true,
      autoDownload: true,
      orientation: 'landscape' as any, // Type will be resolved by ExportConfig
      ...options
    })
  }

  // ===== EXPORT TO JSON =====
  const exportToJSON = async (
    data: any[],
    columns: ColumnDefinition[],
    fileName: string = 'export.json',
    options?: Partial<ExportConfig>
  ): Promise<EnhancedExportResult> => {
    return exportData(data, columns, {
      format: ExportFormat.JSON,
      fileName,
      autoDownload: true,
      ...options
    })
  }

  // ===== EXPORT WITH FORMAT =====
  const exportWithFormat = async (
    format: ExportFormat,
    data: any[],
    columns: ColumnDefinition[],
    fileName?: string,
    options?: Partial<ExportConfig>
  ): Promise<EnhancedExportResult> => {
    const extension = {
      [ExportFormat.CSV]: 'csv',
      [ExportFormat.Excel]: 'xlsx',
      [ExportFormat.PDF]: 'pdf',
      [ExportFormat.JSON]: 'json',
      [ExportFormat.XML]: 'xml',
      [ExportFormat.HTML]: 'html'
    }[format]

    return exportData(data, columns, {
      format,
      fileName: fileName || `export.${extension}`,
      autoDownload: true,
      ...options
    })
  }

  // ===== GET LAST EXPORT =====
  const getLastExport = (): EnhancedExportResult | null => {
    return lastExportResult.value
  }

  // ===== CLEAR LAST EXPORT =====
  const clearLastExport = () => {
    lastExportResult.value = null
  }

  // ===== CANCEL EXPORT =====
  const cancelExport = () => {
    if (isExporting.value) {
      isExporting.value = false
      exportProgress.value = 0
    }
  }

  return {
    // State
    isExporting,
    exportProgress,
    lastExportResult,
    canExport,

    // Methods
    exportData,
    exportToCSV,
    exportToExcel,
    exportToPDF,
    exportToJSON,
    exportWithFormat,
    getLastExport,
    clearLastExport,
    cancelExport
  }
}