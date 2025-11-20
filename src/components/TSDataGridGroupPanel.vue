<template>
  <div class="ts-datagrid-group-panel">
    <div class="ts-datagrid-group-panel__content">
      <!-- Drop Zone (Empty State) -->
      <div
        v-if="groupedColumns.length === 0"
        class="ts-datagrid-group-panel__drop-zone"
        @dragover.prevent="handleDragOver"
        @drop="handleDrop($event, -1)"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" class="ts-datagrid-group-panel__icon">
          <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.5" fill="none" />
          <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" stroke-width="1.5" />
          <line x1="6" y1="4" x2="6" y2="16" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <span class="ts-datagrid-group-panel__hint">
          Drag a column header here to group by that column
        </span>
      </div>

      <!-- Grouped Columns -->
      <div v-else class="ts-datagrid-group-panel__groups">
        <div
          v-for="(field, index) in groupedColumns"
          :key="field"
          class="ts-datagrid-group-panel__group"
          :class="{ 'ts-datagrid-group-panel__group--dragging': draggedIndex === index }"
          draggable="true"
          @dragstart="handleDragStart($event, index)"
          @dragover.prevent="handleDragOver"
          @drop="handleDrop($event, index)"
          @dragend="handleDragEnd"
        >
          <!-- Drag Handle -->
          <div class="ts-datagrid-group-panel__drag-handle">
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 3h8M2 6h8M2 9h8" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
          </div>

          <!-- Column Name -->
          <span class="ts-datagrid-group-panel__name">
            {{ getColumnTitle(field) }}
          </span>

          <!-- Sort Toggle -->
          <button
            class="ts-datagrid-group-panel__sort"
            @click="handleSortToggle(field)"
            title="Toggle Sort Direction"
          >
            <svg
              v-if="getSortDirection(field) === 'asc'"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <path d="M6 3l4 5H2z" fill="currentColor" />
            </svg>
            <svg
              v-else-if="getSortDirection(field) === 'desc'"
              width="12"
              height="12"
              viewBox="0 0 12 12"
            >
              <path d="M6 9l4-5H2z" fill="currentColor" />
            </svg>
            <svg
              v-else
              width="12"
              height="12"
              viewBox="0 0 12 12"
              opacity="0.3"
            >
              <path d="M6 3l3 3H3zM6 9l3-3H3z" fill="currentColor" />
            </svg>
          </button>

          <!-- Remove Button -->
          <button
            class="ts-datagrid-group-panel__remove"
            @click="handleRemove(field)"
            title="Remove Grouping"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="2" />
            </svg>
          </button>
        </div>

        <!-- Clear All Button -->
        <button
          class="ts-datagrid-group-panel__clear"
          @click="handleClearAll"
          title="Clear All Grouping"
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <span>Clear All</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ColumnDefinition, SortDirection } from '@/types';
import { ref } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
  groupedColumns: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
  columns: {
    type: Array as PropType<ColumnDefinition[]>,
    required: true,
  },
  sortDirections: {
    type: Object as PropType<Record<string, SortDirection>>,
    default: () => ({}),
  },
});

const emit = defineEmits<{
  (e: 'update:grouped-columns', columns: string[]): void;
  (e: 'sort-toggle', field: string): void;
  (e: 'remove', field: string): void;
  (e: 'clear-all'): void;
  (e: 'reorder', fromIndex: number, toIndex: number): void;
}>();

// Drag & Drop state
const draggedIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);
const isDraggingFromHeader = ref(false);

// Methods
const getColumnTitle = (field: string): string => {
  const column = props.columns.find(c => c.field === field);
  return column?.title || field;
};

const getSortDirection = (field: string): SortDirection => {
  return props.sortDirections[field] || null;
};

const handleSortToggle = (field: string) => {
  emit('sort-toggle', field);
};

const handleRemove = (field: string) => {
  console.log('🗑️ Removing group from panel:', field);
  emit('remove', field);
  const updated = props.groupedColumns.filter(f => f !== field);
  emit('update:grouped-columns', updated);
};

const handleClearAll = () => {
  console.log('🗑️ Clearing all groups from panel');
  emit('clear-all');
  emit('update:grouped-columns', []);
};

const handleDragStart = (event: DragEvent, index: number) => {
  console.log('🎯 Group panel drag start:', index, props.groupedColumns[index]);
  draggedIndex.value = index;
  isDraggingFromHeader.value = false;
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
    event.dataTransfer.setData('group-panel-index', index.toString());
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

// ✅ FIXED: Properly handle undefined from getData
const handleDrop = (event: DragEvent, toIndex: number) => {
  event.preventDefault();
  event.stopPropagation();

  if (!event.dataTransfer) return;

  // ✅ Get drag data with proper undefined handling
  const columnField = event.dataTransfer.getData('column-field') || null;
  const groupPanelIndex = event.dataTransfer.getData('group-panel-index') || null;
  
  console.log('📥 Drop event:', {
    columnField,
    groupPanelIndex,
    toIndex,
    currentGroups: props.groupedColumns
  });

  // ✅ Case 1: Dropping a column from the grid header
  if (columnField) {
    console.log('🎯 Dropping column from header:', columnField);
    
    const column = props.columns.find(c => c.field === columnField);
    
    if (!column) {
      console.warn('❌ Column not found:', columnField);
      return;
    }
    
    if (column.groupable === false) {
      console.warn('❌ Column is not groupable:', columnField);
      return;
    }
    
    if (props.groupedColumns.includes(columnField)) {
      console.warn('⚠️ Column already grouped:', columnField);
      return;
    }
    
    // ✅ Add new grouping
    const updated = [...props.groupedColumns];
    if (toIndex === -1 || toIndex >= updated.length) {
      updated.push(columnField);
      console.log('✅ Added group to end:', columnField);
    } else {
      updated.splice(toIndex, 0, columnField);
      console.log('✅ Inserted group at', toIndex, ':', columnField);
    }
    
    emit('update:grouped-columns', updated);
  }
  // ✅ Case 2: Reordering within group panel
  else if (groupPanelIndex) {
    const fromIndex = parseInt(groupPanelIndex, 10);
    
    if (isNaN(fromIndex) || fromIndex === toIndex) {
      console.log('⚠️ Invalid reorder:', fromIndex, '→', toIndex);
      return;
    }
    
    console.log('🔄 Reordering groups:', fromIndex, '→', toIndex);
    
    const updated = [...props.groupedColumns];
    const [moved] = updated.splice(fromIndex, 1);
    
    // Adjust toIndex if dragging down
    const adjustedIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
    updated.splice(adjustedIndex, 0, moved);
    
    console.log('✅ New group order:', updated);
    
    emit('reorder', fromIndex, toIndex);
    emit('update:grouped-columns', updated);
  }
  // ✅ Case 3: Unknown drag source
  else {
    console.warn('⚠️ Unknown drag source');
  }

  // Reset state
  draggedIndex.value = null;
  dropTargetIndex.value = null;
  isDraggingFromHeader.value = false;
};

const handleDragEnd = () => {
  console.log('🏁 Drag end');
  draggedIndex.value = null;
  dropTargetIndex.value = null;
  isDraggingFromHeader.value = false;
};
</script>