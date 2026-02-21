type ContentHeaderProps = {
  emoji?: string;
  title: React.ReactNode;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function ContentHeader({
  emoji,
  title,
  subtitle,
  actions,
}: ContentHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-lavender via-white to-coral-light rounded-2xl p-4 border border-pink-light/50 shadow-sm">
      <div>
        <h1 className="text-lg font-bold text-gray-800">
          {emoji && <span className="mr-1">{emoji}</span>}
          {title}
        </h1>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}
