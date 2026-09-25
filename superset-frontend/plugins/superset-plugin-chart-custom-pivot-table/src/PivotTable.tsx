/**
 * src/PivotTable.tsx
 *
 * Plain HTML table renderer — no D3 needed, this is pure row/column
 * layout. Consumes the pre-computed header/body structure from
 * transformProps.ts and applies styling (fonts, per-metric colors, row
 * height) at render time.
 */
import React from 'react';
import { PivotTableProps, TextStyle, MetricColorMap, DEFAULT_METRIC_COLOR } from './types';

const fmt = (v: number | null): string => (v == null ? '' : v.toLocaleString());

function textStyleCSS(s: TextStyle): React.CSSProperties {
  return {
    fontSize: s.fontSize,
    fontWeight: s.bold ? 700 : 400,
    fontStyle: s.italic ? 'italic' : 'normal',
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
    colDimLabels,
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
  } = props;

  const rowHeaderLevels = rowDimLabels.length + (applyMetricsOn === 'rows' ? 1 : 0);
  const rowHeaderCornerLabels =
    applyMetricsOn === 'rows' ? [...rowDimLabels, 'Metric'] : rowDimLabels;

  // Which header level (if any) in columnHeaderRows represents the metric
  // name row, so we can apply metricsStyle + per-metric color there instead
  // of the generic columnsStyle.
  const metricLevelIndex =
    applyMetricsOn === 'columns'
      ? (props as any).combineMetricsLevel0 // not passed; derive below instead
      : -1;

  return (
    <div style={{ width, height, overflow: 'auto', fontFamily: 'sans-serif' }}>
      <table style={{ borderCollapse: 'collapse', minWidth: '100%' }}>
        <thead>
          {columnHeaderRows.map((levelCells, levelIdx) => {
            // The metric-name level is whichever level's cell labels are all
            // metric labels (columnLeaves' metricLabel) — safer to detect via
            // columnLeaves directly rather than positional assumption, since
            // "Combine metrics" changes whether it's level 0 or the last one.
            const isMetricLevel =
              applyMetricsOn === 'columns' &&
              columnLeaves.length > 0 &&
              (() => {
                const metricLabelsSet = new Set(columnLeaves.map((l) => l.metricLabel));
                return levelCells.every((c) => metricLabelsSet.has(c.label));
              })();

            return (
              <tr key={levelIdx}>
                {levelIdx === 0 &&
                  rowHeaderCornerLabels.map((label, i) => (
                    <th
                      key={`corner-${i}`}
                      rowSpan={columnHeaderRows.length || 1}
                      style={{
                        ...textStyleCSS(rowsStyle),
                        background: '#f7f8fa',
                        border: '1px solid #e2e4e8',
                        padding: '4px 8px',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                      }}
                    >
                      {label}
                    </th>
                  ))}

                {levelCells.map((cell, ci) => {
                  const c = isMetricLevel ? metricColor(metricColors, cell.label) : null;
                  const style = isMetricLevel
                    ? {
                        ...textStyleCSS(metricsStyle),
                        background: c!.headerBg,
                        color: c!.headerText,
                      }
                    : {
                        ...textStyleCSS(columnsStyle),
                        background: '#f7f8fa',
                        color: '#333',
                      };
                  return (
                    <th
                      key={ci}
                      colSpan={cell.span}
                      style={{ ...style, border: '1px solid #e2e4e8', padding: '4px 8px', textAlign: 'center' }}
                    >
                      {cell.label}
                    </th>
                  );
                })}

                {levelIdx === 0 && columnGrandTotals && (
                  <th
                    rowSpan={columnHeaderRows.length || 1}
                    style={{
                      ...textStyleCSS(columnsStyle),
                      background: '#eef0f3',
                      border: '1px solid #e2e4e8',
                      padding: '4px 8px',
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
          {bodyRows.map((row) => (
            <tr key={row.key} style={{ height: rowHeight }}>
              {row.isSubtotal ? (
                <td
                  colSpan={rowHeaderLevels}
                  style={{
                    ...textStyleCSS(rowsStyle),
                    fontWeight: 700,
                    background: '#f4f5f7',
                    border: '1px solid #e2e4e8',
                    padding: '4px 8px',
                    position: 'sticky',
                    left: 0,
                  }}
                >
                  {row.rowHeaderCells[0]?.label}
                </td>
              ) : (
                row.rowHeaderCells.map((cell, ci) =>
                  cell ? (
                    <td
                      key={ci}
                      rowSpan={cell.span}
                      style={{
                        ...textStyleCSS(rowsStyle),
                        border: '1px solid #e2e4e8',
                        padding: '4px 8px',
                        background: '#fff',
                        position: 'sticky',
                        left: 0,
                      }}
                    >
                      {cell.label}
                    </td>
                  ) : null,
                )
              )}

              {columnLeaves.map((leaf) => {
                const c = metricColor(metricColors, leaf.metricLabel);
                return (
                  <td
                    key={leaf.key}
                    style={{
                      border: '1px solid #eceef1',
                      padding: '4px 10px',
                      textAlign: 'right',
                      background: row.isSubtotal ? '#f4f5f7' : c.valueBg,
                      color: row.isSubtotal ? '#333' : c.valueText,
                      fontWeight: row.isSubtotal ? 700 : 400,
                    }}
                  >
                    {fmt(row.values[leaf.key])}
                  </td>
                );
              })}

              {columnGrandTotals && (
                <td
                  style={{
                    border: '1px solid #eceef1',
                    padding: '4px 10px',
                    textAlign: 'right',
                    fontWeight: 700,
                    background: '#eef0f3',
                  }}
                >
                  {fmt(columnGrandTotals[row.key] ?? null)}
                </td>
              )}
            </tr>
          ))}

          {grandTotalRow && (
            <tr style={{ height: rowHeight }}>
              <td
                colSpan={rowHeaderLevels}
                style={{
                  ...textStyleCSS(rowsStyle),
                  fontWeight: 700,
                  background: '#eef0f3',
                  border: '1px solid #e2e4e8',
                  padding: '4px 8px',
                  position: 'sticky',
                  left: 0,
                }}
              >
                {grandTotalRow.rowHeaderCells[0]?.label}
              </td>
              {columnLeaves.map((leaf) => (
                <td
                  key={leaf.key}
                  style={{
                    border: '1px solid #e2e4e8',
                    padding: '4px 10px',
                    textAlign: 'right',
                    fontWeight: 700,
                    background: '#eef0f3',
                  }}
                >
                  {fmt(grandTotalRow.values[leaf.key])}
                </td>
              ))}
              {columnGrandTotals && (
                <td
                  style={{
                    border: '1px solid #e2e4e8',
                    padding: '4px 10px',
                    textAlign: 'right',
                    fontWeight: 700,
                    background: '#dfe2e7',
                  }}
                >
                  {fmt(columnGrandTotals['grand-total-row'] ?? null)}
                </td>
              )}
            </tr>
          )}

          {bodyRows.length === 0 && (
            <tr>
              <td colSpan={rowHeaderLevels + columnLeaves.length + (columnGrandTotals ? 1 : 0)} style={{ padding: 20, textAlign: 'center', color: '#aaa' }}>
                No data available for this selection.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}