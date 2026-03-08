'use client';

import type {
  IntakeDimensionOption,
  IntakeForm,
} from '@/types/intake-form-type';
import styles from '@/styles/intake-card.module.css';

type IntakeCardProps = {
  form: IntakeForm;
  formIndex: number;
  isSelected: boolean;
  onSelect: (id: number) => void;
  availableDimensions: IntakeDimensionOption[];
  onView: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number, name: string) => void;
};

function EditIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}

function DeleteIcon({ className }: { className: string }) {
  return (
    <svg
      className="w-3 h-3"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}

function ViewIcon({ className }: { className: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
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
  );
}

function joinClasses(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}

function getAvatarText(value: string | undefined): string {
  const normalized = value?.trim();
  if (!normalized) return '?';
  return normalized.slice(0, 1).toUpperCase();
}

export default function IntakeCard({
  form,
  formIndex,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onDelete,
}: IntakeCardProps) {
  const formId = form.id;
  if (!formId) return null;

  const createdByUserName =
    form.createdByUserName?.trim() || `User ${form.createdBy}`;
  const avatarText = getAvatarText(createdByUserName);
  const normalizedDescription = form.description.trim() || '--';

  return (
    <article
      data-testid="intake-form-card"
      className={joinClasses(
        styles.formCard,
        isSelected && styles.formCardSelected
      )}
    >
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(formId)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(formId);
          }
        }}
        className={joinClasses(
          styles.formCardButton,
          isSelected ? styles.formCardButtonSelected : styles.formCardButtonIdle
        )}
      >
        <div className={styles.formCardOrb} aria-hidden="true" />

        <div className={styles.formCardHeader}>
          <div className={styles.formIdentity}>
            <div className={styles.formIdentityText}>
              <h3 className={styles.formHeaderTitle}>{form.name}</h3>
              <p className={styles.formHeaderMeta}>
                FORM #{formIndex} - {form.formType}
              </p>
            </div>
          </div>
          <span
            className={joinClasses(
              styles.statusBadge,
              form.status === 1 ? styles.statusActive : styles.statusDraft
            )}
          >
            {form.status === 1 ? 'Active' : 'Draft'}
          </span>
        </div>

        <div className={styles.formDescriptionPanel}>
          <p className={styles.formDescriptionLabel}>Description</p>
          <p className={styles.metaDescription}>{normalizedDescription}</p>
        </div>

        <div className={styles.formStatsGrid}>
          <div className={styles.formStatCard}>
            <p className={styles.formStatLabel}>Dimensions</p>
            <p className={styles.formStatValue}>{form.dimensionCount}</p>
          </div>
          <div className={styles.formStatCard}>
            <p className={styles.formStatLabel}>Questions</p>
            <p className={styles.formStatValue}>{form.questionCount}</p>
          </div>
          <div className={styles.formStatCard}>
            <p className={styles.formStatLabel}>Creator</p>
            <div className={styles.formStatCreator}>
              <span
                className={styles.formStatCreatorAvatar}
                title={createdByUserName}
                aria-label={`Creator: ${createdByUserName}`}
              >
                {avatarText}
              </span>
            </div>
          </div>
        </div>

        <div
          className={styles.formFooter}
          onClick={event => event.stopPropagation()}
        >
          <button
            type="button"
            className={styles.formActionEdit}
            onClick={() => onEdit(formId)}
            title="Edit form"
            aria-label="Edit form"
            data-testid="intake-card-edit"
          >
            <EditIcon className={styles.formActionIcon} />
            Edit
          </button>
          <button
            type="button"
            className={styles.formActionView}
            onClick={() => onView(formId)}
            title="View form"
            aria-label="View form"
            data-testid="intake-card-view"
          >
            <ViewIcon className={styles.formActionIcon} />
            View
          </button>
          <button
            type="button"
            className={styles.formActionDelete}
            onClick={() => onDelete(formId, form.name)}
            title="Delete form"
            aria-label="Delete form"
            data-testid="intake-card-delete"
          >
            <DeleteIcon className={styles.formActionIcon} />
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}
