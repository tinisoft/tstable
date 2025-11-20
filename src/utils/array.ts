/**
 * @fileoverview Array manipulation utilities
 * @module utils/array
 */

/**
 * Group array by key
 */
export function groupBy<T>(
  array: T[],
  keyFn: (item: T) => string | number
): Record<string, T[]> {
  return array.reduce((result, item) => {
    const key = String(keyFn(item))
    if (!result[key]) {
      result[key] = []
    }
    result[key].push(item)
    return result
  }, {} as Record<string, T[]>)
}

/**
 * Unique array values
 */
export function uniqueArray<T>(array: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(array)]
  }
  
  const seen = new Set()
  return array.filter(item => {
    const key = keyFn(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

/**
 * Flatten nested array
 */
export function flatten<T>(array: any[], depth: number = Infinity): T[] {
  if (depth === 0) return array as T[]
  
  return array.reduce((result, item) => {
    if (Array.isArray(item)) {
      result.push(...flatten(item, depth - 1))
    } else {
      result.push(item)
    }
    return result
  }, [] as T[])
}

/**
 * Chunk array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  
  return chunks
}

/**
 * Sort array by multiple keys
 */
export function sortBy<T>(
  array: T[],
  ...keys: ((item: T) => any)[]
): T[] {
  return [...array].sort((a, b) => {
    for (const key of keys) {
      const aVal = key(a)
      const bVal = key(b)
      
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
    }
    return 0
  })
}

/**
 * Find duplicates in array
 */
export function findDuplicates<T>(
  array: T[],
  keyFn?: (item: T) => any
): T[] {
  const seen = new Map<any, number>()
  const duplicates: T[] = []
  
  array.forEach(item => {
    const key = keyFn ? keyFn(item) : item
    const count = seen.get(key) || 0
    seen.set(key, count + 1)
    
    if (count === 1) {
      duplicates.push(item)
    }
  })
  
  return duplicates
}

/**
 * Difference between two arrays
 */
export function difference<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2)
  return array1.filter(item => !set2.has(item))
}

/**
 * Intersection of two arrays
 */
export function intersection<T>(array1: T[], array2: T[]): T[] {
  const set2 = new Set(array2)
  return array1.filter(item => set2.has(item))
}

/**
 * Union of two arrays
 */
export function union<T>(...arrays: T[][]): T[] {
  return [...new Set(arrays.flat())]
}

/**
 * Move item in array
 */
export function move<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array]
  const [item] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, item)
  return result
}

/**
 * Shuffle array
 */
export function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  
  return result
}

/**
 * Sample random items from array
 */
export function sample<T>(array: T[], count: number = 1): T[] {
  const shuffled = shuffle(array)
  return shuffled.slice(0, count)
}

/**
 * Partition array by predicate
 */
export function partition<T>(
  array: T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const truthy: T[] = []
  const falsy: T[] = []
  
  array.forEach(item => {
    if (predicate(item)) {
      truthy.push(item)
    } else {
      falsy.push(item)
    }
  })
  
  return [truthy, falsy]
}

/**
 * Get array statistics
 */
export function stats(numbers: number[]): {
  sum: number
  avg: number
  min: number
  max: number
  median: number
  count: number
} {
  if (numbers.length === 0) {
    return { sum: 0, avg: 0, min: 0, max: 0, median: 0, count: 0 }
  }
  
  const sorted = [...numbers].sort((a, b) => a - b)
  const sum = numbers.reduce((acc, n) => acc + n, 0)
  const avg = sum / numbers.length
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const mid = Math.floor(sorted.length / 2)
  const median = sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
  
  return { sum, avg, min, max, median, count: numbers.length }
}

/**
 * Range array
 */
export function arrayRange(start: number, end: number, step: number = 1): number[] {
  const result: number[] = []
  
  if (step === 0) return result
  
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i)
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(i)
    }
  }
  
  return result
}

/**
 * Take first n items
 */
export function take<T>(array: T[], count: number): T[] {
  return array.slice(0, count)
}

/**
 * Take last n items
 */
export function takeLast<T>(array: T[], count: number): T[] {
  return array.slice(-count)
}

/**
 * Drop first n items
 */
export function drop<T>(array: T[], count: number): T[] {
  return array.slice(count)
}

/**
 * Drop last n items
 */
export function dropLast<T>(array: T[], count: number): T[] {
  return array.slice(0, -count)
}