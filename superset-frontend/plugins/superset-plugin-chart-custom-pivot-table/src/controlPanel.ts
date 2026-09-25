/**
 * src/controlPanel.ts
 */
import { ControlPanelConfig, sections } from '@superset-ui/chart-controls';
import MetricColorControl from './controls/MetricColorControl';

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
              validators: [(v: unknown) => (!Array.isArray(v) || v.length < 1 ? 'At least one metric is required.' : false)],
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
              description: 'Max number of column groups to display. Leave blank / 0 for no limit.',
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
            config: {
              type: 'CheckboxControl',
              label: 'Sort Descending',
              default: true,
            },
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
          {
            name: 'showRowsTotal',
            config: { type: 'CheckboxControl', label: 'Show rows total', default: false },
          },
          {
            name: 'showRowsSubtotal',
            config: { type: 'CheckboxControl', label: 'Show rows subtotal', default: false },
          },
        ],
        [
          {
            name: 'showColumnsTotal',
            config: { type: 'CheckboxControl', label: 'Show columns total', default: false },
          },
          {
            name: 'showColumnsSubtotal',
            config: { type: 'CheckboxControl', label: 'Show columns subtotal', default: false },
          },
        ],
        [
          {
            name: 'transposePivot',
            config: { type: 'CheckboxControl', label: 'Transpose pivot', default: false },
          },
          {
            name: 'combineMetrics',
            config: { type: 'CheckboxControl', label: 'Combine metrics', default: false },
          },
        ],
        [
          {
            name: 'columnSortMetric',
            config: {
              type: 'SelectControl',
              label: 'Sort columns by',
              description: 'Reorder the column groups (e.g. HDU, ICU, Isolation Ward…) by this metric\'s total, instead of alphabetically.',
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
              default: 32,
              min: 20,
              max: 80,
              step: 2,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'metricsFontSize',
            config: { type: 'SliderControl', label: 'Metrics: Font Size', default: 12, min: 8, max: 24, step: 1, renderTrigger: true },
          },
          {
            name: 'metricsBold',
            config: { type: 'CheckboxControl', label: 'Metrics: Bold', default: true, renderTrigger: true },
          },
          {
            name: 'metricsItalic',
            config: { type: 'CheckboxControl', label: 'Metrics: Italic', default: false, renderTrigger: true },
          },
        ],
        [
          {
            name: 'columnsFontSize',
            config: { type: 'SliderControl', label: 'Columns: Font Size', default: 12, min: 8, max: 24, step: 1, renderTrigger: true },
          },
          {
            name: 'columnsBold',
            config: { type: 'CheckboxControl', label: 'Columns: Bold', default: true, renderTrigger: true },
          },
          {
            name: 'columnsItalic',
            config: { type: 'CheckboxControl', label: 'Columns: Italic', default: false, renderTrigger: true },
          },
        ],
        [
          {
            name: 'rowsFontSize',
            config: { type: 'SliderControl', label: 'Rows: Font Size', default: 12, min: 8, max: 24, step: 1, renderTrigger: true },
          },
          {
            name: 'rowsBold',
            config: { type: 'CheckboxControl', label: 'Rows: Bold', default: false, renderTrigger: true },
          },
          {
            name: 'rowsItalic',
            config: { type: 'CheckboxControl', label: 'Rows: Italic', default: false, renderTrigger: true },
          },
        ],
        [
          {
            name: 'metricColors',
            config: {
              type: MetricColorControl as any,
              label: 'Metric Colors',
              description: 'Header and value colors (background + text) for each metric.',
              renderTrigger: true,
              mapStateToProps: (state: any) => ({ metrics: state.controls?.metrics?.value ?? [] }),
              default: {},
            },
          },
        ],
      ],
    },
    sections.advancedAnalyticsControls,
  ],
};

export default controlPanel;