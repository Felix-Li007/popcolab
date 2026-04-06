"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const CANCEL_REASONS = [
  "Change of plans",
  "Not feeling well",
  "Booked by mistake",
  "Found another event",
  "Other",
];

// ✅ TYPES 
type BookingType = {
  id: number;
  event_id: number;
  event_date: string;
  ticket_type: string;
  quantity: number;
  total_amount: number;
  status: string;
  cancel_reason?: string;
  event?: {
    eventTitle: string;
    event_galleries?: { image_url: string }[];
  };
};

export default function MyEventsPage() {
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [selectedCancel, setSelectedCancel] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const fetchBookings = async () => {
    const res = await fetch("/api/bookings");
    const data = await res.json();
    setBookings(data);
  };

  // ✅ FIXED
  useEffect(() => {
    const load = async () => {
      await fetchBookings();
    };

    load();
  }, []);

  const handleCancel = async (id: number) => {
    console.log("🔥 CANCEL CLICKED", id);

    const finalReason = reason === "Other" ? customReason : reason;

    if (!finalReason) {
      alert("Please select or enter reason");
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason: finalReason }),
      });

      const text = await res.text();

      // ✅ FIXED
      let result: unknown;
      try {
        result = JSON.parse(text);
      } catch {
        result = text;
      }

      if (!res.ok) {
        alert("Cancel failed ❌");
        return;
      }

      // ✅ update UI
      setBookings((prev) =>
        prev.map((b) =>
          b.id === id
            ? { ...b, status: "CANCELLED", cancel_reason: finalReason }
            : b
        )
      );

      setSelectedCancel(null);
      setReason("");
      setCustomReason("");
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  // ✅ FILTER
  const activeBookings = bookings.filter(
    (b) => b.status !== "CANCELLED"
  );

  const cancelledBookings = bookings.filter(
    (b) => b.status === "CANCELLED"
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h1 className="text-4xl font-bold">🎟 My Events</h1>

      {/* ACTIVE */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Active Events</h2>

        {activeBookings.length === 0 && (
          <p className="text-gray-500">No active bookings</p>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {activeBookings.map((b) => {
            const image =
              b.event?.event_galleries?.[0]?.image_url ||
              "https://via.placeholder.com/400";

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <Image
                  src={image}
                  alt="event"
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />

                <div className="p-5 space-y-4">
                  <div className="flex justify-between">
                    <h2 className="text-xl font-bold">
                      {b.event?.eventTitle || `Event #${b.event_id}`}
                    </h2>

                    <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-600">
                      {b.status}
                    </span>
                  </div>

                  <p className="text-gray-500 text-sm">
                    📅 {new Date(b.event_date).toDateString()}
                  </p>

                  <div className="bg-gray-50 p-3 rounded-lg text-sm">
                    <p>{b.ticket_type}</p>
                    <p>Quantity: {b.quantity}</p>
                  </div>

                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-pink-600">
                      ${b.total_amount}
                    </span>
                  </div>

                  {selectedCancel === b.id ? (
                    <>
                      <select
                        className="w-full border p-2 rounded"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      >
                        <option value="">Select reason</option>
                        {CANCEL_REASONS.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>

                      {reason === "Other" && (
                        <input
                          type="text"
                          placeholder="Enter your reason"
                          className="w-full border p-2 rounded"
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                        />
                      )}

                      <button
                        onClick={() => handleCancel(b.id)}
                        className="w-full bg-red-500 text-white py-2 rounded"
                      >
                        Confirm Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectedCancel(b.id)}
                      className="w-full bg-red-500 text-white py-2 rounded"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CANCELLED */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Cancelled Events</h2>

        {cancelledBookings.length === 0 && (
          <p className="text-gray-500">No cancelled bookings</p>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {cancelledBookings.map((b) => {
            const image =
              b.event?.event_galleries?.[0]?.image_url ||
              "https://via.placeholder.com/400";

            return (
              <div
                key={b.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden opacity-70"
              >
                <Image
                  src={image}
                  alt="event"
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />

                <div className="p-5 space-y-3">
                  <h2 className="text-xl font-bold">
                    {b.event?.eventTitle || `Event #${b.event_id}`}
                  </h2>

                  <p className="text-red-600 font-semibold">
                    ❌ Cancelled
                  </p>

                  <p className="text-sm text-gray-600">
                    Reason: {b.cancel_reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}