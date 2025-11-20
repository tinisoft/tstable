<template>
  <div ref="gridRef" class="ts-datagrid" :class="gridClasses" tabindex="0" @keydown="handleKeyDown">
    <!-- Toolbar -->
    <TSDataGridToolbar v-if="shouldShowToolbar" :selected-count="selectedCount" :can-export="allowExport"
      :can-refresh="allowRefresh" :allow-adding="allowAdding" :allow-deleting="allowDeleting" :show-search="showSearch"
      :show-column-chooser="showColumnChooser" :show-undo-redo="allowEditing" :can-undo="canUndo" :can-redo="canRedo"
      :custom-actions="toolbarActions" @export="handleExport" @refresh="handleRefresh" @add="handleAddRow"
      @delete="handleDeleteRows" @search="handleSearch" @column-chooser="handleColumnChooserOpen" @undo="handleUndo"
      @redo="handleRedo" @custom-action="handleCustomAction">
      <template #prepend>
        <slot name="toolbar-prepend" />
      </template>
      <template #center>
        <slot name="toolbar-center" />
      </template>
      <template #append>
        <slot name="toolbar-append" />
      </template>
    </TSDataGridToolbar>

    <!-- Group Panel -->
    <TSDataGridGroupPanel v-if="allowGrouping && showGroupPanel && canGroup" :grouped-columns="groupedColumnFields"
      :columns="columns" :sort-directions="sortDirectionsMap" @update:grouped-columns="handleGroupingChange"
      @sort-toggle="handleGroupSort" @remove="handleGroupRemove" @clear-all="handleGroupClearAll"
      @reorder="handleGroupReorder" />

    <!-- Active Filters Bar -->
    <TSDataGridActiveFilters v-if="allowFiltering && activeFilters.length > 0" :active-filters="activeFilters"
      @remove="handleActiveFilterRemove" @clear-all="handleActiveFiltersClearAll" />

    <!-- Loading Overlay -->
    <div v-if="isLoading && loadingOptions.overlay" class="ts-datagrid__loading-overlay">
      <div class="ts-datagrid__loading-content">
        <div v-if="loadingOptions.spinner" class="ts-datagrid__spinner" />
        <div v-if="loadingText" class="ts-datagrid__loading-text">{{ loadingText }}</div>
        <div v-if="hasProgress" class="ts-datagrid__loading-progress">
          <div class="ts-datagrid__progress-bar">
            <div class="ts-datagrid__progress-fill" :style="{ width: `${loadingProgress}%` }" />
          </div>
          <span class="ts-datagrid__progress-text">{{ Math.round(loadingProgress) }}%</span>
        </div>
      </div>
    </div>

    <!-- Main Grid Container -->
    <div class="ts-datagrid__container" ref="containerRef">
      <div class="ts-datagrid__scrollable" ref="scrollableRef" :style="scrollableStyle">
        <div class="ts-datagrid__scroll-content" :style="scrollContentStyle">
          <!-- Virtual Scroll Top Spacer -->
          <div v-if="enableVirtualization && virtualViewport" class="ts-datagrid__virtual-spacer"
            :style="{ height: `${virtualViewport.offsetTop}px` }" />

          <!-- Header -->
          <TSDataGridHeader :columns="visibleColumns" :sort-descriptors="sortDescriptors" :allow-sorting="allowSorting"
            :allow-filtering="allowFiltering" :allow-reordering="allowColumnReordering"
            :allow-resizing="allowColumnResizing" :allow-selection="allowSelection" :allow-grouping="allowGrouping"
            :selection-mode="effectiveSelectionMode" :all-selected="isAllSelected" :some-selected="isSomeSelected"
            :filter-state="{ filters: filters }" :allow-row-expansion="allowRowExpansion" :resize-state="resizeState"
            :reorder-state="reorderDragState" :column-widths="columnWidths" :focused-cell="focusedPosition"
            @sort="handleSort" @filter="handleFilterOpen" @reorder="handleColumnReorder" @resize="handleColumnResize"
            @select-all="handleSelectAll" @start-resize="handleStartResize" @start-drag="handleStartColumnDrag"
            @drag-over="handleColumnDragOver" @drop-column="handleColumnDrop" @end-drag="handleEndColumnDrag"
            @auto-size="handleColumnAutoSize">
            <template v-for="col in visibleColumns" :key="col.field" #[`header-${col.field}`]="scope">
              <slot :name="`header-${col.field}`" v-bind="scope">
                {{ col.title }}
              </slot>
            </template>
          </TSDataGridHeader>

          <!-- Body -->
          <TSDataGridBody ref="bodyRef" :columns="visibleColumns" :rows="virtualizedRows"
            :grouped-data="virtualizedRows" :is-grouped="isGrouped" :selection-state="selectionStateObj"
            :editing-state="editingStateObj" :expansion-state="expansionStateObj" :row-height="rowHeight"
            :loading="isLoading || infiniteScrollLoading" :key-field="keyField" :allow-row-expansion="allowRowExpansion"
            :infinite-scroll-enabled="allowInfiniteScroll" :infinite-scroll-has-more="infiniteScrollHasMore"
            :virtual-scroll-enabled="enableVirtualization" :virtual-viewport="virtualViewport"
            :focused-position="focusedPosition" :focus-visible="focusVisible" :show-group-summary="showGroupSummary"
            :group-summaries="groupSummariesMap" @row-click="handleRowClick" @row-dblclick="handleRowDblClick"
            @cell-click="handleCellClick" @cell-edit="handleCellEdit" @cell-save="handleCellSave"
            @cell-cancel="handleCellCancel" @select="handleRowSelect" @expand-group="handleExpandGroup"
            @toggle-expansion="handleToggleExpansion" @row-context-menu="handleRowContextMenu"
            @sentinel-ready="handleSentinelReady">
            <template v-for="(_, name) in $slots" :key="name" #[name]="slotProps">
              <slot :name="name" v-bind="slotProps || {}" />
            </template>

            <template v-if="!$slots.loading" #loading>
              <div class="ts-datagrid__loading-spinner">
                <div class="ts-datagrid__spinner" />
                <span>{{ loadingText }}</span>
              </div>
            </template>

            <template v-if="allowInfiniteScroll" #sentinel>
              <div ref="scrollSentinelRef" class="ts-datagrid__scroll-sentinel" style="height: 1px;" />
            </template>

            <template v-if="allowInfiniteScroll && infiniteScrollLoading" #loading-more>
              <div class="ts-datagrid__loading-more">
                <div class="ts-datagrid__spinner ts-datagrid__spinner--small" />
                <span>Loading more...</span>
              </div>
            </template>

            <template v-if="!$slots.empty" #empty>
              <div class="ts-datagrid__empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="16" width="48" height="40" rx="2" stroke="currentColor" stroke-width="2" />
                  <line x1="8" y1="24" x2="56" y2="24" stroke="currentColor" stroke-width="2" />
                  <line x1="20" y1="16" x2="20" y2="56" stroke="currentColor" stroke-width="2" />
                </svg>
                <p>No data available</p>
              </div>
            </template>

            <template #detail="{ row }">
              <slot name="detail" :row="row" />
            </template>
          </TSDataGridBody>

          <!-- Virtual Scroll Bottom Spacer -->
          <div v-if="enableVirtualization && virtualViewport" class="ts-datagrid__virtual-spacer"
            :style="{ height: `${virtualViewport.offsetBottom}px` }" />

          <!-- Summary Footer -->
          <div v-if="showSummary && (hasSummaryData || hasPageSummaryData)" class="ts-datagrid__summary"
            :class="{ 'ts-datagrid__summary--multi-row': hasMultipleSummaryRows }">
            <!-- Page Summary -->
            <div v-if="hasPageSummaryData" class="ts-datagrid__summary-row ts-datagrid__summary-row--page">
              <div v-if="allowSelection" class="ts-datagrid__summary-cell ts-datagrid__summary-cell--selection">
                <span class="ts-datagrid__summary-label">Page</span>
              </div>
              <div v-for="col in visibleColumns" :key="`page-${col.field}`" class="ts-datagrid__summary-cell"
                :class="[getSummaryCellClass(col), { 'ts-datagrid__summary-cell--number': col.type === 'number' }]"
                :style="getCellStyle(col)">
                <slot :name="`summary-page-${col.field}`" :column="col" :value="getPageSummaryValue(col.field)"
                  :config="getPageSummaryConfig(col.field)">
                  {{ formatSummaryValue(col.field, getPageSummaryValue(col.field), 'page') }}
                </slot>
              </div>
            </div>

            <!-- Total Summary -->
            <div v-if="hasSummaryData" class="ts-datagrid__summary-row ts-datagrid__summary-row--total">
              <div v-if="allowSelection"
                class="ts-datagrid__summary-cell ts-datagrid__summary-cell--selection ts-datagrid__summary-cell--label">
                <span class="ts-datagrid__summary-label">Total</span>
              </div>
              <div v-for="col in visibleColumns" :key="`total-${col.field}`" class="ts-datagrid__summary-cell"
                :class="[getSummaryCellClass(col), { 'ts-datagrid__summary-cell--number': col.type === 'number' }]"
                :style="getCellStyle(col)">
                <slot :name="`summary-${col.field}`" :column="col" :value="getSummaryValue(col.field)"
                  :config="getSummaryConfig(col.field)" :allValues="getAllSummaryValues(col.field)">
                  {{ formatSummaryValue(col.field, getSummaryValue(col.field), 'all') }}
                </slot>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Pagination -->
    <TSDataGridFooter v-if="showPagination && totalItems > 0 && !allowInfiniteScroll" :current-page="currentPage"
      :page-size="pageSize" :total-items="totalItems" :total-pages="totalPages"
      :available-page-sizes="availablePageSizes" :show-info="showPaginationInfo" :show-page-sizes="showPageSizes"
      @page-change="handlePageChange" @page-size-change="handlePageSizeChange">
      <template #info="{ startRecord, endRecord, totalItems }">
        <slot name="pagination-info" :start-record="startRecord" :end-record="endRecord" :total-items="totalItems">
          Showing {{ startRecord }} to {{ endRecord }} of {{ totalItems }} records
        </slot>
      </template>
    </TSDataGridFooter>

    <!-- Column Chooser Modal -->
    <TSDataGridColumnChooser :visible="isColumnChooserVisible" :columns="columns" :visible-columns="visibleColumns"
      :column-order="columnOrder" @close="handleColumnChooserClose" @apply="handleColumnChooserApply" />

    <!-- Filter Panel -->
    <TSDataGridFilter v-if="activeFilterColumn" :visible="!!activeFilterColumn" :column="activeFilterColumn"
      :columns="columns" :data="localData" :data-source="dataSource" :existing-filter="getFilter(activeFilterColumn)"
      :position="filterPosition" @apply="handleFilterApply" @clear="handleFilterClear" @close="handleFilterClose" />

    <!-- Context Menu -->
    <TSDataGridContextMenu v-if="contextMenuVisible" :visible="contextMenuVisible" :x="menuState.x" :y="menuState.y"
      :items="menuState.items" @close="hideContextMenu" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, provide, nextTick, useSlots } from 'vue';
import type { PropType } from 'vue';

// Components
import TSDataGridHeader from './TSDataGridHeader.vue';
import TSDataGridBody from './TSDataGridBody.vue';
import TSDataGridFooter from './TSDataGridFooter.vue';
import TSDataGridToolbar from './TSDataGridToolbar.vue';
import TSDataGridColumnChooser from './TSDataGridColumnChooser.vue';
import TSDataGridGroupPanel from './TSDataGridGroupPanel.vue';
import TSDataGridFilter from './TSDataGridFilter.vue';
import TSDataGridActiveFilters from './TSDataGridActiveFilters.vue';
import TSDataGridContextMenu from './TSDataGridContextMenu.vue';

// Composables
import { useDataSource } from '../composables/useDataSource';
import { useSorting } from '../composables/useSorting';
import { useFiltering } from '../composables/useFiltering';
import { usePagination } from '../composables/usePagination';
import { useGrouping } from '../composables/useGrouping';
import { useSelection } from '../composables/useSelection';
import { useExport } from '../composables/useExport';
import { useStatePersistence } from '../composables/useStatePersistence';
import { useEditing } from '../composables/useEditing';
import { useColumnChooser } from '../composables/useColumnChooser';
import { useSearch } from '../composables/useSearch';
import { useSummary } from '../composables/useSummary';
import { useRowExpansion } from '../composables/useRowExpansion';
import { useColumnResize } from '../composables/useColumnResize';
import { useColumnReorder } from '../composables/useColumnReorder';
import { useInfiniteScroll } from '../composables/useInfiniteScroll';
import { useClipboard } from '../composables/useClipboard';
import { useContextMenu } from '../composables/useContextMenu';
import { useUndo } from '../composables/useUndo';
import { useLoadingState } from '../composables/useLoadingState';
import { useVirtualization } from '../composables/useVirtualization';
import { useKeyboardNavigation } from '../composables/useKeyboardNavigation';

// Types
import {
  ColumnDefinition,
  DataSourceConfig,
  ExportConfig,
  ExportFormat,
  SummaryConfig,
  VirtualizationMode,
  ScrollMode,
  SelectionMode,
  SortDescriptor,
  ActiveFilter,
  FilterCondition,
  ToolbarAction,
  SelectionModeType,
  EditingMode,
  SearchMode,
  EditingState,
  FilterOperator
} from '../types';

// ===== PROPS =====
const props = defineProps({
  dataSource: {
    type: Object as PropType<DataSourceConfig>,
    required: true,
  },
  columns: {
    type: Array as PropType<ColumnDefinition[]>,
    required: true,
  },
  keyField: { type: String, default: 'id' },
  allowSorting: { type: Boolean, default: true },
  allowFiltering: { type: Boolean, default: true },
  allowPaging: { type: Boolean, default: true },
  allowColumnReordering: { type: Boolean, default: true },
  allowColumnResizing: { type: Boolean, default: true },
  multiSort: { type: Boolean, default: false },
  allowSelection: { type: Boolean, default: false },
  allowEditing: { type: Boolean, default: false },
  allowAdding: { type: Boolean, default: false },
  allowDeleting: { type: Boolean, default: false },
  allowGrouping: { type: Boolean, default: false },
  allowExport: { type: Boolean, default: false },
  allowRefresh: { type: Boolean, default: false },
  selectionMode: {
    type: Object as PropType<SelectionMode>,
    default: () => ({ mode: 'none', checkboxes: false }),
  },
  showToolbar: { type: Boolean, default: true },
  showGroupPanel: { type: Boolean, default: false },
  showColumnChooser: { type: Boolean, default: true },
  showPagination: { type: Boolean, default: true },
  showPaginationInfo: { type: Boolean, default: true },
  showPageSizes: { type: Boolean, default: true },
  showSummary: { type: Boolean, default: false },
  showSearch: { type: Boolean, default: true },
  rowHeight: { type: Number, default: 40 },
  maxHeight: { type: [Number, String], default: 'auto' },
  theme: { type: String as PropType<'default' | 'material' | 'dark'>, default: 'default' },
  stateKey: { type: String, default: '' },
  summary: { type: Array as PropType<SummaryConfig[]>, default: () => [] },
  toolbarActions: { type: Array as PropType<ToolbarAction[]>, default: () => [] },
  pageSize: { type: Number, default: 20 },
  pageSizes: { type: Array as PropType<number[]>, default: () => [10, 20, 50, 100] },
  allowRowExpansion: { type: Boolean, default: false },
  allowMultipleExpansion: { type: Boolean, default: true },
  expandOnRowClick: { type: Boolean, default: false },
  autoCollapseExpanded: { type: Boolean, default: false },
  allowInfiniteScroll: { type: Boolean, default: false },
  infiniteScrollThreshold: { type: Number, default: 200 },
  infiniteScrollPageSize: { type: Number, default: 20 },
  enableVirtualization: { type: Boolean, default: false },
  virtualRowHeight: { type: Number, default: 40 },
  virtualRowBuffer: { type: Number, default: 5 },
  virtualColumnBuffer: { type: Number, default: 3 },
  virtualScrollThreshold: { type: Number, default: 50 },
  showGroupSummary: { type: Boolean, default: false },
  enableKeyboardNavigation: { type: Boolean, default: true },
  keyboardNavigationConfig: {
    type: Object,
    default: () => ({
      enabled: true,
      cellNavigation: true,
      rowNavigation: true,
      editingShortcuts: true,
      selectionShortcuts: true,
      clipboardShortcuts: true,
      enterKeyAction: 'startEdit',
      enterKeyDirection: 'down',
      editOnKeyPress: true,
    })
  },
});

// ===== EMITS =====
const emit = defineEmits<{
  (e: 'row-click', row: any): void;
  (e: 'row-dblclick', row: any): void;
  (e: 'cell-click', row: any, column: ColumnDefinition): void;
  (e: 'selection-changed', selectedRows: any[]): void;
  (e: 'data-loaded', data: any[]): void;
  (e: 'state-changed', state: any): void;
  (e: 'edit-saved', change: any, mode: string): void;
  (e: 'custom-action', action: any): void;
  (e: 'sort-changed', descriptors: SortDescriptor[]): void;
  (e: 'filter-changed', filters: FilterCondition[], activeFilters?: ActiveFilter[]): void;
  (e: 'group-changed', descriptors: any[]): void;
  (e: 'page-changed', page: number, pageSize: number): void;
  (e: 'column-reordered', order: string[]): void;
  (e: 'column-resized', column: ColumnDefinition, width: number): void;
  (e: 'column-visibility-changed', visibleColumns: string[]): void;
  (e: 'data-error', error: Error): void;
  (e: 'row-expansion-changed', payload: { row: any; rowKey: any; expanded: boolean; expandedRows: any[] }): void;
  (e: 'key-down', payload: any): void;
  (e: 'key-up', payload: any): void;
}>();

// ===== REFS =====
const gridRef = ref<HTMLDivElement>();
const containerRef = ref<HTMLDivElement>();
const scrollableRef = ref<HTMLDivElement>();
const scrollSentinelRef = ref<HTMLDivElement>();
const bodyRef = ref<InstanceType<typeof TSDataGridBody>>();
const filterPosition = ref({ x: 0, y: 0 });
const activeFilterColumn = ref<string | null>(null);
const isInitializing = ref(true);
const isApplyingColumnChanges = ref(false);
const slots = useSlots();

// ===== LOADING STATE =====
const {
  isLoading,
  loadingText,
  loadingProgress,
  loadingOptions,
  hasProgress,
  startLoading,
  stopLoading,
  updateProgress,
  updateText,
  withLoading
} = useLoadingState();

// ===== EVENT WRAPPER =====
const emitWrapper = (event: string, payload?: any) => {
  const eventMap: Record<string, () => void> = {
    'sort-changed': () => {
      const descriptors = payload?.sort || payload || []
      emit('sort-changed', descriptors)
    },
    'filter-changed': () => emit('filter-changed', payload?.filters || [], payload?.activeFilters),
    'group-changed': () => {
      const groups = payload?.groups || [];
      emit('group-changed', groups);
    },
    'page-changed': () => emit('page-changed', payload?.page, payload?.pageSize),
    'page-size-changed': () => {
      emit('page-changed', currentPage.value, payload?.pageSize);
    },
    'selection-changed': () => emit('selection-changed', payload),
    'edit-saved': () => emit('edit-saved', payload?.change, payload?.mode),
    'column-resized': () => {
      emit('column-resized', payload.column, payload.width);
    },
    'column-reordered': () => {
      if (!isApplyingColumnChanges.value) {
        emit('column-reordered', payload);
      }
    },
    'column-visibility-changed': () => {
      if (!isApplyingColumnChanges.value) {
        emit('column-visibility-changed', payload);
      }
    },
    'row-expansion-changed': () => emit('row-expansion-changed', payload),
    'data-loading': () => {
      console.log('📊 Data loading...');
    },
    'data-loaded': () => emit('data-loaded', payload),
    'data-error': () => emit('data-error', payload?.error || payload),
    'state-changed': () => {
      if (!isInitializing.value && !isApplyingColumnChanges.value) {
        emit('state-changed', payload?.state || payload);
      }
    },
    'key-down': () => emit('key-down', payload),
    'key-up': () => emit('key-up', payload),
    'state-saved': () => { },
    'state-loaded': () => { },
    'filter-cleared': () => { },
  };

  if (eventMap[event]) {
    eventMap[event]();
  } else {
    console.warn(`Unhandled event: ${event}`, payload);
  }
};

// ===== EFFECTIVE SELECTION MODE =====
const effectiveSelectionMode = computed<SelectionMode>(() => {
  if (!props.allowSelection) {
    return { mode: SelectionModeType.None, checkboxes: false } satisfies SelectionMode;
  }
  return props.selectionMode;
});

// ===== COMPOSABLES (ORDER 1: NO DEPENDENCIES) =====

// Data Source
const { data: localData, total: totalCount, loading, load: loadData, isLocal } = useDataSource(
  props.dataSource,
  () => props.columns
);

// Sorting
const multiSortRef = computed(() => props.multiSort);
const { sortDescriptors, toggleSort, setSort } = useSorting(
  () => props.columns,
  multiSortRef.value,
  emitWrapper
);

// Filtering
const {
  filters,
  activeFilters,
  updateFilter,
  removeFilterByField,
  clearFilters,
  clearFieldFilter,
  getFilter,
  hasFilter
} = useFiltering(
  () => localData.value,
  () => props.columns,
  emitWrapper
);

// Pagination
const {
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  skip,
  take,
  availablePageSizes,
  goToPage,
  changePageSize,
} = usePagination(
  {
    pageSize: props.pageSize,
    pageSizes: props.pageSizes,
    showInfo: props.showPaginationInfo,
    showPageSizes: props.showPageSizes,
  },
  emitWrapper
);

// Grouping
const {
  groupDescriptors,
  expandedGroups,
  addGroup,
  removeGroup,
  clearGroups,
  toggleGroupExpansion,
  groupData,
  hasGrouping,
} = useGrouping(emitWrapper);

// Selection
const {
  selectedKeys,
  toggleSelection,
  selectAll,
  deselectAll,
  isSelected,
  isAllSelected: checkIsAllSelected,
  isSomeSelected: checkIsSomeSelected,
  getSelectedItems,
  select,
  deselect,
  invertSelection,
  selectFiltered,
  selectByKeys,
  deselectByKeys,
  getSelectedKeys,
  setSelectedKeys,
} = useSelection(
  effectiveSelectionMode.value,
  props.keyField,
  emitWrapper
);

// Editing
const {
  isEditing,
  editRowKey,
  editField,
  startEdit,
  cancelEdit,
  saveEdit,
  addRow,
  deleteRow,
  mode: editingMode,
  hasChanges,
  validationErrors,
  editingState,
  changes: editingChanges,
  dirtyRows,
  originalValues,
} = useEditing(
  {
    mode: EditingMode.Cell,
    allowUpdating: props.allowEditing,
    allowAdding: props.allowAdding,
    allowDeleting: props.allowDeleting,
  },
  props.keyField,
  () => props.columns,
  emitWrapper
);

// Column Chooser
const {
  isVisible: isColumnChooserVisible,
  columnVisibility,
  columnOrder,
  visibleColumns: chooserVisibleColumns,
  show: showColumnChooserModal,
  hide: hideColumnChooserModal,
  reorderColumns: chooserReorderColumns,
} = useColumnChooser(() => props.columns, emitWrapper);

// Search
const { searchTerm, results: searchResults } = useSearch(
  () => localData.value,
  () => props.columns,
  {
    enabled: props.showSearch,
    minLength: 1,
    debounce: 300,
    caseSensitive: false,
    mode: SearchMode.Contains
  },
  emitWrapper
);

// Column Resize
const {
  columnWidths,
  resizeState,
  isResizing,
  startResize,
  getColumnWidth,
  setColumnWidth,
  autoSizeColumn,
  resetWidths,
} = useColumnResize(
  () => props.columns,
  50,
  1000,
  emitWrapper
);

// Column Reorder
const {
  columnOrder: reorderColumnOrder,
  orderedColumns,
  dragState: reorderDragState,
  startDrag: startColumnDrag,
  onDragOver: onColumnDragOver,
  onDrop: onColumnDrop,
  endDrag: endColumnDrag,
  moveColumn,
  setColumnOrder: setReorderColumnOrder,
} = useColumnReorder(
  () => props.columns,
  emitWrapper
);

// Row Expansion
const {
  expandedRows,
  expandedCount,
  hasExpandedRows,
  isExpanded,
  toggleExpansion,
  expand,
  collapse,
  expandAll,
  collapseAll,
} = useRowExpansion(
  props.keyField,
  {
    allowMultiple: props.allowMultipleExpansion,
    expandOnRowClick: props.expandOnRowClick,
    autoCollapse: props.autoCollapseExpanded,
  },
  emitWrapper
);

// Export
const { exportData } = useExport(emitWrapper);

// Undo/Redo
const {
  canUndo,
  canRedo,
  saveState: saveUndoState,
  undo: performUndo,
  redo: performRedo,
  clearHistory: clearUndoHistory,
} = useUndo(50, emitWrapper);

// Clipboard
const {
  paste,
  cut,
  copySelection,
  copyCell,
  isClipboardSupported,
} = useClipboard(
  () => props.columns,
  props.keyField,
  emitWrapper
);

// Context Menu
const {
  menuState,
  isVisible: contextMenuVisible,
  show: showContextMenu,
  hide: hideContextMenu,
  getDefaultItems,
} = useContextMenu(emitWrapper);

// ===== COMPUTED PROPERTIES (ORDER 2: BASIC DEPENDENCIES) =====

// Visible Columns
const visibleColumns = computed(() => {
  return chooserVisibleColumns.value.map(col => ({
    ...col,
    width: columnWidths.value[col.field] || col.width || 150
  }));
});

// Processed Data
const processedData = computed(() => {
  let result = [...localData.value];

  if (isLocal.value) {
    // Search
    if (searchTerm.value && searchTerm.value.trim().length >= 1) {
      if (searchResults.value.length > 0) {
        const searchedIds = new Set(searchResults.value.map(r => r.row[props.keyField]));
        result = result.filter(row => searchedIds.has(row[props.keyField]));
      } else {
        result = [];
      }
    }

    // Filter
    if (filters.value.length > 0) {
      filters.value.forEach(filter => {
        result = result.filter(row => evaluateFilter(row, filter));
      });
    }

    // Sort
    if (sortDescriptors.value.length > 0) {
      result = applySorting(result, sortDescriptors.value);
    }
  }

  return result;
});

// Summary
const {
  summaryValues,
  pageSummaryValues,
  calculateGroupSummaries
} = useSummary(
  () => processedData.value,
  () => props.columns,
  () => props.summary,
  emitWrapper
);

// Grouped Data
const groupedData = computed(() => {
  if (!hasGrouping.value) return [];
  return groupData(processedData.value);
});

// ✅ IS GROUPED (MUST COME BEFORE displayedRows)
const isGrouped = computed(() => hasGrouping.value);

// Group Summaries Map
const groupSummariesMap = computed(() => {
  if (!isGrouped.value || !props.showGroupSummary) {
    return new Map();
  }

  const map = new Map<string, Record<string, any>>();

  groupedData.value.forEach((group: any) => {
    if (group.isGroup && group.items) {
      const summaries = calculateGroupSummaries(group.items, group.field);
      map.set(group.key, summaries);
    }
  });

  return map;
});

// ===== INFINITE SCROLL (ORDER 3: BEFORE displayedRows) =====
let infiniteScrollComposable: ReturnType<typeof useInfiniteScroll> | null = null;

if (props.allowInfiniteScroll && !props.allowPaging) {
  const loadMoreData = async (page: number, pageSize: number): Promise<any> => {
    if (!isLocal.value) {
      const result = await loadData({
        sort: sortDescriptors.value,
        filter: filters.value,
        skip: (page - 1) * pageSize,
        take: pageSize,
        group: groupDescriptors.value,
        search: searchTerm.value,
      });

      return {
        data: result.data || [],
        hasMore: (result.data || []).length === pageSize,
        totalCount: result.totalCount || totalCount.value,
      };
    }

    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const chunk = processedData.value.slice(start, end);

    return {
      data: chunk,
      hasMore: end < processedData.value.length,
      totalCount: processedData.value.length,
    };
  };

  infiniteScrollComposable = useInfiniteScroll(
    loadMoreData,
    {
      pageSize: props.infiniteScrollPageSize,
      threshold: props.infiniteScrollThreshold,
      enabled: props.allowInfiniteScroll,
      initialLoad: true,
      useIntersectionObserver: true,
    },
    emitWrapper
  );
}

const infiniteScrollData = infiniteScrollComposable?.data || ref([]);
const infiniteScrollLoading = infiniteScrollComposable?.isLoading || ref(false);
const infiniteScrollHasMore = infiniteScrollComposable?.hasMore || ref(false);
const infiniteScrollReset = infiniteScrollComposable?.reset || (() => { });
const infiniteScrollReload = infiniteScrollComposable?.reload || (() => { });
const infiniteScrollAttachContainer = infiniteScrollComposable?.attachScrollContainer || (() => { });
const infiniteScrollAttachSentinel = infiniteScrollComposable?.attachSentinel || (() => { });

// ✅ CRITICAL: Ensure displayedRows uses correct source
const displayedRows = computed(() => {
  console.log('🔄 Computing displayedRows:', {
    infiniteScroll: props.allowInfiniteScroll,
    paging: props.allowPaging,
    grouped: isGrouped.value,
    virtualization: props.enableVirtualization,
    infiniteScrollDataLength: infiniteScrollData.value.length,
    processedDataLength: processedData.value.length,
    groupedDataLength: groupedData.value.length
  })

  // ✅ Priority 1: Infinite scroll takes precedence
  if (props.allowInfiniteScroll && !props.allowPaging) {
    const data = isGrouped.value
      ? groupData(infiniteScrollData.value)
      : infiniteScrollData.value

    console.log('📊 Using infinite scroll data:', data.length)
    return data
  }

  // ✅ Priority 2: Grouped data
  if (isGrouped.value) {
    const grouped = groupedData.value
    console.log('📊 Using grouped data:', grouped.length)

    // Local pagination (if enabled)
    if (isLocal.value && props.allowPaging && props.showPagination) {
      const start = (currentPage.value - 1) * pageSize.value
      const end = start + pageSize.value
      const paginated = grouped.slice(start, end)
      console.log('📄 Paginated grouped:', {
        start,
        end,
        count: paginated.length
      })
      return paginated
    }

    return grouped
  }

  // ✅ Priority 3: Server-side data
  if (!isLocal.value) {
    console.log('🌐 Using server data:', processedData.value.length)
    return processedData.value
  }

  // ✅ Priority 4: Local data with pagination
  if (props.allowPaging && props.showPagination) {
    const start = (currentPage.value - 1) * pageSize.value
    const end = start + pageSize.value
    const paginated = processedData.value.slice(start, end)
    console.log('📄 Paginated local:', {
      start,
      end,
      count: paginated.length
    })
    return paginated
  }

  // ✅ Priority 5: All local data
  console.log('📄 Using all processed data:', processedData.value.length)
  return processedData.value
})

// Around line 580 - Virtualization initialization
let virtualizationComposable: ReturnType<typeof useVirtualization> | null = null;

if (props.enableVirtualization) {
  virtualizationComposable = useVirtualization(
    () => displayedRows.value, // Make sure this is a function
    {
      mode: VirtualizationMode.Vertical,
      rowHeight: props.virtualRowHeight || props.rowHeight || 40,
      rowBuffer: props.virtualRowBuffer || 5,
      columnBuffer: props.virtualColumnBuffer || 3,
      enableRowVirtualization: true,
      enableColumnVirtualization: false,
      threshold: props.virtualScrollThreshold || 50,
      scrollMode: ScrollMode.Virtual,
      preloadPages: 1,
    }
  );
}

// ✅ CORRECTED - Only use available properties
const virtualViewport = virtualizationComposable?.viewport || computed(() => null);
const isVirtualizationInitialized = virtualizationComposable?.isInitialized || ref(false);

// Simplified virtualizedRows computed - uses only viewport API
const virtualizedRows = computed(() => {
  // If not virtualized, return all rows
  if (!props.enableVirtualization) {
    return displayedRows.value
  }

  // If not initialized yet, return displayedRows
  if (!isVirtualizationInitialized.value) {
    return displayedRows.value
  }

  // Use viewport visible rows (the correct property)
  if (virtualViewport.value?.visibleRows) {
    return virtualViewport.value.visibleRows
  }

  // Final fallback
  return displayedRows.value
})

// ✅ KEYBOARD NAVIGATION (ORDER 6: DEPENDS ON visibleColumns, displayedRows)
const {
  focusedPosition,
  focusVisible,
  setFocus,
  moveFocus,
  moveToFirstCell,
  attachGridElement,
  getFocusedCellValue,
  moveToLastCell,
  clearFocus
} = useKeyboardNavigation(
  () => visibleColumns.value,
  () => displayedRows.value,
  props.keyField,
  props.keyboardNavigationConfig,
  emitWrapper
);

// ===== OTHER COMPUTED PROPERTIES =====

const canGroup = computed(() => {
  return props.allowGrouping && isLocal.value;
});

const shouldShowToolbar = computed(() => {
  if (!props.showToolbar) return false;

  return (
    props.allowRefresh ||
    props.allowExport ||
    props.allowAdding ||
    (props.allowDeleting && props.allowSelection) ||
    props.showSearch ||
    props.showColumnChooser ||
    props.toolbarActions.length > 0 ||
    !!slots['toolbar-prepend'] ||
    !!slots['toolbar-center'] ||
    !!slots['toolbar-append']
  );
});

const selectedCount = computed(() => selectedKeys.value.size);

const gridClasses = computed(() => [
  `tsdatagrid-theme-${props.theme}`,
  {
    'ts-datagrid--loading': isLoading.value,
    'ts-datagrid--has-toolbar': props.showToolbar,
    'ts-datagrid--has-group-panel': props.allowGrouping && props.showGroupPanel,
    'ts-datagrid--grouped': isGrouped.value,
    'ts-datagrid--paginated': props.allowPaging && props.showPagination,
    'ts-datagrid--virtualized': props.enableVirtualization,
    'ts-datagrid--keyboard-nav': props.enableKeyboardNavigation,
    'ts-datagrid--has-keyboard-focus': props.enableKeyboardNavigation && focusVisible.value, // ✅ ADD THIS
  },
]);

const groupedColumnFields = computed(() => groupDescriptors.value.map(g => g.field));

const sortDirectionsMap = computed(() => {
  const map: Record<string, any> = {};
  sortDescriptors.value.forEach(s => {
    map[s.field] = s.direction;
  });
  return map;
});

const scrollableStyle = computed(() => {
  const styles: any = {};

  if (props.maxHeight && props.maxHeight !== 'auto') {
    styles.maxHeight = typeof props.maxHeight === 'number'
      ? `${props.maxHeight}px`
      : props.maxHeight;
  }

  if (props.enableVirtualization) {
    styles.overflowY = 'auto';
    styles.overflowX = 'auto';

    if (!styles.maxHeight) {
      styles.maxHeight = '600px';
      console.warn('⚠️ Virtualization enabled but no maxHeight set. Using default 600px.');
    }
  }

  return styles;
});

const scrollContentStyle = computed(() => {
  const styles: any = {
    position: 'relative' as const
  };

  if (props.enableVirtualization && virtualViewport.value) {
    styles.minHeight = `${virtualViewport.value.totalHeight}px`;
  } else {
    const minHeight = displayedRows.value.length * props.rowHeight;
    styles.minHeight = `${minHeight}px`;
  }

  return styles;
});

const hasSummaryData = computed(() => {
  return summaryValues.value && Object.keys(summaryValues.value).length > 0;
});

const hasPageSummaryData = computed(() => {
  return props.summary.some(s => s.scope === 'page') &&
    Object.keys(pageSummaryValues.value).length > 0;
});

const hasMultipleSummaryRows = computed(() => {
  return hasSummaryData.value && hasPageSummaryData.value;
});

const isAllSelected = computed(() => {
  return processedData.value.length > 0 && checkIsAllSelected(processedData.value);
});

const isSomeSelected = computed(() => {
  return checkIsSomeSelected(processedData.value) && !isAllSelected.value;
});

const selectionStateObj = computed(() => ({
  selectedKeys: props.allowSelection ? selectedKeys.value : new Set(),
  selectedIndices: props.allowSelection ? new Set(
    processedData.value
      .map((row, index) => selectedKeys.value.has(row[props.keyField]) ? index : -1)
      .filter(i => i !== -1)
  ) : new Set(),
  selectedRows: props.allowSelection ? getSelectedItems(processedData.value) : [],
  mode: effectiveSelectionMode.value.mode,
  isSelected: (row: any) => props.allowSelection && isSelected(row),
}));

const editingStateObj = computed<EditingState>(() => {
  if (!props.allowEditing) {
    return {
      editRowKey: null,
      editField: null,
      isEditing: false,
      mode: EditingMode.Cell,
      editingCell: null,
      changes: [],
      dirtyRows: new Set(),
      originalValues: new Map(),
      validationErrors: new Map(),
      isRowEditing: () => false,
      isCellEditing: () => false,
      isRowDirty: () => false,
      hasChanges: () => false,
    };
  }

  return editingState.value;
});

const expansionStateObj = computed(() => ({
  expandedRows: expandedRows.value,
  expandedCount: expandedCount.value,
  hasExpandedRows: hasExpandedRows.value,
  isExpanded: (row: any) => isExpanded(row),
  allowMultiple: props.allowMultipleExpansion,
}));

// ===== HELPER METHODS =====

const evaluateFilter = (row: any, filter: FilterCondition): boolean => {
  const value = row[filter.field];

  if (filter.operator === 'in' && Array.isArray(filter.value)) {
    if (value === null || value === undefined || value === '') {
      return filter.value.includes(null) || filter.value.includes('');
    }
    return filter.value.includes(value);
  }

  return true;
};

const applySorting = (data: any[], sorts: SortDescriptor[]): any[] => {
  return [...data].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      if (aVal == null && bVal == null) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }

      if (comparison !== 0) {
        return sort.direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
};

const getCellStyle = (column: ColumnDefinition) => {
  return {
    width: column.width ? `${column.width}px` : undefined,
    minWidth: column.minWidth ? `${column.minWidth}px` : undefined,
  };
};

const getSummaryValue = (field: string): any => {
  const config = props.summary.find(s => s.field === field && (s.scope === 'all' || !s.scope));
  if (!config) return null;

  const key = `${field}_${config.type}`;
  return summaryValues.value[key];
};

const getPageSummaryValue = (field: string): any => {
  const config = props.summary.find(s => s.field === field && s.scope === 'page');
  if (!config) return null;

  const key = `${field}_${config.type}`;
  return pageSummaryValues.value[key];
};

const getAllSummaryValues = (field: string): Record<string, any> => {
  return props.summary
    .filter(s => s.field === field)
    .reduce((acc, config) => {
      const key = `${field}_${config.type}`;
      acc[config.type] = summaryValues.value[key];
      return acc;
    }, {} as Record<string, any>);
};

const getSummaryConfig = (field: string): SummaryConfig | undefined => {
  return props.summary.find(s => s.field === field && (s.scope === 'all' || !s.scope));
};

const getPageSummaryConfig = (field: string): SummaryConfig | undefined => {
  return props.summary.find(s => s.field === field && s.scope === 'page');
};

const getSummaryCellClass = (column: ColumnDefinition): string => {
  const config = props.summary.find(s => s.field === column.field);
  return config?.cssClass || '';
};

const formatSummaryValue = (field: string, value: any, scope: 'all' | 'page'): string => {
  if (value == null) return '-';

  const config = props.summary.find(s =>
    s.field === field &&
    (scope === 'page' ? s.scope === 'page' : (s.scope === 'all' || !s.scope))
  );

  if (config?.formatter) {
    return String(config.formatter(value, config.type));
  }

  const column = props.columns.find(c => c.field === field);

  if (column?.type === 'number') {
    const precision = config?.precision ?? 0;
    return typeof value === 'number' ? value.toFixed(precision) : String(value);
  }

  if (column?.type === 'date') {
    return value instanceof Date ? value.toLocaleDateString() : String(value);
  }

  return String(value);
};

// ===== STATE PERSISTENCE =====
let persistenceState: ReturnType<typeof useStatePersistence> | null = null;

if (props.stateKey) {
  persistenceState = useStatePersistence(
    props.stateKey,
    () => ({
      columns: props.columns,
      visibleColumns: visibleColumns.value,
      columnOrder: columnOrder.value,
      columnWidths: columnWidths.value,
      columnVisibility: columnVisibility.value,
      data: localData.value,
      filteredData: processedData.value,
      totalCount: totalItems.value,
      filters: filters.value,
      activeFilters: activeFilters.value,
      sorting: sortDescriptors.value,
      grouping: groupDescriptors.value,
      expandedGroups: new Set(
        Array.from(expandedGroups.value).map(String)
      ) as Set<string>,
      groupedData: isGrouped.value ? groupedData.value : undefined,
      pagination: {
        page: currentPage.value,
        pageSize: pageSize.value,
        totalPages: totalPages.value,
        total: totalItems.value,
      },
      selection: {
        selectedKeys: selectedKeys.value,
        selectedIndices: new Set(
          processedData.value
            .map((row, index) => selectedKeys.value.has(row[props.keyField]) ? index : -1)
            .filter(i => i !== -1)
        ),
        selectedRows: getSelectedItems(localData.value),
        mode: effectiveSelectionMode.value.mode,
      },
      editing: props.allowEditing ? editingState.value : undefined,
      search: searchTerm.value ? {
        term: searchTerm.value,
        results: searchResults.value,
        totalMatches: searchResults.value.length,
        isSearching: false,
        highlightedRows: new Set(),
      } : undefined,
      summary: props.showSummary ? {
        configs: props.summary,
        results: [],
      } : undefined,
      loading: isLoading.value,
      error: undefined,
      columnChooserVisible: isColumnChooserVisible.value,
      scrollPosition: { x: 0, y: 0 },
      isDirty: hasChanges.value,
      hasChanges: hasChanges.value,
      validationErrors: validationErrors.value,
      timestamp: new Date(),
      version: 1,
    }),
    (state) => {
      if (state.sorting) {
        state.sorting.forEach((s: SortDescriptor) => {
          setSort(s.field, s.direction);
        });
      }

      if (state.pagination) {
        currentPage.value = state.pagination.page;
        pageSize.value = state.pagination.pageSize;

        if ('total' in state.pagination) {
          totalItems.value = state.pagination.total;
        }
      }

      if (state.columnVisibility) {
        Object.assign(columnVisibility.value, state.columnVisibility);
      }

      if (state.columnWidths) {
        Object.assign(columnWidths.value, state.columnWidths);
      }

      if (state.columnOrder) {
        columnOrder.value = [...state.columnOrder];
        setReorderColumnOrder(state.columnOrder);
      }

      if (state.selection?.selectedKeys) {
        selectedKeys.value.clear();
        const keys = state.selection.selectedKeys instanceof Set
          ? Array.from(state.selection.selectedKeys)
          : state.selection.selectedKeys;

        keys.forEach((key: any) => {
          selectedKeys.value.add(key);
        });
      }

      if (state.search?.term) {
        searchTerm.value = state.search.term;
      }

      if (state.expandedGroups) {
        const groups = state.expandedGroups instanceof Set
          ? new Set(Array.from(state.expandedGroups).map(String))
          : new Set((state.expandedGroups as any[]).map(String));

        expandedGroups.value = groups;
      }

      if (state.grouping && state.grouping.length > 0) {
        clearGroups();
        state.grouping.forEach(g => addGroup(g.field));
      }
    },
    emitWrapper,
    {
      debounceTime: 500,
      storage: 'local',
      version: '1.0',
      compress: false,
      includeData: false,
    }
  );
}

// ===== EVENT HANDLERS =====

const handleSort = (field: string) => {
  toggleSort(field);
  if (!isLocal.value) {
    loadDataAsync();
  }
};

const handleGroupSort = (field: string) => {
  toggleSort(field);
  emit('sort-changed', sortDescriptors.value);
};

const handleFilterOpen = (column: ColumnDefinition, position: { x: number; y: number }) => {
  filterPosition.value = position;
  activeFilterColumn.value = column.field;
};

const handleActiveFilterRemove = (filter: ActiveFilter) => {
  removeFilterByField(filter.field);

  if (currentPage.value !== 1) {
    goToPage(1);
  }

  if (!isLocal.value) {
    nextTick(() => {
      loadDataAsync();
    });
  }
};

const handleActiveFiltersClearAll = () => {
  clearFilters();

  if (currentPage.value !== 1) {
    goToPage(1);
  }

  if (!isLocal.value) {
    nextTick(() => {
      loadDataAsync();
    });
  }
};

const handleFilterApply = (filter: FilterCondition | null) => {
  if (!activeFilterColumn.value) return;

  if (filter) {
    updateFilter(activeFilterColumn.value, filter);
  } else {
    clearFieldFilter(activeFilterColumn.value);
  }

  activeFilterColumn.value = null;
  emit('filter-changed', filters.value, activeFilters.value);

  if (currentPage.value !== 1) {
    goToPage(1);
  }

  if (!isLocal.value) {
    nextTick(() => {
      loadDataAsync();
    });
  }
};

const handleFilterClear = () => {
  if (!activeFilterColumn.value) return;

  clearFieldFilter(activeFilterColumn.value);
  activeFilterColumn.value = null;
  emit('filter-changed', filters.value, activeFilters.value);

  if (currentPage.value !== 1) {
    goToPage(1);
  }

  if (!isLocal.value) {
    nextTick(() => {
      loadDataAsync();
    });
  }
};

const handleFilterClose = () => {
  activeFilterColumn.value = null;
};

const handlePageChange = (page: number) => {
  const changed = goToPage(page);

  if (changed) {
    emit('page-changed', currentPage.value, pageSize.value);

    if (!isLocal.value) {
      nextTick(() => {
        loadDataAsync();
      });
    }
  }
};

const handlePageSizeChange = (size: number) => {
  const changed = changePageSize(size);

  if (changed) {
    emit('page-changed', currentPage.value, pageSize.value);

    if (!isLocal.value) {
      nextTick(() => {
        loadDataAsync();
      });
    }
  }
};

const handleGroupingChange = (fields: string[]) => {
  console.log('🔷 Group panel changed:', fields);
  clearGroups();
  fields.forEach(field => addGroup(field));
};

const handleGroupRemove = (field: string) => {
  console.log('🗑️ Removing group:', field);
  removeGroup(field);
};

const handleGroupClearAll = () => {
  console.log('🗑️ Clearing all groups');
  clearGroups();
};

const handleGroupReorder = (fromIndex: number, toIndex: number) => {
  console.log('🔄 Reordering groups:', fromIndex, '→', toIndex);
  const descriptors = [...groupDescriptors.value];
  const [moved] = descriptors.splice(fromIndex, 1);
  descriptors.splice(toIndex, 0, moved);
  clearGroups();
  descriptors.forEach(d => addGroup(d.field as string));
};

const handleExpandGroup = (groupKey: string) => {
  toggleGroupExpansion(groupKey);
};

const handleRowClick = (row: any, index: number) => {
  // ✅ DO NOT set focus on mouse click - only keyboard navigation should set focus
  emit('row-click', row);
};

const handleRowContextMenu = (event: MouseEvent, row: any, index: number) => {
  event.preventDefault();

  const items = getDefaultItems(row, undefined);
  showContextMenu(event, row, undefined, items);
};

const handleRowDblClick = (row: any, index: number) => {
  emit('row-dblclick', row);
};

const handleCellClick = (row: any, column: ColumnDefinition) => {
  // ✅ DO NOT set focus on mouse click - only keyboard navigation should set focus
  emit('cell-click', row, column);
};

const handleCellEdit = (rowKey: any, field: string) => {
  if (!props.allowEditing) return;
  console.log('🔧 Starting edit:', rowKey, field);
  startEdit(rowKey, field);
};

const handleCellSave = async (rowKey: any, field: string, value: any) => {
  console.log('💾 Saving cell:', rowKey, field, value);

  const row = localData.value.find((r: any) => r[props.keyField] === rowKey);
  if (!row) {
    console.warn('Row not found:', rowKey);
    return;
  }

  const oldValue = row[field];
  const updatedRow = { ...row, [field]: value };
  const success = await saveEdit(updatedRow);

  if (success) {
    Object.assign(row, updatedRow);

    emit('edit-saved', {
      type: 'update',
      key: rowKey,
      field: field,
      data: { [field]: value },
      oldValue: oldValue,
      newValue: value,
      row: updatedRow
    }, editingMode.value);

    console.log('✅ Cell saved successfully');

    if (props.keyboardNavigationConfig.enterKeyDirection) {
      if (props.keyboardNavigationConfig.enterKeyDirection === 'down') {
        moveFocus('down');
      } else if (props.keyboardNavigationConfig.enterKeyDirection === 'right') {
        moveFocus('right');
      }
    }
  } else {
    console.warn('❌ Cell save failed');
  }
};

const handleCellCancel = () => {
  cancelEdit();

  if (focusedPosition.value) {
    setFocus(focusedPosition.value.rowKey, focusedPosition.value.columnField);
  }
};

const handleRowSelect = (row: any, selected: boolean) => {
  if (!props.allowSelection) return;
  toggleSelection(row);
  emit('selection-changed', getSelectedItems(localData.value));
};

const handleSelectAll = (selected: boolean) => {
  if (!props.allowSelection) return;
  if (selected) {
    selectAll(processedData.value);
  } else {
    deselectAll();
  }
  emit('selection-changed', getSelectedItems(localData.value));
};

const handleColumnReorder = (payload: { fromIndex: number; toIndex: number }) => {
  chooserReorderColumns(payload.fromIndex, payload.toIndex);
};

const handleColumnResize = (payload: { field: string; width: number }) => {
  const column = props.columns.find(c => c.field === payload.field);
  if (column) {
    // Emit is already done by composable
  }
};

const handleColumnAutoSize = (field: string) => {
  autoSizeColumn(field, localData.value);
};

const handleColumnChooserOpen = () => {
  showColumnChooserModal();
};

const handleColumnChooserClose = () => {
  hideColumnChooserModal();
};

const handleColumnChooserApply = (changes: { visibility: Record<string, boolean>; order: string[] }) => {
  if (isApplyingColumnChanges.value) {
    console.warn('⚠️ Already applying column changes');
    return;
  }

  isApplyingColumnChanges.value = true;
  console.log('✅ Applying column chooser changes:', changes);

  try {
    Object.keys(changes.visibility).forEach(field => {
      columnVisibility.value[field] = changes.visibility[field];
    });

    columnOrder.value = [...changes.order];
    setReorderColumnOrder(changes.order);

    const visibleFields = Object.keys(changes.visibility).filter(f => changes.visibility[f]);
    emit('column-visibility-changed', visibleFields);
    emit('column-reordered', changes.order);
  } finally {
    isApplyingColumnChanges.value = false;
  }

  hideColumnChooserModal();
};

const handleExport = (format: string) => {
  const config: ExportConfig = {
    format: format as ExportFormat,
    fileName: `export-${Date.now()}`,
  };
  exportData(processedData.value, visibleColumns.value, config);
};

const handleRefresh = async () => {
  await withLoading(
    () => loadDataAsync(),
    { text: 'Refreshing data...', spinner: true }
  );
};

const handleAddRow = async () => {
  if (!props.allowAdding) return;

  const newRow: any = {
    [props.keyField]: Date.now(),
  };

  props.columns.forEach(col => {
    if (col.field !== props.keyField) {
      if (col.type === 'boolean') {
        newRow[col.field] = false;
      } else if (col.type === 'number') {
        newRow[col.field] = 0;
      } else if (col.type === 'date' || col.type === 'datetime') {
        newRow[col.field] = new Date().toISOString().split('T')[0];
      } else {
        newRow[col.field] = '';
      }
    }
  });

  const success = await addRow(newRow);

  if (success) {
    localData.value.unshift(newRow);

    emit('edit-saved', {
      type: 'insert',
      key: newRow[props.keyField],
      data: newRow,
      row: newRow
    }, editingMode.value);

    await nextTick();
    console.log('✅ New row added:', newRow);
  }
};

const handleDeleteRows = async () => {
  if (!props.allowDeleting || !props.allowSelection) return;
  const selected = getSelectedItems(localData.value);
  if (selected.length === 0) return;

  if (!confirm(`Delete ${selected.length} selected row(s)?`)) {
    return;
  }

  for (const row of selected as any[]) {
    const rowKey = row[props.keyField];
    const index = localData.value.findIndex((r: any) => r[props.keyField] === rowKey);

    const success = await deleteRow(rowKey, row, index);

    if (success) {
      if (index !== -1) {
        localData.value.splice(index, 1);
      }

      emit('edit-saved', {
        type: 'remove',
        key: rowKey,
        data: {},
        row: row
      }, editingMode.value);
    }
  }

  deselectAll();
  console.log(`✅ Deleted ${selected.length} row(s)`);
};

const handleSearch = (query: string) => {
  const trimmedQuery = query.trim();
  searchTerm.value = trimmedQuery;

  if (currentPage.value !== 1) {
    goToPage(1);
  }

  if (!isLocal.value) {
    loadDataAsync();
  }
};

const handleToggleExpansion = (row: any, index: number) => {
  if (!props.allowRowExpansion) return;
  toggleExpansion(row, index);
  emit('row-expansion-changed', {
    row,
    rowKey: row[props.keyField],
    expanded: isExpanded(row),
    expandedRows: Array.from(expandedRows.value)
  });
};

const handleStartResize = (field: string, event: MouseEvent, currentWidth: number) => {
  startResize(field, event, currentWidth);
};

const handleStartColumnDrag = (field: string, event: DragEvent) => {
  startColumnDrag(field, event);
};

const handleColumnDragOver = (field: string, event: DragEvent) => {
  onColumnDragOver(field, event);
};

const handleColumnDrop = (field: string, event: DragEvent) => {
  onColumnDrop(field, event);
};

const handleEndColumnDrag = () => {
  endColumnDrag();
};

const handleKeyDown = async (event: KeyboardEvent) => {
  const isCtrlOrCmd = event.ctrlKey || event.metaKey;

  if (isCtrlOrCmd && event.key === 'c' && !event.shiftKey) {
    if (selectedCount.value > 0) {
      event.preventDefault();
      const selectedRows = getSelectedItems(localData.value);
      await copySelection(selectedRows);
      console.log('✅ Copied', selectedCount.value, 'rows');
    } else if (focusedPosition.value) {
      const cellValue = getFocusedCellValue();
      await copyCell(cellValue);
      console.log('✅ Copied cell value:', cellValue);
    }
  }
  else if (isCtrlOrCmd && event.key === 'x') {
    if (selectedCount.value > 0) {
      event.preventDefault();
      const selectedRows = getSelectedItems(localData.value);
      await cut(selectedRows);
      console.log('✅ Cut', selectedCount.value, 'rows');
    }
  }
  else if (isCtrlOrCmd && event.key === 'v') {
    event.preventDefault();
    const pastedRows = await paste();
    if (pastedRows && pastedRows.length > 0) {
      console.log('✅ Pasted', pastedRows.length, 'rows');
      if (props.allowAdding) {
        pastedRows.forEach(row => addRow(row));
      }
    }
  }
  else if (isCtrlOrCmd && event.key === 'z' && !event.shiftKey) {
    if (canUndo.value) {
      event.preventDefault();
      handleUndo();
    }
  }
  else if (
    (isCtrlOrCmd && event.key === 'y') ||
    (isCtrlOrCmd && event.shiftKey && event.key === 'z')
  ) {
    if (canRedo.value) {
      event.preventDefault();
      handleRedo();
    }
  }
  else if (event.key === 'Delete' && !isEditing.value) {
    if (props.allowDeleting && selectedCount.value > 0) {
      event.preventDefault();
      handleDeleteRows();
    }
  }
};

const handleUndo = () => {
  const state = performUndo();
  if (state) {
    localData.value = [...state.data];
    console.log('↩️ Undo:', state.description);
  }
};

const handleRedo = () => {
  const state = performRedo();
  if (state) {
    localData.value = [...state.data];
    console.log('↪️ Redo:', state.description);
  }
};

const handleCustomAction = (action: any) => {
  emit('custom-action', action);
};

const handleSentinelReady = (sentinelElement: HTMLElement) => {
  console.log('🎯 Sentinel ready, attaching to infinite scroll', sentinelElement);

  if (props.allowInfiniteScroll && infiniteScrollAttachSentinel) {
    nextTick(() => {
      infiniteScrollAttachSentinel(sentinelElement);
    });
  }
};

// ===== DATA LOADING =====

const loadDataAsync = async () => {
  try {
    startLoading({
      text: 'Loading data...',
      overlay: true,
      spinner: true,
      progress: 0
    });

    console.log('📊 loadDataAsync called:', {
      skip: skip.value,
      take: take.value,
      currentPage: currentPage.value,
      pageSize: pageSize.value,
      isLocal: isLocal.value,
      currentDataLength: localData.value.length,
    });

    const loadOptions = isLocal.value
      ? {
        sort: sortDescriptors.value,
        filter: filters.value,
        group: groupDescriptors.value,
        search: searchTerm.value,
      }
      : {
        sort: sortDescriptors.value,
        filter: filters.value,
        skip: skip.value,
        take: take.value,
        group: groupDescriptors.value,
        search: searchTerm.value,
      };

    console.log('📊 Calling loadData with options:', loadOptions);
    const result = await loadData(loadOptions);

    console.log('📊 loadData returned:', {
      dataLength: result.data?.length ?? 0,
      totalCount: result.totalCount,
      localDataLength: localData.value.length,
    });

    if (!isLocal.value) {
      totalItems.value = totalCount.value;

      if (result && (result as any).actualPageSize !== undefined) {
        const actualPageSize = (result as any).actualPageSize;
        if (actualPageSize < take.value && actualPageSize > 0) {
          console.warn(`⚠️ Server returned ${actualPageSize} records, but requested ${take.value}`);

          if (pageSize.value !== actualPageSize) {
            console.log(`📊 Auto-adjusting page size to server limit: ${actualPageSize}`);
            changePageSize(actualPageSize);
          }
        }
      }
    } else {
      console.log(`📊 Local mode: loaded ${localData.value.length} records into localData`);
    }

    emit('data-loaded', localData.value);

  } catch (error) {
    console.error('❌ Error loading data:', error);
    emit('data-error', error as Error);
  } finally {
    stopLoading();
  }
};

// ===== LIFECYCLE =====

onMounted(async () => {
  isInitializing.value = true;

  try {
    // Keyboard navigation
    if (props.enableKeyboardNavigation && gridRef.value) {
      attachGridElement(gridRef.value);
      gridRef.value.addEventListener('keydown', handleKeyDown);
    }

    // Attach scroll container for infinite scroll
    if (props.allowInfiniteScroll && infiniteScrollAttachContainer) {
      nextTick(() => {
        if (scrollableRef.value) {
          console.log('📦 Attaching infinite scroll container', scrollableRef.value);
          infiniteScrollAttachContainer(scrollableRef.value);
        }
      });
    }

    // Column order
    const initialOrder = props.columns.map(c => c.field);
    columnOrder.value = initialOrder;
    setReorderColumnOrder(initialOrder);

    // Column visibility
    props.columns.forEach(col => {
      if (!(col.field in columnVisibility.value)) {
        columnVisibility.value[col.field] = col.visible !== false;
      }
    });

    // Load persisted state
    if (persistenceState) {
      const savedState = persistenceState.loadState();
      if (savedState) {
        if (savedState.sorting) {
          savedState.sorting.forEach((s: SortDescriptor) => {
            setSort(s.field, s.direction);
          });
        }

        if (savedState.pagination) {
          currentPage.value = savedState.pagination.page;
          pageSize.value = savedState.pagination.pageSize;
        }

        if (savedState.columnVisibility) {
          Object.assign(columnVisibility.value, savedState.columnVisibility);
        }

        if (savedState.columnOrder) {
          columnOrder.value = [...savedState.columnOrder];
          setReorderColumnOrder(savedState.columnOrder);
        }
      }
    }

    // Column widths
    props.columns.forEach(col => {
      if (col.width) {
        columnWidths.value[col.field] = typeof col.width === 'number'
          ? col.width
          : parseInt(col.width as string);
      }
    });

    // Infinite scroll
    if (props.allowInfiniteScroll && infiniteScrollAttachContainer) {
      nextTick(() => {
        if (scrollableRef.value) {
          infiniteScrollAttachContainer(scrollableRef.value);
        }
      });
    }

    // Load data
    await loadDataAsync();

    // THEN setup virtualization AFTER data loads
    if (props.enableVirtualization && scrollableRef.value && virtualizationComposable) {
      console.log('🔧 Setting up virtualization after data load')

      // Wait for DOM to be ready
      await nextTick()

      // Attach container
      await virtualizationComposable.attachContainer(scrollableRef.value)

      // Verify initialization
      if (!virtualizationComposable.isInitialized.value) {
        console.warn('⚠️ Virtualization not initialized on first try, retrying...')

        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 100))
        await nextTick()

        if (scrollableRef.value) {
          await virtualizationComposable.attachContainer(scrollableRef.value)

          if (!virtualizationComposable.isInitialized.value) {
            console.error('❌ Failed to initialize virtualization after retry')
          } else {
            console.log('✅ Virtualization initialized on retry')
          }
        }
      } else {
        console.log('✅ Virtualization initialized successfully:', {
          containerHeight: virtualizationComposable.containerHeight.value,
          dataLength: displayedRows.value.length,
          viewportRows: virtualViewport.value?.visibleRows?.length || 0
        })
      }
    }
  } finally {
    isInitializing.value = false;
  }
});

watch(() => props.columns, (newColumns) => {
  const newFields = newColumns.map(c => c.field);
  const currentFields = columnOrder.value;

  if (JSON.stringify(newFields.sort()) !== JSON.stringify(currentFields.sort())) {
    console.log('📊 Columns structure changed, reinitializing...');
    columnOrder.value = newFields;
    setReorderColumnOrder(newFields);

    newColumns.forEach(col => {
      if (!(col.field in columnVisibility.value)) {
        columnVisibility.value[col.field] = col.visible !== false;
      }
    });
  }
}, { deep: true });

watch(scrollSentinelRef, (el) => {
  if (props.allowInfiniteScroll && el && infiniteScrollAttachSentinel) {
    infiniteScrollAttachSentinel(el);
  }
});

onUnmounted(() => {
  if (persistenceState && props.stateKey) {
    persistenceState.saveState();
  }

  if (gridRef.value) {
    gridRef.value.removeEventListener('keydown', handleKeyDown);
  }
});

watch(() => props.dataSource, async () => {
  await loadDataAsync();
}, { deep: true });

watch(localData, (newData) => {
  saveUndoState({
    changes: [],
    data: [...newData],
    description: 'Data changed'
  });
}, { deep: true });

watch(
  () => processedData.value,
  (newData) => {
    if (isLocal.value) {
      if (isGrouped.value && groupedData.value.length > 0) {
        totalItems.value = groupedData.value.length;
      } else {
        totalItems.value = newData.length;
      }

      console.log(`📊 Total items updated: ${totalItems.value}, Page size: ${pageSize.value}, Total pages: ${totalPages.value}`);

      if (newData.length > 0) {
        const maxPage = Math.ceil(totalItems.value / pageSize.value);
        if (currentPage.value > maxPage) {
          console.log(`📄 Adjusting page from ${currentPage.value} to ${maxPage}`);
          goToPage(maxPage);
        }
      } else if (currentPage.value !== 1) {
        goToPage(1);
      }
    }
  },
  { immediate: true }
);

watch(
  () => groupedData.value,
  (newGroupedData) => {
    if (isLocal.value && isGrouped.value) {
      totalItems.value = newGroupedData.length;

      if (currentPage.value !== 1) {
        goToPage(1);
      }
    }
  },
  { deep: true }
);

watch([filters, searchTerm], () => {
  if (isLocal.value && currentPage.value !== 1) {
    goToPage(1);
  }
});

watch([
  sortDescriptors,
  filters,
  currentPage,
  pageSize,
  selectedKeys,
  columnVisibility,
  columnOrder,
  groupDescriptors
], () => {
  if (!isInitializing.value && !isApplyingColumnChanges.value && persistenceState) {
    persistenceState.saveState();
  }
}, { deep: true });

// ===== FIX 2: Watch scrollableRef Changes =====

// Watch scrollableRef Changes
watch(scrollableRef, async (newScrollable, oldScrollable) => {
  console.log('📦 Scroll container ref changed:', {
    old: !!oldScrollable,
    new: !!newScrollable
  })

  if (newScrollable && newScrollable !== oldScrollable) {
    // Small delay to ensure DOM is ready
    await nextTick()

    // Virtualization
    if (props.enableVirtualization && virtualizationComposable) {
      console.log('🔗 Re-attaching virtualization to new container')
      await virtualizationComposable.attachContainer(newScrollable)

      // Verify attachment
      await nextTick()

      if (virtualizationComposable.isInitialized.value) {
        console.log('✅ Virtualization re-attached successfully:', {
          containerHeight: virtualizationComposable.containerHeight.value,
          dataLength: displayedRows.value.length,
          viewportRows: virtualViewport.value?.visibleRows?.length || 0
        })
      } else {
        console.error('❌ Failed to re-attach virtualization')
      }
    }

    // Infinite scroll
    if (props.allowInfiniteScroll && infiniteScrollAttachContainer) {
      console.log('🔗 Connecting infinite scroll to container')
      infiniteScrollAttachContainer(newScrollable)
    }
  }
}, { immediate: true })

// 5. ✅ Watch for viewport changes and log
watch(() => virtualViewport.value, (vp) => {
  if (vp && props.enableVirtualization) {
    console.log('👁️ Virtual viewport updated:', {
      startIndex: vp.startIndex,
      endIndex: vp.endIndex,
      visibleCount: vp.visibleRows?.length || 0,
      offsetTop: vp.offsetTop,
      offsetBottom: vp.offsetBottom,
      totalHeight: vp.totalHeight,
      viewportHeight: vp.viewportHeight,
      firstRowId: vp.visibleRows?.[0]?.[props.keyField],
      lastRowId: vp.visibleRows?.[vp.visibleRows.length - 1]?.[props.keyField]
    })

    // ✅ Validate spacer math
    const expectedTotal = displayedRows.value.length * props.rowHeight
    const actualTotal = vp.offsetTop + (vp.visibleRows.length * props.rowHeight) + vp.offsetBottom

    if (Math.abs(expectedTotal - actualTotal) > 1) {
      console.warn('⚠️ Spacer height mismatch:', {
        expected: expectedTotal,
        actual: actualTotal,
        difference: Math.abs(expectedTotal - actualTotal)
      })
    }
  }
}, { deep: true, immediate: true })

// Add this watcher after other watchers
watch(
  () => displayedRows.value,
  (newData) => {
    if (props.enableVirtualization && virtualizationComposable?.isInitialized.value) {
      // Force viewport update when data changes
      nextTick(() => {
        virtualizationComposable?.forceUpdate()
      })
    }
  },
  { deep: false }
)

watch(() => displayedRows.value.length, (newLength, oldLength) => {
  console.log('📊 displayedRows length changed:', {
    old: oldLength,
    new: newLength
  })

  if (props.enableVirtualization && virtualizationComposable) {
    nextTick(() => {
      virtualizationComposable.updateContainerSize()

      // Log viewport after data change
      const vp = virtualViewport.value
      if (vp) {
        console.log('📊 Viewport after data change:', {
          startIndex: vp.startIndex,
          endIndex: vp.endIndex,
          visibleCount: vp.visibleRows?.length,
          offsetTop: vp.offsetTop,
          offsetBottom: vp.offsetBottom
        })
      }
    })
  }
}, { immediate: true })

// ===== PROVIDE =====

provide('tsdatagrid', {
  theme: props.theme,
  keyField: props.keyField,
  columns: visibleColumns,
  loading: isLoading,
  rowHeight: props.rowHeight,
  focusedPosition,
  focusVisible,
});

// ===== EXPOSE =====

defineExpose({
  refresh: loadDataAsync,
  getData: () => localData.value,
  getProcessedData: () => processedData.value,
  selectAll: () => selectAll(processedData.value),
  clearSelection: deselectAll,
  getSelectedRows: () => getSelectedItems(localData.value),
  getSelectedKeys: () => Array.from(selectedKeys.value),
  setSelectedKeys: (keys: any[]) => {
    selectedKeys.value.clear();
    keys.forEach(k => selectedKeys.value.add(k));
    emit('selection-changed', getSelectedItems(localData.value));
  },
  isRowSelected: (key: any) => selectedKeys.value.has(key),
  selectRow: (key: any) => {
    const row = localData.value.find(r => r[props.keyField] === key);
    if (row) select(row);
  },
  deselectRow: (key: any) => {
    const row = localData.value.find(r => r[props.keyField] === key);
    if (row) deselect(row);
  },
  toggleRowSelection: (key: any) => {
    const row = localData.value.find(r => r[props.keyField] === key);
    if (row) toggleSelection(row);
  },
  invertSelection: () => invertSelection(processedData.value),
  selectFiltered: () => selectFiltered(processedData.value),
  selectByKeys: (keys: any[]) => selectByKeys(keys),
  deselectByKeys: (keys: any[]) => deselectByKeys(keys),
  exportData: handleExport,
  groupBy: (fields: string | string[]) => {
    clearGroups();
    const fieldsArray = Array.isArray(fields) ? fields : [fields];
    fieldsArray.forEach(field => addGroup(field));
  },
  clearGrouping: clearGroups,
  getGroupedData: () => groupedData.value,
  getActiveGroups: () => groupDescriptors.value,
  expandAllGroups: () => {
    groupedData.value.forEach(row => {
      if (row.isGroup) {
        expandedGroups.value.add(row.key);
      }
    });
    expandedGroups.value = new Set(expandedGroups.value);
  },
  collapseAllGroups: () => {
    expandedGroups.value.clear();
  },
  expandRow: (key: any) => {
    const row = localData.value.find(r => r[props.keyField] === key);
    if (row) expand(row, 0);
  },
  collapseRow: (key: any) => {
    const row = localData.value.find(r => r[props.keyField] === key);
    if (row) collapse(row, 0);
  },
  toggleRowExpansion: (key: any) => {
    const row = localData.value.find(r => r[props.keyField] === key);
    if (row) toggleExpansion(row, 0);
  },
  expandAllRows: () => expandAll(localData.value),
  collapseAllRows: collapseAll,
  getExpandedRows: () => Array.from(expandedRows.value),
  isRowExpanded: (key: any) => expandedRows.value.has(key),
  reorderColumn: (fromIndex: number, toIndex: number) => {
    handleColumnReorder({ fromIndex, toIndex });
  },
  setColumnWidth: (field: string, width: number) => setColumnWidth(field, width),
  getColumnWidth: (field: string) => getColumnWidth(field),
  autoSizeColumn: (field: string) => autoSizeColumn(field, localData.value),
  autoSizeAllColumns: () => {
    props.columns.forEach(col => autoSizeColumn(col.field, localData.value));
  },
  resetColumnWidths: resetWidths,
  showColumn: (field: string) => {
    columnVisibility.value[field] = true;
  },
  hideColumn: (field: string) => {
    columnVisibility.value[field] = false;
  },
  getVisibleColumns: () => visibleColumns.value,
  getColumnOrder: () => columnOrder.value,
  setColumnOrder: (order: string[]) => {
    columnOrder.value = [...order];
    setReorderColumnOrder(order);
  },
  applyFilter: (field: string, operator: FilterOperator, value: any, value2?: any) => {
    updateFilter(field, {
      field,
      operator,
      value,
      value2,
    });
  },
  removeFilter: (field: string) => {
    removeFilterByField(field);
  },
  clearFilters,
  getFilters: () => filters.value,
  getActiveFilters: () => activeFilters.value,
  hasFilter: (field: string) => hasFilter(field),
  filterEquals: (field: string, value: any) => {
    updateFilter(field, {
      field,
      operator: FilterOperator.Equals,
      value,
    });
  },
  filterContains: (field: string, value: string) => {
    updateFilter(field, {
      field,
      operator: FilterOperator.Contains,
      value,
    });
  },
  filterIn: (field: string, values: any[]) => {
    updateFilter(field, {
      field,
      operator: FilterOperator.In,
      value: values,
    });
  },
  filterGreaterThan: (field: string, value: number | Date) => {
    updateFilter(field, {
      field,
      operator: FilterOperator.GreaterThan,
      value,
    });
  },
  filterLessThan: (field: string, value: number | Date) => {
    updateFilter(field, {
      field,
      operator: FilterOperator.LessThan,
      value,
    });
  },
  filterBetween: (field: string, value1: any, value2: any) => {
    updateFilter(field, {
      field,
      operator: FilterOperator.Between,
      value: value1,
      value2,
    });
  },
  infiniteScrollReset: () => {
    if (props.allowInfiniteScroll) {
      infiniteScrollReset();
    }
  },
  infiniteScrollReload: async () => {
    if (props.allowInfiniteScroll) {
      await infiniteScrollReload();
    }
  },
  getInfiniteScrollData: () => {
    return props.allowInfiniteScroll ? infiniteScrollData.value : [];
  },
  getInfiniteScrollProgress: () => {
    return infiniteScrollComposable?.progress.value || 0;
  },
  copySelectedRows: async () => {
    const selectedRows = getSelectedItems(localData.value);
    return await copySelection(selectedRows);
  },
  pasteRows: async () => {
    return await paste();
  },
  cutSelectedRows: async () => {
    const selectedRows = getSelectedItems(localData.value);
    return await cut(selectedRows);
  },
  getClipboardSupport: () => isClipboardSupported.value,
  undo: handleUndo,
  redo: handleRedo,
  canUndo: () => canUndo.value,
  canRedo: () => canRedo.value,
  clearUndoHistory,
  // ===== KEYBOARD NAVIGATION API =====
  setFocus: (rowKey: any, columnField: string) => {
    if (props.enableKeyboardNavigation) {
      setFocus(rowKey, columnField)
    }
  },
  clearFocus: () => {
    if (props.enableKeyboardNavigation) {
      clearFocus()
    }
  },
  moveFocus: (direction: 'up' | 'down' | 'left' | 'right') => {
    if (props.enableKeyboardNavigation) {
      moveFocus(direction)
    }
  },
  moveToFirstCell: () => {
    if (props.enableKeyboardNavigation) {
      moveToFirstCell()
    }
  },
  moveToLastCell: () => {
    if (props.enableKeyboardNavigation) {
      moveToLastCell()
    }
  },
  getFocusedPosition: () => focusedPosition.value,
  getFocusedCellValue: () => {
    if (props.enableKeyboardNavigation) {
      return getFocusedCellValue()
    }
    return undefined
  },
});
</script>

<style lang="scss">
@import '../styles/index.scss';
</style>