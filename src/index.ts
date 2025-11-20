/**
 * @fileoverview TSDataGrid main exports
 * @module @tsdatagrid/core
 * @version 1.0.0
 */

// ===== PLUGIN =====
export { default as TSDataGridPlugin } from './plugin';
export type { TSDataGridPluginOptions } from './plugin';

// ===== MAIN COMPONENTS =====
import TSDataGrid from './components/TSDataGrid.vue';
import TSDataGridHeader from './components/TSDataGridHeader.vue';
import TSDataGridBody from './components/TSDataGridBody.vue';
import TSDataGridFooter from './components/TSDataGridFooter.vue';
import TSDataGridToolbar from './components/TSDataGridToolbar.vue';
import TSDataGridGroupPanel from './components/TSDataGridGroupPanel.vue';
import TSDataGridColumnChooser from './components/TSDataGridColumnChooser.vue';
import TSDataGridContextMenu from './components/TSDataGridContextMenu.vue';
import TSDataGridFilter from './components/TSDataGridFilter.vue';
import TSDataGridActiveFilters from './components/TSDataGridActiveFilters.vue';
import TSDataGridCell from './components/TSDataGridCell.vue';
import TSDataGridRow from './components/TSDataGridRow.vue';


export {
  TSDataGrid,
  TSDataGridHeader,
  TSDataGridBody,
  TSDataGridFooter,
  TSDataGridToolbar,
  TSDataGridGroupPanel,
  TSDataGridColumnChooser,
  TSDataGridContextMenu,
  TSDataGridFilter,
  TSDataGridActiveFilters,
  TSDataGridCell,
  TSDataGridRow,
};

// ===== CORE TYPES =====
export type {
  // Base types
  Brand,
  RowKey,
  ColumnField,
  DeepPartial,
  KeysOfType,
  RequireKeys,
  OptionalKeys,
  Callback,
  AsyncCallback,
  Predicate,
  Comparator,
  Position,
  Size,
  Rectangle,
  Range,
  ErrorInfo,
  Result,
  AsyncResult,
  ChangeEvent,
  CancellableEvent,
  LoadingState,
  ValidationResult,
  IDisposable,
  IObservable,
} from './types';

export { GridMode, DataType, Alignment, GridTheme, ValidationSeverity } from './types';

// Column types
export type {
  ColumnDefinition,
  ColumnBand,
  ColumnCollection,
  EditorConfig,
  FilterConfig,
  ColumnLookup,
  CellTemplateContext,
  HeaderTemplateContext,
  FormatOptions,
} from './types';

export { ColumnType, ColumnFormat, EditorType, isColumnDefinition, isColumnBand } from './types';

// Data source types
export type {
  DataSourceConfig,
  DataResult,
  LoadOptions,
  ODataConfig,
  CustomStoreConfig,
  IDataSource,
} from './types';

export {
  DataSourceType,
  DataSourceMode,
  ODataVersion,
  HttpMethod,
  isODataConfig,
  isCustomStoreConfig,
} from './types';

// Event types
export type {
  RowEvent,
  CellEvent,
  EditEvent,
  ValidationEvent,
  SelectionEvent,
  DataEvent,
  ExportEvent,
  ColumnEvent,
  ContextMenuEvent,
  ContextMenuItem,
  GridKeyboardEvent,
  GridEvents,
  GridEmit,
} from './types';

// Model types
export type { IEntity, ISoftDeletable, IAuditable, ITreeNode, IChangeTracking } from './types';

// ===== FEATURE TYPES =====

// Editing
export type {
  Change,
  EditingConfig,
  EditingState,
  PopupEditingOptions,
  FormEditingOptions,
  FormItem,
  EditContext,
} from './types';

export { EditingMode, ChangeType, isChange } from './types';

// Filtering
export type {
  FilterCondition,
  FilterGroup,
  ActiveFilter,
  FilterState,
  UniqueValueFilterOption,
  FilterPopupState,
  FilteringConfig,
  OperatorMetadata,
} from './types';

export {
  FilterOperator,
  FilterLogic,
  FilterMode,
  FILTER_OPERATORS,
  isFilterCondition,
  isFilterGroup,
} from './types';

// Sorting
export type { SortDescriptor, SortState, SortingConfig, SortCycle, SortComparer } from './types';

export { SortDirection, SortMode, isSortDescriptor, toggleSortDirection } from './types';

// Grouping
export type {
  AggregateDescriptor,
  GroupDescriptor,
  GroupedRow,
  GroupSummary,
  GroupingConfig,
  GroupingState,
  GroupPanelItem,
} from './types';

export { AggregateFunction, isGroupedRow } from './types';

// Selection
export type { SelectionMode, SelectionState, SelectionConfig, SelectionChangeEvent } from './types';

export { SelectionModeType, SelectionPersistence } from './types';

// Searching
export type { SearchConfig, SearchMatch, SearchResult, SearchState } from './types';

export { SearchMode } from './types';

// Pagination
export type { PaginationConfig, PaginationState, PageChangeEvent } from './types';

export { PaginationMode } from './types';

// Export
export type { ExportConfig, ExportOptions, ExportResult } from './types';

export { ExportFormat, ExportScope, PDFOrientation, PDFPageSize } from './types';

// Summary
export type { SummaryConfig, SummaryResult, SummaryState } from './types';

export { SummaryType, SummaryScope, SummaryPosition } from './types';

// Keyboard
export type {
  KeyboardShortcut,
  FocusPosition,
  KeyboardNavigationConfig,
  KeyboardNavigationState,
} from './types';

export { Key, KeyboardAction } from './types';

// Virtualization
export type { VirtualizationConfig, VirtualViewport, VirtualScrollState } from './types';

export { VirtualizationMode, ScrollMode } from './types';

// Accessibility
export type { AccessibilityConfig, AriaAttributes, ScreenReaderAnnouncement } from './types';

export { AriaRole } from './types';

// ===== STATE TYPES =====
export type { GridState, PartialGridState, GridStateSnapshot } from './types';

export type { PersistenceConfig, IStorageProvider, PersistedState } from './types';

export { StorageType } from './types';

// ===== UI TYPES =====
export type { ToolbarAction, ToolbarConfig } from './types';

export { ToolbarLocation } from './types';

export type { CssClassConfig, ThemeConfig, StyleConfig } from './types';

export type {
  TemplateContext,
  GroupHeaderTemplateContext,
  SummaryTemplateContext,
  NoDataTemplateContext,
  ToolbarTemplateContext,
  TemplateFunction,
  GridTemplates,
} from './types';

// ===== VALIDATION TYPES =====
export type {
  BaseValidationRule,
  RequiredRule,
  EmailRule,
  NumericRule,
  RangeRule,
  StringLengthRule,
  PatternRule,
  CompareRule,
  CustomRule,
  ValidationRule,
  IValidator,
  AsyncValidator,
  SyncValidator,
  Validator,
} from './types';

export { ValidationRuleType } from './types';

// ===== TYPE UTILITIES =====
export type {
  Immutable,
  Mutable,
  NonNullableFields,
  UnwrapPromise,
  ArgumentTypes,
  ReturnTypeOf,
} from './types';

export { VERSION } from './types';

// ===== COMPOSABLES =====
export * from './composables/useDataSource';
export * from './composables/useSorting';
export * from './composables/useFiltering';
export * from './composables/usePagination';
export * from './composables/useGrouping';
export * from './composables/useSelection';
export * from './composables/useStatePersistence';
export * from './composables/useExport';
export * from './composables/useEditing';
export * from './composables/useColumnChooser';
export * from './composables/useSummary';
export * from './composables/useSearch';
export * from './composables/useKeyboardNavigation';
export * from './composables/useVirtualization';
export * from './composables/useClipboard';
export * from './composables/useUndo';
export * from './composables/useContextMenu';
export * from './composables/useColumnResize';
export * from './composables/useColumnReorder';
export * from './composables/useRowExpansion';
export * from './composables/useGridApi';
export * from './composables/useLoadingState';
export * from './composables/useInfiniteScroll';

// ===== UTILITIES =====
export * from './utils/validators';
export * from './utils/formatters';
export * from './utils/odata';
export * from './utils/export';
export * from './utils/performance';
export * from './utils/error-handling';
export * from './utils/column-searcher';
export * from './utils/dom';
export * from './utils/date';
export * from './utils/array';
export * from './utils/string';
export * from './utils/clipboard';
export * from './utils/keyboard';
export * from './utils/cache';
export * from './utils/constants';
export * from './utils/logger';
export * from './utils/number';
export * from './utils/object';
export * from './utils/storage';
export * from './utils/accessibility';

// ===== DEFAULT EXPORT =====
export { default } from './plugin';
