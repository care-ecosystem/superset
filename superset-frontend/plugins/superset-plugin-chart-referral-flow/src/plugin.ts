import { ChartPlugin, ChartMetadata, ChartDataResponseResult } from '@superset-ui/core';
import buildQuery from './buildQuery';
import controlPanel from './controlPanel';
import transformProps from './transformProps';
import ReferralFlowTable from './ReferralFlowTable';

const metadata = new ChartMetadata({
  name: 'Referral Flow Table',
  description:
    'A styled table showing patient referral flow between facility levels, ' +
    'with colour-coded From/To pills, a patients-referred count, and an ' +
    'optional top-reason column.',
  tags: ['Table', 'Referral', 'Healthcare'],
  category: 'Table',
});

export default class ReferralFlowTablePlugin extends ChartPlugin<
  Record<string, unknown>,
  ChartDataResponseResult
> {
  constructor() {
    super({
      buildQuery,
      controlPanel,
      loadChart: () => ReferralFlowTable,
      metadata,
      transformProps,
    });
  }
}
