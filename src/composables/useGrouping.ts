/**
 * @fileoverview Enhanced grouping composable
 * @module composables/useGrouping
 */

import { ref, computed } from 'vue';
import type { GroupDescriptor, GroupedRow, GridEmit } from '../types';
import { deepClone } from '../utils/object';

export function useGrouping(emit?: GridEmit) {
  const groupDescriptors = ref<GroupDescriptor[]>([]);
  const expandedGroups = ref<Set<string>>(new Set());
  const collapsedGroups = ref<Set<string>>(new Set());

  const hasGrouping = computed(() => groupDescriptors.value.length > 0);
  const groupCount = computed(() => groupDescriptors.value.length);

  // ===== ADD GROUP =====
  const addGroup = (field: string, expanded: boolean = true, index?: number) => {
    const exists = groupDescriptors.value.find((g) => g.field === field);
    if (exists) return;

    const descriptor: GroupDescriptor = {
      field,
      expanded,
      index: index ?? groupDescriptors.value.length,
    };

    if (index !== undefined) {
      groupDescriptors.value.splice(index, 0, descriptor);
      groupDescriptors.value.forEach((g, idx) => {
        g.index = idx;
      });
    } else {
      groupDescriptors.value.push(descriptor);
    }

    // ✅ FIXED: Emit object with 'groups' property to match type definition
    emit?.('group-changed', { groups: groupDescriptors.value });

    // Emit state-changed
    emit?.('state-changed', {
      state: { grouping: groupDescriptors.value },
    });
  };

  // ===== REMOVE GROUP =====
  const removeGroup = (field: string) => {
    const index = groupDescriptors.value.findIndex((g) => g.field === field);
    if (index === -1) return;

    groupDescriptors.value.splice(index, 1);

    groupDescriptors.value.forEach((g, idx) => {
      g.index = idx;
    });

    const keysToDelete = Array.from(expandedGroups.value).filter((key) =>
      key.startsWith(`${field}:`)
    );
    keysToDelete.forEach((key) => {
      expandedGroups.value.delete(key);
      collapsedGroups.value.delete(key);
    });

    // ✅ FIXED: Emit object with 'groups' property
    emit?.('group-changed', { groups: groupDescriptors.value });

    emit?.('state-changed', {
      state: { grouping: groupDescriptors.value },
    });
  };

  // ===== CLEAR GROUPS =====
  const clearGroups = () => {
    groupDescriptors.value = [];
    expandedGroups.value.clear();
    collapsedGroups.value.clear();

    // ✅ FIXED: Emit object with 'groups' property
    emit?.('group-changed', { groups: [] });

    emit?.('state-changed', {
      state: { grouping: [] },
    });
  };

  // ===== REORDER GROUP =====
  const reorderGroup = (field: string, newIndex: number) => {
    const currentIndex = groupDescriptors.value.findIndex((g) => g.field === field);
    if (currentIndex === -1) return;

    const [descriptor] = groupDescriptors.value.splice(currentIndex, 1);
    groupDescriptors.value.splice(newIndex, 0, descriptor);

    groupDescriptors.value.forEach((g, idx) => {
      g.index = idx;
    });

    // ✅ FIXED: Emit object with 'groups' property
    emit?.('group-changed', { groups: groupDescriptors.value });

    emit?.('state-changed', {
      state: { grouping: groupDescriptors.value },
    });
  };

  // ===== TOGGLE GROUP EXPANSION =====
  const toggleGroupExpansion = (groupKey: string) => {
    if (expandedGroups.value.has(groupKey)) {
      expandedGroups.value.delete(groupKey);
      collapsedGroups.value.add(groupKey);

      emit?.('group-collapsed', { group: groupKey });
    } else {
      expandedGroups.value.add(groupKey);
      collapsedGroups.value.delete(groupKey);

      emit?.('group-expanded', { group: groupKey });
    }

    expandedGroups.value = new Set(expandedGroups.value);
    collapsedGroups.value = new Set(collapsedGroups.value);

    emit?.('state-changed', {
      state: {
        expandedGroups: Array.from(expandedGroups.value),
        collapsedGroups: Array.from(collapsedGroups.value),
      },
    });
  };

  // ===== IS GROUP EXPANDED =====
  const isGroupExpanded = (groupKey: string): boolean => {
    if (collapsedGroups.value.has(groupKey)) return false;
    if (expandedGroups.value.has(groupKey)) return true;

    const field = groupKey.split(':')[0];
    const descriptor = groupDescriptors.value.find((g) => g.field === field);
    return descriptor?.expanded !== false;
  };

  // ===== EXPAND GROUP =====
  const expandGroup = (groupKey: string) => {
    if (!expandedGroups.value.has(groupKey)) {
      expandedGroups.value.add(groupKey);
      collapsedGroups.value.delete(groupKey);
      expandedGroups.value = new Set(expandedGroups.value);

      emit?.('group-expanded', { group: groupKey });
    }
  };

  // ===== COLLAPSE GROUP =====
  const collapseGroup = (groupKey: string) => {
    if (expandedGroups.value.has(groupKey) || !collapsedGroups.value.has(groupKey)) {
      expandedGroups.value.delete(groupKey);
      collapsedGroups.value.add(groupKey);
      collapsedGroups.value = new Set(collapsedGroups.value);

      emit?.('group-collapsed', { group: groupKey });
    }
  };

  // ===== EXPAND ALL GROUPS =====
  const expandAllGroups = (groupedData: GroupedRow[]) => {
    const allGroupKeys: string[] = [];

    const collectKeys = (rows: GroupedRow[]) => {
      rows.forEach((row) => {
        if (row.isGroup) {
          allGroupKeys.push(row.key);
          if (row.children) {
            collectKeys(row.children);
          }
        }
      });
    };

    collectKeys(groupedData);

    expandedGroups.value = new Set(allGroupKeys);
    collapsedGroups.value.clear();

    emit?.('state-changed', {
      state: { expandedGroups: allGroupKeys },
    });
  };

  // ===== COLLAPSE ALL GROUPS =====
  const collapseAllGroups = (groupedData: GroupedRow[]) => {
    const allGroupKeys: string[] = [];

    const collectKeys = (rows: GroupedRow[]) => {
      rows.forEach((row) => {
        if (row.isGroup) {
          allGroupKeys.push(row.key);
          if (row.children) {
            collectKeys(row.children);
          }
        }
      });
    };

    collectKeys(groupedData);

    expandedGroups.value.clear();
    collapsedGroups.value = new Set(allGroupKeys);

    emit?.('state-changed', {
      state: { collapsedGroups: allGroupKeys },
    });
  };

  // ===== GROUP DATA =====
  const groupData = (data: any[]): GroupedRow[] => {
    if (groupDescriptors.value.length === 0 || data.length === 0) {
      return [];
    }

    return buildGroupHierarchy(data, groupDescriptors.value, 0, '');
  };

  // ===== BUILD GROUP HIERARCHY =====
  const buildGroupHierarchy = (
    data: any[],
    descriptors: GroupDescriptor[],
    level: number,
    parentKey: string
  ): GroupedRow[] => {
    if (level >= descriptors.length) {
      return data.map((item, index) => ({
        ...deepClone(item),
        key: `${parentKey}|row-${index}`,
        field: '' as any,
        value: item,
        items: [item],
        level,
        expanded: true,
        isGroup: false,
        count: 1,
      }));
    }

    const descriptor = descriptors[level];
    const groups = new Map<any, any[]>();

    data.forEach((item) => {
      const value = item[descriptor.field as string];
      const key = value ?? '(empty)';
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    const result: GroupedRow[] = [];
    const sortedGroups = Array.from(groups.entries());
    
    if (descriptor.sortDirection) {
      sortedGroups.sort(([a], [b]) => {
        if (a === '(empty)') return 1;
        if (b === '(empty)') return -1;

        if (descriptor.sortDirection === 'asc') {
          return a > b ? 1 : a < b ? -1 : 0;
        } else {
          return a < b ? 1 : a > b ? -1 : 0;
        }
      });
    }

    sortedGroups.forEach(([value, items]) => {
      const groupKey = parentKey
        ? `${parentKey}|${descriptor.field}:${value}`
        : `${descriptor.field}:${value}`;

      const isExpanded = isGroupExpanded(groupKey);
      const children = buildGroupHierarchy(items, descriptors, level + 1, groupKey);

      const group: GroupedRow = {
        key: groupKey,
        field: descriptor.field,
        value: value === '(empty)' ? null : value,
        items,
        level,
        expanded: isExpanded,
        isGroup: true,
        count: items.length,
        children: isExpanded ? children : undefined,
      };

      result.push(group);

      if (isExpanded) {
        result.push(...children);
      }
    });

    return result;
  };

  // ===== GET GROUP SUMMARY =====
  const getGroupSummary = (groupItems: any[], aggregates?: any[]): Record<string, any> => {
    if (!aggregates || aggregates.length === 0) return {};

    const summary: Record<string, any> = {};

    aggregates.forEach((agg) => {
      const values = groupItems.map((item) => item[agg.field as string]).filter((v) => v != null);

      switch (agg.aggregate) {
        case 'sum':
          summary[agg.field as string] = values.reduce((sum, v) => sum + Number(v), 0);
          break;
        case 'avg':
          summary[agg.field as string] = values.length
            ? values.reduce((sum, v) => sum + Number(v), 0) / values.length
            : 0;
          break;
        case 'min':
          summary[agg.field as string] = values.length ? Math.min(...values.map(Number)) : null;
          break;
        case 'max':
          summary[agg.field as string] = values.length ? Math.max(...values.map(Number)) : null;
          break;
        case 'count':
          summary[agg.field as string] = groupItems.length;
          break;
      }
    });

    return summary;
  };

  // ===== GET FLATTENED ROWS =====
  const getFlattenedRows = (groupedData: GroupedRow[]): any[] => {
    const flattened: any[] = [];

    const flatten = (rows: GroupedRow[]) => {
      rows.forEach((row) => {
        if (!row.isGroup) {
          flattened.push(row);
        } else if (row.expanded && row.children) {
          flatten(row.children);
        }
      });
    };

    flatten(groupedData);
    return flattened;
  };

  return {
    groupDescriptors,
    expandedGroups,
    collapsedGroups,
    hasGrouping,
    groupCount,
    addGroup,
    removeGroup,
    clearGroups,
    reorderGroup,
    toggleGroupExpansion,
    isGroupExpanded,
    expandGroup,
    collapseGroup,
    expandAllGroups,
    collapseAllGroups,
    groupData,
    getGroupSummary,
    getFlattenedRows,
  };
}