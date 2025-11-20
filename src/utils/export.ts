/**
 * @fileoverview Enhanced export utility with multiple formats
 * @module utils/export
 */

import Papa from 'papaparse'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { UnparseConfig } from 'papaparse'
import { 
  ColumnDefinition, 
  ExportConfig, 
  ExportFormat
} from '../types'

// ===== ENHANCED EXPORT RESULT =====
export interface EnhancedExportResult {
  success: boolean
  blob?: Blob
  url?: string
  fileName?: string
  error?: string
  duration?: number
  rowCount?: number
  columnCount?: number
  byteSize?: number
  metadata?: {
    exportedAt: string
    format: ExportFormat
    rowCount: number
    columnCount: number
    compressedSize?: number
  }
}

// ===== CSV EXPORT =====
export const exportToCSV = async (
  data: any[],
  columns: ColumnDefinition[],
  config: ExportConfig
): Promise<EnhancedExportResult> => {
  const startTime = performance.now()

  try {
    const visibleColumns = columns.filter((col) => col.visible !== false && col.exportable !== false)

    // Prepare headers
    const headers = config.includeHeaders ? visibleColumns.map((col) => col.title) : []

    // Prepare rows
    const rows = data.map((row) =>
      visibleColumns.map((col) => {
        let value = row[col.field as string]

        // Apply column formatter if exists
        if (col.formatter) {
          const formatted = col.formatter(value, row, col)
          value = typeof formatted === 'string' ? formatted : String(formatted ?? '')
        } else if (col.exportValue) {
          value = col.exportValue(row)
        } else {
          value = value ?? ''
        }

        // Escape special characters
        return String(value).replace(/"/g, '""')
      })
    )

    // CSV configuration
    const csvConfig: UnparseConfig = {
      header: config.includeHeaders,
      delimiter: config.delimiter || ',',
      quotes: true,
      quoteChar: config.quoteChar || '"',
      escapeChar: config.escapeChar || '"',
      newline: '\r\n',
      skipEmptyLines: true,
      columns: config.includeHeaders ? headers : undefined
    }

    const csvData = config.includeHeaders ? { fields: headers, data: rows } : rows

    const csv = Papa.unparse(csvData, csvConfig)

    // Add BOM for UTF-8
    const bom = '\ufeff'
    const csvWithBom = bom + csv

    const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' })
    const fileName = ensureExtension(config.fileName || 'export', 'csv')
    const url = URL.createObjectURL(blob)

    // Auto download
    if (config.autoDownload !== false) {
      downloadBlob(blob, fileName)
    }

    const duration = performance.now() - startTime

    return {
      success: true,
      blob,
      url,
      fileName,
      rowCount: rows.length,
      columnCount: visibleColumns.length,
      duration,
      byteSize: blob.size,
      metadata: {
        exportedAt: new Date().toISOString(),
        format: ExportFormat.CSV,
        rowCount: rows.length,
        columnCount: visibleColumns.length
      }
    }
  } catch (error) {
    console.error('CSV Export Error:', error)
    return createErrorResult(ExportFormat.CSV, config.fileName || 'export.csv', error)
  }
}

// ===== EXCEL EXPORT =====
export const exportToExcel = async (
  data: any[],
  columns: ColumnDefinition[],
  config: ExportConfig
): Promise<EnhancedExportResult> => {
  const startTime = performance.now()

  try {
    const visibleColumns = columns.filter((col) => col.visible !== false && col.exportable !== false)

    // Prepare workbook data
    const wsData: any[][] = []

    // Add title if provided
    if (config.title) {
      wsData.push([config.title])
      wsData.push([]) // Empty row
    }

    // Add headers
    if (config.includeHeaders) {
      wsData.push(visibleColumns.map((col) => col.title))
    }

    // Add rows
    data.forEach((row) => {
      wsData.push(
        visibleColumns.map((col) => {
          let value = row[col.field as string]

          // Apply formatter
          if (col.formatter) {
            const formatted = col.formatter(value, row, col)
            return typeof formatted === 'string' ? formatted : formatted
          } else if (col.exportValue) {
            return col.exportValue(row)
          }

          // Type conversion for Excel
          if (col.type === 'number' && value != null) {
            return Number(value)
          } else if (col.type === 'date' && value != null) {
            return new Date(value)
          } else if (col.type === 'boolean' && value != null) {
            return Boolean(value)
          }

          return value ?? ''
        })
      )
    })

    // Create workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Auto-size columns
    const colWidths = visibleColumns.map((col, i) => {
      const headerLength = col.title.length
      const maxContentLength = Math.max(
        ...data.slice(0, 100).map((row) => {
          const value = String(row[col.field as string] ?? '')
          return value.length
        })
      )
      const maxLength = Math.max(headerLength, maxContentLength)
      return { wch: Math.min(maxLength + 2, 50) }
    })
    ws['!cols'] = colWidths

    // Auto-filter
    if (config.autoFilter && config.includeHeaders) {
      const headerRowIndex = config.title ? 2 : 0
      ws['!autofilter'] = {
        ref: XLSX.utils.encode_range({
          s: { r: headerRowIndex, c: 0 },
          e: { r: data.length + headerRowIndex, c: visibleColumns.length - 1 }
        })
      }
    }

    // Add worksheet
    XLSX.utils.book_append_sheet(wb, ws, config.sheetName || 'Sheet1')

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, {
      bookType: config.excelFormat === 'xls' ? 'xls' : 'xlsx',
      type: 'array',
      compression: true
    })

    const mimeType =
      config.excelFormat === 'xls'
        ? 'application/vnd.ms-excel'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    const blob = new Blob([excelBuffer], { type: mimeType })
    const extension = config.excelFormat || 'xlsx'
    const fileName = ensureExtension(config.fileName || 'export', extension)
    const url = URL.createObjectURL(blob)

    // Auto download
    if (config.autoDownload !== false) {
      downloadBlob(blob, fileName)
    }

    const duration = performance.now() - startTime

    return {
      success: true,
      blob,
      url,
      fileName,
      rowCount: data.length,
      columnCount: visibleColumns.length,
      duration,
      byteSize: blob.size,
      metadata: {
        exportedAt: new Date().toISOString(),
        format: ExportFormat.Excel,
        rowCount: data.length,
        columnCount: visibleColumns.length
      }
    }
  } catch (error) {
    console.error('Excel Export Error:', error)
    return createErrorResult(ExportFormat.Excel, config.fileName || 'export.xlsx', error)
  }
}

// ===== PDF EXPORT =====
export const exportToPDF = async (
  data: any[],
  columns: ColumnDefinition[],
  config: ExportConfig
): Promise<EnhancedExportResult> => {
  const startTime = performance.now()

  try {
    const visibleColumns = columns.filter((col) => col.visible !== false && col.exportable !== false)

    // Determine orientation
    const orientation = (config.orientation || (visibleColumns.length > 6 ? 'landscape' : 'portrait')) as 'portrait' | 'landscape'
    const pageSize = (config.pageSize || 'a4') as string

    // Create PDF
    const doc = new jsPDF({
      orientation,
      unit: 'mm',
      format: pageSize
    }) as any

    // Add title
    if (config.title) {
      doc.setFontSize(config.fontSize ? config.fontSize + 2 : 16)
      doc.setFont(undefined, 'bold')
      doc.text(config.title, 14, 15)
    }

    // Prepare headers
    const head = config.includeHeaders ? [visibleColumns.map((col) => col.title)] : []

    // Prepare body
    const body = data.map((row) =>
      visibleColumns.map((col) => {
        let value = row[col.field as string]

        // Apply formatter
        if (col.formatter) {
          const formatted = col.formatter(value, row, col)
          value = typeof formatted === 'string' ? formatted : String(formatted ?? '')
        } else if (col.exportValue) {
          value = col.exportValue(row)
        } else if (value instanceof Date) {
          value = value.toLocaleDateString()
        } else {
          value = String(value ?? '')
        }

        // Truncate long values
        return value.length > 50 ? value.substring(0, 47) + '...' : value
      })
    )

    // Auto table configuration
    autoTable(doc, {
      head,
      body,
      startY: config.title ? 20 : 10,
      theme: config.theme === 'striped' ? 'striped' : config.theme === 'plain' ? 'plain' : 'grid',
      styles: {
        fontSize: config.fontSize || 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'left',
        valign: 'middle'
      },
      headStyles: {
        fillColor: config.headerColor || [66, 139, 202],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: config.fontSize ? config.fontSize + 1 : 9
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      },
      margin: config.margin || { top: 10, left: 10, right: 10, bottom: 10 },
      didDrawPage: (data: any) => {
        // Page numbers
        if (config.pageNumbers !== false) {
          const pageCount = (doc as any).internal.pages.length - 1
          const pageText = `Page ${data.pageNumber} of ${pageCount}`
          doc.setFontSize(8)
          doc.text(pageText, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 5, {
            align: 'center'
          })
        }

        // Header text
        if (config.headerText) {
          doc.setFontSize(8)
          doc.text(config.headerText, 14, 5)
        }

        // Footer text
        if (config.footerText) {
          doc.setFontSize(8)
          doc.text(config.footerText, 14, doc.internal.pageSize.height - 5)
        }
      }
    })

    const blob = doc.output('blob') as Blob
    const fileName = ensureExtension(config.fileName || 'export', 'pdf')
    const url = URL.createObjectURL(blob)

    // Auto download
    if (config.autoDownload !== false) {
      doc.save(fileName)
    }

    const duration = performance.now() - startTime

    return {
      success: true,
      blob,
      url,
      fileName,
      rowCount: body.length,
      columnCount: visibleColumns.length,
      duration,
      byteSize: blob.size,
      metadata: {
        exportedAt: new Date().toISOString(),
        format: ExportFormat.PDF,
        rowCount: body.length,
        columnCount: visibleColumns.length
      }
    }
  } catch (error) {
    console.error('PDF Export Error:', error)
    return createErrorResult(ExportFormat.PDF, config.fileName || 'export.pdf', error)
  }
}

// ===== JSON EXPORT =====
export const exportToJSON = async (
  data: any[],
  columns: ColumnDefinition[],
  config: ExportConfig
): Promise<EnhancedExportResult> => {
  const startTime = performance.now()

  try {
    const visibleColumns = columns.filter((col) => col.visible !== false && col.exportable !== false)

    // Map data to only include visible columns
    const exportData = data.map((row) => {
      const obj: any = {}
      visibleColumns.forEach((col) => {
        let value = row[col.field as string]

        if (col.formatter) {
          const formatted = col.formatter(value, row, col)
          value = typeof formatted === 'string' ? formatted : formatted
        } else if (col.exportValue) {
          value = col.exportValue(row)
        }

        obj[col.field] = value
      })
      return obj
    })

    // Create metadata
    const jsonOutput = {
      metadata: {
        exportedAt: new Date().toISOString(),
        rowCount: exportData.length,
        columnCount: visibleColumns.length,
        columns: visibleColumns.map((col) => ({
          field: col.field,
          title: col.title,
          type: col.type
        }))
      },
      data: exportData
    }

    // Stringify with optional formatting
    const json = JSON.stringify(jsonOutput, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const fileName = ensureExtension(config.fileName || 'export', 'json')
    const url = URL.createObjectURL(blob)

    // Auto download
    if (config.autoDownload !== false) {
      downloadBlob(blob, fileName)
    }

    const duration = performance.now() - startTime

    return {
      success: true,
      blob,
      url,
      fileName,
      rowCount: data.length,
      columnCount: visibleColumns.length,
      duration,
      byteSize: blob.size,
      metadata: {
        exportedAt: new Date().toISOString(),
        format: ExportFormat.JSON,
        rowCount: data.length,
        columnCount: visibleColumns.length
      }
    }
  } catch (error) {
    console.error('JSON Export Error:', error)
    return createErrorResult(ExportFormat.JSON, config.fileName || 'export.json', error)
  }
}

// ===== XML EXPORT =====
export const exportToXML = async (
  data: any[],
  columns: ColumnDefinition[],
  config: ExportConfig
): Promise<EnhancedExportResult> => {
  const startTime = performance.now()

  try {
    const visibleColumns = columns.filter((col) => col.visible !== false && col.exportable !== false)

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<data>\n'

    if (config.title) {
      xml += `  <title>${escapeXml(config.title)}</title>\n`
    }

    xml += '  <metadata>\n'
    xml += `    <exportedAt>${new Date().toISOString()}</exportedAt>\n`
    xml += `    <rowCount>${data.length}</rowCount>\n`
    xml += `    <columnCount>${visibleColumns.length}</columnCount>\n`
    xml += '  </metadata>\n'

    xml += '  <rows>\n'
    data.forEach((row, index) => {
      xml += `    <row index="${index}">\n`
      visibleColumns.forEach((col) => {
        let value = row[col.field as string]

        if (col.formatter) {
          const formatted = col.formatter(value, row, col)
          value = typeof formatted === 'string' ? formatted : String(formatted ?? '')
        } else if (col.exportValue) {
          value = col.exportValue(row)
        } else {
          value = value ?? ''
        }

        xml += `      <${col.field}>${escapeXml(String(value))}</${col.field}>\n`
      })
      xml += '    </row>\n'
    })
    xml += '  </rows>\n'
    xml += '</data>'

    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' })
    const fileName = ensureExtension(config.fileName || 'export', 'xml')
    const url = URL.createObjectURL(blob)

    // Auto download
    if (config.autoDownload !== false) {
      downloadBlob(blob, fileName)
    }

    const duration = performance.now() - startTime

    return {
      success: true,
      blob,
      url,
      fileName,
      rowCount: data.length,
      columnCount: visibleColumns.length,
      duration,
      byteSize: blob.size,
      metadata: {
        exportedAt: new Date().toISOString(),
        format: ExportFormat.XML,
        rowCount: data.length,
        columnCount: visibleColumns.length
      }
    }
  } catch (error) {
    console.error('XML Export Error:', error)
    return createErrorResult(ExportFormat.XML, config.fileName || 'export.xml', error)
  }
}

// ===== HTML EXPORT =====
export const exportToHTML = async (
  data: any[],
  columns: ColumnDefinition[],
  config: ExportConfig
): Promise<EnhancedExportResult> => {
  const startTime = performance.now()

  try {
    const visibleColumns = columns.filter((col) => col.visible !== false && col.exportable !== false)

    // Build HTML
    let html = '<!DOCTYPE html>\n'
    html += '<html lang="en">\n'
    html += '<head>\n'
    html += '  <meta charset="UTF-8">\n'
    html += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
    html += `  <title>${config.title || 'Data Export'}</title>\n`
    html += '  <style>\n'
    html += `    body { font-family: Arial, sans-serif; margin: 20px; }\n`
    html += `    h1 { color: #333; }\n`
    html += `    table { border-collapse: collapse; width: 100%; margin-top: 20px; }\n`
    html += `    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n`
    html += `    th { background-color: #4CAF50; color: white; font-weight: bold; }\n`
    html += `    tr:nth-child(even) { background-color: #f2f2f2; }\n`
    html += `    tr:hover { background-color: #ddd; }\n`
    html += '  </style>\n'
    html += '</head>\n'
    html += '<body>\n'

    if (config.title) {
      html += `  <h1>${escapeHtml(config.title)}</h1>\n`
    }

    html += '  <table>\n'

    // Headers
    if (config.includeHeaders) {
      html += '    <thead>\n'
      html += '      <tr>\n'
      visibleColumns.forEach((col) => {
        html += `        <th>${escapeHtml(col.title)}</th>\n`
      })
      html += '      </tr>\n'
      html += '    </thead>\n'
    }

    // Body
    html += '    <tbody>\n'
    data.forEach((row) => {
      html += '      <tr>\n'
      visibleColumns.forEach((col) => {
        let value = row[col.field as string]

        if (col.formatter) {
          const formatted = col.formatter(value, row, col)
          value = typeof formatted === 'string' ? formatted : String(formatted ?? '')
        } else if (col.exportValue) {
          value = col.exportValue(row)
        } else {
          value = value ?? ''
        }

        html += `        <td>${escapeHtml(String(value))}</td>\n`
      })
      html += '      </tr>\n'
    })
    html += '    </tbody>\n'

    html += '  </table>\n'
    html += '</body>\n'
    html += '</html>'

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' })
    const fileName = ensureExtension(config.fileName || 'export', 'html')
    const url = URL.createObjectURL(blob)

    // Auto download
    if (config.autoDownload !== false) {
      downloadBlob(blob, fileName)
    }

    const duration = performance.now() - startTime

    return {
      success: true,
      blob,
      url,
      fileName,
      rowCount: data.length,
      columnCount: visibleColumns.length,
      duration,
      byteSize: blob.size,
      metadata: {
        exportedAt: new Date().toISOString(),
        format: ExportFormat.HTML,
        rowCount: data.length,
        columnCount: visibleColumns.length
      }
    }
  } catch (error) {
    console.error('HTML Export Error:', error)
    return createErrorResult(ExportFormat.HTML, config.fileName || 'export.html', error)
  }
}

// ===== MAIN EXPORT FUNCTION =====
export const exportGridData = async (
  data: any[],
  columns: ColumnDefinition[],
  config: ExportConfig
): Promise<EnhancedExportResult> => {
  console.log(`📤 Starting ${config.format.toUpperCase()} export...`)

  try {
    // Validate inputs
    if (!data || data.length === 0) {
      console.warn('No data to export')
      return createErrorResult(config.format, config.fileName || 'export', 'No data to export')
    }

    if (!columns || columns.length === 0) {
      console.warn('No columns defined')
      return createErrorResult(config.format, config.fileName || 'export', 'No columns defined')
    }

    // Apply custom preprocessing
    let dataToExport = config.preprocessData ? config.preprocessData(data) : [...data]

    // Route to specific export function
    let result: EnhancedExportResult

    switch (config.format) {
      case ExportFormat.CSV:
        result = await exportToCSV(dataToExport, columns, config)
        break
      case ExportFormat.Excel:
        result = await exportToExcel(dataToExport, columns, config)
        break
      case ExportFormat.PDF:
        result = await exportToPDF(dataToExport, columns, config)
        break
      case ExportFormat.JSON:
        result = await exportToJSON(dataToExport, columns, config)
        break
      case ExportFormat.XML:
        result = await exportToXML(dataToExport, columns, config)
        break
      case ExportFormat.HTML:
        result = await exportToHTML(dataToExport, columns, config)
        break
      default:
        throw new Error(`Unsupported export format: ${config.format}`)
    }

    // Apply custom postprocessing
    if (result.success && result.blob && config.postprocessBlob) {
      result.blob = config.postprocessBlob(result.blob)
    }

    if (result.success) {
      console.log(`✅ Export completed in ${result.duration?.toFixed(2)}ms`)
      console.log(`📦 File size: ${formatBytes(result.byteSize || 0)}`)
    }

    return result
  } catch (error) {
    console.error('Export error:', error)
    return createErrorResult(config.format, config.fileName || 'export', error)
  }
}

// ===== HELPER FUNCTIONS =====

function ensureExtension(fileName: string, extension: string): string {
  const ext = `.${extension}`
  return fileName.endsWith(ext) ? fileName : `${fileName}${ext}`
}

function downloadBlob(blob: Blob, fileName: string): void {
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function createErrorResult(
  format: ExportFormat,
  fileName: string,
  error: any
): EnhancedExportResult {
  return {
    success: false,
    blob: new Blob([]),
    fileName,
    rowCount: 0,
    columnCount: 0,
    error: error instanceof Error ? error.message : String(error),
    metadata: {
      exportedAt: new Date().toISOString(),
      format,
      rowCount: 0,
      columnCount: 0
    }
  }
}

// ===== EXPORT MANAGER =====
export class ExportManager {
  private queue: Array<() => Promise<EnhancedExportResult>> = []
  private processing = false

  async add(
    data: any[],
    columns: ColumnDefinition[],
    config: ExportConfig
  ): Promise<EnhancedExportResult> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await exportGridData(data, columns, config)
          resolve(result)
          return result
        } catch (error) {
          reject(error)
          throw error
        }
      })

      this.processQueue()
    })
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true

    while (this.queue.length > 0) {
      const task = this.queue.shift()
      if (task) {
        try {
          await task()
        } catch (error) {
          console.error('Export task failed:', error)
        }
      }
    }

    this.processing = false
  }

  clear(): void {
    this.queue = []
  }

  size(): number {
    return this.queue.length
  }
}

export const globalExportManager = new ExportManager()