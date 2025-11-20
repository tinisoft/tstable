/**
 * @fileoverview Clipboard operations composable
 * @module composables/useClipboard
 */

import { ref } from 'vue'
import { ColumnType, type ColumnDefinition } from '../types/core/column'
import type { GridEmit } from '../types/core/events'

export interface ClipboardData {
  text: string
  html?: string
  rows: any[]
  columns: ColumnDefinition[]
}

/**
 * Clipboard composable – copy / paste / cut
 */
export function useClipboard<T = any>(
  columns: () => ColumnDefinition[],
  keyField: string = 'id',
  emit?: GridEmit<T>
) {
  const clipboardData = ref<ClipboardData | null>(null)
  const isClipboardSupported = ref(!!navigator.clipboard)
  const lastPastedRows = ref<any[]>([])
  const lastCutRows = ref<any[]>([])

  // --------------------------------------------------------------------- //
  // COPY
  // --------------------------------------------------------------------- //
  const copy = async (
    rows: any[],
    selectedColumns?: ColumnDefinition[]
  ): Promise<boolean> => {
    try {
      const cols = selectedColumns ?? columns().filter(c => c.visible !== false)

      const text = generateTSV(rows, cols)
      const html = generateHTMLTable(rows, cols)

      if (navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': new Blob([text], { type: 'text/plain' }),
            'text/html': new Blob([html], { type: 'text/html' })
          })
        ])
      } else {
        await navigator.clipboard.writeText(text)
      }

      clipboardData.value = { text, html, rows, columns: cols }

      // Since clipboard is not part of GridState, we just emit a generic state-changed
      // with the current state (without clipboard data)
      // Or we could not emit at all since there's no clipboard event in GridEvents
      emit?.('state-changed', { 
        state: {
          // We can't add clipboard here as it's not part of GridState
          // Just trigger a state change notification
        } as any 
      })
      
      return true
    } catch (err) {
      console.error('Copy failed:', err)
      return false
    }
  }

  // --------------------------------------------------------------------- //
  // PASTE
  // --------------------------------------------------------------------- //
  const paste = async (): Promise<any[] | null> => {
    try {
      if (!navigator.clipboard) return null
      const text = await navigator.clipboard.readText()
      const rows = parseTSV(text, columns())
      
      lastPastedRows.value = rows
      
      // Since there's no paste event defined in GridEvents,
      // we can either not emit anything or emit a data-loaded event
      // if the paste operation should update the grid data
      if (rows.length > 0) {
        emit?.('data-loaded', {
          data: rows,
          totalCount: rows.length,
          loadOptions: undefined,
          duration: 0
        })
      }
      
      return rows
    } catch (err) {
      console.error('Paste failed:', err)
      return null
    }
  }

  // --------------------------------------------------------------------- //
  // CUT
  // --------------------------------------------------------------------- //
  const cut = async (
    rows: any[],
    selectedColumns?: ColumnDefinition[]
  ): Promise<boolean> => {
    const ok = await copy(rows, selectedColumns)
    if (ok) {
      lastCutRows.value = rows
      // For cut operation, we might want to emit row-removing events
      // for each row that was cut
      rows.forEach(row => {
        emit?.('row-removing', {
          row,
          rowIndex: -1, // We don't have the index here
          rowKey: row[keyField],
          cancel: false
        })
      })
    }
    return ok
  }

  // --------------------------------------------------------------------- //
  // TSV / HTML helpers
  // --------------------------------------------------------------------- //
  const generateTSV = (rows: any[], cols: ColumnDefinition[]): string => {
    const header = cols.map(c => c.title).join('\t')
    const body = rows
      .map(row =>
        cols
          .map(col => {
            let val = row[col.field]
            if (col.formatter) {
              const f = col.formatter(val, row, col)
              val = typeof f === 'string' ? f : String(f ?? '')
            } else {
              val = String(val ?? '')
            }
            return val.replace(/\t/g, ' ').replace(/\n/g, ' ')
          })
          .join('\t')
      )
      .join('\n')
    return `${header}\n${body}`
  }

  const generateHTMLTable = (rows: any[], cols: ColumnDefinition[]): string => {
    const th = cols.map(c => `<th>${c.title}</th>`).join('')
    const tr = rows
      .map(row =>
        `<tr>${cols
          .map(col => {
            let val = row[col.field]
            if (col.formatter) {
              const f = col.formatter(val, row, col)
              val = typeof f === 'string' ? f : String(f ?? '')
            } else {
              val = String(val ?? '')
            }
            return `<td>${val}</td>`
          })
          .join('')}</tr>`
      )
      .join('')
    return `<table><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`
  }

  const parseTSV = (text: string, cols: ColumnDefinition[]): any[] => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
    const hasHeader = lines[0]?.includes('\t')
    const data = hasHeader ? lines.slice(1) : lines

    return data.map(line => {
      const values = line.split('\t')
      const row: any = {}
      cols.forEach((col, i) => {
        if (i >= values.length) return
        let v: any = values[i]

        // simple type conversion
        if (col.type === ColumnType.Number) v = Number(v)
        else if (col.type === ColumnType.Date || col.type === ColumnType.DateTime) v = new Date(v)
        else if (col.type === ColumnType.Boolean) v = ['true', 'yes', '1'].includes(v.toLowerCase())

        row[col.field] = v
      })
      return row
    })
  }

  // --------------------------------------------------------------------- //
  // Convenience wrappers
  // --------------------------------------------------------------------- //
  const copySelection = async (
    selectedRows: any[],
    selectedColumns?: ColumnDefinition[]
  ) => copy(selectedRows, selectedColumns)

  const copyCell = async (value: any): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(String(value ?? ''))
      return true
    } catch (e) {
      console.error('Copy cell failed:', e)
      return false
    }
  }

  return {
    // state
    clipboardData,
    isClipboardSupported,
    lastPastedRows,
    lastCutRows,

    // actions
    copy,
    paste,
    cut,
    copySelection,
    copyCell,

    // utilities (public for testing / extensions)
    generateTSV,
    generateHTMLTable,
    parseTSV
  }
}