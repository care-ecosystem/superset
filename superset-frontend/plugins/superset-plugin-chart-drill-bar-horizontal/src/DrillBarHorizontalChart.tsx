/**
 * src/DrillBarHorizontalChart.tsx
 *
 * Horizontal variant of the Drill-Down Bar Chart, styled as a "progress bar"
 * list: a light gray pill-shaped track spans the full row width, a colored
 * pill fills it proportionally to the value, and the value number sits in a
 * fixed-position column to the right of the track (not hugging the bar's
 * end) so all values line up in a column regardless of bar length. No
 * gridlines or X-axis ticks; the Y-axis renders as plain department labels
 * with no tick marks or axis line.
 */
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { scaleBand, scaleLinear } from 'd3-scale';
import { max } from 'd3-array';
import { axisLeft } from 'd3-axis';
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

const TOP_MARGIN = 20;
const RIGHT_MARGIN = 56; // room for the value-number column, right of the track
const BOTTOM_MARGIN = 12; // no X-axis, just a little breathing room
const MIN_LEFT_MARGIN = 80;
const MAX_LEFT_MARGIN = 220;

const BREADCRUMB_HEIGHT = 36;
const LEGEND_HEIGHT = 28;
const MIN_GROUP_HEIGHT = 40; // minimum px height per hierarchy label group

const TRACK_COLOR = '#eef0f3';

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

let measureCanvas: HTMLCanvasElement | null = null;
function measureTextWidth(text: string, fontSize: number, fontFamily = 'sans-serif'): number {
  if (typeof document === 'undefined') return text.length * fontSize * 0.6;
  if (!measureCanvas) measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) return text.length * fontSize * 0.6;
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx.measureText(text).width;
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
    xAxisFontSize,
    yAxisFontSize,
    legendFontSize,
    valueFontSize,
    barThickness,
    onDrillDown,
    onDrillUp,
  } = props;

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, groupLabel: '', metricLabel: '', value: 0,
  });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const maxYLabelWidth = useMemo(() => {
    if (!data.length) return 0;
    return Math.max(...data.map((d) => measureTextWidth(d.label, yAxisFontSize)));
  }, [data, yAxisFontSize]);

  const LABEL_GAP = 40;

  const leftMargin = Math.min(MAX_LEFT_MARGIN, Math.max(MIN_LEFT_MARGIN, Math.ceil(maxYLabelWidth) + LABEL_GAP));

  const MARGIN = { top: TOP_MARGIN, right: RIGHT_MARGIN, bottom: BOTTOM_MARGIN, left: leftMargin };

  const chartHeightAvailable = height - BREADCRUMB_HEIGHT - LEGEND_HEIGHT;

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);

  const availableHeight = Math.max(0, chartHeightAvailable - MARGIN.top - MARGIN.bottom);

  const groupHeight = Math.max(MIN_GROUP_HEIGHT, metricLabels.length * (barThickness + 6));

  const neededHeight = data.length * groupHeight;

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

  // Outer scale: one band per hierarchy label, running down the Y-axis
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
  // Value scale drives how far each bar fills into the track; the track
  // itself always spans the full innerWidth regardless of value.
  const xScale = scaleLinear()
    .domain([0, maxValue * 1.1])
    .range([0, innerWidth]);

  // Only the Y-axis renders now — plain labels, no tick marks or axis line.
  const yAxisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!yAxisRef.current) return;

    const yAxis = axisLeft(groupScale).tickSize(0);
    const sel = select(yAxisRef.current)
      .transition()
      .duration(animationDuration)
      .call(yAxis as any);

    sel.selectAll('text').style('font-size', `${yAxisFontSize}px`).attr('dx', '-8px');;
    // Hide the axis's own domain line — labels only, no ruler line.
    select(yAxisRef.current).select('.domain').style('display', 'none');
  }, [data, metricLabels, innerWidth, innerHeight, animationDuration, yAxisFontSize]);

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

  return (
    <div style={{ position: 'relative', width, height, fontFamily: 'sans-serif' }}>
      {/* ── Legend ── */}
      <div style={{ height: LEGEND_HEIGHT, display: 'flex', alignItems: 'center', gap: 16, padding: '0 8px' }}>
        {metricLabels.map((ml, idx) => (
          <div key={ml} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: metricColor(idx) }} />
            <span style={{ fontSize: legendFontSize, color: '#444' }}>{ml}</span>
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

      {/* ── SVG chart area ── */}
      <div ref={scrollContainerRef} style={{ position: 'relative', overflowY: 'auto', overflowX: 'hidden', height: chartHeightAvailable }}>
        <svg width={width} height={svgHeight} style={{ display: 'block' }}>
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {data.map((datum) => {
              const gy = groupScale(datum.label) ?? 0;
              return (
                <g key={datum.label} transform={`translate(0,${gy})`}>
                  {datum.values.map((mv, metricIdx) => {
                    const my = metricScale(mv.metricLabel) ?? 0;
                    const mh = Math.min(metricScale.bandwidth(), barThickness);
                    const trackY = my + (metricScale.bandwidth() - mh) / 2;
                    const barWidth = Math.max(0, xScale(mv.value));
                    const key = `${datum.label}::${mv.metricLabel}`;
                    const isHovered = hoveredKey === key;
                    const fill = isHovered ? metricColorHover(metricIdx) : metricColor(metricIdx);
                    const pillRadius = mh / 2;
                    const cornerRadius = 6;

                    return (
                      <g key={key}>
                        {/* Background track — always spans the full row width */}
                        <rect
                          x={0}
                          y={trackY}
                          width={innerWidth}
                          height={mh}
                          rx={cornerRadius}
                          ry={cornerRadius}
                          fill={TRACK_COLOR}
                        />
                        {/* Filled bar, proportional to value */}
                        <rect
                          x={0}
                          y={trackY}
                          width={barWidth}
                          height={mh}
                          rx={cornerRadius}
                          ry={cornerRadius}
                          fill={fill}
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
                        {/* Value number — fixed column just past the end of the track,
                            so every value lines up regardless of bar length. */}
                        {showLabels && (
                          <text
                            x={innerWidth + 8}
                            y={trackY + mh / 2 + valueFontSize / 3}
                            fontSize={valueFontSize}
                            fill="#333"
                            style={{ pointerEvents: 'none', userSelect: 'none' }}
                          >
                            {fmt(mv.value)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}

            {/* Y Axis — plain department labels, no tick marks or axis line */}
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
