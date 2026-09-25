/**
 * src/controls/MetricColorControl.tsx
 *
 * Custom control rendered directly in the control panel (not a built-in
 * Superset control type) — one row per configured metric, each with four
 * color pickers: header background, header text, value background, value
 * text. Reads the current metric list via mapStateToProps in controlPanel.ts
 * so the rows stay in sync as metrics are added/removed.
 */
import React from 'react';
import { MetricColorMap, DEFAULT_METRIC_COLOR } from '../types';

function getMetricLabel(m: any): string {
  if (typeof m === 'string') return m;
  return m?.label ?? m?.column?.column_name ?? String(m);
}

interface Props {
  value?: MetricColorMap;
  onChange?: (value: MetricColorMap) => void;
  metrics?: any[];
}

export default function MetricColorControl({ value, onChange, metrics = [] }: Props) {
  const colorMap = value ?? {};
  const metricLabels = metrics.map(getMetricLabel);

  const updateField = (metric: string, field: keyof typeof DEFAULT_METRIC_COLOR, color: string) => {
    const current = colorMap[metric] ?? DEFAULT_METRIC_COLOR;
    const next: MetricColorMap = {
      ...colorMap,
      [metric]: { ...current, [field]: color },
    };
    onChange?.(next);
  };

  if (!metricLabels.length) {
    return (
      <div style={{ fontSize: 12, color: '#888', padding: '6px 0' }}>
        Add at least one metric above to configure its colors here.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'sans-serif', fontSize: 12 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr repeat(4, 90px)',
          gap: 4,
          fontWeight: 600,
          color: '#555',
          marginBottom: 4,
        }}
      >
        <span>Metric</span>
        <span>Header BG</span>
        <span>Header Text</span>
        <span>Value BG</span>
        <span>Value Text</span>
      </div>
      {metricLabels.map((metric) => {
        const c = colorMap[metric] ?? DEFAULT_METRIC_COLOR;
        return (
          <div
            key={metric}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr repeat(4, 90px)',
              gap: 4,
              alignItems: 'center',
              padding: '4px 0',
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {metric}
            </span>
            <input
              type="color"
              value={c.headerBg}
              onChange={(e) => updateField(metric, 'headerBg', e.target.value)}
            />
            <input
              type="color"
              value={c.headerText}
              onChange={(e) => updateField(metric, 'headerText', e.target.value)}
            />
            <input
              type="color"
              value={c.valueBg}
              onChange={(e) => updateField(metric, 'valueBg', e.target.value)}
            />
            <input
              type="color"
              value={c.valueText}
              onChange={(e) => updateField(metric, 'valueText', e.target.value)}
            />
          </div>
        );
      })}
    </div>
  );
}