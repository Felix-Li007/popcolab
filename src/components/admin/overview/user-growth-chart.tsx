'use client';

import { ResponsiveBar, type BarCustomLayer } from '@nivo/bar';
import type { OverviewGrowthPoint } from '@/types/overview-type';

type Props = {
  data: OverviewGrowthPoint[];
};

type GrowthChartDatum = {
  month: string;
  Users: number;
  Teams: number;
};

const BAR_COLORS: Record<'Users' | 'Teams', string> = {
  Users: '#0f766e',
  Teams: '#e9756e',
};

const LINE_COLORS: Record<'Users' | 'Teams', string> = {
  Users: '#115e59',
  Teams: '#be4b43',
};

const GrowthTrendLayer: BarCustomLayer<GrowthChartDatum> = ({ bars }) => {
  const seriesMap = bars.reduce<
    Map<
      'Users' | 'Teams',
      Array<{ x: number; y: number; value: number; month: string }>
    >
  >((acc, bar) => {
    const id = String(bar.data.id);
    if (id !== 'Users' && id !== 'Teams') return acc;

    const points = acc.get(id) ?? [];
    points.push({
      x: bar.x + bar.width / 2,
      y: bar.y,
      value: typeof bar.data.value === 'number' ? bar.data.value : 0,
      month: String(bar.data.indexValue),
    });
    acc.set(id, points);
    return acc;
  }, new Map());

  return (
    <g pointerEvents="none">
      {(['Users', 'Teams'] as const).map(id => {
        const points = (seriesMap.get(id) ?? []).sort((a, b) => a.x - b.x);
        if (points.length === 0) return null;

        const path = points
          .map(
            (point, index) =>
              `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
          )
          .join(' ');

        const latestPoint = points[points.length - 1];

        return (
          <g key={id}>
            <path
              d={path}
              fill="none"
              stroke={LINE_COLORS[id]}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map(point => (
              <g
                key={`${id}-${point.month}`}
                transform={`translate(${point.x}, ${point.y})`}
              >
                <circle
                  r={5}
                  fill="#ffffff"
                  stroke={LINE_COLORS[id]}
                  strokeWidth={3}
                />
                <circle r={1.75} fill={LINE_COLORS[id]} />
              </g>
            ))}
            <g transform={`translate(${latestPoint.x}, ${latestPoint.y})`}>
              <rect
                x={id === 'Users' ? -44 : 10}
                y={-30}
                width={34}
                height={20}
                rx={10}
                fill={id === 'Users' ? '#ccfbf1' : '#ffe4e6'}
                stroke={id === 'Users' ? '#5eead4' : '#fda4af'}
              />
              <text
                x={id === 'Users' ? -27 : 27}
                y={-16}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={LINE_COLORS[id]}
              >
                {latestPoint.value}
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};

export default function PlatformGrowthChart({ data }: Props) {
  const chartData: GrowthChartDatum[] = data.map(point => ({
    month: point.monthLabel,
    Users: point.users,
    Teams: point.teams,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveBar
        data={chartData}
        keys={['Users', 'Teams']}
        indexBy="month"
        margin={{ top: 22, right: 28, bottom: 50, left: 44 }}
        colors={({ id }) => BAR_COLORS[id as 'Users' | 'Teams']}
        padding={0.32}
        innerPadding={6}
        borderRadius={8}
        borderWidth={0}
        groupMode="grouped"
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        enableLabel={false}
        isInteractive
        animate
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
          legend: 'Created',
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
            anchor: 'top-left',
            dataFrom: 'keys',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: -12,
            itemsSpacing: 14,
            itemDirection: 'left-to-right',
            itemWidth: 74,
            itemHeight: 18,
            itemOpacity: 1,
            symbolSize: 10,
            symbolShape: 'circle',
          },
        ]}
        layers={[
          'grid',
          'axes',
          'bars',
          GrowthTrendLayer,
          'markers',
          'legends',
          'annotations',
        ]}
      />
    </div>
  );
}
