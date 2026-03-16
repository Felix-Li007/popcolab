import type { ReactNode } from 'react';
import { Badge, Button } from '@/ui';
import type { Experience } from '@/types/experience-type';

type Props = {
  experience: Experience;
  isEditingSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onDelete: () => void;
};

function ActionIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-4 w-4 items-center justify-center ${className ?? ''}`}
    >
      {children}
    </span>
  );
}

function flagLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A';
  return value === 1 ? 'Yes' : 'No';
}

export default function ExperienceCard({
  experience,
  isEditingSelected,
  onSelect,
  onView,
  onDelete,
}: Props) {
  return (
    <article
      data-testid="experience-card"
      onClick={onSelect}
      className={`flex h-full min-h-[312px] w-full cursor-pointer flex-col overflow-hidden rounded-xl border bg-white p-3 shadow-sm transition ${
        isEditingSelected
          ? 'border-magenta shadow-[0_0_0_2px_rgba(233,30,99,0.14),0_4px_16px_rgba(0,0,0,0.08)]'
          : 'border-gray-200 hover:-translate-y-0.5 hover:border-magenta/20 hover:shadow-[0_0_0_1.5px_rgba(233,30,99,0.12),0_0_20px_6px_rgba(233,30,99,0.10)]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            {experience.categoryTitle}
          </p>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-slate-800">
            {experience.experienceTitle}
          </h3>
          <p className="mt-1 text-[11px] font-medium text-gray-500">
            {experience.providerLabel}
          </p>
        </div>
        <Badge variant="default" size="xs">
          Popularity {experience.popularityIndex}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="text-[10px] text-gray-400">Duration</p>
          <p className="text-xs font-bold text-gray-700">
            {experience.durationMin}-{experience.durationMax} min
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="text-[10px] text-gray-400">Capacity</p>
          <p className="text-xs font-bold text-gray-700">
            {experience.capacityMax}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="text-[10px] text-gray-400">Lead Type</p>
          <p className="line-clamp-1 text-xs font-bold text-gray-700">
            {experience.leadType}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="text-[10px] text-gray-400">Dimensions</p>
          <p className="text-xs font-bold text-gray-700">
            {experience.dimensionCount}
          </p>
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-2 text-xs text-gray-500">
        <div className="rounded-lg bg-gray-50 px-2 py-1.5">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
            Delivery
          </p>
          <p className="line-clamp-2 leading-relaxed text-gray-600">
            {experience.deliveryMethods}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-gray-50 px-2 py-1.5">
            <p className="text-[10px] text-gray-400">Take Item</p>
            <p className="text-xs font-bold text-gray-700">
              {flagLabel(experience.takeItem)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 px-2 py-1.5">
            <p className="text-[10px] text-gray-400">Travel Friendly</p>
            <p className="text-xs font-bold text-gray-700">
              {flagLabel(experience.travelFlying)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-between gap-1.5 border-t border-gray-100 pt-2">
        <Button
          variant="text"
          size="xs"
          className="!h-8 !min-w-0 !px-2 !text-gray-600 hover:!text-magenta"
          icon={
            <ActionIcon>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </ActionIcon>
          }
          onClick={event => {
            event.stopPropagation();
            onSelect();
          }}
        >
          Edit
        </Button>

        <div className="flex items-center gap-1">
          <Button
            variant="text"
            size="xs"
            className="!h-8 !min-w-0 !px-2 !text-teal-deep hover:!text-magenta"
            icon={
              <ActionIcon>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              </ActionIcon>
            }
            onClick={event => {
              event.stopPropagation();
              onView();
            }}
          >
            View
          </Button>

          <Button
            variant="text"
            size="xs"
            className="!h-8 !min-w-0 !px-2 !text-red-500 hover:!text-red-600"
            icon={
              <ActionIcon className="text-inherit">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </ActionIcon>
            }
            onClick={event => {
              event.stopPropagation();
              onDelete();
            }}
          >
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
