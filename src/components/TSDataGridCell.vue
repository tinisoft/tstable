<template>
  <div class="ts-datagrid-body__cell" :class="cellClasses" :style="cellStyle" @click="handleClick" :tabindex="-1">
    <!-- ✅ FIXED: Only show input when editing AND cell is the active editing cell -->
    <template v-if="isActuallyEditing && column.editable !== false">
      <input v-if="!column.editor || column.editor.type === 'text'" type="text" :value="editValue" @input="handleInput"
        @blur="handleBlur" @keydown.enter.prevent="handleEnter" @keydown.esc.prevent="handleEscape"
        class="ts-datagrid-cell__input" ref="inputRef" />
      <input v-else-if="column.editor.type === 'number'" type="number" :value="editValue" :min="numberMin"
        :max="numberMax" :step="column.editor.step" @input="handleInput" @blur="handleBlur"
        @keydown.enter.prevent="handleEnter" @keydown.esc.prevent="handleEscape" class="ts-datagrid-cell__input"
        ref="inputRef" />
      <input v-else-if="column.editor.type === 'date'" type="date" :value="editValue" @input="handleInput"
        @blur="handleBlur" @keydown.enter.prevent="handleEnter" @keydown.esc.prevent="handleEscape"
        class="ts-datagrid-cell__input" ref="inputRef" />
      <input v-else-if="column.editor.type === 'checkbox'" type="checkbox" :checked="editValue"
        @change="handleCheckboxChange" @blur="handleBlur" @keydown.enter.prevent="handleEnter"
        @keydown.esc.prevent="handleEscape" class="ts-datagrid-cell__checkbox" ref="inputRef" />
      <select v-else-if="column.editor.type === 'select'" :value="editValue" @change="handleSelectChange"
        @blur="handleBlur" @keydown.enter.prevent="handleEnter" @keydown.esc.prevent="handleEscape"
        class="ts-datagrid-cell__select" ref="inputRef">
        <option v-if="column.editor.placeholder" value="">{{ column.editor.placeholder }}</option>
        <option v-for="(option, index) in column.editor.options" :key="index"
          :value="typeof option === 'object' ? option.value : option"
          :disabled="typeof option === 'object' ? option.disabled : false">
          {{ typeof option === 'object' ? option.label : option }}
        </option>
      </select>
    </template>

    <!-- ✅ Default: Show value (not input) -->
    <template v-else>
      <slot :value="value" :row="row" :column="column">
        {{ displayValue }}
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ColumnDefinition } from '@/types';
import { computed, ref, watch, nextTick } from 'vue'
import type { PropType } from 'vue'

const props = defineProps({
  column: {
    type: Object as PropType<ColumnDefinition>,
    required: true,
  },
  row: {
    type: Object as PropType<any>,
    required: true,
  },
  rowKey: {
    type: [String, Number],
    required: true,
  },
  value: {
    type: null,
    default: null,
  },
  editing: {
    type: Boolean,
    default: false,
  },
  focused: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'save', value: any): void
  (e: 'cancel'): void
  (e: 'click'): void
}>()

const inputRef = ref<HTMLInputElement | HTMLSelectElement>()
const editValue = ref(props.value)
const isEditable = computed(() => props.column.editable !== false)

// ✅ FIXED: Stricter check - only true when ACTUALLY editing this specific cell
const isActuallyEditing = computed(() => {
  return props.editing && props.column.editable !== false
})

// ✅ NEW: Convert min/max to appropriate number format
const numberMin = computed(() => {
  const min = props.column.editor?.min
  if (min === undefined || min === null) return undefined
  if (min instanceof Date) return min.getTime()
  return Number(min)
})

const numberMax = computed(() => {
  const max = props.column.editor?.max
  if (max === undefined || max === null) return undefined
  if (max instanceof Date) return max.getTime()
  return Number(max)
})

const displayValue = computed(() => {
  if (props.value == null) return ''

  if (props.column.formatter) {
    const formatted = props.column.formatter(props.value, props.row, props.column)
    if (typeof formatted === 'object') {
      return String(formatted)
    }
    return formatted
  }

  switch (props.column.type) {
    case 'date':
      return props.value ? new Date(props.value).toLocaleDateString() : ''
    case 'datetime':
      return props.value ? new Date(props.value).toLocaleString() : ''
    case 'boolean':
      return props.value ? 'Yes' : 'No'
    case 'number':
      return props.value != null ? Number(props.value).toLocaleString() : ''
    default:
      return String(props.value)
  }
})

const cellClasses = computed(() => ({
  [`ts-datagrid-body__cell--${props.column.type}`]: !!props.column.type,
  [`ts-datagrid-body__cell--${props.column.alignment}`]: !!props.column.alignment,
  'ts-datagrid-body__cell--editing': isActuallyEditing.value,
  'ts-datagrid-body__cell--editable': isEditable.value,
  [props.column.cssClass || '']: !!props.column.cssClass,
  'ts-datagrid-body__cell--focused': props.focused || false,
}))

const cellStyle = computed(() => ({
  width: props.column.width ? `${props.column.width}px` : undefined,
  minWidth: props.column.minWidth ? `${props.column.minWidth}px` : undefined,
  maxWidth: props.column.maxWidth ? `${props.column.maxWidth}px` : undefined,
}))

const handleClick = () => {
  emit('click')
  // ✅ Only emit edit if column is editable AND not already editing
  if (props.column.editable !== false && !props.editing) {
    emit('edit')
  }
}

const handleInput = (e: Event) => {
  editValue.value = (e.target as HTMLInputElement).value
}

const handleCheckboxChange = (e: Event) => {
  editValue.value = (e.target as HTMLInputElement).checked
  // Auto-save checkbox changes
  emit('save', editValue.value)
}

const handleSelectChange = (e: Event) => {
  editValue.value = (e.target as HTMLSelectElement).value
  // Auto-save select changes
  emit('save', editValue.value)
}

const handleBlur = () => {
  // Small delay to allow click events on other cells to process first
  setTimeout(() => {
    if (isActuallyEditing.value) {
      emit('save', editValue.value)
    }
  }, 100)
}

const handleEnter = () => {
  emit('save', editValue.value)
}

const handleEscape = () => {
  editValue.value = props.value
  emit('cancel')
}

// ✅ Watch editing state and focus input
watch(() => props.editing, (newVal) => {
  if (newVal && props.column.editable !== false) {
    editValue.value = props.value
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus()
        if (inputRef.value instanceof HTMLInputElement && inputRef.value.type === 'text') {
          inputRef.value.select()
        }
      }
    })
  }
}, { immediate: true })

// ✅ Watch value changes
watch(() => props.value, (newVal) => {
  if (!props.editing) {
    editValue.value = newVal
  }
})
</script>