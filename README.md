# TSDataGrid

<div align="center">

[![npm version](https://img.shields.io/npm/v/tsdatagrid.svg)](https://www.npmjs.com/package/tsdatagrid)
[![npm downloads](https://img.shields.io/npm/dm/tsdatagrid.svg)](https://www.npmjs.com/package/tsdatagrid)
[![license](https://img.shields.io/npm/l/tsdatagrid.svg)](https://github.com/yourusername/tsdatagrid/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.0-green.svg)](https://vuejs.org/)

**Advanced, feature-rich data grid component for Vue 3 with TypeScript support**

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples)

</div>

---

## 🌟 Features

### Core Features
- ✅ **Vue 3 & TypeScript** - Built with Vue 3 Composition API and full TypeScript support
- 📊 **Data Sources** - Support for local arrays and OData endpoints
- 🎨 **Theming** - Multiple built-in themes (default, material, dark)
- 📱 **Responsive** - Works seamlessly on desktop and mobile devices
- ⚡ **Performance** - Virtual scrolling for large datasets (1M+ rows)

### Data Management
- 🔍 **Advanced Filtering** - Column filters with unique value selection and multiple operators
- 🔄 **Multi-Sort** - Sort by multiple columns simultaneously
- 📑 **Pagination** - Built-in pagination with customizable page sizes
- 🔎 **Global Search** - Search across all searchable columns with highlighting
- 📊 **Grouping** - Hierarchical data grouping with expand/collapse and group summaries
- ♾️ **Infinite Scroll** - Load data on-demand as user scrolls

### User Experience
- ✏️ **Inline Editing** - Multiple editor types (text, number, date, select, checkbox)
- ↩️ **Undo/Redo** - Full undo/redo support with keyboard shortcuts (Ctrl+Z/Y)
- ✔️ **Row Selection** - Single or multiple row selection with checkboxes
- 🎯 **Column Chooser** - Show/hide columns with drag-and-drop reordering
- 📏 **Column Resizing** - Resize columns by dragging or auto-fit content
- 🔀 **Column Reordering** - Drag and drop column reordering in header or chooser
- 🔒 **Locked Columns** - Pin important columns to prevent hiding
- 🖱️ **Context Menu** - Right-click context menus on rows and headers
- ⌨️ **Keyboard Navigation** - Navigate cells with arrow keys, Tab, Enter, Esc

### Export & Integration
- 📤 **Export** - Export to CSV, Excel, PDF, and JSON formats
- 📋 **Clipboard** - Copy/cut/paste with Ctrl+C/X/V support
- 🌐 **OData Support** - Full OData v4 query protocol support
- 💾 **State Persistence** - Save and restore grid state to localStorage
- 🎨 **Custom Formatters** - Format cell values with custom functions
- ✅ **Validation** - Built-in and custom validators for editing

### Advanced Features
- 📈 **Summary Row** - Calculate sum, avg, min, max, count (page and total)
- 🎨 **Custom Cell Rendering** - Render custom components via slots
- 🔧 **Toolbar Actions** - Customizable toolbar with custom actions
- 🎨 **Conditional Styling** - Apply styles based on cell values
- 🔌 **Plugin System** - Extend functionality with composables
- 🔄 **Row Expansion** - Expandable detail rows with custom templates

---

## 📦 Installation

```bash
# npm
npm install tsdatagrid

# yarn
yarn add tsdatagrid

# pnpm
pnpm add tsdatagrid
```

**Peer Dependencies:**
```bash
npm install vue@^3.3.4
```

**Optional Dependencies (for full feature support):**
```bash
npm install jspdf jspdf-autotable papaparse xlsx
```

---

## 🚀 Quick Start

### 1. Global Registration (Recommended)

```typescript
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import TSDataGridPlugin from 'tsdatagrid'
import 'tsdatagrid/dist/style.css'

const app = createApp(App)
app.use(TSDataGridPlugin)
app.mount('#app')
```

### 2. Basic Usage

```vue
<template>
  <TSDataGrid
    :columns="columns"
    :data-source="dataSource"
    :allow-sorting="true"
    :allow-filtering="true"
    :allow-paging="true"
    :page-size="20"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ColumnDefinition, DataSourceConfig } from 'tsdatagrid'
import { ColumnType, Alignment, DataSourceType } from 'tsdatagrid'

const columns = ref<ColumnDefinition[]>([
  { 
    field: 'id', 
    title: 'ID', 
    type: ColumnType.Number, 
    width: 80,
    alignment: Alignment.Right
  },
  { 
    field: 'name', 
    title: 'Name', 
    type: ColumnType.String, 
    width: 200,
    searchable: true
  },
  { 
    field: 'email', 
    title: 'Email', 
    type: ColumnType.String, 
    width: 250,
    searchable: true
  },
  { 
    field: 'salary', 
    title: 'Salary', 
    type: ColumnType.Number, 
    width: 120,
    alignment: Alignment.Right,
    formatter: (value) => `$${Number(value).toLocaleString()}`
  },
  { 
    field: 'hireDate', 
    title: 'Hire Date', 
    type: ColumnType.Date, 
    width: 130,
    formatter: (value) => new Date(value).toLocaleDateString()
  }
])

const dataSource = ref<DataSourceConfig>({
  type: DataSourceType.Local,
  data: [
    { id: 1, name: 'John Doe', email: 'john@example.com', salary: 75000, hireDate: '2020-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', salary: 85000, hireDate: '2019-03-22' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', salary: 95000, hireDate: '2018-07-10' }
  ]
})
</script>
```

---

## 📚 Documentation

### Column Definition

```typescript
interface ColumnDefinition {
  field: string                    // Field name in data
  title: string                    // Column header text
  type?: ColumnType                // Column data type
  width?: number | string          // Column width
  minWidth?: number               // Minimum width
  maxWidth?: number               // Maximum width
  alignment?: Alignment           // Text alignment
  
  // Features
  sortable?: boolean              // Enable sorting (default: true)
  filterable?: boolean            // Enable filtering (default: true)
  groupable?: boolean             // Enable grouping
  editable?: boolean              // Enable editing
  resizable?: boolean             // Enable resizing (default: true)
  searchable?: boolean            // Include in global search
  locked?: boolean                // Prevent hiding/reordering
  
  // Display
  visible?: boolean               // Show/hide column (default: true)
  cssClass?: string              // Custom CSS class
  
  // Custom rendering
  formatter?: (value: any, row: any, column: ColumnDefinition) => string | number
  
  // Editing
  editor?: EditorConfig
  validator?: (value: any) => boolean | string
}

// Column Types
enum ColumnType {
  String = 'string',
  Number = 'number',
  Date = 'date',
  DateTime = 'datetime',
  Boolean = 'boolean'
}

// Alignment
enum Alignment {
  Left = 'left',
  Center = 'center',
  Right = 'right'
}
```

### Editor Configuration

```typescript
interface EditorConfig {
  type: EditorType
  placeholder?: string
  options?: any[] | { value: any; label: string }[]
  min?: number
  max?: number
  step?: number
  maxLength?: number
}

enum EditorType {
  Text = 'text',
  Number = 'number',
  Date = 'date',
  Select = 'select',
  Checkbox = 'checkbox'
}
```

### Data Source Configuration

#### Local Data Source
```typescript
const dataSource: DataSourceConfig = {
  type: DataSourceType.Local,
  data: [
    { id: 1, name: 'Product 1', price: 100 },
    { id: 2, name: 'Product 2', price: 200 }
  ]
}
```

#### OData Data Source
```typescript
const dataSource: DataSourceConfig = {
  type: DataSourceType.OData,
  url: 'https://services.odata.org/V4/Northwind/Northwind.svc/Products',
  serverPaging: true,
  serverSorting: true,
  serverFiltering: true,
  pageSize: 20
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dataSource` | `DataSourceConfig` | **required** | Data source configuration |
| `columns` | `ColumnDefinition[]` | **required** | Column definitions |
| `keyField` | `string` | `'id'` | Unique key field name |
| `allowSorting` | `boolean` | `true` | Enable column sorting |
| `allowFiltering` | `boolean` | `true` | Enable column filtering |
| `allowPaging` | `boolean` | `true` | Enable pagination |
| `allowSelection` | `boolean` | `false` | Enable row selection |
| `allowEditing` | `boolean` | `false` | Enable inline editing |
| `allowAdding` | `boolean` | `false` | Enable adding new rows |
| `allowDeleting` | `boolean` | `false` | Enable deleting rows |
| `allowGrouping` | `boolean` | `false` | Enable data grouping |
| `allowExport` | `boolean` | `false` | Enable data export |
| `allowRowExpansion` | `boolean` | `false` | Enable expandable detail rows |
| `allowColumnReordering` | `boolean` | `true` | Enable column drag-drop reordering |
| `allowColumnResizing` | `boolean` | `true` | Enable column resizing |
| `allowInfiniteScroll` | `boolean` | `false` | Enable infinite scroll loading |
| `enableVirtualization` | `boolean` | `false` | Enable virtual scrolling |
| `enableKeyboardNavigation` | `boolean` | `true` | Enable keyboard navigation |
| `showToolbar` | `boolean` | `true` | Show toolbar |
| `showSearch` | `boolean` | `true` | Show global search |
| `showColumnChooser` | `boolean` | `true` | Show column chooser button |
| `showGroupPanel` | `boolean` | `false` | Show group panel |
| `showPagination` | `boolean` | `true` | Show pagination footer |
| `showPaginationInfo` | `boolean` | `true` | Show pagination info text |
| `showPageSizes` | `boolean` | `true` | Show page size dropdown |
| `showSummary` | `boolean` | `false` | Show summary row |
| `showGroupSummary` | `boolean` | `false` | Show summaries for groups |
| `pageSize` | `number` | `20` | Records per page |
| `pageSizes` | `number[]` | `[10,20,50,100]` | Available page sizes |
| `rowHeight` | `number` | `40` | Height of each row (px) |
| `maxHeight` | `number \| string` | `'auto'` | Maximum grid height |
| `theme` | `string` | `'default'` | Theme name (default, material, dark) |
| `stateKey` | `string` | `''` | Key for state persistence |
| `selectionMode` | `SelectionMode` | `{ mode: 'none' }` | Selection configuration |
| `summary` | `SummaryConfig[]` | `[]` | Summary configurations |

### Selection Mode

```typescript
interface SelectionMode {
  mode: SelectionModeType
  checkboxes?: boolean
}

enum SelectionModeType {
  None = 'none',
  Single = 'single',
  Multiple = 'multiple'
}

// Example
const selectionMode: SelectionMode = {
  mode: SelectionModeType.Multiple,
  checkboxes: true
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `row-click` | `(row: any)` | Row clicked |
| `row-dblclick` | `(row: any)` | Row double-clicked |
| `cell-click` | `(row: any, column: ColumnDefinition)` | Cell clicked |
| `selection-changed` | `(selectedRows: any[])` | Selection changed |
| `data-loaded` | `(data: any[])` | Data loaded |
| `sort-changed` | `(descriptors: SortDescriptor[])` | Sorting changed |
| `filter-changed` | `(filters: FilterCondition[])` | Filters changed |
| `group-changed` | `(descriptors: any[])` | Grouping changed |
| `page-changed` | `(page: number, pageSize: number)` | Page changed |
| `edit-saved` | `(change: Change, mode: string)` | Edit saved |
| `column-reordered` | `(order: string[])` | Columns reordered |
| `column-resized` | `(column: ColumnDefinition, width: number)` | Column resized |
| `column-visibility-changed` | `(visibleColumns: string[])` | Column visibility changed |
| `row-expansion-changed` | `(payload: ExpansionPayload)` | Row expansion changed |
| `key-down` | `(payload: KeyboardPayload)` | Key pressed |
| `data-error` | `(error: Error)` | Data loading error |

---

## 📖 Examples

### Example 1: Basic Grid with Selection

```vue
<template>
  <TSDataGrid
    ref="gridRef"
    :columns="columns"
    :data-source="dataSource"
    key-field="id"
    
    <!-- Core Features -->
    :allow-sorting="true"
    :allow-filtering="true"
    :allow-paging="true"
    
    <!-- Selection -->
    :allow-selection="true"
    :selection-mode="selectionMode"
    
    <!-- UI -->
    :show-toolbar="true"
    :show-search="true"
    :max-height="600"
    :page-size="20"
    
    @selection-changed="handleSelectionChanged"
    @row-click="handleRowClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SelectionModeType, type SelectionMode } from 'tsdatagrid'

const gridRef = ref()

const selectionMode: SelectionMode = {
  mode: SelectionModeType.Multiple,
  checkboxes: true
}

const handleSelectionChanged = (selectedRows: any[]) => {
  console.log('Selected:', selectedRows.length, 'rows')
}

const handleRowClick = (row: any) => {
  console.log('Clicked:', row.name)
}
</script>
```

### Example 2: Inline Editing with Undo/Redo

```vue
<template>
  <div>
    <!-- Undo/Redo Controls -->
    <div class="toolbar">
      <button @click="handleUndo" :disabled="!canUndo">
        ↩️ Undo (Ctrl+Z)
      </button>
      <button @click="handleRedo" :disabled="!canRedo">
        ↪️ Redo (Ctrl+Y)
      </button>
    </div>

    <TSDataGrid
      ref="gridRef"
      :columns="columns"
      :data-source="dataSource"
      
      :allow-editing="true"
      :allow-adding="true"
      :allow-deleting="true"
      
      @edit-saved="handleEditSaved"
      @state-changed="handleStateChanged"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ColumnType, Alignment, type EditorType } from 'tsdatagrid'

const gridRef = ref()
const canUndo = ref(false)
const canRedo = ref(false)

const columns = [
  {
    field: 'name',
    title: 'Name',
    type: ColumnType.String,
    editable: true,
    editor: {
      type: 'text' as EditorType,
      placeholder: 'Enter name'
    }
  },
  {
    field: 'salary',
    title: 'Salary',
    type: ColumnType.Number,
    editable: true,
    editor: {
      type: 'number' as EditorType,
      min: 0,
      max: 500000,
      step: 1000
    },
    alignment: Alignment.Right,
    formatter: (value) => `$${Number(value).toLocaleString()}`
  },
  {
    field: 'department',
    title: 'Department',
    editable: true,
    editor: {
      type: 'select' as EditorType,
      options: ['IT', 'HR', 'Sales', 'Marketing']
    }
  },
  {
    field: 'hireDate',
    title: 'Hire Date',
    type: ColumnType.Date,
    editable: true,
    editor: {
      type: 'date' as EditorType
    }
  }
]

const handleStateChanged = (state: any) => {
  if (state.canUndo !== undefined) {
    canUndo.value = state.canUndo
  }
  if (state.canRedo !== undefined) {
    canRedo.value = state.canRedo
  }
}

const handleUndo = () => {
  if (gridRef.value && canUndo.value) {
    gridRef.value.undo()
  }
}

const handleRedo = () => {
  if (gridRef.value && canRedo.value) {
    gridRef.value.redo()
  }
}

const handleEditSaved = (change: any, mode: string) => {
  console.log('Edit:', change.type, change.field, change.newValue)
}
</script>
```

### Example 3: Export

```vue
<template>
  <div>
    <div class="toolbar">
      <button @click="exportToCsv">📄 Export CSV</button>
      <button @click="exportToExcel">📗 Export Excel</button>
      <button @click="exportToPdf">📕 Export PDF</button>
      <button @click="exportSelected" :disabled="selectedCount === 0">
        📤 Export Selected
      </button>
    </div>

    <TSDataGrid
      ref="gridRef"
      :columns="columns"
      :data-source="dataSource"
      
      :allow-export="true"
      :allow-selection="true"
      :selection-mode="{ mode: SelectionModeType.Multiple, checkboxes: true }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SelectionModeType } from 'tsdatagrid'

const gridRef = ref()
const selectedCount = ref(0)

const exportToCsv = () => {
  gridRef.value?.exportData('csv')
}

const exportToExcel = () => {
  gridRef.value?.exportData('excel')
}

const exportToPdf = () => {
  gridRef.value?.exportData('pdf')
}

const exportSelected = () => {
  gridRef.value?.exportData('csv')
}
</script>
```

### Example 4: Grouping with Summaries

```vue
<template>
  <TSDataGrid
    :columns="columns"
    :data-source="dataSource"
    
    :allow-grouping="true"
    :show-group-panel="true"
    :show-summary="true"
    :show-group-summary="true"
    :summary="summaryConfig"
    
    @group-changed="handleGroupChanged"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SummaryConfig } from 'tsdatagrid'

const summaryConfig = ref<SummaryConfig[]>([
  { field: 'salary', type: 'sum', label: 'Total Salary' },
  { field: 'salary', type: 'avg', label: 'Average Salary' },
  { field: 'id', type: 'count', label: 'Employee Count' }
])

const handleGroupChanged = (descriptors: any[]) => {
  console.log('Grouped by:', descriptors.map(d => d.field))
}
</script>
```

### Example 5: Virtual Scrolling (Large Datasets)

```vue
<template>
  <TSDataGrid
    :columns="columns"
    :data-source="dataSource"
    
    :enable-virtualization="true"
    :virtual-row-height="40"
    :virtual-row-buffer="5"
    :max-height="600"
    
    :allow-sorting="true"
    :allow-filtering="true"
  />
</template>

<script setup lang="ts">
// Generate large dataset
const generateLargeDataset = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Employee ${i + 1}`,
    email: `employee${i + 1}@example.com`,
    salary: Math.floor(Math.random() * 100000) + 30000,
  }))
}

const dataSource = {
  type: DataSourceType.Local,
  data: generateLargeDataset(100000) // 100K rows
}
</script>
```

---

## 🔧 Grid API Reference

Access grid methods via template ref:

```typescript
// Data Operations
gridRef.value?.refresh()              // Reload data
gridRef.value?.getData()              // Get raw data
gridRef.value?.getProcessedData()     // Get filtered/sorted data

// Selection
gridRef.value?.selectAll()            // Select all rows
gridRef.value?.clearSelection()       // Clear selection
gridRef.value?.getSelectedRows()      // Get selected rows
gridRef.value?.selectByKeys([1,2,3])  // Select by keys

// Filtering
gridRef.value?.clearFilters()         // Clear all filters
gridRef.value?.applyFilter('name', FilterOperator.Contains, 'John')
gridRef.value?.removeFilter('name')

// Grouping
gridRef.value?.groupBy('department')  // Group by field
gridRef.value?.groupBy(['dept', 'pos']) // Multiple groups
gridRef.value?.clearGrouping()        // Clear groups

// Columns
gridRef.value?.showColumn('email')    // Show column
gridRef.value?.hideColumn('phone')    // Hide column
gridRef.value?.setColumnWidth('name', 250)
gridRef.value?.autoSizeColumn('name')
gridRef.value?.autoSizeAllColumns()
gridRef.value?.resetColumnWidths()

// Export
gridRef.value?.exportData('csv')      // Export CSV
gridRef.value?.exportData('excel')    // Export Excel
gridRef.value?.exportData('pdf')      // Export PDF

// Clipboard
gridRef.value?.copySelectedRows()     // Copy selection
gridRef.value?.cutSelectedRows()      // Cut selection
gridRef.value?.pasteRows()            // Paste

// Undo/Redo
gridRef.value?.undo()                 // Undo last change
gridRef.value?.redo()                 // Redo last undo
gridRef.value?.canUndo()              // Check if can undo
gridRef.value?.canRedo()              // Check if can redo
gridRef.value?.clearUndoHistory()     // Clear history

// Row Expansion
gridRef.value?.expandRow(rowKey)      // Expand row
gridRef.value?.collapseRow(rowKey)    // Collapse row
gridRef.value?.expandAllRows()        // Expand all
gridRef.value?.collapseAllRows()      // Collapse all

// Keyboard Navigation
gridRef.value?.setFocus(rowKey, columnField)
gridRef.value?.moveFocus('down')      // Move focus
gridRef.value?.moveToFirstCell()      // Focus first cell
gridRef.value?.clearFocus()           // Clear focus
```

---

## 🎨 Theming

TSDataGrid comes with three built-in themes:

```vue
<!-- Default theme -->
<TSDataGrid theme="default" ... />

<!-- Material theme -->
<TSDataGrid theme="material" ... />

<!-- Dark theme -->
<TSDataGrid theme="dark" ... />
```

### Custom Styling

Override CSS variables for custom styling:

```css
:root {
  --tsdatagrid-primary-color: #1976d2;
  --tsdatagrid-header-bg: #f5f5f5;
  --tsdatagrid-row-hover-bg: #f0f0f0;
  --tsdatagrid-border-color: #e0e0e0;
  --tsdatagrid-font-family: 'Roboto', sans-serif;
  --tsdatagrid-header-height: 48px;
  --tsdatagrid-row-height: 40px;
  --tsdatagrid-selection-bg: #e3f2fd;
  --tsdatagrid-focus-border: #2196f3;
}
```

---

## ⌨️ Keyboard Shortcuts

TSDataGrid supports extensive keyboard navigation:

| Shortcut | Action |
|----------|--------|
| Arrow Keys | Navigate between cells |
| Tab | Move to next cell |
| Shift + Tab | Move to previous cell |
| Home | Move to first cell in row |
| End | Move to last cell in row |
| Ctrl + Home | Move to first cell in grid |
| Ctrl + End | Move to last cell in grid |
| Page Up | Scroll up one page |
| Page Down | Scroll down one page |
| Enter | Start editing / Save edit |
| Esc | Cancel editing |
| F2 | Start editing focused cell |
| Space | Toggle row selection |
| Ctrl + A | Select all rows |
| Shift + Arrow | Extend selection |
| Ctrl + C | Copy selected rows |
| Ctrl + X | Cut selected rows |
| Ctrl + V | Paste rows |
| Ctrl + Z | Undo last change |
| Ctrl + Y | Redo last undo |
| Delete | Delete selected rows |

---

## 🎯 Custom Templates

TSDataGrid supports extensive customization via slots.

### Cell Templates

```vue
<template>
  <TSDataGrid :columns="columns" :data-source="dataSource">
    <!-- Custom cell template -->
    <template #cell-status="{ value, row }">
      <span :class="['badge', `badge-${value.toLowerCase()}`]">
        {{ value }}
      </span>
    </template>
    
    <!-- Custom actions column -->
    <template #cell-actions="{ row }">
      <button @click="editRow(row)">Edit</button>
      <button @click="deleteRow(row)">Delete</button>
    </template>
  </TSDataGrid>
</template>
```

### Header Templates

```vue
<template>
  <TSDataGrid :columns="columns" :data-source="dataSource">
    <!-- Custom header template -->
    <template #header-name="{ column }">
      <div class="custom-header">
        <span class="icon">👤</span>
        {{ column.title }}
      </div>
    </template>
  </TSDataGrid>
</template>
```

### Detail Row Template

```vue
<template>
  <TSDataGrid 
    :columns="columns" 
    :data-source="dataSource"
    :allow-row-expansion="true"
  >
    <!-- Expandable detail row -->
    <template #detail="{ row }">
      <div class="detail-panel">
        <h3>{{ row.name }} - Details</h3>
        <div class="detail-content">
          <p><strong>Email:</strong> {{ row.email }}</p>
          <p><strong>Phone:</strong> {{ row.phone }}</p>
        </div>
      </div>
    </template>
  </TSDataGrid>
</template>
```

### Empty State Template

```vue
<template>
  <TSDataGrid :columns="columns" :data-source="dataSource">
    <!-- Custom empty state -->
    <template #empty>
      <div class="empty-state">
        <img src="/empty-icon.svg" alt="No data" />
        <h3>No Employees Found</h3>
        <p>Add your first employee to get started</p>
        <button @click="addEmployee">Add Employee</button>
      </div>
    </template>
  </TSDataGrid>
</template>
```

---

## 🔌 Advanced Features

### OData Integration

Full OData v4 support for server-side operations:

```typescript
const dataSource: DataSourceConfig = {
  type: DataSourceType.OData,
  url: 'https://services.odata.org/V4/Northwind/Northwind.svc/Products',
  
  // Enable server-side operations
  serverPaging: true,
  serverSorting: true,
  serverFiltering: true,
  serverGrouping: true,
  
  // Configuration
  pageSize: 20,
  
  // Custom headers (optional)
  headers: {
    'Authorization': 'Bearer token'
  }
}
```

### Validation

Add validators to editable columns:

```typescript
const columns: ColumnDefinition[] = [
  {
    field: 'email',
    title: 'Email',
    editable: true,
    validator: (value: string) => {
      if (!value) return 'Email is required'
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Invalid email format'
      }
      return true
    }
  }
]
```

### Summary Calculations

Configure aggregations for footer row:

```typescript
import type { SummaryConfig } from 'tsdatagrid'

const summaryConfig: SummaryConfig[] = [
  {
    field: 'salary',
    type: 'sum',
    label: 'Total Salary',
    scope: 'all',
    formatter: (value) => `${value.toLocaleString()}`,
    precision: 2
  },
  {
    field: 'salary',
    type: 'avg',
    label: 'Average Salary',
    scope: 'page'
  },
  {
    field: 'id',
    type: 'count',
    label: 'Total Employees'
  }
]
```

### Custom Cell Styling

Apply conditional styles:

```typescript
const columns: ColumnDefinition[] = [
  {
    field: 'status',
    title: 'Status',
    cssClass: 'status-column',
    cellCssClass: (row: any) => {
      return `status-${row.status.toLowerCase()}`
    }
  }
]
```

### State Persistence

Automatically save and restore grid state:

```vue
<template>
  <TSDataGrid
    :columns="columns"
    :data-source="dataSource"
    state-key="employee-grid"
  />
</template>
```

Saved state includes: column visibility, column order, column widths, sorting, filtering, grouping, pagination, selection, and expanded groups/rows.

---

## 🚀 Performance Tips

- **Virtual Scrolling**: Enable for datasets > 1000 rows
  ```typescript
  :enable-virtualization="true"
  :max-height="600"
  ```

- **Server-Side Operations**: Offload sorting/filtering/paging to server
  ```typescript
  const dataSource: DataSourceConfig = {
    type: DataSourceType.OData,
    serverPaging: true,
    serverSorting: true,
    serverFiltering: true
  }
  ```

- **Optimize Formatters**: Avoid heavy computations in formatters
  ```typescript
  // ✅ Good - memoize values
  const memoizedValues = new Map()
  formatter: (value) => {
    if (!memoizedValues.has(value)) {
      memoizedValues.set(value, expensiveCalculation(value))
    }
    return memoizedValues.get(value)
  }
  ```

- **Limit Visible Columns**: Show only essential columns by default
  ```typescript
  const columns: ColumnDefinition[] = [
    { field: 'id', visible: true },
    { field: 'name', visible: true },
    { field: 'optional1', visible: false }
  ]
  ```

- **Use Key Field**: Always specify a unique key field
  ```typescript
  <TSDataGrid key-field="id" ... />
  ```

---

## 🐛 Troubleshooting

### Grid Not Displaying

**Problem**: Grid appears empty or doesn't render

**Solutions**:
- Ensure CSS is imported: `import 'tsdatagrid/dist/style.css'`
- Check data structure: `console.log('Data:', dataSource.data)`
- Verify key field exists in data

### Editing Not Working

**Problem**: Can't edit cells

**Solutions**:
- Enable editing: `:allow-editing="true"`
- Mark columns as editable: `{ field: 'name', editable: true }`
- Provide editor config: `{ editor: { type: 'text' as EditorType } }`

### Selection Not Working

**Problem**: Can't select rows

**Solutions**:
- Enable selection: `:allow-selection="true"`
- Configure selection mode: `:selection-mode="{ mode: SelectionModeType.Multiple, checkboxes: true }"`
- Import enum: `import { SelectionModeType } from 'tsdatagrid'`

### Virtual Scroll Issues

**Problem**: Virtual scrolling not working or jumpy

**Solutions**:
- Set max-height: `:max-height="600"`
- Consistent row height: `:virtual-row-height="40"`
- Wait for data to load before initializing

### OData Errors

**Problem**: OData requests failing

**Solutions**:
- Check CORS configuration on server
- Verify OData URL is correct
- Check network tab for error details

### Type Errors

**Problem**: TypeScript compilation errors

**Solutions**:
```typescript
// Import types explicitly
import type { 
  ColumnDefinition, 
  DataSourceConfig
} from 'tsdatagrid'

import { 
  ColumnType, 
  SelectionModeType,
  DataSourceType 
} from 'tsdatagrid'

// Use enums for type-safe values
type: ColumnType.Number  // ✅ Correct
```

---

## 📋 Migration Guide

### From Version 1.x to 2.x

**Breaking Changes**:

Import changes:
```typescript
// ✅ New (v2.x)
import TSDataGrid from 'tsdatagrid'
import 'tsdatagrid/dist/style.css'
```

Enum updates:
```typescript
// ✅ New
import { SelectionModeType } from 'tsdatagrid'
selectionMode: { mode: SelectionModeType.Multiple, checkboxes: true }
```

Editor configuration:
```typescript
// ✅ New
import type { EditorType } from 'tsdatagrid'
editor: { type: 'text' as EditorType }
```

Data source type:
```typescript
// ✅ New
import { DataSourceType } from 'tsdatagrid'
dataSource: { type: DataSourceType.Local, data: [] }
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
   ```bash
   git clone https://github.com/yourusername/tsdatagrid.git
   cd tsdatagrid
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. Make changes and test
   ```bash
   npm run dev       # Start dev server
   npm run test      # Run tests
   npm run lint      # Check linting
   ```

5. Commit changes
   ```bash
   git commit -m 'Add amazing feature'
   ```

6. Push and create PR
   ```bash
   git push origin feature/amazing-feature
   ```

### Development Setup

```bash
# Install dependencies
npm install

# Run dev server with examples
npm run dev

# Build library
npm run build

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Format code
npm run format
```

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with Vue 3
- Powered by TypeScript
- Export functionality using jsPDF, jsPDF-AutoTable, PapaParse, and SheetJS

---

## 📞 Support

- 📫 Email: support@tsdatagrid.com
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions
- 📖 Documentation: Full Docs
- 💡 Stack Overflow: Tag with tsdatagrid

---

## 🗺️ Roadmap

### Version 2.1 (Q1 2025)
- ✅ Undo/Redo functionality
- ✅ Clipboard operations (copy/cut/paste)
- ✅ Context menus
- ✅ Keyboard navigation
- Frozen columns (left/right)
- Cell merging
- Advanced filtering UI

### Version 2.2 (Q2 2025)
- Tree data support
- Master-detail grids
- Column templates
- Row templates
- Touch gestures for mobile
- Accessibility improvements (WCAG 2.1 AA)

### Version 3.0 (Q3 2025)
- React adapter
- Angular adapter
- Pivot table mode
- Chart integration
- Real-time data updates (WebSocket)
- More built-in themes

---

## 📊 Browser Support

| Browser | Version |
|---------|---------|
| Chrome | Latest 2 versions |
| Firefox | Latest 2 versions |
| Safari | Latest 2 versions |
| Edge | Latest 2 versions |
| Opera | Latest version |

**Note**: IE11 is not supported due to Vue 3 requirements.

---

## 🔗 Useful Links

- [Live Demos](https://tsdatagrid.com/examples)
- [API Reference](https://tsdatagrid.com/api)
- [Changelog](CHANGELOG.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

---

<div align="center">
Made with ❤️ by the TSDataGrid Team
⭐ Star us on GitHub — it helps!
⬆ back to top
</div>