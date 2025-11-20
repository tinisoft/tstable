/**
 * @fileoverview TSDataGrid type definitions
 * @module @tsdatagrid/types
 * @version 1.0.0
 */

// ===== CORE =====
export * from './core/base'
export * from './core/column'
export * from './core/datasource'
export * from './core/events'
export * from './core/models'

// ===== FEATURES =====
export * from './features/editing'
export * from './features/filtering'
export * from './features/sorting'
export * from './features/grouping'
export * from './features/selection'
export * from './features/searching'
export * from './features/pagination'
export * from './features/export'
export * from './features/summary'
export * from './features/keyboard'
export * from './features/virtualization'
export * from './features/accessibility'

// ===== STATE =====
export * from './state/grid-state'
export * from './state/persistence'

// ===== UI =====
export * from './ui/toolbar'
export * from './ui/styling'
export * from './ui/templates'

// ===== VALIDATION =====
export * from './validation/validators'

// ===== VERSION =====
export const VERSION = '1.0.0'

/**
 * Type utility: Make all properties readonly
 */
export type Immutable<T> = {
  readonly [K in keyof T]: T[K] extends object ? Immutable<T[K]> : T[K]
}

/**
 * Type utility: Make all properties mutable
 */
export type Mutable<T> = {
  -readonly [K in keyof T]: T[K]
}

/**
 * Type utility: Non-nullable
 */
export type NonNullableFields<T> = {
  [K in keyof T]: NonNullable<T[K]>
}

/**
 * Type utility: Extract promise type
 */
export type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

/**
 * Type utility: Function arguments
 */
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never

/**
 * Type utility: Function return type
 */
export type ReturnTypeOf<F extends Function> = F extends (...args: any[]) => infer R ? R : never