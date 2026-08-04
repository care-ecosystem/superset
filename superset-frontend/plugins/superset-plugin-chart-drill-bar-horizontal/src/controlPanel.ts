import { ControlPanelConfig, sections } from '@superset-ui/chart-controls';

const controlPanel: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: 'Query',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'groupby',
            config: {
              type: 'DndColumnSelect',
              label: 'Hierarchy Columns (ordered)',
              description:
                'Add columns in top-to-bottom drill order. The chart starts ' +
                'at the first column and drills deeper on each click.',
              multi: true,
              freeForm: false,
              mapStateToProps: (state: any) => ({
                options: state.datasource?.columns ?? [],
              }),
              validators: [(value: unknown) => {
                if (!Array.isArray(value) || value.length < 1) {
                  return 'At least one hierarchy column is required.';
                }
                return false;
              }],
              default: [],
            },
          },
        ],
        [
          {
            name: 'metrics',
            config: {
              type: 'DndMetricSelect',
              label: 'Metrics (measures)',
              description: 'One or more numeric measures to plot as grouped bars at each drill level.',
              multi: true,
              mapStateToProps: (state: any) => ({
                columns: state.datasource?.columns ?? [],
                savedMetrics: state.datasource?.metrics ?? [],
                datasource: state.datasource,
              }),
              validators: [(value: unknown) => {
                if (!Array.isArray(value) || value.length < 1) {
                  return 'At least one metric is required.';
                }
                return false;
              }],
              default: [],
            },
          },
        ],
        [
          {
            name: 'sortBy',
            config: {
              type: 'SelectControl',
              label: 'Sort Axis By',
              description: 'Choose how bars are ordered at every drill level.',
              default: 'metric_desc',
              choices: [
                ['metric_desc', 'Metric Value (High to Low)'],
                ['metric_asc', 'Metric Value (Low to High)'],
                ['label_asc', 'Label (A → Z)'],
                ['label_desc', 'Label (Z → A)'],
              ],
              clearable: false,
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: 'Chart Options',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'barColor',
            config: {
              type: 'ColorPickerControl',
              label: 'Bar Colour',
              description: 'Fill colour for the first metric\'s bars.',
              default: { r: 70, g: 130, b: 220, a: 1 },
            },
          },
          {
            name: 'barColorHover',
            config: {
              type: 'ColorPickerControl',
              label: 'Bar Hover Colour',
              description: 'Hover colour for the first metric\'s bars.',
              default: { r: 30, g: 90, b: 180, a: 1 },
            },
          },
        ],
        [
          {
            name: 'showLabels',
            config: {
              type: 'CheckboxControl',
              label: 'Show Value Labels',
              default: true,
              renderTrigger: true,
            },
          },
          {
            name: 'showTooltip',
            config: {
              type: 'CheckboxControl',
              label: 'Show Tooltip',
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'animationDuration',
            config: {
              type: 'SliderControl',
              label: 'Animation Duration (ms)',
              default: 400,
              min: 0,
              max: 2000,
              step: 50,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'yAxisFontSize',
            config: {
              type: 'SliderControl',
              label: 'Y-Axis Label Font Size',
              description:
                'Font size for the hierarchy-label text along the Y-axis. ' +
                'The chart automatically widens its left margin to fit ' +
                'the longest label at this size, so text is never cut off.',
              default: 12,
              min: 8,
              max: 22,
              step: 1,
              renderTrigger: true,
            },
          },
          {
            name: 'xAxisFontSize',
            config: {
              type: 'SliderControl',
              label: 'X-Axis Label Font Size',
              description: 'Font size for the value-tick text along the X-axis.',
              default: 12,
              min: 8,
              max: 22,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    sections.advancedAnalyticsControls,
  ],
};

export default controlPanel;
