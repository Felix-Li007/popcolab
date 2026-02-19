'use client';

type DashboardHeaderProps = {
  userName?: string;
  date?: string;
};

export default function DashboardHeader({
  userName = 'Donavan',
  date = 'Wednesday, Feb 18 2026',
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-lavender via-white to-coral-light rounded-2xl p-4 border border-pink-light/50 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-gray-800">
          Welcome back, <span className="text-magenta">{userName}</span> 👋
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {date} · Here&apos;s what&apos;s happening today
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-magenta hover:bg-teal-deep transition-colors">
          <span>+</span> New Personality
        </button>
      </div>
    </div>
  );
}
