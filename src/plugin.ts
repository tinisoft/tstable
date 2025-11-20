import type { App } from 'vue';
import TSDataGrid from './components/TSDataGrid.vue';
import TSDataGridActiveFilters from './components/TSDataGridActiveFilters.vue';
import TSDataGridHeader from './components/TSDataGridHeader.vue';
import TSDataGridBody from './components/TSDataGridBody.vue';
import TSDataGridFooter from './components/TSDataGridFooter.vue';
import TSDataGridToolbar from './components/TSDataGridToolbar.vue';
import TSDataGridGroupPanel from './components/TSDataGridGroupPanel.vue';
import TSDataGridColumnChooser from './components/TSDataGridColumnChooser.vue';
import TSDataGridFilter from './components/TSDataGridFilter.vue';
import TSDataGridCell from './components/TSDataGridCell.vue';
import TSDataGridRow from './components/TSDataGridRow.vue';

export interface TSDataGridPluginOptions {
  prefix?: string;
}

export default {
  install(app: App, options: TSDataGridPluginOptions = {}) {
    const { prefix = 'TS' } = options;

    // Register all components
    app.component(`${prefix}DataGrid`, TSDataGrid);
    app.component(`${prefix}DataGridHeader`, TSDataGridHeader);
    app.component(`${prefix}DataGridBody`, TSDataGridBody);
    app.component(`${prefix}DataGridFooter`, TSDataGridFooter);
    app.component(`${prefix}DataGridToolbar`, TSDataGridToolbar);
    app.component(`${prefix}DataGridGroupPanel`, TSDataGridGroupPanel);
    app.component(`${prefix}DataGridColumnChooser`, TSDataGridColumnChooser);
    app.component(`${prefix}DataGridFilter`, TSDataGridFilter);
    app.component(`${prefix}DataGridCell`, TSDataGridCell);
    app.component(`${prefix}DataGridRow`, TSDataGridRow);
    app.component(`${prefix}DataGridActiveFilters`, TSDataGridActiveFilters);
  },
};

// Export for tree-shaking
export {
  TSDataGrid,
  TSDataGridActiveFilters,
  TSDataGridHeader,
  TSDataGridBody,
  TSDataGridFooter,
  TSDataGridToolbar,
  TSDataGridGroupPanel,
  TSDataGridColumnChooser,
  TSDataGridFilter,
  TSDataGridCell,
  TSDataGridRow,
};
