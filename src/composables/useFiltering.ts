/**
 * @fileoverview Enhanced filtering composable
 * @module composables/useFiltering
 */

import { ref, computed } from 'vue';
import type {
  FilterCondition,
  ActiveFilter,
  FilterState,
  ColumnDefinition,
  GridEmit,
} from '../types';
import { debounce } from '../utils/performance';

export function useFiltering(
  data: () => any[],
  columns?: () => ColumnDefinition[],
  emit?: GridEmit
) {
  const filters = ref<Map<string, FilterCondition>>(new Map());
  const quickFilter = ref<string>('');
  const filterDebounce = ref(300);

  const activeFilters = computed<ActiveFilter[]>(() => {
    const active: ActiveFilter[] = [];

    filters.value.forEach((condition) => {
      const column = columns?.().find((c) => c.field === condition.field);
      active.push({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        displayValue: createDisplayValue(condition),
        columnTitle: column?.title || (condition.field as string),
        removable: true,
        column,
        caseSensitive: condition.caseSensitive,
        dataType: condition.dataType,
        value2: condition.value2,
        customFilter: condition.customFilter,
      });
    });

    return active;
  });

  const allFilters = computed(() => {
    return Array.from(filters.value.values());
  });

  const filterState = computed<FilterState>(() => ({
    filters: allFilters.value,
    activeFilters: activeFilters.value,
    quickFilter: quickFilter.value,
  }));

  const hasFilters = computed(() => filters.value.size > 0 || quickFilter.value.length > 0);
  const filterCount = computed(() => filters.value.size);

  // ===== UPDATE FILTER =====
  const updateFilter = (field: string, filter: FilterCondition) => {
    filters.value.set(field, filter);
    emitFilterChanged();
  };

  // ===== REMOVE FILTER =====
  const removeFilter = (filter: ActiveFilter) => {
    filters.value.delete(filter.field as string);
    emitFilterChanged();
  };

  // ===== REMOVE FILTER BY FIELD =====
  const removeFilterByField = (field: string) => {
    filters.value.delete(field);
    emitFilterChanged();
  };

  // ===== CLEAR FILTERS =====
  const clearFilters = () => {
    filters.value.clear();
    quickFilter.value = '';

    // Emit filter-cleared event
    emit?.('filter-cleared');

    // Emit filter-changed event with empty arrays
    emit?.('filter-changed', {
      filters: [],
      activeFilters: [],
    });

    // Emit state-changed event
    emit?.('state-changed', {
      state: {
        filters: [],
        activeFilters: [],
        quickFilter: '',
      },
    });
  };

  // ===== CLEAR FIELD FILTER =====
  const clearFieldFilter = (field: string) => {
    filters.value.delete(field);
    emitFilterChanged();
  };

  // ===== HAS FILTER =====
  const hasFilter = (field: string): boolean => {
    return filters.value.has(field);
  };

  // ===== GET FILTER =====
  const getFilter = (field: string): FilterCondition | undefined => {
    return filters.value.get(field);
  };

  // ===== SET FILTERS =====
  const setFilters = (filterList: FilterCondition[]) => {
    filters.value.clear();
    filterList.forEach((filter) => {
      filters.value.set(filter.field as string, filter);
    });
    emitFilterChanged();
  };

  // ===== ADD FILTER =====
  const addFilter = (filter: FilterCondition) => {
    filters.value.set(filter.field as string, filter);
    emitFilterChanged();
  };

  // ===== UPDATE MULTIPLE FILTERS =====
  const updateFilters = (filterList: FilterCondition[]) => {
    filterList.forEach((filter) => {
      filters.value.set(filter.field as string, filter);
    });
    emitFilterChanged();
  };

  // ===== TOGGLE FILTER =====
  const toggleFilter = (field: string, filter: FilterCondition) => {
    if (hasFilter(field)) {
      removeFilterByField(field);
    } else {
      updateFilter(field, filter);
    }
  };

  // ===== GET FILTERED DATA =====
  const getFilteredData = computed(() => {
    let result = data();

    // Apply column filters
    if (filters.value.size > 0) {
      result = result.filter((row) => {
        return allFilters.value.every((filter) => {
          return applyFilterCondition(row, filter);
        });
      });
    }

    // Apply quick filter
    if (quickFilter.value.trim()) {
      const searchTerm = quickFilter.value.toLowerCase().trim();
      result = result.filter((row) => {
        const cols = columns?.() || [];
        return cols.some((col) => {
          if (col.searchable === false) return false;

          const value = row[col.field as string];
          if (value == null) return false;

          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }

    return result;
  });

  // ===== APPLY FILTER CONDITION =====
  const applyFilterCondition = (row: any, condition: FilterCondition): boolean => {
    const value = row[condition.field as string];
    const filterValue = condition.value;
    const caseSensitive = condition.caseSensitive ?? false;

    // Custom filter function
    if (condition.customFilter) {
      return condition.customFilter(value, filterValue);
    }

    switch (condition.operator) {
      case 'equals':
        return caseSensitive
          ? value === filterValue
          : String(value ?? '').toLowerCase() === String(filterValue ?? '').toLowerCase();

      case 'notEquals':
        return caseSensitive
          ? value !== filterValue
          : String(value ?? '').toLowerCase() !== String(filterValue ?? '').toLowerCase();

      case 'contains':
        if (value == null) return false;
        return caseSensitive
          ? String(value).includes(String(filterValue))
          : String(value).toLowerCase().includes(String(filterValue).toLowerCase());

      case 'notContains':
        if (value == null) return true;
        return caseSensitive
          ? !String(value).includes(String(filterValue))
          : !String(value).toLowerCase().includes(String(filterValue).toLowerCase());

      case 'startsWith':
        if (value == null) return false;
        return caseSensitive
          ? String(value).startsWith(String(filterValue))
          : String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());

      case 'endsWith':
        if (value == null) return false;
        return caseSensitive
          ? String(value).endsWith(String(filterValue))
          : String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());

      case 'greaterThan':
        return Number(value) > Number(filterValue);

      case 'greaterThanOrEqual':
        return Number(value) >= Number(filterValue);

      case 'lessThan':
        return Number(value) < Number(filterValue);

      case 'lessThanOrEqual':
        return Number(value) <= Number(filterValue);

      case 'between':
        const num = Number(value);
        return num >= Number(filterValue) && num <= Number(condition.value2);

      case 'in':
        if (!Array.isArray(filterValue)) return false;

        // ✅ PROFESSIONAL: Empty array = no matches (filter out everything)
        if (filterValue.length === 0) return false;

        // Handle null/empty values
        if (value === null || value === undefined || value === '') {
          return (
            filterValue.includes(null) ||
            filterValue.includes('') ||
            filterValue.includes(undefined)
          );
        }

        return filterValue.includes(value);

      case 'notIn':
        if (!Array.isArray(filterValue)) return true;
        if (value === null || value === undefined || value === '') {
          return !(
            filterValue.includes(null) ||
            filterValue.includes('') ||
            filterValue.includes(undefined)
          );
        }
        return !filterValue.includes(value);

      case 'isNull':
        return value === null || value === undefined;

      case 'isNotNull':
        return value !== null && value !== undefined;

      case 'isEmpty':
        return value === null || value === undefined || value === '';

      case 'isNotEmpty':
        return value !== null && value !== undefined && value !== '';

      case 'today':
        return isToday(value);

      case 'yesterday':
        return isYesterday(value);

      case 'thisWeek':
        return isThisWeek(value);

      case 'lastWeek':
        return isLastWeek(value);

      case 'thisMonth':
        return isThisMonth(value);

      case 'lastMonth':
        return isLastMonth(value);

      case 'thisYear':
        return isThisYear(value);

      case 'lastYear':
        return isLastYear(value);

      case 'dateRange':
        return isInDateRange(value, filterValue, condition.value2);

      default:
        return true;
    }
  };

  // ===== DATE HELPERS =====
  const toDate = (value: any): Date | null => {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  const isToday = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;
    return isSameDay(date, new Date());
  };

  const isYesterday = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date, yesterday);
  };

  const isThisWeek = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return date >= weekStart && date <= weekEnd;
  };

  const isLastWeek = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;

    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return date >= weekStart && date <= weekEnd;
  };

  const isThisMonth = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;

    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  };

  const isLastMonth = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;

    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(now.getMonth() - 1);

    return (
      date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth()
    );
  };

  const isThisYear = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;

    const now = new Date();
    return date.getFullYear() === now.getFullYear();
  };

  const isLastYear = (value: any): boolean => {
    const date = toDate(value);
    if (!date) return false;

    const now = new Date();
    return date.getFullYear() === now.getFullYear() - 1;
  };

  const isInDateRange = (value: any, start: any, end: any): boolean => {
    const date = toDate(value);
    if (!date) return false;

    const startDate = toDate(start);
    const endDate = toDate(end);

    if (!startDate || !endDate) return false;

    return date >= startDate && date <= endDate;
  };

  // ===== FORMAT VALUE =====
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '(empty)';
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    if (value instanceof Date) return value.toLocaleDateString();
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  // ===== CREATE DISPLAY VALUE =====
  const createDisplayValue = (cond: FilterCondition): string => {
    if (cond.operator === 'in' && Array.isArray(cond.value)) {
      const count = cond.value.filter((v) => v !== null && v !== '').length;
      const hasBlanks = cond.value.some((v) => v === null || v === '');

      if (count === 0 && hasBlanks) {
        return '= (Blanks)';
      } else if (count <= 2) {
        const labels = cond.value.filter((v) => v !== null && v !== '').map(formatValue);
        if (hasBlanks) labels.push('(Blanks)');
        return `= ${labels.join(', ')}`;
      } else {
        const parts = [`${count} selected`];
        if (hasBlanks) parts.push('(Blanks)');
        return parts.join(', ');
      }
    }

    if (cond.operator === 'between') {
      return `${formatValue(cond.value)} - ${formatValue(cond.value2)}`;
    }

    // Date operators with no value
    const noValueOperators = [
      'today',
      'yesterday',
      'thisWeek',
      'lastWeek',
      'thisMonth',
      'lastMonth',
      'thisYear',
      'lastYear',
    ];
    if (noValueOperators.includes(cond.operator)) {
      return '';
    }

    // Null/Empty operators
    const nullOperators = ['isNull', 'isNotNull', 'isEmpty', 'isNotEmpty'];
    if (nullOperators.includes(cond.operator)) {
      return '';
    }

    return formatValue(cond.value);
  };

  // ===== EMIT FILTER CHANGED =====
  const emitFilterChanged = debounce(() => {
    // Emit filter-changed event (kebab-case)
    emit?.('filter-changed', {
      filters: allFilters.value,
      activeFilters: activeFilters.value,
    });

    // Emit state-changed event (kebab-case)
    emit?.('state-changed', {
      state: {
        filters: allFilters.value,
        activeFilters: activeFilters.value,
        quickFilter: quickFilter.value,
      },
    });
  }, filterDebounce.value);

  // ===== GET UNIQUE VALUES =====
  const getUniqueValues = (field: string): any[] => {
    const values = new Set<any>();

    data().forEach((row) => {
      const value = row[field];
      values.add(value);
    });

    return Array.from(values).sort((a, b) => {
      if (a === null || a === undefined) return 1;
      if (b === null || b === undefined) return -1;
      if (typeof a === 'string' && typeof b === 'string') {
        return a.localeCompare(b);
      }
      return a < b ? -1 : a > b ? 1 : 0;
    });
  };

  // ===== GET UNIQUE VALUES WITH COUNT =====
  const getUniqueValuesWithCount = (
    field: string
  ): Array<{ value: any; count: number; label: string }> => {
    const valueCounts = new Map<any, number>();

    data().forEach((row) => {
      const value = row[field];
      valueCounts.set(value, (valueCounts.get(value) || 0) + 1);
    });

    return Array.from(valueCounts.entries())
      .map(([value, count]) => ({
        value,
        count,
        label: formatValue(value),
      }))
      .sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count;
        }
        if (a.value === null || a.value === undefined) return 1;
        if (b.value === null || b.value === undefined) return -1;
        if (typeof a.value === 'string' && typeof b.value === 'string') {
          return a.value.localeCompare(b.value);
        }
        return a.value < b.value ? -1 : a.value > b.value ? 1 : 0;
      });
  };

  // ===== SET QUICK FILTER =====
  const setQuickFilter = (value: string) => {
    quickFilter.value = value;
    emitFilterChanged();
  };

  // ===== CLEAR QUICK FILTER =====
  const clearQuickFilter = () => {
    quickFilter.value = '';
    emitFilterChanged();
  };

  return {
    // State
    filters: allFilters,
    activeFilters,
    filterState,
    hasFilters,
    filterCount,
    filteredData: getFilteredData,
    quickFilter,

    // Methods
    updateFilter,
    removeFilter,
    removeFilterByField,
    clearFilters,
    clearFieldFilter,
    hasFilter,
    getFilter,
    setFilters,
    addFilter,
    updateFilters,
    toggleFilter,
    createDisplayValue,
    formatValue,
    applyFilterCondition,
    getUniqueValues,
    getUniqueValuesWithCount,
    setQuickFilter,
    clearQuickFilter,
  };
}
