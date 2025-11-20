<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div 
        v-if="visible" 
        class="ts-datagrid-column-chooser" 
        @click="handleBackdropClick"
        @keydown.esc="handleClose"
        tabindex="-1"
        ref="modalRef"
      >
        <div class="ts-datagrid-column-chooser__panel" @click.stop>
          <!-- Header -->
          <div class="ts-datagrid-column-chooser__header">
            <h3 class="ts-datagrid-column-chooser__title">Choose Columns</h3>
            <button 
              class="ts-datagrid-column-chooser__close" 
              @click="handleClose" 
              type="button"
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="2" />
              </svg>
            </button>
          </div>

          <!-- Search -->
          <div class="ts-datagrid-column-chooser__search">
            <input 
              v-model="searchTerm" 
              type="text" 
              class="ts-datagrid-column-chooser__search-input"
              placeholder="Search columns..." 
            />
            <svg 
              v-if="!searchTerm" 
              class="ts-datagrid-column-chooser__search-icon" 
              width="16" 
              height="16"
              viewBox="0 0 16 16"
            >
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" fill="none" stroke-width="1.5" />
              <path d="M10 10l4 4" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </div>

          <!-- Actions -->
          <div class="ts-datagrid-column-chooser__actions">
            <button 
              class="ts-datagrid-column-chooser__action" 
              @click="handleSelectAll"
              type="button"
            >
              Select All
            </button>
            <button 
              class="ts-datagrid-column-chooser__action" 
              @click="handleDeselectAll"
              type="button"
            >
              Deselect All
            </button>
            <button 
              class="ts-datagrid-column-chooser__action" 
              @click="handleReset"
              type="button"
            >
              Reset
            </button>
          </div>

          <!-- Column List -->
          <div class="ts-datagrid-column-chooser__list">
            <div 
              v-for="(column, index) in displayedColumns" 
              :key="column.field" 
              class="ts-datagrid-column-chooser__item"
              :class="{ 
                'ts-datagrid-column-chooser__item--dragging': draggedIndex === index,
                'ts-datagrid-column-chooser__item--drag-over': dropTargetIndex === index && draggedIndex !== index
              }"
              :draggable="!column.locked" 
              @dragstart="handleDragStart($event, index)"
              @dragover="handleDragOver($event, index)" 
              @drop="handleDrop($event, index)" 
              @dragend="handleDragEnd"
              @dragleave="handleDragLeave"
            >
              <!-- Drag Handle -->
              <div 
                v-if="!column.locked" 
                class="ts-datagrid-column-chooser__drag-handle"
              >
                <svg width="14" height="14" viewBox="0 0 14 14">
                  <path d="M2 3h10M2 7h10M2 11h10" stroke="currentColor" stroke-width="1.5" fill="none" />
                </svg>
              </div>
              <div 
                v-else 
                class="ts-datagrid-column-chooser__drag-handle ts-datagrid-column-chooser__drag-handle--disabled" 
              />

              <!-- Checkbox -->
              <label class="ts-datagrid-column-chooser__label">
                <input 
                  type="checkbox" 
                  class="ts-datagrid-column-chooser__checkbox"
                  :checked="isColumnVisible(column.field)" 
                  :disabled="column.locked"
                  @change="handleToggle(column.field)" 
                />
                <span class="ts-datagrid-column-chooser__name">
                  {{ column.title || column.field }}
                </span>
                <span 
                  v-if="column.locked" 
                  class="ts-datagrid-column-chooser__locked"
                  title="This column is locked and cannot be hidden"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M9 5V3a3 3 0 00-6 0v2H2v6h8V5H9zM4 3a2 2 0 014 0v2H4V3z" fill="currentColor" />
                  </svg>
                </span>
              </label>
            </div>

            <!-- Empty State -->
            <div 
              v-if="displayedColumns.length === 0" 
              class="ts-datagrid-column-chooser__empty"
            >
              <p>No columns found</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="ts-datagrid-column-chooser__footer">
            <div class="ts-datagrid-column-chooser__info">
              {{ visibleCount }} of {{ columns.length }} columns visible
            </div>
            <div class="ts-datagrid-column-chooser__buttons">
              <button 
                class="ts-datagrid-column-chooser__button ts-datagrid-column-chooser__button--cancel"
                @click="handleClose"
                type="button"
              >
                Cancel
              </button>
              <button 
                class="ts-datagrid-column-chooser__button ts-datagrid-column-chooser__button--apply"
                @click="handleApply"
                type="button"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ColumnDefinition } from '@/types';
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  columns: {
    type: Array as PropType<ColumnDefinition[]>,
    required: true,
  },
  visibleColumns: {
    type: Array as PropType<ColumnDefinition[]>,
    default: () => [],
  },
  columnOrder: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'apply', changes: { visibility: Record<string, boolean>; order: string[] }): void;
}>();

// Refs
const modalRef = ref<HTMLDivElement>();
const searchTerm = ref('');
const localVisibility = ref<Record<string, boolean>>({});
const localOrder = ref<string[]>([]);
const draggedIndex = ref<number | null>(null);
const dropTargetIndex = ref<number | null>(null);
const initialState = ref<Record<string, boolean>>({});
const initialOrder = ref<string[]>([]);

// Computed
const orderedColumns = computed(() => {
  return localOrder.value
    .map(field => props.columns.find(col => col.field === field))
    .filter(Boolean) as ColumnDefinition[];
});

const displayedColumns = computed(() => {
  const columns = orderedColumns.value;
  
  if (!searchTerm.value.trim()) {
    return columns;
  }
  
  const term = searchTerm.value.trim().toLowerCase();
  return columns.filter(col => 
    (col.title || col.field).toLowerCase().includes(term)
  );
});

const visibleCount = computed(() => {
  return Object.values(localVisibility.value).filter(v => v).length;
});

// Methods
const isColumnVisible = (field: string): boolean => {
  return localVisibility.value[field] ?? true;
};

const handleToggle = (field: string) => {
  const column = props.columns.find(c => c.field === field);
  if (column && !column.locked) {
    localVisibility.value[field] = !localVisibility.value[field];
  }
};

const handleSelectAll = () => {
  props.columns.forEach(col => {
    if (!col.locked) {
      localVisibility.value[col.field] = true;
    }
  });
};

const handleDeselectAll = () => {
  props.columns.forEach(col => {
    if (!col.locked) {
      localVisibility.value[col.field] = false;
    }
  });
};

const handleReset = () => {
  localVisibility.value = { ...initialState.value };
  localOrder.value = [...initialOrder.value];
  searchTerm.value = '';
};

const handleBackdropClick = (event: MouseEvent) => {
  // Only close if clicking the backdrop itself (not propagated from children)
  if (event.target === event.currentTarget) {
    handleClose();
  }
};

const handleClose = () => {
  console.log('🚪 Column chooser closing...');
  // Reset to initial state on cancel
  localVisibility.value = { ...initialState.value };
  localOrder.value = [...initialOrder.value ];
  searchTerm.value = '';
  emit('close');
};

const handleApply = () => {
  console.log('✅ Column chooser applying changes...');
  
  // Update initial states for next open
  initialState.value = { ...localVisibility.value };
  initialOrder.value = [...localOrder.value];
  
  // Emit apply event
  emit('apply', {
    visibility: { ...localVisibility.value },
    order: [...localOrder.value]
  });
  
  // Close is handled by parent after apply
};

// Drag & Drop
const handleDragStart = (event: DragEvent, index: number) => {
  draggedIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
};

const handleDragOver = (event: DragEvent, index: number) => {
  event.preventDefault();
  dropTargetIndex.value = index;
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
};

const handleDragLeave = () => {
  dropTargetIndex.value = null;
};

const handleDrop = (event: DragEvent, toIndex: number) => {
  event.preventDefault();

  if (draggedIndex.value !== null && draggedIndex.value !== toIndex) {
    const fromIndex = draggedIndex.value;
    
    const newOrder = [...localOrder.value];
    const [movedField] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, movedField);
    localOrder.value = newOrder;
  }

  draggedIndex.value = null;
  dropTargetIndex.value = null;
};

const handleDragEnd = () => {
  draggedIndex.value = null;
  dropTargetIndex.value = null;
};

// ESC key handler
const handleEscKey = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    handleClose();
  }
};

// Initialize local state when modal opens
watch(() => props.visible, (visible) => {
  if (visible) {
    console.log('👁️ Column chooser opened');
    
    // Initialize visibility state
    localVisibility.value = {};
    props.columns.forEach(col => {
      localVisibility.value[col.field] = props.visibleColumns.some(vc => vc.field === col.field);
    });
    
    // Initialize order
    localOrder.value = props.columnOrder.length > 0 
      ? [...props.columnOrder] 
      : props.columns.map(c => c.field);
    
    // Store initial states
    initialState.value = { ...localVisibility.value };
    initialOrder.value = [...localOrder.value];
    
    searchTerm.value = '';
    
    // Focus the modal for ESC key
    nextTick(() => {
      modalRef.value?.focus();
    });
  }
}, { immediate: true });

onMounted(() => {
  document.addEventListener('keydown', handleEscKey);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscKey);
});
</script>