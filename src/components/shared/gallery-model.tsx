'use client';

import ModalShell from '@/components/shared/modal-shell';
import type { DashboardExperienceImage } from '@/types/experience-dashboard-type';

type GalleryModelProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  images: DashboardExperienceImage[];
  activeImageIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  featured?: boolean;
};

function getImageDescription(image: DashboardExperienceImage) {
  return image.imageNotes?.trim() || 'No description available.';
}

function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${direction === 'left' ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M8 5l5 5-5 5" />
    </svg>
  );
}

const paginationButtonClass =
  'inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-800 shadow-sm disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-gray-600';

export default function GalleryModel({
  isOpen,
  onClose,
  title,
  images,
  activeImageIndex,
  onPrevious,
  onNext,
  featured = false,
}: Readonly<GalleryModelProps>) {
  const activeImage = images[activeImageIndex];
  const hasMultipleImages = images.length > 1;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={`${activeImageIndex + 1} / ${images.length}`}
      bodyClassName="!max-h-none !p-0"
      panelClassName="!w-[min(94vw,720px)] !max-w-none sm:!w-[min(92vw,760px)] lg:!w-[min(90vw,820px)]"
      showHeader={false}
      showCloseButton={true}
    >
      {activeImage ? (
        <div className="flex flex-col overflow-hidden rounded-[14px] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.12)]">
          <div className="relative h-[56vh] min-h-[320px] max-h-[640px] border-b border-slate-900 bg-white sm:h-[60vh]">
            <button
              type="button"
              onClick={onPrevious}
              disabled={!hasMultipleImages}
              className={`absolute left-2 top-1/2 z-20 -translate-y-1/2 ${paginationButtonClass}`}
              aria-label="Previous image"
            >
              <ArrowIcon direction="left" />
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={!hasMultipleImages}
              className={`absolute right-2 top-1/2 z-20 -translate-y-1/2 ${paginationButtonClass}`}
              aria-label="Next image"
            >
              <ArrowIcon direction="right" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={activeImage.imageUrl}
              src={activeImage.imageUrl}
              alt={activeImage.imageAlt || title}
              className="relative z-10 h-full w-full object-cover bg-white"
              loading={featured ? 'eager' : 'lazy'}
            />
          </div>

          <div className="space-y-3 px-5 py-4 sm:px-6 sm:py-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Description
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {getImageDescription(activeImage)}
              </p>
            </div>

            <div className="flex items-center justify-center border-t border-slate-200 pt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              {activeImageIndex + 1} of {images.length}
            </div>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
