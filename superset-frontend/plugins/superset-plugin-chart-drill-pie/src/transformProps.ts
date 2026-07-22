/**
 * src/transformProps.ts
 * Same drill-state pattern (ownState, not formData) and adhoc-column/metric
 * normalization as the bar-chart plugins, adapted for a single metric.
 */
import { ChartProps, getMetricLabel } from '@superset-ui/core';
import { DrillPieChartProps, SliceDatum, DrillPath } from './types';

function getColumnLabel(col: any): string {
  if (typeof col === 'string') return col;
  return col?.label ?? col?.sqlExpression ?? String(col);
}

export default function transformProps(chartProps: ChartProps): DrillPieChartProps {
  const { width, height, formData, queriesData, hooks, ownState } = chartProps;
  const fd = formData as any;

  const hierarchyColumns: any[] = fd.groupby ?? [];
  const hierarchyColumnLabels: string[] = hierarchyColumns.map(getColumnLabel);

  const currentDepth: number = Number(ownState?.drillDepth ?? 0);
  const drillPath: DrillPath[] = ownState?.drillPath ?? [];

  const metricLabel = getMetricLabel(fd.metric ?? '');

  const currentColumnLabel =
    hierarchyColumnLabels[currentDepth] ?? hierarchyColumnLabels[0];
  const rawData = queriesData?.[0]?.data ?? [];

  const data: SliceDatum[] = rawData
    .map((row: Record<string, unknown>) => ({
      label: String(row[currentColumnLabel] ?? '(empty)'),
      value: Number(row[metricLabel] ?? 0),
      depth: currentDepth,
      parent: drillPath.length > 0 ? drillPath[drillPath.length - 1].value : null,
    }))
    .filter((d: SliceDatum) => !isNaN(d.value) && d.value > 0); // pie slices need positive values

  const onDrillDown = (datum: SliceDatum) => {
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
    metricLabel,
    currentDepth,
    drillPath,
    showLabels: fd.showLabels ?? true,
    showTooltip: fd.showTooltip ?? true,
    showLegend: fd.showLegend ?? true,
    innerRadiusPercent: Number(fd.innerRadiusPercent ?? 55),
    showCenterTotal: fd.showCenterTotal ?? true,
    animationDuration: Number(fd.animationDuration ?? 400),
    onDrillDown,
    onDrillUp,
  };
}
