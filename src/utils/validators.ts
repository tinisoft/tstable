/**
 * @fileoverview Enhanced validators utility
 * @module utils/validators
 */

import type { ColumnDefinition } from '../types'
import { ColumnType } from '../types/core/column'

export type Validator = (
  value: any,
  context?: { row?: any; column?: ColumnDefinition }
) => boolean | string | Promise<boolean | string>

export type ValidationResult = {
  isValid: boolean
  errors: Record<string, string>
  warnings?: Record<string, string>
  pending?: Set<string>
}

// ===== CREATE VALIDATOR =====
export const createValidator = (
  validateFn: (
    value: any,
    context?: { row?: any; column?: ColumnDefinition }
  ) => boolean | string | Promise<boolean | string>,
  message?: string
): Validator => {
  return async (value, context) => {
    try {
      const result = await validateFn(value, context)
      return result !== true ? (message || String(result)) : true
    } catch (error) {
      return `Validation error: ${error instanceof Error ? error.message : String(error)}`
    }
  }
}

// ===== BUILT-IN VALIDATORS =====

export const required = (customMessage?: string) =>
  createValidator(
    (value) => value !== null && value !== undefined && value !== '',
    customMessage || 'This field is required'
  )

export const email = (customMessage?: string) =>
  createValidator(
    (value) => {
      if (!value) return true
      const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return pattern.test(String(value))
    },
    customMessage || 'Please enter a valid email address'
  )

export const url = (customMessage?: string) =>
  createValidator(
    (value) => {
      if (!value) return true
      try {
        new URL(String(value))
        return true
      } catch {
        return false
      }
    },
    customMessage || 'Please enter a valid URL'
  )

export const minLength = (min: number, customMessage?: string) =>
  createValidator(
    (value) => !value || String(value).length >= min,
    customMessage || `Minimum length is ${min} characters`
  )

export const maxLength = (max: number, customMessage?: string) =>
  createValidator(
    (value) => !value || String(value).length <= max,
    customMessage || `Maximum length is ${max} characters`
  )

export const pattern = (regex: RegExp, customMessage?: string) =>
  createValidator(
    (value) => !value || regex.test(String(value)),
    customMessage || 'Invalid format'
  )

export const range = (min: number, max: number, customMessage?: string) =>
  createValidator(
    (value) => {
      if (!value) return true
      const num = Number(value)
      return !isNaN(num) && num >= min && num <= max
    },
    customMessage || `Value must be between ${min} and ${max}`
  )

export const minValue = (min: number, customMessage?: string) =>
  createValidator(
    (value) => {
      if (!value) return true
      const num = Number(value)
      return !isNaN(num) && num >= min
    },
    customMessage || `Value must be at least ${min}`
  )

export const maxValue = (max: number, customMessage?: string) =>
  createValidator(
    (value) => {
      if (!value) return true
      const num = Number(value)
      return !isNaN(num) && num <= max
    },
    customMessage || `Value must be at most ${max}`
  )

export const validDate = (customMessage?: string) =>
  createValidator(
    (value) => {
      if (!value) return true
      const date = new Date(value)
      return date instanceof Date && !isNaN(date.getTime())
    },
    customMessage || 'Please enter a valid date'
  )

export const minDate = (minDate: Date | string, customMessage?: string) =>
  createValidator(async (value) => {
    if (!value) return true
    const date = new Date(value)
    const min = new Date(minDate)
    if (isNaN(date.getTime()) || date < min) {
      const minDateStr = min.toLocaleDateString()
      return customMessage || `Date must be on or after ${minDateStr}`
    }
    return true
  })

export const maxDate = (maxDate: Date | string, customMessage?: string) =>
  createValidator(async (value) => {
    if (!value) return true
    const date = new Date(value)
    const max = new Date(maxDate)
    if (isNaN(date.getTime()) || date > max) {
      const maxDateStr = max.toLocaleDateString()
      return customMessage || `Date must be on or before ${maxDateStr}`
    }
    return true
  })

export const unique = (data: any[], keyField: string, customMessage?: string) =>
  createValidator(
    async (value, context) => {
      if (!value || !context?.row) return true
      await new Promise((resolve) => setTimeout(resolve, 100))
      const duplicates = data.filter(
        (row) => row !== context.row && row[keyField] === value
      )
      return duplicates.length === 0 || customMessage || 'This value must be unique'
    }
  )

export const custom = (validatorFn: Validator, message?: string) =>
  createValidator(async (value, context) => {
    const result = await validatorFn(value, context)
    return result === true ? true : message || String(result)
  })

export const alphanumeric = (customMessage?: string) =>
  pattern(
    /^[a-zA-Z0-9]+$/,
    customMessage || 'Only alphanumeric characters are allowed'
  )

export const numeric = (customMessage?: string) =>
  pattern(/^[0-9]+$/, customMessage || 'Only numeric characters are allowed')

export const alpha = (customMessage?: string) =>
  pattern(/^[a-zA-Z]+$/, customMessage || 'Only alphabetic characters are allowed')

export const phone = (customMessage?: string) =>
  pattern(
    /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/,
    customMessage || 'Please enter a valid phone number'
  )

export const zipCode = (customMessage?: string) =>
  pattern(/^\d{5}(-\d{4})?$/, customMessage || 'Please enter a valid ZIP code')

export const creditCard = (customMessage?: string) =>
  createValidator(
    (value) => {
      if (!value) return true
      // Luhn algorithm
      const digits = String(value).replace(/\D/g, '')
      let sum = 0
      let isEven = false

      for (let i = digits.length - 1; i >= 0; i--) {
        let digit = parseInt(digits[i])

        if (isEven) {
          digit *= 2
          if (digit > 9) digit -= 9
        }

        sum += digit
        isEven = !isEven
      }

      return sum % 10 === 0
    },
    customMessage || 'Please enter a valid credit card number'
  )

// ===== COMBINE VALIDATORS =====
export async function combineValidators(...validators: Validator[]): Promise<Validator> {
  return async (value, context) => {
    const results = await Promise.all(validators.map((v) => v(value, context)))

    for (const result of results) {
      if (result !== true) {
        return typeof result === 'string' ? result : 'Validation failed'
      }
    }
    return true
  }
}

// ===== VALIDATE ROW =====
export async function validateRow(
  row: any,
  columns: ColumnDefinition[],
  customValidators?: Record<string, Validator>,
  options: { skipAsync?: boolean } = {}
): Promise<ValidationResult> {
  const errors: Record<string, string> = {}
  const warnings: Record<string, string> = {}
  const pending: Set<string> = new Set()

  const validationPromises: Promise<void>[] = []

  for (const col of columns) {
    const fieldKey = String(col.field)
    
    if (!col.editable || (!col.validator && !customValidators?.[fieldKey])) {
      continue
    }

    const value = row[fieldKey]
    const validators: Validator[] = []

    // Column validator (wrap to match Validator signature)
    if (col.validator) {
      validators.push(async (val, ctx) => {
        const result = await col.validator!(val, ctx?.row || {})
        return result
      })
    }

    // Custom validators
    if (customValidators?.[fieldKey]) {
      validators.push(customValidators[fieldKey])
    }

    const validateFieldAsync = async () => {
      try {
        for (const validator of validators) {
          const result = await validator(value, { row, column: col })
          if (result !== true) {
            errors[fieldKey] =
              typeof result === 'string'
                ? result
                : 'Invalid value'
            return
          }
        }
      } catch (error) {
        errors[fieldKey] = error instanceof Error ? error.message : 'Validation error'
      }
    }

    if (options.skipAsync) {
      const syncValidator = validators.find((v) => v.toString().includes('async') === false)
      if (syncValidator) {
        const result = syncValidator(value, { row, column: col })
        if (result !== true && typeof result !== 'object') {
          errors[fieldKey] =
            typeof result === 'string'
              ? result
              : 'Invalid value'
        }
      }
    } else {
      validationPromises.push(validateFieldAsync())
      pending.add(fieldKey)
    }
  }

  if (validationPromises.length > 0) {
    await Promise.all(validationPromises)
    pending.clear()
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    pending: options.skipAsync ? undefined : pending
  }
}

// ===== VALIDATE FIELD =====
export const validateField = async (
  value: any,
  column: ColumnDefinition,
  context: { row?: any } = {}
): Promise<{ isValid: boolean; error?: string; pending?: boolean }> => {
  if (!column.validator) {
    return { isValid: true }
  }

  try {
    const result = await column.validator(value, context.row || {})
    return {
      isValid: result === true,
      error: typeof result === 'string' ? result : undefined,
      pending: false
    }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Validation error',
      pending: false
    }
  }
}

// ===== CREATE COLUMN VALIDATOR =====
export const createColumnValidator = async (
  column: ColumnDefinition
): Promise<Validator> => {
  const validators: Validator[] = []

  if (column.type === ColumnType.Number) {
    if (column.editor?.min !== undefined) {
      validators.push(minValue(Number(column.editor.min)))
    }
    if (column.editor?.max !== undefined) {
      validators.push(maxValue(Number(column.editor.max)))
    }
  }

  if (column.type === ColumnType.String) {
    if (column.editor?.min !== undefined) {
      validators.push(minLength(Number(column.editor.min)))
    }
    if (column.editor?.max !== undefined) {
      validators.push(maxLength(Number(column.editor.max)))
    }
  }

  if (column.validator) {
    validators.push(async (value, context) => {
      const result = await column.validator!(value, context?.row || {})
      return result
    })
  }

  if (validators.length === 0) {
    return async () => true
  }

  return combineValidators(...validators)
}

// ===== BATCH VALIDATE ROWS =====
export async function batchValidateRows(
  rows: any[],
  columns: ColumnDefinition[],
  options?: { maxConcurrent?: number; skipAsync?: boolean }
): Promise<{
  validRows: any[]
  invalidRows: { row: any; errors: Record<string, string> }[]
}> {
  const { skipAsync = false } = options || {}

  const results = await Promise.all(
    rows.map(async (row) => {
      const result = await validateRow(row, columns, undefined, { skipAsync })
      return { row, result }
    })
  )

  const validRows: any[] = []
  const invalidRows: { row: any; errors: Record<string, string> }[] = []

  results.forEach(({ row, result }) => {
    if (result.isValid) {
      validRows.push(row)
    } else {
      invalidRows.push({ row, errors: result.errors })
    }
  })

  return { validRows, invalidRows }
}

// ===== GET DEFAULT ERROR MESSAGE =====
export function getDefaultErrorMessage(column: ColumnDefinition): string {
  if (column.type === ColumnType.Number) {
    return 'Please enter a valid number'
  }
  if (column.type === ColumnType.Date || column.type === ColumnType.DateTime) {
    return 'Please enter a valid date'
  }
  // Check format string instead of type for email
  if (column.format === 'email') {
    return 'Please enter a valid email'
  }
  return 'Invalid value'
}