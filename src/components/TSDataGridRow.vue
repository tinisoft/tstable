<template>
  <div class="ts-datagrid-row" style="display: flex; width: 100%;">
    <!-- Selection Cell -->
    <div
      v-if="selectionState && selectionState.mode !== 'none'"
      class="ts-datagrid-body__cell ts-datagrid-body__cell--selection"
      style="width: 40px; min-width: 40px; max-width: 40px; flex: none;"
      @click.stop
    >
      <input
        type="checkbox"
        class="ts-datagrid-body__checkbox"
        :checked="isSelected"
        @change="handleSelect($event)"
        :title="isSelected ? 'Deselect row' : 'Select row'"
      />
    </div>

    <!-- Data Cells -->
    <TSDataGridCell
      v-for="column in columns"
      :key="column.field"
      :column="column"
      :row="row"
      :row-key="row[keyField]"
      :value="row[column.field]"
      :editing="isEditing(column.field)"
      @edit="handleEdit(column.field)"
      @save="handleSave(column.field, $event)"
      @cancel="handleCancel"
      @click="handleCellClick(column)"
    >
      <template #default="{ value }">
        <slot :name="`cell-${column.field}`" :row="row" :column="column" :value="value">
          {{ formatValue(value, column) }}
        </slot>
      </template>
    </TSDataGridCell>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';
import TSDataGridCell from './TSDataGridCell.vue';
import { ColumnDefinition } from '@/types';

const props = defineProps({
  row: {
    type: Object as PropType<any>,
    required: true,
  },
  columns: {
    type: Array as PropType<ColumnDefinition[]>,
    required: true,
  },
  rowIndex: {
    type: Number,
    required: true,
  },
  keyField: {
    type: String,
    default: 'id',
  },
  selectionState: {
    type: Object as PropType<any>,
    default: null,
  },
  editingState: {
    type: Object as PropType<any>,
    default: null,
  },
});

const emit = defineEmits<{
  (e: 'select', row: any, selected: boolean): void;
  (e: 'cell-click', row: any, column: ColumnDefinition): void;
  (e: 'cell-edit', rowKey: any, field: string): void;
  (e: 'cell-save', rowKey: any, field: string, value: any): void;
  (e: 'cell-cancel'): void;
}>();

// Computed
const isSelected = computed(() => {
  return props.selectionState?.isSelected(props.row) || false;
});

// Methods
const isEditing = (field: string): boolean => {
  // ✅ Call isCellEditing with rowKey and field
  const editing = props.editingState?.isCellEditing?.(props.row[props.keyField], field) || false;
  return editing;
};

const formatValue = (value: any, column: ColumnDefinition): string | number => {
  if (value == null) return '';
  
  if (column.formatter) {
    const formatted = column.formatter(value, props.row, column);
    if (typeof formatted === 'object') {
      return String(formatted);
    }
    return formatted;
  }
  
  switch (column.type) {
    case 'date':
      return new Date(value).toLocaleDateString();
    case 'datetime':
      return new Date(value).toLocaleString();
    case 'boolean':
      return value ? 'Yes' : 'No';
    case 'number':
      return Number(value).toLocaleString();
    default:
      return String(value);
  }
};

const handleSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('select', props.row, target.checked);
};

const handleCellClick = (column: ColumnDefinition) => {
  emit('cell-click', props.row, column);
};

const handleEdit = (field: string) => {
  emit('cell-edit', props.row[props.keyField], field);
};

const handleSave = (field: string, value: any) => {
  emit('cell-save', props.row[props.keyField], field, value);
};

const handleCancel = () => {
  emit('cell-cancel');
};
</script>