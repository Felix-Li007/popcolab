'use client';

import { useMemo } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Badge, Button } from '@/ui';
import type {
  Experience,
  ExperienceDimensionValue,
} from '@/types/experience-type';

type Props = {
  isOpen: boolean;
  experience: Experience | null;
  onClose: () => void;
  onEdit: (id: number) => void;
};

function formatDate(value?: Date) {
  return value ? new Date(value).toLocaleDateString('en-US') : '-';
}

function flagLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return 'N/A';
  return value === 1 ? 'Yes' : 'No';
}

const TAG_VALUE_KEYS = new Set([
  'play_nature',
  'play_types',
  'objectives_supported',
]);

function normalizeKey(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function parseTagValues(value: string | null | undefined): string[] {
  if (!value) return [];

  return Array.from(
    new Set(
      value
        .split(/[\n,;|]+/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
}

function renderDimensionValue(value: ExperienceDimensionValue) {
  const normalizedKey = normalizeKey(value.indexKey);
  const tagValues = parseTagValues(value.expectedValue);
  const shouldUseTags =
    tagValues.length > 1 ||
    (tagValues.length > 0 && TAG_VALUE_KEYS.has(normalizedKey));

  return (
    <div
      key={value.dimensionId}
      className="rounded-lg border border-gray-200 bg-white px-3 py-2"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
        {value.indexName}
      </p>

      {shouldUseTags ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tagValues.map(tag => (
            <Badge
              key={`${value.dimensionId}-${tag}`}
              variant="secondary"
              size="sm"
              className="border border-gray-200 bg-gray-100 text-gray-700"
            >
              {tag}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
          {value.expectedValue?.trim() || '-'}
        </p>
      )}
    </div>
  );
}

export default function ExperienceView({
  isOpen,
  experience,
  onClose,
  onEdit,
}: Props) {
  const groupedDimensions = useMemo(() => {
    if (!experience) return [];

    const map = new Map<string, typeof experience.dimensionValues>();
    for (const value of experience.dimensionValues) {
      const current = map.get(value.categoryName) ?? [];
      current.push(value);
      map.set(value.categoryName, current);
    }
    return Array.from(map.entries());
  }, [experience]);

  if (!isOpen || !experience) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-display leading-none">🧩</span>
          <span className="truncate">{experience.experienceTitle}</span>
        </div>
      }
      subtitle={`${experience.categoryTitle} · ${experience.providerLabel}`}
      panelClassName="max-w-5xl"
      bodyClassName="overflow-y-auto"
      rootTestId="experience-view-modal-root"
      panelTestId="experience-view-modal"
    >
      <div className="space-y-5 px-1 py-1">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Provider
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {experience.providerLabel}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Popularity
            </p>
            <Badge variant="default" size="sm">
              {experience.popularityIndex}
            </Badge>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Duration
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {experience.durationMin}-{experience.durationMax} min
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Capacity
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {experience.capacityMax}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Lead Type
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {experience.leadType}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Delivery Methods
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {experience.deliveryMethods}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Dietary Considerations
            </p>
            <p className="text-sm text-gray-700">
              {experience.dietaryConsiderations?.trim() || 'None'}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Take Item
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {flagLabel(experience.takeItem)}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Travel Friendly
            </p>
            <p className="text-sm font-semibold text-gray-800">
              {flagLabel(experience.travelFlying)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
              Expected Dimension Values
            </p>
            <Badge variant="secondary" size="sm">
              {experience.dimensionCount}
            </Badge>
          </div>

          {groupedDimensions.length === 0 ? (
            <p className="text-sm text-gray-500">
              No dimension values set yet.
            </p>
          ) : (
            <div className="space-y-4">
              {groupedDimensions.map(([categoryName, values]) => (
                <section key={categoryName}>
                  <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                    {categoryName}
                  </h4>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {values.map(renderDimensionValue)}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 pt-2 text-[11px] text-gray-500">
          <span>Created: {formatDate(experience.createdAt)}</span>
          <span>Updated: {formatDate(experience.updatedAt)}</span>
        </div>

        <div className="flex gap-3 border-t border-gray-100 pt-5">
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => onEdit(experience.id)}
          >
            Edit
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
