export type EventStatus = 'live' | 'upcoming' | 'draft';

export type Event = {
  name: string;
  date: string;
  location: string;
  status: EventStatus;
};

const events: Event[] = [
  {
    name: 'LinkedIn + Cocktail Night',
    date: 'Feb 18',
    location: 'Richardson Centre',
    status: 'live',
  },
  {
    name: 'Co-op Mode – Video Game',
    date: 'Feb 26',
    location: 'Pop CoLab HQ',
    status: 'upcoming',
  },
  {
    name: 'Biz Moms Club',
    date: 'Feb 27',
    location: 'Richardson Centre',
    status: 'upcoming',
  },
  {
    name: 'Retro Pixels Exhibition',
    date: 'Feb 27',
    location: 'Pop CoLab HQ',
    status: 'draft',
  },
];

const statusConfig: Record<EventStatus, { label: string; className: string }> =
  {
    live: { label: '● Live Today', className: 'bg-green-100 text-green-700' },
    upcoming: {
      label: 'Upcoming',
      className: 'bg-brand-yellow/40 text-teal-deep',
    },
    draft: { label: 'Draft', className: 'bg-grey-light/60 text-gray-500' },
  };

export default function EventTable() {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">📅</span>
        <h2 className="text-sm font-bold text-gray-800">Upcoming Events</h2>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-teal-deep text-white">
                <th className="text-left px-4 py-2.5 font-semibold">Event</th>
                <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                <th className="text-left px-4 py-2.5 font-semibold">
                  Location
                </th>
                <th className="text-left px-4 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => {
                const status = statusConfig[event.status];
                return (
                  <tr
                    key={i}
                    className="border-t border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800 font-semibold">
                      {event.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{event.date}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {event.location}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
