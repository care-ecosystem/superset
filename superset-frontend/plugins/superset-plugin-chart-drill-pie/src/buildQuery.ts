/**
 * src/buildQuery.ts
 * Same drill-query pattern as the bar-chart plugins: one GROUP BY column per
 * query (current hierarchy depth), ancestor filters from ownState.drillPath.
 * Requests a single metric, since a pie shows parts of one whole.
 */
import { buildQueryContext, QueryFormData, QueryObject } from '@superset-ui/core';

export default function buildQuery(
  formData: QueryFormData,
  options?: { ownState?: any },
) {
  const { groupby = [], metric } = formData as any;

  const drillDepth: number = Number(options?.ownState?.drillDepth ?? 0);
  const drillPath: Array<{ rawColumn: any; value: string }> =
    options?.ownState?.drillPath ?? [];
  const drillFilters = drillPath.map((p: any) => ({
    col: p.rawColumn,
    val: p.value,
  }));

  if (!groupby.length) {
    throw new Error(
      'Drill-Pie: At least one column must be added to the Hierarchy Columns control.',
    );
  }
  if (!metric) {
    throw new Error('Drill-Pie: A metric is required.');
  }

  const safeDepth = Math.min(Number(drillDepth), groupby.length - 1);
  const currentColumn: string = groupby[safeDepth];

  return buildQueryContext(formData, (baseQuery: QueryObject) => {
    const query: QueryObject = {
      ...baseQuery,
      columns: [currentColumn],
      groupby: [currentColumn],
      metrics: [metric],
      orderby: [[metric, false]], // largest slice first
      row_limit: 100, // pies get unreadable with too many slices
    };
    if (Array.isArray(drillFilters) && drillFilters.length > 0) {
      const ancestorFilters = drillFilters.map((f: any) => ({
        col: f.col,
        op: '==' as const,
        val: f.val,
      }));
      query.filters = [...(query.filters ?? []), ...ancestorFilters];
    }
    return [query];
  });
}
