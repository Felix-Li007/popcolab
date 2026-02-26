import { Badge, Button } from '@/ui';
import { cssVarStyle } from '@/utils/css-helper';
import type { Dimension } from '@/types/dimension-type';
import styles from '@/styles/dimension-card.module.css';

type Props = {
  dimension: Dimension;
  isEditingSelected: boolean;
  isBulkSelected: boolean;
  onSelect: () => void;
  onToggleSelect: () => void;
  onView: () => void;
  onDelete: () => void;
};

const GLOW_COLORS: Record<string, string> = {
  numeric: 'color-mix(in srgb, var(--color-coral-red) 80%, transparent)',
  text: 'color-mix(in srgb, var(--color-pink-medium) 80%, transparent)',
};

const TYPE_BADGE_STYLE: Record<
  string,
  {
    variant: 'info' | 'secondary' | 'personality';
    bgColor?: string;
    textColor?: string;
  }
> = {
  scale: { variant: 'info' },
  numeric: {
    variant: 'personality',
    bgColor: 'bg-brand-yellow/70',
    textColor: 'text-teal-deep',
  },
  text: { variant: 'secondary' },
};

export default function DimensionCard({
  dimension,
  isEditingSelected,
  isBulkSelected,
  onSelect,
  onToggleSelect,
  onView,
  onDelete,
}: Props) {
  const shownOptions = dimension.options.slice(0, 3);
  const hiddenCount =
    dimension.options.length > 3 ? dimension.options.length - 3 : 0;
  const normalizedType = dimension.dataType.toLowerCase();
  const glowStyle = cssVarStyle({
    '--glow-color':
      GLOW_COLORS[normalizedType] ??
      'color-mix(in srgb, var(--color-magenta) 18%, transparent)',
  });
  const typeBadgeStyle = TYPE_BADGE_STYLE[normalizedType] ?? {
    variant: 'secondary' as const,
  };

  return (
    <div
      data-testid="dimension-card"
      className={`${styles.card} ${isEditingSelected ? styles.cardActive : ''}`}
      style={glowStyle}
      onClick={onSelect}
    >
      <div className={styles.orb} aria-hidden="true" />

      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onToggleSelect();
        }}
        title="Select for bulk actions"
        aria-label="Select for bulk actions"
        className={`${styles.selectToggle} ${isBulkSelected ? styles.selectToggleOn : styles.selectToggleOff}`}
      >
        {isBulkSelected && <span className={styles.selectDot} />}
      </button>

      <div className={styles.cardBody}>
        <div className={styles.metaRow}>
          {dimension.hardFilter && (
            <span
              title="Hard Filter"
              aria-label="Hard Filter"
              className={styles.hardMark}
            >
              !
            </span>
          )}
          <span className={styles.keyText}>
            {dimension.indexKey || 'NO_KEY'}
          </span>
          <Badge
            variant={typeBadgeStyle.variant}
            bgColor={typeBadgeStyle.bgColor}
            textColor={typeBadgeStyle.textColor}
            size="xs"
          >
            {dimension.dataType}
          </Badge>
        </div>

        <h3 className={styles.title}>{dimension.indexName}</h3>
        <p className={styles.category}>{dimension.categoryName}</p>

        {dimension.indexNotes && (
          <p className={styles.notes}>{dimension.indexNotes}</p>
        )}

        <div className={styles.options}>
          {shownOptions.map((option, index) => (
            <Badge key={index} variant="default" size="xs">
              {option.value}
            </Badge>
          ))}
          {hiddenCount > 0 && (
            <Badge variant="default" size="xs">
              +{hiddenCount}
            </Badge>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          variant="text"
          size="xs"
          icon={
            <svg
              className={styles.actionIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          }
          onClick={event => {
            event.stopPropagation();
            onSelect();
          }}
        >
          Edit
        </Button>
        <Button
          variant="text"
          size="xs"
          className={styles.viewAction}
          icon={
            <svg
              className={styles.actionIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
          className={styles.deleteAction}
          icon={
            <svg
              className={styles.actionIcon}
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
  );
}
