import { ControlPanelConfig } from '@superset-ui/chart-controls';

const controlPanel: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: 'Query',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'fromColumn',
            config: {
              type: 'DndColumnSelect',
              label: 'From Column',
              description: 'The column representing the source facility level.',
              multi: false,
              mapStateToProps: (state: any) => ({
                options: state.datasource?.columns ?? [],
              }),
              validators: [(value: unknown) => (!value ? 'A From column is required.' : false)],
              default: null,
            },
          },
          {
            name: 'toColumn',
            config: {
              type: 'DndColumnSelect',
              label: 'To Column',
              description: 'The column representing the destination facility level.',
              multi: false,
              mapStateToProps: (state: any) => ({
                options: state.datasource?.columns ?? [],
              }),
              validators: [(value: unknown) => (!value ? 'A To column is required.' : false)],
              default: null,
            },
          },
        ],
        [
          {
            name: 'patientsMetric',
            config: {
              type: 'DndMetricSelect',
              label: 'Patients Referred Metric',
              description: 'Numeric measure shown in the Patients Referred column.',
              multi: false,
              mapStateToProps: (state: any) => ({
                columns: state.datasource?.columns ?? [],
                savedMetrics: state.datasource?.metrics ?? [],
                datasource: state.datasource,
              }),
              validators: [(value: unknown) => (!value ? 'A metric is required.' : false)],
              default: null,
            },
          },
          {
            name: 'reasonMetric',
            config: {
              type: 'DndMetricSelect',
              label: 'Top Reason Metric',
              description:
                'Metric shown in the Top Reason column — e.g. MAX(reason). ' +
                'Optional; leave empty to hide this column.',
              multi: false,
              mapStateToProps: (state: any) => ({
                columns: state.datasource?.columns ?? [],
                savedMetrics: state.datasource?.metrics ?? [],
                datasource: state.datasource,
              }),
              default: null,
            },
          },
        ],
        ['adhoc_filters'],
        ['row_limit'],
      ],
    },
    {
      label: 'Footer',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'showFooter',
            config: {
              type: 'CheckboxControl',
              label: 'Show Footer Total',
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'totalMetric',
            config: {
              type: 'DndMetricSelect',
              label: 'Total Metric (footer)',
              description:
                'Metric aggregated across ALL rows in scope (ignoring From/To ' +
                'grouping) — shown in the footer. Leave empty to reuse the ' +
                'Patients Referred metric.',
              multi: false,
              mapStateToProps: (state: any) => ({
                columns: state.datasource?.columns ?? [],
                savedMetrics: state.datasource?.metrics ?? [],
                datasource: state.datasource,
              }),
              default: null,
            },
          },
          {
            name: 'footerLabel',
            config: {
              type: 'TextControl',
              label: 'Footer Label',
              default: 'Total referred across levels',
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default controlPanel;
