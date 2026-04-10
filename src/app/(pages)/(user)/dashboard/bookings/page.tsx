'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  cancelBookingAction,
  getBookingsAction,
} from '@/actions/event-actions';

const CANCEL_REASONS = [
  'Change of plans',
  'Not feeling well',
  'Booked by mistake',
  'Found another event',
  'Other',
];

// ✅ TYPES
type BookingType = {
  id: number;
  event_id: number;
  event_date: string | Date;
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
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const fetchBookings = async () => {
    const data = await getBookingsAction();
    setBookings(data as BookingType[]);
  };

  // ✅ FIXED
  useEffect(() => {
    const load = async () => {
      await fetchBookings();
    };

    load();
  }, []);

  const handleCancel = async (id: number) => {
    console.log('🔥 CANCEL CLICKED', id);

    const finalReason = reason === 'Other' ? customReason : reason;

    if (!finalReason) {
      alert('Please select or enter reason');
      return;
    }

    try {
      await cancelBookingAction(id, finalReason);

      // ✅ update UI
      setBookings(prev =>
        prev.map(b =>
          b.id === id
            ? { ...b, status: 'CANCELLED', cancel_reason: finalReason }
            : b
        )
      );

      setSelectedCancel(null);
      setReason('');
      setCustomReason('');
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : 'Something went wrong');
    }
  };

  // ✅ FILTER
  const activeBookings = bookings.filter(b => b.status !== 'CANCELLED');

  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED');

  return (
    <div className="dashboard-glass-page">
      <div className="dashboard-glass-inner">
        <div className="dashboard-glass-stack">
          <section className="dashboard-glass-panel px-6 py-5">
            <p className="dashboard-section-eyebrow">Bookings</p>
            <h1 className="dashboard-section-title mt-2">My Events</h1>
            <p className="mt-2 text-sm text-slate-600">
              Review active bookings, cancel upcoming events, and keep a clean
              record of cancelled tickets.
            </p>
          </section>

          <div>
            <h2 className="mb-4 text-2xl font-semibold">Active Events</h2>

            {activeBookings.length === 0 && (
              <div className="dashboard-glass-panel px-6 py-10 text-center text-gray-500">
                No active bookings
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {activeBookings.map(b => {
                const image =
                  b.event?.event_galleries?.[0]?.image_url ||
                  'https://via.placeholder.com/400';

                return (
                  <div
                    key={b.id}
                    className="dashboard-glass-panel overflow-hidden"
                  >
                    <Image
                      src={image}
                      alt="event"
                      width={400}
                      height={200}
                      className="h-48 w-full object-cover"
                    />

                    <div className="space-y-4 p-5">
                      <div className="flex justify-between">
                        <h2 className="text-xl font-bold">
                          {b.event?.eventTitle || `Event #${b.event_id}`}
                        </h2>

                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                          {b.status}
                        </span>
                      </div>

                      <p className="text-sm text-gray-500">
                        📅 {new Date(b.event_date).toDateString()}
                      </p>

                      <div className="rounded-[1.2rem] border border-white/78 bg-white/70 p-3 text-sm backdrop-blur-xl">
                        <p>{b.ticket_type}</p>
                        <p>Quantity: {b.quantity}</p>
                      </div>

                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-pink-600">${b.total_amount}</span>
                      </div>

                      {selectedCancel === b.id ? (
                        <>
                          <select
                            className="w-full rounded-full border border-white/80 bg-white/78 p-3 backdrop-blur-xl"
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                          >
                            <option value="">Select reason</option>
                            {CANCEL_REASONS.map(r => (
                              <option key={r}>{r}</option>
                            ))}
                          </select>

                          {reason === 'Other' && (
                            <input
                              type="text"
                              placeholder="Enter your reason"
                              className="w-full rounded-full border border-white/80 bg-white/78 p-3 backdrop-blur-xl"
                              value={customReason}
                              onChange={e => setCustomReason(e.target.value)}
                            />
                          )}

                          <button
                            onClick={() => handleCancel(b.id)}
                            className="dashboard-pill-button dashboard-pill-button--primary w-full !justify-center bg-[linear-gradient(180deg,#ef4444,#dc2626)]"
                          >
                            Confirm Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setSelectedCancel(b.id)}
                          className="dashboard-pill-button dashboard-pill-button--primary w-full !justify-center bg-[linear-gradient(180deg,#ef4444,#dc2626)]"
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

          <div>
            <h2 className="mb-4 text-2xl font-semibold">Cancelled Events</h2>

            {cancelledBookings.length === 0 && (
              <div className="dashboard-glass-panel px-6 py-10 text-center text-gray-500">
                No cancelled bookings
              </div>
            )}

            <div className="grid gap-8 md:grid-cols-2">
              {cancelledBookings.map(b => {
                const image =
                  b.event?.event_galleries?.[0]?.image_url ||
                  'https://via.placeholder.com/400';

                return (
                  <div
                    key={b.id}
                    className="dashboard-glass-panel overflow-hidden opacity-75"
                  >
                    <Image
                      src={image}
                      alt="event"
                      width={400}
                      height={200}
                      className="h-48 w-full object-cover"
                    />

                    <div className="space-y-3 p-5">
                      <h2 className="text-xl font-bold">
                        {b.event?.eventTitle || `Event #${b.event_id}`}
                      </h2>

                      <p className="font-semibold text-red-600">❌ Cancelled</p>

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
      </div>
    </div>
  );
}
