import { prisma } from "@/libs/prisma-client";
import { NextResponse } from "next/server";

// ✅ GET ALL BOOKINGS
export async function GET() {
    try {
        const bookings = await prisma.booking.findMany({
            where: {
                status: "CONFIRMED",
            },
            orderBy: { id: "desc" },
            include: {
                event: {
                    include: {
                        event_galleries: true,
                    },
                },
            },
        });

        return NextResponse.json(bookings);
    } catch (error: unknown) {
        console.error("GET bookings error:", error);
        return NextResponse.json(
            { error: "Failed to fetch bookings" },
            { status: 500 }
        );
    }
}

// ✅ CREATE or UPDATE BOOKING (NO DUPLICATES)
export async function POST(req: Request) {
    try {
        const body = await req.json();

        const eventId = Number(body.eventId);
        const eventDate = new Date(body.eventDate);
        const quantity = Number(body.quantity);
        const total = Number(body.total);
        const ticketType = body.ticketType;

        // 🔍 CHECK EXISTING BOOKING
        const existing = await prisma.booking.findFirst({
            where: {
                event_id: eventId,
                event_date: eventDate,
                status: "CONFIRMED",
            },
        });

        // ✅ IF EXISTS → UPDATE BOOKING
        if (existing) {
            const updated = await prisma.booking.update({
                where: { id: existing.id },
                data: {
                    quantity: existing.quantity + quantity,
                    total_amount: existing.total_amount + total,
                    ticket_type: `${existing.ticket_type}, ${ticketType}`,
                },
            });

            return NextResponse.json({
                message: "Booking updated",
                booking: updated,
                alreadyExists: true,
            });
        }

        // ✅ IF NOT EXISTS → CREATE NEW BOOKING
        const booking = await prisma.booking.create({
            data: {
                event_id: eventId,
                event_date: eventDate,
                ticket_type: ticketType,
                quantity: quantity,
                total_amount: total,
                status: "CONFIRMED",
            },
        });

        return NextResponse.json({
            message: "Booking created",
            booking,
            alreadyExists: false,
        });

    } catch (error: unknown) {
        console.error("POST booking error:", error);
        return NextResponse.json(
            { error: "Failed to create booking" },
            { status: 500 }
        );
    }
}