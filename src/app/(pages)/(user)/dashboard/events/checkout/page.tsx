"use client";

import { useEffect, useState } from "react";

// ✅ TYPE 
type Ticket = {
  name: string;
  qty: number;
  price: number;
};

type BookingData = {
  eventId: number;
  date: string;
  tickets: Ticket[];
  quantity: number;
  total: number;
};

export default function CheckoutPage() {

  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ FIXED
  useEffect(() => {
    const load = async () => {
      const stored = localStorage.getItem("booking");

      if (stored) {
        const parsed: BookingData = JSON.parse(stored);
        setData(parsed);
      }
    };

    load();
  }, []);

  if (!data) return <p className="p-6">Loading...</p>;

  const fee = Math.round(data.total * 0.1);

  const handleConfirm = async () => {
    try {
      setLoading(true);

      const ticketType = data.tickets
        ?.map((t) => `${t.name} x${t.qty}`)
        .join(", ");

      console.log("SENDING DATA:", {
        eventId: data.eventId,
        eventDate: data.date,
        ticketType,
        quantity: data.quantity,
        total: data.total,
      });

      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: data.eventId,
          eventDate: data.date,
          ticketType,
          quantity: data.quantity,
          total: data.total,
        }),
      });

      const result = await res.json();

      console.log("BOOKING RESPONSE:", result);

      if (!res.ok) {
        alert("Booking failed. Check console.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard/events/success";
    } catch (err) {
      console.error("BOOKING ERROR:", err);
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order Summary</h1>

      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Event Booking</h2>

        <div className="flex justify-between">
          <span>Event Date</span>
          <span>{new Date(data.date).toDateString()}</span>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Tickets</h3>

          {data.tickets?.map((t, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {t.name} × {t.qty}
              </span>
              <span>${t.qty * t.price}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <span>Quantity</span>
          <span>{data.quantity}</span>
        </div>

        <div>
          {data.tickets?.map((t, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>{t.name} price</span>
              <span>${t.price}</span>
            </div>
          ))}
        </div>

        <hr />

        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${data.total}</span>
        </div>

        <div className="flex justify-between">
          <span>Service Fee</span>
          <span>${fee}</span>
        </div>

        <div className="flex justify-between font-bold text-lg text-pink-600">
          <span>Total</span>
          <span>${data.total + fee}</span>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-pink-500 text-white py-3 rounded-lg mt-4 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </div>
    </div>
  );
}