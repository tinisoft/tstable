<template>
  <div class="ts-datagrid-toolbar">
    <!-- Left Section -->
    <div class="ts-datagrid-toolbar__left">
      <slot name="prepend" />

      <!-- Undo -->
      <button v-if="showUndoRedo" class="ts-datagrid-toolbar__button" :disabled="!canUndo" @click="emit('undo')"
        title="Undo (Ctrl+Z)">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 2v4l3-3-3-3M8 6C4.5 6 2 8.5 2 12h2c0-2.2 1.8-4 4-4" stroke="currentColor" stroke-width="1.5"
            fill="none" />
        </svg>
        <span>Undo</span>
      </button>

      <!-- Redo -->
      <button v-if="showUndoRedo" class="ts-datagrid-toolbar__button" :disabled="!canRedo" @click="emit('redo')"
        title="Redo (Ctrl+Y)">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 2v4l-3-3 3-3M8 6c3.5 0 6 2.5 6 6h-2c0-2.2-1.8-4-4-4" stroke="currentColor" stroke-width="1.5"
            fill="none" />
        </svg>
        <span>Redo</span>
      </button>

      <!-- Refresh -->
      <button v-if="canRefresh" class="ts-datagrid-toolbar__button" @click="emit('refresh')" title="Refresh">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path
            d="M13.65 2.35A7.96 7.96 0 008 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z"
            fill="currentColor" />
        </svg>
        <span>Refresh</span>
      </button>

      <!-- Add -->
      <button v-if="allowAdding" class="ts-datagrid-toolbar__button ts-datagrid-toolbar__button--primary"
        @click="emit('add')" title="Add New">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" fill="none" />
        </svg>
        <span>Add</span>
      </button>

      <!-- Delete -->
      <button v-if="allowDeleting && selectedCount > 0"
        class="ts-datagrid-toolbar__button ts-datagrid-toolbar__button--danger" @click="emit('delete')"
        title="Delete Selected">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M3 4h10l-1 10H4L3 4zM6 2h4M2 4h12" stroke="currentColor" stroke-width="1.5" fill="none" />
        </svg>
        <span>Delete ({{ selectedCount }})</span>
      </button>
    </div>

    <!-- Center Section -->
    <div class="ts-datagrid-toolbar__center">
      <slot name="center" />

      <!-- Search -->
      <div v-if="showSearch" class="ts-datagrid-toolbar__search">
        <input v-model="searchQuery" type="text" class="ts-datagrid-toolbar__search-input" placeholder="Search..."
          @input="handleSearchInput" />
        <svg v-if="!searchQuery" class="ts-datagrid-toolbar__search-icon" width="16" height="16" viewBox="0 0 16 16">
          <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" fill="none" stroke-width="1.5" />
          <path d="M10 10l4 4" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <button v-else class="ts-datagrid-toolbar__search-clear" @click="clearSearch" title="Clear Search">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="2" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Right Section -->
    <div class="ts-datagrid-toolbar__right">
      <!-- Custom Actions -->
      <button v-for="action in customActions" :key="action.id || action.text" class="ts-datagrid-toolbar__button"
        :class="action.className" :disabled="isActionDisabled(action)" @click="emit('custom-action', action)"
        :title="action.tooltip">
        <component v-if="action.icon" :is="action.icon" />
        <span v-if="action.text">{{ action.text }}</span>
      </button>

      <!-- Export Dropdown -->
      <div v-if="canExport" class="ts-datagrid-toolbar__dropdown" ref="exportDropdownRef">
        <button class="ts-datagrid-toolbar__button" @click.stop="toggleExportMenu" title="Export">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 1v10M5 8l3 3 3-3M2 13h12" stroke="currentColor" stroke-width="1.5" fill="none" />
          </svg>
          <span>Export</span>
          <svg width="10" height="10" viewBox="0 0 10 10" class="ts-datagrid-toolbar__caret">
            <path d="M2 3l3 3 3-3" fill="currentColor" />
          </svg>
        </button>

        <Teleport to="body">
          <div v-if="exportMenuVisible" class="ts-datagrid-toolbar__dropdown-menu" :style="exportMenuStyle" @click.stop>
            <button class="ts-datagrid-toolbar__dropdown-item" @click="handleExport('csv')">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" fill="none" />
                <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" />
              </svg>
              Export to CSV
            </button>
            <button class="ts-datagrid-toolbar__dropdown-item" @click="handleExport('excel')">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <rect x="3" y="2" width="10" height="12" rx="1" stroke="currentColor" fill="none" />
                <path d="M6 5l4 4M10 5l-4 4" stroke="currentColor" />
              </svg>
              Export to Excel
            </button>
            <button class="ts-datagrid-toolbar__dropdown-item" @click="handleExport('pdf')">
              <svg width="16" height="16" viewBox="0 0 16 16">
                <path d="M4 2h8l2 2v10H4V2z" stroke="currentColor" fill="none" />
                <path d="M12 2v3h3" stroke="currentColor" fill="none" />
              </svg>
              Export to PDF
            </button>
          </div>
        </Teleport>
      </div>

      <!-- Column Chooser -->
      <button v-if="showColumnChooser" class="ts-datagrid-toolbar__button" @click="emit('column-chooser')"
        title="Choose Columns">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M2 3h12M2 8h12M2 13h12" stroke="currentColor" stroke-width="1.5" fill="none" />
          <circle cx="13" cy="3" r="2" fill="currentColor" />
        </svg>
        <span>Columns</span>
      </button>

      <slot name="append" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ToolbarAction } from '@/types';
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { PropType, CSSProperties } from 'vue';

const props = defineProps({
  selectedCount: { type: Number, default: 0 },
  canExport: { type: Boolean, default: true },
  canRefresh: { type: Boolean, default: true },
  allowAdding: { type: Boolean, default: true },
  allowDeleting: { type: Boolean, default: true },
  showSearch: { type: Boolean, default: true },
  showColumnChooser: { type: Boolean, default: true },
  customActions: {
    type: Array as PropType<ToolbarAction[]>,
    default: () => [],
  },
  canUndo: { type: Boolean, default: false },
  canRedo: { type: Boolean, default: false },
  showUndoRedo: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (e: 'export', format: string): void;
  (e: 'refresh'): void;
  (e: 'add'): void;
  (e: 'delete'): void;
  (e: 'search', query: string): void;
  (e: 'column-chooser'): void;
  (e: 'custom-action', action: ToolbarAction): void;
  (e: 'undo'): void;
  (e: 'redo'): void;

}>();

const searchQuery = ref('');
const exportMenuVisible = ref(false);
const exportDropdownRef = ref<HTMLDivElement>();

const exportMenuStyle = computed<CSSProperties>(() => {
  if (!exportDropdownRef.value) {
    return { display: 'none' };
  }

  const rect = exportDropdownRef.value.getBoundingClientRect();
  return {
    position: 'fixed',
    top: `${rect.bottom + 4}px`,
    left: `${rect.left}px`,
    zIndex: 9999,
  };
});

const handleSearchInput = () => {
  emit('search', searchQuery.value.trim());
};

const clearSearch = () => {
  searchQuery.value = '';
  emit('search', '');
};

const toggleExportMenu = () => {
  exportMenuVisible.value = !exportMenuVisible.value;
};

const handleExport = (format: string) => {
  emit('export', format);
  exportMenuVisible.value = false;
};

const handleClickOutside = (event: MouseEvent) => {
  if (exportMenuVisible.value &&
    exportDropdownRef.value &&
    !exportDropdownRef.value.contains(event.target as Node)) {
    exportMenuVisible.value = false;
  }
};

const isActionDisabled = (action: ToolbarAction): boolean => {
  return typeof action.disabled === 'function' 
    ? action.disabled() 
    : action.disabled ?? false;
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>