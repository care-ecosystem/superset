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
  /** The numeric measure to aggregate, e.g. 'population' */
  metric: string;
  /** Bar fill colour */
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

// ─── A single bar datum after query results are transformed ──────────────────

export interface BarDatum {
  /** The dimension value for this bar, e.g. "Asia" */
  label: string;
  /** Aggregated measure value */
  value: number;
  /** Which hierarchy level this datum lives at (0 = root) */
  depth: number;
  /** The parent label (used to filter the next level) */
  parent: string | null;
}

// ─── Drill-down path entry (one breadcrumb step) ─────────────────────────────

export interface DrillPath {
  /** Column name at this level, e.g. "continent" */
  column: string;
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
  /** Full ordered list of hierarchy columns */
  hierarchyColumns: string[];
  /** Current drill depth (index into hierarchyColumns) */
  currentDepth: number;
  /** Drill path taken so far */
  drillPath: DrillPath[];
  barColor: string;
  barColorHover: string;
  showLabels: boolean;
  showTooltip: boolean;
  animationDuration: number;
  /** Called when user clicks a bar; triggers re-query one level deeper */
  onDrillDown: (datum: BarDatum) => void;
  /** Called when user clicks a breadcrumb to go back N levels */
  onDrillUp: (targetDepth: number) => void;
}

// ─── Internal query context (passed through the query builder) ───────────────

export interface DrillQueryContext {
  /** The column to GROUP BY for this query */
  groupByColumn: string;
  /** Filters to apply so only the selected branch is returned */
  extraFilters: Array<{ col: string; op: string; val: string }>;
}
