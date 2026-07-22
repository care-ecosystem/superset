/**
 * src/DrillPieChart.tsx
 *
 * The primary React component for the drill-down pie chart. It owns:
 *  1. Breadcrumb navigation bar — same pattern as the bar-chart plugins.
 *  2. SVG canvas rendered with D3's pie() + arc() generators — one arc per
 *     slice, animated via interpolated arc tweening on mount/update.
 *  3. Legend — one swatch per slice label (toggleable).
 *  4. Tooltip — follows the cursor and shows label/value/percentage.
 *  5. Drill interaction — clicking a slice calls props.onDrillDown;
 *     breadcrumb click calls props.onDrillUp.
 *
 * D3 is used for the pie/arc math and transitions only; DOM mutation for the
 * transition happens through a D3-managed <path> `d` attribute tween, while
 * everything else (legend, breadcrumb, tooltip) is plain React.
 */
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { pie, arc, PieArcDatum } from 'd3-shape';
import { format } from 'd3-format';
import { select } from 'd3-selection';
import 'd3-transition';
import { DrillPieChartProps, SliceDatum } from './types';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  label: string;
  value: number;
  percent: number;
}

const BREADCRUMB_HEIGHT = 36;
const LEGEND_WIDTH = 160; // reserved on the right when legend is shown

const PALETTE = [
  '#4682DC', '#2E9E8F', '#E0954E', '#9B6BC7',
  '#D4587A', '#5FA83D', '#C7A93E', '#4E9BC7',
  '#7A6FF0', '#DA8F8F', '#57B894', '#C77DC6',
];

function colorFor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export default function DrillPieChart(props: DrillPieChartProps) {
  const {
    width,
    height,
    data,
    hierarchyColumns,
    metricLabel,
    currentDepth,
    drillPath,
    showLabels,
    showTooltip,
    showLegend,
    innerRadiusPercent,
    showCenterTotal,
    animationDuration,
    onDrillDown,
    onDrillUp,
  } = props;

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, label: '', value: 0, percent: 0,
  });
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  const chartHeight = height - BREADCRUMB_HEIGHT;
  const chartWidth = showLegend ? Math.max(0, width - LEGEND_WIDTH) : width;
  const radius = Math.max(0, Math.min(chartWidth, chartHeight) / 2 - 20);
  // innerRadiusPercent is 0-85; 0 renders a solid pie, higher values open up
  // more of a hole in the middle. Recalculates on every render, so drilling
  // into a new level (which changes `data`, and therefore `total` below)
  // keeps the ring geometry stable while the center label updates.
  const innerRadius = radius * (Math.min(85, Math.max(0, innerRadiusPercent)) / 100);

  // Sum of all currently-visible slices. Since `data` comes fresh from
  // transformProps on every drill click (new query result for that level),
  // this recomputes automatically — no extra wiring needed for the center
  // total to reflect the newly drilled-into level.
  const total = useMemo(() => data.reduce((sum, d) => sum + d.value, 0), [data]);

  const pieGenerator = useMemo(
    () =>
      pie<SliceDatum>()
        .value((d) => d.value)
        .sort(null), // preserve the order buildQuery already sorted (largest first)
    [],
  );

  const arcGenerator = useMemo(
    () => arc<PieArcDatum<SliceDatum>>().innerRadius(innerRadius).outerRadius(radius),
    [innerRadius, radius],
  );

  const labelArcGenerator = useMemo(
    () => arc<PieArcDatum<SliceDatum>>().innerRadius(radius * 0.7).outerRadius(radius * 0.7),
    [radius],
  );

  const arcs = useMemo(() => pieGenerator(data), [pieGenerator, data]);

  // Animate slice transitions: each <path> tweens its `d` attribute between
  // the previous and new arc angles whenever `arcs` changes.
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const prevAnglesRef = useRef<Map<string, { startAngle: number; endAngle: number }>>(new Map());

  useEffect(() => {
    arcs.forEach((a) => {
      const el = pathRefs.current.get(a.data.label);
      if (!el) return;
      const prev = prevAnglesRef.current.get(a.data.label) ?? {
        startAngle: a.startAngle,
        endAngle: a.startAngle,
      };
      select(el)
        .transition()
        .duration(animationDuration)
        .attrTween('d', () => {
          const interpolateStart = prev.startAngle;
          const interpolateEnd = prev.endAngle;
          return (t: number) => {
            const currentArc = {
              ...a,
              startAngle: interpolateStart + (a.startAngle - interpolateStart) * t,
              endAngle: interpolateEnd + (a.endAngle - interpolateEnd) * t,
            };
            return arcGenerator(currentArc as PieArcDatum<SliceDatum>) ?? '';
          };
        });
    });
    const newAngles = new Map<string, { startAngle: number; endAngle: number }>();
    arcs.forEach((a) => newAngles.set(a.data.label, { startAngle: a.startAngle, endAngle: a.endAngle }));
    prevAnglesRef.current = newAngles;
  }, [arcs, animationDuration, arcGenerator]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGPathElement>, datum: SliceDatum) => {
      if (!showTooltip) return;
      const rect = (e.currentTarget as SVGPathElement).closest('svg')!.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 28,
        label: datum.label,
        value: datum.value,
        percent: total > 0 ? (datum.value / total) * 100 : 0,
      });
      setHoveredLabel(datum.label);
    },
    [showTooltip, total],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
    setHoveredLabel(null);
  }, []);

  const handleSliceClick = useCallback(
    (datum: SliceDatum) => {
      if (currentDepth < hierarchyColumns.length - 1) onDrillDown(datum);
    },
    [currentDepth, hierarchyColumns, onDrillDown],
  );

  const fmt = format(',.0f');
  const canDrillFurther = currentDepth < hierarchyColumns.length - 1;

  return (
    <div style={{ position: 'relative', width, height, fontFamily: 'sans-serif' }}>
      {/* ── Breadcrumb navigation ── */}
      <div
        style={{
          height: BREADCRUMB_HEIGHT, display: 'flex', alignItems: 'center', padding: '0 8px',
          background: '#f7f7f7', borderBottom: '1px solid #e0e0e0', overflowX: 'auto', whiteSpace: 'nowrap',
        }}
      >
        <BreadcrumbItem label={hierarchyColumns[0] ?? 'Root'} active={drillPath.length === 0} onClick={() => onDrillUp(0)} />
        {drillPath.map((step, idx) => (
          <React.Fragment key={idx}>
            <span style={{ margin: '0 4px', color: '#999' }}>›</span>
            <BreadcrumbItem label={`${step.column}: ${step.label}`} active={idx === drillPath.length - 1} onClick={() => onDrillUp(idx + 1)} />
          </React.Fragment>
        ))}
        {drillPath.length > 0 && (
          <button onClick={() => onDrillUp(Math.max(0, currentDepth - 1))} style={backButtonStyle} title="Go back one level">
            ← Back
          </button>
        )}
      </div>

      {/* ── Chart + legend row ── */}
      <div style={{ position: 'relative', display: 'flex', height: chartHeight }}>
        <svg width={chartWidth} height={chartHeight} style={{ display: 'block' }}>
          <g transform={`translate(${chartWidth / 2},${chartHeight / 2})`}>
            {arcs.map((a, idx) => {
              const isHovered = hoveredLabel === a.data.label;
              const [lx, ly] = labelArcGenerator.centroid(a);
              const percent = total > 0 ? (a.data.value / total) * 100 : 0;

              return (
                <g key={a.data.label}>
                  <path
                    ref={(el) => {
                      if (el) pathRefs.current.set(a.data.label, el);
                    }}
                    d={arcGenerator(a) ?? undefined}
                    fill={colorFor(idx)}
                    opacity={isHovered ? 0.8 : 1}
                    stroke="#fff"
                    strokeWidth={1.5}
                    style={{ cursor: canDrillFurther ? 'pointer' : 'default', transition: 'opacity 120ms' }}
                    onClick={() => handleSliceClick(a.data)}
                    onMouseMove={(e) => handleMouseMove(e, a.data)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <title>{`${a.data.label}: ${fmt(a.data.value)} (${percent.toFixed(1)}%)`}</title>
                  </path>
                  {showLabels && percent > 4 && (
                    <text
                      x={lx}
                      y={ly}
                      textAnchor="middle"
                      fontSize={11}
                      fill="#fff"
                      fontWeight={600}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {percent.toFixed(0)}%
                    </text>
                  )}
                </g>
              );
            })}

            {data.length === 0 && (
              <text textAnchor="middle" fontSize={14} fill="#aaa">
                No data available for this selection.
              </text>
            )}

            {/* Center total — only meaningful once there's an actual hole */}
            {showCenterTotal && innerRadiusPercent > 0 && data.length > 0 && (
              <g style={{ pointerEvents: 'none' }}>
                <text
                  textAnchor="middle"
                  dy="-0.3em"
                  fontSize={Math.max(12, radius * 0.16)}
                  fontWeight={700}
                  fill="#333"
                >
                  {fmt(total)}
                </text>
                <text
                  textAnchor="middle"
                  dy="1.2em"
                  fontSize={Math.max(10, radius * 0.09)}
                  fill="#888"
                >
                  {metricLabel}
                </text>
              </g>
            )}
          </g>
        </svg>

        {/* ── Legend ── */}
        {showLegend && (
          <div
            style={{
              width: LEGEND_WIDTH, overflowY: 'auto', padding: '8px', display: 'flex',
              flexDirection: 'column', gap: 6,
            }}
          >
            {data.map((d, idx) => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: colorFor(idx), flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.label} ({fmt(d.value)})
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Floating tooltip */}
        {showTooltip && tooltip.visible && (
          <div
            style={{
              position: 'absolute', left: tooltip.x, top: tooltip.y, background: 'rgba(0,0,0,0.78)',
              color: '#fff', padding: '6px 10px', borderRadius: 4, fontSize: 12, pointerEvents: 'none',
              whiteSpace: 'nowrap', zIndex: 999,
            }}
          >
            <strong>{tooltip.label}</strong>
            <br />
            {fmt(tooltip.value)} ({tooltip.percent.toFixed(1)}%)
            {canDrillFurther && <span style={{ color: '#adf', marginLeft: 8 }}>(click to drill down)</span>}
          </div>
        )}
      </div>
    </div>
  );
}

interface BreadcrumbItemProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

function BreadcrumbItem({ label, active, onClick }: BreadcrumbItemProps) {
  return (
    <span
      onClick={active ? undefined : onClick}
      style={{
        fontSize: 13, color: active ? '#333' : '#1890ff', cursor: active ? 'default' : 'pointer',
        fontWeight: active ? 600 : 400, padding: '2px 4px', borderRadius: 3,
        textDecoration: active ? 'none' : 'underline',
      }}
    >
      {label}
    </span>
  );
}

const backButtonStyle: React.CSSProperties = {
  marginLeft: 'auto', padding: '2px 10px', fontSize: 12, background: '#fff',
  border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer', color: '#555',
};
