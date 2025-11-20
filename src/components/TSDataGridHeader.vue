<template>
  <div class="ts-datagrid-header">
    <div class="ts-datagrid-header__row">
      <!-- Selection Cell -->
      <div v-if="isSelectionEnabled" class="ts-datagrid-header__cell ts-datagrid-header__cell--selection"
        style="width: 40px; min-width: 40px; max-width: 40px; flex: none;">
        <input v-if="isMultipleSelection" type="checkbox" class="ts-datagrid-header__checkbox" :checked="allSelected"
          :indeterminate.prop="someSelected && !allSelected" @change="handleSelectAll" title="Select all rows" />
      </div>

      <!-- Expansion Cell -->
      <div v-if="allowRowExpansion" class="ts-datagrid-header__cell ts-datagrid-header__cell--expansion"
        style="width: 40px; min-width: 40px; max-width: 40px; flex: none;">
        <!-- Empty header for expansion column -->
      </div>

      <!-- Data Columns -->
      <div v-for="(column, index) in columns" :key="column.field" :data-column="column.field"
        class="ts-datagrid-header__cell" :class="getHeaderCellClasses(column)" :style="getHeaderCellStyle(column)"
        :draggable="(allowReordering || allowGrouping) && column.groupable !== false" @click="handleHeaderClick(column)"
        @dragstart="handleDragStart($event, index, column)" @dragover="handleDragOver($event, index)"
        @drop="handleDrop($event, index)" @dragend="handleDragEnd">
        <div class="ts-datagrid-header__cell-content">
          <!-- Drag Handle -->
          <div v-if="(allowReordering || allowGrouping) && column.groupable !== false"
            class="ts-datagrid-header__drag-handle"
            :title="allowGrouping ? 'Drag to reorder or group' : 'Drag to reorder'">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 3h8M2 6h8M2 9h8" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
          </div>

          <!-- Column Title -->
          <div class="ts-datagrid-header__title">
            <slot :name="`header-${column.field}`" :column="column">
              {{ column.title || column.field }}
            </slot>

            <!-- Sort Indicator -->
            <span v-if="allowSorting && getSortDirection(column.field)" class="ts-datagrid-header__sort-icon">
              <svg v-if="getSortDirection(column.field) === 'asc'" width="12" height="12" viewBox="0 0 12 12">
                <path d="M6 3l4 5H2z" fill="currentColor" />
              </svg>
              <svg v-else-if="getSortDirection(column.field) === 'desc'" width="12" height="12" viewBox="0 0 12 12">
                <path d="M6 9l4-5H2z" fill="currentColor" />
              </svg>
              <span v-if="getSortIndex(column.field) > 0" class="ts-datagrid-header__sort-index">
                {{ getSortIndex(column.field) }}
              </span>
            </span>
          </div>

          <!-- Filter Button -->
          <button v-if="allowFiltering && column.filterable !== false" class="ts-datagrid-header__filter-button"
            :class="{ 'ts-datagrid-header__filter-button--active': isFiltered(column.field) }"
            @click.stop="handleFilterClick(column, $event)" :title="`Filter ${column.title || column.field}`">
            <svg width="14" height="14" viewBox="0 0 14 14">
              <path d="M2 2h10l-4 5v4l-2 1V7L2 2z" :fill="isFiltered(column.field) ? 'currentColor' : 'none'"
                stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>

          <!-- Resize Handle -->
          <div v-if="allowResizing && column.resizable !== false" class="ts-datagrid-header__resize-handle"
            @mousedown="handleResizeStart($event, column, index)" @dblclick.stop="handleAutoSize(column)"
            :title="'Double-click to auto-size'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// ===== IMPORTS =====
import { computed } from 'vue';
import type { PropType } from 'vue';

// ✅ FIXED: Import everything needed from your types
import { SelectionModeType } from '@/types';
import type {
  ColumnDefinition,
  SortDescriptor,
  SelectionMode
} from '@/types';

// ===== PROPS =====
const props = defineProps({
  columns: {
    type: Array as PropType<ColumnDefinition[]>,
    required: true,
  },
  sortDescriptors: {
    type: Array as PropType<SortDescriptor[]>,
    default: () => [],
  },
  allowSorting: {
    type: Boolean,
    default: true,
  },
  allowFiltering: {
    type: Boolean,
    default: true,
  },
  allowReordering: {
    type: Boolean,
    default: true,
  },
  allowResizing: {
    type: Boolean,
    default: true,
  },
  allowSelection: {
    type: Boolean,
    default: false,
  },
  allowGrouping: {
    type: Boolean,
    default: false,
  },
  selectionMode: {
    type: Object as PropType<SelectionMode>,
    default: (): SelectionMode => ({
      mode: SelectionModeType.None
    }),
  },
  allSelected: {
    type: Boolean,
    default: false,
  },
  someSelected: {
    type: Boolean,
    default: false,
  },
  filterState: {
    type: Object as PropType<any>,
    default: () => ({})
  },
  allowRowExpansion: {
    type: Boolean,
    default: false,
  },
  resizeState: {
    type: Object as PropType<any>,
    default: null,
  },
  reorderState: {
    type: Object as PropType<any>,
    default: null,
  },
  columnWidths: {
    type: Object as PropType<Record<string, number>>,
    default: () => ({}),
  },
  focusedCell: {
    type: Object as PropType<{ rowKey: any; columnField: string } | null>,
    default: null,
  },
});

// ===== EMITS =====
const emit = defineEmits<{
  (e: 'sort', field: string): void;
  (e: 'filter', column: ColumnDefinition, position: { x: number; y: number }): void;
  (e: 'reorder', payload: { fromIndex: number; toIndex: number }): void;
  (e: 'resize', payload: { field: string; width: number }): void;
  (e: 'select-all', selected: boolean): void;
  (e: 'start-resize', field: string, event: MouseEvent, currentWidth: number): void;
  (e: 'start-drag', field: string, event: DragEvent): void;
  (e: 'drag-over', field: string, event: DragEvent): void;
  (e: 'drop-column', field: string, event: DragEvent): void;
  (e: 'end-drag'): void;
  (e: 'auto-size', field: string): void;
}>();

// ===== COMPUTED =====
const isSelectionEnabled = computed(() => {
  return props.allowSelection &&
    props.selectionMode &&
    props.selectionMode.mode !== SelectionModeType.None;
});

const isMultipleSelection = computed(() => {
  return props.selectionMode?.mode === SelectionModeType.Multiple;
});

// ===== METHODS =====
const getHeaderCellStyle = (column: ColumnDefinition) => {
  const width = props.columnWidths[column.field] || column.width || 150;
  const minWidth = column.minWidth || 50;
  const maxWidth = column.maxWidth;

  return {
    width: `${width}px`,
    minWidth: `${minWidth}px`,
    maxWidth: maxWidth ? `${maxWidth}px` : undefined,
    flex: 'none',
  };
};

const getHeaderCellClasses = (column: ColumnDefinition) => ({
  'ts-datagrid-header__cell--sortable': props.allowSorting && column.sortable !== false,
  'ts-datagrid-header__cell--sorted': isSorted(column.field),
  'ts-datagrid-header__cell--filtered': isFiltered(column.field),
  'ts-datagrid-header__cell--resizable': props.allowResizing && column.resizable !== false,
  'ts-datagrid-header__cell--groupable': props.allowGrouping && column.groupable !== false,
  'ts-datagrid-header__cell--resizing': props.resizeState?.isResizing &&
    props.resizeState?.resizingColumn === column.field,
  'ts-datagrid-header__cell--dragging': props.reorderState?.dragColumn === column.field,
  [`ts-datagrid-header__cell--${column.alignment || 'left'}`]: true,
});

const getSortDirection = (field: string) => {
  const sort = props.sortDescriptors.find(s => s.field === field);
  return sort?.direction || null;
};

const getSortIndex = (field: string): number => {
  const index = props.sortDescriptors.findIndex(s => s.field === field);
  return index >= 0 ? index + 1 : 0;
};

const isSorted = (field: string): boolean => {
  return props.sortDescriptors.some(s => s.field === field);
};

const isFiltered = (field: string): boolean => {
  return props.filterState?.filters?.some((f: any) => f.field === field) || false;
};

const handleHeaderClick = (column: ColumnDefinition) => {
  if (props.allowSorting && column.sortable !== false) {
    emit('sort', column.field);
  }
};

const handleFilterClick = (column: ColumnDefinition, event: MouseEvent) => {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();

  const position = {
    x: rect.left + rect.width / 2,
    y: rect.bottom + 5
  };

  emit('filter', column, position);
};

const handleSelectAll = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('select-all', target.checked);
};

const handleDragStart = (event: DragEvent, index: number, column: ColumnDefinition) => {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    
    event.dataTransfer.setData('text/plain', index.toString())
    event.dataTransfer.setData('column-field', column.field as string)
    event.dataTransfer.setData('column-index', index.toString())
  }
  
  // ✅ Emit to parent with all needed info
  emit('start-drag', column.field as string, event)
}

const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  
  const column = props.columns[index]
  if (column?.locked) {
    event.dataTransfer!.dropEffect = 'none'
    return
  }
  
  event.dataTransfer!.dropEffect = 'move'
  emit('drag-over', column.field, event)
}

const handleDrop = (event: DragEvent, toIndex: number) => {
  event.preventDefault()
  event.stopPropagation()
  
  // ✅ Get drag data
  const fromIndexStr = event.dataTransfer?.getData('column-index') || 
                       event.dataTransfer?.getData('text/plain')
  const columnField = event.dataTransfer?.getData('column-field')
  
  if (!fromIndexStr) {
    console.warn('⚠️ No drag index data')
    return
  }
  
  const fromIndex = parseInt(fromIndexStr, 10)
  
  console.log('🎯 Header drop:', {
    from: fromIndex,
    to: toIndex,
    field: columnField
  })
  
  // ✅ Emit reorder event (NOT drop-column)
  if (fromIndex !== toIndex && !isNaN(fromIndex)) {
    emit('reorder', { fromIndex, toIndex })
  }
}

const handleDragEnd = () => {
  emit('end-drag')
}

const handleResizeStart = (event: MouseEvent, column: ColumnDefinition, index: number) => {
  event.preventDefault();
  event.stopPropagation();

  const currentWidth = props.columnWidths[column.field] ||
    (typeof column.width === 'number' ? column.width : 150);

  emit('start-resize', column.field, event, currentWidth);
};

const handleAutoSize = (column: ColumnDefinition) => {
  // Emit event to trigger auto-sizing in parent
  emit('auto-size', column.field);
};
</script>
