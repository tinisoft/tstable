<!-- TSDataGridFooter.vue -->
<template>
  <div class="ts-datagrid-footer">
    <!-- Pagination Info -->
    <div v-if="showInfo" class="ts-datagrid-footer__info">
      <slot name="info" :start-record="startRecord" :end-record="endRecord" :total-items="totalItems">
        <span class="ts-datagrid-footer__text">
          Showing <strong>{{ startRecord }}-{{ endRecord }}</strong> of <strong>{{ totalItems }}</strong> records
        </span>
      </slot>
    </div>

    <!-- Pagination Controls -->
    <div class="ts-datagrid-footer__pagination">
      <!-- First Page -->
      <button
        class="ts-datagrid-footer__button"
        :disabled="currentPage === 1 || totalPages === 0"
        @click="handleFirstPage"
        title="First Page"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M3.5 7L6 4.5v5L3.5 7z M7 4.5v5l2.5-2.5L7 4.5z" fill="currentColor" />
        </svg>
      </button>

      <!-- Previous Page -->
      <button
        class="ts-datagrid-footer__button"
        :disabled="currentPage === 1 || totalPages === 0"
        @click="handlePreviousPage"
        title="Previous Page"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M5 7l4-3v6L5 7z" fill="currentColor" />
        </svg>
      </button>

      <!-- Page Numbers - Make sure current page is highlighted correctly -->
      <div class="ts-datagrid-footer__pages">
        <button
          v-for="page in visiblePages"
          :key="`page-${page}`"
          class="ts-datagrid-footer__page"
          :class="{ 
            'ts-datagrid-footer__page--active': page === currentPage,
            'ts-datagrid-footer__page--current': page === currentPage 
          }"
          :aria-current="page === currentPage ? 'page' : undefined"
          @click="handlePageClick(page)"
        >
          {{ page }}
        </button>
      </div>

      <!-- Next Page -->
      <button
        class="ts-datagrid-footer__button"
        :disabled="currentPage >= totalPages || totalPages === 0"
        @click="handleNextPage"
        title="Next Page"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M9 7L5 4v6l4-3z" fill="currentColor" />
        </svg>
      </button>

      <!-- Last Page -->
      <button
        class="ts-datagrid-footer__button"
        :disabled="currentPage >= totalPages || totalPages === 0"
        @click="handleLastPage"
        title="Last Page"
      >
        <svg width="14" height="14" viewBox="0 0 14 14">
          <path d="M10.5 7L8 4.5v5l2.5-2.5z M7 4.5v5L4.5 7 7 4.5z" fill="currentColor" />
        </svg>
      </button>
    </div>

    <!-- Page Size Selector -->
    <div v-if="showPageSizes" class="ts-datagrid-footer__page-size">
      <label class="ts-datagrid-footer__label">
        Rows per page:
      </label>
      <select
        :value="pageSize"
        class="ts-datagrid-footer__select"
        @change="handlePageSizeChange"
      >
        <option
          v-for="size in availablePageSizes"
          :key="size"
          :value="size"
        >
          {{ size }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  pageSize: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  availablePageSizes: {
    type: Array as PropType<number[]>,
    default: () => [10, 20, 50, 100],
  },
  showInfo: {
    type: Boolean,
    default: true,
  },
  showPageSizes: {
    type: Boolean,
    default: true,
  },
  maxVisiblePages: {
    type: Number,
    default: 5,
  },
});

const emit = defineEmits<{
  (e: 'page-change', page: number): void;
  (e: 'page-size-change', size: number): void;
}>();

// Computed
const startRecord = computed(() => {
  if (props.totalItems === 0) return 0;
  return (props.currentPage - 1) * props.pageSize + 1;
});

const endRecord = computed(() => {
  return Math.min(props.currentPage * props.pageSize, props.totalItems);
});

const visiblePages = computed(() => {
  const pages: number[] = [];
  const half = Math.floor(props.maxVisiblePages / 2);
  let start = Math.max(1, props.currentPage - half);
  let end = Math.min(props.totalPages, start + props.maxVisiblePages - 1);

  if (end - start + 1 < props.maxVisiblePages) {
    start = Math.max(1, end - props.maxVisiblePages + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

// Methods
const handleFirstPage = () => {
  if (props.currentPage !== 1) {
    emit('page-change', 1);
  }
};

const handlePreviousPage = () => {
  if (props.currentPage > 1) {
    emit('page-change', props.currentPage - 1);
  }
};

const handleNextPage = () => {
  if (props.currentPage < props.totalPages) {
    emit('page-change', props.currentPage + 1);
  }
};

const handleLastPage = () => {
  if (props.currentPage !== props.totalPages) {
    emit('page-change', props.totalPages);
  }
};

const handlePageClick = (page: number) => {
  if (page !== props.currentPage) {
    emit('page-change', page);
  }
};

const handlePageSizeChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const size = parseInt(target.value, 10);
  emit('page-size-change', size);
};
</script>