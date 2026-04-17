'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getEventByIdAction } from '@/actions/event-actions';
import type { Event } from '@/types/event-type';
import {
  formatLocalDateValue,
  formatScheduleTimeValue,
  parseCalendarDateValue,
} from '@/utils/event-schedule';
import { showBookingUnavailable } from '@/utils/booking-unavailable';

type EventCalendar = {
  id: number;
  event_date: string | Date;
  start_time: string | Date;
  end_time: string | Date;
};

type EventGallery = {
  id: number;
  image_url: string;
  image_alt?: string | null;
  is_cover?: boolean;
};

type EventDetails = {
  id: number;
  eventTitle: string;
  eventLocation: string;
  eventNotes?: string | null;
  event_galleries?: EventGallery[];
  event_calendars?: EventCalendar[];
  event_pricing?: Event['event_pricing'];
};

function getCalendarDateKey(value: string | Date | null | undefined) {
  if (!value) return '';

  const parsed = parseCalendarDateValue(value);
  return parsed ? formatLocalDateValue(parsed) : '';
}

function formatCalendarDateLabel(value: string | Date | null | undefined) {
  return getCalendarDateKey(value) || 'Invalid date';
}

function formatCalendarTimeLabel(value: string | Date | null | undefined) {
  if (!value) return 'Invalid time';

  const formatted = formatScheduleTimeValue(value);
  return formatted || 'Invalid time';
}

export default function EventDetailsPage() {
  const params = useParams();

  const eventId =
    typeof params?.eventId === 'string'
      ? params.eventId
      : Array.isArray(params?.eventId)
        ? params.eventId[0]
        : undefined;
  const [event, setEvent] = useState<EventDetails | null>(null);

  useEffect(() => {
    if (!eventId) return;

    getEventByIdAction(Number(eventId))
      .then(data => {
        if (!data) return;
        setEvent(data);
      })
      .catch(error => {
        console.error('Failed to load event details:', error);
      });
  }, [eventId]);

  if (!event) return <p className="p-6">Loading...</p>;

  const cover =
    event.event_galleries?.find(img => img.is_cover) ||
    event.event_galleries?.[0];
  const sideGalleryImages =
    event.event_galleries?.filter(img => !img.is_cover) ?? [];
  const startingPrice =
    event.event_pricing && event.event_pricing.length > 0
      ? Math.min(...event.event_pricing.map(price => Number(price.event_price)))
      : null;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7fb_0%,#fffdf8_22%,#f8fafc_100%)] px-3 py-4 sm:px-4 sm:py-5">
      <div className="mb-4">
        <Link
          href="/dashboard/events"
          className="inline-flex items-center rounded-full border border-white/80 bg-white/78 px-4 py-2 text-sm font-medium text-teal-deep shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_10px_22px_rgba(15,23,42,0.05)] backdrop-blur-xl transition hover:-translate-y-px hover:bg-white/92"
        >
          Back to events
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(16rem,0.72fr)]">
        <div className="space-y-5">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,252,255,0.82))] shadow-[0_28px_70px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-x-12 top-0 h-24 rounded-full bg-white/55 blur-3xl" />

            <div className="relative overflow-hidden rounded-b-[2rem] rounded-t-[2rem]">
              <Image
                src={cover?.image_url || 'https://via.placeholder.com/900'}
                alt={event.eventTitle || 'Event cover'}
                width={1600}
                height={1040}
                unoptimized
                className="h-[26rem] w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.05),transparent_28%,rgba(15,23,42,0.35))]" />
              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="inline-flex rounded-full border border-white/18 bg-white/14 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em] text-white shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-xl">
                  Event Details
                </div>
                <h1 className="mt-4 font-museo text-[2rem] font-bold tracking-[-0.04em] text-white drop-shadow-[0_12px_28px_rgba(15,23,42,0.34)] sm:text-[2.8rem]">
                  {event.eventTitle}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex rounded-full border border-white/18 bg-white/14 px-3 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-xl">
                    {event.eventLocation}
                  </span>
                  {startingPrice !== null ? (
                    <span className="inline-flex rounded-full border border-white/18 bg-white/14 px-3 py-1 text-[11px] font-semibold text-white/95 backdrop-blur-xl">
                      From ${startingPrice}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
              <div className="rounded-[1.6rem] border border-white/72 bg-[linear-gradient(135deg,rgba(255,245,250,0.8),rgba(255,255,255,0.78))] px-5 py-5 shadow-[0_14px_30px_rgba(15,23,42,0.04)] backdrop-blur-xl">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.24em] text-rose-500">
                  About
                </h2>
                <p className="mt-3 text-base leading-7 text-slate-600">
                  {event.eventNotes || 'No description'}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,254,255,0.84))] p-5 shadow-[0_22px_54px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
            <h3 className="font-museo text-[1.05rem] font-bold text-slate-900">
              Location
            </h3>
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                event.eventLocation
              )}&output=embed`}
              title={`${event.eventTitle} location map`}
              className="mt-4 h-[320px] w-full rounded-[1.5rem] border border-white/70 shadow-[0_14px_28px_rgba(15,23,42,0.05)]"
            />
          </section>
        </div>

        <aside className="space-y-5 2xl:sticky 2xl:top-6 2xl:self-start">
          <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,254,255,0.84))] p-5 shadow-[0_22px_54px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
            <h2 className="font-museo text-[1.05rem] font-bold text-slate-900">
              Event Schedule
            </h2>

            <div className="mt-4 space-y-3">
              {event.event_calendars && event.event_calendars.length > 0 ? (
                event.event_calendars.map(calendar => (
                  <div
                    key={calendar.id}
                    className="rounded-[1.35rem] border border-white/75 bg-white/76 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl"
                  >
                    <p className="font-medium text-slate-900">
                      {formatCalendarDateLabel(calendar.event_date)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatCalendarTimeLabel(calendar.start_time)} -{' '}
                      {formatCalendarTimeLabel(calendar.end_time)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  No schedule has been published yet.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(252,254,255,0.84))] p-5 shadow-[0_22px_54px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
            <h2 className="font-museo text-[1.05rem] font-bold text-slate-900">
              Photo Gallery
            </h2>

            {sideGalleryImages.length > 0 ? (
              <div className="mt-4 space-y-3">
                <Image
                  src={sideGalleryImages[0].image_url}
                  alt={
                    sideGalleryImages[0].image_alt ||
                    `${event.eventTitle} gallery image`
                  }
                  width={960}
                  height={640}
                  unoptimized
                  className="h-64 w-full rounded-[1.5rem] border border-white/72 object-cover shadow-[0_14px_28px_rgba(15,23,42,0.05)]"
                />

                {sideGalleryImages.length > 1 ? (
                  <div className="max-h-[22rem] overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 gap-3">
                      {sideGalleryImages.slice(1).map(img => (
                        <Image
                          key={img.id}
                          src={img.image_url}
                          alt={
                            img.image_alt || `${event.eventTitle} gallery image`
                          }
                          width={480}
                          height={320}
                          unoptimized
                          className="h-32 w-full rounded-[1rem] border border-white/72 object-cover shadow-[0_10px_20px_rgba(15,23,42,0.04)]"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 flex h-64 items-center justify-center rounded-[1.35rem] border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No gallery images available.
              </div>
            )}
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,247,251,0.9),rgba(255,255,255,0.86))] p-5 shadow-[0_24px_54px_rgba(244,63,94,0.12),inset_0_1px_0_rgba(255,255,255,0.82)] backdrop-blur-xl">
            <h2 className="font-museo text-[1.05rem] font-bold text-slate-900">
              Book This Event
            </h2>

            <div className="mt-4 space-y-3">
              {event.event_pricing && event.event_pricing.length > 0 ? (
                event.event_pricing.map(price => (
                  <div
                    key={price.id}
                    className="flex items-center justify-between rounded-[1.35rem] border border-white/76 bg-white/74 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84),0_10px_22px_rgba(15,23,42,0.03)] backdrop-blur-xl"
                  >
                    <span className="font-medium text-slate-900">
                      {price.price_level}
                    </span>
                    <span className="font-semibold text-rose-600">
                      ${Number(price.event_price)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                  Ticket pricing is not available yet.
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => showBookingUnavailable(event.eventTitle)}
              className="mt-5 block w-full rounded-full bg-pink-medium py-3 text-center font-semibold text-white shadow-[0_16px_32px_rgba(219,39,119,0.22)] transition hover:-translate-y-px hover:bg-magenta"
            >
              Book an Event
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
}
