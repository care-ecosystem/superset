/**
 * src/DrillBarHorizontalChart.tsx
 *
 * Horizontal variant of the Drill-Down Bar Chart. Structurally identical to
 * the vertical version except the two scales swap roles:
 *   - groupScale (hierarchy labels) runs down the Y-axis, not across X
 *   - value scale (scaleLinear) runs across the X-axis, not up Y
 * Bars grow rightward from x=0 instead of upward from the bottom.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { format } from 'd3-format';
import 'd3-transition';
import { DrillBarChartProps, BarDatum, MetricValue } from './types';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  groupLabel: string;
  metricLabel: string;
  value: number;
}

const MARGIN = { top: 20, right: 40, bottom: 40, left: 140 };
const BREADCRUMB_HEIGHT = 36;
const LEGEND_HEIGHT = 28;
const MIN_GROUP_HEIGHT = 40; // minimum px height per hierarchy label group

const PALETTE = [
  '#4682DC',
  '#2E9E8F',
  '#E0954E',
  '#9B6BC7',
  '#D4587A',
  '#5FA83D',
  '#C7A93E',
  '#4E9BC7',
];

function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

export default function DrillBarHorizontalChart(props: DrillBarChartProps) {
  const {
    width,
    height,
    data,
    hierarchyColumns,
    metricLabels,
    currentDepth,
    drillPath,
    barColor,
    barColorHover,
    showLabels,
    showTooltip,
    animationDuration,
    onDrillDown,
    onDrillUp,
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollByAmount = useCallback((amount: number) => {
    scrollContainerRef.current?.scrollBy({ top: amount, behavior: 'smooth' });
  }, []);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, groupLabel: '', metricLabel: '', value: 0,
  });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const chartHeightAvailable = height - BREADCRUMB_HEIGHT - LEGEND_HEIGHT;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const availableHeight = Math.max(0, chartHeightAvailable - MARGIN.top - MARGIN.bottom);
  const neededHeight = data.length * MIN_GROUP_HEIGHT;
  const innerHeight = Math.max(availableHeight, neededHeight);
  const svgHeight = innerHeight + MARGIN.top + MARGIN.bottom;

  const metricColor = useCallback(
    (i: number) => (i === 0 ? barColor : paletteColor(i)),
    [barColor],
  );
  const metricColorHover = useCallback(
    (i: number) => (i === 0 ? barColorHover : paletteColor(i)),
    [barColorHover],
  );

  // Outer scale: one band per hierarchy label, now running down the Y-axis
  const groupScale = scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, innerHeight])
    .padding(0.2);

  // Inner scale: one band per metric, nested within each outer band
  const metricScale = scaleBand()
    .domain(metricLabels)
    .range([0, groupScale.bandwidth()])
    .padding(0.15);

  const maxValue = max(data.flatMap((d) => d.values.map((v) => v.value))) ?? 0;
  // Value scale now runs left-to-right across the X-axis
  const xScale = scaleLinear()
    .domain([0, maxValue * 1.1])
    .nice()
    .range([0, innerWidth]);

  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!xAxisRef.current || !yAxisRef.current) return;

    const xAxis = axisBottom(xScale).ticks(6).tickSizeOuter(0);
    select(xAxisRef.current)
      .transition()
      .duration(animationDuration)
      .call(xAxis as any)
      .selectAll('text')
      .style('font-size', '12px');

    const yAxis = axisLeft(groupScale).tickSizeOuter(0);
    select(yAxisRef.current)
      .transition()
      .duration(animationDuration)
      .call(yAxis as any)
      .selectAll('text')
      .style('font-size', '12px');
  }, [data, metricLabels, innerWidth, innerHeight, animationDuration]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>, groupLabel: string, mv: MetricValue) => {
      if (!showTooltip) return;
      const rect = (e.currentTarget as SVGRectElement).closest('svg')!.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: e.clientX - rect.left + 12,
        y: e.clientY - rect.top - 28,
        groupLabel,
        metricLabel: mv.metricLabel,
        value: mv.value,
      });
      setHoveredKey(`${groupLabel}::${mv.metricLabel}`);
    },
    [showTooltip],
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
    setHoveredKey(null);
  }, []);

  const handleBarClick = useCallback(
    (datum: BarDatum) => {
      if (currentDepth < hierarchyColumns.length - 1) onDrillDown(datum);
    },
    [currentDepth, hierarchyColumns, onDrillDown],
  );

  const fmt = format(',.0f');
  const canDrillFurther = currentDepth < hierarchyColumns.length - 1;
  const needsScroll = data.length * MIN_GROUP_HEIGHT > chartHeightAvailable;

  return (
    <div style={{ position: 'relative', width, height, fontFamily: 'sans-serif' }}>
      {/* ── Legend ── */}
      <div style={{ height: LEGEND_HEIGHT, display: 'flex', alignItems: 'center', gap: 16, padding: '0 8px' }}>
        {metricLabels.map((ml, idx) => (
          <div key={ml} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: metricColor(idx) }} />
            <span style={{ fontSize: 12, color: '#444' }}>{ml}</span>
          </div>
        ))}
      </div>

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

      {/* ── Scroll controls (vertical, since labels stack down the Y-axis) ── */}
      {needsScroll && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, padding: '4px 8px' }}>
          <button onClick={() => scrollByAmount(-300)} style={scrollButtonStyle}>▲ Prev</button>
          <button onClick={() => scrollByAmount(300)} style={scrollButtonStyle}>▼ Next</button>
        </div>
      )}

      {/* ── SVG chart area ── */}
      <div ref={scrollContainerRef} style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: chartHeightAvailable }}>
        <svg width={width} height={svgHeight} style={{ display: 'block' }}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {xScale.ticks(6).map((tick) => (
              <line key={tick} x1={xScale(tick)} x2={xScale(tick)} y1={0} y2={innerHeight} stroke="#e8e8e8" strokeDasharray="4 2" />
            ))}

            {data.map((datum) => {
              const gy = groupScale(datum.label) ?? 0;
              return (
                <g key={datum.label} transform={`translate(0,${gy})`}>
                  {datum.values.map((mv, metricIdx) => {
                    const my = metricScale(mv.metricLabel) ?? 0;
                    const mh = metricScale.bandwidth();
                    const mw = xScale(mv.value);
                    const key = `${datum.label}::${mv.metricLabel}`;
                    const isHovered = hoveredKey === key;
                    const fill = isHovered ? metricColorHover(metricIdx) : metricColor(metricIdx);

                    return (
                      <g key={key}>
                        <rect
                          x={0}
                          y={my}
                          width={Math.max(0, mw)}
                          height={mh}
                          fill={fill}
                          rx={3}
                          ry={3}
                          style={{
                            cursor: canDrillFurther ? 'pointer' : 'default',
                            transition: `width ${animationDuration}ms ease, fill 120ms`,
                          }}
                          onClick={() => handleBarClick(datum)}
                          onMouseMove={(e) => handleMouseMove(e, datum.label, mv)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <title>{`${datum.label} — ${mv.metricLabel}: ${fmt(mv.value)}`}</title>
                        </rect>
                        {showLabels && mw > 24 && (
                          <text x={mw + 5} y={my + mh / 2 + 4} fontSize={11} fill="#444" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                            {fmt(mv.value)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            <g ref={xAxisRef} transform={`translate(0,${innerHeight})`} />
            <g ref={yAxisRef} />

            {data.length === 0 && (
              <text x={innerWidth / 2} y={innerHeight / 2} textAnchor="middle" fontSize={14} fill="#aaa">
                No data available for this selection.
              </text>
            )}
          </g>
        </svg>

        {showTooltip && tooltip.visible && (
          <div
            style={{
              position: 'absolute', left: tooltip.x, top: tooltip.y, background: 'rgba(0,0,0,0.78)',
              color: '#fff', padding: '6px 10px', borderRadius: 4, fontSize: 12, pointerEvents: 'none',
              whiteSpace: 'nowrap', zIndex: 999,
            }}
          >
            <strong>{tooltip.groupLabel}</strong> — {tooltip.metricLabel}
            <br />
            {fmt(tooltip.value)}
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

const scrollButtonStyle: React.CSSProperties = {
  padding: '2px 10px', fontSize: 12, background: '#fff', border: '1px solid #d9d9d9',
  borderRadius: 4, cursor: 'pointer', color: '#555',
};
