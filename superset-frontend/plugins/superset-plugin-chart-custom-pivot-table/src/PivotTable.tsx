/**
 * src/PivotTable.tsx
 *
 * Plain HTML table renderer — no D3 needed, this is pure row/column
 * layout. Consumes the pre-computed header/body structure from
 * transformProps.ts and applies styling (fonts, per-metric colors, row
 * height) at render time.
 */
import React from 'react';
import {
  PivotTableProps,
  TextStyle,
  MetricColorMap,
  HeaderCell,
  DEFAULT_METRIC_COLOR,
} from './types';

const FONT_STACK = '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif';
const ROW_LABEL_FONT = 'Georgia, "Times New Roman", serif';
const GROUP_ACCENTS = ['#3b82f6', '#14b8a6', '#f59e0b', '#8b5cf6', '#ef4444', '#22c55e'];
const GROUP_DIVIDER = '2px solid #cbd5e1';
const ROW_DIVIDER = '1px solid #eef0f3';

const fmt = (v: number | null): string => (v == null ? '' : v.toLocaleString());

function textStyleCSS(s: TextStyle): React.CSSProperties {
  return {
    fontSize: s.fontSize,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? 'italic' : 'normal',
    textAlign: s.align,
  };
}

function metricColor(metricColors: MetricColorMap, metric: string) {
  return metricColors[metric] ?? DEFAULT_METRIC_COLOR;
}

export default function PivotTable(props: PivotTableProps) {
  const {
    width,
    height,
    rowDimLabels,
    applyMetricsOn,
    columnLeaves,
    columnHeaderRows,
    bodyRows,
    grandTotalRow,
    columnGrandTotals,
    rowHeight,
    metricsStyle,
    columnsStyle,
    rowsStyle,
    metricColors,
    metricHeaderLevel,
  } = props;

  const rowHeaderLevels = rowDimLabels.length + (applyMetricsOn === 'rows' ? 1 : 0);
  const cornerLabels = applyMetricsOn === 'rows' ? [...rowDimLabels, 'Metric'] : rowDimLabels;
  const headerRowsToRender: HeaderCell[][] = columnHeaderRows.length ? columnHeaderRows : [[]];

  // Work out which column-group each leaf column belongs to, based on the
  // outermost header row, so we can draw dividers between groups.
  const leafGroupIndex: number[] = [];
  const leafIsGroupStart: boolean[] = [];
  let leafCursor = 0;
  (columnHeaderRows[0] ?? []).forEach((cell, gi) => {
    for (let k = 0; k < cell.span; k += 1) {
      leafGroupIndex[leafCursor] = gi;
      leafIsGroupStart[leafCursor] = k === 0;
      leafCursor += 1;
    }
  });

  const baseHeader: React.CSSProperties = {
    padding: '10px 10px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textAlign: 'center',
    verticalAlign: 'middle',
    borderBottom: '1px solid #e5e7eb',
  };

  return (
    <div
      style={{
        width,
        height,
        overflow: 'auto',
        fontFamily: FONT_STACK,
        background: '#fff',
      }}
    >
      <style>{`.pvt-custom-row:hover td { filter: brightness(0.97); }`}</style>
      <table
        style={{
          borderCollapse: 'separate',
          borderSpacing: 0,
          width: '100%',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <thead>
          {headerRowsToRender.map((levelCells, levelIdx) => {
            const isMetricLevel = levelIdx === metricHeaderLevel;
            let cellCursor = 0;
            return (
              <tr key={levelIdx}>
                {levelIdx === 0 &&
                  cornerLabels.map((label, i) => (
                    <th
                      key={`corner-${i}`}
                      rowSpan={headerRowsToRender.length}
                      style={{
                        ...baseHeader,
                        ...textStyleCSS(rowsStyle),
                        fontWeight: 700,
                        color: '#64748b',
                        background: '#fff',
                        borderBottom: '2px solid #e2e8f0',
                        padding: '10px 12px',
                        position: i === 0 ? 'sticky' : 'static',
                        left: 0,
                        zIndex: 3,
                      }}
                    >
                      {label}
                    </th>
                  ))}

                {levelCells.map((cell, ci) => {
                  const startIdx = cellCursor;
                  cellCursor += cell.span;
                  const gi = leafGroupIndex[startIdx] ?? 0;
                  const accent = GROUP_ACCENTS[gi % GROUP_ACCENTS.length];
                  const groupStart = leafIsGroupStart[startIdx];
                  const isGroupLevel = levelIdx === 0 && !isMetricLevel;

                  let style: React.CSSProperties;
                  if (isMetricLevel) {
                    const c = metricColor(metricColors, cell.label);
                    style = {
                      ...baseHeader,
                      ...textStyleCSS(metricsStyle),
                      background: c.headerBg,
                      color: c.headerText,
                      borderBottom: '2px solid #e2e8f0',
                    };
                  } else if (isGroupLevel) {
                    style = {
                      ...baseHeader,
                      ...textStyleCSS(columnsStyle),
                      background: '#fff',
                      color: '#0f172a',
                      borderBottom: `3px solid ${accent}`,
                    };
                  } else {
                    style = {
                      ...baseHeader,
                      ...textStyleCSS(columnsStyle),
                      background: '#fff',
                      color: '#475569',
                    };
                  }

                  return (
                    <th
                      key={ci}
                      colSpan={cell.span}
                      style={{
                        ...style,
                        borderLeft: groupStart ? GROUP_DIVIDER : 'none',
                      }}
                    >
                      {cell.label}
                    </th>
                  );
                })}

                {levelIdx === 0 && columnGrandTotals && (
                  <th
                    rowSpan={headerRowsToRender.length}
                    style={{
                      ...baseHeader,
                      ...textStyleCSS(columnsStyle),
                      color: '#0f172a',
                      background: '#f8fafc',
                      borderLeft: GROUP_DIVIDER,
                      borderBottom: '2px solid #e2e8f0',
                    }}
                  >
                    Total
                  </th>
                )}
              </tr>
            );
          })}
        </thead>

        <tbody>
          {bodyRows.map((row) => {
            const rowMetric =
              applyMetricsOn === 'rows'
                ? row.rowHeaderCells[rowHeaderLevels - 1]?.label
                : undefined;
            return (
              <tr key={row.key} className="pvt-custom-row" style={{ height: rowHeight }}>
                {row.isSubtotal ? (
                  <td
                    colSpan={rowHeaderLevels}
                    style={{
                      ...textStyleCSS(rowsStyle),
                      fontFamily: ROW_LABEL_FONT,
                      fontWeight: 700,
                      color: '#0f172a',
                      background: '#f8fafc',
                      borderBottom: ROW_DIVIDER,
                      padding: '8px 12px',
                      position: 'sticky',
                      left: 0,
                    }}
                  >
                    {row.rowHeaderCells[0]?.label}
                  </td>
                ) : (
                  row.rowHeaderCells.map((cell, ci) => {
                    if (!cell) return null;
                    const isMetricRowCell =
                      applyMetricsOn === 'rows' && ci === rowHeaderLevels - 1;
                    const mc = isMetricRowCell ? metricColor(metricColors, cell.label) : null;
                    return (
                      <td
                        key={ci}
                        rowSpan={cell.span}
                        style={{
                          ...(isMetricRowCell
                            ? { ...textStyleCSS(metricsStyle), background: mc!.headerBg, color: mc!.headerText, fontFamily: FONT_STACK }
                            : {
                                ...textStyleCSS(rowsStyle),
                                fontFamily: ROW_LABEL_FONT,
                                color: '#0f172a',
                                background: '#fff',
                              }),
                          padding: '8px 12px',
                          borderBottom: ROW_DIVIDER,
                          verticalAlign: 'middle',
                          ...(ci === 0 ? { position: 'sticky', left: 0, zIndex: 1 } : {}),
                        }}
                      >
                        {cell.label}
                      </td>
                    );
                  })
                )}

                {columnLeaves.map((leaf, li) => {
                  const c = metricColor(metricColors, rowMetric ?? leaf.metricLabel);
                  const v = row.values[leaf.key];
                  return (
                    <td
                      key={leaf.key}
                      style={{
                        padding: '8px 12px',
                        textAlign: 'right',
                        fontSize: 13,
                        borderBottom: ROW_DIVIDER,
                        borderLeft: leafIsGroupStart[li] ? GROUP_DIVIDER : 'none',
                        background: row.isSubtotal ? '#f8fafc' : c.valueBg,
                        color: row.isSubtotal ? '#0f172a' : c.valueText,
                        fontWeight: row.isSubtotal ? 700 : 500,
                      }}
                    >
                      <span style={{ opacity: v === 0 ? 0.4 : 1 }}>{fmt(v)}</span>
                    </td>
                  );
                })}

                {columnGrandTotals && (
                  <td
                    style={{
                      padding: '8px 12px',
                      textAlign: 'right',
                      fontSize: 13,
                      fontWeight: 700,
                      background: '#f8fafc',
                      borderBottom: ROW_DIVIDER,
                      borderLeft: GROUP_DIVIDER,
                    }}
                  >
                    {fmt(columnGrandTotals[row.key] ?? null)}
                  </td>
                )}
              </tr>
            );
          })}

          {grandTotalRow && (
            <tr style={{ height: rowHeight }}>
              <td
                colSpan={rowHeaderLevels}
                style={{
                  ...textStyleCSS(rowsStyle),
                  fontFamily: ROW_LABEL_FONT,
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#f1f5f9',
                  borderTop: '2px solid #cbd5e1',
                  padding: '8px 12px',
                  position: 'sticky',
                  left: 0,
                }}
              >
                {grandTotalRow.rowHeaderCells[0]?.label}
              </td>
              {columnLeaves.map((leaf, li) => (
                <td
                  key={leaf.key}
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 700,
                    background: '#f1f5f9',
                    borderTop: '2px solid #cbd5e1',
                    borderLeft: leafIsGroupStart[li] ? GROUP_DIVIDER : 'none',
                  }}
                >
                  {fmt(grandTotalRow.values[leaf.key])}
                </td>
              ))}
              {columnGrandTotals && (
                <td
                  style={{
                    padding: '8px 12px',
                    textAlign: 'right',
                    fontSize: 13,
                    fontWeight: 700,
                    background: '#e2e8f0',
                    borderTop: '2px solid #cbd5e1',
                    borderLeft: GROUP_DIVIDER,
                  }}
                >
                  {fmt(columnGrandTotals['grand-total-row'] ?? null)}
                </td>
              )}
            </tr>
          )}

          {bodyRows.length === 0 && (
            <tr>
              <td
                colSpan={rowHeaderLevels + columnLeaves.length + (columnGrandTotals ? 1 : 0)}
                style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}
              >
                No data available for this selection.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}