'use client';

import { useMemo, useState, useTransition, type SyntheticEvent } from 'react';
import { EventStatus } from '@/libs/prisma/enums';
import ModalShell from '@/components/shared/modal-shell';
import { Button, Input } from '@/ui';
import TiptapEditor from '../../shared/tiptap-editor';
import {
  createEventAction,
  updateEventAction,
  uploadEventGalleryImageAction,
} from '@/actions/event-actions';
import type {
  Event,
  EventFormState,
  EventGalleryDraft,
  EventGalleryInput,
} from '@/types/event-type';
import EventGalleryPanel from '@/components/admin/event/event-gallery';
import EventPricingPanel, {
  type EventPricingDraft,
} from '@/components/admin/event/event-pricing';
import TimeSectionPanel from '@/components/admin/event/event-time';
import styles from '@/styles/admin/events/event-form.module.css';
import {
  parseCalendarDateValue,
  formatLocalDateValue,
  formatScheduleTimeValue,
  formatLocalTimeValue,
} from '@/utils/event-schedule';

const SECTION_TABS = ['ABOUT', 'TIME', 'GALLERY', 'PRICING'] as const;
type SectionTab = (typeof SECTION_TABS)[number];

type DraftSchedule = {
  id: string;
  eventDate: Date;
  startTime: string;
  endTime: string;
};

function getInitialDraftSchedule(event?: Event): DraftSchedule {
  const selectedCalendar = event?.event_calendars?.[0];

  if (selectedCalendar) {
    const eventDate = parseCalendarDateValue(selectedCalendar.event_date);

    return {
      id: 'initial',
      eventDate: eventDate ?? new Date(),
      startTime: formatScheduleTimeValue(selectedCalendar.start_time),
      endTime: formatScheduleTimeValue(selectedCalendar.end_time),
    };
  }

  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(10, 0, 0, 0);
  const endTime = new Date(today);
  endTime.setHours(11, 0, 0, 0);

  return {
    id: 'initial',
    eventDate: today,
    startTime: formatLocalTimeValue(startTime),
    endTime: formatLocalTimeValue(endTime),
  };
}

function createDraftScheduleId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`;
}

function getInitialDraftSchedules(event?: Event): DraftSchedule[] {
  return (event?.event_calendars ?? []).flatMap(calendar => {
    const eventDate = parseCalendarDateValue(calendar.event_date);
    if (!eventDate) return [];

    return [
      {
        id: `calendar-${calendar.id}`,
        eventDate,
        startTime: formatScheduleTimeValue(calendar.start_time),
        endTime: formatScheduleTimeValue(calendar.end_time),
      },
    ];
  });
}

function getInitialGalleryInputs(event?: Event): EventGalleryInput[] {
  return [...(event?.event_galleries ?? [])]
    .sort((left, right) => {
      if (left.is_cover !== right.is_cover) {
        return left.is_cover ? -1 : 1;
      }

      return (
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()
      );
    })
    .map(gallery => ({
      imageUrl: gallery.image_url,
      imageAlt: gallery.image_alt,
      imageNotes: gallery.image_notes,
      isCover: gallery.is_cover,
    }));
}

function getInitialPricingInputs(event?: Event): EventPricingDraft[] {
  const pricingByLevel = new Map(
    (event?.event_pricing ?? []).map(price => [
      price.price_level,
      price.event_price?.toString() ?? '',
    ])
  );

  return PRICE_LEVELS.map(priceLevel => ({
    priceLevel,
    eventPrice: pricingByLevel.get(priceLevel) ?? '',
  })) as EventPricingDraft[];
}

async function uploadGalleryImages(
  galleries: EventGalleryDraft[]
): Promise<EventGalleryInput[]> {
  const uploadedGalleries = await Promise.all(
    galleries.map(async gallery => {
      if (!gallery.pendingFile) {
        return {
          imageUrl: gallery.imageUrl,
          imageAlt: gallery.imageAlt,
          imageNotes: gallery.imageNotes,
          isCover: gallery.isCover,
        } satisfies EventGalleryInput;
      }

      const uploadFormData = new FormData();
      uploadFormData.append('file', gallery.pendingFile);
      const payload = (await uploadEventGalleryImageAction(uploadFormData)) as {
        success?: boolean;
        relativeUrl?: string;
        error?: string;
      };

      if (!payload.success || !payload.relativeUrl) {
        throw new Error(payload.error || 'Failed to upload event image');
      }

      return {
        imageUrl: payload.relativeUrl,
        imageAlt: gallery.imageAlt,
        imageNotes: gallery.imageNotes,
        isCover: gallery.isCover,
      } satisfies EventGalleryInput;
    })
  );

  return uploadedGalleries.filter(gallery => gallery.imageUrl.trim() !== '');
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: Event;
};

const STATUS_OPTIONS: Array<{ value: Event['eventStatus']; label: string }> = [
  { value: EventStatus.DRAFT, label: 'Draft' },
  { value: EventStatus.ACTIVE, label: 'Active' },
  { value: EventStatus.INACTIVE, label: 'Inactive' },
];
const PRICE_LEVELS = ['ADULT', 'SENIOR', 'YOUTH', 'CHILD'] as const;

function EventFormBody({
  event,
  onClose,
  onSuccess,
}: Readonly<Omit<Props, 'isOpen'>>) {
  const [, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('ABOUT');
  const initialDraftSchedules = useMemo(
    () => getInitialDraftSchedules(event),
    [event]
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(
    event?.event_calendars?.[0]?.id ?? null
  );
  const [draftSchedule, setDraftSchedule] = useState<DraftSchedule>(() =>
    initialDraftSchedules[0]
      ? {
          ...initialDraftSchedules[0],
          eventDate: new Date(initialDraftSchedules[0].eventDate),
        }
      : getInitialDraftSchedule(event)
  );
  const [draftSchedules, setDraftSchedules] = useState<DraftSchedule[]>(
    () => initialDraftSchedules
  );
  const [galleryInputs, setGalleryInputs] = useState<EventGalleryDraft[]>(() =>
    getInitialGalleryInputs(event)
  );
  const [pricingInputs, setPricingInputs] = useState<EventPricingDraft[]>(() =>
    getInitialPricingInputs(event)
  );
  const [selectedDraftScheduleId, setSelectedDraftScheduleId] = useState<
    string | null
  >(initialDraftSchedules[0]?.id ?? null);
  const [formData, setFormData] = useState<EventFormState>({
    eventTitle: event?.eventTitle ?? '',
    eventLocation: event?.eventLocation ?? '',
    eventNotes: event?.eventNotes ?? '',
    contentHtml: event?.contentHtml ?? '',
    eventStatus: event?.eventStatus ?? EventStatus.DRAFT,
    capacity_max: event?.capacity_max ?? -1,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof EventFormState, string>>
  >({});

  const calendars = useMemo(
    (): NonNullable<Event['event_calendars']> =>
      [...(event?.event_calendars ?? [])].sort((left, right) => {
        const leftDate = parseCalendarDateValue(left.event_date);
        const rightDate = parseCalendarDateValue(right.event_date);
        const leftTime = leftDate?.getTime() ?? 0;
        const rightTime = rightDate?.getTime() ?? 0;
        if (leftTime !== rightTime) return leftTime - rightTime;
        return formatScheduleTimeValue(left.start_time).localeCompare(
          formatScheduleTimeValue(right.start_time)
        );
      }),
    [event?.event_calendars]
  );

  function syncDraftSchedule(nextDraftSchedule: DraftSchedule) {
    setDraftSchedule(nextDraftSchedule);

    if (!selectedDraftScheduleId) return;

    setDraftSchedules(prev =>
      prev.map(schedule =>
        schedule.id === selectedDraftScheduleId ? nextDraftSchedule : schedule
      )
    );
  }

  function handleContentChange(html: string) {
    setFormData(prev => ({
      ...prev,
      contentHtml: html,
    }));
  }

  const aboutSectionContent = (
    <div className={styles.aboutSectionPanel}>
      <div className={styles.formGroup}>
        <TiptapEditor
          value={formData.contentHtml ?? ''}
          onChange={handleContentChange}
          className={styles.editor}
          bodyClassName={styles.editorBody}
        />
      </div>
    </div>
  );

  const timeSectionContent = (
    <TimeSectionPanel
      calendars={calendars}
      selectedCalendarId={selectedCalendarId}
      onSelectCalendar={setSelectedCalendarId}
      isEditable={true}
      useEditableLayout={true}
      showActionButtons={true}
      draftDate={draftSchedule.eventDate}
      draftStartTime={draftSchedule.startTime}
      draftEndTime={draftSchedule.endTime}
      draftSchedules={draftSchedules}
      selectedDraftScheduleId={selectedDraftScheduleId}
      onDraftDateChange={eventDate =>
        syncDraftSchedule({
          ...draftSchedule,
          eventDate,
        })
      }
      onDraftStartTimeChange={startTime =>
        syncDraftSchedule({
          ...draftSchedule,
          startTime,
        })
      }
      onDraftEndTimeChange={endTime =>
        syncDraftSchedule({
          ...draftSchedule,
          endTime,
        })
      }
      onSelectDraftSchedule={scheduleId => {
        const selectedDraft = draftSchedules.find(
          schedule => schedule.id === scheduleId
        );

        if (!selectedDraft) return;

        setSelectedDraftScheduleId(scheduleId);
        setDraftSchedule({
          ...selectedDraft,
          eventDate: new Date(selectedDraft.eventDate),
        });
      }}
      onAddDraftSchedule={() => {
        const scheduleId = createDraftScheduleId();
        const nextDraftSchedule: DraftSchedule = {
          id: scheduleId,
          eventDate: new Date(draftSchedule.eventDate),
          startTime: draftSchedule.startTime,
          endTime: draftSchedule.endTime,
        };

        setDraftSchedules(prev => [...prev, nextDraftSchedule]);
        setSelectedDraftScheduleId(scheduleId);
      }}
      onDeleteDraftSchedule={() => {
        if (!selectedDraftScheduleId) return;

        const remainingDraftSchedules = draftSchedules.filter(
          schedule => schedule.id !== selectedDraftScheduleId
        );

        setDraftSchedules(remainingDraftSchedules);

        const nextSelectedDraftSchedule = remainingDraftSchedules[0] ?? null;
        setSelectedDraftScheduleId(nextSelectedDraftSchedule?.id ?? null);
        setDraftSchedule(
          nextSelectedDraftSchedule
            ? {
                ...nextSelectedDraftSchedule,
                eventDate: new Date(nextSelectedDraftSchedule.eventDate),
              }
            : getInitialDraftSchedule()
        );
      }}
    />
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormState, string>> = {};

    if (!formData.eventTitle.trim()) {
      newErrors.eventTitle = 'Event title is required';
    }
    if (!formData.eventLocation.trim()) {
      newErrors.eventLocation = 'Event location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    startTransition(async () => {
      try {
        const schedulesToSave =
          draftSchedules.length > 0
            ? draftSchedules
            : [
                {
                  ...draftSchedule,
                  id: createDraftScheduleId(),
                },
              ];
        const uploadedGalleryInputs = await uploadGalleryImages(galleryInputs);
        const pricingToSave = pricingInputs
          .map(price => ({
            priceLevel: price.priceLevel,
            eventPrice: price.eventPrice.trim(),
          }))
          .filter(price => price.eventPrice !== '');

        const result = !event
          ? await createEventAction({
              ...formData,
              eventCalendars: schedulesToSave.map(schedule => ({
                eventDate: formatLocalDateValue(schedule.eventDate),
                startTime: schedule.startTime,
                endTime: schedule.endTime,
              })),
              eventGalleries: uploadedGalleryInputs,
              eventPricings: pricingToSave,
            })
          : await updateEventAction(event.id, {
              ...formData,
              eventCalendars: schedulesToSave.map(schedule => ({
                eventDate: formatLocalDateValue(schedule.eventDate),
                startTime: schedule.startTime,
                endTime: schedule.endTime,
              })),
              eventGalleries: uploadedGalleryInputs,
              eventPricings: pricingToSave,
            });

        if (result.success) {
          onSuccess();
        } else {
          alert(result.error || 'Failed to save event');
        }
      } catch (error) {
        console.error('Error saving event:', error);
        alert('An error occurred while saving the event');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const nextValue =
      name === 'capacity_max'
        ? (() => {
            const parsedValue = Number.parseInt(value, 10);
            return Number.isFinite(parsedValue) ? parsedValue : -1;
          })()
        : value;

    setFormData(prev => ({
      ...prev,
      [name]: nextValue,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof EventFormState]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  let submitLabel = event ? 'Update Event' : 'Create Event';
  if (isLoading) {
    submitLabel = 'Saving...';
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formContent}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label htmlFor="eventTitle" className={styles.label}>
            Event Title *
          </label>
          <Input
            id="eventTitle"
            name="eventTitle"
            type="text"
            placeholder="Enter event title"
            value={formData.eventTitle}
            onChange={handleInputChange}
            error={errors.eventTitle}
            className={styles.input}
          />
        </div>

        {/* Location */}
        <div className={styles.formGroup}>
          <label htmlFor="eventLocation" className={styles.label}>
            Event Location *
          </label>
          <Input
            id="eventLocation"
            name="eventLocation"
            type="text"
            placeholder="Enter event location"
            value={formData.eventLocation}
            onChange={handleInputChange}
            error={errors.eventLocation}
            className={styles.input}
          />
        </div>

        {/* Notes */}
        <div className={styles.formGroup}>
          <label htmlFor="eventNotes" className={styles.label}>
            Notes
          </label>
          <textarea
            id="eventNotes"
            name="eventNotes"
            placeholder="Enter additional notes"
            value={formData.eventNotes ?? ''}
            onChange={handleInputChange}
            rows={3}
            className={styles.textarea}
          />
        </div>

        <div className={styles.inlineFieldsRow}>
          <div className={styles.formGroup}>
            <label htmlFor="capacity_max" className={styles.label}>
              Capacity Max
            </label>
            <Input
              id="capacity_max"
              name="capacity_max"
              type="number"
              placeholder="Enter max capacity (-1 for unlimited)"
              value={formData.capacity_max}
              onChange={handleInputChange}
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="eventStatus" className={styles.label}>
              Status
            </label>
            <select
              id="eventStatus"
              name="eventStatus"
              value={formData.eventStatus}
              onChange={handleInputChange}
              className={styles.select}
            >
              {STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.sectionTabsBlock}>
          <div className={styles.sectionTabsHeader}>
            {SECTION_TABS.map(tab => {
              const isActive = activeSectionTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  className={`${styles.sectionTabButton} ${isActive ? styles.sectionTabButtonActive : ''}`}
                  onClick={() => setActiveSectionTab(tab)}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {activeSectionTab === 'ABOUT' ? aboutSectionContent : null}
          {activeSectionTab === 'TIME' ? timeSectionContent : null}

          {activeSectionTab === 'GALLERY' ? (
            <EventGalleryPanel
              galleries={event?.event_galleries ?? []}
              value={galleryInputs}
              onChange={setGalleryInputs}
            />
          ) : null}

          {activeSectionTab === 'PRICING' ? (
            <EventPricingPanel
              pricing={pricingInputs}
              onChange={setPricingInputs}
            />
          ) : null}
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          type="submit"
          disabled={isLoading}
          className={styles.submitButton}
        >
          {submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function EventForm({
  isOpen,
  onClose,
  onSuccess,
  event,
}: Readonly<Props>) {
  if (!isOpen) return null;

  const formKey = `${event?.id ?? 'new'}-${event?.updatedAt?.toString() ?? 'draft'}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Edit Event' : 'Create Event'}
      panelClassName="!max-w-[calc(100vw-2rem)] sm:!max-w-4xl"
      bodyClassName="!overflow-hidden flex min-h-0 flex-col"
      rootTestId="event-form-modal-root"
      panelTestId="event-form-modal"
    >
      <EventFormBody
        key={formKey}
        event={event}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </ModalShell>
  );
}
