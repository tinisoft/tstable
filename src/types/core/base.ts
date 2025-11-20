/**
 * @fileoverview Core base types and utilities for TSDataGrid
 * @module @tsdatagrid/types/core/base
 * @version 1.0.0
 */

/** Branded type for type-safe IDs */
export type Brand<K, T> = K & { __brand: T }

/** Row key identifier (branded for type safety) */
export type RowKey = Brand<string | number, 'RowKey'>

/** Column field identifier (branded for type safety) */
export type ColumnField = Brand<string, 'ColumnField'>

/** Deep partial type utility */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

/** Extract keys of type T that are of type U */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never
}[keyof T]

/** Make specific keys required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>

/** Make specific keys optional */
export type OptionalKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

/** Callback function type */
export type Callback<T = void> = () => T

/** Async callback function type */
export type AsyncCallback<T = void> = () => Promise<T>

/** Predicate function type */
export type Predicate<T> = (item: T) => boolean

/** Comparator function type */
export type Comparator<T> = (a: T, b: T) => number

/** Grid mode enumeration */
export const enum GridMode {
  ReadOnly = 'readonly',
  Edit = 'edit',
  Filter = 'filter',
  Sort = 'sort',
  Resize = 'resize',
  Reorder = 'reorder',
}

/** Data type enumeration */
export const enum DataType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  DateTime = 'datetime',
  Boolean = 'boolean',
  Object = 'object',
  Array = 'array',
}

/** Alignment options */
export const enum Alignment {
  Left = 'left',
  Center = 'center',
  Right = 'right',
  Justify = 'justify',
}

/** Position type */
export interface Position {
  readonly x: number
  readonly y: number
}

/** Size type */
export interface Size {
  readonly width: number
  readonly height: number
}

/** Rectangle type */
export interface Rectangle extends Position, Size {}

/** Range type */
export interface Range<T = number> {
  readonly start: T
  readonly end: T
}

/** Error information */
export interface ErrorInfo {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, any>
  readonly timestamp?: Date
}

/** Result type with error handling */
export type Result<T, E = ErrorInfo> =
  | { success: true; data: T }
  | { success: false; error: E }

/** Async result type */
export type AsyncResult<T, E = ErrorInfo> = Promise<Result<T, E>>

/** Change event */
export interface ChangeEvent<T = any> {
  readonly oldValue: T
  readonly newValue: T
  readonly timestamp: Date
}

/** Cancellable event */
export interface CancellableEvent {
  cancel: boolean
}

/** Grid theme options */
export const enum GridTheme {
  Default = 'default',
  Material = 'material',
  Bootstrap = 'bootstrap',
  Fluent = 'fluent',
  Dark = 'dark',
  Compact = 'compact',
  Comfortable = 'comfortable',
}

/** Loading state */
export interface LoadingState {
  readonly isLoading: boolean
  readonly loadingText?: string
  readonly progress?: number // 0-100
}

/** Validation severity */
export const enum ValidationSeverity {
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
}

/** Validation result */
export interface ValidationResult {
  readonly isValid: boolean
  readonly severity?: ValidationSeverity
  readonly message?: string
  readonly field?: string
}

/** Disposable interface */
export interface IDisposable {
  dispose(): void
}

/** Observable interface */
export interface IObservable<T> {
  subscribe(callback: (value: T) => void): IDisposable
  unsubscribe(callback: (value: T) => void): void
}