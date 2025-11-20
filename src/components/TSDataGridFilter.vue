<template>
  <Teleport to="body">
    <div v-if="visible" class="ts-datagrid-filter-backdrop" @click.self="handleClose">
      <div class="ts-datagrid-filter" :style="panelStyle" @click.stop>
        <!-- Header -->
        <div class="ts-datagrid-filter__header">
          <h3 class="ts-datagrid-filter__title">
            {{ columnDef?.title || column }}
          </h3>
          <button class="ts-datagrid-filter__close" @click="handleClose" title="Close">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <path d="M3 3l10 10M13 3l-10 10" stroke="currentColor" stroke-width="1.5" fill="none" />
            </svg>
          </button>
        </div>

        <!-- Search Box -->
        <div class="ts-datagrid-filter__search">
          <svg width="14" height="14" viewBox="0 0 14 14" class="ts-datagrid-filter__search-icon">
            <circle cx="6" cy="6" r="4" fill="none" stroke="currentColor" stroke-width="1.5" />
            <path d="M9 9l3 3" stroke="currentColor" stroke-width="1.5" />
          </svg>
          <input
            v-model="searchTerm"
            type="text"
            class="ts-datagrid-filter__search-input"
            :placeholder="isODataSource ? 'Search all values on server...' : 'Search...'"
            ref="searchInput"
            @input="handleSearchInput"
          />
          <button v-if="searchTerm" class="ts-datagrid-filter__search-clear" @click="clearSearch" type="button">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.5" />
            </svg>
          </button>
        </div>

        <!-- Values Container -->
        <div class="ts-datagrid-filter__values-container">
          <!-- Select All -->
          <label class="ts-datagrid-filter__select-all">
            <input
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate.prop="isSomeSelected && !isAllSelected"
              @change="handleSelectAll"
              :disabled="loading"
            />
            <span>(Select All)</span>
            <span class="ts-datagrid-filter__count">
              {{ loading ? '...' : totalUniqueCount }}
            </span>
          </label>

          <!-- Loading State -->
          <div v-if="loading" class="ts-datagrid-filter__loading">
            <div class="ts-datagrid-filter__spinner" />
            <span>{{ searchTerm ? 'Searching server...' : 'Loading values...' }}</span>
          </div>

          <!-- Values List -->
          <div v-else class="ts-datagrid-filter__values-list">
            <!-- Blanks -->
            <label
              v-if="blanksCount > 0"
              v-show="!searchTerm || '(blanks)'.includes(searchTerm.toLowerCase())"
              class="ts-datagrid-filter__value-item"
              :class="{ 'ts-datagrid-filter__value-item--selected': blanksSelected }"
            >
              <input type="checkbox" v-model="blanksSelected" />
              <span class="ts-datagrid-filter__value-text ts-datagrid-filter__value-text--blanks">(Blanks)</span>
              <span class="ts-datagrid-filter__count">{{ blanksCount }}</span>
            </label>

            <!-- Regular Values -->
            <label
              v-for="item in displayedValues"
              :key="item.value"
              class="ts-datagrid-filter__value-item"
              :class="{ 'ts-datagrid-filter__value-item--selected': item.selected }"
            >
              <input type="checkbox" v-model="item.selected" />
              <span class="ts-datagrid-filter__value-text" :title="item.label">{{ item.label }}</span>
              <span class="ts-datagrid-filter__count">{{ item.count }}</span>
            </label>

            <!-- No Results -->
            <div v-if="displayedValues.length === 0 && blanksCount === 0" class="ts-datagrid-filter__empty">
              {{ searchTerm ? 'No matching values found' : 'No values available' }}
            </div>

            <!-- Search Info -->
            <div v-if="searchTerm && displayedValues.length > 0" class="ts-datagrid-filter__info">
              Found {{ displayedValues.length }} matching value{{ displayedValues.length !== 1 ? 's' : '' }}
            </div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="ts-datagrid-filter__footer">
          <button
            class="ts-datagrid-filter__btn ts-datagrid-filter__btn--text"
            @click="handleClear"
            :disabled="loading"
            type="button"
          >
            Clear Filter
          </button>
          <div class="ts-datagrid-filter__footer-actions">
            <button class="ts-datagrid-filter__btn ts-datagrid-filter__btn--secondary" @click="handleCancel" type="button">
              Cancel
            </button>
            <button class="ts-datagrid-filter__btn ts-datagrid-filter__btn--primary" @click="handleOK" :disabled="loading" type="button">
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ColumnDefinition, DataSourceConfig, FilterCondition, FilterOperator } from '@/types';
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import type { PropType } from 'vue';

interface UniqueValue {
  value: any;
  label: string;
  count: number;
  selected: boolean;
}

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  column: {
    type: String,
    required: true,
  },
  columns: {
    type: Array as PropType<ColumnDefinition[]>,
    required: true,
  },
  data: {
    type: Array as PropType<any[]>,
    default: () => [],
  },
  dataSource: {
    type: Object as PropType<DataSourceConfig>,
    default: null,
  },
  existingFilter: {
    type: Object as PropType<FilterCondition>,
    default: null,
  },
  position: {
    type: Object as PropType<{ x: number; y: number }>,
    default: () => ({ x: 0, y: 0 }),
  },
});

const emit = defineEmits<{
  (e: 'apply', filter: FilterCondition | null): void;
  (e: 'clear'): void;
  (e: 'close'): void;
}>();

// Refs
const searchInput = ref<HTMLInputElement>();
const loading = ref(false);
const searchTerm = ref('');
const uniqueValues = ref<UniqueValue[]>([]);
const blanksSelected = ref(false); // ✅ Default: checked
const blanksCount = ref(0);
const searchDebounceTimer = ref<number | null>(null);

// Computed
const columnDef = computed(() => {
  return props.columns.find(c => c.field === props.column);
});

const isODataSource = computed(() => {
  return props.dataSource?.type === 'odata' && props.dataSource?.url;
});

const panelStyle = computed(() => {
  const { x, y } = props.position;
  const panelWidth = 320;
  const panelMaxHeight = 480;
  const headerHeight = 50;

  let left = x - panelWidth / 2;
  let top = y + 5;

  if (left < 10) {
    left = 10;
  } else if (left + panelWidth > window.innerWidth - 10) {
    left = window.innerWidth - panelWidth - 10;
  }

  const spaceBelow = window.innerHeight - y - headerHeight;
  const spaceAbove = y - headerHeight;

  if (spaceBelow < panelMaxHeight && spaceAbove > spaceBelow) {
    top = y - panelMaxHeight - headerHeight - 5;
  }

  if (top < 10) {
    top = 10;
  }

  return {
    position: 'fixed' as const,
    top: `${top}px`,
    left: `${left}px`,
    maxHeight: `${Math.min(panelMaxHeight, window.innerHeight - top - 20)}px`,
  };
});

const displayedValues = computed(() => {
  if (!isODataSource.value && searchTerm.value) {
    const search = searchTerm.value.toLowerCase();
    return uniqueValues.value.filter(item =>
      item.label.toLowerCase().includes(search)
    );
  }
  return uniqueValues.value;
});

const totalUniqueCount = computed(() => {
  return uniqueValues.value.length + (blanksCount.value > 0 ? 1 : 0);
});

const selectedCount = computed(() => {
  const valueCount = displayedValues.value.filter(v => v.selected).length;
  const blankCount = (blanksCount.value > 0 && blanksSelected.value) ? 1 : 0;
  return valueCount + blankCount;
});

const isAllSelected = computed(() => {
  const allValuesSelected = displayedValues.value.every(v => v.selected);
  const blanksIncluded = blanksCount.value === 0 || blanksSelected.value;
  return displayedValues.value.length > 0 && allValuesSelected && blanksIncluded;
});

const isSomeSelected = computed(() => {
  return selectedCount.value > 0 && !isAllSelected.value;
});

// ✅ Handle search input with debounce for OData
const handleSearchInput = () => {
  if (!isODataSource.value) {
    return;
  }

  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value);
  }

  searchDebounceTimer.value = window.setTimeout(() => {
    loadUniqueValues(true);
  }, 300);
};

const clearSearch = () => {
  searchTerm.value = '';
  if (isODataSource.value) {
    loadUniqueValues();
  }
};

// ✅ EXCEL BEHAVIOR: Load with ALL values checked by default
const loadUniqueValues = async (isSearching = false) => {
  loading.value = true;

  try {
    let dataToProcess: any[] = [];

    if (isODataSource.value) {
      dataToProcess = await fetchDistinctValuesOData(props.column, searchTerm.value);
    } else {
      dataToProcess = props.data;
    }

    const valueMap = new Map<any, number>();
    let emptyCount = 0;

    dataToProcess.forEach(row => {
      const value = row[props.column];
      if (value === null || value === undefined || value === '') {
        emptyCount++;
      } else {
        valueMap.set(value, (valueMap.get(value) || 0) + 1);
      }
    });

    blanksCount.value = emptyCount;

    // ✅ EXCEL BEHAVIOR: Determine initial selection state
    let defaultSelected = true; // Default: all checked
    let existingSelections: Set<any> | null = null;

    if (!isSearching && props.existingFilter) {
      // If there's an existing filter, use those selections
      if (props.existingFilter.operator === FilterOperator.In && Array.isArray(props.existingFilter.value)) {
        existingSelections = new Set(props.existingFilter.value.filter(v => v !== null && v !== ''));
        blanksSelected.value = props.existingFilter.value.some(v => v === null || v === '');
        defaultSelected = false; // Use explicit selections
      }
    } else if (!isSearching) {
      // First time opening: all checked
      blanksSelected.value = true;
    }

    // ✅ Build unique values
    uniqueValues.value = Array.from(valueMap.entries())
      .map(([value, count]) => ({
        value,
        label: formatValue(value),
        count,
        // ✅ EXCEL BEHAVIOR: All checked by default, or use existing filter
        selected: defaultSelected ? true : (existingSelections?.has(value) || false)
      }))
      .sort((a, b) => {
        // Sort alphabetically
        if (typeof a.value === 'number' && typeof b.value === 'number') {
          return a.value - b.value;
        }
        return a.label.localeCompare(b.label);
      });

  } catch (error) {
    console.error('Failed to load unique values:', error);
  } finally {
    loading.value = false;
  }
};

// ✅ Fetch distinct values from OData
const fetchDistinctValuesOData = async (field: string, searchQuery: string = ''): Promise<any[]> => {
  if (!props.dataSource?.url) return [];

  console.log('🔍 Fetching distinct values for:', field, searchQuery ? `(search: "${searchQuery}")` : '');

  try {
    const applyResult = await tryApplyGroupBy(field, searchQuery);
    if (applyResult) {
      console.log('✅ Using $apply groupby - got', applyResult.length, 'distinct values');
      return applyResult;
    }
  } catch (error) {
    console.log('⚠️ $apply not supported, trying fallback');
  }

  try {
    const sampleResult = await fetchSampleData(field, searchQuery);
    console.log('✅ Using filtered sample - got', sampleResult.length, 'rows');
    return sampleResult;
  } catch (error) {
    console.error('❌ Failed to fetch distinct values:', error);
    return [];
  }
};

const tryApplyGroupBy = async (field: string, searchQuery: string): Promise<any[] | null> => {
  if (!props.dataSource?.url) return null;

  let applyQuery = `groupby((${field}),aggregate($count as Count))`;

  if (searchQuery) {
    const filterExpr = `contains(tolower(${field}), '${searchQuery.toLowerCase().replace(/'/g, "''")}')`;
    applyQuery = `filter(${filterExpr})/${applyQuery}`;
  }

  const params = new URLSearchParams({
    '$apply': applyQuery,
    '$orderby': field,
  });

  const url = `${props.dataSource.url}${props.dataSource.url.includes('?') ? '&' : '?'}${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...props.dataSource.fetchOptions?.headers
    },
    ...props.dataSource.fetchOptions
  });

  if (!response.ok) {
    return null;
  }

  const result = await response.json();
  return (result.value || []).map((item: any) => ({ [field]: item[field] }));
};

const fetchSampleData = async (field: string, searchQuery: string): Promise<any[]> => {
  if (!props.dataSource?.url) return [];

  const params = new URLSearchParams({
    '$select': field,
    '$top': '5000',
    '$orderby': field
  });

  if (searchQuery) {
    const filterExpr = `contains(tolower(${field}), '${searchQuery.toLowerCase().replace(/'/g, "''")}')`;
    params.append('$filter', filterExpr);
  }

  const url = `${props.dataSource.url}${props.dataSource.url.includes('?') ? '&' : '?'}${params}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      ...props.dataSource.fetchOptions?.headers
    },
    ...props.dataSource.fetchOptions
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const result = await response.json();
  return result.value || result.data || [];
};

const formatValue = (value: any): string => {
  if (value === true) return 'True';
  if (value === false) return 'False';
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === 'number') {
    return value.toLocaleString();
  }
  return String(value);
};

// ✅ Select All
const handleSelectAll = (event: Event) => {
  const checked = (event.target as HTMLInputElement).checked;

  displayedValues.value.forEach(item => {
    item.selected = checked;
  });

  if (!searchTerm.value && blanksCount.value > 0) {
    blanksSelected.value = checked;
  }
};

// ✅ Clear = Remove filter = Show all (no filter applied)
const handleClear = () => {
  emit('apply', null);
  emit('close');
};

const handleCancel = () => {
  emit('close');
};

// ✅ EXCEL BEHAVIOR: OK applies the filter
const handleOK = () => {
  const selectedValues: any[] = [];

  // Add selected regular values
  uniqueValues.value.forEach(item => {
    if (item.selected) {
      selectedValues.push(item.value);
    }
  });

  // Add blanks if selected
  if (blanksSelected.value && blanksCount.value > 0) {
    selectedValues.push(null);
    selectedValues.push('');
  }

  const totalPossibleValues = uniqueValues.value.length + (blanksCount.value > 0 ? 1 : 0);
  const currentSelectionCount = selectedValues.length + (blanksSelected.value && blanksCount.value > 0 ? 1 : 0);

  // ✅ EXCEL LOGIC:
  // - All selected → No filter (null)
  // - Some selected → Apply "in" filter
  // - None selected → Filter to empty (rare edge case)

  if (selectedValues.length === 0) {
    // Nothing selected → show nothing (empty result)
    console.log('📭 Nothing selected - filtering to empty result');
    emit('apply', {
      field: props.column,
      operator: FilterOperator.In,
      value: [],
    });
  } else if (currentSelectionCount === totalPossibleValues) {
    // Everything selected → remove filter (show all)
    console.log('📋 Everything selected - removing filter');
    emit('apply', null);
  } else {
    // Some selected → apply filter
    console.log('🔍 Filtering to', selectedValues.length, 'values');
    emit('apply', {
      field: props.column,
      operator: FilterOperator.In,
      value: selectedValues,
    });
  }

  emit('close');
};

const handleClose = () => {
  emit('close');
};

onMounted(async () => {
  await loadUniqueValues();
  await nextTick();
  searchInput.value?.focus();
});

watch(() => props.data.length, () => {
  if (props.visible && !isODataSource.value) {
    loadUniqueValues();
  }
});
</script>