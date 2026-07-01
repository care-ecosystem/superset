/**
 * tests/buildQuery.test.ts
 *
 * Verifies that buildQuery:
 *  - selects the correct GROUP BY column for each depth level
 *  - appends ancestor filters when drillFilters is provided
 *  - throws a useful error when no hierarchy columns are given
 */

// We mock @superset-ui/core so tests don't need the full Superset monorepo
jest.mock('@superset-ui/core', () => ({
  buildQueryContext: (formData: any, fn: Function) => {
    // Simulate what Superset does: call fn with a base query
    const baseQuery = {
      filters: [],
      metrics: [],
      columns: [],
      groupby: [],
    };
    return fn(baseQuery);
  },
}));

import buildQuery from '../src/buildQuery';

const BASE_FORM_DATA = {
  groupby: ['continent', 'country', 'state', 'city'],
  metric: 'sum__population',
  datasource: '1__table',
  viz_type: 'drill_bar',
};

describe('buildQuery', () => {
  it('queries the first column at depth 0 (root level)', () => {
    const queries = buildQuery({ ...BASE_FORM_DATA, drillDepth: 0, drillFilters: [] });
    const q = queries[0];
    expect(q.columns).toContain('continent');
    expect(q.groupby).toContain('continent');
    expect(q.metrics).toContain('sum__population');
  });

  it('queries the correct column at depth 2 (state level)', () => {
    const queries = buildQuery({ ...BASE_FORM_DATA, drillDepth: 2, drillFilters: [] });
    expect(queries[0].columns).toContain('state');
  });

  it('appends ancestor filters to the query', () => {
    const drillFilters = [
      { col: 'continent', val: 'Asia' },
      { col: 'country', val: 'India' },
    ];
    const queries = buildQuery({ ...BASE_FORM_DATA, drillDepth: 2, drillFilters });
    const filters = queries[0].filters ?? [];
    expect(filters.some((f: any) => f.col === 'continent' && f.val === 'Asia')).toBe(true);
    expect(filters.some((f: any) => f.col === 'country' && f.val === 'India')).toBe(true);
  });

  it('clamps depth to the last column if depth exceeds hierarchy length', () => {
    const queries = buildQuery({ ...BASE_FORM_DATA, drillDepth: 99, drillFilters: [] });
    // Last column is 'city' (index 3)
    expect(queries[0].columns).toContain('city');
  });

  it('throws when no hierarchy columns are provided', () => {
    expect(() => buildQuery({ ...BASE_FORM_DATA, groupby: [] })).toThrow(/hierarchy/i);
  });
});
