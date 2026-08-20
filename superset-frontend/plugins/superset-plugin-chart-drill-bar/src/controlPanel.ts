/**
 * src/controlPanel.ts
 *
 * Defines the "Chart Controls" sidebar that chart authors see when configuring
 * this visualization inside Superset's Explore view.
 *
 * Each entry in `controlSetRows` is one row of controls.  Controls reference
 * either built-in Superset control definitions (by string key) or inline
 * ControlConfig objects defined here.
 *
 * The values collected here are serialised into formData and passed to both
 * buildQuery and transformProps.
 */
import { ControlPanelConfig, sections } from '@superset-ui/chart-controls';

const controlPanel: ControlPanelConfig = {
  controlPanelSections: [
    // ── DATA ────────────────────────────────────────────────────────────────
    {
      label: 'Query',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'groupby',
            config: {
              // type: 'SelectControl',
              type: 'DndColumnSelect',
              label: 'Hierarchy Columns (ordered)',
              description:
                'Add columns in top-to-bottom drill order. ' +
                'E.g. Continent → Country → State → City. ' +
                'The chart starts at the first column and drills deeper on each click',
              multi: true,
              freeForm: false,
              mapStateToProps: (state: any) => ({
                options: state.datasource?.columns ?? [],
              }),
              // mapStateToProps: (state: any) => ({
              //   options: state.datasource?.columns?.map((c: any) => ({
              //     value: c.column_name,
              //     label: c.verbose_name || c.column_name,
              //   })) ?? [],
              // }),
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
              label: 'Sort X-Axis By',
              description: 'Choose how bars are ordered along the X-axis at every drill level.',
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

    // ── CHART OPTIONS ────────────────────────────────────────────────────────
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
              description: 'Fill colour for bars.',
              default: { r: 70, g: 130, b: 220, a: 1 },
            },
          },
          {
            name: 'barColorHover',
            config: {
              type: 'ColorPickerControl',
              label: 'Bar Hover Colour',
              description: 'Fill colour when hovering over a bar.',
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
              description: 'Display the aggregated value on top of each bar.',
              default: true,
              renderTrigger: true,
            },
          },
          {
            name: 'showTooltip',
            config: {
              type: 'CheckboxControl',
              label: 'Show Tooltip',
              description: 'Show a tooltip with the exact value when hovering.',
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
              description: 'Duration of the bar grow/transition animation in milliseconds.',
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
            name: 'xAxisFontSize',
            config: {
              type: 'SliderControl',
              label: 'X-Axis Label Font Size',
              description:
                'Font size for the hierarchy-label text along the X-axis. ' +
                'The chart automatically widens its bottom margin to fit ' +
                'the longest label at this size, so text is never cut off.',
              default: 12,
              min: 8,
              max: 22,
              step: 1,
              renderTrigger: true,
            },
          },
          {
            name: 'yAxisFontSize',
            config: {
              type: 'SliderControl',
              label: 'Y-Axis Label Font Size',
              description: 'Font size for the value-tick text along the Y-axis.',
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

    // Include the standard "Advanced Analytics" section (rolling avg, etc.)
    sections.advancedAnalyticsControls,
  ],
};

export default controlPanel;
