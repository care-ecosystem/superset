/**
 * src/controlPanel.ts
 */
import { ControlPanelConfig, sections } from '@superset-ui/chart-controls';

const MAX_COLOR_METRICS = 8;

const COLOR_DEFAULTS = {
  headerBg: { r: 241, g: 245, b: 249, a: 1 },
  headerText: { r: 51, g: 65, b: 85, a: 1 },
  valueBg: { r: 255, g: 255, b: 255, a: 1 },
  valueText: { r: 30, g: 41, b: 59, a: 1 },
};

function metricNameAt(state: any, index: number): string {
  const m = (state?.controls?.metrics?.value ?? [])[index];
  if (!m) return `Metric ${index + 1}`;
  if (typeof m === 'string') return m;
  return m.label ?? m.column?.column_name ?? `Metric ${index + 1}`;
}

function colorControl(index: number, key: string, caption: string, def: any) {
  return {
    name: `metric${index}${key}`,
    config: {
      type: 'ColorPickerControl',
      label: `Metric ${index + 1} ${caption}`,
      description: `${caption} colour for metric ${index + 1}.`,
      default: def,
      renderTrigger: true,
      mapStateToProps: (state: any) => ({
        label: `${metricNameAt(state, index)}: ${caption}`,
      }),
      visibility: ({ controls }: any) =>
        (controls?.metrics?.value?.length ?? 0) > index,
    },
  };
}

const metricColorRows: any[] = Array.from({ length: MAX_COLOR_METRICS }).flatMap(
  (_unused, i) => [
    [
      colorControl(i, 'HeaderBg', 'Header BG', COLOR_DEFAULTS.headerBg),
      colorControl(i, 'HeaderText', 'Header Text', COLOR_DEFAULTS.headerText),
    ],
    [
      colorControl(i, 'ValueBg', 'Value BG', COLOR_DEFAULTS.valueBg),
      colorControl(i, 'ValueText', 'Value Text', COLOR_DEFAULTS.valueText),
    ],
  ],
);

const controlPanel: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: 'Query',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'columns',
            config: {
              type: 'DndColumnSelect',
              label: 'Columns',
              description: 'Columns to pivot across the top of the table.',
              multi: true,
              mapStateToProps: (state: any) => ({ options: state.datasource?.columns ?? [] }),
              default: [],
            },
          },
        ],
        [
          {
            name: 'rows',
            config: {
              type: 'DndColumnSelect',
              label: 'Rows',
              description: 'Columns to pivot down the left of the table.',
              multi: true,
              mapStateToProps: (state: any) => ({ options: state.datasource?.columns ?? [] }),
              default: [],
            },
          },
        ],
        ['time_grain_sqla'],
        [
          {
            name: 'metrics',
            config: {
              type: 'DndMetricSelect',
              label: 'Metrics',
              description: 'One or more numeric measures to populate the table body.',
              multi: true,
              mapStateToProps: (state: any) => ({
                columns: state.datasource?.columns ?? [],
                savedMetrics: state.datasource?.metrics ?? [],
                datasource: state.datasource,
              }),
              validators: [
                (v: unknown) =>
                  !Array.isArray(v) || v.length < 1 ? 'At least one metric is required.' : false,
              ],
              default: [],
            },
          },
        ],
        [
          {
            name: 'applyMetricsOn',
            config: {
              type: 'SelectControl',
              label: 'Apply metrics on',
              default: 'columns',
              choices: [
                ['columns', 'Columns'],
                ['rows', 'Rows'],
              ],
              clearable: false,
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'seriesLimit',
            config: {
              type: 'TextControl',
              label: 'Series limit',
              description: 'Max number of column groups to display. 0 = no limit.',
              isInt: true,
              default: 0,
            },
          },
          {
            name: 'cellLimit',
            config: {
              type: 'TextControl',
              label: 'Cell limit',
              description: 'Max number of underlying data rows fetched.',
              isInt: true,
              default: 1000,
            },
          },
        ],
        [
          {
            name: 'sortByMetric',
            config: {
              type: 'SelectControl',
              label: 'Sort query by',
              description: 'Which metric to sort the underlying query by.',
              mapStateToProps: (state: any) => {
                const metrics = state.controls?.metrics?.value ?? [];
                const choices = metrics.map((m: any) => {
                  const key = typeof m === 'string' ? m : m.label;
                  return [key, key];
                });
                return { choices };
              },
              default: null,
            },
          },
          {
            name: 'sortDesc',
            config: { type: 'CheckboxControl', label: 'Sort Descending', default: true },
          },
        ],
      ],
    },
    {
      label: 'Options',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'aggregationFunction',
            config: {
              type: 'SelectControl',
              label: 'Aggregation function',
              description: 'Used to combine values when more than one raw row maps to the same cell.',
              default: 'sum',
              choices: [
                ['sum', 'Sum'],
                ['avg', 'Average'],
                ['min', 'Min'],
                ['max', 'Max'],
                ['count', 'Count'],
                ['count_distinct', 'Count Distinct'],
              ],
              clearable: false,
            },
          },
        ],
        [
          { name: 'showRowsTotal', config: { type: 'CheckboxControl', label: 'Show rows total', default: false } },
          { name: 'showRowsSubtotal', config: { type: 'CheckboxControl', label: 'Show rows subtotal', default: false } },
        ],
        [
          { name: 'showColumnsTotal', config: { type: 'CheckboxControl', label: 'Show columns total', default: false } },
          { name: 'showColumnsSubtotal', config: { type: 'CheckboxControl', label: 'Show columns subtotal', default: false } },
        ],
        [
          { name: 'transposePivot', config: { type: 'CheckboxControl', label: 'Transpose pivot', default: false } },
          { name: 'combineMetrics', config: { type: 'CheckboxControl', label: 'Combine metrics', default: false } },
        ],
        [
          {
            name: 'columnOrderColumn',
            config: {
              type: 'DndColumnSelect',
              label: 'Order column groups by (column)',
              description:
                'Pick a numeric column (e.g. type_order) that decides the order of the column groups ' +
                '(HDU, ICU, Isolation Ward, Untagged). It should have exactly one value per group. ' +
                'Takes priority over "Sort columns by (metric)".',
              multi: false,
              mapStateToProps: (state: any) => ({ options: state.datasource?.columns ?? [] }),
              default: null,
            },
          },
          {
            name: 'columnOrderDesc',
            config: { type: 'CheckboxControl', label: 'Order descending', default: false, renderTrigger: true },
          },
        ],
        [
          {
            name: 'columnSortMetric',
            config: {
              type: 'SelectControl',
              label: 'Sort columns by (metric)',
              description: 'Fallback: reorder column groups by this metric\'s total.',
              mapStateToProps: (state: any) => {
                const metrics = state.controls?.metrics?.value ?? [];
                const choices = metrics.map((m: any) => {
                  const key = typeof m === 'string' ? m : m.label;
                  return [key, key];
                });
                return { choices };
              },
              default: null,
              renderTrigger: true,
            },
          },
          {
            name: 'columnSortDesc',
            config: { type: 'CheckboxControl', label: 'Sort columns descending', default: false, renderTrigger: true },
          },
        ],
      ],
    },
    {
      label: 'Styling',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'rowHeight',
            config: {
              type: 'SliderControl',
              label: 'Row Height',
              description: 'Applies to every row in the table.',
              default: 40,
              min: 20,
              max: 90,
              step: 2,
              renderTrigger: true,
            },
          },
        ],
        [
          { name: 'metricsFontSize', config: { type: 'SliderControl', label: 'Metrics: Font Size', default: 11, min: 8, max: 24, step: 1, renderTrigger: true } },
          { name: 'metricsBold', config: { type: 'CheckboxControl', label: 'Metrics: Bold', default: true, renderTrigger: true } },
          { name: 'metricsItalic', config: { type: 'CheckboxControl', label: 'Metrics: Italic', default: false, renderTrigger: true } },
        ],
        [
          { name: 'columnsFontSize', config: { type: 'SliderControl', label: 'Columns: Font Size', default: 13, min: 8, max: 24, step: 1, renderTrigger: true } },
          { name: 'columnsBold', config: { type: 'CheckboxControl', label: 'Columns: Bold', default: true, renderTrigger: true } },
          { name: 'columnsItalic', config: { type: 'CheckboxControl', label: 'Columns: Italic', default: false, renderTrigger: true } },
        ],
        [
          { name: 'rowsFontSize', config: { type: 'SliderControl', label: 'Rows: Font Size', default: 14, min: 8, max: 24, step: 1, renderTrigger: true } },
          { name: 'rowsBold', config: { type: 'CheckboxControl', label: 'Rows: Bold', default: true, renderTrigger: true } },
          { name: 'rowsItalic', config: { type: 'CheckboxControl', label: 'Rows: Italic', default: false, renderTrigger: true } },
        ],
        ...metricColorRows,
      ],
    },
    sections.advancedAnalyticsControls,
  ],
};

export default controlPanel;