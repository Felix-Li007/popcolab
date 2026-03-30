'use client';

import { useMemo, useState, useTransition, type SyntheticEvent } from 'react';
import { useRouter } from 'next/navigation';
import { DateStatus, EventStatus } from '@/libs/prisma/enums';
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
import pageStyles from '@/styles/admin/events/event-page.module.css';
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

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: Event;
};

type PageProps = {
  event?: Event;
};

type EditorProps = {
  event?: Event;
  mode: 'modal' | 'page';
  onCancel: () => void;
  onSuccess: (event?: Event) => void;
};

function getInitialDraftSchedule(event?: Event): DraftSchedule {
  const selectedCalendar = event?.event_calendars?.find(
    calendar => calendar.date_status !== DateStatus.CANCELLED
  );

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
  return (event?.event_calendars ?? [])
    .filter(calendar => calendar.date_status !== DateStatus.CANCELLED)
    .flatMap(calendar => {
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

const STATUS_OPTIONS: Array<{ value: Event['eventStatus']; label: string }> = [
  { value: EventStatus.DRAFT, label: 'Draft' },
  { value: EventStatus.ACTIVE, label: 'Active' },
  { value: EventStatus.INACTIVE, label: 'Inactive' },
];
const PRICE_LEVELS = ['ADULT', 'SENIOR', 'YOUTH', 'CHILD'] as const;

function EventEditor({
  event,
  mode,
  onCancel,
  onSuccess,
}: Readonly<EditorProps>) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('ABOUT');
  const initialDraftSchedules = useMemo(
    () => getInitialDraftSchedules(event),
    [event]
  );
  const [selectedCalendarId, setSelectedCalendarId] = useState<number | null>(
    event?.event_calendars?.find(
      calendar => calendar.date_status !== DateStatus.CANCELLED
    )?.id ?? null
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
      [...(event?.event_calendars ?? [])]
        .filter(calendar => calendar.date_status !== DateStatus.CANCELLED)
        .sort((left, right) => {
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

  const isEdit = Boolean(event);
  const formId = `event-editor-form-${event?.id ?? 'new'}`;
  const selectedDraftSchedule = draftSchedules.find(
    schedule => schedule.id === selectedDraftScheduleId
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

  function removeSelectedDraftSchedule() {
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
      usePageLayout={mode === 'page'}
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
      onDeleteDraftSchedule={removeSelectedDraftSchedule}
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
          onSuccess(result.data);
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

    if (errors[name as keyof EventFormState]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  let submitLabel = event ? 'Save Changes' : 'Create Event';
  if (isLoading) {
    submitLabel = 'Saving...';
  }

  const notesField = (
    <div className={`${styles.formGroup} ${pageStyles.notesField}`}>
      <textarea
        id="eventNotes"
        name="eventNotes"
        placeholder="Enter additional notes"
        value={formData.eventNotes ?? ''}
        onChange={handleInputChange}
        rows={3}
        className={`${styles.textarea} ${pageStyles.notesTextarea}`}
      />
    </div>
  );

  const sectionContent =
    mode === 'page' ? (
      <div className={pageStyles.sectionStack}>
        <div className={pageStyles.topSectionGrid}>
          <section className={pageStyles.sectionCard}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.sectionTitle}>Notes</h2>
              <p className={pageStyles.sectionDescription}>
                Additional context and internal event notes.
              </p>
            </div>
            <div className={pageStyles.sectionBody}>{notesField}</div>
          </section>

          <section className={pageStyles.sectionCard}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.sectionTitle}>Pricing</h2>
              <p className={pageStyles.sectionDescription}>
                Ticket levels and pricing details.
              </p>
            </div>
            <div className={pageStyles.sectionBody}>
              <EventPricingPanel
                pricing={pricingInputs}
                onChange={setPricingInputs}
              />
            </div>
          </section>
        </div>

        <div className={pageStyles.bottomSectionGrid}>
          <section className={pageStyles.sectionCard}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.sectionTitle}>Gallery</h2>
              <p className={pageStyles.sectionDescription}>
                Cover image and additional event photos.
              </p>
            </div>
            <div className={pageStyles.sectionBody}>
              <EventGalleryPanel
                galleries={event?.event_galleries ?? []}
                value={galleryInputs}
                onChange={setGalleryInputs}
              />
            </div>
          </section>

          <section className={pageStyles.sectionCard}>
            <div className={pageStyles.sectionHeader}>
              <h2 className={pageStyles.sectionTitle}>Time</h2>
              <p className={pageStyles.sectionDescription}>
                Dates and schedule management for this event.
              </p>
            </div>
            <div className={pageStyles.sectionBody}>{timeSectionContent}</div>
          </section>
        </div>

        <section
          className={`${pageStyles.sectionCard} ${pageStyles.featuredSection}`}
        >
          <div className={pageStyles.sectionHeader}>
            <h2 className={pageStyles.sectionTitle}>About</h2>
            <p className={pageStyles.sectionDescription}>
              Main event content and rich text description.
            </p>
          </div>
          <div className={pageStyles.sectionBody}>{aboutSectionContent}</div>
        </section>
      </div>
    ) : (
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
    );

  const form = (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={`${styles.form} ${mode === 'page' ? pageStyles.editorForm : ''}`}
    >
      <div
        className={`${styles.formContent} ${mode === 'page' ? pageStyles.editorFormContent : ''}`}
      >
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

        {mode === 'modal' ? notesField : null}

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

        {sectionContent}
      </div>

      {mode === 'modal' ? (
        <div className={styles.footer}>
          <Button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {event ? (isLoading ? 'Saving...' : 'Update Event') : submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      ) : null}
    </form>
  );

  if (mode === 'modal') {
    return form;
  }

  return (
    <div className={pageStyles.pageGrid}>
      <section className={pageStyles.mainPanel}>{form}</section>

      <aside className={pageStyles.sidebar}>
        <div className={pageStyles.actionCard}>
          <div className={pageStyles.actionStack}>
            <Button
              type="submit"
              form={formId}
              fullWidth={true}
              disabled={isLoading}
            >
              {submitLabel}
            </Button>

            {isEdit && event ? (
              <Button
                type="button"
                variant="secondary"
                fullWidth={true}
                onClick={() => router.push(`/admin/events/${event.id}`)}
              >
                View Event
              </Button>
            ) : null}

            <Button
              type="button"
              variant="secondary"
              fullWidth={true}
              onClick={onCancel}
            >
              Back to Events
            </Button>
          </div>
        </div>

        <div className={pageStyles.actionCard}>
          <div className={pageStyles.actionHeader}>
            <p className={pageStyles.actionEyebrow}>Selected Date</p>
            <h2 className={pageStyles.actionTitle}>
              {selectedDraftSchedule
                ? selectedDraftSchedule.eventDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'No date selected'}
            </h2>
            <p className={pageStyles.actionText}>
              {selectedDraftSchedule
                ? `${selectedDraftSchedule.startTime} - ${selectedDraftSchedule.endTime}`
                : ''}
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            fullWidth={true}
            className={pageStyles.floatingDangerButton}
            disabled={!selectedDraftSchedule || isLoading}
            onClick={() => {
              if (!selectedDraftSchedule) return;

              const shouldRemove = globalThis.confirm(
                `Remove this event date?\n\n${selectedDraftSchedule.eventDate.toLocaleDateString(
                  'en-US',
                  {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  }
                )} ${selectedDraftSchedule.startTime} - ${selectedDraftSchedule.endTime}`
              );

              if (!shouldRemove) return;
              removeSelectedDraftSchedule();
            }}
          >
            Cancel Date
          </Button>
        </div>
      </aside>
    </div>
  );
}

export function EventEditorPage({ event }: Readonly<PageProps>) {
  const router = useRouter();
  const isEdit = Boolean(event);

  return (
    <div className={pageStyles.pageRoot}>
      <EventEditor
        event={event}
        mode="page"
        onCancel={() =>
          router.push(isEdit ? `/admin/events/${event?.id}` : '/admin/events')
        }
        onSuccess={savedEvent => {
          const nextId = savedEvent?.id ?? event?.id;
          if (!nextId) {
            router.push('/admin/events');
            router.refresh();
            return;
          }

          router.push(`/admin/events/${nextId}`);
          router.refresh();
        }}
      />
    </div>
  );
}

export default function EventForm({
  isOpen,
  onClose,
  onSuccess,
  event,
}: Readonly<ModalProps>) {
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
      <EventEditor
        key={formKey}
        event={event}
        mode="modal"
        onCancel={onClose}
        onSuccess={() => onSuccess()}
      />
    </ModalShell>
  );
}
