import { ChartPlugin, ChartMetadata, ChartDataResponseResult } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import PivotTable from './PivotTable';

const metadata = new ChartMetadata({
  name: 'Custom Pivot Table',
  description:
    'A pivot table with per-metric header/value coloring, custom column ' +
    'group ordering, adjustable row height, and independent text styling ' +
    'for metrics, column headers, and row labels.',
  tags: ['Table', 'Pivot'],
  category: 'Table',
});

export default class PivotTablePlugin extends ChartPlugin<
  Record<string, unknown>,
  ChartDataResponseResult
> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => PivotTable,
      metadata,
      transformProps,
    });
  }
}