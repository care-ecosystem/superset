/**
 * src/buildQuery.ts
 *
 * Returns TWO queries in one buildQuery call:
 *   1. The main table query — grouped by From + To, with the Patients
 *      Referred and Top Reason metrics.
 *   2. A totals query — no groupby at all, so it aggregates the Total
 *      Metric (or Patients Referred, if no Total Metric is set) across
 *      every row currently in scope (respecting filters/date range), for
 *      the footer.
 *
 * Both queries automatically inherit the dashboard's active filters (date
 * range, cross-filters, etc.) since buildQueryContext applies those to
 * every QueryObject it returns.
 */
import { buildQueryContext, QueryFormData, QueryObject } from '@superset-ui/core';

export default function buildQuery(formData: QueryFormData) {
  const {
    fromColumn,
    toColumn,
    patientsMetric,
    reasonMetric,
    totalMetric,
  } = formData as any;

  if (!fromColumn || !toColumn) {
    throw new Error('Referral Flow: Both "From Column" and "To Column" are required.');
  }
  if (!patientsMetric) {
    throw new Error('Referral Flow: "Patients Referred" metric is required.');
  }

  return buildQueryContext(formData, (baseQuery: QueryObject) => {
    const mainQuery: QueryObject = {
      ...baseQuery,
      columns: [fromColumn, toColumn],
      groupby: [fromColumn, toColumn],
      metrics: reasonMetric ? [patientsMetric, reasonMetric] : [patientsMetric],
      orderby: [[patientsMetric, false]],
      row_limit: baseQuery.row_limit ?? 1000,
    };

    const totalQuery: QueryObject = {
      ...baseQuery,
      columns: [],
      groupby: [],
      metrics: [totalMetric || patientsMetric],
      row_limit: 1,
    };

    return [mainQuery, totalQuery];
  });
}
