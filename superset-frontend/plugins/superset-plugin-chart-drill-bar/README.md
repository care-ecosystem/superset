# Superset Drill-Down Bar Chart Plugin

A custom Apache Superset 6.1.0 visualization plugin that renders a vertical bar
chart with multi-level hierarchical drill-down.  Users click a bar to zoom into
the next level of the hierarchy; a breadcrumb trail lets them navigate back up.

---

## Folder structure

```
superset-plugin-chart-drill-bar/
├── package.json                  # npm package manifest
├── tsconfig.json                 # TypeScript compiler config
├── jest.config.js                # Jest test runner config
├── REGISTER_IN_SUPERSET.ts       # Instructions for wiring the plugin into Superset
├── src/
│   ├── index.ts                  # Public package entry-point
│   ├── plugin.ts                 # ChartPlugin subclass (metadata + wiring)
│   ├── types.ts                  # Shared TypeScript interfaces
│   ├── buildQuery.ts             # Dynamic query construction per drill level
│   ├── controlPanel.ts           # Sidebar controls (Explore view)
│   ├── transformProps.ts         # Raw data → React component props
│   ├── DrillBarChart.tsx         # React + D3 rendering component
│   └── images/
│       ├── thumbnail.png         # Plugin thumbnail shown in chart picker
│       └── index.d.ts            # TypeScript declaration for PNG imports
└── tests/
    ├── __mocks__/
    │   └── fileMock.js           # Jest file mock (PNG imports)
    ├── buildQuery.test.ts        # Unit tests for query builder
    ├── transformProps.test.ts    # Unit tests for prop transformer
    └── DrillBarChart.test.tsx    # React component smoke tests
```

---

## File purposes

| File | Responsibility |
|------|---------------|
| `plugin.ts` | Registers the plugin with Superset's `ChartPlugin` base class. Ties together metadata, buildQuery, controlPanel, transformProps, and the React component. |
| `types.ts` | Single source of truth for all TypeScript interfaces used across the plugin. |
| `buildQuery.ts` | Called by Superset's query engine. Dynamically selects the correct GROUP BY column and appends ancestor WHERE filters based on the current drill path. |
| `controlPanel.ts` | Defines the sidebar controls chart authors see in Explore. Hierarchy columns, metric selector, colour pickers, toggles. |
| `transformProps.ts` | Receives raw server query results and formData; returns strongly-typed props for the React component. Also creates the `onDrillDown`/`onDrillUp` callbacks. |
| `DrillBarChart.tsx` | The React component. Renders an SVG using D3 scales and axes, animated bars, value labels, floating tooltip, and a breadcrumb navigation bar. |

---

## Prerequisites

- Node.js ≥ 16
- Apache Superset 6.1.0 (monorepo checkout recommended)
- Access to `superset-frontend/src/setup/setupPlugins.ts`

---

## Installation — standalone (npm link)

This is the recommended approach for development.

```bash
# 1. Clone / copy this plugin folder somewhere convenient
cd /your/workspace
git clone <this-repo-or-copy-folder> superset-plugin-chart-drill-bar

# 2. Install dependencies
cd superset-plugin-chart-drill-bar
npm install

# 3. Build the plugin
npm run build
# Output lands in ./lib  (CJS)  and  ./esm  (ESM)

# 4. Link the plugin into your Superset frontend
npm link

cd /path/to/superset/superset-frontend
npm link @superset-ui/plugin-chart-drill-bar

# 5. Register the plugin (see REGISTER_IN_SUPERSET.ts for the exact diff)
#    Edit: superset-frontend/src/setup/setupPlugins.ts
#    Add import and new DrillBarChartPlugin().configure({key:'drill_bar'}).register();

# 6. Start the Superset dev server
npm run dev-server
```

---

## Installation — monorepo (copy into Superset)

If you are working inside the Superset monorepo:

```bash
# Copy the plugin into the plugins directory
cp -r superset-plugin-chart-drill-bar \
  /path/to/superset/superset-frontend/packages/

# Add it to the root package.json workspaces array (if not already covered by glob)
# "workspaces": ["packages/*", "plugins/*"]

# Install from the monorepo root
cd /path/to/superset
cd superset-frontend
npm install

# Register (same as step 5 above)
# Then build or start the dev server
npm run build
```

---

## No backend changes required

Drill-down is implemented entirely in the frontend:

- `buildQuery` reuses Superset's standard `buildQueryContext` helper, which
  creates a standard SQL/native query request.  No Python changes are needed.
- The extra formData fields (`drillDepth`, `drillPath`, `drillFilters`) are
  passed through the existing `extraFormData` / `ownState` mechanism already
  supported by `setDataMask`.

---

## Using the chart in Superset

1. Open **Explore** and select **Drill-Down Bar Chart** from the chart type picker.
2. Connect to a dataset that has:
   - One or more **categorical columns** (e.g. `continent`, `country`, `state`, `city`)
   - At least one **numeric column** or a pre-defined metric (e.g. `sum__population`)
3. In the **Hierarchy Columns** control, add your categorical columns **in top-to-bottom order**.
4. Set the **Metric** to the measure you want to aggregate.
5. Save and explore — clicking any bar drills into the next level.

---

## Running tests

```bash
cd superset-plugin-chart-drill-bar
npm install
npm test
```

Expected output:

```
PASS  tests/buildQuery.test.ts
PASS  tests/transformProps.test.ts
PASS  tests/DrillBarChart.test.tsx

Test Suites: 3 passed, 3 total
Tests:       15 passed, 15 total
```

---

## Drill-down data flow

```
User clicks bar
      │
      ▼
DrillBarChart.tsx  →  onDrillDown(datum)
      │
      ▼
transformProps.ts  →  hooks.setDataMask({ ownState: { drillDepth, drillPath, drillFilters } })
      │
      ▼
Superset engine    →  re-calls buildQuery(formData merged with ownState)
      │
      ▼
buildQuery.ts      →  GROUP BY hierarchyColumns[newDepth]  WHERE ancestor filters
      │
      ▼
SQL / native query →  server returns aggregated rows for the selected branch
      │
      ▼
transformProps.ts  →  maps rows → BarDatum[]  with updated drillPath
      │
      ▼
DrillBarChart.tsx  →  renders new bars with D3 animation
```

---

## Customisation tips

| Goal | Where to change |
|------|----------------|
| Change default bar colour | `controlPanel.ts` → `barColor` default |
| Add a colour-per-level feature | `DrillBarChart.tsx` → compute fill from `datum.depth` |
| Support horizontal bars | `DrillBarChart.tsx` → swap x/y scale assignments |
| Paginate large bar sets | `buildQuery.ts` → add `row_offset` and expose a page control |
| Animate with CSS instead of D3 | `DrillBarChart.tsx` → replace `transition()` with `style={{ transition: '…' }}` |

---

## Licence

Apache 2.0 — same as Apache Superset.
