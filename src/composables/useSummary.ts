/**
 * @fileoverview Enhanced summary composable
 * @module composables/useSummary
 */
import { computed, ref, watch } from 'vue'
import { ColumnDefinition, SummaryConfig, SummaryResult, SummaryState, SummaryType, SummaryScope } from '../types'
import type { GridEmit } from '../types'

export function useSummary(
  data: () => any[],
  columns: () => ColumnDefinition[],
  configs: () => SummaryConfig[],
  emit?: GridEmit
) {
  const summaryConfigs = ref<SummaryConfig[]>([...configs()])
  const cachedSummaries = ref<Map<string, any>>(new Map())

  watch(() => configs(), (newConfigs) => {
    summaryConfigs.value = [...newConfigs]
    cachedSummaries.value.clear()
  }, { deep: true, immediate: true })

  // ===== CALCULATE SUMMARIES FOR ALL DATA =====
  const summaryValues = computed(() => {
    const summaries: Record<string, any> = {}

    summaryConfigs.value
      .filter(c => c.scope === SummaryScope.All || c.scope === SummaryScope.Both || !c.scope)
      .forEach(config => {
        const key = `${config.field}_${config.type}`
        const cacheKey = `all_${key}`
        
        if (cachedSummaries.value.has(cacheKey)) {
          summaries[key] = cachedSummaries.value.get(cacheKey)
        } else {
          const value = calculateSummary(data(), config)
          summaries[key] = value
          cachedSummaries.value.set(cacheKey, value)
        }
      })

    return summaries
  })

  // ===== CALCULATE SUMMARIES FOR CURRENT PAGE =====
  const pageSummaryValues = computed(() => {
    const summaries: Record<string, any> = {}

    summaryConfigs.value
      .filter(c => c.scope === SummaryScope.Page)
      .forEach(config => {
        const key = `${config.field}_${config.type}`
        summaries[key] = calculateSummary(data(), config)
      })

    return summaries
  })

  // ===== SUMMARY RESULTS =====
  const summaryResults = computed<SummaryResult[]>(() => {
    const results: SummaryResult[] = []

    summaryConfigs.value.forEach(config => {
      const key = `${config.field}_${config.type}`
      const value = config.scope === SummaryScope.Page 
        ? pageSummaryValues.value[key]
        : summaryValues.value[key]
      
      const formattedValue = config.formatter 
        ? String(config.formatter(value, config.type)) // ✅ Ensure string
        : formatSummaryValue(value, config)
      
      results.push({
        field: config.field,
        type: config.type,
        value,
        formattedValue,
        scope: config.scope || SummaryScope.All // ✅ Use enum value
      })
    })

    return results
  })

  // ===== SUMMARY STATE =====
  const summaryState = computed<SummaryState>(() => ({
    configs: summaryConfigs.value,
    results: summaryResults.value
  }))

  // ===== CALCULATE GROUP SUMMARIES =====
  const calculateGroupSummaries = (groupItems: any[], field: string): Record<string, any> => {
    const groupConfigs = summaryConfigs.value.filter(c =>
      c.scope === SummaryScope.Group || c.scope === SummaryScope.Both
    )

    const summaries: Record<string, any> = {}

    groupConfigs.forEach(config => {
      const key = `${config.field}_${config.type}`
      summaries[key] = calculateSummary(groupItems, config)
    })

    return summaries
  }

  // ===== ADD SUMMARY =====
  const addSummary = (config: SummaryConfig) => {
    const exists = summaryConfigs.value.find(
      s => s.field === config.field && s.type === config.type
    )

    if (!exists) {
      summaryConfigs.value.push(config)
      cachedSummaries.value.clear()
      emit?.('state-changed', { state: { summaries: summaryConfigs.value } }) // ✅ Fixed event name
    }
  }

  // ===== REMOVE SUMMARY =====
  const removeSummary = (field: string, type: SummaryType) => { // ✅ Use SummaryType
    const index = summaryConfigs.value.findIndex(
      s => s.field === field && s.type === type
    )

    if (index !== -1) {
      summaryConfigs.value.splice(index, 1)
      cachedSummaries.value.clear()
      emit?.('state-changed', { state: { summaries: summaryConfigs.value } })
    }
  }

  // ===== UPDATE SUMMARY =====
  const updateSummary = (field: string, type: SummaryType, updates: Partial<SummaryConfig>) => { // ✅ Use SummaryType
    const summary = summaryConfigs.value.find(
      s => s.field === field && s.type === type
    )

    if (summary) {
      Object.assign(summary, updates)
      cachedSummaries.value.clear()
      emit?.('state-changed', { state: { summaries: summaryConfigs.value } })
    }
  }

  // ===== CLEAR SUMMARIES =====
  const clearSummaries = () => {
    summaryConfigs.value = []
    cachedSummaries.value.clear()
    emit?.('state-changed', { state: { summaries: [] } })
  }

  // ===== CALCULATE SUMMARY =====
  const calculateSummary = (items: any[], config: SummaryConfig): any => {
    if (!items || items.length === 0) {
      return config.type === SummaryType.Count ? 0 : null // ✅ Use SummaryType
    }

    // Custom calculation
    if (config.type === SummaryType.Custom && config.customCalculation) {
      const result = config.customCalculation(items, config.field)
      return result
    }

    // Get values
    const values = items
      .map(item => {
        if (config.field.includes('.')) {
          return config.field.split('.').reduce((obj, key) => obj?.[key], item)
        }
        return item[config.field]
      })
      .filter(v => v != null)

    let result: any

    switch (config.type) {
      case SummaryType.Sum: // ✅ Use enum values
        result = values
          .map(v => typeof v === 'number' ? v : Number(v))
          .filter(v => !isNaN(v))
          .reduce((sum, v) => sum + v, 0)
        break

      case SummaryType.Avg:
        const numValues = values
          .map(v => typeof v === 'number' ? v : Number(v))
          .filter(v => !isNaN(v))
        result = numValues.length 
          ? numValues.reduce((sum, v) => sum + v, 0) / numValues.length 
          : null
        break

      case SummaryType.Min:
        const minValues = values
          .map(v => typeof v === 'number' ? v : Number(v))
          .filter(v => !isNaN(v))
        result = minValues.length ? Math.min(...minValues) : null
        break

      case SummaryType.Max:
        const maxValues = values
          .map(v => typeof v === 'number' ? v : Number(v))
          .filter(v => !isNaN(v))
        result = maxValues.length ? Math.max(...maxValues) : null
        break

      case SummaryType.Count:
        result = items.length
        break

      case SummaryType.DistinctCount:
        result = new Set(values).size
        break

      case SummaryType.Median:
        const sortedValues = values
          .map(v => typeof v === 'number' ? v : Number(v))
          .filter(v => !isNaN(v))
          .sort((a, b) => a - b)
        
        if (sortedValues.length === 0) {
          result = null
        } else {
          const mid = Math.floor(sortedValues.length / 2)
          result = sortedValues.length % 2 === 0
            ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
            : sortedValues[mid]
        }
        break

      case SummaryType.StdDev:
        const stdValues = values
          .map(v => typeof v === 'number' ? v : Number(v))
          .filter(v => !isNaN(v))
        
        if (stdValues.length === 0) {
          result = null
        } else {
          const mean = stdValues.reduce((sum, v) => sum + v, 0) / stdValues.length
          const variance = stdValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / stdValues.length
          result = Math.sqrt(variance)
        }
        break

      case SummaryType.Variance:
        const varValues = values
          .map(v => typeof v === 'number' ? v : Number(v))
          .filter(v => !isNaN(v))
        
        if (varValues.length === 0) {
          result = null
        } else {
          const mean = varValues.reduce((sum, v) => sum + v, 0) / varValues.length
          result = varValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / varValues.length
        }
        break

      case SummaryType.First:
        result = values[0]
        break

      case SummaryType.Last:
        result = values[values.length - 1]
        break

      case SummaryType.Concat:
        result = values.join(config.separator || ', ')
        break

      default:
        result = null
    }

    return result
  }

  // ===== FORMAT SUMMARY VALUE =====
  const formatSummaryValue = (value: any, config: SummaryConfig): string => {
    if (value == null) return '-'

    const column = columns().find(c => c.field === config.field)

    // Apply precision
    if (typeof value === 'number' && config.precision !== undefined) {
      value = Number(value.toFixed(config.precision))
    }

    // Format based on column type
    if (column) {
      if (column.type === 'number' || column.type === 'currency') {
        return value.toLocaleString()
      } else if (column.type === 'date') {
        return value instanceof Date ? value.toLocaleDateString() : String(value)
      }
    }

    return String(value)
  }

  // ===== GET SUMMARY VALUE =====
  const getSummaryValue = (field: string, type: SummaryType = SummaryType.Sum, scope: 'all' | 'page' = 'all'): any => {
    const key = `${field}_${type}`
    return scope === 'page' ? pageSummaryValues.value[key] : summaryValues.value[key]
  }

  // ===== GET FORMATTED SUMMARY VALUE =====
  const getFormattedSummaryValue = (field: string, type: SummaryType = SummaryType.Sum, scope: SummaryScope = SummaryScope.All): string => {
    const result = summaryResults.value.find(
      r => r.field === field && r.type === type && r.scope === scope
    )
    return result?.formattedValue || '-'
  }

  // ===== HAS SUMMARIES =====
  const hasSummaries = computed(() => summaryConfigs.value.length > 0)

  // ===== CLEAR CACHE =====
  const clearCache = () => {
    cachedSummaries.value.clear()
  }

  // Watch data changes to clear cache
  watch(data, () => {
    cachedSummaries.value.clear()
  }, { deep: false })

  return {
    // State
    summaryValues,
    pageSummaryValues,
    summaryConfigs,
    summaryResults,
    summaryState,
    hasSummaries,

    // Methods
    addSummary,
    removeSummary,
    updateSummary,
    clearSummaries,
    calculateSummary,
    calculateGroupSummaries,
    getSummaryValue,
    getFormattedSummaryValue,
    formatSummaryValue,
    clearCache
  }
}