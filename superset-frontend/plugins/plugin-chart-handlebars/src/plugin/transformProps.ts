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
import { ChartProps, TimeseriesDataRecord } from '@superset-ui/core';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, formData, queriesData } = chartProps;
  const data = queriesData[0].data as TimeseriesDataRecord[];

  const showComparison = (formData as any).show_comparison;
  const comparisonMetric = (formData as any).comparison_metric as string | undefined;

  console.log('DEBUG showComparison:', showComparison);
  console.log('DEBUG comparisonMetric:', comparisonMetric);
  console.log('DEBUG queriesData.length:', queriesData.length);
  console.log('DEBUG data[0]:', data[0]);

  let comparisonPct: number | null = null;

  if (showComparison && queriesData.length > 1 && data[0]) {
    const priorData = queriesData[1].data as TimeseriesDataRecord[];
    const metricKey = comparisonMetric || Object.keys(data[0])[0];

    console.log('DEBUG priorData[0]:', priorData[0]);
    console.log('DEBUG metricKey:', metricKey);

    const current = data[0]?.[metricKey] as number | undefined;
    const prior = priorData[0]?.[metricKey] as number | undefined;

    console.log('DEBUG current:', current, 'prior:', prior);

    if (current != null && prior != null && prior !== 0) {
      comparisonPct = ((current - prior) / prior) * 100;
    }
  } else {
  console.log('DEBUG: comparison block skipped entirely — check the condition above');
}

  console.log('DEBUG comparisonPct final:', comparisonPct);


  return {
    width,
    height,
    data,
    formData,
    comparisonPct,
    hasComparison: comparisonPct !== null,
  };
}