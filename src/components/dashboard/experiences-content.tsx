'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import ExperienceCard from '@/components/dashboard/experience-card';
import ExperienceModal from '@/components/dashboard/experience-modal';
import PaginationBar from '@/components/shared/pagination-bar';
import {
  getDashboardExperiencesAction,
  getExperienceByIdAction,
} from '@/actions/experience-actions';
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination';
import { Search } from 'lucide-react';
import type {
  DashboardExperienceCardData,
  DashboardExperiencesResponse,
} from '@/types/experience-dashboard-type';
import type { Experience } from '@/types/experience-type';
import styles from '@/styles/dashboard/experiences-content.module.css';

type Option = {
  label: string;
  value: string;
};

function splitTokens(value: string) {
  return value
    .split(/[,|/]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matchesText(experience: DashboardExperienceCardData, query: string) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  const haystack = [
    experience.experienceTitle,
    experience.categoryTitle,
    experience.providerLabel,
    experience.providerType,
    experience.leadType,
    experience.deliveryMethods,
    experience.imageNotes ?? '',
    experience.pricing.pricingNotes ?? '',
  ].join(' ');
  const normalizedHaystack = normalizeText(haystack);
  return normalizedQuery
    .split(' ')
    .filter(Boolean)
    .every(term => normalizedHaystack.includes(term));
}

export default function ExperiencesContent() {
  const [recommended, setRecommended] = useState<DashboardExperienceCardData[]>(
    []
  );
  const [allExperiences, setAllExperiences] = useState<
    DashboardExperienceCardData[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [leadType, setLeadType] = useState('all');
  const [deliveryMethod, setDeliveryMethod] = useState('all');
  const [duration, setDuration] = useState('all');
  const [status, setStatus] = useState('all');
  const [capacity, setCapacity] = useState('all');
  const [newThisWeek, setNewThisWeek] = useState(false);
  const [page, setPage] = useState(1);
  const [showRecommended, setShowRecommended] = useState(false);
  const [viewedExperienceId, setViewedExperienceId] = useState<number | null>(
    null
  );
  const [viewedExperience, setViewedExperience] = useState<Experience | null>(
    null
  );
  const [isViewLoading, setIsViewLoading] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const data: DashboardExperiencesResponse =
          await getDashboardExperiencesAction();
        setRecommended(data.experiences || []);
        setAllExperiences(data.allExperiences || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const allCards = useMemo(
    () => [...recommended, ...allExperiences],
    [recommended, allExperiences]
  );

  const leadTypeOptions = useMemo<Option[]>(() => {
    const values = Array.from(
      new Set(allCards.map(item => item.leadType).filter(Boolean))
    );
    return values.map(value => ({ label: value, value }));
  }, [allCards]);

  const deliveryOptions = useMemo<Option[]>(() => {
    const values = Array.from(
      new Set(allCards.flatMap(item => splitTokens(item.deliveryMethods)))
    );
    return values.map(value => ({ label: value, value }));
  }, [allCards]);

  const filterExperience = useCallback(
    (experience: DashboardExperienceCardData) => {
      const matchesLead =
        leadType === 'all' || experience.leadType === leadType;
      const matchesDelivery =
        deliveryMethod === 'all' ||
        splitTokens(experience.deliveryMethods).some(
          method => method === deliveryMethod
        );
      const matchesDuration =
        duration === 'all' ||
        (duration === 'short' && experience.durationMax <= 90) ||
        (duration === 'mid' &&
          experience.durationMax > 90 &&
          experience.durationMax <= 180) ||
        (duration === 'long' && experience.durationMax > 180);
      const matchesStatus =
        status === 'all' || experience.experienceStatus === status;
      const matchesCapacity =
        capacity === 'all' ||
        (capacity === 'small' && experience.capacityMax <= 50) ||
        (capacity === 'medium' &&
          experience.capacityMax > 50 &&
          experience.capacityMax <= 100) ||
        (capacity === 'large' && experience.capacityMax > 100);
      const matchesFreshness =
        !newThisWeek ||
        (experience.createdAt
          ? Date.now() - new Date(experience.createdAt).getTime() <=
            7 * 24 * 60 * 60 * 1000
          : false);

      return (
        matchesText(experience, search) &&
        matchesLead &&
        matchesDelivery &&
        matchesDuration &&
        matchesStatus &&
        matchesCapacity &&
        matchesFreshness
      );
    },
    [leadType, deliveryMethod, duration, status, capacity, newThisWeek, search]
  );

  const filteredRecommended = useMemo(
    () => recommended.filter(filterExperience),
    [recommended, filterExperience]
  );

  const filteredExperiences = useMemo(
    () => allExperiences.filter(filterExperience),
    [allExperiences, filterExperience]
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredExperiences.length / DEFAULT_PAGE_SIZE)
  );
  const safePage = Math.min(page, totalPages);
  const pageExperiences = filteredExperiences.slice(
    (safePage - 1) * DEFAULT_PAGE_SIZE,
    safePage * DEFAULT_PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    leadType,
    deliveryMethod,
    duration,
    status,
    capacity,
    newThisWeek,
  ]);

  useEffect(() => {
    setPage(current => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    let cancelled = false;

    async function loadViewedExperience() {
      if (viewedExperienceId === null) {
        setViewedExperience(null);
        setIsViewLoading(false);
        return;
      }

      setIsViewLoading(true);

      try {
        const detail = await getExperienceByIdAction(viewedExperienceId);
        if (!cancelled) {
          setViewedExperience(detail);
        }
      } catch (error) {
        console.error('Error loading experience detail:', error);
        if (!cancelled) {
          setViewedExperience(null);
        }
      } finally {
        if (!cancelled) {
          setIsViewLoading(false);
        }
      }
    }

    loadViewedExperience();

    return () => {
      cancelled = true;
    };
  }, [viewedExperienceId]);

  if (loading) {
    return <div className={styles.loadingMessage}>Loading experiences...</div>;
  }

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setLeadType('all');
    setDeliveryMethod('all');
    setDuration('all');
    setStatus('all');
    setCapacity('all');
    setNewThisWeek(false);
  };

  return (
    <div className={styles.root}>
      <div className={styles.backdrop} />

      <div className={styles.contentWrapper}>
        {filteredRecommended.length > 0 && (
          <section className={styles.recommendedSection}>
            <div className={styles.sectionHeader}>
              <div>
                <p
                  className={`${styles.recommendedTitleSize} ${styles.recommendedTitleColor}`}
                >
                  Recommend for you
                </p>
                <h2
                  className={`${styles.recommendedSubtitleSize} ${styles.recommendedSubtitleSpacing}`}
                >
                  Pop CoLab Games Experience
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecommended(current => !current)}
                  aria-label={
                    showRecommended
                      ? 'Hide recommended experiences'
                      : 'Show recommended experiences'
                  }
                  className={styles.expandButton}
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`${styles.expandIcon} ${
                      showRecommended ? '-rotate-90' : 'rotate-0'
                    }`}
                    aria-hidden="true"
                  >
                    <path d="M8 5l5 5-5 5" />
                  </svg>
                </button>
              </div>
            </div>

            {showRecommended && (
              <div className={styles.cardsGrid}>
                {filteredRecommended.slice(0, 6).map(exp => (
                  <ExperienceCard
                    key={exp.id}
                    exp={exp}
                    featured
                    onView={() => setViewedExperienceId(exp.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <div className={styles.experiencesPanel}>
          <section className={styles.filterSection}>
            <div className={styles.sectionHeader}>
              <div>
                <p
                  className={`${styles.recommendedTitleSize} ${styles.recommendedTitleColor}`}
                >
                  FIND ALL EXPERIENCES
                </p>
                <h2 className={styles.recommendedSubtitleSize}>
                  Browse the full experiences list
                </h2>
              </div>
            </div>

            <div className={styles.filterRow}>
              <select
                value={leadType}
                onChange={event => setLeadType(event.target.value)}
                aria-label="Lead type"
                className={styles.filterSelect}
              >
                <option value="all">All Lead Types</option>
                {leadTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={deliveryMethod}
                onChange={event => setDeliveryMethod(event.target.value)}
                aria-label="Delivery method"
                className={styles.filterSelect}
              >
                <option value="all">All Delivery Methods</option>
                {deliveryOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={duration}
                onChange={event => setDuration(event.target.value)}
                aria-label="Duration"
                className={styles.filterSelect}
              >
                <option value="all">All Duration</option>
                <option value="short">Up to 90 min</option>
                <option value="mid">91 - 180 min</option>
                <option value="long">180+ min</option>
              </select>

              <select
                value={status}
                onChange={event => setStatus(event.target.value)}
                aria-label="Status"
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={capacity}
                onChange={event => setCapacity(event.target.value)}
                aria-label="Capacity"
                className={styles.filterSelect}
              >
                <option value="all">All Capacity</option>
                <option value="small">Up to 50</option>
                <option value="medium">51 - 100</option>
                <option value="large">100+</option>
              </select>

              <div className={styles.searchContainer}>
                <Search className={styles.searchIcon} aria-hidden="true" />
                <input
                  value={searchInput}
                  onChange={event => setSearchInput(event.target.value)}
                  placeholder="Search experiences, categories, leads..."
                  className={styles.searchInput}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearch(searchInput.trim());
                    setPage(1);
                  }}
                  className={styles.searchButton}
                >
                  Search
                </button>
              </div>

              <div className={styles.filterCheckbox}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={newThisWeek}
                    onChange={event => setNewThisWeek(event.target.checked)}
                    className={styles.checkboxInput}
                  />
                  New this week
                </label>
                <button
                  type="button"
                  onClick={clearFilters}
                  className={styles.clearButton}
                >
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className={styles.resultsSection}>
            {pageExperiences.length > 0 ? (
              <>
                <div className={styles.cardsGrid}>
                  {pageExperiences.map(exp => (
                    <ExperienceCard
                      key={exp.id}
                      exp={exp}
                      onView={() => setViewedExperienceId(exp.id)}
                    />
                  ))}
                </div>

                <PaginationBar
                  page={safePage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <div className={styles.emptyState}>
                <p className={styles.emptyStateLabel}>
                  No matching experiences
                </p>
                <h3 className={styles.emptyStateTitle}>
                  Try a wider search or clear the current filters.
                </h3>
                <button
                  type="button"
                  onClick={clearFilters}
                  className={styles.emptyStateButton}
                >
                  Reset filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {viewedExperienceId !== null ? (
        isViewLoading && !viewedExperience ? (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingDialog}>
              Loading experience details...
            </div>
          </div>
        ) : viewedExperience ? (
          <ExperienceModal
            experience={viewedExperience}
            onClose={() => {
              setViewedExperienceId(null);
              setViewedExperience(null);
            }}
          />
        ) : null
      ) : null}
    </div>
  );
}
