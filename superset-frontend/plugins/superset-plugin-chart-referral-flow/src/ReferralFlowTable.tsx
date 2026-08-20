/**
 * src/ReferralFlowTable.tsx
 *
 * Custom styled table for patient referral flow between facility levels.
 * Not built on D3 — this is a plain HTML table with React-driven styling,
 * since there's no scale/axis math involved, just row rendering.
 *
 * Colour assignment
 * ──────────────────
 * Colours for the From/To pill badges are auto-assigned from a fixed
 * palette, keyed by each distinct label's first-seen order across the
 * whole dataset (so "PHC/SHC" always gets the same colour whether it
 * appears in the From or To column). This is a starting point — swap
 * PALETTE or the assignment logic later if a different scheme is wanted.
 */
import React, { useMemo } from 'react';
import { ReferralFlowTableProps } from './types';

interface PillColor {
  bg: string;
  text: string;
  border: string;
}

const PALETTE: string[] = [
  '#2E9E4F', // green
  '#3B7DDB', // blue
  '#D64545', // red
  '#6B6B6B', // gray
  '#B8862E', // amber
  '#8A5FC7', // purple
  '#2E9E8F', // teal
  '#C7599B', // pink
];

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function colorFor(index: number): PillColor {
  const base = PALETTE[index % PALETTE.length];
  return {
    bg: hexToRgba(base, 0.13),
    text: base,
    border: hexToRgba(base, 0.35),
  };
}

const fmtNumber = (n: number) => n.toLocaleString();

export default function ReferralFlowTable(props: ReferralFlowTableProps) {
  const { width, height, rows, totalValue, footerLabel, showFooter } = props;

  // Assign a stable colour per distinct label, in first-seen order across
  // both From and To columns combined.
  const colorMap = useMemo(() => {
    const map = new Map<string, PillColor>();
    let nextIndex = 0;
    rows.forEach((r) => {
      [r.from, r.to].forEach((label) => {
        if (!map.has(label)) {
          map.set(label, colorFor(nextIndex));
          nextIndex += 1;
        }
      });
    });
    return map;
  }, [rows]);

  const hasReasonColumn = rows.some((r) => r.topReason);

  return (
    <div
      style={{
        width,
        height,
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f7f8fa', borderBottom: '1px solid #e5e7eb' }}>
              <th style={headerStyle}>From</th>
              <th style={headerStyle} />
              <th style={headerStyle}>To</th>
              <th style={{ ...headerStyle, textAlign: 'right' }}>Patients Referred</th>
              {hasReasonColumn && <th style={headerStyle}>Top Reason</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const fromColor = colorMap.get(row.from) ?? colorFor(0);
              const toColor = colorMap.get(row.to) ?? colorFor(1);
              return (
                <tr
                  key={`${row.from}-${row.to}-${idx}`}
                  style={{
                    borderBottom: '1px solid #eee',
                    background: idx % 2 === 1 ? '#fafafa' : '#fff',
                  }}
                >
                  <td style={cellStyle}>
                    <Pill label={row.from} color={fromColor} />
                  </td>
                  <td style={{ ...cellStyle, width: 24, color: '#aaa', textAlign: 'center' }}>
                    →
                  </td>
                  <td style={cellStyle}>
                    <Pill label={row.to} color={toColor} />
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 700, fontSize: 15 }}>
                    {fmtNumber(row.patientsReferred)}
                  </td>
                  {hasReasonColumn && (
                    <td style={{ ...cellStyle, color: '#666' }}>{row.topReason}</td>
                  )}
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...cellStyle, textAlign: 'center', color: '#aaa' }}>
                  No data available for this selection.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showFooter && totalValue !== null && (
        <div
          style={{
            borderTop: '1px solid #e5e7eb',
            padding: '10px 12px',
            fontSize: 13,
            color: '#333',
            flexShrink: 0,
          }}
        >
          {footerLabel}: <strong>{fmtNumber(totalValue)}</strong>
        </div>
      )}
    </div>
  );
}

function Pill({ label, color }: { label: string; color: PillColor }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 5,
        background: color.bg,
        color: color.text,
        border: `1px solid ${color.border}`,
        fontWeight: 600,
        fontSize: 12,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}

const headerStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: 11,
  fontWeight: 700,
  color: '#666',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
};

const cellStyle: React.CSSProperties = {
  padding: '10px 12px',
  verticalAlign: 'middle',
};
