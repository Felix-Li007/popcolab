'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DateStatus, EventStatus } from '@/libs/prisma/enums';
import {
  parseCalendarDateValue,
  formatScheduleTimeValue,
  mergeDateAndTime,
} from '@/utils/event-schedule';
import { Badge, Button } from '@/ui';
import GalleryModel from '@/components/shared/gallery-model';
import type { Event } from '@/types/event-type';
import styles from '@/styles/admin/events/event-card.module.css';

type Props = {
  event: Event;
  isEditingSelected: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

const SLOT_WIDTH_PX = 98;
const SLOT_GAP_PX = 6.4;

function getStatusLabel(status: Event['eventStatus']) {
  switch (status) {
    case EventStatus.ACTIVE:
      return 'Active';
    case EventStatus.INACTIVE:
      return 'Inactive';
    case EventStatus.DRAFT:
    default:
      return 'Draft';
  }
}

function getStatusVariant(status: Event['eventStatus']) {
  switch (status) {
    case EventStatus.ACTIVE:
      return 'success' as const;
    case EventStatus.INACTIVE:
      return 'secondary' as const;
    case EventStatus.DRAFT:
    default:
      return 'default' as const;
  }
}

function getUpcomingLabel(event: Event) {
  const earliestEndTime = (event.event_calendars ?? [])
    .filter(calendar => calendar.date_status !== DateStatus.CANCELLED)
    .flatMap(calendar => {
      const eventDate = parseCalendarDateValue(calendar.event_date);
      const endTime = formatScheduleTimeValue(calendar.end_time);

      if (!eventDate || !endTime) {
        return [];
      }

      return [mergeDateAndTime(eventDate, endTime)];
    })
    .sort((left, right) => left.getTime() - right.getTime())[0];

  if (!earliestEndTime) return 'Event';
  return earliestEndTime.getTime() >= Date.now() ? 'Upcoming' : 'Past';
}
function formatDateTime(
  date: Date | null | undefined,
  time?: Date | null
): string {
  if (!date) return 'N/A';
  const d = new Date(date);
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (time) {
    const t = new Date(time);
    const timeStr = t.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${formatted} ${timeStr}`;
  }

  return formatted;
}

const getCoverImage = (event: Event) => {
  if (!event.event_galleries || event.event_galleries.length === 0) {
    return null;
  }
  const cover = event.event_galleries.find(g => g.is_cover);
  return cover || event.event_galleries[0];
};

const pricingOrder = ['ADULT', 'SENIOR', 'YOUTH', 'CHILD'] as const;

function formatPriceLabel(label: string) {
  return `${label.charAt(0)}${label.slice(1).toLowerCase()}`;
}

function PricingIcon() {
  return (
    <span className={styles.pricingIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v12m4-9.5c0-1.38-1.79-2.5-4-2.5s-4 1.12-4 2.5S9.79 11 12 11s4 1.12 4 2.5-1.79 2.5-4 2.5-4-1.12-4-2.5"
        />
      </svg>
    </span>
  );
}

function LocationIcon() {
  return (
    <span className={styles.locationIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 21s6-4.35 6-10a6 6 0 10-12 0c0 5.65 6 10 6 10z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 11.5a2 2 0 100-4 2 2 0 000 4z"
        />
      </svg>
    </span>
  );
}

function EditIcon({ className }: Readonly<{ className: string }>) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function ViewIcon({ className }: Readonly<{ className: string }>) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  );
}

function DeleteIcon({ className }: Readonly<{ className: string }>) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-7 0h8"
      />
    </svg>
  );
}

function getVisibleSlotCount(containerWidth: number, totalSlots: number) {
  if (totalSlots <= 0) return 0;

  for (let count = totalSlots; count >= 1; count -= 1) {
    const hasHiddenSlots = totalSlots > count;
    const renderedItems = count + (hasHiddenSlots ? 1 : 0);
    const requiredWidth =
      renderedItems * SLOT_WIDTH_PX +
      Math.max(0, renderedItems - 1) * SLOT_GAP_PX;

    if (requiredWidth <= containerWidth) {
      return count;
    }
  }

  return 1;
}

export default function EventCard({
  event,
  isEditingSelected,
  onView,
  onEdit,
  onDelete,
}: Readonly<Props>) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const scheduleRowRef = useRef<HTMLDivElement | null>(null);
  const coverImage = getCoverImage(event);
  const displayNotes = event.eventNotes?.trim() ?? '';
  const slots = (event.event_calendars ?? []).filter(
    calendar => calendar.date_status !== DateStatus.CANCELLED
  );
  const [visibleSlotCount, setVisibleSlotCount] = useState(() =>
    getVisibleSlotCount(0, slots.length)
  );
  const visibleSlots = slots.slice(0, visibleSlotCount);
  const upcomingLabel = getUpcomingLabel(event);
  const isPastEvent = upcomingLabel === 'Past';
  const galleryCount = event.event_galleries?.length ?? 0;
  const displayLocation = event.eventLocation;
  const hasMoreSlots = slots.length > visibleSlots.length;
  const moreSlotCount = slots.length - visibleSlots.length;
  const pricingEntries = useMemo(
    () =>
      [...(event.event_pricing ?? [])]
        .sort(
          (left, right) =>
            pricingOrder.indexOf(left.price_level) -
            pricingOrder.indexOf(right.price_level)
        )
        .map(price => ({
          label: price.price_level,
          amount: Number(price.event_price),
        })),
    [event.event_pricing]
  );
  const pricingSummary = pricingEntries.length
    ? pricingEntries.every(price => price.amount === 0)
      ? 'Free'
      : pricingEntries
          .map(
            price =>
              `${formatPriceLabel(price.label)} $${price.amount.toFixed(0)}`
          )
          .join(' · ')
    : 'No pricing set';
  const galleryImages = useMemo(
    () =>
      (event.event_galleries ?? []).map(image => ({
        imageUrl: image.image_url,
        imageAlt: image.image_alt,
        imageNotes: image.image_notes,
        isCover: image.is_cover,
      })),
    [event.event_galleries]
  );
  const coverImageIndex = galleryImages.findIndex(image => image.isCover);

  useEffect(() => {
    const scheduleRow = scheduleRowRef.current;
    if (!scheduleRow) return;

    const updateVisibleSlotCount = (width: number) => {
      setVisibleSlotCount(getVisibleSlotCount(width, slots.length));
    };

    updateVisibleSlotCount(scheduleRow.clientWidth);

    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      updateVisibleSlotCount(
        entry?.contentRect.width ?? scheduleRow.clientWidth
      );
    });

    observer.observe(scheduleRow);

    return () => {
      observer.disconnect();
    };
  }, [slots.length]);

  function openGallery() {
    if (galleryImages.length === 0) return;
    let initialImageIndex = coverImageIndex;
    if (initialImageIndex < 0) {
      initialImageIndex = 0;
    }
    setActiveImageIndex(initialImageIndex);
    setIsGalleryOpen(true);
  }

  function closeGallery() {
    setIsGalleryOpen(false);
  }

  function showPreviousImage() {
    setActiveImageIndex(current =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  }

  function showNextImage() {
    setActiveImageIndex(current =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  }

  return (
    <article
      data-testid="event-card"
      className={`${styles.card} ${isEditingSelected ? styles.selected : ''}`}
    >
      <button
        type="button"
        aria-label={`Edit event ${event.eventTitle}`}
        className={styles.sectionButton}
        onClick={onView}
      >
        <div className={styles.badgeRow}>
          <span
            className={`${styles.upcomingBadge} ${isPastEvent ? styles.pastBadge : ''}`}
          >
            {upcomingLabel}
          </span>
          <Badge size="sm" variant={getStatusVariant(event.eventStatus)}>
            {getStatusLabel(event.eventStatus)}
          </Badge>
        </div>
        <h3 className={styles.title}>{event.eventTitle}</h3>
      </button>

      <div className={styles.mainContent}>
        <button
          type="button"
          onClick={openGallery}
          disabled={galleryImages.length === 0}
          className={styles.imageButton}
        >
          {coverImage ? (
            <>
              <Image
                src={coverImage.image_url}
                alt={coverImage.image_alt || event.eventTitle}
                fill
                sizes="(max-width: 768px) 100vw, 60vw"
                className={styles.image}
              />
              {galleryCount > 0 ? (
                <span className={styles.imageCounter}>{galleryCount}</span>
              ) : null}
            </>
          ) : (
            <div className={styles.imagePlaceholder}>No Image</div>
          )}
        </button>
        {displayNotes ? (
          <p className={styles.description} title={displayNotes}>
            {displayNotes}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        aria-label={`Edit event ${event.eventTitle}`}
        className={styles.sectionButton}
        onClick={onView}
      >
        <div ref={scheduleRowRef} className={styles.scheduleRow}>
          {slots.length > 0 ? (
            <div
              className={styles.slots}
              style={{
                gridTemplateColumns: `repeat(${visibleSlots.length + (hasMoreSlots ? 1 : 0)}, minmax(5.4rem, 6.1rem))`,
              }}
            >
              {visibleSlots.map(slot => {
                const parsedDate = parseCalendarDateValue(slot.event_date);
                const startTime = formatScheduleTimeValue(slot.start_time);
                const endTime = formatScheduleTimeValue(slot.end_time);
                const startDate =
                  parsedDate && startTime
                    ? mergeDateAndTime(parsedDate, startTime)
                    : null;
                const endDate =
                  parsedDate && endTime
                    ? mergeDateAndTime(parsedDate, endTime)
                    : null;

                return (
                  <div key={slot.id} className={styles.slot}>
                    <div className={styles.slotDate}>
                      {formatDateTime(parsedDate)}
                    </div>
                    <div className={styles.slotTime}>
                      {startDate && endDate && (
                        <>
                          <span className={styles.slotTimeLine}>
                            {startDate.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                          <span className={styles.slotTimeDash}>–</span>
                          <span className={styles.slotTimeLine}>
                            {endDate.toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              {hasMoreSlots ? (
                <div className={styles.moreSlot}>
                  <span className={styles.more}>More +{moreSlotCount}</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className={styles.slotsEmpty}>No schedule available yet</div>
          )}
        </div>
      </button>

      <div className={styles.pricingStrip}>
        <div className={styles.pricingMeta}>
          <PricingIcon />
          <span className={styles.pricingSummary}>{pricingSummary}</span>
        </div>
      </div>

      <button
        type="button"
        aria-label={`Edit event ${event.eventTitle}`}
        className={styles.sectionButton}
        onClick={onView}
      >
        <div className={styles.locationStrip}>
          <LocationIcon />
          <span className={styles.locationStripValue}>{displayLocation}</span>
        </div>
      </button>

      <div className={styles.actions}>
        <Button
          size="sm"
          variant="ghost"
          className={styles.footerAction}
          icon={<EditIcon className={styles.actionIcon} />}
          onClick={event => {
            event.stopPropagation();
            onEdit();
          }}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={styles.footerAction}
          icon={<ViewIcon className={styles.actionIcon} />}
          onClick={event => {
            event.stopPropagation();
            onView();
          }}
        >
          View
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className={styles.footerAction}
          icon={<DeleteIcon className={styles.actionIcon} />}
        >
          Delete
        </Button>
      </div>

      <GalleryModel
        isOpen={isGalleryOpen}
        onClose={closeGallery}
        title={event.eventTitle}
        images={galleryImages}
        activeImageIndex={activeImageIndex}
        onPrevious={showPreviousImage}
        onNext={showNextImage}
        featured={false}
      />
    </article>
  );
}
