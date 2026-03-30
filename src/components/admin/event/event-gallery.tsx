'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import type { EventGallery, EventGalleryDraft } from '@/types/event-type';
import styles from '@/styles/admin/events/event-gallery.module.css';

type GallerySlot = {
  id: string;
  imageUrl?: string;
  imageAlt?: string | null;
  previewUrl?: string | null;
  pendingFile?: File | null;
};

type Props = {
  galleries?: EventGallery[];
  value?: EventGalleryDraft[];
  onChange?: (galleries: EventGalleryDraft[]) => void;
  readOnly?: boolean;
  layout?: 'stacked' | 'split';
};

const MAX_GALLERY_SLOTS = 5;

function createSlotId(index: number) {
  return `gallery-slot-${index}`;
}

function buildInitialSlots(galleries: EventGallery[]): GallerySlot[] {
  const orderedGalleries = [...galleries].sort((left, right) => {
    if (left.is_cover !== right.is_cover) {
      return left.is_cover ? -1 : 1;
    }

    return (
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
    );
  });

  return Array.from({ length: MAX_GALLERY_SLOTS }, (_, index) => {
    const gallery = orderedGalleries[index];
    return {
      id: createSlotId(index),
      imageUrl: gallery?.image_url,
      imageAlt: gallery?.image_alt,
    } satisfies GallerySlot;
  });
}

function buildSlotsFromValue(galleries: EventGalleryDraft[]): GallerySlot[] {
  const orderedGalleries = [...galleries].sort((left, right) => {
    if (left.isCover !== right.isCover) {
      return left.isCover ? -1 : 1;
    }

    return 0;
  });

  return Array.from({ length: MAX_GALLERY_SLOTS }, (_, index) => {
    const gallery = orderedGalleries[index];
    return {
      id: createSlotId(index),
      imageUrl: gallery?.imageUrl,
      imageAlt: gallery?.imageAlt,
      previewUrl: gallery?.previewUrl,
      pendingFile: gallery?.pendingFile,
    } satisfies GallerySlot;
  });
}

function mapSlotsToGalleryDraft(slots: GallerySlot[]): EventGalleryDraft[] {
  return slots.flatMap((slot, index) =>
    slot.imageUrl || slot.previewUrl || slot.pendingFile
      ? [
          {
            imageUrl: slot.imageUrl ?? '',
            imageAlt: slot.imageAlt,
            imageNotes: null,
            isCover: index === 0,
            previewUrl: slot.previewUrl,
            pendingFile: slot.pendingFile,
          },
        ]
      : []
  );
}

function getSlotSrc(slot?: GallerySlot | null) {
  return slot?.previewUrl ?? slot?.imageUrl ?? '';
}

function getBlobPreviewUrls(slots: GallerySlot[]) {
  return new Set(
    slots
      .map(slot => slot.previewUrl)
      .filter((previewUrl): previewUrl is string =>
        Boolean(previewUrl?.startsWith('blob:'))
      )
  );
}

export default function EventGalleryPanel({
  galleries = [],
  value,
  onChange,
  readOnly = false,
  layout = 'stacked',
}: Readonly<Props>) {
  const [internalSlots, setInternalSlots] = useState<GallerySlot[]>(() =>
    buildInitialSlots(galleries)
  );
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0);
  const fileInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const blobPreviewUrlsRef = useRef<Set<string>>(new Set());
  const slots = useMemo(
    () => (value ? buildSlotsFromValue(value) : internalSlots),
    [internalSlots, value]
  );

  const previewSlot = useMemo(
    () =>
      slots[selectedSlotIndex] ??
      slots.find(slot => slot.imageUrl || slot.previewUrl) ??
      slots[0],
    [selectedSlotIndex, slots]
  );

  const selectedSlot = previewSlot ?? null;

  useEffect(() => {
    const nextBlobPreviewUrls = getBlobPreviewUrls(slots);

    blobPreviewUrlsRef.current.forEach(previewUrl => {
      if (!nextBlobPreviewUrls.has(previewUrl)) {
        URL.revokeObjectURL(previewUrl);
      }
    });

    blobPreviewUrlsRef.current = nextBlobPreviewUrls;
  }, [slots]);

  useEffect(() => {
    return () => {
      blobPreviewUrlsRef.current.forEach(previewUrl => {
        URL.revokeObjectURL(previewUrl);
      });
      blobPreviewUrlsRef.current = new Set();
    };
  }, []);

  function handleUploadClick(index: number) {
    fileInputRefs.current[index]?.click();
  }

  function applyNextSlots(nextSlots: GallerySlot[]) {
    if (!value) {
      setInternalSlots(nextSlots);
    }
    onChange?.(mapSlotsToGalleryDraft(nextSlots));
  }

  function handleFileChange(
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextPreviewUrl = URL.createObjectURL(file);
    const nextSlots = slots.map((slot, slotIndex) => {
      if (slotIndex !== index) return slot;

      if (slot.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(slot.previewUrl);
      }

      return {
        ...slot,
        imageAlt: file.name,
        previewUrl: nextPreviewUrl,
        pendingFile: file,
      };
    });

    applyNextSlots(nextSlots);
    setSelectedSlotIndex(index);
    event.target.value = '';
  }

  return (
    <div
      className={`${styles.layout} ${layout === 'split' ? styles.layoutSplit : ''}`}
    >
      <div className={styles.previewPanel}>
        <div className={styles.previewFrame}>
          {getSlotSrc(selectedSlot) ? (
            <Image
              src={getSlotSrc(selectedSlot)}
              alt={selectedSlot?.imageAlt || 'Gallery preview'}
              fill
              unoptimized
              sizes="(max-width: 768px) 100vw, 600px"
              className={styles.previewImage}
            />
          ) : (
            <div className={styles.previewEmpty}>
              Select or upload an image slot to preview it here.
            </div>
          )}
        </div>
      </div>

      <div
        className={`${styles.slotsPanel} ${layout === 'split' ? styles.slotsPanelSplit : ''}`}
      >
        {slots.map((slot, index) => {
          const isActive = index === selectedSlotIndex;
          const slotSrc = getSlotSrc(slot);
          const inputId = `gallery-upload-slot-${index}`;

          return (
            <div key={slot.id} className="w-full">
              <button
                type="button"
                className={`${styles.slotButton} ${isActive ? styles.slotButtonActive : ''}`}
                onClick={() => {
                  setSelectedSlotIndex(index);
                  if (!readOnly) {
                    handleUploadClick(index);
                  }
                }}
              >
                {slotSrc ? (
                  <Image
                    src={slotSrc}
                    alt={slot.imageAlt || `Gallery slot ${index + 1}`}
                    fill
                    unoptimized
                    sizes="120px"
                    className={styles.slotImage}
                  />
                ) : (
                  <span className={styles.slotPlus}>+</span>
                )}
              </button>
              <input
                ref={element => {
                  fileInputRefs.current[index] = element;
                }}
                id={inputId}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={readOnly}
                aria-label={`Upload gallery image ${index + 1}`}
                title={`Upload gallery image ${index + 1}`}
                onChange={event => handleFileChange(index, event)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
