/**
 * @fileoverview Validation types
 * @module @tsdatagrid/types/validation/validators
 */

import type { ValidationSeverity, ValidationResult } from '../core/base'

/**
 * Validation rule type
 */
export const enum ValidationRuleType {
  Required = 'required',
  Email = 'email',
  Numeric = 'numeric',
  Range = 'range',
  StringLength = 'stringLength',
  Pattern = 'pattern',
  Compare = 'compare',
  Custom = 'custom',
}

/**
 * Base validation rule
 */
export interface BaseValidationRule {
  /** Rule type */
  type: ValidationRuleType
  
  /** Error message */
  message?: string
  
  /** Severity */
  severity?: ValidationSeverity
  
  /** Ignore empty values */
  ignoreEmptyValue?: boolean
  
  /** Enabled */
  enabled?: boolean | ((value: any, row: any) => boolean)
}

/**
 * Required validation rule
 */
export interface RequiredRule extends BaseValidationRule {
  type: ValidationRuleType.Required
  
  /** Trim whitespace */
  trim?: boolean
}

/**
 * Email validation rule
 */
export interface EmailRule extends BaseValidationRule {
  type: ValidationRuleType.Email
}

/**
 * Numeric validation rule
 */
export interface NumericRule extends BaseValidationRule {
  type: ValidationRuleType.Numeric
  
  /** Allow decimal */
  allowDecimal?: boolean
  
  /** Allow negative */
  allowNegative?: boolean
}

/**
 * Range validation rule
 */
export interface RangeRule extends BaseValidationRule {
  type: ValidationRuleType.Range
  
  /** Minimum value */
  min?: number
  
  /** Maximum value */
  max?: number
  
  /** Inclusive */
  inclusive?: boolean
}

/**
 * String length validation rule
 */
export interface StringLengthRule extends BaseValidationRule {
  type: ValidationRuleType.StringLength
  
  /** Minimum length */
  min?: number
  
  /** Maximum length */
  max?: number
  
  /** Trim before check */
  trim?: boolean
}

/**
 * Pattern validation rule
 */
export interface PatternRule extends BaseValidationRule {
  type: ValidationRuleType.Pattern
  
  /** Pattern (RegExp or string) */
  pattern: RegExp | string
  
  /** Flags */
  flags?: string
}

/**
 * Compare validation rule
 */
export interface CompareRule extends BaseValidationRule {
  type: ValidationRuleType.Compare
  
  /** Comparison type */
  comparisonType: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual'
  
  /** Comparison value or field */
  comparisonValue?: any
  
  /** Comparison field */
  comparisonField?: string
}

/**
 * Custom validation rule
 */
export interface CustomRule extends BaseValidationRule {
  type: ValidationRuleType.Custom
  
  /** Validator function */
  validator: (value: any, row: any) => boolean | string | Promise<boolean | string>
}

/**
 * Validation rule union
 */
export type ValidationRule =
  | RequiredRule
  | EmailRule
  | NumericRule
  | RangeRule
  | StringLengthRule
  | PatternRule
  | CompareRule
  | CustomRule

/**
 * Validator interface
 */
export interface IValidator {
  /** Validate value */
  validate(value: any, row: any): ValidationResult | Promise<ValidationResult>
  
  /** Validation rules */
  rules: ValidationRule[]
}

/**
 * Async validator
 */
export type AsyncValidator = (value: any, row: any) => Promise<boolean | string>

/**
 * Sync validator
 */
export type SyncValidator = (value: any, row: any) => boolean | string

/**
 * Validator function
 */
export type Validator = SyncValidator | AsyncValidator