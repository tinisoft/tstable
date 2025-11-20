/**
 * @fileoverview Enhanced performance utilities
 * @module utils/performance
 */

// ===== DEBOUNCE =====
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean
    trailing?: boolean
    maxWait?: number
  } = {}
): ((...args: Parameters<T>) => void) & { cancel: () => void; flush: () => void } => {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let maxTimeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null
  let lastThis: any = null
  let result: any
  let lastCallTime = 0
  let lastInvokeTime = 0

  const { leading = false, trailing = true, maxWait } = options

  const invokeFunc = (time: number) => {
    const args = lastArgs!
    const thisArg = lastThis

    lastArgs = null
    lastThis = null
    lastInvokeTime = time
    result = func.apply(thisArg, args)
    return result
  }

  const startTimer = (pendingFunc: () => void, wait: number) => {
    return setTimeout(pendingFunc, wait)
  }

  const cancelTimer = (id: ReturnType<typeof setTimeout>) => {
    clearTimeout(id)
  }

  const leadingEdge = (time: number) => {
    lastInvokeTime = time
    timeout = startTimer(timerExpired, wait)
    return leading ? invokeFunc(time) : result
  }

  const remainingWait = (time: number) => {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime
    const timeWaiting = wait - timeSinceLastCall

    return maxWait !== undefined
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting
  }

  const shouldInvoke = (time: number) => {
    const timeSinceLastCall = time - lastCallTime
    const timeSinceLastInvoke = time - lastInvokeTime

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    )
  }

  const timerExpired = () => {
    const time = Date.now()
    if (shouldInvoke(time)) {
      return trailingEdge(time)
    }
    timeout = startTimer(timerExpired, remainingWait(time))
  }

  const trailingEdge = (time: number) => {
    timeout = null

    if (trailing && lastArgs) {
      return invokeFunc(time)
    }
    lastArgs = null
    lastThis = null
    return result
  }

  const cancel = () => {
    if (timeout !== null) {
      cancelTimer(timeout)
    }
    if (maxTimeout !== null) {
      cancelTimer(maxTimeout)
    }
    lastInvokeTime = 0
    lastArgs = null
    lastCallTime = 0
    lastThis = null
    timeout = null
    maxTimeout = null
  }

  const flush = () => {
    return timeout === null ? result : trailingEdge(Date.now())
  }

  const debounced = function (this: any, ...args: Parameters<T>) {
    const time = Date.now()
    const isInvoking = shouldInvoke(time)

    lastArgs = args
    lastThis = this
    lastCallTime = time

    if (isInvoking) {
      if (timeout === null) {
        return leadingEdge(lastCallTime)
      }
      if (maxWait !== undefined) {
        timeout = startTimer(timerExpired, wait)
        return invokeFunc(lastCallTime)
      }
    }
    if (timeout === null) {
      timeout = startTimer(timerExpired, wait)
    }
    return result
  }

  debounced.cancel = cancel
  debounced.flush = flush

  return debounced as any
}

// ===== THROTTLE =====
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean
    trailing?: boolean
  } = {}
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  const { leading = true, trailing = true } = options

  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait
  })
}

// ===== MEMOIZE =====
export const memoize = <T extends (...args: any[]) => any>(
  fn: T,
  options: {
    keyGenerator?: (...args: Parameters<T>) => string
    maxSize?: number
    ttl?: number
  } = {}
): T & { cache: Map<string, any>; clear: () => void } => {
  const {
    keyGenerator = (...args) => JSON.stringify(args),
    maxSize = 100,
    ttl
  } = options

  const cache = new Map<string, { value: any; timestamp: number }>()

  const memoized = ((...args: Parameters<T>) => {
    const key = keyGenerator(...args)

    if (cache.has(key)) {
      const cached = cache.get(key)!
      
      // Check TTL
      if (ttl && Date.now() - cached.timestamp > ttl) {
        cache.delete(key)
      } else {
        return cached.value
      }
    }

    const result = fn(...args)

    // Evict oldest if max size reached
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value
      if (firstKey) cache.delete(firstKey)
    }

    cache.set(key, {
      value: result,
      timestamp: Date.now()
    })

    return result
  }) as T & { cache: Map<string, any>; clear: () => void }

  memoized.cache = cache as any
  memoized.clear = () => cache.clear()

  return memoized
}

// ===== PERFORMANCE MONITOR =====
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map()
  private measurements: Map<string, number[]> = new Map()
  private enabled: boolean = true

  constructor(enabled: boolean = true) {
    this.enabled = enabled
  }

  start(label: string) {
    if (!this.enabled) return
    this.marks.set(label, performance.now())
  }

  end(label: string): number {
    if (!this.enabled) return 0

    const startTime = this.marks.get(label)
    if (!startTime) {
      console.warn(`No start mark found for: ${label}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(label)

    // Store measurement
    if (!this.measurements.has(label)) {
      this.measurements.set(label, [])
    }
    this.measurements.get(label)!.push(duration)

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
    }

    return duration
  }

  measure<T>(label: string, fn: () => T): T {
    this.start(label)
    const result = fn()
    this.end(label)
    return result
  }

  async measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    const result = await fn()
    this.end(label)
    return result
  }

  getStats(label: string): {
    count: number
    total: number
    average: number
    min: number
    max: number
  } | null {
    const measurements = this.measurements.get(label)
    if (!measurements || measurements.length === 0) return null

    return {
      count: measurements.length,
      total: measurements.reduce((sum, m) => sum + m, 0),
      average: measurements.reduce((sum, m) => sum + m, 0) / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements)
    }
  }

  clearMarks(): void {
    this.marks.clear()
  }

  clearMeasurements(label?: string): void {
    if (label) {
      this.measurements.delete(label)
    } else {
      this.measurements.clear()
    }
  }

  clear(): void {
    this.clearMarks()
    this.clearMeasurements()
  }

  enable(): void {
    this.enabled = true
  }

  disable(): void {
    this.enabled = false
  }

  getAllStats(): Map<string, ReturnType<PerformanceMonitor['getStats']>> {
    const stats = new Map()
    this.measurements.forEach((_, label) => {
      stats.set(label, this.getStats(label))
    })
    return stats
  }
}

// ===== BATCH PROCESSOR =====
export class BatchProcessor<T> {
  private queue: T[] = []
  private processing = false
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private processor: (items: T[]) => Promise<void> | void,
    private options: {
      batchSize?: number
      delay?: number
      maxWait?: number
    } = {}
  ) {
    this.options = {
      batchSize: 50,
      delay: 100,
      maxWait: 1000,
      ...options
    }
  }

  add(item: T): void {
    this.queue.push(item)
    this.schedule()
  }

  addBatch(items: T[]): void {
    this.queue.push(...items)
    this.schedule()
  }

  private schedule(): void {
    if (this.processing) return

    if (this.timer) {
      clearTimeout(this.timer)
    }

    if (this.queue.length >= (this.options.batchSize || 50)) {
      this.process()
    } else {
      this.timer = setTimeout(() => {
        this.process()
      }, this.options.delay || 100)
    }
  }

  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) return

    this.processing = true
    const batch = this.queue.splice(0, this.options.batchSize || 50)

    try {
      await this.processor(batch)
    } catch (error) {
      console.error('Batch processing error:', error)
    } finally {
      this.processing = false

      if (this.queue.length > 0) {
        this.schedule()
      }
    }
  }

  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    while (this.queue.length > 0) {
      await this.process()
    }
  }

  clear(): void {
    this.queue = []
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }

  size(): number {
    return this.queue.length
  }
}

// ===== RAF THROTTLE =====
export const rafThrottle = <T extends (...args: any[]) => any>(
  fn: T
): ((...args: Parameters<T>) => void) & { cancel: () => void } => {
  let rafId: number | null = null
  let lastArgs: Parameters<T> | null = null

  const throttled = (...args: Parameters<T>) => {
    lastArgs = args

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        fn(...lastArgs!)
        rafId = null
        lastArgs = null
      })
    }
  }

  throttled.cancel = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
      lastArgs = null
    }
  }

  return throttled
}

// ===== IDLE CALLBACK =====
export const idleCallback = (
  callback: () => void,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options)
  }

  // Fallback for browsers without requestIdleCallback
  return setTimeout(callback, 1) as unknown as number
}

export const cancelIdleCallback = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

// ===== GLOBAL INSTANCE =====
export const perfMonitor = new PerformanceMonitor(
  process.env.NODE_ENV === 'development'
)