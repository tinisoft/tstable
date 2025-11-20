/**
 * @fileoverview Grid constants
 * @module utils/constants
 */

export const GRID_CONSTANTS = {
  // Default sizes
  DEFAULT_ROW_HEIGHT: 40,
  DEFAULT_HEADER_HEIGHT: 48,
  DEFAULT_FOOTER_HEIGHT: 52,
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_COLUMN_WIDTH: 150,
  MIN_COLUMN_WIDTH: 50,
  MAX_COLUMN_WIDTH: 1000,
  
  // Pagination
  DEFAULT_PAGE_SIZES: [10, 20, 50, 100],
  MAX_VISIBLE_PAGES: 7,
  
  // Virtualization
  VIRTUAL_ROW_BUFFER: 5,
  VIRTUAL_COLUMN_BUFFER: 3,
  VIRTUAL_THRESHOLD: 50,
  
  // Performance
  DEBOUNCE_DELAY: 300,
  THROTTLE_DELAY: 16, // ~60fps
  SEARCH_MIN_LENGTH: 2,
  
  // Cache
  DEFAULT_CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  MAX_CACHE_SIZE: 100,
  
  // Loading
  LOADING_DELAY: 200, // Show loader after 200ms
  
  // Animation
  ANIMATION_DURATION: 200,
  
  // Selection
  SELECTION_CHECKBOX_WIDTH: 40,
  
  // Export
  EXPORT_MAX_ROWS: 10000,
  
  // OData
  ODATA_MAX_PAGE_SIZE: 1000,
  
  // Colors
  COLORS: {
    PRIMARY: '#1976d2',
    SUCCESS: '#4caf50',
    WARNING: '#ff9800',
    ERROR: '#f44336',
    INFO: '#2196f3',
  },
  
  // Z-indexes
  Z_INDEX: {
    DROPDOWN: 1000,
    MODAL: 1050,
    TOOLTIP: 1100,
    NOTIFICATION: 1150,
  },
  
  // Keyboard
  KEYBOARD: {
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    TAB: 'Tab',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    SPACE: ' ',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
    F2: 'F2',
  },
  
  // CSS Classes
  CSS_CLASSES: {
    GRID: 'ts-datagrid',
    HEADER: 'ts-datagrid-header',
    BODY: 'ts-datagrid-body',
    FOOTER: 'ts-datagrid-footer',
    ROW: 'ts-datagrid-row',
    CELL: 'ts-datagrid-cell',
    SELECTED: 'ts-datagrid-selected',
    EDITING: 'ts-datagrid-editing',
    LOADING: 'ts-datagrid-loading',
    DRAGGING: 'ts-datagrid-dragging',
    FOCUSED: 'ts-datagrid-focused',
  },
  
  // Breakpoints
  BREAKPOINTS: {
    XS: 0,
    SM: 600,
    MD: 960,
    LG: 1280,
    XL: 1920,
  },
} as const

export type GridConstants = typeof GRID_CONSTANTS