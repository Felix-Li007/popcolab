type ActivityItem = {
  title: string;
  subtitle: string;
  time: string;
  badge?: string;
  badgeVariant?: 'live' | 'updated' | 'added';
  icon: React.ReactNode;
};

const activities: ActivityItem[] = [
  {
    title: 'Joker updated',
    subtitle: '2 hours ago',
    time: '2h',
    badge: 'Live',
    badgeVariant: 'live',
    icon: <span className="text-base">🃏</span>,
  },
  {
    title: 'Kinesthete — achievement',
    subtitle: 'Yesterday',
    time: 'Yesterday',
    icon: <span className="text-base">💃</span>,
  },
  {
    title: 'Quiz Q7 edited',
    subtitle: '3 days ago',
    time: '3d',
    badge: 'Updated',
    badgeVariant: 'updated',
    icon: <span className="text-base">📝</span>,
  },
  {
    title: 'Collector — item added',
    subtitle: 'Last week',
    time: '1w',
    badge: '+1',
    badgeVariant: 'added',
    icon: <span className="text-base">🏅</span>,
  },
];

const badgeStyles: Record<string, string> = {
  live: 'bg-green-100 text-green-700',
  updated: 'bg-teal-deep/10 text-teal-deep',
  added: 'bg-pink-light text-magenta',
};

export default function RecentActivity() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-base">🔔</span>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Recent Activity
        </h3>
      </div>
      <ul className="space-y-2.5">
        {activities.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-sm">
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-800 truncate">
                  {item.title}
                </span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeStyles[item.badgeVariant ?? 'added']}`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-gray-400">{item.subtitle}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
