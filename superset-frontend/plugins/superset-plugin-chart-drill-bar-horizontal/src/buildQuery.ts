/**
 * src/buildQuery.ts
 * Identical logic to the vertical Drill-Down Bar Chart's buildQuery — one
 * GROUP BY column per query (the current hierarchy depth), ancestor filters
 * from ownState.drillPath, all configured metrics requested together.
 */
import { buildQueryContext, QueryFormData, QueryObject } from '@superset-ui/core';

export default function buildQuery(
  formData: QueryFormData,
  options?: { ownState?: any },
) {
  const { groupby = [], metrics = [], sortBy = 'metric_desc' } = formData as any;

  const drillDepth: number = Number(options?.ownState?.drillDepth ?? 0);
  const drillPath: Array<{ rawColumn: any; value: string }> =
    options?.ownState?.drillPath ?? [];
  const drillFilters = drillPath.map((p: any) => ({
    col: p.rawColumn,
    val: p.value,
  }));

  if (!groupby.length) {
    throw new Error(
      'Drill-Bar-Horizontal: At least one column must be added to the Hierarchy Columns control.',
    );
  }
  if (!metrics.length) {
    throw new Error(
      'Drill-Bar-Horizontal: At least one metric must be added to the Metrics control.',
    );
  }

  const safeDepth = Math.min(Number(drillDepth), groupby.length - 1);
  const currentColumn: string = groupby[safeDepth];

  return buildQueryContext(formData, (baseQuery: QueryObject) => {
    const query: QueryObject = {
      ...baseQuery,
      columns: [currentColumn],
      groupby: [currentColumn],
      metrics,
      orderby:
        sortBy === 'label_asc'
          ? [[currentColumn, true]]
          : sortBy === 'label_desc'
            ? [[currentColumn, false]]
            : sortBy === 'metric_asc'
              ? [[metrics[0], true]]
              : [[metrics[0], false]],
      row_limit: 1000,
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
