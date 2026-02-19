import { Badge, Button } from '@/components/ui';
import styles from '@/styles/personality-card.module.css';

export type PersonalityType =
  | 'JOKER'
  | 'KINESTHETE'
  | 'EXPLORER'
  | 'COMPETITOR'
  | 'COLLECTOR'
  | string;

export type PersonalityCardProps = {
  type: PersonalityType;
  name: string;
  description: string;
  emoji?: string;
  stars?: number;
  threshold?: number;
  onEdit?: () => void;
  onView?: () => void;
  onDelete?: () => void;
};

const typeStyles: Record<
  string,
  { bg: string; text: string; border: string; orb: string; glow: string }
> = {
  JOKER: {
    bg: 'bg-teal-deep',
    text: 'text-white',
    border: 'border-teal-deep',
    orb: '#d0e9eb',
    glow: 'rgba(25,70,77,0.35)',
  },
  KINESTHETE: {
    bg: 'bg-magenta',
    text: 'text-white',
    border: 'border-magenta',
    orb: '#fde0ef',
    glow: 'rgba(245,46,129,0.35)',
  },
  EXPLORER: {
    bg: 'bg-brand-yellow',
    text: 'text-gray-800',
    border: 'border-brand-yellow',
    orb: '#fdf7d0',
    glow: 'rgba(245,221,66,0.45)',
  },
  COMPETITOR: {
    bg: 'bg-pink-bright',
    text: 'text-gray-800',
    border: 'border-pink-bright',
    orb: '#ffe6fb',
    glow: 'rgba(255,141,230,0.45)',
  },
  COLLECTOR: {
    bg: 'bg-pink-medium',
    text: 'text-gray-800',
    border: 'border-pink-medium',
    orb: '#ffedfb',
    glow: 'rgba(255,164,235,0.45)',
  },
  CREATOR: {
    bg: 'bg-coral-vibe',
    text: 'text-white',
    border: 'border-coral-vibe',
    orb: '#fde4e3',
    glow: 'rgba(228,82,74,0.35)',
  },
  DIRECTOR: {
    bg: 'bg-teal-accent',
    text: 'text-white',
    border: 'border-teal-accent',
    orb: '#ddedf0',
    glow: 'rgba(59,107,119,0.35)',
  },
  STORYTELLER: {
    bg: 'bg-coral-red',
    text: 'text-white',
    border: 'border-coral-red',
    orb: '#fde8e7',
    glow: 'rgba(233,117,110,0.4)',
  },
};

export default function PersonalityCard({
  type,
  name,
  description,
  emoji = '🃏',
  stars = 3,
  threshold,
  onEdit,
  onView,
  onDelete,
}: PersonalityCardProps) {
  const style = typeStyles[type] ?? {
    bg: 'bg-gray-200',
    text: 'text-gray-800',
    border: 'border-gray-200',
    orb: '#ede9fe',
    glow: 'rgba(0,0,0,0.15)',
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm h-full flex flex-col w-full overflow-hidden ${styles.card}`}
      style={
        {
          '--orb-color': style.orb,
          '--glow-color': style.glow,
        } as React.CSSProperties
      }
    >
      {/* Decorative orb — top-right corner, grows on hover */}
      <div className={styles.orb} aria-hidden="true" />
      {/* Card header - flexible content area */}
      <div className="relative z-10 px-3 pt-3 pb-2 flex-1 flex flex-col min-h-0">
        <div className="flex items-start justify-between mb-2 flex-shrink-0">
          <Badge
            variant="personality"
            size="sm"
            bgColor={style.bg}
            textColor={style.text}
          >
            {type}
          </Badge>
          <div className="flex flex-shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg
                key={i}
                className={`w-3 h-3 ${i < stars ? 'text-brand-yellow' : 'text-gray-200'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        {/* Icon + Threshold */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div
            className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center text-xl`}
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

        {/* Name & description */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <h3 className="text-sm font-bold text-gray-800 mb-1">{name}</h3>
          <p className="text-xs text-gray-500 line-clamp-3">{description}</p>
        </div>
      </div>

      {/* Actions - fixed at bottom */}
      <div className="relative z-10 px-3 py-2 border-t border-gray-100 flex items-center justify-between flex-nowrap flex-shrink-0">
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
