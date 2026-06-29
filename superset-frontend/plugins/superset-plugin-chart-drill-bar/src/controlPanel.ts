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
              type: 'SelectControl',
              label: 'Hierarchy Columns (ordered)',
              description:
                'Add columns in top-to-bottom drill order. ' +
                'E.g. Continent → Country → State → City. ' +
                'The chart starts at the first column and drills deeper on each click.',
              multi: true,
              freeForm: false,
              mapStateToProps: (state: any) => ({
                options: state.datasource?.columns?.map((c: any) => ({
                  value: c.column_name,
                  label: c.verbose_name || c.column_name,
                })) ?? [],
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
            name: 'metric',
            config: {
              type: 'MetricsControl',
              label: 'Metric (measure)',
              description: 'The numeric measure to aggregate at each drill level.',
              multi: false,
              validators: [(value: unknown) => {
                if (!value) return 'A metric is required.';
                return false;
              }],
              default: null,
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
      ],
    },

    // Include the standard "Advanced Analytics" section (rolling avg, etc.)
    sections.advancedAnalyticsControls,
  ],
};

export default controlPanel;
