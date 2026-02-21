import styles from '@/styles/quiz-chart.module.css';

const weekData = [
  { day: 'M', value: 28 },
  { day: 'T', value: 45 },
  { day: 'W', value: 35 },
  { day: 'T', value: 60 },
  { day: 'F', value: 55 },
  { day: 'S', value: 40 },
  { day: 'S', value: 30 },
];

const maxValue = Math.max(...weekData.map(d => d.value));

export default function QuizChart() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-base">📊</span>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Quiz – This Week
        </h3>
      </div>
      <div className="text-[10px] text-green-500 font-semibold mb-3">
        ↑ 18% vs last week · 347 total
      </div>
      <div className="flex items-end gap-1.5 h-16">
        {weekData.map((d, i) => {
          const heightPct = Math.round((d.value / maxValue) * 100);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-sm bg-magenta opacity-80 hover:opacity-100 transition-opacity ${styles.bar}`}
                style={{ height: `${heightPct}%` }}
                title={`${d.value} completions`}
              />
              <span className="text-[9px] text-gray-400">{d.day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
