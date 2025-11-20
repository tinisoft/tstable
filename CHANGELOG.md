# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2024-01-XX

### Added
- ✨ Initial release of TSDataGrid
- 📊 Core data grid functionality with Vue 3 and TypeScript
- 🔍 Advanced filtering with unique value selection
- 🔄 Multi-column sorting
- 📑 Built-in pagination with customizable page sizes
- 🔎 Global search across columns
- 📊 Hierarchical data grouping
- ✏️ Inline cell editing with validation
- ✔️ Row selection (single/multiple) with checkboxes
- 🎯 Column chooser for show/hide columns
- 📏 Column resizing by dragging
- 🔀 Column reordering via drag and drop
- 📤 Export to CSV, Excel, PDF, and JSON
- 🌐 Full OData v4 support
- 💾 State persistence in localStorage
- 🎨 Custom formatters for cell values
- ✅ Built-in validators (required, email, range, etc.)
- 📈 Summary row with aggregations (sum, avg, min, max, count)
- 🎨 Three built-in themes (default, material, dark)
- 🎨 Custom cell rendering via slots
- 🔧 Customizable toolbar with actions
- 🎨 Conditional cell styling
- 📱 Responsive design

### Components
- `TSDataGrid` - Main grid component
- `TSDataGridHeader` - Header with sorting, filtering, resizing
- `TSDataGridBody` - Body with rows and cells
- `TSDataGridFooter` - Pagination footer
- `TSDataGridToolbar` - Toolbar with actions
- `TSDataGridGroupPanel` - Group panel for drag-drop grouping
- `TSDataGridColumnChooser` - Column visibility modal
- `TSDataGridFilter` - Filter popup with unique values
- `TSDataGridActiveFilters` - Active filters bar
- `TSDataGridRow` - Individual row component
- `TSDataGridCell` - Individual cell component

### Composables
- `useDataSource` - Data source management
- `useSorting` - Sorting logic
- `useFiltering` - Filtering logic
- `usePagination` - Pagination logic
- `useGrouping` - Grouping logic
- `useSelection` - Selection logic
- `useEditing` - Editing logic
- `useColumnChooser` - Column chooser logic
- `useSearch` - Search logic
- `useSummary` - Summary calculations
- `useExport` - Export functionality
- `useStatePersistence` - State persistence

### Utilities
- `odata.ts` - OData query builder and data source
- `formatters.ts` - Value formatters (currency, date, number, etc.)
- `validators.ts` - Field validators
- `export.ts` - Export functionality (CSV, Excel, PDF, JSON)
- `clipboard.ts` - Copy to clipboard utilities
- `column-searcher.ts` - Column search engine
- `error-handling.ts` - Comprehensive error handling
- `performance.ts` - Performance utilities (debounce, throttle, memoize)

### Types
- Complete TypeScript type definitions for all components and APIs
- Full IntelliSense support in IDEs

### Documentation
- Comprehensive README with examples
- API reference
- Quick start guide
- Installation instructions

---

## [0.9.0] - 2024-01-XX (Beta)

### Added
- Beta release for testing
- Core grid functionality
- Basic sorting and filtering
- Pagination

### Fixed
- Initial bug fixes
- Performance improvements

---

## Version History

### Version Naming Convention
- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

### Breaking Changes Policy
Breaking changes will be clearly documented with:
- ⚠️ Migration guide
- 📝 Deprecation warnings in prior minor version
- 🔧 Code examples for updating

---

## Future Releases

### [1.1.0] - Planned Features
- [ ] Virtual scrolling for large datasets
- [ ] Column templates
- [ ] Row templates
- [ ] Frozen columns
- [ ] Context menu
- [ ] Keyboard navigation enhancements

### [1.2.0] - Planned Features
- [ ] Tree data support
- [ ] Master-detail rows
- [ ] Column groups
- [ ] Accessibility improvements (ARIA)

### [2.0.0] - Planned Features
- [ ] Vue 3.5+ optimizations
- [ ] Potential API improvements
- [ ] Mobile-first responsive redesign

---

## Support

For questions and support:
- 📫 Email: your.email@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/tsdatagrid/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/tsdatagrid/discussions)

---

[Unreleased]: https://github.com/yourusername/tsdatagrid/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/yourusername/tsdatagrid/releases/tag/v1.0.0
[0.9.0]: https://github.com/yourusername/tsdatagrid/releases/tag/v0.9.0