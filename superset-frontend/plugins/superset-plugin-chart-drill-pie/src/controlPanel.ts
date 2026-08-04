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
            name: 'metric',
            config: {
              type: 'DndMetricSelect',
              label: 'Metric (measure)',
              description:
                'The numeric measure that determines each slice\'s size at ' +
                'every drill level. A pie shows parts of one whole, so only ' +
                'a single metric is supported (unlike the bar-chart plugins).',
              multi: false,
              mapStateToProps: (state: any) => ({
                columns: state.datasource?.columns ?? [],
                savedMetrics: state.datasource?.metrics ?? [],
                datasource: state.datasource,
              }),
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
    {
      label: 'Chart Options',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'innerRadiusPercent',
            config: {
              type: 'SliderControl',
              label: 'Inner Radius (%)',
              description:
                'Size of the hole in the middle, as a percentage of the ' +
                'outer radius. 0 renders a solid pie; higher values create ' +
                'a thinner donut ring.',
              default: 55,
              min: 0,
              max: 85,
              step: 5,
              renderTrigger: true,
            },
          },
          {
            name: 'showLegend',
            config: {
              type: 'CheckboxControl',
              label: 'Show Legend',
              default: true,
              renderTrigger: true,
            },
          },
          {
            name: 'legendFontSize',
            config: {
              type: 'SliderControl',
              label: 'Legend Font Size',
              description:
                'Font size for legend item text. The legend panel automatically ' +
                'widens to fit the longest label at this size, so text is ' +
                'never cut off.',
              default: 12,
              min: 8,
              max: 20,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'showCenterTotal',
            config: {
              type: 'CheckboxControl',
              label: 'Show Total in Center',
              description:
                'Display the sum of all visible slices in the donut\'s ' +
                'center hole. Only shown when Inner Radius (%) is above 0.',
              default: true,
              renderTrigger: true,
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
      ],
    },
    sections.advancedAnalyticsControls,
  ],
};

export default controlPanel;
