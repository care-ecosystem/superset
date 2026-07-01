/**
 * src/transformProps.ts
 *
 * Superset calls transformProps() with the raw server response every time new
 * query data arrives.  This function is the bridge between Superset's data
 * layer and the React component.
 *
 * Responsibilities
 * ────────────────
 * 1. Parse the raw query result rows into typed BarDatum objects.
 * 2. Forward drill-down state (depth, path) from formData into props so the
 *    component can render breadcrumbs and trigger re-queries.
 * 3. Extract visual configuration (colours, labels, animation) from formData.
 * 4. Provide onDrillDown / onDrillUp callbacks that mutate formData via the
 *    Superset hooks API and trigger a new buildQuery → data fetch cycle.
 */
import { ChartProps, QueryFormData, getMetricLabel } from '@superset-ui/core';
import { DrillBarChartProps, BarDatum, DrillPath } from './types';

// Helper: convert a ColorPickerControl value {r,g,b,a} → CSS rgba() string
function colorToCSS(c: any): string {
  if (!c) return 'rgba(70,130,220,1)';
  if (typeof c === 'string') return c;
  return `rgba(${c.r},${c.g},${c.b},${c.a ?? 1})`;
}

export default function transformProps(chartProps: ChartProps): DrillBarChartProps {
  const { width, height, formData, queriesData, hooks } = chartProps;
  const fd = formData as any;

  // ── Hierarchy / drill state ──────────────────────────────────────────────
  const hierarchyColumns: string[] = fd.groupby ?? [];
  const currentDepth: number = Number(fd.drillDepth ?? 0);
  const drillPath: DrillPath[] = fd.drillPath ?? [];

  // ── Metric label (for axis / tooltip) ───────────────────────────────────
  const metricLabel = getMetricLabel(fd.metric ?? '');

  // ── Parse query results → BarDatum[] ─────────────────────────────────────
  const currentColumn = hierarchyColumns[currentDepth] ?? hierarchyColumns[0];
  const rawData = queriesData?.[0]?.data ?? [];

  const data: BarDatum[] = rawData
    .map((row: Record<string, unknown>) => ({
      label: String(row[currentColumn] ?? '(empty)'),
      value: Number(row[metricLabel] ?? row[fd.metric] ?? 0),
      depth: currentDepth,
      parent: drillPath.length > 0 ? drillPath[drillPath.length - 1].value : null,
    }))
    .filter((d: BarDatum) => !isNaN(d.value));

  // ── Drill-down callback ───────────────────────────────────────────────────
  // When the user clicks a bar we update formData with the new depth + filters
  // and call setDataMask so Superset re-fetches.
  const onDrillDown = (datum: BarDatum) => {
    const nextDepth = currentDepth + 1;
    if (nextDepth >= hierarchyColumns.length) return; // already at leaf level

    const newPath: DrillPath[] = [
      ...drillPath,
      {
        column: hierarchyColumns[currentDepth],
        value: datum.label,
        label: datum.label,
      },
    ];

    const newFilters = newPath.map((p) => ({ col: p.column, val: p.value }));

    // Superset's hooks.onAddFilter / setDataMask can be used to push state.
    // We use setDataMask to communicate the drill selection back to the chart
    // engine which will re-invoke buildQuery.
    hooks?.setDataMask?.({
      extraFormData: {
        drillDepth: nextDepth,
        drillPath: newPath,
        drillFilters: newFilters,
      } as any,
      filterState: {},
      ownState: {
        drillDepth: nextDepth,
        drillPath: newPath,
        drillFilters: newFilters,
      },
    });
  };

  // ── Drill-up (breadcrumb) callback ────────────────────────────────────────
  const onDrillUp = (targetDepth: number) => {
    const newPath = drillPath.slice(0, targetDepth);
    const newFilters = newPath.map((p) => ({ col: p.column, val: p.value }));

    hooks?.setDataMask?.({
      extraFormData: {
        drillDepth: targetDepth,
        drillPath: newPath,
        drillFilters: newFilters,
      } as any,
      filterState: {},
      ownState: {
        drillDepth: targetDepth,
        drillPath: newPath,
        drillFilters: newFilters,
      },
    });
  };

  return {
    width,
    height,
    data,
    hierarchyColumns,
    currentDepth,
    drillPath,
    barColor: colorToCSS(fd.barColor),
    barColorHover: colorToCSS(fd.barColorHover),
    showLabels: fd.showLabels ?? true,
    showTooltip: fd.showTooltip ?? true,
    animationDuration: Number(fd.animationDuration ?? 400),
    onDrillDown,
    onDrillUp,
  };
}
