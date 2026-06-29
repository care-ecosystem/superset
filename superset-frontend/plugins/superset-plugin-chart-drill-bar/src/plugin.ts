/**
 * src/plugin.ts
 *
 * The ChartPlugin subclass is the central registration unit in Superset.
 * It declares:
 *   - metadata  (name, description, thumbnail)
 *   - buildQuery  (how to build the SQL/native query)
 *   - controlPanel  (sidebar controls shown to the chart author)
 *   - transformProps  (how to reshape raw query results for the React component)
 *   - Chart  (the actual React component that renders the SVG)
 *
 * Superset's plugin registry calls `plugin.configure({ key })` and then
 * `plugin.register()` once during application startup.
 */
import { ChartPlugin, ChartMetadata, ChartDataResponseResult } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import DrillBarChart from './DrillBarChart';
import thumbnail from './images/thumbnail.png';

const metadata = new ChartMetadata({
  name: 'Drill-Down Bar Chart',
  description:
    'A vertical bar chart that supports multi-level hierarchical drill-down. ' +
    'Click any bar to zoom into the next level of the hierarchy; ' +
    'use the breadcrumb trail to navigate back up.',
  thumbnail,
  tags: ['Bar', 'Drill-Down', 'Hierarchy', 'D3'],
  category: 'Part of a Whole',
});

export default class DrillBarChartPlugin extends ChartPlugin<
  Record<string, unknown>,
  ChartDataResponseResult
> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => DrillBarChart,
      metadata,
      transformProps,
    });
  }
}
