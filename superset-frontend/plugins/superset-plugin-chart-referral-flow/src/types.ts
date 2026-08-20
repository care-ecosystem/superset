/**
 * src/types.ts
 */
import { QueryFormData } from '@superset-ui/core';

export interface ReferralFlowFormData extends QueryFormData {
  fromColumn: any;
  toColumn: any;
  patientsMetric: string;
  reasonMetric: string;
  /** Optional separate metric for the footer total — aggregated across the
   *  whole filtered dataset, ignoring the From/To groupby entirely. Falls
   *  back to patientsMetric if not set. */
  totalMetric: string | null;
  footerLabel: string;
  showFooter: boolean;
}

export interface ReferralRow {
  from: string;
  to: string;
  patientsReferred: number;
  topReason: string;
}

export interface ReferralFlowTableProps {
  width: number;
  height: number;
  rows: ReferralRow[];
  /** Formatted total value for the footer, already aggregated server-side. */
  totalValue: number | null;
  footerLabel: string;
  showFooter: boolean;
}
