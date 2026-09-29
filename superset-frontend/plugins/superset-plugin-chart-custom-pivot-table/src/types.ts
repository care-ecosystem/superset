/**
 * src/types.ts
 */
import { QueryFormData } from '@superset-ui/core';

// ── Per-metric color configuration ─────────────────────────────────────────
export interface MetricColorConfig {
  headerBg: string;
  headerText: string;
  valueBg: string;
  valueText: string;
}
export type MetricColorMap = Record<string, MetricColorConfig>;

export const DEFAULT_METRIC_COLOR: MetricColorConfig = {
  headerBg: 'rgba(241,245,249,1)',
  headerText: 'rgba(51,65,85,1)',
  valueBg: 'rgba(255,255,255,1)',
  valueText: 'rgba(30,41,59,1)',
};

// ── Text style for one "role" (metrics / columns / rows) ───────────────────
export interface TextStyle {
  fontSize: number;
  bold: boolean;
  italic: boolean;
  align: 'left' | 'center' | 'right';
}

export type ApplyMetricsOn = 'columns' | 'rows';
export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_distinct';

export interface PivotTableFormData extends QueryFormData {
  columns: any[];
  rows: any[];
  metrics: any[];
  applyMetricsOn: ApplyMetricsOn;
  aggregationFunction: AggregationFunction;
  seriesLimit: number;
  cellLimit: number;
  sortByMetric: string | null;
  sortDesc: boolean;
  showRowsTotal: boolean;
  showRowsSubtotal: boolean;
  showColumnsTotal: boolean;
  showColumnsSubtotal: boolean;
  transposePivot: boolean;
  combineMetrics: boolean;
  columnSortMetric: string | null;
  columnSortDesc: boolean;
  rowHeight: number;
  metricsFontSize: number;
  metricsBold: boolean;
  metricsItalic: boolean;
  columnsFontSize: number;
  columnsBold: boolean;
  columnsItalic: boolean;
  rowsFontSize: number;
  rowsBold: boolean;
  rowsItalic: boolean;
  metricColors: MetricColorMap;
}

// ── Shapes passed from transformProps to the React component ───────────────

/** One cell in a header row (row-dim label column OR column-dim header row),
 *  pre-computed with the rowSpan/colSpan needed for classic pivot-table
 *  merged-cell rendering. */
export interface HeaderCell {
  label: string;
  span: number; // rowSpan for row headers, colSpan for column headers
}

/** One fully-resolved column, i.e. one leaf in the column-header tree —
 *  a specific combination of column-dimension values (+ metric, depending
 *  on applyMetricsOn/combineMetrics) that body cells are looked up by. */
export interface ColumnLeaf {
  key: string; // stable lookup key
  metricLabel: string; // which metric this leaf's values belong to
  headerCellsPerLevel: string[]; // the label shown at each header row level for this leaf's column
}

/** One row of the body — a row-dimension combination (a "row line"),
 *  carrying pre-computed merged-cell headers for each row-dim level plus
 *  the values for every column leaf. */
export interface BodyRow {
  key: string;
  rowHeaderCells: (HeaderCell | null)[]; // null = merged into the cell above
  values: Record<string, number | null>; // keyed by ColumnLeaf.key
  isSubtotal?: boolean;
  subtotalLabel?: string;
}

export interface PivotTableProps {
  width: number;
  height: number;
  rowDimLabels: string[];
  colDimLabels: string[];
  metricLabels: string[];
  applyMetricsOn: ApplyMetricsOn;
  columnLeaves: ColumnLeaf[];
  columnHeaderRows: HeaderCell[][]; // one array per header level, pre-merged
  bodyRows: BodyRow[];
  grandTotalRow: BodyRow | null;
  columnGrandTotals: Record<string, number | null> | null; // keyed by ColumnLeaf.key
  rowHeight: number;
  metricsStyle: TextStyle;
  columnsStyle: TextStyle;
  rowsStyle: TextStyle;
  metricHeaderLevel: number; // which header row shows metric names (-1 = none)
  metricColors: MetricColorMap;
}
