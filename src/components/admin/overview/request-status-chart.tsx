'use client';

import { REQUEST_STATUS } from '@/constants/request-status';
import { ResponsivePie } from '@nivo/pie';
import type { OverviewRequestStatusPoint } from '@/types/overview-type';

type Props = {
  data: OverviewRequestStatusPoint[];
};

const STATUS_COLOR_MAP: Record<OverviewRequestStatusPoint['id'], string> = {
  [REQUEST_STATUS.OPENED]: '#0f766e',
  [REQUEST_STATUS.PENDING]: '#f59e0b',
  [REQUEST_STATUS.MATCHED]: '#6366f1',
  [REQUEST_STATUS.CLOSED]: '#e9756e',
  unknown: '#9ca3af',
};

export default function RequestStatusChart({ data }: Props) {
  return (
    <div className="h-[300px] w-full rounded-[22px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96),rgba(248,250,252,0.92))] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_18px_36px_rgba(15,23,42,0.08)] [filter:drop-shadow(0_14px_20px_rgba(15,23,42,0.08))]">
      <ResponsivePie
        data={data}
        margin={{ top: 12, right: 12, bottom: 72, left: 12 }}
        innerRadius={0.58}
        padAngle={1.2}
        cornerRadius={4}
        activeOuterRadiusOffset={6}
        defs={[
          {
            id: 'openedGradient',
            type: 'linearGradient',
            colors: [
              { offset: 0, color: 'inherit', opacity: 1 },
              { offset: 100, color: 'inherit', opacity: 0.72 },
            ],
          },
          {
            id: 'pendingGradient',
            type: 'linearGradient',
            colors: [
              { offset: 0, color: 'inherit', opacity: 1 },
              { offset: 100, color: 'inherit', opacity: 0.72 },
            ],
          },
          {
            id: 'matchedGradient',
            type: 'linearGradient',
            colors: [
              { offset: 0, color: 'inherit', opacity: 1 },
              { offset: 100, color: 'inherit', opacity: 0.72 },
            ],
          },
          {
            id: 'closedGradient',
            type: 'linearGradient',
            colors: [
              { offset: 0, color: 'inherit', opacity: 1 },
              { offset: 100, color: 'inherit', opacity: 0.72 },
            ],
          },
          {
            id: 'unknownGradient',
            type: 'linearGradient',
            colors: [
              { offset: 0, color: 'inherit', opacity: 1 },
              { offset: 100, color: 'inherit', opacity: 0.72 },
            ],
          },
        ]}
        fill={[
          { match: { id: REQUEST_STATUS.OPENED }, id: 'openedGradient' },
          { match: { id: REQUEST_STATUS.PENDING }, id: 'pendingGradient' },
          { match: { id: REQUEST_STATUS.MATCHED }, id: 'matchedGradient' },
          { match: { id: REQUEST_STATUS.CLOSED }, id: 'closedGradient' },
          { match: { id: 'unknown' }, id: 'unknownGradient' },
        ]}
        colors={datum =>
          STATUS_COLOR_MAP[datum.id as OverviewRequestStatusPoint['id']]
        }
        borderWidth={2}
        borderColor={{ from: 'color', modifiers: [['darker', 0.12]] }}
        enableArcLabels={false}
        arcLinkLabelsSkipAngle={360}
        theme={{
          text: {
            fontSize: 12,
            fill: '#6b7280',
          },
          tooltip: {
            container: {
              background: '#ffffff',
              color: '#111827',
              borderRadius: '14px',
              boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16)',
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
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 58,
            itemsSpacing: 12,
            itemWidth: 92,
            itemHeight: 18,
            itemTextColor: '#4b5563',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 12,
            symbolShape: 'circle',
          },
        ]}
      />
    </div>
  );
}
