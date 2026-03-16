import { Badge, Button } from '@/ui';
import { cssVarStyle } from '@/utils/css-helper';
import styles from '@/styles/admin/personalities/personality-card.module.css';

export type PersonalityCardProps = {
  type: string;
  name: string;
  description: string;
  emoji?: string;
  threshold?: number;
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
  accentColor?: string;
};

export default function PersonalityCard({
  type,
  name,
  description,
  emoji = '🃏',
  threshold,
  onEdit,
  onView,
  onDelete,
  accentColor,
}: PersonalityCardProps) {
  const typeKey = type.toUpperCase().replace(/\s+/g, '') as string;
  const typeClass =
    (styles as Record<string, string>)[`type${typeKey}`] ?? styles.typeDefault;

  const glowStyle = accentColor
    ? cssVarStyle({ '--glow-color': accentColor })
    : undefined;

  return (
    <div className={`${styles.card} ${typeClass}`} style={glowStyle}>
      <div className={styles.orb} aria-hidden="true" />
      <div className="relative z-10 px-3 pt-3 pb-2 flex-1 flex flex-col min-h-0">
        <div className="flex items-start justify-between mb-2 shrink-0">
          <Badge
            variant="personality"
            size="sm"
            bgColor={accentColor}
            textColor="text-white"
          >
            {type}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-2 shrink-0">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl`}
          >
            {emoji}
          </div>
          {threshold !== undefined && (
            <div
              className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1"
              title="Score threshold"
            >
              <svg
                className="w-3 h-3 text-gray-400 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-sm font-bold text-gray-700">
                {threshold}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-800 mb-1">{name}</h3>
          <p className="text-xs text-gray-500 line-clamp-3">{description}</p>
        </div>
      </div>

      <div className="relative z-10 px-3 py-2 border-t border-gray-100 flex items-center justify-between flex-nowrap shrink-0">
        <Button
          onClick={onEdit}
          variant="text"
          size="xs"
          icon={
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
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          }
        >
          Edit
        </Button>
        <Button
          onClick={onView}
          variant="text"
          size="xs"
          className="hover:text-teal-deep"
          icon={
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
        >
          View
        </Button>
        {onDelete && (
          <Button
            onClick={onDelete}
            variant="text"
            size="xs"
            className="hover:text-red-500"
            icon={
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
            }
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
