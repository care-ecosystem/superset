import { ChartPlugin, ChartMetadata, ChartDataResponseResult } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import DrillBarHorizontalChart from './DrillBarHorizontalChart';

const metadata = new ChartMetadata({
  name: 'Drill-Down Horizontal Bar Chart',
  description:
    'A horizontal bar chart that supports multi-level hierarchical drill-down. ' +
    'Click any bar to zoom into the next level of the hierarchy; ' +
    'use the breadcrumb trail to navigate back up.',
  tags: ['Bar', 'Horizontal', 'Drill-Down', 'Hierarchy', 'D3'],
  category: 'Part of a Whole',
});

export default class DrillBarHorizontalChartPlugin extends ChartPlugin<
  Record<string, unknown>,
  ChartDataResponseResult
> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => DrillBarHorizontalChart,
      metadata,
      transformProps,
    });
  }
}
