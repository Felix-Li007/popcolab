import styles from '@/styles/quiz-chart.module.css';
import type { OverviewQuizMetrics } from '@/types/overview-type';

type QuizChartProps = {
  metrics: OverviewQuizMetrics;
};

export default function QuizChart({ metrics }: QuizChartProps) {
  const maxValue = Math.max(...metrics.trend.map(item => item.value), 1);
  const changeLabel =
    metrics.weeklyChangePct === 0
      ? 'No change vs last week'
      : `${metrics.weeklyChangePct > 0 ? '↑' : '↓'} ${Math.abs(
          metrics.weeklyChangePct
        ).toFixed(1)}% vs last week`;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">🧠</span>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Assessment
        </h3>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold">
        <span
          className={
            metrics.weeklyChangePct > 0
              ? 'text-green-500'
              : metrics.weeklyChangePct < 0
                ? 'text-amber-600'
                : 'text-gray-400'
          }
        >
          {changeLabel}
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">
          {metrics.completionsThisWeek} this week
        </span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">{metrics.totalCompletions} total</span>
        <span className="text-gray-300">·</span>
        <span className="text-gray-500">
          {metrics.uniqueParticipants} participants
        </span>
      </div>
      <div className="flex h-20 items-end gap-1.5">
        {metrics.trend.map(item => {
          const heightPct = Math.round((item.value / maxValue) * 100);
          return (
            <div
              key={item.periodKey}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            >
              <div className="flex h-14 w-full items-end">
                <div
                  className={`w-full rounded-t-sm bg-magenta opacity-80 hover:opacity-100 transition-opacity ${styles.bar}`}
                  style={{
                    height: `${Math.max(heightPct, item.value > 0 ? 12 : 0)}%`,
                  }}
                  title={`${item.value} completions`}
                />
              </div>
              <span className="text-[9px] text-gray-400">
                {item.periodLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
