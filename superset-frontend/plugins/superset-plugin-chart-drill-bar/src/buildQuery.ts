/**
 * src/buildQuery.ts
 *
 * Superset calls buildQuery() every time a chart needs fresh data — on
 * initial load and on every drill interaction.
 *
 * Responsibilities
 * ────────────────
 * 1. Read the current hierarchy depth and drill path from formData.
 * 2. Select only the single GROUP BY column for the current level.
 * 3. Append equality filters for every ancestor selection so the SQL WHERE
 *    clause narrows the result set to the chosen branch.
 * 4. Return a QueryObject that Superset's query engine executes.
 *
 * Why one column per query?
 * ─────────────────────────
 * Fetching all hierarchy levels at once would transfer megabytes of data for
 * large datasets.  Fetching only the current level keeps payloads small and
 * lets the database use indexes efficiently.
 */
import { buildQueryContext, QueryFormData, QueryObject } from '@superset-ui/core';

export default function buildQuery(formData: QueryFormData) {
  const {
    groupby = [],
    metric,
    // Custom fields injected by transformProps when the user drills
    drillDepth = 0,
    drillFilters = [],
  } = formData as any;

  // Guard: make sure we have at least one hierarchy column
  if (!groupby.length) {
    throw new Error('Drill-Bar: At least one column must be added to the Hierarchy Columns control.');
  }

  const safeDepth = Math.min(Number(drillDepth), groupby.length - 1);
  const currentColumn: string = groupby[safeDepth];

  return buildQueryContext(formData, (baseQuery: QueryObject) => {
    const query: QueryObject = {
      ...baseQuery,
      // Replace whatever groupby the user set with just the current level column
      columns: [currentColumn],
      groupby: [currentColumn],
      metrics: [metric],
      orderby: [[metric, false]], // DESC so tallest bar is first
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
