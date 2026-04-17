'use client';

import { useEffect, useState } from 'react';
import {
  getActiveEventsAction,
  getConfirmedBookingsAction,
} from '@/actions/event-actions';
import type { Event as EventType } from '@/types/event-type';
import {
  formatLocalDateValue,
  parseCalendarDateValue,
} from '@/utils/event-schedule';

type Booking = {
  event_id: number;
};

function getCalendarDateKey(value: string | Date | null | undefined) {
  if (!value) return '';

  const parsed = parseCalendarDateValue(value);
  return parsed ? formatLocalDateValue(parsed) : '';
}

function formatCalendarDateLabel(value: string | Date | null | undefined) {
  return getCalendarDateKey(value) || 'Invalid date';
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [eventData, bookingData] = await Promise.all([
          getActiveEventsAction(),
          getConfirmedBookingsAction(),
        ]);

        setEvents(eventData);
        setBookings(bookingData);
      } catch (error) {
        console.error('Failed to load dashboard events:', error);
      }
    };

    load();
  }, []);

  const isBooked = (eventId: number) => {
    return bookings.some(b => Number(b.event_id) === Number(eventId));
  };

  const handleBookingClick = (eventId: number) => {
    window.location.assign(`/dashboard/events/${eventId}`);
  };

  const filtered = events.filter(e => {
    if (!search) return true;

    const text = search.toLowerCase();

    const titleMatch = e.eventTitle?.toLowerCase().includes(text);
    const locationMatch = e.eventLocation?.toLowerCase().includes(text);
    const dateMatch = e.event_calendars?.some(d => {
      const dateStr = formatCalendarDateLabel(d.event_date).toLowerCase();
      return dateStr.includes(text);
    });

    return titleMatch || locationMatch || dateMatch;
  });

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="dashboard-section-eyebrow">Events workspace</p>
              <h1 className="mt-2 text-xl font-bold text-gray-800">Events</h1>
              <p className="mt-1 max-w-md text-xs text-[#E91E8C]">
                Browse live events, dates, and availability before viewing
                details
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.74))] shadow-[0_18px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl">
            <div className="p-3 sm:p-4">
              <div className="grid items-end gap-3 rounded-[1.1rem] border border-white/75 bg-white/80 p-3 xl:grid-cols-[minmax(340px,1fr)_auto]">
                <div className="flex min-w-0 items-center gap-3 overflow-hidden rounded-full border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.04)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    className="ml-4 h-4 w-4 shrink-0 text-slate-400"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="7" />
                    <path d="M20 20l-3.5-3.5" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by event name, location, or date..."
                    className="h-10 min-w-0 flex-1 border-0 bg-transparent pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                  <span className="mr-2 hidden rounded-full bg-[#fff5f9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#E91E8C] sm:inline-flex">
                    {filtered.length} results
                  </span>
                </div>

                <div className="flex items-end justify-start xl:justify-end">
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="h-10 min-w-[80px] rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-5 text-sm font-semibold text-slate-600 shadow-[0_10px_22px_rgba(15,23,42,0.04)] transition-colors hover:bg-slate-50"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="mt-3">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
                    <p className="text-sm font-semibold text-gray-500">
                      No events found.
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      Try another event name, location, or date.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-4">
                    {filtered.map(event => {
                      const cover =
                        event.event_galleries?.find(img => img.is_cover) ||
                        event.event_galleries?.[0];

                      const price = event.event_pricing?.[0]?.event_price || 0;

                      return (
                        <article
                          key={event.id}
                          className="group relative overflow-hidden rounded-[1.9rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.86),rgba(251,253,255,0.76))] shadow-[0_20px_55px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.1)]"
                        >
                          <div className="pointer-events-none absolute inset-x-10 top-0 h-18 rounded-full bg-white/55 blur-3xl" />

                          <div className="relative p-4 pb-3">
                            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/72 bg-slate-50 shadow-[0_14px_28px_rgba(15,23,42,0.05)]">
                              <img
                                src={
                                  cover?.image_url ||
                                  'https://via.placeholder.com/500'
                                }
                                alt={event.eventTitle}
                                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                              />

                              <span className="absolute left-3 top-3 inline-flex rounded-full border border-white/15 bg-teal-deep/92 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_20px_rgba(13,94,89,0.16)]">
                                {event.eventStatus}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4 px-4 pb-4">
                            <div className="space-y-2 border-b border-slate-200/60 pb-4">
                              <h2 className="font-museo text-[1.05rem] font-bold leading-snug tracking-[-0.025em] text-slate-900">
                                {event.eventTitle}
                              </h2>

                              <p className="text-sm font-medium text-slate-500">
                                {event.eventLocation}
                              </p>

                              <p className="line-clamp-2 text-sm text-slate-600">
                                {event.eventNotes || 'No description'}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {event.event_calendars?.map(d => (
                                <span
                                  key={d.id}
                                  className="inline-flex rounded-full border border-white/80 bg-white/78 px-3 py-1 text-[11px] font-semibold text-teal-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_8px_16px_rgba(13,94,89,0.05)] backdrop-blur-xl"
                                >
                                  {formatCalendarDateLabel(d.event_date)}
                                </span>
                              ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="rounded-[1.2rem] border border-white/75 bg-white/76 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_8px_18px_rgba(15,23,42,0.03)] backdrop-blur-xl">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                  Starting price
                                </p>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                  ${price}
                                </p>
                              </div>

                              <div className="rounded-[1.2rem] border border-white/75 bg-white/76 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_8px_18px_rgba(15,23,42,0.03)] backdrop-blur-xl">
                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                  Availability
                                </p>
                                <p className="mt-1 text-base font-bold text-slate-900">
                                  {event.event_calendars?.length ?? 0} dates
                                </p>
                              </div>
                            </div>

                            <div className="flex justify-end border-t border-slate-200/55 pt-4">
                              <button
                                onClick={() => handleBookingClick(event.id)}
                                className={`rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(15,23,42,0.14)] transition-all duration-200 hover:-translate-y-px ${
                                  isBooked(event.id)
                                    ? 'bg-teal-deep hover:bg-teal-medium'
                                    : 'bg-pink-medium hover:bg-magenta'
                                }`}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
