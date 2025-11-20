/**
 * @fileoverview Core data models
 * @module @tsdatagrid/types/core/models
 */

/**
 * Base entity interface
 */
export interface IEntity {
  /** Unique identifier */
  id?: string | number
  
  /** Created timestamp */
  createdAt?: Date | string
  
  /** Updated timestamp */
  updatedAt?: Date | string
  
  /** Version for optimistic concurrency */
  version?: number
}

/**
 * Soft deletable entity
 */
export interface ISoftDeletable extends IEntity {
  /** Deleted flag */
  isDeleted?: boolean
  
  /** Deleted timestamp */
  deletedAt?: Date | string
  
  /** Deleted by */
  deletedBy?: string
}

/**
 * Auditable entity
 */
export interface IAuditable extends IEntity {
  /** Created by */
  createdBy?: string
  
  /** Updated by */
  updatedBy?: string
}

/**
 * Tree node interface
 */
export interface ITreeNode<T = any> {
  /** Node data */
  data: T
  
  /** Parent node */
  parent?: ITreeNode<T>
  
  /** Child nodes */
  children?: ITreeNode<T>[]
  
  /** Level */
  level: number
  
  /** Expanded */
  expanded?: boolean
  
  /** Has children */
  hasChildren?: boolean
  
  /** Key */
  key: any
}

/**
 * Change tracking
 */
export interface IChangeTracking<T = any> {
  /** Original value */
  originalValue: T
  
  /** Current value */
  currentValue: T
  
  /** Is modified */
  isModified: boolean
  
  /** Modified fields */
  modifiedFields: Set<keyof T>
  
  /** Reset changes */
  reset(): void
  
  /** Accept changes */
  accept(): void
}