'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ModalShell from '@/components/shared/modal-shell';
import { Badge, Button } from '@/ui';
import type {
  Experience,
  ExperienceDimensionValue,
} from '@/types/experience-type';
import {
  formatCadAmount,
  getExperiencePricingSummary,
} from '@/utils/experience';
import styles from '@/styles/admin/experiences/experience-view.module.css';

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

const SINGLE_SELECT_TEXT_KEYS = new Set([
  'delivery_methods',
  'lead_preferences',
  'take_item',
  'travel_flying',
]);
const TOP_SECTION_TABS = [
  { value: 'basic', label: 'Basic Info' },
  { value: 'pricing', label: 'Pricing' },
] as const;

type TopSectionTab = (typeof TOP_SECTION_TABS)[number]['value'];

function getDimensionOptions(value: ExperienceDimensionValue) {
  if (value.options.length > 0) {
    return value.options.map(option => ({
      label: option.label,
      value: option.value,
    }));
  }

  if (value.dataType === 'scale' || value.dataType === 'numeric') {
    const min = value.scaleMin ?? 1;
    const max = value.scaleMax ?? min;
    return Array.from({ length: max - min + 1 }, (_, index) => {
      const optionValue = String(min + index);
      return { label: optionValue, value: optionValue };
    });
  }

  return [];
}

function isSingleSelectDimension(value: ExperienceDimensionValue) {
  const normalizedKey = normalizeKey(value.indexKey);
  return (
    value.dataType === 'scale' ||
    value.dataType === 'numeric' ||
    SINGLE_SELECT_TEXT_KEYS.has(normalizedKey)
  );
}

function renderDimensionValueContent(value: ExperienceDimensionValue) {
  const options = getDimensionOptions(value);
  const selectedValues = parseTagValues(value.expectedValue);
  const usesCircleStyle =
    value.dataType === 'scale' || value.dataType === 'numeric';
  const shouldUseTags =
    selectedValues.length > 1 ||
    (selectedValues.length > 0 &&
      TAG_VALUE_KEYS.has(normalizeKey(value.indexKey)));

  if (options.length > 0) {
    return (
      <div className={styles.optionGroup}>
        {options.map(option => {
          const isSelected = selectedValues.includes(option.value);
          const optionLabelClassName = usesCircleStyle
            ? undefined
            : styles.optionLabel;

          return (
            <div
              key={`${value.dimensionId}-${option.value}`}
              className={joinClasses(
                styles.optionChip,
                usesCircleStyle ? styles.circleOption : styles.pillOption,
                isSelected && styles.optionChipSelected
              )}
              title={option.label}
            >
              <span className={optionLabelClassName}>{option.label}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (shouldUseTags) {
    return (
      <div className={styles.tagGroup}>
        {selectedValues.map(tag => (
          <Badge
            key={`${value.dimensionId}-${tag}`}
            variant="secondary"
            size="sm"
            className={styles.tagBadge}
          >
            {tag}
          </Badge>
        ))}
      </div>
    );
  }

  return (
    <p className={styles.plainValue}>{value.expectedValue?.trim() || '-'}</p>
  );
}

function joinClasses(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export default function ExperienceView({
  isOpen,
  experience,
  onClose,
  onEdit,
}: Readonly<Props>) {
  const [selectedCategoryName, setSelectedCategoryName] = useState('');
  const [activeTopTab, setActiveTopTab] = useState<TopSectionTab>('basic');
  const categoryTabsRef = useRef<HTMLDivElement | null>(null);
  const statusBadge = getStatusBadge(experience?.experienceStatus ?? 'draft');
  const pricingSummary = experience
    ? getExperiencePricingSummary(experience)
    : 'Pricing not configured';
  const [categoryTabScrollState, setCategoryTabScrollState] = useState({
    hasOverflow: false,
    canScrollLeft: false,
    canScrollRight: false,
  });

  const groupedDimensions = useMemo(() => {
    if (!experience) return [];

    const map = new Map<string, typeof experience.dimensionValues>();
    for (const value of experience.dimensionValues) {
      const current = map.get(value.categoryName) ?? [];
      current.push(value);
      map.set(value.categoryName, current);
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
  }, [experience]);

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

  if (!isOpen || !experience) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className={styles.titleWrap}>
          <span className={styles.titleIcon}>🧩</span>
          <span className={styles.titleText}>{experience.experienceTitle}</span>
          <span className={styles.popularityBadge}>
            Pop {experience.popularityIndex}
          </span>
          <Badge
            size="xs"
            variant={statusBadge.variant}
            className={styles.statusBadge}
          >
            {statusBadge.label}
          </Badge>
        </div>
      }
      subtitle={`${experience.categoryTitle} · ${experience.providerLabel}`}
      panelClassName="!max-w-[calc(100vw-2rem)] sm:!max-w-5xl"
      bodyClassName="overflow-hidden"
      rootTestId="experience-view-modal-root"
      panelTestId="experience-view-modal"
    >
      <div className={styles.shell}>
        <div className={styles.body}>
          <section className={styles.topSection}>
            <div className={styles.topTabsHeader}>
              <div className={styles.topTabsRow}>
                {TOP_SECTION_TABS.map(tab => {
                  const isActive = tab.value === activeTopTab;
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
              {activeTopTab === 'basic' ? (
                <div className={styles.topGrid}>
                  <div className="xl:col-span-4">
                    <p className={styles.fieldLabel}>Experience Title</p>
                    <div className={styles.fieldValue}>
                      {experience.experienceTitle}
                    </div>
                  </div>

                  <div className="xl:col-span-3">
                    <p className={styles.fieldLabel}>Lead Type</p>
                    <div className={styles.fieldValue}>
                      {experience.leadType}
                    </div>
                  </div>

                  <div className="lg:col-span-5">
                    <p className={styles.fieldLabel}>Provider</p>
                    <div className={styles.fieldValue}>
                      {experience.providerLabel}
                    </div>
                  </div>

                  <div className="xl:col-span-6">
                    <p className={styles.fieldLabel}>Category</p>
                    <div className={styles.fieldValue}>
                      {experience.categoryTitle}
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <p className={styles.fieldLabel}>Duration Min</p>
                    <div className={styles.fieldValue}>
                      {experience.durationMin}
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <p className={styles.fieldLabel}>Duration Max</p>
                    <div className={styles.fieldValue}>
                      {experience.durationMax}
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <p className={styles.fieldLabel}>Capacity</p>
                    <div className={styles.fieldValue}>
                      {experience.capacityMax}
                    </div>
                  </div>

                  <div className="xl:col-span-4">
                    <p className={styles.fieldLabel}>Delivery Methods</p>
                    <div className={styles.fieldValue}>
                      {experience.deliveryMethods}
                    </div>
                  </div>

                  <div className="xl:col-span-2">
                    <p className={styles.fieldLabel}>Status</p>
                    <div className={styles.fieldValue}>{statusBadge.label}</div>
                  </div>

                  <div className="xl:col-span-3">
                    <p className={styles.fieldLabel}>Take Item</p>
                    <div className={styles.fieldValue}>
                      {flagLabel(experience.takeItem)}
                    </div>
                  </div>

                  <div className="xl:col-span-3">
                    <p className={styles.fieldLabel}>Travel Flying</p>
                    <div className={styles.fieldValue}>
                      {flagLabel(experience.travelFlying)}
                    </div>
                  </div>

                  <div className="xl:col-span-12">
                    <p className={styles.fieldLabel}>Dietary Considerations</p>
                    <div
                      className={joinClasses(
                        styles.fieldValue,
                        styles.fieldValueTall
                      )}
                    >
                      {experience.dietaryConsiderations?.trim() || 'None'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className={styles.topGrid}>
                  <div className="xl:col-span-3">
                    <p className={styles.fieldLabel}>Starting Price</p>
                    <div className={styles.fieldValue}>
                      {formatCadAmount(experience.pricing.startingPrice)}
                    </div>
                  </div>

                  <div className="xl:col-span-3">
                    <p className={styles.fieldLabel}>Adding Price</p>
                    <div className={styles.fieldValue}>
                      {formatCadAmount(experience.pricing.addingPrice)}
                    </div>
                  </div>

                  <div className="xl:col-span-3">
                    <p className={styles.fieldLabel}>Starting Hour</p>
                    <div className={styles.fieldValue}>
                      {experience.pricing.startingHour ?? 'Not set'}
                    </div>
                  </div>

                  <div className="xl:col-span-4">
                    <p className={styles.fieldLabel}>Pricing Model</p>
                    <div
                      className={joinClasses(
                        styles.fieldValue,
                        styles.fieldValueTall
                      )}
                    >
                      {experience.pricing.pricingModel?.trim() || 'Not set'}
                    </div>
                  </div>

                  <div className="xl:col-span-8">
                    <p className={styles.fieldLabel}>Pricing Notes</p>
                    <div
                      className={joinClasses(
                        styles.fieldValue,
                        styles.fieldValueTall
                      )}
                    >
                      {experience.pricing.pricingNotes?.trim() || 'None'}
                    </div>
                  </div>

                  <div className="xl:col-span-12">
                    <p className={styles.fieldLabel}>Pricing Summary</p>
                    <div className={styles.fieldValue}>{pricingSummary}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className={styles.bottomSection}>
            {groupedDimensions.length === 0 ? (
              <div className={styles.emptyWrap}>
                <div className={styles.emptyCard}>
                  <h5 className={styles.emptyTitle}>
                    No dimension values set yet
                  </h5>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.tabsHeader}>
                  <div ref={categoryTabsRef} className={styles.tabsScroller}>
                    <div className={styles.tabsRow}>
                      {groupedDimensions.map(([categoryName, values]) => {
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
                              {values.length}
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
                    {selectedDimensions.map(value => {
                      const singleSelect = isSingleSelectDimension(value);

                      return (
                        <section
                          key={value.dimensionId}
                          className={styles.dimensionCard}
                        >
                          <div className={styles.dimensionCardHeader}>
                            <div className={styles.dimensionTitle}>
                              {value.indexName}
                            </div>
                            <span className={styles.dimensionMode}>
                              {singleSelect ? 'Single select' : 'Multi select'}
                            </span>
                          </div>

                          {renderDimensionValueContent(value)}
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
          <div className={styles.meta}>
            <span>Created: {formatDate(experience.createdAt)}</span>
            <span>Updated: {formatDate(experience.updatedAt)}</span>
          </div>

          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
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
      </div>
    </ModalShell>
  );
}
