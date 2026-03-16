'use client';

import { useActionState, useEffect, useMemo } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import type { ExperienceCategory } from '@/types/category-type';
import { Button, Input, TextArea } from '@/ui';
import type { Dimension } from '@/types/dimension-type';
import type { Provider } from '@/types/provider-type';
import type { Experience, ExperienceFormState } from '@/types/experience-type';
import {
  buildExperienceCategoryTree,
  flattenExperienceCategoryOptions,
} from '@/utils/experience-category-tree';

type FormAction = (
  prevState: ExperienceFormState,
  formData: FormData
) => Promise<ExperienceFormState>;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  action: FormAction;
  isEdit?: boolean;
  initial?: Experience | null;
  providers: Provider[];
  categories: ExperienceCategory[];
  dimensions: Dimension[];
  onSuccess: () => void;
};

const EMPTY_STATE: ExperienceFormState = { errors: {} };
const SELECT_TEXT_KEYS = new Set([
  'lead_preferences',
  'take_item',
  'travel_flying',
]);
const TEXTAREA_KEYS = new Set([
  'play_nature',
  'play_types',
  'objectives_supported',
  'delivery_methods',
  'dietary_considerations',
]);

function normalizeDimensionKey(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function getInitialDimensionValue(
  initial: Experience | null | undefined,
  dimensionId: number
) {
  return (
    initial?.dimensionValues.find(value => value.dimensionId === dimensionId)
      ?.expectedValue ?? ''
  );
}

function ExperienceFormBody({
  action,
  isEdit,
  initial,
  providers,
  categories,
  dimensions,
  onClose,
  onSuccess,
}: Omit<Props, 'isOpen'>) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);

  const groupedDimensions = useMemo(() => {
    const map = new Map<string, Dimension[]>();
    for (const dimension of dimensions) {
      const current = map.get(dimension.categoryName) ?? [];
      current.push(dimension);
      map.set(dimension.categoryName, current);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [dimensions]);

  const categoryOptions = useMemo(() => {
    const tree = buildExperienceCategoryTree(categories);

    return flattenExperienceCategoryOptions(tree).map(option => {
      const category = categories.find(item => item.id === option.id);
      const statusLabel =
        category?.status.toLowerCase() === 'active' ? '' : ' (inactive)';

      return {
        ...option,
        label: `${option.label}${statusLabel}`,
      };
    });
  }, [categories]);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [onSuccess, state.success]);

  return (
    <form action={formAction} className="flex h-full flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {state.errors._form ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
            {state.errors._form}
          </div>
        ) : null}

        <section className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              name="experienceTitle"
              label="Experience Title"
              placeholder="e.g. Pop Quiz Trivia Experiences"
              defaultValue={initial?.experienceTitle ?? ''}
              error={state.errors.experienceTitle}
              inputSize="sm"
              required
            />

            <Input
              name="leadType"
              label="Lead Type"
              placeholder="e.g. Facilitated"
              defaultValue={initial?.leadType ?? ''}
              error={state.errors.leadType}
              inputSize="sm"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Provider
              </label>
              <select
                name="providerId"
                defaultValue={initial?.providerId ?? ''}
                className={`w-full rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30 ${
                  state.errors.providerId ? 'bg-red-50 ring-2 ring-red-300' : ''
                }`}
                required
              >
                <option value="" disabled>
                  Select provider
                </option>
                {providers.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {provider.providerLabel} ({provider.providerType})
                  </option>
                ))}
              </select>
              {state.errors.providerId ? (
                <p className="mt-1 text-[10px] text-red-500">
                  {state.errors.providerId}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Category
              </label>
              <select
                name="categoryId"
                defaultValue={initial?.categoryId ?? ''}
                className={`w-full rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30 ${
                  state.errors.categoryId ? 'bg-red-50 ring-2 ring-red-300' : ''
                }`}
                required
              >
                <option value="" disabled>
                  Select category
                </option>
                {categoryOptions.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
              {state.errors.categoryId ? (
                <p className="mt-1 text-[10px] text-red-500">
                  {state.errors.categoryId}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Input
              name="popularityIndex"
              label="Popularity"
              type="number"
              min={0}
              defaultValue={initial?.popularityIndex ?? 0}
              error={state.errors.popularityIndex}
              inputSize="sm"
              required
            />
            <Input
              name="durationMin"
              label="Duration Min"
              type="number"
              min={0}
              defaultValue={initial?.durationMin ?? 0}
              error={state.errors.durationMin}
              inputSize="sm"
              required
            />
            <Input
              name="durationMax"
              label="Duration Max"
              type="number"
              min={0}
              defaultValue={initial?.durationMax ?? 0}
              error={state.errors.durationMax}
              inputSize="sm"
              required
            />
            <Input
              name="capacityMax"
              label="Capacity"
              type="number"
              min={0}
              defaultValue={initial?.capacityMax ?? 0}
              error={state.errors.capacityMax}
              inputSize="sm"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <TextArea
              name="deliveryMethods"
              label="Delivery Methods"
              placeholder="e.g. Off-site;On-site"
              defaultValue={initial?.deliveryMethods ?? ''}
              error={state.errors.deliveryMethods}
              inputSize="sm"
              rows={3}
            />

            <TextArea
              name="dietaryConsiderations"
              label="Dietary Considerations"
              placeholder="Optional dietary notes"
              defaultValue={initial?.dietaryConsiderations ?? ''}
              error={state.errors.dietaryConsiderations}
              inputSize="sm"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Take Item
              </label>
              <select
                name="takeItem"
                defaultValue={initial?.takeItem ?? ''}
                className={`w-full rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30 ${
                  state.errors.takeItem ? 'bg-red-50 ring-2 ring-red-300' : ''
                }`}
              >
                <option value="">Not set</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
              {state.errors.takeItem ? (
                <p className="mt-1 text-[10px] text-red-500">
                  {state.errors.takeItem}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Travel Flying
              </label>
              <select
                name="travelFlying"
                defaultValue={initial?.travelFlying ?? ''}
                className={`w-full rounded-2xl bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:bg-white focus:ring-2 focus:ring-magenta/30 ${
                  state.errors.travelFlying
                    ? 'bg-red-50 ring-2 ring-red-300'
                    : ''
                }`}
              >
                <option value="">Not set</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
              {state.errors.travelFlying ? (
                <p className="mt-1 text-[10px] text-red-500">
                  {state.errors.travelFlying}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-gray-800">
                Expected Dimension Values
              </h4>
              <p className="text-xs text-gray-500">
                Maintain the expected values used for matching and filtering.
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-500">
              {dimensions.length} dimensions
            </span>
          </div>

          {state.errors.dimensions ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
              {state.errors.dimensions}
            </div>
          ) : null}

          <div className="space-y-5">
            {groupedDimensions.map(([categoryName, categoryDimensions]) => (
              <section
                key={categoryName}
                className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4"
              >
                <h5 className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">
                  {categoryName}
                </h5>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {categoryDimensions.map(dimension => {
                    const normalizedKey = normalizeDimensionKey(
                      dimension.indexKey
                    );
                    const defaultValue = getInitialDimensionValue(
                      initial,
                      dimension.id ?? 0
                    );
                    const helperText =
                      dimension.dataType === 'scale'
                        ? `Range: ${dimension.scaleMin ?? '-'} to ${dimension.scaleMax ?? '-'}`
                        : dimension.options.length > 0
                          ? `Options: ${dimension.options.map(option => option.label).join(', ')}`
                          : undefined;

                    if (
                      dimension.dataType === 'text' &&
                      dimension.options.length > 0 &&
                      SELECT_TEXT_KEYS.has(normalizedKey)
                    ) {
                      return (
                        <div key={dimension.id}>
                          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                            {dimension.indexName}
                          </label>
                          <select
                            name={`dimension_${dimension.id}`}
                            defaultValue={defaultValue}
                            className="w-full rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-gray-800 outline-none transition focus:ring-2 focus:ring-magenta/30"
                          >
                            <option value="">Not set</option>
                            {dimension.options.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          {helperText ? (
                            <p className="mt-1 text-[10px] text-gray-400">
                              {helperText}
                            </p>
                          ) : null}
                        </div>
                      );
                    }

                    if (
                      dimension.dataType === 'scale' ||
                      (dimension.dataType === 'numeric' &&
                        !TEXTAREA_KEYS.has(normalizedKey))
                    ) {
                      return (
                        <Input
                          key={dimension.id}
                          name={`dimension_${dimension.id}`}
                          label={dimension.indexName}
                          type="number"
                          min={dimension.scaleMin ?? undefined}
                          max={dimension.scaleMax ?? undefined}
                          defaultValue={defaultValue}
                          helperText={helperText}
                          inputSize="sm"
                        />
                      );
                    }

                    const useTextArea =
                      TEXTAREA_KEYS.has(normalizedKey) ||
                      dimension.options.length > 6;

                    return useTextArea ? (
                      <TextArea
                        key={dimension.id}
                        name={`dimension_${dimension.id}`}
                        label={dimension.indexName}
                        defaultValue={defaultValue}
                        helperText={helperText}
                        inputSize="sm"
                        rows={3}
                      />
                    ) : (
                      <Input
                        key={dimension.id}
                        name={`dimension_${dimension.id}`}
                        label={dimension.indexName}
                        defaultValue={defaultValue}
                        helperText={helperText}
                        inputSize="sm"
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
        <Button
          type="button"
          variant="secondary"
          size="md"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" disabled={isPending}>
          {isPending
            ? 'Saving…'
            : isEdit
              ? 'Save Changes'
              : 'Create Experience'}
        </Button>
      </div>
    </form>
  );
}

export default function ExperienceForm({
  isOpen,
  onClose,
  action,
  isEdit = false,
  initial,
  providers,
  categories,
  dimensions,
  onSuccess,
}: Props) {
  if (!isOpen) return null;

  const formKey = `${isEdit ? (initial?.id ?? 'edit') : 'new'}-${initial?.updatedAt?.toString() ?? 'draft'}`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Experience' : 'Create Experience'}
      subtitle={
        isEdit
          ? `${initial?.categoryTitle ?? ''} · ${initial?.providerLabel ?? ''}`
          : 'Create and maintain an experience with its matching signals'
      }
      panelClassName="max-w-6xl"
      bodyClassName="overflow-hidden"
      rootTestId="experience-form-modal-root"
      panelTestId="experience-form-modal"
    >
      <ExperienceFormBody
        key={formKey}
        action={action}
        isEdit={isEdit}
        initial={initial}
        providers={providers}
        categories={categories}
        dimensions={dimensions}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    </ModalShell>
  );
}
