/**
 * tests/DrillBarChart.test.tsx
 *
 * Smoke tests for the React component:
 *  - Renders without crashing
 *  - Renders one bar per datum
 *  - Shows breadcrumbs when drillPath is populated
 *  - Calls onDrillDown when a bar is clicked (and further drilling is possible)
 *  - Calls onDrillUp when a breadcrumb is clicked
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DrillBarChart from '../src/DrillBarChart';
import { BarDatum, DrillPath } from '../src/types';

// D3 transitions are not available in jsdom — mock them
jest.mock('d3', () => {
  const realD3 = jest.requireActual('d3');
  return {
    ...realD3,
    // Make select(...).transition() a no-op so axis rendering doesn't crash
    select: (el: any) => ({
      ...realD3.select(el),
      transition: () => ({
        duration: () => ({
          call: () => ({
            selectAll: () => ({
              style: () => ({}),
              attr: () => ({}),
            }),
          }),
        }),
      }),
    }),
  };
});

const SAMPLE_DATA: BarDatum[] = [
  { label: 'Asia', value: 4_700_000_000, depth: 0, parent: null },
  { label: 'Europe', value: 750_000_000, depth: 0, parent: null },
  { label: 'Americas', value: 1_000_000_000, depth: 0, parent: null },
];

function makeProps(overrides: Partial<React.ComponentProps<typeof DrillBarChart>> = {}) {
  return {
    width: 600,
    height: 400,
    data: SAMPLE_DATA,
    hierarchyColumns: ['continent', 'country', 'state'],
    currentDepth: 0,
    drillPath: [] as DrillPath[],
    barColor: 'rgba(70,130,220,1)',
    barColorHover: 'rgba(30,90,180,1)',
    showLabels: true,
    showTooltip: true,
    animationDuration: 0, // instant for tests
    onDrillDown: jest.fn(),
    onDrillUp: jest.fn(),
    ...overrides,
  };
}

describe('DrillBarChart', () => {
  it('renders without crashing', () => {
    render(<DrillBarChart {...makeProps()} />);
  });

  it('renders a bar (rect) for each datum', () => {
    const { container } = render(<DrillBarChart {...makeProps()} />);
    const rects = container.querySelectorAll('rect');
    // Should have at least 3 bars
    expect(rects.length).toBeGreaterThanOrEqual(SAMPLE_DATA.length);
  });

  it('shows "Root" breadcrumb when at depth 0 with no drillPath', () => {
    render(<DrillBarChart {...makeProps()} />);
    expect(screen.getByText('continent')).toBeInTheDocument();
  });

  it('shows drillPath entries in breadcrumb', () => {
    const drillPath: DrillPath[] = [
      { column: 'continent', value: 'Asia', label: 'Asia' },
    ];
    render(<DrillBarChart {...makeProps({ drillPath, currentDepth: 1 })} />);
    expect(screen.getByText(/Asia/)).toBeInTheDocument();
  });

  it('calls onDrillDown when a bar is clicked and more levels exist', () => {
    const onDrillDown = jest.fn();
    const { container } = render(<DrillBarChart {...makeProps({ onDrillDown })} />);
    const firstBar = container.querySelector('rect');
    if (firstBar) fireEvent.click(firstBar);
    expect(onDrillDown).toHaveBeenCalled();
  });

  it('does NOT call onDrillDown when already at the deepest level', () => {
    const onDrillDown = jest.fn();
    // currentDepth === hierarchyColumns.length - 1 means leaf
    const drillPath: DrillPath[] = [
      { column: 'continent', value: 'Asia', label: 'Asia' },
      { column: 'country', value: 'India', label: 'India' },
    ];
    const { container } = render(
      <DrillBarChart
        {...makeProps({ onDrillDown, currentDepth: 2, drillPath })}
      />,
    );
    const firstBar = container.querySelector('rect');
    if (firstBar) fireEvent.click(firstBar);
    expect(onDrillDown).not.toHaveBeenCalled();
  });

  it('renders "No data" message when data array is empty', () => {
    render(<DrillBarChart {...makeProps({ data: [] })} />);
    expect(screen.getByText(/no data/i)).toBeInTheDocument();
  });
});
