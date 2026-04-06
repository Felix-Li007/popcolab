"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function EventDetailsPage() {
    const params = useParams();

const eventId =
    typeof params?.eventId === "string"
        ? params.eventId
        : Array.isArray(params?.eventId)
        ? params.eventId[0]
        : undefined;
    const [event, setEvent] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<any>(null);
    const [selectedPrice, setSelectedPrice] = useState<any>(null);
    const [quantity, setQuantity] = useState(1);
    const [ticketQty, setTicketQty] = useState<any>({});

    // ✅ EXISTING
    const [alreadyBooked, setAlreadyBooked] = useState(false);

    // ✅ ADDED
    const [sameDateEvents, setSameDateEvents] = useState<any[]>([]);

    useEffect(() => {
        if (!eventId) return;

        fetch(`/api/events/${eventId}`)
            .then((res) => res.json())
            .then((data) => {
                setEvent(data);
                setSelectedDate(data?.event_calendars?.[0]);

                const initial: any = {};
                data?.event_pricing?.forEach((p: any) => {
                    initial[p.id] = 0;
                });
                setTicketQty(initial);
            });
    }, [eventId]);

    // ✅ EXISTING
    useEffect(() => {
        if (!eventId || !selectedDate) return;

        fetch("/api/bookings")
            .then((res) => res.json())
            .then((bookings) => {
                const found = bookings.find(
                    (b: any) =>
                        Number(b.event_id) === Number(eventId) &&
                        new Date(b.event_date).toISOString().split("T")[0] ===
                            new Date(selectedDate.event_date).toISOString().split("T")[0] &&
                        b.status === "CONFIRMED"
                );

                setAlreadyBooked(!!found);
            });
    }, [eventId, selectedDate]);

    // ✅ ADDED (same date events)
    useEffect(() => {
        if (!event || !selectedDate) return;

        fetch("/api/events")
            .then((res) => res.json())
            .then((allEvents) => {
                const filtered = allEvents.filter((e: any) => {
                    if (e.id === event.id) return false;

                    return e.event_calendars?.some((d: any) => {
                        return (
                            new Date(d.event_date).toDateString() ===
                            new Date(selectedDate.event_date).toDateString()
                        );
                    });
                });

                setSameDateEvents(filtered);
            });
    }, [event, selectedDate]);

    if (!event) return <p className="p-6">Loading...</p>;

    const cover =
        event.event_galleries?.find((img: any) => img.is_cover) ||
        event.event_galleries?.[0];

   const subtotal = (event.event_pricing || []).reduce(
        (sum: number, p: any) =>
            sum + (ticketQty[p.id] || 0) * Number(p.event_price),
        0
    );

    const fee = Math.round(subtotal * 0.1);
    const total = subtotal + fee;

    const updateQty = (id: number, type: "inc" | "dec") => {
        setTicketQty((prev: any) => ({
            ...prev,
            [id]:
                type === "inc"
                    ? prev[id] + 1
                    : Math.max(0, prev[id] - 1),
        }));
    };

    return (
        <div className="max-w-7xl mx-auto p-6 grid md:grid-cols-3 gap-8">

            {/* ================= LEFT ================= */}
            <div className="md:col-span-2 space-y-6">

                <img
                    src={cover?.image_url || "https://via.placeholder.com/900"}
                    className="w-full h-[400px] object-cover rounded-2xl"
                />

                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">{event.eventTitle}</h1>

                    {alreadyBooked && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs">
                            Already Booked
                        </span>
                    )}
                </div>

                <p className="text-gray-500 mt-1">📍 {event.eventLocation}</p>

                <div className="bg-white p-5 rounded-xl shadow">
                    <h3 className="font-semibold mb-2">About this event</h3>
                    <p className="text-gray-600">
                        {event.eventNotes || "No description"}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-xl shadow">
                    <h3 className="font-semibold mb-3">Photo Gallery</h3>
                    <div className="flex gap-3">
                        {event.event_galleries?.map((img: any) => (
                            <img
                                key={img.id}
                                src={img.image_url}
                                className="w-24 h-24 rounded-lg object-cover"
                            />
                        ))}
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow">
                    <h3 className="font-semibold mb-3">Location</h3>
                    <iframe
                        src={`https://www.google.com/maps?q=${encodeURIComponent(
                            event.eventLocation
                        )}&output=embed`}
                        className="w-full h-[300px] rounded-lg"
                    />
                </div>

                {/* ✅ ADDED SAME DATE EVENTS */}
                {sameDateEvents.length > 0 && (
                    <div className="bg-white p-5 rounded-xl shadow">
                        <h3 className="font-semibold mb-4">
                            Other Events on Same Date
                        </h3>

                        <div className="grid md:grid-cols-2 gap-4">
                            {sameDateEvents.map((e: any) => {
                                const img =
                                    e.event_galleries?.[0]?.image_url ||
                                    "https://via.placeholder.com/300";

                                const price =
                                    e.event_pricing?.[0]?.event_price || 0;

                                return (
                                    <div
                                        key={e.id}
                                        className="border rounded-lg overflow-hidden"
                                    >
                                        <img
                                            src={img}
                                            className="w-full h-32 object-cover"
                                        />

                                        <div className="p-3 space-y-1">
                                            <p className="font-semibold">
                                                {e.eventTitle}
                                            </p>

                                            <p className="text-xs text-gray-500">
                                                📍 {e.eventLocation}
                                            </p>

                                            <p className="text-pink-600 font-bold">
                                                ${price}
                                            </p>

                                            <button
                                                onClick={() =>
                                                    (window.location.href = `/dashboard/events/${e.id}`)
                                                }
                                                className="w-full mt-2 bg-black text-white py-1 rounded text-sm"
                                            >
                                                View Event
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>


            {/* ================= RIGHT ================= */}
            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-6 sticky top-6">

                <h2 className="text-xl font-semibold">Book Your Ticket</h2>

                {/* SELECT DATE */}
                <div>
                    <p className="text-sm text-gray-500 mb-2">Select Date</p>

                    <div className="space-y-2">
                        {event.event_calendars?.map((d: any) => (
                            <div
                                key={d.id}
                                onClick={() => setSelectedDate(d)}
                                className={`border rounded-lg p-3 cursor-pointer transition
                ${selectedDate?.id === d.id
                                        ? "border-pink-500 bg-pink-50"
                                        : "hover:bg-gray-50"
                                    }`}
                            >
                                <p className="font-medium">
                                    {new Date(d.event_date).toDateString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {new Date(d.start_time).toLocaleTimeString()} -{" "}
                                    {new Date(d.end_time).toLocaleTimeString()}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ✅ MULTI TICKET UI (same design, new logic) */}
                <div>
                    <p className="text-sm text-gray-500 mb-2">Choose Ticket</p>

                    <div className="space-y-3">
                        {event.event_pricing?.map((p: any) => {
                            const qty = ticketQty[p.id] || 0;

                            return (
                                <div
                                    key={p.id}
                                    className={`border rounded-lg p-4 flex justify-between items-center transition
                  ${qty > 0
                                            ? "border-pink-500 bg-pink-50"
                                            : "hover:bg-gray-50"
                                        }`}
                                >
                                    <div>
                                        <p className="font-semibold">{p.price_level}</p>
                                        <p className="text-xs text-gray-400">
                                            {qty > 0 ? `${qty} selected` : "Available"}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <p className="font-bold text-pink-600">
                                            ${p.event_price}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQty(p.id, "dec")}
                                                className="w-8 h-8 border rounded"
                                            >
                                                -
                                            </button>

                                            <span>{qty}</span>

                                            <button
                                                onClick={() => updateQty(p.id, "inc")}
                                                className="w-8 h-8 border rounded"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* PRICE */}
                <div className="border-t pt-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>${subtotal}</span>
                    </div>

                    <div className="flex justify-between">
                        <span>Service Fee</span>
                        <span>${fee}</span>
                    </div>

                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-pink-600">${total}</span>
                    </div>
                </div>

                {/* BUTTON */}
                <button
                    onClick={() => {
  const selectedTickets = (event.event_pricing || [])
    .filter((p: any) => (ticketQty[p.id] || 0) > 0)
    .map((p: any) => ({
      name: p.price_level,
      qty: ticketQty[p.id],
      price: p.event_price,
    }));

  const totalQty = selectedTickets.reduce(
    (sum: any, t: { qty: any; }) => sum + t.qty,
    0
  );

  const payload = {
    eventId: event.id,
    title: event.eventTitle, // ✅ FIX
    date: selectedDate?.event_date,
    tickets: selectedTickets, // ✅ FIX
    quantity: totalQty,       // ✅ FIX
    total,
  };

  localStorage.setItem("booking", JSON.stringify(payload));

  window.location.href = "/dashboard/events/checkout";
}}
                    className="w-full bg-pink-500 text-white py-3 rounded-lg"
                >
                    Proceed to Checkout
                </button>
            </div>
        </div>
    );
}