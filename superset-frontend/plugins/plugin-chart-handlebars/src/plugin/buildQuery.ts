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
  return buildQueryContext(formData, baseQueryObject => {
    const queries = [
      {
        ...baseQueryObject,
        orderby: normalizeOrderBy(baseQueryObject).orderby,
      },
    ];

    if ((formData as any).show_comparison) {
      const comparisonRange = getComparisonRange(formData.time_range as string);
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