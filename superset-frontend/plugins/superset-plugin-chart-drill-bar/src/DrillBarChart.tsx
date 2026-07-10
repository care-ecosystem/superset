// /**
//  * src/DrillBarChart.tsx
//  *
//  * The primary React component.  It owns:
//  *
//  *  1. Breadcrumb navigation bar — lets users jump back to any ancestor level.
//  *  2. SVG canvas rendered with D3 — scaleBand for the x-axis, scaleLinear for
//  *     the y-axis, animated <rect> elements for bars, <text> value labels, and
//  *     axis tick marks.
//  *  3. Tooltip — a floating <div> that follows the cursor and shows label/value.
//  *  4. Drill interaction — bar click calls props.onDrillDown; breadcrumb click
//  *     calls props.onDrillUp.
//  *
//  * D3 is used for scales and axes only; all DOM mutations happen through React
//  * state and refs so we avoid the "two owners" problem that arises when D3
//  * tries to manage DOM nodes that React also owns.
//  */
// // =======================================================================================================================================================
// import React, { useRef, useEffect, useState, useCallback } from 'react';
// import { scaleBand, scaleLinear } from 'd3-scale';
// import { max } from 'd3-array';
// import { axisBottom, axisLeft } from 'd3-axis';
// import { select } from 'd3-selection';
// import { format } from 'd3-format';
// import 'd3-transition';
// import { DrillBarChartProps, BarDatum } from './types';

// // ── Tooltip state ─────────────────────────────────────────────────────────────
// interface TooltipState {
//   visible: boolean;
//   x: number;
//   y: number;
//   label: string;
//   value: number;
// }

// // ── Margins (pixels) ──────────────────────────────────────────────────────────
// const MARGIN = { top: 40, right: 20, bottom: 80, left: 70 };
// const BREADCRUMB_HEIGHT = 36; // px reserved at top for breadcrumb bar

// export default function DrillBarChart(props: DrillBarChartProps) {
//   const {
//     width,
//     height,
//     data,
//     hierarchyColumns,
//     currentDepth,
//     drillPath,
//     barColor,
//     barColorHover,
//     showLabels,
//     showTooltip,
//     animationDuration,
//     onDrillDown,
//     onDrillUp,
//   } = props;

//   const svgRef = useRef<SVGSVGElement>(null);
//   const [tooltip, setTooltip] = useState<TooltipState>({
//     visible: false,
//     x: 0,
//     y: 0,
//     label: '',
//     value: 0,
//   });
//   const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

//   // Derived sizes
//   const chartHeight = height - BREADCRUMB_HEIGHT;
//   const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
//   const innerHeight = Math.max(0, chartHeight - MARGIN.top - MARGIN.bottom);

//   // D3 scales — recalculated whenever data or dimensions change
//   const xScale = scaleBand()
//     .domain(data.map((d) => d.label))
//     .range([0, innerWidth])
//     .padding(0.25);

//   const maxValue = max(data, (d) => d.value) ?? 0;
//   const yScale = scaleLinear()
//     .domain([0, maxValue * 1.1]) // 10 % headroom so the tallest bar isn't flush
//     .nice()
//     .range([innerHeight, 0]);

//   // ── Draw / update axes via D3 (these modify DOM nodes owned by refs, not React) ─
//   const xAxisRef = useRef<SVGGElement>(null);
//   const yAxisRef = useRef<SVGGElement>(null);

//   useEffect(() => {
//     if (!xAxisRef.current || !yAxisRef.current) return;

//     // X axis
//     const xAxis = axisBottom(xScale).tickSizeOuter(0);
//     select(xAxisRef.current)
//       .transition()
//       .duration(animationDuration)
//       .call(xAxis as any)
//       .selectAll('text')
//       .style('text-anchor', 'end')
//       .attr('dx', '-0.5em')
//       .attr('dy', '0.15em')
//       .attr('transform', 'rotate(-35)')
//       .style('font-size', '12px');

//     // Y axis
//     const yAxis = axisLeft(yScale).ticks(6).tickSizeOuter(0);
//     select(yAxisRef.current)
//       .transition()
//       .duration(animationDuration)
//       .call(yAxis as any)
//       .selectAll('text')
//       .style('font-size', '12px');
//   }, [data, innerWidth, innerHeight, animationDuration]);

//   // ── Tooltip handlers ───────────────────────────────────────────────────────
//   const handleMouseMove = useCallback(
//     (e: React.MouseEvent<SVGRectElement>, datum: BarDatum) => {
//       if (!showTooltip) return;
//       const rect = (e.currentTarget as SVGRectElement)
//         .closest('svg')!
//         .getBoundingClientRect();
//       setTooltip({
//         visible: true,
//         x: e.clientX - rect.left + 12,
//         y: e.clientY - rect.top - 28,
//         label: datum.label,
//         value: datum.value,
//       });
//       setHoveredLabel(datum.label);
//     },
//     [showTooltip],
//   );

//   const handleMouseLeave = useCallback(() => {
//     setTooltip((t) => ({ ...t, visible: false }));
//     setHoveredLabel(null);
//   }, []);

//   const handleBarClick = useCallback(
//     (datum: BarDatum) => {
//       if (currentDepth < hierarchyColumns.length - 1) {
//         onDrillDown(datum);
//       }
//     },
//     [currentDepth, hierarchyColumns, onDrillDown],
//   );

//   // Label formatter
//   const fmt = format(',.0f');

//   const canDrillFurther = currentDepth < hierarchyColumns.length - 1;
// // ======================================================================================================================================================
// // import React, { useRef, useEffect, useState, useCallback } from 'react';
// // // import * as d3 from 'd3';
// // import { scaleBand, scaleLinear } from 'd3-scale';
// // import { max, format } from 'd3-array';
// // import { axisBottom, axisLeft } from 'd3-axis';
// // import { select } from 'd3-selection';

// // import { DrillBarChartProps, BarDatum } from './types';

// // // ── Tooltip state ─────────────────────────────────────────────────────────────
// // interface TooltipState {
// //   visible: boolean;
// //   x: number;
// //   y: number;
// //   label: string;
// //   value: number;
// // }

// // // ── Margins (pixels) ──────────────────────────────────────────────────────────
// // const MARGIN = { top: 40, right: 20, bottom: 80, left: 70 };
// // const BREADCRUMB_HEIGHT = 36; // px reserved at top for breadcrumb bar

// // export default function DrillBarChart(props: DrillBarChartProps) {
// //   const {
// //     width,
// //     height,
// //     data,
// //     hierarchyColumns,
// //     currentDepth,
// //     drillPath,
// //     barColor,
// //     barColorHover,
// //     showLabels,
// //     showTooltip,
// //     animationDuration,
// //     onDrillDown,
// //     onDrillUp,
// //   } = props;

// //   const svgRef = useRef<SVGSVGElement>(null);
// //   const [tooltip, setTooltip] = useState<TooltipState>({
// //     visible: false,
// //     x: 0,
// //     y: 0,
// //     label: '',
// //     value: 0,
// //   });
// //   const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

// //   // Derived sizes
// //   const chartHeight = height - BREADCRUMB_HEIGHT;
// //   const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
// //   const innerHeight = Math.max(0, chartHeight - MARGIN.top - MARGIN.bottom);

// //   // D3 scales — recalculated whenever data or dimensions change
// //   const xScale = d3
// //     .scaleBand()
// //     .domain(data.map((d) => d.label))
// //     .range([0, innerWidth])
// //     .padding(0.25);

// //   const maxValue = d3.max(data, (d) => d.value) ?? 0;
// //   const yScale = d3
// //     .scaleLinear()
// //     .domain([0, maxValue * 1.1]) // 10 % headroom so the tallest bar isn't flush
// //     .nice()
// //     .range([innerHeight, 0]);

// //   // ── Draw / update axes via D3 (these modify DOM nodes owned by refs, not React) ─
// //   const xAxisRef = useRef<SVGGElement>(null);
// //   const yAxisRef = useRef<SVGGElement>(null);

// //   useEffect(() => {
// //     if (!xAxisRef.current || !yAxisRef.current) return;

// //     // X axis
// //     const xAxis = d3.axisBottom(xScale).tickSizeOuter(0);
// //     d3.select(xAxisRef.current)
// //       .transition()
// //       .duration(animationDuration)
// //       .call(xAxis as any)
// //       .selectAll('text')
// //       .style('text-anchor', 'end')
// //       .attr('dx', '-0.5em')
// //       .attr('dy', '0.15em')
// //       .attr('transform', 'rotate(-35)')
// //       .style('font-size', '12px');

// //     // Y axis
// //     const yAxis = d3.axisLeft(yScale).ticks(6).tickSizeOuter(0);
// //     d3.select(yAxisRef.current)
// //       .transition()
// //       .duration(animationDuration)
// //       .call(yAxis as any)
// //       .selectAll('text')
// //       .style('font-size', '12px');
// //   }, [data, innerWidth, innerHeight, animationDuration]);

// //   // ── Tooltip handlers ───────────────────────────────────────────────────────
// //   const handleMouseMove = useCallback(
// //     (e: React.MouseEvent<SVGRectElement>, datum: BarDatum) => {
// //       if (!showTooltip) return;
// //       const rect = (e.currentTarget as SVGRectElement)
// //         .closest('svg')!
// //         .getBoundingClientRect();
// //       setTooltip({
// //         visible: true,
// //         x: e.clientX - rect.left + 12,
// //         y: e.clientY - rect.top - 28,
// //         label: datum.label,
// //         value: datum.value,
// //       });
// //       setHoveredLabel(datum.label);
// //     },
// //     [showTooltip],
// //   );

// //   const handleMouseLeave = useCallback(() => {
// //     setTooltip((t) => ({ ...t, visible: false }));
// //     setHoveredLabel(null);
// //   }, []);

// //   const handleBarClick = useCallback(
// //     (datum: BarDatum) => {
// //       if (currentDepth < hierarchyColumns.length - 1) {
// //         onDrillDown(datum);
// //       }
// //     },
// //     [currentDepth, hierarchyColumns, onDrillDown],
// //   );

// //   // Label formatter
// //   const fmt = d3.format(',.0f');

// //   const canDrillFurther = currentDepth < hierarchyColumns.length - 1;

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <div style={{ position: 'relative', width, height, fontFamily: 'sans-serif' }}>
//       {/* ── Breadcrumb navigation ── */}
//       <div
//         style={{
//           height: BREADCRUMB_HEIGHT,
//           display: 'flex',
//           alignItems: 'center',
//           padding: '0 8px',
//           background: '#f7f7f7',
//           borderBottom: '1px solid #e0e0e0',
//           overflowX: 'auto',
//           whiteSpace: 'nowrap',
//           flexShrink: 0,
//         }}
//       >
//         {/* Root crumb */}
//         <BreadcrumbItem
//           label={hierarchyColumns[0] ?? 'Root'}
//           active={drillPath.length === 0}
//           onClick={() => onDrillUp(0)}
//         />
//         {drillPath.map((step, idx) => (
//           <React.Fragment key={idx}>
//             <span style={{ margin: '0 4px', color: '#999' }}>›</span>
//             <BreadcrumbItem
//               label={`${step.column}: ${step.label}`}
//               active={idx === drillPath.length - 1}
//               onClick={() => onDrillUp(idx + 1)}
//             />
//           </React.Fragment>
//         ))}
//         {drillPath.length > 0 && (
//           <button
//             onClick={() => onDrillUp(Math.max(0, currentDepth - 1))}
//             style={backButtonStyle}
//             title="Go back one level"
//           >
//             ← Back
//           </button>
//         )}
//       </div>

//       {/* ── SVG chart area ── */}
//       <div style={{ position: 'relative' }}>
//         <svg
//           ref={svgRef}
//           width={width}
//           height={chartHeight}
//           style={{ overflow: 'visible' }}
//         >
//           <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
//             {/* Grid lines */}
//             {yScale.ticks(6).map((tick) => (
//               <line
//                 key={tick}
//                 x1={0}
//                 x2={innerWidth}
//                 y1={yScale(tick)}
//                 y2={yScale(tick)}
//                 stroke="#e8e8e8"
//                 strokeDasharray="4 2"
//               />
//             ))}

//             {/* Bars */}
//             {data.map((datum) => {
//               const bx = xScale(datum.label) ?? 0;
//               const bw = xScale.bandwidth();
//               const bh = innerHeight - yScale(datum.value);
//               const by = yScale(datum.value);
//               const isHovered = hoveredLabel === datum.label;
//               const fill = isHovered ? barColorHover : barColor;

//               return (
//                 <g key={datum.label}>
//                   <rect
//                     x={bx}
//                     y={by}
//                     width={bw}
//                     height={Math.max(0, bh)}
//                     fill={fill}
//                     rx={3}
//                     ry={3}
//                     style={{
//                       cursor: canDrillFurther ? 'pointer' : 'default',
//                       transition: `y ${animationDuration}ms ease, height ${animationDuration}ms ease, fill 120ms`,
//                     }}
//                     onClick={() => handleBarClick(datum)}
//                     onMouseMove={(e) => handleMouseMove(e, datum)}
//                     onMouseLeave={handleMouseLeave}
//                   >
//                     <title>{`${datum.label}: ${fmt(datum.value)}`}</title>
//                   </rect>

//                   {/* Value label on top of bar */}
//                   {showLabels && bh > 16 && (
//                     <text
//                       x={bx + bw / 2}
//                       y={by - 5}
//                       textAnchor="middle"
//                       fontSize={11}
//                       fill="#444"
//                       style={{ pointerEvents: 'none', userSelect: 'none' }}
//                     >
//                       {fmt(datum.value)}
//                     </text>
//                   )}

//                   {/* Drill indicator arrow */}
//                   {canDrillFurther && isHovered && (
//                     <text
//                       x={bx + bw / 2}
//                       y={by + Math.max(0, bh) / 2 + 5}
//                       textAnchor="middle"
//                       fontSize={18}
//                       fill="rgba(255,255,255,0.85)"
//                       style={{ pointerEvents: 'none', userSelect: 'none' }}
//                     >
//                       ▼
//                     </text>
//                   )}
//                 </g>
//               );
//             })}

//             {/* X Axis */}
//             <g
//               ref={xAxisRef}
//               transform={`translate(0,${innerHeight})`}
//             />

//             {/* Y Axis */}
//             <g ref={yAxisRef} />

//             {/* Y Axis label */}
//             <text
//               transform={`rotate(-90) translate(${-innerHeight / 2}, ${-MARGIN.left + 14})`}
//               textAnchor="middle"
//               fontSize={12}
//               fill="#666"
//             >
//               Value
//             </text>

//             {/* Chart title showing current level */}
//             <text
//               x={innerWidth / 2}
//               y={-MARGIN.top / 2}
//               textAnchor="middle"
//               fontSize={14}
//               fontWeight="600"
//               fill="#333"
//             >
//               {drillPath.length === 0
//                 ? `By ${hierarchyColumns[0] ?? ''}`
//                 : `${hierarchyColumns[currentDepth] ?? ''} within "${drillPath[drillPath.length - 1].label}"`}
//             </text>

//             {/* Empty state */}
//             {data.length === 0 && (
//               <text
//                 x={innerWidth / 2}
//                 y={innerHeight / 2}
//                 textAnchor="middle"
//                 fontSize={14}
//                 fill="#aaa"
//               >
//                 No data available for this selection.
//               </text>
//             )}
//           </g>
//         </svg>

//         {/* Floating tooltip */}
//         {showTooltip && tooltip.visible && (
//           <div
//             style={{
//               position: 'absolute',
//               left: tooltip.x,
//               top: tooltip.y,
//               background: 'rgba(0,0,0,0.78)',
//               color: '#fff',
//               padding: '6px 10px',
//               borderRadius: 4,
//               fontSize: 12,
//               pointerEvents: 'none',
//               whiteSpace: 'nowrap',
//               zIndex: 999,
//             }}
//           >
//             <strong>{tooltip.label}</strong>
//             <br />
//             {fmt(tooltip.value)}
//             {canDrillFurther && (
//               <span style={{ color: '#adf', marginLeft: 8 }}>
//                 (click to drill down)
//               </span>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ── Small helper components ───────────────────────────────────────────────────

// interface BreadcrumbItemProps {
//   label: string;
//   active: boolean;
//   onClick: () => void;
// }

// function BreadcrumbItem({ label, active, onClick }: BreadcrumbItemProps) {
//   return (
//     <span
//       onClick={active ? undefined : onClick}
//       style={{
//         fontSize: 13,
//         color: active ? '#333' : '#1890ff',
//         cursor: active ? 'default' : 'pointer',
//         fontWeight: active ? 600 : 400,
//         padding: '2px 4px',
//         borderRadius: 3,
//         textDecoration: active ? 'none' : 'underline',
//       }}
//     >
//       {label}
//     </span>
//   );
// }

// const backButtonStyle: React.CSSProperties = {
//   marginLeft: 'auto',
//   padding: '2px 10px',
//   fontSize: 12,
//   background: '#fff',
//   border: '1px solid #d9d9d9',
//   borderRadius: 4,
//   cursor: 'pointer',
//   color: '#555',
// };


/**
 * src/DrillBarChart.tsx
 *
 * The primary React component.  It owns:
 *
 *  1. Legend — one swatch per metric.
 *  2. Breadcrumb navigation bar — lets users jump back to any ancestor level.
 *  3. SVG canvas rendered with D3 — an outer scaleBand for hierarchy labels
 *     (e.g. Jan, Feb, Mar), an inner scaleBand for metrics within each label
 *     group (clustered/grouped bars), and scaleLinear for the y-axis.
 *  4. Tooltip — a floating <div> that follows the cursor and shows label/value.
 *  5. Drill interaction — clicking ANY bar in a group drills the whole label
 *     (all metrics carry through to the next level); breadcrumb click calls
 *     props.onDrillUp.
 *
 * D3 is used for scales and axes only; all DOM mutations happen through React
 * state and refs so we avoid the "two owners" problem that arises when D3
 * tries to manage DOM nodes that React also owns.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { scaleBand, scaleLinear, scaleOrdinal } from 'd3-scale';
import { max } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { select } from 'd3-selection';
import { format } from 'd3-format';
import 'd3-transition';
import { DrillBarChartProps, BarDatum, MetricValue } from './types';

// ── Tooltip state ─────────────────────────────────────────────────────────────
interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  groupLabel: string;
  metricLabel: string;
  value: number;
}

// ── Margins (pixels) ──────────────────────────────────────────────────────────
const MARGIN = { top: 40, right: 20, bottom: 80, left: 70 };
const BREADCRUMB_HEIGHT = 36; // px reserved at top for breadcrumb bar
const LEGEND_HEIGHT = 28; // px reserved at top for legend row

// Default qualitative palette, used to colour metrics beyond the first
// (metric 0 uses the barColor / barColorHover controls so users keep the
// colour-picker they already know).
const PALETTE = [
  '#4682DC', // matches default barColor
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

export default function DrillBarChart(props: DrillBarChartProps) {
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

  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    groupLabel: '',
    metricLabel: '',
    value: 0,
  });
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Derived sizes
  const chartHeight = height - BREADCRUMB_HEIGHT - LEGEND_HEIGHT;
  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = Math.max(0, chartHeight - MARGIN.top - MARGIN.bottom);

  // ── Colour per metric ─────────────────────────────────────────────────────
  // Metric 0 uses the user's barColor/barColorHover controls; any further
  // metrics fall back to the generated palette so multiple series stay
  // visually distinct without requiring a colour picker per metric.
  const metricColor = useCallback(
    (metricIndex: number) =>
      metricIndex === 0 ? barColor : paletteColor(metricIndex),
    [barColor],
  );
  const metricColorHover = useCallback(
    (metricIndex: number) =>
      metricIndex === 0 ? barColorHover : paletteColor(metricIndex),
    [barColorHover],
  );

  // ── D3 scales ─────────────────────────────────────────────────────────────
  // Outer scale: one band per hierarchy label (e.g. Jan, Feb, Mar...)
  const groupScale = scaleBand()
    .domain(data.map((d) => d.label))
    .range([0, innerWidth])
    .padding(0.2);

  // Inner scale: one band per metric, nested within each outer band
  const metricScale = scaleBand()
    .domain(metricLabels)
    .range([0, groupScale.bandwidth()])
    .padding(0.15);

  const maxValue =
    max(data.flatMap((d) => d.values.map((v) => v.value))) ?? 0;
  const yScale = scaleLinear()
    .domain([0, maxValue * 1.1]) // 10 % headroom so the tallest bar isn't flush
    .nice()
    .range([innerHeight, 0]);

  // ── Draw / update axes via D3 (these modify DOM nodes owned by refs, not React) ─
  const xAxisRef = useRef<SVGGElement>(null);
  const yAxisRef = useRef<SVGGElement>(null);

  useEffect(() => {
    if (!xAxisRef.current || !yAxisRef.current) return;

    // X axis (one tick per hierarchy label, not per individual bar)
    const xAxis = axisBottom(groupScale).tickSizeOuter(0);
    select(xAxisRef.current)
      .transition()
      .duration(animationDuration)
      .call(xAxis as any)
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.15em')
      .attr('transform', 'rotate(-35)')
      .style('font-size', '12px');

    // Y axis
    const yAxis = axisLeft(yScale).ticks(6).tickSizeOuter(0);
    select(yAxisRef.current)
      .transition()
      .duration(animationDuration)
      .call(yAxis as any)
      .selectAll('text')
      .style('font-size', '12px');
  }, [data, metricLabels, innerWidth, innerHeight, animationDuration]);

  // ── Tooltip handlers ───────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGRectElement>, groupLabel: string, mv: MetricValue) => {
      if (!showTooltip) return;
      const rect = (e.currentTarget as SVGRectElement)
        .closest('svg')!
        .getBoundingClientRect();
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
      // Clicking ANY metric's bar within a group drills the whole label —
      // all metrics carry through to the next hierarchy level together.
      if (currentDepth < hierarchyColumns.length - 1) {
        onDrillDown(datum);
      }
    },
    [currentDepth, hierarchyColumns, onDrillDown],
  );

  // Label formatter
  const fmt = format(',.0f');

  const canDrillFurther = currentDepth < hierarchyColumns.length - 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width, height, fontFamily: 'sans-serif' }}>
      {/* ── Legend ── */}
      <div
        style={{
          height: LEGEND_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 8px',
          flexShrink: 0,
        }}
      >
        {metricLabels.map((ml, idx) => (
          <div key={ml} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                background: metricColor(idx),
              }}
            />
            <span style={{ fontSize: 12, color: '#444' }}>{ml}</span>
          </div>
        ))}
      </div>

      {/* ── Breadcrumb navigation ── */}
      <div
        style={{
          height: BREADCRUMB_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          padding: '0 8px',
          background: '#f7f7f7',
          borderBottom: '1px solid #e0e0e0',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {/* Root crumb */}
        <BreadcrumbItem
          label={hierarchyColumns[0] ?? 'Root'}
          active={drillPath.length === 0}
          onClick={() => onDrillUp(0)}
        />
        {drillPath.map((step, idx) => (
          <React.Fragment key={idx}>
            <span style={{ margin: '0 4px', color: '#999' }}>›</span>
            <BreadcrumbItem
              label={`${step.column}: ${step.label}`}
              active={idx === drillPath.length - 1}
              onClick={() => onDrillUp(idx + 1)}
            />
          </React.Fragment>
        ))}
        {drillPath.length > 0 && (
          <button
            onClick={() => onDrillUp(Math.max(0, currentDepth - 1))}
            style={backButtonStyle}
            title="Go back one level"
          >
            ← Back
          </button>
        )}
      </div>

      {/* ── SVG chart area ── */}
      <div style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          width={width}
          height={chartHeight}
          style={{ overflow: 'visible' }}
        >
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {/* Grid lines */}
            {yScale.ticks(6).map((tick) => (
              <line
                key={tick}
                x1={0}
                x2={innerWidth}
                y1={yScale(tick)}
                y2={yScale(tick)}
                stroke="#e8e8e8"
                strokeDasharray="4 2"
              />
            ))}

            {/* Bar groups — one group per hierarchy label, one bar per metric */}
            {data.map((datum) => {
              const gx = groupScale(datum.label) ?? 0;

              return (
                <g key={datum.label} transform={`translate(${gx},0)`}>
                  {datum.values.map((mv, metricIdx) => {
                    const mx = metricScale(mv.metricLabel) ?? 0;
                    const mw = metricScale.bandwidth();
                    const mh = innerHeight - yScale(mv.value);
                    const my = yScale(mv.value);
                    const key = `${datum.label}::${mv.metricLabel}`;
                    const isHovered = hoveredKey === key;
                    const fill = isHovered
                      ? metricColorHover(metricIdx)
                      : metricColor(metricIdx);

                    return (
                      <g key={key}>
                        <rect
                          x={mx}
                          y={my}
                          width={mw}
                          height={Math.max(0, mh)}
                          fill={fill}
                          rx={3}
                          ry={3}
                          style={{
                            cursor: canDrillFurther ? 'pointer' : 'default',
                            transition: `y ${animationDuration}ms ease, height ${animationDuration}ms ease, fill 120ms`,
                          }}
                          onClick={() => handleBarClick(datum)}
                          onMouseMove={(e) => handleMouseMove(e, datum.label, mv)}
                          onMouseLeave={handleMouseLeave}
                        >
                          <title>{`${datum.label} — ${mv.metricLabel}: ${fmt(mv.value)}`}</title>
                        </rect>

                        {/* Value label on top of bar */}
                        {showLabels && mh > 16 && (
                          <text
                            x={mx + mw / 2}
                            y={my - 5}
                            textAnchor="middle"
                            fontSize={11}
                            fill={fill}
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

            {/* X Axis */}
            <g
              ref={xAxisRef}
              transform={`translate(0,${innerHeight})`}
            />

            {/* Y Axis */}
            <g ref={yAxisRef} />

            {/* Y Axis label */}
            <text
              transform={`rotate(-90) translate(${-innerHeight / 2}, ${-MARGIN.left + 14})`}
              textAnchor="middle"
              fontSize={12}
              fill="#666"
            >
              Value
            </text>

            {/* Chart title showing current level */}
            <text
              x={innerWidth / 2}
              y={-MARGIN.top / 2}
              textAnchor="middle"
              fontSize={14}
              fontWeight="600"
              fill="#333"
            >
              {drillPath.length === 0
                ? `By ${hierarchyColumns[0] ?? ''}`
                : `${hierarchyColumns[currentDepth] ?? ''} within "${drillPath[drillPath.length - 1].label}"`}
            </text>

            {/* Empty state */}
            {data.length === 0 && (
              <text
                x={innerWidth / 2}
                y={innerHeight / 2}
                textAnchor="middle"
                fontSize={14}
                fill="#aaa"
              >
                No data available for this selection.
              </text>
            )}
          </g>
        </svg>

        {/* Floating tooltip */}
        {showTooltip && tooltip.visible && (
          <div
            style={{
              position: 'absolute',
              left: tooltip.x,
              top: tooltip.y,
              background: 'rgba(0,0,0,0.78)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: 4,
              fontSize: 12,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
              zIndex: 999,
            }}
          >
            <strong>{tooltip.groupLabel}</strong> — {tooltip.metricLabel}
            <br />
            {fmt(tooltip.value)}
            {canDrillFurther && (
              <span style={{ color: '#adf', marginLeft: 8 }}>
                (click to drill down)
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

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
        fontSize: 13,
        color: active ? '#333' : '#1890ff',
        cursor: active ? 'default' : 'pointer',
        fontWeight: active ? 600 : 400,
        padding: '2px 4px',
        borderRadius: 3,
        textDecoration: active ? 'none' : 'underline',
      }}
    >
      {label}
    </span>
  );
}

const backButtonStyle: React.CSSProperties = {
  marginLeft: 'auto',
  padding: '2px 10px',
  fontSize: 12,
  background: '#fff',
  border: '1px solid #d9d9d9',
  borderRadius: 4,
  cursor: 'pointer',
  color: '#555',
};
