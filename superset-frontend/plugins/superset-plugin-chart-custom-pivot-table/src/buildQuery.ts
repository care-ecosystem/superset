/**
 * src/buildQuery.ts
 *
 * This chart queries data "flat" — one row per unique combination of every
 * row-dimension AND column-dimension value, with every configured metric as
 * a column — exactly like Superset's native Pivot Table v2 does. The actual
 * pivoting (turning that flat table into a nested row/column header
 * structure) happens client-side in transformProps.ts, since it needs to
 * react to the "Apply metrics on", "Combine metrics", "Transpose", and
 * column-sort controls, none of which change what data is needed — only how
 * it's reshaped for display.
 */
import { buildQueryContext, QueryFormData, QueryObject } from '@superset-ui/core';

function dedupeColumns(cols: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  cols.forEach((c) => {
    const key = typeof c === 'string' ? c : JSON.stringify(c);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(c);
    }
  });
  return out;
}

export default function buildQuery(formData: QueryFormData) {
  const {
    columns = [],
    rows = [],
    metrics = [],
    sortByMetric,
    sortDesc = true,
    cellLimit,
  } = formData as any;

  if (!rows.length && !columns.length) {
    throw new Error('Pivot Table: add at least one column to Rows or Columns.');
  }
  if (!metrics.length) {
    throw new Error('Pivot Table: at least one metric is required.');
  }

  const groupby = dedupeColumns([...rows, ...columns]);

  return buildQueryContext(formData, (baseQuery: QueryObject) => {
    const sortMetric =
      metrics.find((m: any) => (typeof m === 'string' ? m : m.label) === sortByMetric) ??
      metrics[0];

    const query: QueryObject = {
      ...baseQuery,
      columns: groupby,
      groupby,
      metrics,
      orderby: [[sortMetric, !sortDesc]],
      row_limit: Number(cellLimit) || 1000,
    };
    return [query];
  });
}
