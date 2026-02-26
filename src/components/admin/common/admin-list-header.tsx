'use client';

type Props = {
  title: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  searchTestId?: string;
  actions?: React.ReactNode;
};

export default function AdminListHeader({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  searchTestId,
  actions,
}: Props) {
  return (
    <div className="px-4 py-3 border-b border-gray-100 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-gray-700">{title}</span>
        {actions ? (
          <div className="flex items-center gap-2">{actions}</div>
        ) : null}
      </div>

      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          value={searchValue}
          onChange={event => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          data-testid={searchTestId}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-magenta/30 focus:bg-white placeholder-gray-400 transition"
        />
      </div>
    </div>
  );
}
