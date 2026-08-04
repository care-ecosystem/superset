/**
 * src/types.ts
 *
 * Shared TypeScript interfaces used by buildQuery, transformProps, and the
 * React component.  Keeping types in one place prevents drift between the
 * query-building layer and the rendering layer.
 */
import { QueryFormData } from '@superset-ui/core';

// ─── Form data (values coming from the control panel sidebar) ─────────────────
export interface DrillBarFormData extends QueryFormData {
  /** Ordered list of columns that form the hierarchy, e.g. ['continent','country','state','city'] */
  groupby: string[];
  /** One or more numeric measures to plot as grouped bars at each level, e.g. ['appointments','encounters'] */
  metrics: string[];
  /** Bar fill colour (applied to the first metric; others use the generated palette) */
  barColor: string;
  /** Bar fill colour on hover */
  barColorHover: string;
  /** Whether to show value labels on top of bars */
  showLabels: boolean;
  /** Whether to show a tooltip on hover */
  showTooltip: boolean;
  /** Animation duration in milliseconds */
  animationDuration: number;
}

// ─── A single metric's value within a bar group ───────────────────────────────
export interface MetricValue {
  /** Display label for this metric, e.g. "Appointments" */
  metricLabel: string;
  /** Aggregated value for this metric at this label */
  value: number;
}

// ─── A single bar-group datum after query results are transformed ────────────
// One BarDatum now represents a whole *group* of bars (one per metric) sharing
// the same hierarchy label, e.g. "Mar" → [{Appointments: 760}, {Encounters: 580}]
export interface BarDatum {
  /** The dimension value for this bar group, e.g. "Mar" */
  label: string;
  /** One entry per metric, in the same order as metricLabels */
  values: MetricValue[];
  /** Which hierarchy level this datum lives at (0 = root) */
  depth: number;
  /** The parent label (used to filter the next level) */
  parent: string | null;
}

// ─── Drill-down path entry (one breadcrumb step) ─────────────────────────────
export interface DrillPath {
  /** Display label for this level's column, e.g. "Month" — used in the breadcrumb only */
  column: string;
  /** The actual column reference (plain string OR adhoc-column object) used to build the WHERE filter for the next query */
  rawColumn: any;
  /** Value selected, e.g. "Asia" */
  value: string;
  /** Human-readable label shown in the breadcrumb */
  label: string;
}

// ─── Props handed to the React component by transformProps ───────────────────
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

// ─── Internal query context (passed through the query builder) ───────────────
export interface DrillQueryContext {
  /** The column to GROUP BY for this query */
  groupByColumn: string;
  /** Filters to apply so only the selected branch is returned */
  extraFilters: Array<{ col: string; op: string; val: string }>;
}
