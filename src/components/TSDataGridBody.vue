<template>
  <div class="ts-datagrid-body" ref="bodyRef">
    <!-- Loading State -->
    <div v-if="loading && !infiniteScrollEnabled && displayRows.length === 0" class="ts-datagrid-body__loading">
      <slot name="loading">
        <div class="ts-datagrid-body__spinner" />
        <span>{{ loadingText || 'Loading...' }}</span>
      </slot>
    </div>

    <!-- Empty State -->
    <div v-else-if="displayRows.length === 0 && !loading" class="ts-datagrid-body__empty">
      <slot name="empty">
        <div class="ts-datagrid-body__empty-message">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <rect x="8" y="16" width="48" height="40" rx="2" stroke="currentColor" stroke-width="2" />
            <line x1="8" y1="24" x2="56" y2="24" stroke="currentColor" stroke-width="2" />
            <line x1="20" y1="16" x2="20" y2="56" stroke="currentColor" stroke-width="2" />
          </svg>
          <p>No data available</p>
        </div>
      </slot>
    </div>

    <!-- Data Rows -->
    <template v-else>
      <!-- ✅ VIRTUAL SCROLL: Top Spacer -->
      <div 
        v-if="virtualScrollEnabled && virtualViewport" 
        class="ts-datagrid-body__virtual-spacer"
        :style="{ height: `${virtualViewport.offsetTop}px` }" 
      />

      <!-- ===== GROUPED ROWS ===== -->
      <template v-if="isGrouped">
        <template v-for="(item, localIndex) in virtualizedDisplayRows" :key="getRowKey(item, localIndex)">
          <!-- Group Header Row -->
          <div 
            v-if="item.isGroup" 
            class="ts-datagrid-body__group-row" 
            :style="getGroupRowStyle(item)"
            @click="handleGroupClick(item)"
          >
            <div class="ts-datagrid-body__group-cell">
              <button 
                class="ts-datagrid-body__group-toggle"
                :class="{ 'ts-datagrid-body__group-toggle--expanded': item.expanded }"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M4 2l4 4-4 4" fill="currentColor" />
                </svg>
              </button>
              <span class="ts-datagrid-body__group-title">
                {{ item.field }}: {{ formatGroupValue(item.value) }}
              </span>
              <span class="ts-datagrid-body__group-count">
                ({{ item.items?.length || 0 }} items)
              </span>
            </div>
          </div>

          <!-- Group Data Rows (only if expanded) -->
          <template v-if="!item.isGroup || item.expanded">
            <div 
              v-if="!item.isGroup" 
              class="ts-datagrid-body__row" 
              :class="getRowClasses(item, localIndex)"
              :style="getRowStyle(localIndex)" 
              @click="handleRowClick(item, localIndex)"
              @dblclick="handleRowDblClick(item, localIndex)" 
              @contextmenu="handleContextMenu($event, item, localIndex)"
            >
              <TSDataGridRow 
                :row="item" 
                :columns="columns" 
                :row-index="localIndex" 
                :key-field="keyField"
                :selection-state="selectionState" 
                :editing-state="editingState" 
                :batch-editing="batchEditing"
                @select="handleRowSelect" 
                @cell-click="handleCellClick" 
                @cell-edit="handleCellEdit"
                @cell-save="handleCellSave" 
                @cell-cancel="handleCellCancel"
              >
                <template v-for="col in columns" :key="col.field" #[`cell-${col.field}`]="scope">
                  <slot :name="`cell-${col.field}`" v-bind="scope" />
                </template>
              </TSDataGridRow>
            </div>
          </template>

          <!-- Group Footer with Summary -->
          <div 
            v-if="item.isGroup && item.expanded && showGroupSummary" 
            class="ts-datagrid-body__group-footer"
            :style="{ paddingLeft: `${item.level * 20}px` }"
          >
            <div class="ts-datagrid-body__group-summary">
              <div 
                v-for="col in columns" 
                :key="`group-summary-${item.key}-${col.field}`"
                class="ts-datagrid-body__group-summary-cell" 
                :class="getCellClass(col)" 
                :style="getCellStyle(col)"
              >
                <slot 
                  :name="`group-summary-${col.field}`" 
                  :group="item" 
                  :value="getGroupSummaryValue(item, col.field)"
                  :items="item.items"
                >
                  {{ formatGroupSummaryValue(item, col.field) }}
                </slot>
              </div>
            </div>
          </div>
        </template>
      </template>

      <!-- ===== REGULAR ROWS ===== -->
      <template v-else>
        <template v-for="(row, localIndex) in virtualizedDisplayRows" :key="getRowKey(row, localIndex)">
          <!-- Main Row -->
          <div 
            class="ts-datagrid-body__row" 
            :class="getRowClasses(row, localIndex)" 
            :style="getRowStyle(localIndex)"
            @click="handleRowClick(row, localIndex)" 
            @dblclick="handleRowDblClick(row, localIndex)"
            @contextmenu="handleContextMenu($event, row, localIndex)"
          >
            <!-- Expansion Toggle Cell -->
            <div 
              v-if="allowRowExpansion" 
              class="ts-datagrid-body__cell ts-datagrid-body__cell--expansion"
              style="width: 40px; min-width: 40px; max-width: 40px; flex: none;"
              @click.stop="handleToggleExpansion(row, localIndex)"
            >
              <button 
                class="ts-datagrid-body__expand-toggle"
                :class="{ 'ts-datagrid-body__expand-toggle--expanded': isRowExpanded(row) }"
              >
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path d="M4 2l4 4-4 4" fill="currentColor" />
                </svg>
              </button>
            </div>

            <!-- Rest of row -->
            <TSDataGridRow 
              :row="row" 
              :columns="columns" 
              :row-index="localIndex" 
              :key-field="keyField"
              :selection-state="selectionState" 
              :editing-state="editingState" 
              :batch-editing="batchEditing"
              @select="handleRowSelect" 
              @cell-click="handleCellClick" 
              @cell-edit="handleCellEdit"
              @cell-save="handleCellSave" 
              @cell-cancel="handleCellCancel"
            >
              <template v-for="col in columns" :key="col.field" #[`cell-${col.field}`]="scope">
                <slot :name="`cell-${col.field}`" v-bind="scope" />
              </template>
            </TSDataGridRow>
          </div>

          <!-- Detail Row -->
          <div 
            v-if="allowRowExpansion && isRowExpanded(row)" 
            class="ts-datagrid-body__detail-row"
            :style="{ minHeight: '100px' }"
          >
            <div class="ts-datagrid-body__detail-content">
              <slot name="detail" :row="row">
                <div style="padding: 20px; background: #f5f5f5;">
                  <strong>Detail for:</strong> {{ row[keyField] }}
                </div>
              </slot>
            </div>
          </div>
        </template>
      </template>

      <!-- ✅ VIRTUAL SCROLL: Bottom Spacer -->
      <div 
        v-if="virtualScrollEnabled && virtualViewport" 
        class="ts-datagrid-body__virtual-spacer"
        :style="{ height: `${virtualViewport.offsetBottom}px` }" 
      />

      <!-- ✅ INFINITE SCROLL: Sentinel Element -->
      <div 
        v-if="infiniteScrollEnabled"
        ref="scrollSentinelRef"
        class="ts-datagrid-body__scroll-sentinel"
        :data-page="currentPage"
        :data-has-more="infiniteScrollHasMore"
      >
        <slot name="sentinel">
          <div style="height: 1px;"></div>
        </slot>
      </div>

      <!-- ✅ INFINITE SCROLL: Loading More Indicator -->
      <div v-if="infiniteScrollEnabled && loading" class="ts-datagrid-body__loading-more">
        <slot name="loading-more">
          <div class="ts-datagrid-body__spinner ts-datagrid-body__spinner--small" />
          <span>Loading more...</span>
        </slot>
      </div>

      <!-- ✅ INFINITE SCROLL: No More Data -->
      <div 
        v-if="infiniteScrollEnabled && !infiniteScrollHasMore && !loading && displayRows.length > 0" 
        class="ts-datagrid-body__no-more"
      >
        <slot name="no-more">
          <span>✓ All data loaded</span>
        </slot>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import type { PropType } from 'vue'
import TSDataGridRow from './TSDataGridRow.vue'
import { ColumnDefinition } from '@/types'

const props = defineProps({
  columns: {
    type: Array as PropType<ColumnDefinition[]>,
    required: true,
  },
  rows: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  groupedData: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  isGrouped: {
    type: Boolean,
    default: false,
  },
  selectionState: {
    type: Object as PropType<any>,
    required: true,
  },
  editingState: {
    type: Object as PropType<any>,
    required: true,
  },
  batchEditing: {
    type: Boolean,
    default: false,
  },
  rowHeight: {
    type: Number,
    default: 40,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingText: {
    type: String,
    default: '',
  },
  keyField: {
    type: String,
    default: 'id',
  },
  allowRowExpansion: {
    type: Boolean,
    default: false,
  },
  expansionState: {
    type: Object as PropType<any>,
    default: null,
  },
  showGroupSummary: {
    type: Boolean,
    default: false,
  },
  groupSummaries: {
    type: Object as PropType<Map<string, Record<string, any>>>,
    default: () => new Map(),
  },
  infiniteScrollEnabled: {
    type: Boolean,
    default: false,
  },
  infiniteScrollHasMore: {
    type: Boolean,
    default: false,
  },
  currentPage: {
    type: Number,
    default: 1,
  },
  virtualScrollEnabled: {
    type: Boolean,
    default: false,
  },
  virtualViewport: {
    type: Object as PropType<any>,
    default: null,
  },
  focusedPosition: {
    type: Object as PropType<any>,
    default: null,
  },
  focusVisible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'row-click', row: any, index: number): void
  (e: 'row-dblclick', row: any, index: number): void
  (e: 'cell-click', row: any, column: ColumnDefinition): void
  (e: 'cell-edit', rowKey: any, field: string): void
  (e: 'cell-save', rowKey: any, field: string, value: any): void
  (e: 'cell-cancel'): void
  (e: 'select', row: any, selected: boolean): void
  (e: 'expand-group', groupKey: string): void
  (e: 'toggle-expansion', row: any, index: number): void
  (e: 'row-context-menu', event: MouseEvent, row: any, index: number): void
  (e: 'sentinel-ready', element: HTMLElement): void
}>()

const bodyRef = ref<HTMLDivElement>()
const scrollSentinelRef = ref<HTMLDivElement>()

// ===== DISPLAY ROWS =====
const displayRows = computed(() => {
  return props.isGrouped ? props.groupedData : props.rows
})

// ===== VIRTUALIZED DISPLAY ROWS =====
const virtualizedDisplayRows = computed(() => {
  if (props.virtualScrollEnabled && props.virtualViewport && props.virtualViewport.visibleRows) {
    console.log('👁️ Rendering virtualized rows:', {
      count: props.virtualViewport.visibleRows.length,
      startIndex: props.virtualViewport.startIndex,
      endIndex: props.virtualViewport.endIndex,
      offsetTop: props.virtualViewport.offsetTop,
      offsetBottom: props.virtualViewport.offsetBottom,
      firstRowId: props.virtualViewport.visibleRows[0]?.[props.keyField],
      lastRowId: props.virtualViewport.visibleRows[props.virtualViewport.visibleRows.length - 1]?.[props.keyField]
    })
    return props.virtualViewport.visibleRows
  }
  console.log('📄 Rendering all rows:', displayRows.value.length)
  return displayRows.value
})

// ===== WATCH FOR SENTINEL ELEMENT =====
watch(scrollSentinelRef, (newSentinel) => {
  if (newSentinel && props.infiniteScrollEnabled) {
    console.log('📍 Sentinel element mounted')
    nextTick(() => {
      emit('sentinel-ready', newSentinel)
    })
  }
}, { immediate: true })

// ===== DEBUG LOGGING =====
watch(() => props.virtualViewport, (vp) => {
  if (vp && props.virtualScrollEnabled) {
    console.log('📊 Viewport changed in Body:', {
      startIndex: vp.startIndex,
      endIndex: vp.endIndex,
      visibleCount: vp.visibleRows?.length,
      offsetTop: vp.offsetTop,
      offsetBottom: vp.offsetBottom
    })
  }
}, { deep: true })

// ===== METHODS =====
const getCellStyle = (column: ColumnDefinition): Record<string, string | undefined> => {
  const style: Record<string, string | undefined> = {}
  
  if (column.width) {
    style.width = typeof column.width === 'number' ? `${column.width}px` : column.width
  }
  
  if (column.minWidth) {
    style.minWidth = `${column.minWidth}px`
  }
  
  return style
}

const getCellClass = (column: ColumnDefinition) => {
  return {
    'ts-datagrid-body__group-summary-cell--number': 
      column.type === 'number' || column.type === 'currency',
    'ts-datagrid-body__group-summary-cell--left': 
      column.alignment === 'left' || !column.alignment,
    'ts-datagrid-body__group-summary-cell--center': 
      column.alignment === 'center',
    'ts-datagrid-body__group-summary-cell--right': 
      column.alignment === 'right',
  }
}

const getGroupSummaryValue = (group: any, field: string): any => {
  const summaries = props.groupSummaries?.get(group.key)
  if (!summaries) return null
  
  const summaryKey = Object.keys(summaries).find(key => key.startsWith(`${field}_`))
  return summaryKey ? summaries[summaryKey] : null
}

const formatGroupSummaryValue = (group: any, field: string): string => {
  const value = getGroupSummaryValue(group, field)
  if (value == null) return ''
  
  const column = props.columns.find(c => c.field === field)
  
  if (column?.type === 'number' || column?.type === 'currency') {
    return typeof value === 'number' ? value.toLocaleString() : String(value)
  }
  
  if (column?.type === 'date' && value instanceof Date) {
    return value.toLocaleDateString()
  }
  
  return String(value)
}

const getRowKey = (row: any, index: number): string | number => {
  if (row.isGroup) return row.key
  return row[props.keyField] || `row-${index}`
}

const getRowClasses = (row: any, localIndex: number) => {
  const isSelected = props.selectionState?.isSelected?.(row) ?? false
  const isEditing = props.editingState?.isRowEditing?.(row[props.keyField]) ?? false
  
  return {
    'ts-datagrid-body__row--selected': isSelected,
    'ts-datagrid-body__row--even': localIndex % 2 === 0,
    'ts-datagrid-body__row--odd': localIndex % 2 !== 0,
    'ts-datagrid-body__row--editing': isEditing,
    'ts-datagrid-body__row--batch-editing': props.batchEditing,
    'ts-datagrid-body__row--focused': 
      props.focusVisible && props.focusedPosition?.rowKey === row[props.keyField],
  }
}

const getRowStyle = (localIndex: number) => {
  // With virtualization, spacers handle positioning
  // Just set row height
  return {
    height: `${props.rowHeight}px`,
    minHeight: `${props.rowHeight}px`,
  }
}

const getGroupRowStyle = (group: any) => {
  return {
    paddingLeft: `${group.level * 20}px`,
    height: `${props.rowHeight}px`,
    minHeight: `${props.rowHeight}px`,
  }
}

const formatGroupValue = (value: any): string => {
  if (value == null) return '(Empty)'
  return String(value)
}

const isRowExpanded = (row: any): boolean => {
  return props.expansionState?.isExpanded?.(row) ?? false
}

const handleToggleExpansion = (row: any, index: number) => {
  emit('toggle-expansion', row, index)
}

const handleRowClick = (row: any, index: number) => {
  emit('row-click', row, index)
}

const handleRowDblClick = (row: any, index: number) => {
  emit('row-dblclick', row, index)
}

const handleCellClick = (row: any, column: ColumnDefinition) => {
  emit('cell-click', row, column)
}

const handleCellEdit = (rowKey: any, field: string) => {
  emit('cell-edit', rowKey, field)
}

const handleCellSave = (rowKey: any, field: string, value: any) => {
  emit('cell-save', rowKey, field, value)
}

const handleCellCancel = () => {
  emit('cell-cancel')
}

const handleRowSelect = (row: any, selected: boolean) => {
  emit('select', row, selected)
}

const handleGroupClick = (group: any) => {
  emit('expand-group', group.key)
}

const handleContextMenu = (event: MouseEvent, row: any, index: number) => {
  emit('row-context-menu', event, row, index)
}

// ===== LIFECYCLE =====
onMounted(() => {
  console.log('📦 TSDataGridBody mounted:', {
    virtualScrollEnabled: props.virtualScrollEnabled,
    infiniteScrollEnabled: props.infiniteScrollEnabled,
    totalRows: displayRows.value.length,
    hasViewport: !!props.virtualViewport
  })
})

defineExpose({
  scrollSentinelRef,
  bodyRef,
})
</script>

<style lang="scss" scoped>
.ts-datagrid-body {
  position: relative;
  width: 100%;
}

.ts-datagrid-body__loading,
.ts-datagrid-body__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
}

.ts-datagrid-body__spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ts-datagrid-body__virtual-spacer {
  width: 100%;
  flex-shrink: 0;
  pointer-events: none;
}

.ts-datagrid-body__row {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e5e7eb;
  background: white;
  transition: background-color 0.15s ease;
  
  &:hover {
    background: #f9fafb;
  }
  
  &--selected {
    background: #eff6ff !important;
  }
  
  &--focused {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
  }
}

.ts-datagrid-body__scroll-sentinel {
  height: 1px;
  width: 100%;
  position: relative;
  pointer-events: none;
}

.ts-datagrid-body__loading-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  font-size: 14px;
  color: #6b7280;
}

.ts-datagrid-body__spinner--small {
  width: 20px;
  height: 20px;
  border: 2px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.ts-datagrid-body__no-more {
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-size: 13px;
}
</style>