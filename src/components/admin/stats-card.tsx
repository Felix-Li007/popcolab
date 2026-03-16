import styles from '@/styles/admin/stats-card.module.css';

export type StatsCardProps = {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendLabel?: string;
  bgColor?: string;
  glowColor?: string;
};

export default function StatsCard({
  icon,
  value,
  label,
  trend,
  trendLabel,
  bgColor = 'bg-pink-50',
  glowColor = 'rgba(196, 181, 253, 0.4)',
}: StatsCardProps) {
  const isPositive = trend && !trend.startsWith('-');

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-start gap-3 ${styles.card}`}
      style={{ '--stat-glow': glowColor } as React.CSSProperties}
    >
      <div
        className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-gray-800 leading-tight">
          {value}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 mt-1 text-xs font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}
          >
            <span>{isPositive ? '↑' : '↓'}</span>
            <span>{trend}</span>
            {trendLabel && (
              <span className="text-gray-400 font-normal">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
