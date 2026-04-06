"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("booking");
    if (stored) setData(JSON.parse(stored));
  }, []);

  if (!data) return <p className="p-6">Loading...</p>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">

      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">

        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl mx-auto">
          ✓
        </div>

        <h1 className="text-3xl font-bold text-green-700">
          Booking Confirmed!
        </h1>

        <p className="text-gray-500">
          Your ticket has been purchased successfully
        </p>

        <div className="bg-gray-50 p-6 rounded-xl text-left space-y-3">

          <h2 className="text-xl font-semibold">
            {data.title}
          </h2>

          <p>📅 {new Date(data.date).toDateString()}</p>

          <div>
            {data.tickets.map((t: any, i: number) => (
              <p key={i}>
                🎟 {t.name} × {t.qty}
              </p>
            ))}
          </div>

          <p>Quantity: {data.quantity}</p>

          <p className="font-bold text-green-600">
            Total Paid: ${data.total}
          </p>
        </div>

        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="w-full bg-pink-500 text-white py-3 rounded-lg"
        >
          View My Bookings →
        </button>

        <button
          onClick={() => router.push("/dashboard/events")}
          className="w-full border py-3 rounded-lg"
        >
          Browse More Events
        </button>
      </div>
    </div>
  );
}