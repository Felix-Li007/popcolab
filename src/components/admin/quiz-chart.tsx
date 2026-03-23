import styles from '@/styles/quiz-chart.module.css';
import type { OverviewQuizMetrics } from '@/types/overview-type';

type QuizChartProps = {
  metrics: OverviewQuizMetrics;
};

export default function QuizChart({ metrics }: Readonly<QuizChartProps>) {
  const maxValue = Math.max(...metrics.trend.map(item => item.value), 1);
  let changeLabel = 'No change vs last week';
  let changeTextClassName = 'text-gray-400';

  if (metrics.weeklyChangePct > 0) {
    changeLabel = `↑ ${Math.abs(metrics.weeklyChangePct).toFixed(1)}% vs last week`;
    changeTextClassName = 'text-green-500';
  } else if (metrics.weeklyChangePct < 0) {
    changeLabel = `↓ ${Math.abs(metrics.weeklyChangePct).toFixed(1)}% vs last week`;
    changeTextClassName = 'text-amber-600';
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">🧠</span>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Assessment
        </h3>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold">
        <span className={changeTextClassName}>{changeLabel}</span>
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
              <div className="flex h-14 w-full items-end rounded-md bg-gradient-to-b from-white via-fuchsia-50/30 to-gray-100/90 px-1 pb-1 shadow-[inset_0_1px_3px_rgba(255,255,255,0.85),inset_0_-1px_3px_rgba(15,23,42,0.08)]">
                <div
                  className={`relative w-full overflow-hidden rounded-t-[0.4rem] bg-gradient-to-t from-fuchsia-600 via-magenta to-pink-300 shadow-[0_10px_18px_rgba(217,70,239,0.24)] transition-opacity hover:opacity-100 ${styles.bar}`}
                  style={{
                    height: `${Math.max(heightPct, item.value > 0 ? 12 : 0)}%`,
                  }}
                  title={`${item.value} completions`}
                >
                  <div className="absolute inset-x-[20%] top-0.5 h-1.5 rounded-full bg-white/40 blur-[2px]" />
                </div>
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
