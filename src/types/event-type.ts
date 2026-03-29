import type {
  EventStatus as PrismaEventStatus,
  PriceLevel as PrismaPriceLevel,
} from '@/libs/prisma/enums';

export type EventStatus = PrismaEventStatus;

export type Event = {
  id: number;
  eventTitle: string;
  eventLocation: string;
  eventNotes?: string | null;
  contentHtml?: string | null;
  eventStatus: EventStatus;
  createdBy: number;
  capacity_max: number;
  createdAt: Date;
  updatedAt: Date;
  event_galleries?: EventGallery[];
  event_calendars?: EventCalendar[];
  event_pricing?: EventPricing[];
};

export type EventGallery = {
  id: number;
  event_id: number;
  image_url: string;
  image_alt?: string | null;
  is_cover: boolean;
  image_notes?: string | null;
  created_at: Date;
  updated_at: Date;
};

export type EventGalleryInput = {
  imageUrl: string;
  imageAlt?: string | null;
  imageNotes?: string | null;
  isCover: boolean;
};

export type EventGalleryDraft = EventGalleryInput & {
  pendingFile?: File | null;
  previewUrl?: string | null;
};

export type EventCalendar = {
  id: number;
  event_id: number;
  event_date: Date;
  start_time: Date;
  end_time: Date;
  created_at: Date;
  updated_at: Date;
};

export type EventPricing = {
  id: number;
  event_id: number;
  price_level: PrismaPriceLevel;
  event_price: string;
  created_at: Date;
  updated_at: Date;
};

export type EventFormState = Omit<
  Event,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy'
> & {
  id?: number;
};
