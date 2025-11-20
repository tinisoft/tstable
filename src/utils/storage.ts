/**
 * @fileoverview Storage utilities (localStorage/sessionStorage)
 * @module utils/storage
 */

export type StorageType = 'local' | 'session'

export interface StorageOptions {
  type?: StorageType
  prefix?: string
  encrypt?: boolean
  ttl?: number // Time to live in milliseconds
}

export interface StorageItem<T = any> {
  value: T
  timestamp: number
  ttl?: number
}

/**
 * Storage manager class
 */
export class StorageManager {
  private storageBackend: Storage
  private prefix: string
  
  constructor(type: StorageType = 'local', prefix: string = '') {
    this.storageBackend = type === 'local' ? window.localStorage : window.sessionStorage
    this.prefix = prefix
  }
  
  private getKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key
  }
  
  /**
   * Set item
   */
  set<T>(key: string, value: T, ttl?: number): void {
    const item: StorageItem<T> = {
      value,
      timestamp: Date.now(),
      ttl
    }
    
    try {
      this.storageBackend.setItem(this.getKey(key), JSON.stringify(item))
    } catch (error) {
      console.error('Storage set error:', error)
    }
  }
  
  /**
   * Get item
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const data = this.storageBackend.getItem(this.getKey(key))
      if (!data) return defaultValue
      
      const item: StorageItem<T> = JSON.parse(data)
      
      // Check if expired
      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key)
        return defaultValue
      }
      
      return item.value
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  }
  
  /**
   * Remove item
   */
  remove(key: string): void {
    try {
      this.storageBackend.removeItem(this.getKey(key))
    } catch (error) {
      console.error('Storage remove error:', error)
    }
  }
  
  /**
   * Clear all items
   */
  clear(): void {
    try {
      if (this.prefix) {
        // Clear only items with prefix
        const keys = this.keys()
        keys.forEach(key => this.remove(key))
      } else {
        this.storageBackend.clear()
      }
    } catch (error) {
      console.error('Storage clear error:', error)
    }
  }
  
  /**
   * Check if key exists
   */
  has(key: string): boolean {
    return this.storageBackend.getItem(this.getKey(key)) !== null
  }
  
  /**
   * Get all keys
   */
  keys(): string[] {
    const allKeys: string[] = []
    
    try {
      for (let i = 0; i < this.storageBackend.length; i++) {
        const key = this.storageBackend.key(i)
        if (key) {
          if (this.prefix && key.startsWith(`${this.prefix}:`)) {
            allKeys.push(key.substring(this.prefix.length + 1))
          } else if (!this.prefix) {
            allKeys.push(key)
          }
        }
      }
    } catch (error) {
      console.error('Storage keys error:', error)
    }
    
    return allKeys
  }
  
  /**
   * Get storage size
   */
  size(): number {
    return this.keys().length
  }
  
  /**
   * Get all items
   */
  getAll(): Record<string, any> {
    const items: Record<string, any> = {}
    const keys = this.keys()
    
    keys.forEach(key => {
      items[key] = this.get(key)
    })
    
    return items
  }
  
  /**
   * Check if storage is available
   */
  static isAvailable(type: StorageType = 'local'): boolean {
    try {
      const storage = type === 'local' ? window.localStorage : window.sessionStorage
      const test = '__storage_test__'
      storage.setItem(test, test)
      storage.removeItem(test)
      return true
    } catch {
      return false
    }
  }
}

// Singleton instances with different names to avoid conflicts
export const localStorageManager = new StorageManager('local')
export const sessionStorageManager = new StorageManager('session')

/**
 * Create storage manager with prefix
 */
export function createStorage(
  type: StorageType = 'local',
  prefix: string = ''
): StorageManager {
  return new StorageManager(type, prefix)
}

/**
 * Quick storage helpers
 */
export const storage = {
  local: localStorageManager,
  session: sessionStorageManager,
  
  // Shortcuts
  get: <T>(key: string, defaultValue?: T) => localStorageManager.get<T>(key, defaultValue),
  set: <T>(key: string, value: T, ttl?: number) => localStorageManager.set(key, value, ttl),
  remove: (key: string) => localStorageManager.remove(key),
  clear: () => localStorageManager.clear(),
  has: (key: string) => localStorageManager.has(key),
  keys: () => localStorageManager.keys(),
  size: () => localStorageManager.size(),
  getAll: () => localStorageManager.getAll()
}