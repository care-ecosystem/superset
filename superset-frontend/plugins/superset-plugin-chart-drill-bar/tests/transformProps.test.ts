/**
 * tests/transformProps.test.ts
 *
 * Verifies that transformProps:
 *  - correctly maps raw rows to BarDatum objects
 *  - sets currentDepth and drillPath from formData
 *  - provides onDrillDown / onDrillUp callbacks
 *  - handles empty data gracefully
 */

jest.mock('@superset-ui/core', () => ({
  getMetricLabel: (metric: any) =>
    typeof metric === 'string' ? metric : metric?.label ?? '',
}));

import transformProps from '../src/transformProps';

function makeProps(overrides: any = {}) {
  return {
    width: 800,
    height: 400,
    formData: {
      groupby: ['continent', 'country', 'state'],
      metric: 'population',
      drillDepth: 0,
      drillPath: [],
      drillFilters: [],
      barColor: { r: 70, g: 130, b: 220, a: 1 },
      barColorHover: { r: 30, g: 90, b: 180, a: 1 },
      showLabels: true,
      showTooltip: true,
      animationDuration: 400,
      ...overrides.formData,
    },
    queriesData: [
      {
        data: overrides.data ?? [
          { continent: 'Asia', population: 4700000000 },
          { continent: 'Europe', population: 750000000 },
        ],
      },
    ],
    hooks: { setDataMask: jest.fn() },
    ...overrides,
  };
}

describe('transformProps', () => {
  it('maps raw rows to BarDatum objects correctly', () => {
    const props = transformProps(makeProps() as any);
    expect(props.data).toHaveLength(2);
    expect(props.data[0].label).toBe('Asia');
    expect(props.data[0].value).toBe(4700000000);
    expect(props.data[0].depth).toBe(0);
    expect(props.data[0].parent).toBeNull();
  });

  it('sets hierarchy metadata from formData', () => {
    const props = transformProps(makeProps() as any);
    expect(props.hierarchyColumns).toEqual(['continent', 'country', 'state']);
    expect(props.currentDepth).toBe(0);
    expect(props.drillPath).toEqual([]);
  });

  it('passes drillPath when drilling down', () => {
    const overrides = {
      formData: {
        drillDepth: 1,
        drillPath: [{ column: 'continent', value: 'Asia', label: 'Asia' }],
        drillFilters: [{ col: 'continent', val: 'Asia' }],
      },
      data: [
        { country: 'India', population: 1400000000 },
        { country: 'China', population: 1440000000 },
      ],
    };
    const props = transformProps(makeProps(overrides) as any);
    expect(props.currentDepth).toBe(1);
    expect(props.drillPath).toHaveLength(1);
    expect(props.data[0].parent).toBe('Asia');
  });

  it('handles empty query results without crashing', () => {
    const props = transformProps(makeProps({ data: [] }) as any);
    expect(props.data).toHaveLength(0);
  });

  it('converts color objects to rgba strings', () => {
    const props = transformProps(makeProps() as any);
    expect(props.barColor).toMatch(/rgba/);
    expect(props.barColorHover).toMatch(/rgba/);
  });

  it('onDrillDown calls setDataMask with incremented depth', () => {
    const setDataMask = jest.fn();
    const props = transformProps(makeProps({ hooks: { setDataMask } }) as any);
    props.onDrillDown(props.data[0]); // click Asia
    expect(setDataMask).toHaveBeenCalledTimes(1);
    const call = setDataMask.mock.calls[0][0];
    expect(call.ownState.drillDepth).toBe(1);
    expect(call.ownState.drillPath[0].value).toBe('Asia');
  });

  it('onDrillUp calls setDataMask with reduced depth', () => {
    const setDataMask = jest.fn();
    const overrides = {
      formData: {
        drillDepth: 2,
        drillPath: [
          { column: 'continent', value: 'Asia', label: 'Asia' },
          { column: 'country', value: 'India', label: 'India' },
        ],
      },
      data: [],
      hooks: { setDataMask },
    };
    const props = transformProps(makeProps(overrides) as any);
    props.onDrillUp(1);
    const call = setDataMask.mock.calls[0][0];
    expect(call.ownState.drillDepth).toBe(1);
    expect(call.ownState.drillPath).toHaveLength(1);
  });
});
