# Custom Superset Visuals — Setup & Reference Guide

This document explains how the custom chart plugins in this Superset instance
are structured, how to modify them, and how to add new ones. It covers the
general architecture once, then goes deep on one plugin (Drill-Down Bar
Chart) as a representative example, and briefly summarizes the rest.

---

## 1. General Architecture

Every custom chart in Superset is a **plugin** — a self-contained package
living under `superset-frontend/plugins/`. Superset's frontend build
(webpack) treats each plugin as a normal npm package, symlinked into
`node_modules` via a `file:` dependency in the root `package.json`.

### 1.1 The five files every plugin needs

| File | Purpose |
|---|---|
| `package.json` | Declares the plugin's name, dependencies (e.g. D3 sub-packages), and build scripts. |
| `src/types.ts` | TypeScript interfaces shared across the other files — the data shapes flowing from query → transform → render. |
| `src/buildQuery.ts` | Turns the chart's configured columns/metrics/filters into a `QueryObject` (or several) that Superset sends to the backend. |
| `src/transformProps.ts` | Runs after the backend returns data. Reshapes the raw rows into whatever props the React component expects. |
| `src/controlPanel.ts` | Defines the sidebar controls shown in Explore's **Data** and **Customize** tabs (dimensions, metrics, colour pickers, sliders, etc.). |
| `src/<ChartName>.tsx` | The actual React component that renders the chart (SVG via D3, or a plain HTML table). |
| `src/plugin.ts` | Registers the above four pieces into a `ChartPlugin` class, plus metadata (name, description, category, tags). |
| `src/index.ts` | Barrel file — re-exports everything so other files can `import X from '@superset-ui/plugin-chart-x'`. |

### 1.2 How data flows through a chart, end to end

```
User configures controls in Explore
        │
        ▼
controlPanel.ts populates formData
        │
        ▼
buildQuery.ts turns formData → QueryObject(s)
        │
        ▼
Superset backend runs the SQL, returns queriesData
        │
        ▼
transformProps.ts reshapes queriesData → component props
        │
        ▼
<ChartName>.tsx renders the props as SVG/HTML
```

### 1.3 Registering a new plugin (the setup steps used for every plugin here)

1. Place the plugin folder under `superset-frontend/plugins/`.
2. Add it to the root `superset-frontend/package.json` dependencies:
   ```json
   "@superset-ui/plugin-chart-<name>": "file:./plugins/<folder-name>",
   ```
3. Run `npm install --legacy-peer-deps` from `superset-frontend/`. This
   creates the actual symlink in `node_modules` that webpack resolves
   against.
4. Register the plugin in `MainPreset.ts`:
   ```ts
   import <PluginClass> from '@superset-ui/plugin-chart-<name>';
   ...
   new <PluginClass>().configure({ key: '<unique_key>' }),
   ```
   `key` becomes the internal `viz_type` string stored in the database —
   pick something short, lowercase, snake_case, and unique.
5. Restart `npm run dev-server`. Watch for a confirmation line at startup:
   ```
   [Superset Plugin] Use symlink source for @superset-ui/plugin-chart-<name> @ ./plugins/<folder-name>
   ```
   If that line is missing, step 2 or 3 didn't take effect.

> **Note on Docker + dev-server together:** the backend (Postgres, Flask,
> Superset core) runs in Docker via `docker compose up` and does **not**
> need restarting for frontend-only changes. Only `npm run dev-server`
> needs restarting when a *new dependency* (not just an edited file) is
> added — plain file edits hot-reload automatically.

### 1.4 The `ownState` drill-down pattern

Several plugins here (the two drill-down bar charts, the pie/donut chart)
support click-to-drill navigation. This is implemented using Superset's
**`ownState`** mechanism, not `formData`:

- `transformProps.ts` reads the current drill depth and path from
  `chartProps.ownState` (not `chartProps.formData` — a common early bug in
  this project was reading from the wrong one).
- Clicking a bar/slice calls `hooks.setDataMask({ ownState: { drillDepth,
  drillPath } })`, which triggers Superset to re-invoke `buildQuery.ts`
  with the new `ownState` passed as a second argument.
- `buildQuery.ts` reads `options.ownState` to decide which single
  hierarchy column to `GROUP BY` next, and builds ancestor filters from the
  accumulated `drillPath` so each drill-down query is scoped to the
  selected branch.
- Ancestor filters use the **raw column reference** (`rawColumn`), not just
  its display label — this matters when a hierarchy column is a
  calculated/adhoc SQL expression rather than a plain column name, since
  the display label alone can't be resolved back into a `WHERE` clause.

---

## 2. Deep Dive: Drill-Down Bar Chart (`superset-plugin-chart-drill-bar`)

This is the most mature plugin and a good template for understanding the
others, since every other custom plugin follows the same skeleton.

### 2.1 What it does

A vertical bar chart supporting multi-level hierarchical drill-down (e.g.
Month → Facility → Department), with:
- Multiple metrics rendered as grouped/clustered bars per hierarchy label
- A breadcrumb trail for navigating back up the hierarchy
- A legend (one swatch per metric)
- Configurable bar colours, value labels, tooltip, animation duration
- Configurable X-axis / Y-axis label font sizes
- Horizontal scrolling (native browser scrollbar) when there are too many
  hierarchy labels to fit the panel width

### 2.2 `types.ts`

Key shapes:
- `BarDatum` — one hierarchy label's worth of data: `{ label, values:
  MetricValue[], depth, parent }`. `values` holds one entry per configured
  metric (supports the multi-metric grouped-bar rendering).
- `DrillPath` — one breadcrumb step: `{ column, rawColumn, value, label }`.
  `rawColumn` is kept separately from `column` (the display label)
  specifically so ancestor filters can reference the real SQL expression.
- `DrillBarChartProps` — everything passed into the React component,
  including `xAxisFontSize` / `yAxisFontSize`.

### 2.3 `buildQuery.ts`

- Reads `groupby` (ordered hierarchy columns), `metrics` (array — this
  chart supports multiple simultaneous metrics), and `sortBy`.
- Reads `ownState.drillDepth` / `ownState.drillPath` (defaulting to `0` /
  `[]` on first load) to determine which single hierarchy column to query
  and what ancestor filters to apply.
- Requests **all** configured metrics in one query (not one query per
  metric) — every metric needs to be available for the current level's
  grouped bars.
- `sortBy` controls `orderby`: metric ascending/descending, or label
  ascending/descending.

![alt text](image-5.png)

![alt text](image-6.png)

### 2.4 `transformProps.ts`

- Normalizes hierarchy columns and metrics into display-label strings via
  `getColumnLabel()` / `getMetricLabel()` — this handles both plain string
  columns and adhoc SQL-expression columns/metrics (e.g. a calculated
  `EXTRACT(MONTH FROM date)` column), which otherwise arrive as objects
  shaped like `{ expressionType, label, sqlExpression }` and will crash
  React if rendered directly as a child.
- Builds one `BarDatum` per row, with a `values` array covering every
  configured metric.
- `onDrillDown` / `onDrillUp` push new `ownState` via `hooks.setDataMask`.

### 2.5 `controlPanel.ts`

- `groupby` — `DndColumnSelect`, multi, for hierarchy columns.
- `metrics` — `DndMetricSelect`, multi.
- `sortBy` — `SelectControl` with four fixed choices.
- `barColor` / `barColorHover` — `ColorPickerControl`. Only the *first*
  metric uses these; additional metrics cycle through a built-in palette
  (see `DrillBarChart.tsx`).
- `showLabels`, `showTooltip`, `animationDuration` — standard toggles.
- `xAxisFontSize`, `yAxisFontSize` — `SliderControl` (8–22px).

### 2.6 `DrillBarChart.tsx`

- Uses `d3-scale` (`scaleBand` for hierarchy labels, nested `scaleBand` for
  metrics within each group, `scaleLinear` for the value axis), `d3-axis`,
  `d3-selection`, `d3-format`, and `d3-transition` (imported for its
  side-effect of patching `.transition()` onto `Selection.prototype` — it
  is never called directly, just imported).
- **Dynamic bottom margin:** `measureTextWidth()` uses an offscreen
  `<canvas>` to measure the actual pixel width of the longest visible
  X-axis label at the chosen font size, and the chart's bottom margin
  expands to fit it (capped between `MIN_BOTTOM_MARGIN` and
  `MAX_BOTTOM_MARGIN` so one extreme outlier label can't consume the whole
  chart). This is what prevents long labels from being clipped.
- **Horizontal scroll:** when `data.length * MIN_GROUP_WIDTH > width`, the
  SVG is drawn wider than the visible panel and wrapped in a `<div>` with
  `overflow-x: auto`, relying on the browser's native scrollbar. An earlier
  approach used custom Prev/Next buttons and custom-styled scrollbars;
  both were dropped once the native scrollbar was confirmed to render
  correctly (the earlier "invisible scrollbar" symptom turned out to be a
  layout bug — the chart's height wasn't accounting for extra UI rows,
  pushing the scrollbar off the visible panel — not a genuine rendering
  failure).
- Clicking any bar within a group drills the *whole* hierarchy label — all
  configured metrics carry through together to the next level.

### 2.7 `plugin.ts`

Standard `ChartPlugin` registration. `category: 'Part of a Whole'` in the
chart-type picker — this can be changed by editing the `ChartMetadata`
config if a different category fits better.

### 2.8 `Examples`

Appointments vs OPD Encounters (Month) Chart

The hierarchical drill down is as shown below

#### i) Month Level

![alt text](image-1.png)

#### ii) Facility Level

![alt text](image-2.png)

#### iiii) Department Level

![alt text](image-3.png)

#### iv) Doctor Level

![alt text](image-4.png)

---

## 3. Other Custom Plugins (brief)

All of these follow the exact same file layout and general patterns
described in §1 and §2. Only what's different is noted below.

### 3.1 Drill-Down Horizontal Bar Chart (`superset-plugin-chart-drill-bar-horizontal`)

Same drill-down/multi-metric logic as the vertical chart. The two D3 scales
swap roles: the hierarchy-label `scaleBand` runs down the **Y-axis**
instead of across X, and the value `scaleLinear` runs left-to-right across
the **X-axis**. Bars grow rightward from `x=0`. The dynamic-margin fix is
mirrored on the **left** margin (since that's where the long hierarchy
labels sit), using the same `measureTextWidth()` approach. This chart
relies on the native vertical scrollbar (no custom Prev/Next buttons).

### 3.2 Drill-Down Pie/Donut Chart (`superset-plugin-chart-drill-pie`)

Uses `d3-shape`'s `pie()` / `arc()` generators with angle-tweened
transitions (interpolating `startAngle`/`endAngle` on each update rather
than the position/size tweens the bar charts use). Key differences from
the bar charts:
- Uses a **single metric**, not an array — a pie inherently shows parts of
  one whole, so a multi-metric pie doesn't make visual sense.
- **Configurable inner radius** (0–85%, via slider) instead of a plain
  donut on/off toggle, so the ring thickness is adjustable.
- **Center total** — when the inner radius is non-zero, displays the sum
  of all currently-visible slices in the donut's hole. This recomputes
  automatically on every drill click, since it's derived from `data` via
  `useMemo`, and `data` is exactly what `transformProps.ts` returns fresh
  after each drill-down query.
- **Dynamic legend width** — same `measureTextWidth()` pattern as the bar
  charts' margins, applied to the legend panel's width instead, so long
  slice labels aren't truncated.

### 3.3 Referral Flow Table (`superset-plugin-chart-referral-flow`)

Not drill-down, not D3-based — a plain HTML `<table>` with React-driven
styling. Two dimension columns (From, To), rendered as colour-coded pill
badges (colour auto-assigned from a fixed palette, keyed by each distinct
label's first-seen order across both columns), a right-aligned bold
Patients Referred count, and an optional Top Reason column. A separate
**Total Metric** control drives a footer total, computed via a *second*
query in `buildQuery.ts` that has no `groupby` at all — so it aggregates
across every row currently in scope (respecting whatever filters/date
range are active), independent of the main table's From/To grouping. No
click interactivity.

---

## 4. Handlebars Charts — Changes Made

**Important context:** the Handlebars chart type itself is a **premade,
built-in Superset chart plugin** (`plugin-chart-handlebars`), not something
built from scratch in this project. It lets chart authors write custom
HTML + CSS templates (with Handlebars templating syntax) directly in the
Explore UI, without needing a custom plugin folder or a `dev-server`
restart per chart. The KPI cards on the dashboards (Total Appointments,
Total Lab Tests, Bed Occupancy, etc.) are all built this way.

The following changes/fixes were made **within this existing plugin**,
not a rebuild of it:

### 4.1 Per-card CSS class collisions

Each KPI card's HTML/CSS is edited independently per chart, but Superset
renders every chart's `<style>` block into the same shared dashboard page
— it does **not** scope styles per chart. Several cards originally reused
generic class names (`.big-number-card`, `.value`), which caused whichever
card's `<style>` block loaded last on the page to silently override the
styling of every other card using the same class names. **Fix:** each
card's HTML/CSS was given unique, chart-specific class name prefixes
(e.g. `.bed-occupancy-card .bed-occupancy-value`) instead of reusing
generic ones.

### 4.2 "vs previous period" comparison feature

A pre-existing feature (already partially implemented before this round of
changes) that adds a second query for the equivalent prior time period and
computes a percentage change, driven by a "Show % change vs previous
period" checkbox and a "Metric to compare" selector in the control panel.

- **Root cause found for the feature not working:** the control panel
  registered the controls as `show_comparison` / `comparison_metric`
  (snake_case), but `buildQuery.ts` / `transformProps.ts` were reading
  `formData.showComparison` / `formData.comparisonMetric` (camelCase) —
  these keys never existed in `formData`, so the comparison logic was
  silently skipped every time, regardless of any UI setting. **Fixed** by
  correcting both files to read the actual snake_case keys.
- Added a **native Time Range control** (`['time_range']`) to
  `controlPanel.ts`. This chart previously only had ad-hoc column filters
  (a manual `date >= X AND date < Y` condition), which populates
  `formData.adhoc_filters` — a completely different field from
  `formData.time_range`, which is what the comparison logic's
  `getComparisonRange()` function reads to compute the equivalent prior
  period. Without the native Time Range control, `formData.time_range`
  was always empty and the comparison could never activate.
- **Status: still not fully working as of the last debugging session.**
  With both fixes applied, the backend was confirmed to correctly return
  *two* query results (current period + prior period, e.g. 78 vs 41 lab
  requests) — but the computed `comparisonPct` was still not reaching the
  template. Debug logging was added to `transformProps.ts` (temporary
  `console.log` statements) to narrow this down further, but the root
  cause had not yet been found when work on this was paused. **Next
  step:** check the browser console output from that debug logging to see
  exactly which value (`showComparison`, `comparisonMetric`, `current`,
  `prior`) is unexpectedly falsy/undefined at runtime.

### 4.3 Content Security Policy (CSP) / `unsafe-eval` issue

On a server deployment with a strict CSP (`script-src` without
`unsafe-eval`), Handlebars charts throw: *"Evaluating a string as
JavaScript violates the following Content Security Policy directive..."*

- **Root cause:** `HandlebarsViewer.tsx` (inside the premade plugin) calls
  `Handlebars.compile(templateSource)` at render time, in the browser,
  every time the chart renders. This is inherent to how the plugin works —
  templates are edited live in the Explore UI with no build step, so they
  cannot be precompiled ahead of time. `Handlebars.compile()` internally
  relies on `new Function()` / `eval`, which strict CSPs block by default.
- **This is not a bug specific to this deployment** — it will occur on
  *any* Superset deployment with `unsafe-eval` disabled in its CSP,
  including production, if production's CSP matches what was seen on the
  server environment where this was first observed.
- **Two real options, not yet decided:**
  1. Add `'unsafe-eval'` to the `script-src` CSP directive (in
     `superset_config.py`'s `TALISMAN_CONFIG`, or the reverse proxy, if
     one is used). This is the only way to keep using Handlebars charts as
     they exist today. It does measurably reduce CSP's defence against
     XSS-via-`eval`, though the practical risk is lower for an
     internal-only, authenticated deployment than a publicly embedded one.
  2. Migrate the KPI cards to custom D3/React plugins (like the ones in
     §2–3), which are compiled at build time and never call `eval` —
     avoiding the CSP conflict entirely, at the cost of losing the
     live-template-editing convenience.

---

## 5. Adding a New Custom Visual — Checklist

1. Decide: does it need drill-down / `ownState`? If yes, copy the pattern
   from §1.4 and §2.3–2.4 rather than reinventing it.
2. Scaffold the six files (`package.json`, `types.ts`, `buildQuery.ts`,
   `transformProps.ts`, `controlPanel.ts`, `<Name>.tsx`, `plugin.ts`,
   `index.ts`) — copying an existing similar plugin's structure is the
   fastest starting point.
3. If it's SVG/D3-based: use the vertical or horizontal bar chart as a
   template. If it's a plain table: use the Referral Flow Table as a
   template.
4. Follow §1.3's registration steps (root `package.json`, `npm install`,
   `MainPreset.ts`, restart `dev-server`).
5. If long text labels are involved anywhere (axis labels, legend, table
   cells), consider the `measureTextWidth()` dynamic-sizing pattern from
   §2.6 up front, rather than guessing a fixed padding value.


