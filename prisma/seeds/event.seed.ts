import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient, type Prisma } from '@/libs/prisma/client';
import {
  EventStatus,
  PriceLevel,
  type EventStatus as EventStatusValue,
  type PriceLevel as PriceLevelValue,
} from '@/libs/prisma/enums';
import {
  formatDateForPrismaDateField,
  formatTimeForPrismaTimeField,
  parseDateInputValue,
} from '@/utils/event-schedule';

type EventSeedRow = {
  eventTitle: string;
  eventLocation: string;
  eventNotes: string;
  contentHtml: string;
  eventStatus: EventStatusValue;
  capacity_max: number;
  image_url: string;
  image_alt: string;
  image_notes: string;
  calendars: {
    event_date: string;
    start_time: string;
    end_time: string;
  }[];
  pricing: {
    price_level: PriceLevelValue;
    event_price: string;
  }[];
};

const eventSeedRows: EventSeedRow[] = [
  {
    eventTitle: 'Sunday Family Fun Day at Pop CoLab',
    eventLocation: 'Pop CoLab (Richardson Centre Concourse)',
    eventNotes:
      'A family-friendly workshop with hands-on activities, snacks, and a relaxed drop-in format.',
    contentHtml:
      '<h2>About</h2><p>Family-friendly creative afternoon with guided activities and easy self-serve booking slots.</p>',
    eventStatus: EventStatus.ACTIVE,
    capacity_max: 40,
    image_url: '/images/Workshop.png',
    image_alt: 'Sunday Family Fun Day poster',
    image_notes: 'Use as the cover image for the family workshop card.',
    calendars: [
      {
        event_date: '2026-03-29',
        start_time: '10:00',
        end_time: '12:00',
      },
      {
        event_date: '2026-03-29',
        start_time: '13:00',
        end_time: '15:00',
      },
    ],
    pricing: [
      { price_level: PriceLevel.ADULT, event_price: '25' },
      { price_level: PriceLevel.YOUTH, event_price: '15' },
      { price_level: PriceLevel.CHILD, event_price: '10' },
    ],
  },
  {
    eventTitle: 'Cocktail Collage Night',
    eventLocation: 'Pop CoLab Studio Bar',
    eventNotes:
      'An after-hours collaging session with mocktails, music, and a more premium adult-only vibe.',
    contentHtml:
      '<h2>What to expect</h2><p>Experiment with texture, color, and layout while enjoying curated mocktails.</p>',
    eventStatus: EventStatus.DRAFT,
    capacity_max: 24,
    image_url: '/images/Cocktail.png',
    image_alt: 'Cocktail Collage Night poster',
    image_notes: 'Use as the cover image for the evening social event.',
    calendars: [
      {
        event_date: '2026-04-04',
        start_time: '18:30',
        end_time: '21:00',
      },
      {
        event_date: '2026-04-11',
        start_time: '18:30',
        end_time: '21:00',
      },
      {
        event_date: '2026-04-18',
        start_time: '18:30',
        end_time: '21:00',
      },
    ],
    pricing: [
      { price_level: PriceLevel.ADULT, event_price: '38' },
      { price_level: PriceLevel.SENIOR, event_price: '30' },
    ],
  },
  {
    eventTitle: 'Team Building Sprint',
    eventLocation: 'Pop CoLab Corporate Suite',
    eventNotes:
      'A structured team-building format with fast-paced challenges and facilitated reflection.',
    contentHtml:
      '<h2>Team experience</h2><p>Built for corporate groups that want something energetic, social, and weekday-friendly.</p>',
    eventStatus: EventStatus.ACTIVE,
    capacity_max: 60,
    image_url: '/images/team-building.png',
    image_alt: 'Team Building Sprint poster',
    image_notes: 'Use as the cover image for the corporate event.',
    calendars: [
      {
        event_date: '2026-04-02',
        start_time: '09:00',
        end_time: '11:30',
      },
      {
        event_date: '2026-04-09',
        start_time: '09:00',
        end_time: '11:30',
      },
      {
        event_date: '2026-04-16',
        start_time: '09:00',
        end_time: '11:30',
      },
      {
        event_date: '2026-04-23',
        start_time: '09:00',
        end_time: '11:30',
      },
    ],
    pricing: [
      { price_level: PriceLevel.ADULT, event_price: '48' },
      { price_level: PriceLevel.YOUTH, event_price: '36' },
    ],
  },
];

async function resolveCreatedById(prisma: PrismaClient): Promise<number> {
  const preferredIdRaw = process.env.EVENT_CREATED_BY_ID?.trim();
  if (preferredIdRaw) {
    const preferredId = Number.parseInt(preferredIdRaw, 10);
    if (Number.isInteger(preferredId) && preferredId >= 0) {
      return preferredId;
    }

    throw new Error(
      `Invalid EVENT_CREATED_BY_ID=${preferredIdRaw}. Expected a non-negative integer.`
    );
  }

  const preferredEmail = process.env.EVENT_CREATED_BY_EMAIL?.trim();
  if (preferredEmail) {
    const user = await prisma.user.findUnique({
      where: { email: preferredEmail },
      select: { id: true },
    });

    if (!user) {
      throw new Error(
        `No user found for EVENT_CREATED_BY_EMAIL=${preferredEmail}`
      );
    }

    return user.id;
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { id: 'asc' },
    select: { id: true, email: true },
  });

  if (!firstUser) {
    console.warn(
      'No users found. Falling back to createdBy=0 for seeded events.'
    );
    return 0;
  }

  console.log(`Using event seed user ${firstUser.email} (#${firstUser.id})`);
  return firstUser.id;
}

async function upsertEvent(
  prisma: PrismaClient,
  createdBy: number,
  row: EventSeedRow
) {
  const existing = await prisma.event.findFirst({
    where: { eventTitle: row.eventTitle },
    select: { id: true },
  });

  const eventData: Prisma.EventUncheckedCreateInput = {
    createdBy,
    eventTitle: row.eventTitle,
    eventLocation: row.eventLocation,
    eventNotes: row.eventNotes,
    contentHtml: row.contentHtml,
    eventStatus: row.eventStatus,
    capacity_max: row.capacity_max,
  };

  if (existing) {
    return prisma.event.update({
      where: { id: existing.id },
      data: eventData,
      select: { id: true },
    });
  }

  return prisma.event.create({
    data: eventData,
    select: { id: true },
  });
}

export async function seedEvents(prisma: PrismaClient): Promise<void> {
  const createdBy = await resolveCreatedById(prisma);

  await prisma.eventPricing.deleteMany({});
  await prisma.eventCalendar.deleteMany({});
  await prisma.eventGallery.deleteMany({});
  await prisma.event.deleteMany({});

  for (const row of eventSeedRows) {
    const event = await upsertEvent(prisma, createdBy, row);

    await prisma.eventGallery.create({
      data: {
        event_id: event.id,
        image_url: row.image_url,
        image_alt: row.image_alt,
        is_cover: true,
        image_notes: row.image_notes,
      },
    });

    await prisma.eventCalendar.createMany({
      data: row.calendars.map(calendar => {
        const eventDate = parseDateInputValue(calendar.event_date);
        const startTime = formatTimeForPrismaTimeField(calendar.start_time);
        const endTime = formatTimeForPrismaTimeField(calendar.end_time);

        if (!eventDate || !startTime || !endTime) {
          throw new Error(
            `Invalid event calendar data in seed data for "${row.eventTitle}".`
          );
        }

        return {
          event_id: event.id,
          event_date: formatDateForPrismaDateField(eventDate),
          start_time: startTime,
          end_time: endTime,
        };
      }),
    });

    await prisma.eventPricing.createMany({
      data: row.pricing.map(price => ({
        event_id: event.id,
        price_level: price.price_level,
        event_price: price.event_price,
      })),
    });

    console.log(`Created/updated event: ${row.eventTitle}`);
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed events.');
  }

  const adapter = new PrismaPg(
    new Pool({
      connectionString,
      max: 1,
    })
  );
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Seeding events...');
    await seedEvents(prisma);
    console.log('✅ Events seeded');
  } finally {
    await prisma.$disconnect();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await main().catch(error => {
    console.error('❌ Error during event seed:', error);
    process.exit(1);
  });
}
