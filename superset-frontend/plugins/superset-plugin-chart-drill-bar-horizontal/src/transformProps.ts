/**
 * src/transformProps.ts
 * Identical logic to the vertical Drill-Down Bar Chart's transformProps.
 */
import { ChartProps, getMetricLabel } from '@superset-ui/core';
import { DrillBarChartProps, BarDatum, DrillPath, MetricValue } from './types';

function colorToCSS(c: any): string {
  if (!c) return 'rgba(70,130,220,1)';
  if (typeof c === 'string') return c;
  return `rgba(${c.r},${c.g},${c.b},${c.a ?? 1})`;
}

function getColumnLabel(col: any): string {
  if (typeof col === 'string') return col;
  return col?.label ?? col?.sqlExpression ?? String(col);
}

export default function transformProps(chartProps: ChartProps): DrillBarChartProps {
  const { width, height, formData, queriesData, hooks, ownState } = chartProps;
  const fd = formData as any;

  const hierarchyColumns: any[] = fd.groupby ?? [];
  const hierarchyColumnLabels: string[] = hierarchyColumns.map(getColumnLabel);

  const currentDepth: number = Number(ownState?.drillDepth ?? 0);
  const drillPath: DrillPath[] = ownState?.drillPath ?? [];

  const rawMetrics: any[] = fd.metrics ?? [];
  const metricLabels: string[] = rawMetrics.map((m) => getMetricLabel(m));

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
    .filter((d: BarDatum) => d.values.some((v) => !isNaN(v.value)));

  const onDrillDown = (datum: BarDatum) => {
    const nextDepth = currentDepth + 1;
    if (nextDepth >= hierarchyColumnLabels.length) return;

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
      ownState: { drillDepth: nextDepth, drillPath: newPath },
    });
  };

  const onDrillUp = (targetDepth: number) => {
    const newPath = drillPath.slice(0, targetDepth);
    hooks?.setDataMask?.({
      ownState: { drillDepth: targetDepth, drillPath: newPath },
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
    onDrillDown,
    onDrillUp,
  };
}
