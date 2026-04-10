import type { ReactNode } from 'react';
import { Badge, Button } from '@/ui';
import type { Experience } from '@/types/experience-type';
import {
  getExperiencePricingSummary,
  isNewExperience,
} from '@/utils/experience';

type Props = {
  experience: Experience;
  isEditingSelected?: boolean;
  onSelect?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  mode?: 'manage' | 'picker';
  onAdd?: () => void;
  isAddDisabled?: boolean;
};

function ActionIcon({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
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

function getStatusBadge(status: Experience['experienceStatus']) {
  switch (status) {
    case 'active':
      return { label: 'Active', variant: 'success' as const };
    case 'inactive':
      return { label: 'Inactive', variant: 'secondary' as const };
    case 'draft':
    default:
      return { label: 'Draft', variant: 'default' as const };
  }
}

export function ExperienceCard({
  experience,
  isEditingSelected = false,
  onSelect,
  onView,
  onDelete,
  mode = 'manage',
  onAdd,
  isAddDisabled = false,
}: Readonly<Props>) {
  const isPicker = mode === 'picker';
  const isNew = isNewExperience(experience.createdAt);
  const statusBadge = getStatusBadge(experience.experienceStatus);
  const pricingSummary = getExperiencePricingSummary(experience);

  return (
    <article
      data-testid="experience-card"
      className={`relative flex h-full w-full flex-col overflow-hidden rounded-xl border p-3 shadow-sm transition ${
        isPicker
          ? 'min-h-[270px] border-white/90 bg-white/72 backdrop-blur-xl shadow-[0_18px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_0_0_1.5px_rgba(34,211,238,0.16),0_0_24px_6px_rgba(34,211,238,0.12),0_18px_34px_rgba(15,23,42,0.1)]'
          : isEditingSelected
            ? 'min-h-[312px] border-magenta/60 bg-white/78 backdrop-blur-xl shadow-[0_0_0_2px_rgba(233,30,99,0.14),0_20px_36px_rgba(15,23,42,0.1),inset_0_1px_0_rgba(255,255,255,0.86)]'
            : 'min-h-[312px] border-white/85 bg-white/72 backdrop-blur-xl shadow-[0_18px_32px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.86)] hover:-translate-y-0.5 hover:border-magenta/20 hover:shadow-[0_0_0_1.5px_rgba(233,30,99,0.12),0_0_20px_6px_rgba(233,30,99,0.10),0_20px_36px_rgba(15,23,42,0.1)]'
      }`}
    >
      {mode === 'manage' && onSelect ? (
        <button
          type="button"
          aria-label={`Edit experience ${experience.experienceTitle}`}
          className="absolute inset-0 z-10 cursor-pointer rounded-xl bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-magenta/40"
          onClick={onSelect}
        />
      ) : null}

      <div className="relative z-0 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p
              className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
                isPicker ? 'text-slate-500' : 'text-gray-400'
              }`}
            >
              {experience.categoryTitle}
            </p>
            <Badge size="xs" variant={statusBadge.variant}>
              {statusBadge.label}
            </Badge>
            {isNew ? (
              <span className="rounded-full border border-magenta bg-magenta/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-magenta">
                New
              </span>
            ) : null}
          </div>
          <h3 className="mt-0.5 line-clamp-2 text-sm font-bold leading-tight text-slate-800">
            {experience.experienceTitle}
          </h3>
          <p
            className={`mt-1 text-[11px] font-medium ${
              isPicker ? 'text-slate-600' : 'text-gray-500'
            }`}
          >
            {experience.providerLabel}
          </p>
        </div>
        <div className="shrink-0">
          <div
            className={`flex h-13 w-13 flex-col items-center justify-center rounded-full border text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.88),0_12px_22px_rgba(148,163,184,0.16)] ${
              isPicker
                ? 'border-cyan-200 bg-[linear-gradient(180deg,rgba(236,254,255,0.94),rgba(207,250,254,0.7))]'
                : 'border-coral-vibe/40 bg-[linear-gradient(180deg,rgba(255,245,240,0.95),rgba(255,228,218,0.82))]'
            }`}
          >
            <p
              className={`text-[8px] font-bold uppercase tracking-[0.14em] leading-none ${
                isPicker ? 'text-cyan-700' : 'text-coral-vibe'
              }`}
            >
              Pop
            </p>
            <p
              className={`mt-0.5 text-lg font-bold leading-none ${
                isPicker ? 'text-cyan-700' : 'text-coral-vibe'
              }`}
            >
              {experience.popularityIndex}
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-0 mt-3 grid grid-cols-2 gap-2">
        <div
          className={`rounded-2xl px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ${isPicker ? 'bg-white/82' : 'border border-white/70 bg-white/56'}`}
        >
          <p className="text-[10px] text-gray-400">Duration</p>
          <p className="text-xs font-bold text-gray-700">
            {experience.durationMin}-{experience.durationMax} min
          </p>
        </div>
        <div
          className={`rounded-2xl px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ${isPicker ? 'bg-white/82' : 'border border-white/70 bg-white/56'}`}
        >
          <p className="text-[10px] text-gray-400">Capacity</p>
          <p className="text-xs font-bold text-gray-700">
            {experience.capacityMax}
          </p>
        </div>
        <div
          className={`rounded-2xl px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ${isPicker ? 'bg-white/82' : 'border border-white/70 bg-white/56'}`}
        >
          <p className="text-[10px] text-gray-400">Lead Type</p>
          <p className="line-clamp-1 text-xs font-bold text-gray-700">
            {experience.leadType}
          </p>
        </div>
        <div
          className={`rounded-2xl px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] ${isPicker ? 'bg-white/82' : 'border border-white/70 bg-white/56'}`}
        >
          <p className="text-[10px] text-gray-400">Delivery</p>
          <p className="line-clamp-1 text-xs font-bold text-gray-700">
            {experience.deliveryMethods}
          </p>
        </div>
      </div>

      <div className="relative z-0 mt-3 flex-1 space-y-2 text-xs text-gray-500">
        <div
          className={`rounded-lg px-2.5 py-2 ${
            isPicker
              ? 'border border-cyan-200/70 bg-cyan-50/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]'
              : 'border border-magenta/15 bg-[linear-gradient(180deg,rgba(253,242,248,0.92),rgba(252,231,243,0.62))] shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]'
          }`}
        >
          <p
            className={`text-[10px] font-bold uppercase tracking-[0.14em] ${
              isPicker ? 'text-cyan-700/90' : 'text-magenta/80'
            }`}
          >
            Pricing
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            {pricingSummary}
          </p>
        </div>

        {!isPicker ? (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/70 bg-white/56 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
              <p className="text-[10px] text-gray-400">Take Item</p>
              <p className="text-xs font-bold text-gray-700">
                {flagLabel(experience.takeItem)}
              </p>
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/56 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
              <p className="text-[10px] text-gray-400">Travel Friendly</p>
              <p className="text-xs font-bold text-gray-700">
                {flagLabel(experience.travelFlying)}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <div
        className={`relative z-20 mt-3 flex shrink-0 items-center justify-between gap-1.5 border-t pt-2 ${
          isPicker ? 'border-cyan-100/80' : 'border-white/70'
        }`}
      >
        {mode === 'picker' ? (
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="text"
              size="xs"
              className="h-8! min-w-0! px-2! text-slate-600! hover:text-cyan-700!"
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
                onView?.();
              }}
            >
              View
            </Button>

            <Button
              variant="primary"
              size="xs"
              className="h-8! px-4! bg-amber-400! text-slate-900! shadow-sm hover:bg-amber-300!"
              disabled={isAddDisabled}
              onClick={event => {
                event.stopPropagation();
                onAdd?.();
              }}
            >
              Add
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="text"
              size="xs"
              className="h-8! min-w-0! rounded-full! border border-white/72 bg-white/70 px-3! text-gray-600! shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(148,163,184,0.12)] hover:text-magenta!"
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
                onSelect?.();
              }}
            >
              Edit
            </Button>

            <div className="flex items-center gap-1">
              <Button
                variant="text"
                size="xs"
                className="h-8! min-w-0! rounded-full! border border-white/72 bg-white/70 px-3! text-teal-deep! shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_18px_rgba(148,163,184,0.12)] hover:text-magenta!"
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
                  onView?.();
                }}
              >
                View
              </Button>

              <Button
                variant="text"
                size="xs"
                className="h-8! min-w-0! px-2! text-red-500! hover:text-red-600!"
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
                  onDelete?.();
                }}
              >
                Delete
              </Button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

export default ExperienceCard;
