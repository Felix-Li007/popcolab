'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { removeExperienceFromProposalAction } from '@/actions/proposal-actions';
import { getExperienceByIdAction } from '@/actions/experience-actions';
import ExperienceView from '@/components/admin/experience/experience-view';
import type { Experience } from '@/types/experience-type';
import type { AdminProposalExperienceItem } from '@/types/proposal-type';
import styles from '@/styles/admin/proposals/proposal-row.module.css';

type Props = {
  proposalId: number;
  experiences: AdminProposalExperienceItem[];
  title?: string;
  allowDelete?: boolean;
  plainList?: boolean;
};

function formatDateTimeNullable(value: string | null): string {
  if (!value) return '-';
  return new Date(value).toLocaleString();
}

function formatPriceValue(value: number | null): string {
  if (value === null) return '-';
  return value.toLocaleString();
}

function formatPriceRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Not set';
  if (min === null) return `Up to ${formatPriceValue(max)}`;
  if (max === null) return `${formatPriceValue(min)}+`;
  return `${formatPriceValue(min)} - ${formatPriceValue(max)}`;
}

function formatDurationRange(min: number, max: number): string {
  if (min <= 0 && max <= 0) return 'Not set';
  if (min <= 0) return `${max}m`;
  if (max <= 0) return `${min}m`;
  return `${min}-${max}m`;
}

function getScoreTone(value: number): 'high' | 'medium' | 'low' {
  if (value >= 0.8) return 'high';
  if (value >= 0.5) return 'medium';
  return 'low';
}

export default function ProposalExperience({
  proposalId,
  experiences,
  title,
  allowDelete = false,
  plainList = false,
}: Readonly<Props>) {
  const router = useRouter();
  const [isRemoving, startRemoveTransition] = useTransition();
  const [selectedExperienceId, setSelectedExperienceId] = useState<
    number | null
  >(null);
  const [selectedExperience, setSelectedExperience] =
    useState<Experience | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedExperience() {
      if (selectedExperienceId === null) {
        setSelectedExperience(null);
        return;
      }

      try {
        const detail = await getExperienceByIdAction(selectedExperienceId);
        if (!cancelled) {
          setSelectedExperience(detail);
        }
      } catch {
        if (!cancelled) {
          setSelectedExperience(null);
        }
      }
    }

    loadSelectedExperience();

    return () => {
      cancelled = true;
    };
  }, [selectedExperienceId]);

  function handleRemoveExperience(experienceId: number, title: string) {
    if (!allowDelete || isRemoving) return;

    if (!confirm(`Remove experience "${title}" from this proposal?`)) {
      return;
    }

    startRemoveTransition(async () => {
      const result = await removeExperienceFromProposalAction(
        proposalId,
        experienceId
      );

      if (!result.ok) {
        alert(result.message);
        return;
      }

      router.refresh();
    });
  }

  const cards = (
    <div className={styles.experienceGrid}>
      {experiences.map(experience => {
        const finalScore = experience.baseScore + experience.riskAdjustment;
        const scoreTone = getScoreTone(finalScore);

        return (
          <div
            key={`${proposalId}-${experience.id}`}
            className={styles.experienceCard}
          >
            {allowDelete ? (
              <button
                type="button"
                className={styles.experienceDeleteIconButton}
                onClick={() =>
                  handleRemoveExperience(experience.id, experience.title)
                }
                disabled={isRemoving}
                aria-label={`Delete experience ${experience.title}`}
                title="Delete experience"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            ) : null}

            <div className={styles.experienceHeadLine}>
              <span className={styles.experienceIdPill}>
                Experience #{experience.id}
              </span>
              <button
                type="button"
                className={styles.experienceTitleButton}
                onClick={() => setSelectedExperienceId(experience.id)}
              >
                <span className={styles.experienceTitle}>
                  {experience.title}
                </span>
              </button>
            </div>

            <div className={styles.matchPanel}>
              <p className={styles.sectionTitle}>Match Analysis</p>
              <div className={styles.scoreHeroRow}>
                <div
                  className={`${styles.scoreHero} ${
                    scoreTone === 'high'
                      ? styles.scoreHeroHigh
                      : scoreTone === 'medium'
                        ? styles.scoreHeroMedium
                        : styles.scoreHeroLow
                  }`}
                >
                  Final Score {finalScore.toFixed(2)}
                </div>
                <div className={styles.matchScoreRow}>
                  <span className={styles.metricChip}>
                    Base {experience.baseScore.toFixed(2)}
                  </span>
                  <span className={styles.metricChip}>
                    Risk {experience.riskAdjustment.toFixed(2)}
                  </span>
                </div>
              </div>
              <p className={styles.infoLabel}>Rationale</p>
              <p className={styles.infoReasonText}>
                {experience.rationale || '-'}
              </p>
            </div>

            <div className={styles.experienceDataPanel}>
              <p className={styles.sectionTitle}>Experience Details</p>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Duration</span>
                  <span className={styles.detailValue}>
                    {formatDurationRange(
                      experience.durationMin,
                      experience.durationMax
                    )}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Capacity</span>
                  <span className={styles.detailValue}>
                    {experience.capacityMax > 0
                      ? experience.capacityMax
                      : 'Not set'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Price Range</span>
                  <span className={styles.detailValue}>
                    {formatPriceRange(
                      experience.startingPrice,
                      experience.addingPrice
                    )}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Next Schedule</span>
                  <span className={styles.detailValue}>
                    {formatDateTimeNullable(experience.nextScheduleDate)}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Lead Type</span>
                  <span className={styles.detailValue}>
                    {experience.leadType || '-'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Dietary</span>
                  <span className={styles.detailValue}>
                    {experience.dietaryConsiderations || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <>
      {plainList ? (
        cards
      ) : (
        <details className={styles.experienceSection} open>
          <summary className={styles.experienceToggle}>
            <span className={styles.experienceSectionTitle}>
              {title ?? 'Experiences'} ({experiences.length})
            </span>
            <span className={styles.experienceToggleIcon} aria-hidden="true">
              ▾
            </span>
            <span className={styles.srOnlyLabel}>Toggle experience list</span>
          </summary>
          {cards}
        </details>
      )}

      <ExperiencePreviewModal
        experience={selectedExperience}
        onClose={() => {
          setSelectedExperienceId(null);
          setSelectedExperience(null);
        }}
      />
    </>
  );
}

type ExperiencePreviewModalProps = {
  experience: Experience | null;
  onClose: () => void;
};

function ExperiencePreviewModal({
  experience,
  onClose,
}: Readonly<ExperiencePreviewModalProps>) {
  if (!experience) {
    return null;
  }

  return (
    <ExperienceView
      isOpen={Boolean(experience)}
      onClose={onClose}
      experience={experience}
      showEditButton={false}
    />
  );
}
