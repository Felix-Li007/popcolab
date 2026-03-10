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
    <div className="h-[300px] w-full">
      <ResponsivePie
        data={data}
        margin={{ top: 12, right: 12, bottom: 72, left: 12 }}
        innerRadius={0.58}
        padAngle={1.2}
        cornerRadius={4}
        activeOuterRadiusOffset={6}
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
