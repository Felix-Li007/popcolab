'use client';

import { ResponsiveBar } from '@nivo/bar';
import {
  REQUEST_STATUS,
  REQUEST_STATUS_OPTIONS,
  type RequestStatus,
} from '@/constants/request-status';
import type { OverviewRequestTrendPoint } from '@/types/overview-type';

type Props = {
  data: OverviewRequestTrendPoint[];
};

const STATUS_COLOR_MAP: Record<RequestStatus, string> = {
  [REQUEST_STATUS.OPENED]: '#0f766e',
  [REQUEST_STATUS.PENDING]: '#f59e0b',
  [REQUEST_STATUS.MATCHED]: '#6366f1',
  [REQUEST_STATUS.CLOSED]: '#e9756e',
};

const CHART_KEYS = REQUEST_STATUS_OPTIONS.map(option => option.value);

export default function RequestStatusTrendChart({ data }: Props) {
  return (
    <div className="h-[280px] w-full">
      <ResponsiveBar
        data={data}
        keys={CHART_KEYS}
        indexBy="monthLabel"
        margin={{ top: 22, right: 18, bottom: 46, left: 40 }}
        padding={0.32}
        innerPadding={2}
        borderRadius={6}
        borderWidth={0}
        groupMode="stacked"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        enableLabel={false}
        colors={bar => STATUS_COLOR_MAP[bar.id as RequestStatus]}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 0,
          tickPadding: 12,
          legend: 'Month',
          legendOffset: 38,
          legendPosition: 'middle',
        }}
        axisLeft={{
          tickSize: 0,
          tickPadding: 10,
          legend: 'Requests',
          legendOffset: -36,
          legendPosition: 'middle',
        }}
        gridXValues={[]}
        theme={{
          background: 'transparent',
          text: {
            fontSize: 12,
            fill: '#6b7280',
          },
          axis: {
            domain: {
              line: {
                stroke: '#d1d5db',
                strokeWidth: 1,
              },
            },
            ticks: {
              line: {
                stroke: '#d1d5db',
                strokeWidth: 1,
              },
              text: {
                fill: '#6b7280',
              },
            },
            legend: {
              text: {
                fill: '#4b5563',
                fontSize: 12,
                fontWeight: 600,
              },
            },
          },
          grid: {
            line: {
              stroke: '#e5e7eb',
              strokeWidth: 1,
              strokeDasharray: '4 6',
            },
          },
          tooltip: {
            container: {
              background: '#ffffff',
              color: '#111827',
              borderRadius: '14px',
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
              padding: '10px 12px',
            },
          },
          legends: {
            text: {
              fill: '#4b5563',
              fontSize: 12,
            },
          },
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'top-left',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: -12,
            itemsSpacing: 12,
            itemWidth: 88,
            itemHeight: 18,
            itemOpacity: 1,
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
      />
    </div>
  );
}
