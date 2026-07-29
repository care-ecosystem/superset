/**
 * src/types.ts
 *
 * Note: unlike the bar-chart plugins, a pie chart shows parts of ONE whole,
 * so it uses a single `metric` (not a `metrics` array). Hierarchy/drill
 * concepts (DrillPath, ownState-based depth tracking) are otherwise identical
 * to the bar-chart plugins.
 */
import { QueryFormData } from '@superset-ui/core';

export interface DrillPieFormData extends QueryFormData {
  groupby: string[];
  metric: string;
  showLabels: boolean;
  showTooltip: boolean;
  showLegend: boolean;
  /** Inner radius as a percentage (0-90) of the outer radius. 0 = solid pie. */
  innerRadiusPercent: number;
  /** Whether to show the sum-of-all-slices value in the donut's center hole. Only rendered when innerRadiusPercent > 0. */
  showCenterTotal: boolean;
  animationDuration: number;
}

export interface SliceDatum {
  label: string;
  value: number;
  depth: number;
  parent: string | null;
}

export interface DrillPath {
  /** Display label for this level's column, e.g. "Month" — breadcrumb only */
  column: string;
  /** Raw column reference (string OR adhoc-column object) used for filtering */
  rawColumn: any;
  value: string;
  label: string;
}

export interface DrillPieChartProps {
  width: number;
  height: number;
  data: SliceDatum[];
  hierarchyColumns: string[];
  metricLabel: string;
  currentDepth: number;
  drillPath: DrillPath[];
  showLabels: boolean;
  showTooltip: boolean;
  showLegend: boolean;
  innerRadiusPercent: number;
  showCenterTotal: boolean;
  animationDuration: number;
  onDrillDown: (datum: SliceDatum) => void;
  onDrillUp: (targetDepth: number) => void;
}
