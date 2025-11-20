/**
 * @fileoverview Object utilities
 * @module utils/object
 */

/**
 * Deep clone object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (obj instanceof Date) return new Date(obj.getTime()) as any
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any
  if (obj instanceof Set) return new Set(Array.from(obj).map(item => deepClone(item))) as any
  if (obj instanceof Map) {
    return new Map(Array.from(obj).map(([key, value]) => [key, deepClone(value)])) as any
  }
  
  const cloned = {} as T
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key])
    }
  }
  
  return cloned
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends object>(...objects: Partial<T>[]): T {
  const isObject = (obj: any) => obj && typeof obj === 'object' && !Array.isArray(obj)
  
  return objects.reduce<any>((merged, obj) => {
    if (!obj) return merged
    
    Object.keys(obj).forEach(key => {
      const mergedValue = merged[key]
      const objValue = (obj as any)[key]
      
      if (Array.isArray(mergedValue) && Array.isArray(objValue)) {
        merged[key] = [...mergedValue, ...objValue]
      } else if (isObject(mergedValue) && isObject(objValue)) {
        merged[key] = deepMerge(mergedValue, objValue)
      } else {
        merged[key] = objValue
      }
    })
    
    return merged
  }, {}) as T
}

/**
 * Deep equality check
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true
  
  if (obj1 === null || obj2 === null) return false
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (!deepEqual(obj1[key], obj2[key])) return false
  }
  
  return true
}

/**
 * Get nested value by path
 */
export function getNestedValue(obj: any, path: string, defaultValue?: any): any {
  const keys = path.split('.')
  let value = obj
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return defaultValue
    }
    value = value[key]
  }
  
  return value !== undefined ? value : defaultValue
}

/**
 * Set nested value by path
 */
export function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  
  let current = obj
  for (const key of keys) {
    if (!(key in current)) {
      current[key] = {}
    }
    current = current[key]
  }
  
  current[lastKey] = value
}

/**
 * Pick properties from object
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>
  
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key]
    }
  }
  
  return result
}

/**
 * Omit properties from object
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj }
  
  for (const key of keys) {
    delete result[key]
  }
  
  return result as Omit<T, K>
}

/**
 * Check if object is empty
 */
export function isObjectEmpty(obj: any): boolean {
  if (obj === null || obj === undefined) return true
  if (Array.isArray(obj)) return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * Flatten nested object
 */
export function flattenObject(
  obj: any,
  prefix: string = '',
  separator: string = '.'
): Record<string, any> {
  const result: Record<string, any> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key
      
      if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], newKey, separator))
      } else {
        result[newKey] = obj[key]
      }
    }
  }
  
  return result
}

/**
 * Unflatten object
 */
export function unflatten(
  obj: Record<string, any>,
  separator: string = '.'
): any {
  const result: any = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      setNestedValue(result, key.split(separator).join('.'), obj[key])
    }
  }
  
  return result
}

/**
 * Map object values
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  mapper: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = mapper(obj[key], key)
    }
  }
  
  return result
}

/**
 * Filter object entries
 */
export function filterObject<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> {
  const result: Record<string, T> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && predicate(obj[key], key)) {
      result[key] = obj[key]
    }
  }
  
  return result
}

/**
 * Invert object keys/values
 */
export function invert(obj: Record<string, string | number>): Record<string, string> {
  const result: Record<string, string> = {}
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[String(obj[key])] = key
    }
  }
  
  return result
}

/**
 * Get object keys with type safety
 */
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[]
}

/**
 * Get object values with type safety
 */
export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][]
}

/**
 * Get object entries with type safety
 */
export function entries<T extends object>(obj: T): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][]
}

/**
 * Create object from entries
 */
export function fromEntries<K extends string | number | symbol, V>(
  entries: [K, V][]
): Record<K, V> {
  return Object.fromEntries(entries) as Record<K, V>
}

/**
 * Check if value is object
 */
export function isObject(value: any): value is object {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Check if value is plain object
 */
export function isPlainObject(value: any): boolean {
  if (!isObject(value)) return false
  
  const proto = Object.getPrototypeOf(value)
  return proto === null || proto === Object.prototype
}

/**
 * Safe object assign with type checking
 */
export function assign<T extends object>(target: T, ...sources: Partial<T>[]): T {
  return Object.assign(target, ...sources)
}

/**
 * Create a shallow copy of an object
 */
export function shallowClone<T extends object>(obj: T): T {
  if (Array.isArray(obj)) {
    return [...obj] as any
  }
  return { ...obj }
}

/**
 * Check if two objects have the same keys
 */
export function hasSameKeys(obj1: object, obj2: object): boolean {
  const keys1 = Object.keys(obj1).sort()
  const keys2 = Object.keys(obj2).sort()
  
  if (keys1.length !== keys2.length) return false
  
  return keys1.every((key, index) => key === keys2[index])
}

/**
 * Get difference between two objects
 */
export function diff<T extends object>(obj1: T, obj2: T): Partial<T> {
  const result: any = {}
  
  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (!deepEqual(obj1[key], obj2[key])) {
        result[key] = obj2[key]
      }
    }
  }
  
  return result
}

/**
 * Freeze object deeply
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  Object.freeze(obj)
  
  Object.getOwnPropertyNames(obj).forEach(prop => {
    const value = (obj as any)[prop]
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      deepFreeze(value)
    }
  })
  
  return obj
}