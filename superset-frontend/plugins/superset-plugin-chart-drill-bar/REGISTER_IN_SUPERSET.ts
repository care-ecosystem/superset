/**
 * superset-frontend/src/setup/setupPlugins.ts  (PATCH — do not replace the whole file)
 *
 * Purpose
 * ───────
 * This file is executed once at Superset's frontend boot time.
 * It instantiates every chart plugin and calls `.configure({ key }).register()`
 * so the plugin appears in the chart-type picker.
 *
 * INSTRUCTIONS
 * ────────────
 * 1. Open  superset-frontend/src/setup/setupPlugins.ts  in your Superset checkout.
 * 2. Add the import below alongside the other plugin imports (typically around line 60).
 * 3. Add the register() call inside the `setupPlugins` function body (see example below).
 *
 * ─── ADD THIS IMPORT ──────────────────────────────────────────────────────────
 *
 *   import DrillBarChartPlugin from '@superset-ui/plugin-chart-drill-bar';
 *
 * ─── ADD THIS REGISTRATION CALL (inside setupPlugins()) ──────────────────────
 *
 *   new DrillBarChartPlugin()
 *     .configure({ key: 'drill_bar' })
 *     .register();
 *
 * ─── COMPLETE DIFF ────────────────────────────────────────────────────────────
 *
 * The key string 'drill_bar' is the viz_type value stored in the database for
 * any chart that uses this plugin.  It must be unique across all registered plugins.
 *
 * After saving the file, rebuild the frontend:
 *
 *   cd superset-frontend
 *   npm run build          # production build
 *   # or
 *   npm run dev-server     # hot-reload dev mode
 */

// ─── Example context (excerpt from a typical setupPlugins.ts) ─────────────────

/*
import DrillBarChartPlugin from '@superset-ui/plugin-chart-drill-bar'; // <-- ADD

export default function setupPlugins() {
  // ... existing plugin registrations ...

  new DrillBarChartPlugin()          // <-- ADD
    .configure({ key: 'drill_bar' }) // <-- ADD
    .register();                     // <-- ADD
}
*/
