/**
 * @fileoverview Public Grid API composable
 * @module composables/useGridApi
 */

import type { Ref } from 'vue'
import type { 
  ColumnDefinition, 
  FilterCondition, 
  SortDescriptor,
  ExportConfig 
} from '../types'

export interface GridApi {
  // ===== DATA =====
  getData: () => any[]
  getTotalCount: () => number
  getRow: (key: any) => any | undefined
  refresh: () => Promise<void>
  reload: () => Promise<void>
  
  // ===== COLUMNS =====
  getColumns: () => ColumnDefinition[]
  getVisibleColumns: () => ColumnDefinition[]
  showColumn: (field: string) => void
  hideColumn: (field: string) => void
  getColumnWidth: (field: string) => number | undefined
  setColumnWidth: (field: string, width: number) => void
  reorderColumns: (order: string[]) => void
  
  // ===== SORTING =====
  getSorting: () => SortDescriptor[]
  setSorting: (sorts: SortDescriptor[]) => void
  clearSorting: () => void
  sortBy: (field: string, direction: 'asc' | 'desc') => void
  
  // ===== FILTERING =====
  getFilters: () => FilterCondition[]
  setFilters: (filters: FilterCondition[]) => void
  addFilter: (filter: FilterCondition) => void
  removeFilter: (field: string) => void
  clearFilters: () => void
  
  // ===== GROUPING =====
  getGroups: () => string[]
  setGroups: (fields: string[]) => void
  addGroup: (field: string) => void
  removeGroup: (field: string) => void
  clearGroups: () => void
  
  // ===== PAGINATION =====
  getCurrentPage: () => number
  getPageSize: () => number
  getTotalPages: () => number
  goToPage: (page: number) => void
  nextPage: () => void
  previousPage: () => void
  setPageSize: (size: number) => void
  
  // ===== SELECTION =====
  getSelectedRows: () => any[]
  getSelectedKeys: () => any[]
  selectRow: (key: any) => void
  deselectRow: (key: any) => void
  selectAll: () => void
  deselectAll: () => void
  isRowSelected: (key: any) => boolean
  
  // ===== EDITING =====
  startEdit: (key: any, field?: string) => void
  cancelEdit: () => void
  saveEdit: () => Promise<boolean>
  addRow: (data: any) => Promise<boolean>
  deleteRow: (key: any) => void
  
  // ===== SEARCH =====
  search: (term: string) => void
  clearSearch: () => void
  getSearchTerm: () => string
  
  // ===== EXPORT =====
  exportToCSV: (config?: Partial<ExportConfig>) => Promise<void>
  exportToPDF: (config?: Partial<ExportConfig>) => Promise<void>
  exportToExcel: (config?: Partial<ExportConfig>) => Promise<void>
  
  // ===== STATE =====
  saveState: () => void
  loadState: () => void
  clearState: () => void
  getState: () => any
  
  // ===== UTILITIES =====
  scrollToRow: (key: any) => void
  scrollToTop: () => void
  scrollToBottom: () => void
  focus: () => void
  getInstance: () => any
}

export function useGridApi(
  // All the composables and refs passed in
  options: {
    data: Ref<any[]>
    total: Ref<number>
    columns: Ref<ColumnDefinition[]>
    visibleColumns: Ref<ColumnDefinition[]>
    sorting: any
    filtering: any
    grouping: any
    pagination: any
    selection: any
    editing: any
    search: any
    export: any
    state: any
    columnResize?: any
    columnReorder?: any
    rowExpansion?: any
    virtualization?: any
  }
): GridApi {
  return {
    // ===== DATA =====
    getData: () => options.data.value,
    getTotalCount: () => options.total.value,
    getRow: (key: any) => options.data.value.find((row: any) => row.id === key),
    refresh: async () => {
      // Implementation depends on your data source
    },
    reload: async () => {
      // Implementation depends on your data source
    },
    
    // ===== COLUMNS =====
    getColumns: () => options.columns.value,
    getVisibleColumns: () => options.visibleColumns.value,
    showColumn: (field: string) => {
      // Implementation
    },
    hideColumn: (field: string) => {
      // Implementation
    },
    getColumnWidth: (field: string) => options.columnResize?.getColumnWidth(field),
    setColumnWidth: (field: string, width: number) => {
      options.columnResize?.setColumnWidth(field, width)
    },
    reorderColumns: (order: string[]) => {
      options.columnReorder?.setColumnOrder(order)
    },
    
    // ===== SORTING =====
    getSorting: () => options.sorting.sortDescriptors.value,
    setSorting: (sorts: SortDescriptor[]) => {
      options.sorting.setSorts(sorts)
    },
    clearSorting: () => options.sorting.clearSort(),
    sortBy: (field: string, direction: 'asc' | 'desc') => {
      options.sorting.setSort(field, direction)
    },
    
    // ===== FILTERING =====
    getFilters: () => options.filtering.filters.value,
    setFilters: (filters: FilterCondition[]) => {
      filters.forEach(f => options.filtering.updateFilter(f.field, f))
    },
    addFilter: (filter: FilterCondition) => {
      options.filtering.updateFilter(filter.field, filter)
    },
    removeFilter: (field: string) => {
      options.filtering.removeFilterByField(field)
    },
    clearFilters: () => options.filtering.clearFilters(),
    
    // ===== GROUPING =====
    getGroups: () => options.grouping.groupDescriptors.value.map((g: any) => g.field),
    setGroups: (fields: string[]) => {
      options.grouping.clearGroups()
      fields.forEach(f => options.grouping.addGroup(f))
    },
    addGroup: (field: string) => options.grouping.addGroup(field),
    removeGroup: (field: string) => options.grouping.removeGroup(field),
    clearGroups: () => options.grouping.clearGroups(),
    
    // ===== PAGINATION =====
    getCurrentPage: () => options.pagination.currentPage.value,
    getPageSize: () => options.pagination.pageSize.value,
    getTotalPages: () => options.pagination.totalPages.value,
    goToPage: (page: number) => options.pagination.goToPage(page),
    nextPage: () => options.pagination.nextPage(),
    previousPage: () => options.pagination.previousPage(),
    setPageSize: (size: number) => options.pagination.changePageSize(size),
    
    // ===== SELECTION =====
    getSelectedRows: () => options.selection.getSelectedItems(options.data.value),
    getSelectedKeys: () => Array.from(options.selection.selectedKeys.value),
    selectRow: (key: any) => {
      const row = options.data.value.find((r: any) => r.id === key)
      if (row) options.selection.toggleSelection(row)
    },
    deselectRow: (key: any) => {
      const row = options.data.value.find((r: any) => r.id === key)
      if (row && options.selection.isSelected(row)) {
        options.selection.toggleSelection(row)
      }
    },
    selectAll: () => options.selection.selectAll(options.data.value),
    deselectAll: () => options.selection.deselectAll(),
    isRowSelected: (key: any) => {
      const row = options.data.value.find((r: any) => r.id === key)
      return row ? options.selection.isSelected(row) : false
    },
    
    // ===== EDITING =====
    startEdit: (key: any, field?: string) => {
      options.editing.startEdit(key, field || 'id')
    },
    cancelEdit: () => options.editing.cancelEdit(),
    saveEdit: async () => {
      // Implementation depends on your data
      return true
    },
    addRow: async (data: any) => options.editing.addRow(data),
    deleteRow: (key: any) => options.editing.deleteRow(key),
    
    // ===== SEARCH =====
    search: (term: string) => {
      options.search.searchTerm.value = term
    },
    clearSearch: () => options.search.clearSearch(),
    getSearchTerm: () => options.search.searchTerm.value,
    
    // ===== EXPORT =====
    exportToCSV: async (config?: Partial<ExportConfig>) => {
      await options.export.exportData(
        options.data.value,
        options.columns.value,
        { format: 'csv', ...config }
      )
    },
    exportToPDF: async (config?: Partial<ExportConfig>) => {
      await options.export.exportData(
        options.data.value,
        options.columns.value,
        { format: 'pdf', ...config }
      )
    },
    exportToExcel: async (config?: Partial<ExportConfig>) => {
      await options.export.exportData(
        options.data.value,
        options.columns.value,
        { format: 'excel', ...config }
      )
    },
    
    // ===== STATE =====
    saveState: () => options.state.saveState(),
    loadState: () => options.state.loadState(),
    clearState: () => options.state.clearState(),
    getState: () => options.state.getState(),
    
    // ===== UTILITIES =====
    scrollToRow: (key: any) => {
      options.virtualization?.scrollToRow(key)
    },
    scrollToTop: () => {
      options.virtualization?.scrollToTop()
    },
    scrollToBottom: () => {
      options.virtualization?.scrollToBottom()
    },
    focus: () => {
      // Implementation
    },
    getInstance: () => {
      return {
        data: options.data,
        columns: options.columns,
        sorting: options.sorting,
        filtering: options.filtering,
        // ... all composables
      }
    }
  }
}