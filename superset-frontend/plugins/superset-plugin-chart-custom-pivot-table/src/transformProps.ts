/**
 * src/transformProps.ts
 *
 * Reshapes the flat query result (one row per unique row-dim + col-dim
 * combination, one column per metric) into a nested pivot structure: merged
 * row-header cells (rowSpan), merged column-header cells (colSpan), a value
 * lookup per body cell, and optional totals/subtotals — all driven by the
 * Apply-metrics-on / Combine-metrics / Transpose / column-sort controls.
 *
 * The underlying query never changes shape based on those controls — only
 * how this file lays the same flat data out for display does.
 */
import { ChartProps, getMetricLabel } from '@superset-ui/core';
import {
  PivotTableProps,
  AggregationFunction,
  MetricColorMap,
  HeaderCell,
  ColumnLeaf,
  BodyRow,
  DEFAULT_METRIC_COLOR,
} from './types';

const EMPTY = '(empty)';
const KEY_SEP = '\u241F'; // unlikely to collide with real data

function getColumnLabel(col: any): string {
  if (typeof col === 'string') return col;
  return col?.label ?? col?.sqlExpression ?? String(col);
}

function reduceValues(vals: number[] | undefined, fn: AggregationFunction): number | null {
  if (!vals || !vals.length) return null;
  switch (fn) {
    case 'avg':
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    case 'min':
      return Math.min(...vals);
    case 'max':
      return Math.max(...vals);
    case 'count':
      return vals.length;
    case 'count_distinct':
      return new Set(vals).size;
    case 'sum':
    default:
      return vals.reduce((a, b) => a + b, 0);
  }
}

interface Leaf {
  headerCellsPerLevel: string[];
}

function sameParentPath(a: Leaf, b: Leaf, level: number): boolean {
  for (let k = 0; k <= level; k += 1) {
    if (a.headerCellsPerLevel[k] !== b.headerCellsPerLevel[k]) return false;
  }
  return true;
}

/** Horizontal merge (colSpan), one HeaderCell[] per header level. */
function buildHeaderRows(leaves: Leaf[], numLevels: number): HeaderCell[][] {
  const rowsOut: HeaderCell[][] = [];
  for (let level = 0; level < numLevels; level += 1) {
    const row: HeaderCell[] = [];
    let i = 0;
    while (i < leaves.length) {
      let j = i + 1;
      while (j < leaves.length && sameParentPath(leaves[i], leaves[j], level)) j += 1;
      row.push({ label: leaves[i].headerCellsPerLevel[level], span: j - i });
      i = j;
    }
    rowsOut.push(row);
  }
  return rowsOut;
}

/** Vertical merge (rowSpan) — returns, per leaf index, a cell-or-null per level. */
function buildRowHeaderCells(leaves: Leaf[], numLevels: number): (HeaderCell | null)[][] {
  const result: (HeaderCell | null)[][] = leaves.map(() => new Array(numLevels).fill(null));
  for (let level = 0; level < numLevels; level += 1) {
    let i = 0;
    while (i < leaves.length) {
      let j = i + 1;
      while (j < leaves.length && sameParentPath(leaves[i], leaves[j], level)) j += 1;
      result[i][level] = { label: leaves[i].headerCellsPerLevel[level], span: j - i };
      i = j;
    }
  }
  return result;
}

function cmpTuples(a: string[], b: string[]): number {
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

export default function transformProps(chartProps: ChartProps): PivotTableProps {
  const { width, height, formData, queriesData } = chartProps;
  const fd = formData as any;

  const applyMetricsOn = (fd.applyMetricsOn ?? 'columns') as 'columns' | 'rows';
  const combineMetrics: boolean = fd.combineMetrics ?? false;
  const transposePivot: boolean = fd.transposePivot ?? false;
  const aggregationFunction: AggregationFunction = fd.aggregationFunction ?? 'sum';
  const showRowsTotal: boolean = fd.showRowsTotal ?? false;
  const showRowsSubtotal: boolean = fd.showRowsSubtotal ?? false;
  const showColumnsTotal: boolean = fd.showColumnsTotal ?? false;
  const showColumnsSubtotal: boolean = fd.showColumnsSubtotal ?? false;
  const seriesLimit: number = Number(fd.seriesLimit) || 0;

  const rawRowCols: any[] = fd.rows ?? [];
  const rawColCols: any[] = fd.columns ?? [];
  const rawMetrics: any[] = fd.metrics ?? [];

  // Transpose = swap which configured axis plays which role, everything
  // downstream is written generically against "effective" row/col dims.
  const effectiveRowColsRaw = transposePivot ? rawColCols : rawRowCols;
  const effectiveColColsRaw = transposePivot ? rawRowCols : rawColCols;

  const rowDimLabels: string[] = effectiveRowColsRaw.map(getColumnLabel);
  const colDimLabels: string[] = effectiveColColsRaw.map(getColumnLabel);
  const metricLabels: string[] = rawMetrics.map((m) => getMetricLabel(m));

  const rawData: Record<string, unknown>[] = queriesData?.[0]?.data ?? [];

  // ── Build the cell lookup: combined-dim-key -> { metric: reducedValue } ──
  const cellAccum = new Map<string, Record<string, number[]>>();
  const rowTupleMap = new Map<string, string[]>();
  const colTupleMap = new Map<string, string[]>();

  const orderColRaw = Array.isArray(fd.columnOrderColumn)
    ? fd.columnOrderColumn[0]
    : fd.columnOrderColumn;
  const orderColLabel: string | null = orderColRaw ? getColumnLabel(orderColRaw) : null;
  const columnOrderDesc: boolean = fd.columnOrderDesc ?? false;
  const colOrderMap = new Map<string, number>();

  rawData.forEach((row) => {
    const rTuple = rowDimLabels.map((d) => String(row[d] ?? EMPTY));
    const cTuple = colDimLabels.map((d) => String(row[d] ?? EMPTY));
    const rKey = rTuple.join(KEY_SEP);
    const cKey = cTuple.join(KEY_SEP);
    if (!rowTupleMap.has(rKey)) rowTupleMap.set(rKey, rTuple);
    if (!colTupleMap.has(cKey)) colTupleMap.set(cKey, cTuple);

    if (orderColLabel) {
      const ov = Number(row[orderColLabel]);
      if (!Number.isNaN(ov)) {
        const prev = colOrderMap.get(cKey);
        if (prev === undefined || ov < prev) colOrderMap.set(cKey, ov);
      }
    }

    const key = `${rKey}||${cKey}`;
    if (!cellAccum.has(key)) cellAccum.set(key, {});
    const rec = cellAccum.get(key)!;
    metricLabels.forEach((ml) => {
      const v = Number(row[ml]);
      if (!Number.isNaN(v)) {
        if (!rec[ml]) rec[ml] = [];
        rec[ml].push(v);
      }
    });
  });

  const cellMap = new Map<string, Record<string, number | null>>();
  cellAccum.forEach((rec, key) => {
    const out: Record<string, number | null> = {};
    metricLabels.forEach((ml) => {
      out[ml] = reduceValues(rec[ml], aggregationFunction);
    });
    cellMap.set(key, out);
  });

  const lookupValue = (rTuple: string[], cTuple: string[], metric: string): number | null => {
    const key = `${rTuple.join(KEY_SEP)}||${cTuple.join(KEY_SEP)}`;
    return cellMap.get(key)?.[metric] ?? null;
  };

  // ── Row tuples: sorted lexicographically so identical parents group ─────
  let rowTuples = Array.from(rowTupleMap.values()).sort(cmpTuples);

  // ── Column tuples: sorted lexicographically by default, or by the chosen
  //    column-sort metric's aggregate value across all rows ───────────────
  let colTuples = Array.from(colTupleMap.values()).sort(cmpTuples);

  const columnSortMetric: string | null = fd.columnSortMetric ?? null;
  const columnSortDesc: boolean = fd.columnSortDesc ?? false;
  if (orderColLabel && colOrderMap.size > 0) {
    colTuples = [...colTuples].sort((a, b) => {
      const av = colOrderMap.get(a.join(KEY_SEP)) ?? Number.MAX_SAFE_INTEGER;
      const bv = colOrderMap.get(b.join(KEY_SEP)) ?? Number.MAX_SAFE_INTEGER;
      return columnOrderDesc ? bv - av : av - bv;
    });
  } else if (columnSortMetric && metricLabels.includes(columnSortMetric)) {
    const totals = new Map<string, number>();
    colTuples.forEach((cTuple) => {
      let sum = 0;
      rowTuples.forEach((rTuple) => {
        sum += lookupValue(rTuple, cTuple, columnSortMetric) ?? 0;
      });
      totals.set(cTuple.join(KEY_SEP), sum);
    });
    colTuples = [...colTuples].sort((a, b) => {
      const av = totals.get(a.join(KEY_SEP)) ?? 0;
      const bv = totals.get(b.join(KEY_SEP)) ?? 0;
      return columnSortDesc ? bv - av : av - bv;
    });
  }

  if (seriesLimit > 0 && colTuples.length > seriesLimit) {
    colTuples = colTuples.slice(0, seriesLimit);
  }

  // ── Build column leaves + header rows ────────────────────────────────────
  let columnLeaves: ColumnLeaf[] = [];
  let leafColTuples: string[][] = []; // parallel array, raw col-dim values (no metric) per leaf
  let columnHeaderRows: HeaderCell[][];

  if (applyMetricsOn === 'columns') {
    const pairs: { colTuple: string[]; metric: string }[] = [];
    if (combineMetrics) {
      metricLabels.forEach((m) => colTuples.forEach((c) => pairs.push({ colTuple: c, metric: m })));
    } else {
      colTuples.forEach((c) => metricLabels.forEach((m) => pairs.push({ colTuple: c, metric: m })));
    }
    columnLeaves = pairs.map((p) => ({
      key: `${p.colTuple.join(KEY_SEP)}${KEY_SEP}${p.metric}`,
      metricLabel: p.metric,
      headerCellsPerLevel: combineMetrics ? [p.metric, ...p.colTuple] : [...p.colTuple, p.metric],
    }));
    leafColTuples = pairs.map((p) => p.colTuple);
    columnHeaderRows = buildHeaderRows(columnLeaves, colDimLabels.length + 1);
  } else {
    // applyMetricsOn === 'rows': columns are just the col-dim tuples, no
    // metric level — metric instead becomes an extra row-header level.
    columnLeaves = colTuples.map((c) => ({
      key: c.join(KEY_SEP),
      metricLabel: '',
      headerCellsPerLevel: [...c],
    }));
    leafColTuples = colTuples.map((c) => c);
    columnHeaderRows = colDimLabels.length
      ? buildHeaderRows(columnLeaves, colDimLabels.length)
      : [];
  }

  // ── Build row leaves (+ merged rowSpan headers) ──────────────────────────
  interface RowLeafInfo {
    rTuple: string[];
    metric: string | null; // set when applyMetricsOn === 'rows'
    headerCellsPerLevel: string[];
  }
  let rowLeafInfos: RowLeafInfo[];
  let rowHeaderLevels: number;

  if (applyMetricsOn === 'rows') {
    rowLeafInfos = [];
    rowTuples.forEach((rTuple) => {
      metricLabels.forEach((m) => {
        rowLeafInfos.push({ rTuple, metric: m, headerCellsPerLevel: [...rTuple, m] });
      });
    });
    rowHeaderLevels = rowDimLabels.length + 1;
  } else {
    rowLeafInfos = rowTuples.map((rTuple) => ({ rTuple, metric: null, headerCellsPerLevel: [...rTuple] }));
    rowHeaderLevels = rowDimLabels.length;
  }

  const rowHeaderMerged = buildRowHeaderCells(rowLeafInfos, rowHeaderLevels);

  const bodyRows: BodyRow[] = rowLeafInfos.map((info, idx) => {
    const values: Record<string, number | null> = {};
    columnLeaves.forEach((leaf, li) => {
      const metric = applyMetricsOn === 'rows' ? (info.metric as string) : leaf.metricLabel;
      values[leaf.key] = lookupValue(info.rTuple, leafColTuples[li], metric);
    });
    return {
      key: `row-${idx}`,
      rowHeaderCells: rowHeaderMerged[idx],
      values,
    };
  });

  // ── Row subtotals: insert after each change in the outermost row dim ────
  let bodyRowsWithSubtotals = bodyRows;
  if (showRowsSubtotal && rowDimLabels.length > 1 && applyMetricsOn === 'columns') {
    const out: BodyRow[] = [];
    let i = 0;
    while (i < bodyRows.length) {
      const outerVal = rowLeafInfos[i].rTuple[0];
      let j = i;
      const groupIdxs: number[] = [];
      while (j < bodyRows.length && rowLeafInfos[j].rTuple[0] === outerVal) {
        out.push(bodyRows[j]);
        groupIdxs.push(j);
        j += 1;
      }
      if (groupIdxs.length > 1) {
        const subtotalValues: Record<string, number | null> = {};
        columnLeaves.forEach((leaf) => {
          let sum = 0;
          let any = false;
          groupIdxs.forEach((gi) => {
            const v = bodyRows[gi].values[leaf.key];
            if (v != null) {
              sum += v;
              any = true;
            }
          });
          subtotalValues[leaf.key] = any ? sum : null;
        });
        out.push({
          key: `subtotal-${outerVal}`,
          rowHeaderCells: [{ label: `${outerVal} Subtotal`, span: 1 }],
          values: subtotalValues,
          isSubtotal: true,
        });
      }
      i = j;
    }
    bodyRowsWithSubtotals = out;
  }

  // ── Column subtotals: insert an extra leaf after each outer col group ───
  let finalColumnLeaves = columnLeaves;
  let finalBodyRows = bodyRowsWithSubtotals;
  if (showColumnsSubtotal && colDimLabels.length > 1 && applyMetricsOn === 'columns') {
    const newLeaves: ColumnLeaf[] = [];
    const subtotalGroups: { startIdx: number; endIdx: number; label: string }[] = [];
    let i = 0;
    while (i < columnLeaves.length) {
      const outerVal = columnLeaves[i].headerCellsPerLevel[0];
      let j = i;
      while (j < columnLeaves.length && columnLeaves[j].headerCellsPerLevel[0] === outerVal) {
        newLeaves.push(columnLeaves[j]);
        j += 1;
      }
      if (j - i > 1) {
        const subtotalKey = `subtotal-col-${outerVal}`;
        newLeaves.push({
          key: subtotalKey,
          metricLabel: '',
          headerCellsPerLevel: [outerVal, ...new Array(colDimLabels.length).fill('Subtotal')],
        });
        subtotalGroups.push({ startIdx: i, endIdx: j - 1, label: subtotalKey });
      }
      i = j;
    }
    finalColumnLeaves = newLeaves;
    finalBodyRows = bodyRowsWithSubtotals.map((r) => {
      const values = { ...r.values };
      subtotalGroups.forEach((g) => {
        let sum = 0;
        let any = false;
        for (let k = g.startIdx; k <= g.endIdx; k += 1) {
          const v = r.values[columnLeaves[k].key];
          if (v != null) {
            sum += v;
            any = true;
          }
        }
        values[g.label] = any ? sum : null;
      });
      return { ...r, values };
    });
  }

  if (finalColumnLeaves !== columnLeaves) {
    columnHeaderRows = buildHeaderRows(
      finalColumnLeaves,
      applyMetricsOn === 'columns' ? colDimLabels.length + 1 : colDimLabels.length,
    );
  }

  // ── Grand totals ──────────────────────────────────────────────────────────
  let grandTotalRow: BodyRow | null = null;
  if (showRowsTotal) {
    const values: Record<string, number | null> = {};
    finalColumnLeaves.forEach((leaf) => {
      let sum = 0;
      let any = false;
      bodyRows.forEach((r) => {
        const v = r.values[leaf.key];
        if (v != null) {
          sum += v;
          any = true;
        }
      });
      values[leaf.key] = any ? sum : null;
    });
    grandTotalRow = {
      key: 'grand-total-row',
      rowHeaderCells: [{ label: 'Total', span: 1 }],
      values,
      isSubtotal: true,
    };
  }

  let columnGrandTotals: Record<string, number | null> | null = null;
  if (showColumnsTotal) {
    columnGrandTotals = {};
    finalBodyRows.forEach((r) => {
      let sum = 0;
      let any = false;
      finalColumnLeaves.forEach((leaf) => {
        const v = r.values[leaf.key];
        if (v != null) {
          sum += v;
          any = true;
        }
      });
      (columnGrandTotals as any)[r.key] = any ? sum : null;
    });
    if (grandTotalRow) {
      let sum = 0;
      let any = false;
      finalColumnLeaves.forEach((leaf) => {
        const v = grandTotalRow!.values[leaf.key];
        if (v != null) {
          sum += v;
          any = true;
        }
      });
      (columnGrandTotals as any)['grand-total-row'] = any ? sum : null;
    }
  }

  const toCss = (c: any, fallback: string): string => {
    if (!c) return fallback;
    if (typeof c === 'string') return c;
    return `rgba(${c.r},${c.g},${c.b},${c.a ?? 1})`;
  };
  const metricColors: MetricColorMap = {};
  metricLabels.forEach((ml, i) => {
    metricColors[ml] = {
      headerBg: toCss(fd[`metric${i}HeaderBg`], DEFAULT_METRIC_COLOR.headerBg),
      headerText: toCss(fd[`metric${i}HeaderText`], DEFAULT_METRIC_COLOR.headerText),
      valueBg: toCss(fd[`metric${i}ValueBg`], DEFAULT_METRIC_COLOR.valueBg),
      valueText: toCss(fd[`metric${i}ValueText`], DEFAULT_METRIC_COLOR.valueText),
    };
  });

  return {
    width,
    height,
    rowDimLabels,
    colDimLabels,
    metricLabels,
    applyMetricsOn,
    columnLeaves: finalColumnLeaves,
    columnHeaderRows,
    bodyRows: finalBodyRows,
    grandTotalRow,
    columnGrandTotals,
    rowHeight: Number(fd.rowHeight) || 32,
    metricsStyle: {
      fontSize: Number(fd.metricsFontSize) || 11,
      bold: fd.metricsBold ?? true,
      italic: fd.metricsItalic ?? false,
      align: fd.metricsAlign ?? 'center',
    },
    columnsStyle: {
      fontSize: Number(fd.columnsFontSize) || 13,
      bold: fd.columnsBold ?? true,
      italic: fd.columnsItalic ?? false,
      align: fd.columnsAlign ?? 'center',
    },
    rowsStyle: {
      fontSize: Number(fd.rowsFontSize) || 14,
      bold: fd.rowsBold ?? true,
      italic: fd.rowsItalic ?? false,
      align: fd.rowsAlign ?? 'left',
    },
    metricColors,
    metricHeaderLevel:
      applyMetricsOn === 'columns' ? (combineMetrics ? 0 : colDimLabels.length) : -1,
  };
}
