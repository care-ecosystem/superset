/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import {
  buildQueryContext,
  normalizeOrderBy,
  QueryFormData,
  QueryObjectExtras,
} from '@superset-ui/core';
import dayjs, { OpUnitType, ManipulateType } from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';

dayjs.extend(isoWeek);
dayjs.extend(quarterOfYear);

type Granularity = 'day' | 'week' | 'month' | 'quarter' | 'year';
const GRANULARITIES: Granularity[] = ['day', 'week', 'month', 'quarter', 'year'];

const UNIT_MAP: Record<Granularity, OpUnitType> = {
  day: 'day',
  week: 'isoWeek',
  month: 'month',
  quarter: 'quarter',
  year: 'year',
};

const ROLLING_STEP: Record<Granularity, [number, ManipulateType]> = {
  day: [1, 'day'],
  week: [1, 'week'],
  month: [1, 'month'],
  quarter: [3, 'month'],
  year: [1, 'year'],
};

function parseTimeRange(
  timeRange?: string,
): { type: 'current' | 'last' | 'previous'; granularity: Granularity } | null {
  if (!timeRange) return null;
  const tr = timeRange.toLowerCase();
  const granularity = GRANULARITIES.find(g => tr.includes(g));
  if (!granularity) return null;
  if (tr.includes('current')) return { type: 'current', granularity };
  if (tr.includes('previous')) return { type: 'previous', granularity };
  if (tr.includes('last')) return { type: 'last', granularity };
  return null;
}

export function getComparisonRange(timeRange?: string): string | null {
  const parsed = parseTimeRange(timeRange);
  if (!parsed) return null;
  const { type, granularity } = parsed;
  const now = dayjs();
  const unit = UNIT_MAP[granularity];
  const stepUnit: ManipulateType = granularity === 'week' ? 'week' : (granularity as ManipulateType);

  if (type === 'current') {
    const anchor = now.subtract(1, stepUnit);
    return `${anchor.startOf(unit).format('YYYY-MM-DD')} : ${anchor
      .endOf(unit)
      .add(1, 'day')
      .format('YYYY-MM-DD')}`;
  }

  if (type === 'previous') {
    const anchor = now.subtract(2, stepUnit);
    return `${anchor.startOf(unit).format('YYYY-MM-DD')} : ${anchor
      .endOf(unit)
      .add(1, 'day')
      .format('YYYY-MM-DD')}`;
  }

  const [amount, unitType] = ROLLING_STEP[granularity];
  const currentStart = now.subtract(amount, unitType);
  const priorStart = currentStart.subtract(amount, unitType);
  return `${priorStart.format('YYYY-MM-DD')} : ${currentStart.format('YYYY-MM-DD')}`;
}

export default function buildQuery(formData: QueryFormData) {
  // eslint-disable-next-line no-console
  console.log('DEBUG buildQuery ALL formData keys:', Object.keys(formData));
  // eslint-disable-next-line no-console
  console.log('DEBUG buildQuery comparison-related keys:', Object.keys(formData).filter(k => k.toLowerCase().includes('comparison')));

  return buildQueryContext(formData, baseQueryObject => {
    const queries = [
      {
        ...baseQueryObject,
        orderby: normalizeOrderBy(baseQueryObject).orderby,
      },
    ];

    const showComparisonRaw = (formData as any).show_comparison;
    const showComparison =
      showComparisonRaw === true || showComparisonRaw === 'true';

    if (showComparison) {
      // Read time_range from the already-resolved baseQueryObject, not
      // formData. On a dashboard, the native date filter is merged in via
      // extra_form_data and ends up on baseQueryObject.time_range — it
      // never touches formData.time_range (which stays whatever the
      // chart's own static default is, e.g. "No filter") and it never
      // touches the ad-hoc TEMPORAL_RANGE filter's val either (that stays
      // "No filter" too, as a placeholder). baseQueryObject.time_range is
      // therefore the one field that correctly reflects whichever source
      // — the dashboard's date slicer, or the chart's own Time Range
      // control — actually drove the main query's filtering.
      // eslint-disable-next-line no-console
      console.log('DEBUG baseQueryObject.time_range:', (baseQueryObject as any).time_range);
      // eslint-disable-next-line no-console
      console.log('DEBUG formData.time_range:', formData.time_range);

      const effectiveTimeRange =
        (baseQueryObject as any).time_range || (formData.time_range as string);
      const comparisonRange = getComparisonRange(effectiveTimeRange);

      // eslint-disable-next-line no-console
      console.log('DEBUG comparisonRange:', comparisonRange);

      if (comparisonRange) {
        queries.push({
          ...baseQueryObject,
          orderby: normalizeOrderBy(baseQueryObject).orderby,
          time_range: comparisonRange,
          extras: { ...baseQueryObject.extras } as QueryObjectExtras,
        });
      }
    }

    return queries;
  });
}