'use client';

import {
  useActionState,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
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
const TOP_SECTION_TABS = [
  { value: 'basic', label: 'Basic Info' },
  { value: 'pricing', label: 'Pricing' },
] as const;

type TopSectionTab = (typeof TOP_SECTION_TABS)[number]['value'];
type DimensionGroup = readonly [string, Dimension[]];
type CategoryTabScrollState = {
  hasOverflow: boolean;
  canScrollLeft: boolean;
  canScrollRight: boolean;
};
type ExperienceFieldIds = {
  leadType: string;
  provider: string;
  category: string;
  deliveryMethods: string;
  experienceStatus: string;
  takeItem: string;
  travelFlying: string;
};

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

function buildExperienceFieldIds(formFieldId: string): ExperienceFieldIds {
  return {
    leadType: `${formFieldId}-lead-type`,
    provider: `${formFieldId}-provider`,
    category: `${formFieldId}-category`,
    deliveryMethods: `${formFieldId}-delivery-methods`,
    experienceStatus: `${formFieldId}-experience-status`,
    takeItem: `${formFieldId}-take-item`,
    travelFlying: `${formFieldId}-travel-flying`,
  };
}

function groupExperienceDimensions(dimensions: Dimension[]): DimensionGroup[] {
  const map = new Map<string, Dimension[]>();

  for (const dimension of dimensions) {
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
          values.toSorted((a, b) => a.indexName.localeCompare(b.indexName)),
        ] as const
    );
}

function getExperienceCategoryOptions(categories: ExperienceCategory[]) {
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
}

function getForcedTopTab(
  errors: ExperienceFormState['errors']
): TopSectionTab | null {
  if (
    errors.startingPrice ||
    errors.addingPrice ||
    errors.startingHour ||
    errors.pricingModel ||
    errors.pricingNotes
  ) {
    return 'pricing';
  }

  if (
    errors.experienceTitle ||
    errors.experienceStatus ||
    errors.providerId ||
    errors.categoryId ||
    errors.durationMin ||
    errors.durationMax ||
    errors.capacityMax ||
    errors.leadType ||
    errors.deliveryMethods ||
    errors.dietaryConsiderations ||
    errors.takeItem ||
    errors.travelFlying
  ) {
    return 'basic';
  }

  return null;
}

function getExperienceSubmitLabel(isPending: boolean, isEdit: boolean) {
  if (isPending) {
    return 'Saving…';
  }

  return isEdit ? 'Save Changes' : 'Create Experience';
}

function getNextDimensionSelections(
  current: Record<number, string[]>,
  dimension: Dimension,
  optionValue: string
) {
  const dimensionId = dimension.id ?? 0;
  if (!dimensionId) {
    return current;
  }

  const existing = current[dimensionId] ?? [];
  const isSelected = existing.includes(optionValue);

  if (isSingleSelectDimension(dimension)) {
    return {
      ...current,
      [dimensionId]: isSelected ? [] : [optionValue],
    };
  }

  const nextValues = isSelected
    ? existing.filter(value => value !== optionValue)
    : [...existing, optionValue];

  return {
    ...current,
    [dimensionId]: nextValues,
  };
}

function useCategoryTabScrollState(groupedDimensions: DimensionGroup[]) {
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);
  const [categoryTabScrollState, setCategoryTabScrollState] =
    useState<CategoryTabScrollState>({
      hasOverflow: false,
      canScrollLeft: false,
      canScrollRight: false,
    });

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

  return {
    categoryTabsRef,
    categoryTabScrollState,
  };
}

type ExperienceBasicInfoSectionProps = {
  visibleTopTab: TopSectionTab;
  initial: Experience | null | undefined;
  providers: Provider[];
  categoryOptions: ExperienceCategoryOption[];
  errors: ExperienceFormState['errors'];
  fieldIds: ExperienceFieldIds;
};

function ExperienceBasicInfoSection({
  visibleTopTab,
  initial,
  providers,
  categoryOptions,
  errors,
  fieldIds,
}: Readonly<ExperienceBasicInfoSectionProps>) {
  return (
    <div
      className={joinClasses(
        styles.topPanelSection,
        visibleTopTab !== 'basic' && styles.topPanelSectionHidden
      )}
      aria-hidden={visibleTopTab !== 'basic'}
    >
      <div className={styles.topGrid}>
        <div className="xl:col-span-4">
          <Input
            name="experienceTitle"
            label="Experience Title"
            placeholder="e.g. Pop Quiz Trivia Experiences"
            defaultValue={initial?.experienceTitle ?? ''}
            error={errors.experienceTitle}
            inputSize="sm"
            required
          />
        </div>

        <div className="xl:col-span-3">
          <label htmlFor={fieldIds.leadType} className={styles.fieldLabel}>
            Lead Type
          </label>
          <select
            id={fieldIds.leadType}
            name="leadType"
            defaultValue={initial?.leadType ?? ''}
            className={joinClasses(
              styles.select,
              errors.leadType && styles.selectError
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
          {errors.leadType ? (
            <p className={styles.fieldError}>{errors.leadType}</p>
          ) : null}
        </div>

        <div className="lg:col-span-5">
          <label htmlFor={fieldIds.provider} className={styles.fieldLabel}>
            Provider
          </label>
          <select
            id={fieldIds.provider}
            name="providerId"
            defaultValue={initial?.providerId ?? ''}
            className={joinClasses(
              styles.select,
              errors.providerId && styles.selectError
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
          {errors.providerId ? (
            <p className={styles.fieldError}>{errors.providerId}</p>
          ) : null}
        </div>

        <div className="xl:col-span-6">
          <label htmlFor={fieldIds.category} className={styles.fieldLabel}>
            Category
          </label>
          <select
            id={fieldIds.category}
            name="categoryId"
            defaultValue={initial?.categoryId ?? ''}
            className={joinClasses(
              styles.select,
              errors.categoryId && styles.selectError
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
          {errors.categoryId ? (
            <p className={styles.fieldError}>{errors.categoryId}</p>
          ) : null}
        </div>

        <div className="xl:col-span-2">
          <Input
            name="durationMin"
            label="Duration Min"
            type="number"
            min={0}
            defaultValue={initial?.durationMin ?? 0}
            error={errors.durationMin}
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
            error={errors.durationMax}
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
            error={errors.capacityMax}
            inputSize="sm"
            required
          />
        </div>

        <div className="xl:col-span-4">
          <label
            htmlFor={fieldIds.deliveryMethods}
            className={styles.fieldLabel}
          >
            Delivery Methods
          </label>
          <select
            id={fieldIds.deliveryMethods}
            name="deliveryMethods"
            defaultValue={initial?.deliveryMethods ?? ''}
            className={joinClasses(
              styles.select,
              errors.deliveryMethods && styles.selectError
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
          {errors.deliveryMethods ? (
            <p className={styles.fieldError}>{errors.deliveryMethods}</p>
          ) : null}
        </div>

        <div className="xl:col-span-2">
          <label
            htmlFor={fieldIds.experienceStatus}
            className={styles.fieldLabel}
          >
            Status
          </label>
          <select
            id={fieldIds.experienceStatus}
            name="experienceStatus"
            defaultValue={initial?.experienceStatus ?? 'active'}
            className={joinClasses(
              styles.select,
              errors.experienceStatus && styles.selectError
            )}
            required
          >
            {EXPERIENCE_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.experienceStatus ? (
            <p className={styles.fieldError}>{errors.experienceStatus}</p>
          ) : null}
        </div>

        <div className="xl:col-span-3">
          <label htmlFor={fieldIds.takeItem} className={styles.fieldLabel}>
            Take Item
          </label>
          <select
            id={fieldIds.takeItem}
            name="takeItem"
            defaultValue={initial?.takeItem ?? ''}
            className={joinClasses(
              styles.select,
              errors.takeItem && styles.selectError
            )}
          >
            <option value="">Not set</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
          {errors.takeItem ? (
            <p className={styles.fieldError}>{errors.takeItem}</p>
          ) : null}
        </div>

        <div className="xl:col-span-3">
          <label htmlFor={fieldIds.travelFlying} className={styles.fieldLabel}>
            Travel Flying
          </label>
          <select
            id={fieldIds.travelFlying}
            name="travelFlying"
            defaultValue={initial?.travelFlying ?? ''}
            className={joinClasses(
              styles.select,
              errors.travelFlying && styles.selectError
            )}
          >
            <option value="">Not set</option>
            <option value="1">Yes</option>
            <option value="0">No</option>
          </select>
          {errors.travelFlying ? (
            <p className={styles.fieldError}>{errors.travelFlying}</p>
          ) : null}
        </div>

        <div className="xl:col-span-12">
          <TextArea
            name="dietaryConsiderations"
            label="Dietary Considerations"
            placeholder="Optional dietary notes"
            defaultValue={initial?.dietaryConsiderations ?? ''}
            error={errors.dietaryConsiderations}
            inputSize="sm"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

type ExperiencePricingSectionProps = {
  visibleTopTab: TopSectionTab;
  initial: Experience | null | undefined;
  errors: ExperienceFormState['errors'];
};

function ExperiencePricingSection({
  visibleTopTab,
  initial,
  errors,
}: Readonly<ExperiencePricingSectionProps>) {
  return (
    <div
      className={joinClasses(
        styles.topPanelSection,
        visibleTopTab !== 'pricing' && styles.topPanelSectionHidden
      )}
      aria-hidden={visibleTopTab !== 'pricing'}
    >
      <div className={styles.topGrid}>
        <div className="xl:col-span-3">
          <Input
            name="startingPrice"
            label="Starting Price (CAD)"
            type="number"
            min={1}
            defaultValue={initial?.pricing.startingPrice ?? ''}
            error={errors.startingPrice}
            inputSize="sm"
            required
          />
        </div>

        <div className="xl:col-span-3">
          <Input
            name="addingPrice"
            label="Adding Price (CAD)"
            type="number"
            min={0}
            defaultValue={initial?.pricing.addingPrice ?? ''}
            error={errors.addingPrice}
            inputSize="sm"
            required
          />
        </div>

        <div className="xl:col-span-3">
          <Input
            name="startingHour"
            label="Starting Hour"
            type="number"
            min={0}
            defaultValue={initial?.pricing.startingHour ?? ''}
            error={errors.startingHour}
            inputSize="sm"
          />
        </div>

        <div className="xl:col-span-4">
          <TextArea
            name="pricingModel"
            label="Pricing Model"
            placeholder="e.g. Base + add-on"
            defaultValue={initial?.pricing.pricingModel ?? ''}
            error={errors.pricingModel}
            inputSize="sm"
            rows={3}
          />
        </div>

        <div className="xl:col-span-8">
          <TextArea
            name="pricingNotes"
            label="Pricing Notes"
            placeholder="Optional notes about pricing structure or inclusions"
            defaultValue={initial?.pricing.pricingNotes ?? ''}
            error={errors.pricingNotes}
            inputSize="sm"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

type ExperienceDimensionsSectionProps = {
  groupedDimensions: DimensionGroup[];
  activeCategoryName: string;
  categoryTabsRef: RefObject<HTMLDivElement | null>;
  categoryTabScrollState: CategoryTabScrollState;
  selectedDimensions: Dimension[];
  dimensionSelections: Record<number, string[]>;
  initial: Experience | null | undefined;
  dimensionError?: string;
  onSelectCategoryName: (categoryName: string) => void;
  onToggleDimensionValue: (dimension: Dimension, optionValue: string) => void;
};

function ExperienceDimensionsSection({
  groupedDimensions,
  activeCategoryName,
  categoryTabsRef,
  categoryTabScrollState,
  selectedDimensions,
  dimensionSelections,
  initial,
  dimensionError,
  onSelectCategoryName,
  onToggleDimensionValue,
}: Readonly<ExperienceDimensionsSectionProps>) {
  return (
    <section className={styles.bottomSection}>
      {dimensionError ? (
        <div className={styles.sectionError}>{dimensionError}</div>
      ) : null}

      {groupedDimensions.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyCard}>
            <h5 className={styles.emptyTitle}>
              No applied dimensions available
            </h5>
            <p className={styles.emptyText}>
              Add records in `dimension_apply` first, then those dimensions will
              appear here for experience editing.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.tabsHeader}>
            <div ref={categoryTabsRef} className={styles.tabsScroller}>
              <div className={styles.tabsRow}>
                {groupedDimensions.map(([categoryName, categoryDimensions]) => {
                  const isActive = categoryName === activeCategoryName;

                  return (
                    <button
                      key={categoryName}
                      type="button"
                      onClick={() => onSelectCategoryName(categoryName)}
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
                })}
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
                  <section key={dimensionId} className={styles.dimensionCard}>
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
                                onToggleDimensionValue(dimension, option.value)
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
                    {selectedValues.length === 0 && (
                      <input
                        key={`${dimensionId}-input-empty`}
                        type="hidden"
                        name={`dimension_${dimensionId}`}
                        value=""
                      />
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
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
}: Readonly<Omit<Props, 'isOpen'>>) {
  const [state, formAction, isPending] = useActionState(action, EMPTY_STATE);
  const formFieldId = useId();
  const fieldIds = buildExperienceFieldIds(formFieldId);
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [activeTopTab, setActiveTopTab] = useState<TopSectionTab>('basic');
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

  const appliedDimensions = useMemo(
    () =>
      dimensions.filter(dimension =>
        dimension.formNames.includes('EXPERIENCE')
      ),
    [dimensions]
  );

  const groupedDimensions = useMemo(
    () => groupExperienceDimensions(appliedDimensions),
    [appliedDimensions]
  );

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

  const categoryOptions = useMemo(
    () => getExperienceCategoryOptions(categories),
    [categories]
  );

  useEffect(() => {
    if (state.success) onSuccess();
  }, [onSuccess, state.success]);

  const forcedTopTab = getForcedTopTab(state.errors);
  const visibleTopTab = forcedTopTab ?? activeTopTab;
  const { categoryTabsRef, categoryTabScrollState } =
    useCategoryTabScrollState(groupedDimensions);
  const submitLabel = getExperienceSubmitLabel(isPending, isEdit);

  function toggleDimensionValue(dimension: Dimension, optionValue: string) {
    setDimensionSelections(current =>
      getNextDimensionSelections(current, dimension, optionValue)
    );
  }

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.body}>
        {state.errors._form ? (
          <div className={styles.formError}>{state.errors._form}</div>
        ) : null}

        <section className={styles.topSection}>
          <div className={styles.topTabsHeader}>
            <div className={styles.topTabsRow}>
              {TOP_SECTION_TABS.map(tab => {
                const isActive = tab.value === visibleTopTab;
                return (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setActiveTopTab(tab.value)}
                    className={joinClasses(
                      styles.topTabButton,
                      isActive && styles.topTabButtonActive
                    )}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.topPanelBody}>
            <ExperienceBasicInfoSection
              visibleTopTab={visibleTopTab}
              initial={initial}
              providers={providers}
              categoryOptions={categoryOptions}
              errors={state.errors}
              fieldIds={fieldIds}
            />

            <ExperiencePricingSection
              visibleTopTab={visibleTopTab}
              initial={initial}
              errors={state.errors}
            />
          </div>
        </section>

        <ExperienceDimensionsSection
          groupedDimensions={groupedDimensions}
          activeCategoryName={activeCategoryName}
          categoryTabsRef={categoryTabsRef}
          categoryTabScrollState={categoryTabScrollState}
          selectedDimensions={selectedDimensions}
          dimensionSelections={dimensionSelections}
          initial={initial}
          dimensionError={state.errors.dimensions}
          onSelectCategoryName={setSelectedCategoryName}
          onToggleDimensionValue={toggleDimensionValue}
        />
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
          {submitLabel}
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
}: Readonly<Props>) {
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
