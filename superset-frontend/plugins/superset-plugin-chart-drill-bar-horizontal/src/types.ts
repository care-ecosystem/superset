/**
 * src/types.ts
 * Same shape as the vertical Drill-Down Bar Chart's types — kept identical
 * on purpose so both plugins' buildQuery/transformProps logic stay in sync.
 */
import { QueryFormData } from '@superset-ui/core';

export interface DrillBarFormData extends QueryFormData {
  groupby: string[];
  metrics: string[];
  barColor: string;
  barColorHover: string;
  showLabels: boolean;
  showTooltip: boolean;
  animationDuration: number;
}

export interface MetricValue {
  metricLabel: string;
  value: number;
}

export interface BarDatum {
  label: string;
  values: MetricValue[];
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

export interface DrillBarChartProps {
  width: number;
  height: number;
  data: BarDatum[];
  hierarchyColumns: string[];
  metricLabels: string[];
  currentDepth: number;
  drillPath: DrillPath[];
  barColor: string;
  barColorHover: string;
  showLabels: boolean;
  showTooltip: boolean;
  animationDuration: number;
  xAxisFontSize: number;
  yAxisFontSize: number;
  onDrillDown: (datum: BarDatum) => void;
  onDrillUp: (targetDepth: number) => void;
}
