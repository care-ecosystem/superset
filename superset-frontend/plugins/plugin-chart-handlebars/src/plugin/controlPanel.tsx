/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  ControlPanelConfig,
  getStandardizedControls,
} from '@superset-ui/chart-controls';
import { t } from '@apache-superset/core/translation';
import { allColumnsControlSetItem } from './controls/columns';
import { groupByControlSetItem } from './controls/groupBy';
import { handlebarsTemplateControlSetItem } from './controls/handlebarTemplate';
import { includeTimeControlSetItem } from './controls/includeTime';
import {
  rowLimitControlSetItem,
  timeSeriesLimitMetricControlSetItem,
} from './controls/limits';
import {
  metricsControlSetItem,
  percentMetricsControlSetItem,
  showTotalsControlSetItem,
} from './controls/metrics';
import {
  orderByControlSetItem,
  orderDescendingControlSetItem,
} from './controls/orderBy';
import { queryModeControlSetItem } from './controls/queryMode';
import { styleControlSetItem } from './controls/style';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [queryModeControlSetItem],
        ['time_range'],
        [groupByControlSetItem],
        [metricsControlSetItem, allColumnsControlSetItem],
        [percentMetricsControlSetItem],
        [timeSeriesLimitMetricControlSetItem, orderByControlSetItem],
        [orderDescendingControlSetItem],
        [rowLimitControlSetItem],
        [includeTimeControlSetItem],
        [showTotalsControlSetItem],
        ['adhoc_filters'],
        [
          {
            name: 'show_comparison',
            config: {
              type: 'CheckboxControl',
              label: t('Show % change vs previous period'),
              default: false,
              description: t(
                'Shows the percentage change compared to the equivalent prior time period. Hidden automatically when no date filter, or an Advanced/Custom range, is selected.',
              ),
            },
          },
        ],
        [
          {
            name: 'comparison_metric',
            config: {
              type: 'SelectControl',
              label: t('Metric to compare'),
              description: t('Which metric to compute the % change for'),
              mapStateToProps: (state: any) => {
                const chartMetrics = state.controls?.metrics?.value || [];
                const choices = chartMetrics.map((m: any) => {
                  // ad-hoc metrics are objects with a label; saved metrics are plain strings
                  const key = typeof m === 'string' ? m : m.label || m.metric_name;
                  return [key, key];
                });
                return { choices };
              },
              visibility: ({ controls }: any) => !!controls?.show_comparison?.value,
            },
          },
        ]
      ],
    },
    {
      label: t('Options'),
      expanded: true,
      controlSetRows: [
        [handlebarsTemplateControlSetItem],
        [styleControlSetItem],
      ],
    },
  ],
  formDataOverrides: formData => ({
    ...formData,
    groupby: getStandardizedControls().popAllColumns(),
    metrics: getStandardizedControls().popAllMetrics(),
  }),
};

export default config;
