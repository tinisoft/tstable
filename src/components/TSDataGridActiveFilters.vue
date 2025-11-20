<template>
  <div v-if="activeFilters.length > 0" class="ts-datagrid-active-filters">
    <div class="ts-datagrid-active-filters__container">
      <div class="ts-datagrid-active-filters__label">
        <svg width="16" height="16" viewBox="0 0 16 16">
          <path d="M2 2h12l-5 6v5l-2 1V8L2 2z" fill="currentColor" />
        </svg>
        <span>Active Filters:</span>
      </div>

      <div class="ts-datagrid-active-filters__list">
        <div
          v-for="(filter, index) in activeFilters"
          :key="`${filter.field}-${index}`"
          class="ts-datagrid-active-filters__item"
        >
          <span class="ts-datagrid-active-filters__field">
            {{ filter.columnTitle }}
          </span>
          <span class="ts-datagrid-active-filters__operator">
            {{ filter.displayValue }}
          </span>
          <button
            class="ts-datagrid-active-filters__remove"
            @click="handleRemoveFilter(filter)"
            :title="`Remove filter for ${filter.columnTitle}`"
          >
            <svg width="12" height="12" viewBox="0 0 12 12">
              <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="2" />
            </svg>
          </button>
        </div>
      </div>

      <button
        class="ts-datagrid-active-filters__clear-all"
        @click="handleClearAll"
      >
        Clear All
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ActiveFilter } from '@/types';
import { PropType } from 'vue';

const props = defineProps({
  activeFilters: {
    type: Array as PropType<ActiveFilter[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: 'remove', filter: ActiveFilter): void;
  (e: 'clear-all'): void;
}>();

const handleRemoveFilter = (filter: ActiveFilter) => {
  emit('remove', filter);
};

const handleClearAll = () => {
  emit('clear-all');
};
</script>
