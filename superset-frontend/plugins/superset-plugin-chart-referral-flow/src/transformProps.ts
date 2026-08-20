/**
 * src/transformProps.ts
 *
 * queriesData[0] = main grouped rows (From, To, Patients Referred, Top Reason)
 * queriesData[1] = single-row totals query result, used for the footer
 */
import { ChartProps, getMetricLabel } from '@superset-ui/core';
import { ReferralFlowTableProps, ReferralRow } from './types';

function getColumnLabel(col: any): string {
  if (typeof col === 'string') return col;
  return col?.label ?? col?.sqlExpression ?? String(col);
}

export default function transformProps(chartProps: ChartProps): ReferralFlowTableProps {
  const { width, height, formData, queriesData } = chartProps;
  const fd = formData as any;

  const fromLabel = getColumnLabel(fd.fromColumn);
  const toLabel = getColumnLabel(fd.toColumn);
  const patientsLabel = getMetricLabel(fd.patientsMetric ?? '');
  const reasonLabel = fd.reasonMetric ? getMetricLabel(fd.reasonMetric) : null;
  const totalMetricLabel = getMetricLabel(fd.totalMetric || fd.patientsMetric || '');

  const rawRows = queriesData?.[0]?.data ?? [];
  const rows: ReferralRow[] = rawRows.map((row: Record<string, unknown>) => ({
    from: String(row[fromLabel] ?? '(empty)'),
    to: String(row[toLabel] ?? '(empty)'),
    patientsReferred: Number(row[patientsLabel] ?? 0),
    topReason: reasonLabel ? String(row[reasonLabel] ?? '') : '',
  }));

  const totalRow = queriesData?.[1]?.data?.[0];
  const totalValue =
    totalRow && totalRow[totalMetricLabel] != null
      ? Number(totalRow[totalMetricLabel])
      : null;

  return {
    width,
    height,
    rows,
    totalValue,
    footerLabel: fd.footerLabel || 'Total referred across levels',
    showFooter: fd.showFooter ?? true,
  };
}
