"use client";

import { useEffect, useState } from "react";

export default function CheckoutPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("booking");
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) return <p className="p-6">Loading...</p>;

  const fee = Math.round(data.total * 0.1);

  const handleConfirm = async () => {
  const ticketType = data.tickets
    ?.map((t: any) => `${t.name} x${t.qty}`)
    .join(", ");

  // 🔥 STEP 1: CHECK EXISTING BOOKINGS
  const checkRes = await fetch("/api/bookings");
  const existingBookings = await checkRes.json();

  const alreadyBooked = existingBookings.find(
    (b: any) =>
      b.event_id === data.eventId &&
      new Date(b.event_date).toDateString() ===
        new Date(data.date).toDateString() &&
      b.status === "CONFIRMED"
  );

  // 🔴 IF EXISTS → ASK USER
  if (alreadyBooked) {
    const confirmAdd = confirm(
      "⚠️ You already booked this event.\nDo you want to add more tickets?"
    );

    if (!confirmAdd) return; // ❌ STOP
  }

  // ✅ STEP 2: PROCEED TO BOOKING
  await fetch("/api/bookings", {
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

  alert("✅ Booking confirmed!");

  window.location.href = "/dashboard/my-events";
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

  {data.tickets?.map((t: any, i: number) => (
    <div key={i} className="flex justify-between text-sm">
      <span>{t.name} × {t.qty}</span>
      <span>${t.qty * t.price}</span>
    </div>
  ))}
</div>

        <div className="flex justify-between">
          <span>Quantity</span>
          <span>{data.quantity}</span>
        </div>

        <div className="flex justify-between">
          <span>Price per ticket</span>
          <span>${data.total / data.quantity}</span>
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
          className="w-full bg-pink-500 text-white py-3 rounded-lg mt-4"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
}