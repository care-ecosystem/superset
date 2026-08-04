/**
 * src/transformProps.ts
 *
 * Superset calls transformProps() with the raw server response every time new
 * query data arrives.  This function is the bridge between Superset's data
 * layer and the React component.
 *
 * Responsibilities
 * ────────────────
 * 1. Parse the raw query result rows into typed BarDatum objects, one per
 *    hierarchy label, each holding a `values` array (one entry per metric).
 * 2. Forward drill-down state (depth, path) from ownState into props so the
 *    component can render breadcrumbs and trigger re-queries.
 * 3. Extract visual configuration (colours, labels, animation) from formData.
 * 4. Provide onDrillDown / onDrillUp callbacks that mutate ownState via the
 *    Superset hooks API and trigger a new buildQuery → data fetch cycle.
 *
 * Note on adhoc columns
 * ──────────────────────
 * Hierarchy columns added via the Dnd column control aren't always plain
 * strings — a custom SQL expression (e.g. EXTRACT(MONTH FROM date) built via
 * "+ Drop columns/metrics here or click") is stored as an adhoc-column object
 * shaped like { expressionType, label, sqlExpression }. getColumnLabel()
 * normalizes both shapes down to the plain string Superset uses as the
 * resulting column's key in query result rows. The same normalization is
 * applied to metrics via getMetricLabel().
 */
import { ChartProps, QueryFormData, getMetricLabel } from '@superset-ui/core';
import { DrillBarChartProps, BarDatum, DrillPath, MetricValue } from './types';

// Helper: convert a ColorPickerControl value {r,g,b,a} → CSS rgba() string
function colorToCSS(c: any): string {
  if (!c) return 'rgba(70,130,220,1)';
  if (typeof c === 'string') return c;
  return `rgba(${c.r},${c.g},${c.b},${c.a ?? 1})`;
}

// Helper: convert a hierarchy column entry (plain string OR adhoc-column
// object) into the plain string label used both for display and as the row
// key returned by the query.
function getColumnLabel(col: any): string {
  if (typeof col === 'string') return col;
  return col?.label ?? col?.sqlExpression ?? String(col);
}

export default function transformProps(chartProps: ChartProps): DrillBarChartProps {
  const { width, height, formData, queriesData, hooks, ownState } = chartProps;
  const fd = formData as any;

  // ── Hierarchy / drill state ──────────────────────────────────────────────
  const hierarchyColumns: any[] = fd.groupby ?? [];
  const hierarchyColumnLabels: string[] = hierarchyColumns.map(getColumnLabel);

  const currentDepth: number = Number(ownState?.drillDepth ?? 0);
  const drillPath: DrillPath[] = ownState?.drillPath ?? [];

  // ── Metric labels (for legend / axis / tooltip) ──────────────────────────
  // fd.metrics is an array (possibly of adhoc-metric objects); normalize each
  // to its display label the same way getMetricLabel handles a single metric.
  const rawMetrics: any[] = fd.metrics ?? [];
  const metricLabels: string[] = rawMetrics.map((m) => getMetricLabel(m));

  // ── Parse query results → BarDatum[] ─────────────────────────────────────
  const currentColumnLabel =
    hierarchyColumnLabels[currentDepth] ?? hierarchyColumnLabels[0];
  const rawData = queriesData?.[0]?.data ?? [];

  const data: BarDatum[] = rawData
    .map((row: Record<string, unknown>) => {
      const values: MetricValue[] = metricLabels.map((ml) => ({
        metricLabel: ml,
        value: Number(row[ml] ?? 0),
      }));
      return {
        label: String(row[currentColumnLabel] ?? '(empty)'),
        values,
        depth: currentDepth,
        parent: drillPath.length > 0 ? drillPath[drillPath.length - 1].value : null,
      };
    })
    // Keep a bar group as long as at least one metric produced a real number
    .filter((d: BarDatum) => d.values.some((v) => !isNaN(v.value)));

  // ── Drill-down callback ───────────────────────────────────────────────────
  // When the user clicks any bar within a group we update ownState with the
  // new depth + path (drilling the whole label, not a single metric) and call
  // setDataMask so Superset re-invokes buildQuery.
  const onDrillDown = (datum: BarDatum) => {
    const nextDepth = currentDepth + 1;
    if (nextDepth >= hierarchyColumnLabels.length) return; // already at leaf level

    const newPath: DrillPath[] = [
      ...drillPath,
      {
        column: hierarchyColumnLabels[currentDepth],
        rawColumn: hierarchyColumns[currentDepth],
        value: datum.label,
        label: datum.label,
      },
    ];

    hooks?.setDataMask?.({
      ownState: {
        drillDepth: nextDepth,
        drillPath: newPath,
      },
    });
  };

  // ── Drill-up (breadcrumb) callback ────────────────────────────────────────
  const onDrillUp = (targetDepth: number) => {
    const newPath = drillPath.slice(0, targetDepth);

    hooks?.setDataMask?.({
      ownState: {
        drillDepth: targetDepth,
        drillPath: newPath,
      },
    });
  };

  return {
    width,
    height,
    data,
    hierarchyColumns: hierarchyColumnLabels,
    metricLabels,
    currentDepth,
    drillPath,
    barColor: colorToCSS(fd.barColor),
    barColorHover: colorToCSS(fd.barColorHover),
    showLabels: fd.showLabels ?? true,
    showTooltip: fd.showTooltip ?? true,
    animationDuration: Number(fd.animationDuration ?? 400),
    xAxisFontSize: Number(fd.xAxisFontSize ?? 12),
    yAxisFontSize: Number(fd.yAxisFontSize ?? 12),
    onDrillDown,
    onDrillUp,
  };
}