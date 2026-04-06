import { prisma } from "@/libs/prisma-client";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ eventId: string }> }
) {
  try {
    // ✅ unwrap params (you already did this correctly)
    const { eventId } = await context.params;

    const id = Number(eventId);

    // ✅ ADD THIS (important safety)
    if (!id || isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid event ID" },
        { status: 400 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        event_galleries: true,
        event_calendars: true,
        event_pricing: true,
      },
    });

    // ✅ OPTIONAL safety (prevents frontend crashes)
    return NextResponse.json({
      ...event,
      event_pricing: event?.event_pricing || [],
      event_galleries: event?.event_galleries || [],
      event_calendars: event?.event_calendars || [],
    });

  } catch (error: unknown) {
    console.error("GET event error:", error);

    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}