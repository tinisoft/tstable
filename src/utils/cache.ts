/**
 * @fileoverview Caching utilities
 * @module utils/cache
 */

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number
  onEvict?: (key: string, value: any) => void
}

export interface CacheEntry<T> {
  value: T
  timestamp: number
  ttl?: number
  hits: number
}

/**
 * LRU Cache implementation
 */
export class LRUCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  private options: Required<CacheOptions>
  
  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      onEvict: () => {},
      ...options
    }
  }
  
  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) return undefined
    
    // Check if expired
    const age = Date.now() - entry.timestamp
    const ttl = entry.ttl ?? this.options.ttl
    
    if (ttl > 0 && age > ttl) {
      this.delete(key)
      return undefined
    }
    
    // Update access order
    this.updateAccessOrder(key)
    entry.hits++
    
    return entry.value
  }
  
  /**
   * Set value in cache
   */
  set(key: string, value: T, ttl?: number): void {
    // Evict if at max size and key doesn't exist
    if (!this.cache.has(key) && this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
      hits: 0
    })
    
    this.updateAccessOrder(key)
  }
  
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    const value = this.get(key)
    return value !== undefined
  }
  
  /**
   * Delete key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    
    if (entry) {
      this.options.onEvict(key, entry.value)
      this.accessOrder = this.accessOrder.filter(k => k !== key)
      return this.cache.delete(key)
    }
    
    return false
  }
  
  /**
   * Clear cache
   */
  clear(): void {
    this.cache.forEach((entry, key) => {
      this.options.onEvict(key, entry.value)
    })
    
    this.cache.clear()
    this.accessOrder = []
  }
  
  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }
  
  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }
  
  /**
   * Get all values
   */
  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }
  
  /**
   * Get cache statistics
   */
  stats(): {
    size: number
    maxSize: number
    hitRate: number
    entries: Array<{ key: string; hits: number; age: number }>
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      age: Date.now() - entry.timestamp
    }))
    
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0)
    const totalRequests = totalHits + this.cache.size
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      entries
    }
  }
  
  /**
   * Update access order (LRU)
   */
  private updateAccessOrder(key: string): void {
    this.accessOrder = this.accessOrder.filter(k => k !== key)
    this.accessOrder.push(key)
  }
  
  /**
   * Evict least recently used
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return
    
    const keyToEvict = this.accessOrder[0]
    this.delete(keyToEvict)
  }
  
  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now()
    
    this.cache.forEach((entry, key) => {
      const age = now - entry.timestamp
      const ttl = entry.ttl ?? this.options.ttl
      
      if (ttl > 0 && age > ttl) {
        this.delete(key)
      }
    })
  }
}

/**
 * Create cache instance
 */
export function createCache<T = any>(options?: CacheOptions): LRUCache<T> {
  return new LRUCache<T>(options)
}

/**
 * Memoize function with cache
 */
export function catchMemoize<T extends (...args: any[]) => any>(
  fn: T,
  options?: CacheOptions & {
    keyGenerator?: (...args: Parameters<T>) => string
  }
): T {
  const cache = createCache<ReturnType<T>>(options)
  const keyGenerator = options?.keyGenerator || ((...args: any[]) => JSON.stringify(args))
  
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args)
    
    if (cache.has(key)) {
      return cache.get(key)
    }
    
    const result = fn(...args)
    cache.set(key, result)
    
    return result
  }) as T
}