'use client';

import { useEffect, useState } from 'react';
import {
  getActiveEventsAction,
  getConfirmedBookingsAction,
} from '@/actions/event-actions';
import {
  formatLocalDateValue,
  parseCalendarDateValue,
} from '@/utils/event-schedule';

// ✅ TYPES
type EventCalendar = {
  id: number;
  event_date: string;
};

type EventGallery = {
  image_url: string;
  is_cover?: boolean;
};

type EventPricing = {
  event_price: number;
};

type EventType = {
  id: number;
  eventTitle: string;
  eventLocation: string;
  eventNotes?: string;
  eventStatus: string;
  event_calendars?: EventCalendar[];
  event_galleries?: EventGallery[];
  event_pricing?: EventPricing[];
};

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

        setEvents(eventData as EventType[]);
        setBookings(bookingData as Booking[]);
      } catch (error) {
        console.error('Failed to load dashboard events:', error);
      }
    };

    load();
  }, []);

  // ✅ check if booked
  const isBooked = (eventId: number) => {
    return bookings.some(b => Number(b.event_id) === Number(eventId));
  };

  // ✅ UPDATED CLICK HANDLER
  const handleBookingClick = (eventId: number) => {
    const clickedEvent = events.find(e => e.id === eventId);

    if (!clickedEvent) return;

    const selectedDate = clickedEvent.event_calendars?.[0]?.event_date;
    const selectedDateKey = getCalendarDateKey(selectedDate);

    if (!selectedDateKey) {
      window.alert('This event does not have a valid schedule date.');
      return;
    }

    const sameDateEvents = events.filter(e => {
      if (e.id === eventId) return false;

      return e.event_calendars?.some(d => {
        return getCalendarDateKey(d.event_date) === selectedDateKey;
      });
    });

    if (sameDateEvents.length > 0) {
      const confirmSameDate = window.confirm(
        `There are ${sameDateEvents.length} other event(s) on this date. Do you want to continue?`
      );

      if (!confirmSameDate) return;
    }

    if (isBooked(eventId)) {
      const confirmBooking = window.confirm(
        'You already booked this event. Do you want to add more tickets?'
      );

      if (!confirmBooking) return;
    }

    window.location.assign(`/dashboard/events/${eventId}`);
  };

  // ✅ search filter
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
    <>
      <section className="relative overflow-hidden rounded-[1.9rem] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.84),rgba(255,245,250,0.72))] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-xl sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.3em] text-teal-deep/70">
              Discover events
            </p>
            <h1 className="font-museo text-[1.2rem] font-bold tracking-[-0.03em] text-slate-900">
              Browse upcoming events
            </h1>
            <p className="max-w-2xl text-sm font-medium text-slate-600">
              Explore live dates, locations, and ticket availability in a
              cleaner glass-style workspace.
            </p>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/78 bg-[linear-gradient(180deg,rgba(255,255,255,0.84),rgba(248,250,252,0.76))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_12px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl xl:max-w-xl">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <input
              type="text"
              placeholder="Search by event name, location, or date..."
              className="min-w-0 flex-1 border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="hidden rounded-full border border-white/85 bg-white/76 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-teal-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl sm:inline-flex">
              {filtered.length} results
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                    src={cover?.image_url || 'https://via.placeholder.com/500'}
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
                    {isBooked(event.id) ? 'Booked Event' : 'Book Now'}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
