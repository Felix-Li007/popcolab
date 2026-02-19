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
  onEdit?: () => void;
  onView?: () => void;
};

const typeStyles: Record<string, { bg: string; text: string; border: string }> =
  {
    JOKER: {
      bg: 'bg-teal-deep',
      text: 'text-white',
      border: 'border-teal-deep',
    },
    KINESTHETE: {
      bg: 'bg-magenta',
      text: 'text-white',
      border: 'border-magenta',
    },
    EXPLORER: {
      bg: 'bg-brand-yellow',
      text: 'text-gray-800',
      border: 'border-brand-yellow',
    },
    COMPETITOR: {
      bg: 'bg-pink-bright',
      text: 'text-gray-800',
      border: 'border-pink-bright',
    },
    COLLECTOR: {
      bg: 'bg-pink-medium',
      text: 'text-gray-800',
      border: 'border-pink-medium',
    },
    CREATOR: {
      bg: 'bg-coral-vibe',
      text: 'text-white',
      border: 'border-coral-vibe',
    },
    DIRECTOR: {
      bg: 'bg-teal-accent',
      text: 'text-white',
      border: 'border-teal-accent',
    },
    STORYTELLER: {
      bg: 'bg-coral-red',
      text: 'text-white',
      border: 'border-coral-red',
    },
  };

export default function PersonalityCard({
  type,
  name,
  description,
  emoji = '🃏',
  stars = 3,
  onEdit,
  onView,
}: PersonalityCardProps) {
  const style = typeStyles[type] ?? {
    bg: 'bg-gray-200',
    text: 'text-gray-800',
    border: 'border-gray-200',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Card header */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start justify-between mb-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${style.bg} ${style.text}`}
          >
            {type}
          </span>
          <div className="flex">
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

        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center text-xl mb-2`}
        >
          {emoji}
        </div>

        {/* Name & description */}
        <h3 className="text-sm font-bold text-gray-800">{name}</h3>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Actions */}
      <div className="px-3 py-2 border-t border-gray-100 flex items-center gap-3">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-magenta transition-colors"
        >
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
          Edit
        </button>
        <button
          onClick={onView}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-teal-deep transition-colors"
        >
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
          View
        </button>
        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 transition-colors">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
