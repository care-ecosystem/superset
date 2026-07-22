import { ChartPlugin, ChartMetadata, ChartDataResponseResult } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import DrillPieChart from './DrillPieChart';

const metadata = new ChartMetadata({
  name: 'Drill-Down Pie Chart',
  description:
    'A pie chart that supports multi-level hierarchical drill-down. ' +
    'Click any slice to zoom into the next level of the hierarchy; ' +
    'use the breadcrumb trail to navigate back up.',
  tags: ['Pie', 'Donut', 'Drill-Down', 'Hierarchy', 'D3'],
  category: 'Part of a Whole',
});

export default class DrillPieChartPlugin extends ChartPlugin<
  Record<string, unknown>,
  ChartDataResponseResult
> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => DrillPieChart,
      metadata,
      transformProps,
    });
  }
}
