'use client';

import { useActionState, useEffect, useMemo, useRef, useState } from 'react';
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
import styles from '@/styles/admin/experiences/experience-form.module.css';

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
const SINGLE_SELECT_TEXT_KEYS = new Set([
  'delivery_methods',
  'lead_preferences',
  'take_item',
  'travel_flying',
]);
const LEAD_TYPE_OPTIONS = [
  'Facilitated',
  'Free Play & Facilitated',
  'Free-Play (Self-led)',
  'Mixed (guided + self-led)',
] as const;
const EXPERIENCE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'inactive', label: 'Inactive' },
] as const;
const DELIVERY_METHOD_OPTIONS = [
  'Off-site',
  'On-site',
  'Virtual',
  'Hybrid',
] as const;

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

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

function parseDimensionSelections(value: string | null | undefined): string[] {
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

function getDimensionOptions(dimension: Dimension) {
  if (dimension.options.length > 0) {
    return dimension.options.map(option => ({
      label: option.label,
      value: option.value,
    }));
  }

  if (dimension.dataType === 'scale' || dimension.dataType === 'numeric') {
    const min = dimension.scaleMin ?? 1;
    const max = dimension.scaleMax ?? min;
    return Array.from({ length: max - min + 1 }, (_, index) => {
      const value = String(min + index);
      return { label: value, value };
    });
  }

  return [];
}

function isSingleSelectDimension(dimension: Dimension) {
  const normalizedKey = normalizeDimensionKey(dimension.indexKey);
  return (
    dimension.dataType === 'scale' ||
    dimension.dataType === 'numeric' ||
    SINGLE_SELECT_TEXT_KEYS.has(normalizedKey)
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
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);
  const [dimensionSelections, setDimensionSelections] = useState<
    Record<number, string[]>
  >(() =>
    Object.fromEntries(
      (initial?.dimensionValues ?? []).map(value => [
        value.dimensionId,
        parseDimensionSelections(value.expectedValue),
      ])
    )
  );
  const [categoryTabScrollState, setCategoryTabScrollState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const appliedDimensions = useMemo(
    () =>
      dimensions.filter(dimension =>
        dimension.formNames.includes('EXPERIENCE')
      ),
    [dimensions]
  );

  const groupedDimensions = useMemo(() => {
    const map = new Map<string, Dimension[]>();
    for (const dimension of appliedDimensions) {
      const current = map.get(dimension.categoryName) ?? [];
      current.push(dimension);
      map.set(dimension.categoryName, current);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([categoryName, values]) =>
          [
            categoryName,
            values.sort((a, b) => a.indexName.localeCompare(b.indexName)),
          ] as const
      );
  }, [appliedDimensions]);

  const activeCategoryName = groupedDimensions.some(
    ([categoryName]) => categoryName === selectedCategoryName
  )
    ? selectedCategoryName
    : (groupedDimensions[0]?.[0] ?? '');

  const selectedDimensions =
    groupedDimensions.find(
      ([categoryName]) => categoryName === activeCategoryName
    )?.[1] ??
    groupedDimensions[0]?.[1] ??
    [];

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

  useEffect(() => {
    const node = categoryTabsRef.current;
    if (!node) return;

    const updateScrollState = () => {
      const maxScrollLeft = node.scrollWidth - node.clientWidth;
      const hasOverflow = maxScrollLeft > 4;
      const nextState = {
        hasOverflow,
        canScrollLeft: hasOverflow && node.scrollLeft > 4,
        canScrollRight: hasOverflow && node.scrollLeft < maxScrollLeft - 4,
      };

      setCategoryTabScrollState(current =>
        current.hasOverflow === nextState.hasOverflow &&
        current.canScrollLeft === nextState.canScrollLeft &&
        current.canScrollRight === nextState.canScrollRight
          ? current
          : nextState
      );
    };

    updateScrollState();
    node.addEventListener('scroll', updateScrollState, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(node);
    if (node.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(node.firstElementChild);
    }

    return () => {
      node.removeEventListener('scroll', updateScrollState);
      resizeObserver.disconnect();
    };
  }, [groupedDimensions]);

  function toggleDimensionValue(dimension: Dimension, optionValue: string) {
    const dimensionId = dimension.id ?? 0;
    if (!dimensionId) return;

    const singleSelect = isSingleSelectDimension(dimension);

    setDimensionSelections(current => {
      const existing = current[dimensionId] ?? [];
      const isSelected = existing.includes(optionValue);
      const nextValues = singleSelect
        ? isSelected
          ? []
          : [optionValue]
        : isSelected
          ? existing.filter(value => value !== optionValue)
          : [...existing, optionValue];

      return {
        ...current,
        [dimensionId]: nextValues,
      };
    });
  }

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.body}>
        {state.errors._form ? (
          <div className={styles.formError}>{state.errors._form}</div>
        ) : null}

        <section className={styles.topSection}>
          <div className={styles.topGrid}>
            <div className="xl:col-span-4">
              <Input
                name="experienceTitle"
                label="Experience Title"
                placeholder="e.g. Pop Quiz Trivia Experiences"
                defaultValue={initial?.experienceTitle ?? ''}
                error={state.errors.experienceTitle}
                inputSize="sm"
                required
              />
            </div>

            <div className="xl:col-span-3">
              <label className={styles.fieldLabel}>Lead Type</label>
              <select
                name="leadType"
                defaultValue={initial?.leadType ?? ''}
                className={joinClasses(
                  styles.select,
                  state.errors.leadType && styles.selectError
                )}
                required
              >
                <option value="" disabled>
                  Select lead type
                </option>
                {LEAD_TYPE_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {state.errors.leadType ? (
                <p className={styles.fieldError}>{state.errors.leadType}</p>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              <label className={styles.fieldLabel}>Provider</label>
              <select
                name="providerId"
                defaultValue={initial?.providerId ?? ''}
                className={joinClasses(
                  styles.select,
                  state.errors.providerId && styles.selectError
                )}
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
                <p className={styles.fieldError}>{state.errors.providerId}</p>
              ) : null}
            </div>

            <div className="xl:col-span-6">
              <label className={styles.fieldLabel}>Category</label>
              <select
                name="categoryId"
                defaultValue={initial?.categoryId ?? ''}
                className={joinClasses(
                  styles.select,
                  state.errors.categoryId && styles.selectError
                )}
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
                <p className={styles.fieldError}>{state.errors.categoryId}</p>
              ) : null}
            </div>

            <div className="xl:col-span-2">
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
            </div>
            <div className="xl:col-span-2">
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
            </div>
            <div className="xl:col-span-2">
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

            <div className="xl:col-span-4">
              <label className={styles.fieldLabel}>Delivery Methods</label>
              <select
                name="deliveryMethods"
                defaultValue={initial?.deliveryMethods ?? ''}
                className={joinClasses(
                  styles.select,
                  state.errors.deliveryMethods && styles.selectError
                )}
                required
              >
                <option value="" disabled>
                  Select delivery methods
                </option>
                {DELIVERY_METHOD_OPTIONS.map(option => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {state.errors.deliveryMethods ? (
                <p className={styles.fieldError}>
                  {state.errors.deliveryMethods}
                </p>
              ) : null}
            </div>

            <div className="xl:col-span-2">
              <label className={styles.fieldLabel}>Status</label>
              <select
                name="experienceStatus"
                defaultValue={initial?.experienceStatus ?? 'active'}
                className={joinClasses(
                  styles.select,
                  state.errors.experienceStatus && styles.selectError
                )}
                required
              >
                {EXPERIENCE_STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {state.errors.experienceStatus ? (
                <p className={styles.fieldError}>
                  {state.errors.experienceStatus}
                </p>
              ) : null}
            </div>

            <div className="xl:col-span-3">
              <label className={styles.fieldLabel}>Take Item</label>
              <select
                name="takeItem"
                defaultValue={initial?.takeItem ?? ''}
                className={joinClasses(
                  styles.select,
                  state.errors.takeItem && styles.selectError
                )}
              >
                <option value="">Not set</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
              {state.errors.takeItem ? (
                <p className={styles.fieldError}>{state.errors.takeItem}</p>
              ) : null}
            </div>

            <div className="xl:col-span-3">
              <label className={styles.fieldLabel}>Travel Flying</label>
              <select
                name="travelFlying"
                defaultValue={initial?.travelFlying ?? ''}
                className={joinClasses(
                  styles.select,
                  state.errors.travelFlying && styles.selectError
                )}
              >
                <option value="">Not set</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
              {state.errors.travelFlying ? (
                <p className={styles.fieldError}>{state.errors.travelFlying}</p>
              ) : null}
            </div>

            <div className="xl:col-span-12">
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
          </div>
        </section>

        <section className={styles.bottomSection}>
          {state.errors.dimensions ? (
            <div className={styles.sectionError}>{state.errors.dimensions}</div>
          ) : null}

          {groupedDimensions.length === 0 ? (
            <div className={styles.emptyWrap}>
              <div className={styles.emptyCard}>
                <h5 className={styles.emptyTitle}>
                  No applied dimensions available
                </h5>
                <p className={styles.emptyText}>
                  Add records in `dimension_apply` first, then those dimensions
                  will appear here for experience editing.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.tabsHeader}>
                <div ref={categoryTabsRef} className={styles.tabsScroller}>
                  <div className={styles.tabsRow}>
                    {groupedDimensions.map(
                      ([categoryName, categoryDimensions]) => {
                        const isActive = categoryName === activeCategoryName;
                        return (
                          <button
                            key={categoryName}
                            type="button"
                            onClick={() =>
                              setSelectedCategoryName(categoryName)
                            }
                            className={joinClasses(
                              styles.tabButton,
                              isActive && styles.tabButtonActive
                            )}
                          >
                            {categoryName}
                            <span
                              className={joinClasses(
                                styles.tabCount,
                                isActive && styles.tabCountActive
                              )}
                            >
                              {categoryDimensions.length}
                            </span>
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>

                {categoryTabScrollState.canScrollLeft ? (
                  <div className={styles.scrollFadeLeft}>
                    <span className={styles.scrollArrow}>‹</span>
                  </div>
                ) : null}

                {categoryTabScrollState.canScrollRight ? (
                  <div className={styles.scrollFadeRight}>
                    <span className={styles.scrollArrow}>›</span>
                  </div>
                ) : null}

                {categoryTabScrollState.hasOverflow ? (
                  <div className={styles.scrollIndicator}>↔</div>
                ) : null}
              </div>

              <div className={styles.dimensionPanel}>
                <div className={styles.dimensionGrid}>
                  {selectedDimensions.map(dimension => {
                    const dimensionId = dimension.id ?? 0;
                    const options = getDimensionOptions(dimension);
                    const selectedValues =
                      dimensionSelections[dimensionId] ??
                      parseDimensionSelections(
                        getInitialDimensionValue(initial, dimensionId)
                      );
                    const usesCircleStyle =
                      dimension.dataType === 'scale' ||
                      dimension.dataType === 'numeric';

                    return (
                      <section
                        key={dimensionId}
                        className={styles.dimensionCard}
                      >
                        <div className={styles.dimensionCardHeader}>
                          <div className={styles.dimensionTitle}>
                            {dimension.indexName}
                          </div>
                          <span className={styles.dimensionMode}>
                            {usesCircleStyle ? 'Single select' : 'Multi select'}
                          </span>
                        </div>

                        {options.length === 0 ? (
                          <p className={styles.dimensionEmptyOptions}>
                            No configured options available for this dimension.
                          </p>
                        ) : (
                          <div className={styles.optionGroup}>
                            {options.map(option => {
                              const isSelected = selectedValues.includes(
                                option.value
                              );

                              return (
                                <button
                                  key={`${dimensionId}-${option.value}`}
                                  type="button"
                                  onClick={() =>
                                    toggleDimensionValue(
                                      dimension,
                                      option.value
                                    )
                                  }
                                  className={joinClasses(
                                    styles.optionButton,
                                    usesCircleStyle
                                      ? styles.circleOption
                                      : styles.pillOption,
                                    isSelected && styles.optionButtonSelected
                                  )}
                                  title={option.label}
                                  aria-pressed={isSelected}
                                >
                                  <span
                                    className={
                                      usesCircleStyle
                                        ? undefined
                                        : styles.optionLabel
                                    }
                                  >
                                    {option.label}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {selectedValues.map(value => (
                          <input
                            key={`${dimensionId}-input-${value}`}
                            type="hidden"
                            name={`dimension_${dimensionId}`}
                            value={value}
                          />
                        ))}
                      </section>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <div className={styles.footer}>
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
      panelClassName="!max-w-[calc(100vw-2rem)] sm:!max-w-5xl"
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
