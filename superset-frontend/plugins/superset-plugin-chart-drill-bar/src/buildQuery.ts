/**
 * src/buildQuery.ts
 *
 * Superset calls buildQuery() every time a chart needs fresh data — on
 * initial load and on every drill interaction.
 *
 * Responsibilities
 * ────────────────
 * 1. Read the current hierarchy depth and drill path from ownState.
 * 2. Select only the single GROUP BY column for the current level.
 * 3. Append equality filters for every ancestor selection so the SQL WHERE
 *    clause narrows the result set to the chosen branch.
 * 4. Request ALL configured metrics in one query, so every metric is
 *    available for the current level's grouped bars.
 * 5. Return a QueryObject that Superset's query engine executes.
 *
 * Why one column per query?
 * ─────────────────────────
 * Fetching all hierarchy levels at once would transfer megabytes of data for
 * large datasets.  Fetching only the current level keeps payloads small and
 * lets the database use indexes efficiently.
 */
import { buildQueryContext, QueryFormData, QueryObject } from '@superset-ui/core';

export default function buildQuery(
  formData: QueryFormData,
  options?: { ownState?: any },
) {
  const { groupby = [], metrics = [], sortBy = 'metric_desc' } = formData as any;

  const drillDepth: number = Number(options?.ownState?.drillDepth ?? 0);
  const drillPath: Array<{ col: string; val: string }> =
    options?.ownState?.drillPath ?? [];
  const drillFilters = drillPath.map((p: any) => ({
    col: p.rawColumn,
    val: p.value,
  }));

  // Guard: make sure we have at least one hierarchy column
  if (!groupby.length) {
    throw new Error(
      'Drill-Bar: At least one column must be added to the Hierarchy Columns control.',
    );
  }
  // Guard: make sure we have at least one metric
  if (!metrics.length) {
    throw new Error(
      'Drill-Bar: At least one metric must be added to the Metrics control.',
    );
  }

  const safeDepth = Math.min(Number(drillDepth), groupby.length - 1);
  const currentColumn: string = groupby[safeDepth];

  return buildQueryContext(formData, (baseQuery: QueryObject) => {
    const query: QueryObject = {
      ...baseQuery,
      // Replace whatever groupby the user set with just the current level column
      columns: [currentColumn],
      groupby: [currentColumn],
      // Request every configured metric so all bars in the group are available
      metrics,
      // Order by the first metric so bar order is stable and deterministic
      orderby:
        sortBy === 'label_asc'
          ? [[currentColumn, true]]
          : sortBy === 'label_desc'
            ? [[currentColumn, false]]
            : sortBy === 'metric_asc'
              ? [[metrics[0], true]]
              : [[metrics[0], false]], // default: metric_desc
      row_limit: 1000,
    };
    // Add ancestor filters so the query is scoped to the selected branch
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