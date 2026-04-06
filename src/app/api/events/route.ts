import { prisma } from "@/libs/prisma-client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: {
        eventStatus: "ACTIVE",
      },
      include: {
        event_galleries: true,
        event_pricing: true,
        event_calendars: true,
      },
    });

    return NextResponse.json(events);
  } catch (error: unknown) {
    // ✅ SAFE ERROR HANDLING
    if (error instanceof Error) {
      console.error("GET events error:", error.message);
    } else {
      console.error("GET events error:", error);
    }

    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}