"use client";

import { useEffect, useState } from "react";

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

export default function EventsPage() {
  
  const [events, setEvents] = useState<EventType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data: EventType[]) => setEvents(data));

    fetch("/api/bookings")
      .then((res) => res.json())
      .then((data: Booking[]) => setBookings(data));
  }, []);

  // ✅ check if booked
  const isBooked = (eventId: number) => {
    return bookings.some(
      (b) => Number(b.event_id) === Number(eventId)
    );
  };

  // ✅ UPDATED CLICK HANDLER 
  const handleBookingClick = (eventId: number) => {
    const clickedEvent = events.find((e) => e.id === eventId);

    if (!clickedEvent) return;

    const selectedDate =
      clickedEvent.event_calendars?.[0]?.event_date;

    const sameDateEvents = events.filter((e) => {
      if (e.id === eventId) return false;

      return e.event_calendars?.some((d) => {
        return (
          new Date(d.event_date).toDateString() ===
          new Date(selectedDate || "").toDateString()
        );
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
        "You already booked this event. Do you want to add more tickets?"
      );

      if (!confirmBooking) return;
    }

    
    window.location.assign(`/dashboard/events/${eventId}`);
  };

  // ✅ search filter 
  const filtered = events.filter((e) => {
    if (!search) return true;

    const text = search.toLowerCase();

    const titleMatch = e.eventTitle
      ?.toLowerCase()
      .includes(text);

    const locationMatch = e.eventLocation
      ?.toLowerCase()
      .includes(text);

    const dateMatch = e.event_calendars?.some((d) => {
      const dateStr = new Date(d.event_date)
        .toLocaleDateString()
        .toLowerCase();

      const timeStr = new Date(d.event_date)
        .toLocaleTimeString()
        .toLowerCase();

      return dateStr.includes(text) || timeStr.includes(text);
    });

    return titleMatch || locationMatch || dateMatch;
  });

  return (
    <div className="p-6 space-y-6">

      {/* 🔍 SEARCH BAR */}
      <div className="flex items-center bg-white p-4 rounded-xl shadow">
        <input
          type="text"
          placeholder="Search by event name, location, date, or time..."
          className="border px-3 py-2 rounded-lg flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* 🎯 EVENTS GRID */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((event) => {
          const cover =
            event.event_galleries?.find((img) => img.is_cover) ||
            event.event_galleries?.[0];

          const price = event.event_pricing?.[0]?.event_price || 0;

          return (
            <div
              key={event.id}
              className="bg-white rounded-2xl shadow hover:shadow-xl transition overflow-hidden"
            >
              {/* IMAGE */}
              <div className="relative">
                <img
                  src={
                    cover?.image_url ||
                    "https://via.placeholder.com/500"
                  }
                  alt="event"
                  className="w-full h-52 object-cover"
                />

                <span className="absolute top-3 left-3 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                  {event.eventStatus}
                </span>
              </div>

              {/* CONTENT */}
              <div className="p-4 space-y-2">

                <h2 className="font-bold text-lg">
                  {event.eventTitle}
                </h2>

                <p className="text-sm text-gray-500">
                  📍 {event.eventLocation}
                </p>

                <p className="text-sm text-gray-600 line-clamp-2">
                  {event.eventNotes || "No description"}
                </p>

                {/* DATES */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {event.event_calendars?.map((d) => (
                    <span
                      key={d.id}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {new Date(d.event_date).toLocaleDateString()}
                    </span>
                  ))}
                </div>

                {/* PRICE */}
                <p className="font-semibold mt-2">
                  ${price}
                </p>

                {/* BUTTON */}
                <button
                  onClick={() => handleBookingClick(event.id)}
                  className={`w-full mt-3 py-2 rounded-lg text-white transition ${
                    isBooked(event.id)
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-black hover:bg-gray-800"
                  }`}
                >
                  {isBooked(event.id)
                    ? "Booked Event"
                    : "Book Now"}
                </button>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}