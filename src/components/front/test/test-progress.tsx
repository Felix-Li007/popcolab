'use client';

type Props = {
  current: number;
  total: number;
};

function getFunnyMessage(current: number, total: number): string {
  const pct = current / total;
  if (pct <= 0.1) return "Let's see what you're actually made of 🎯";
  if (pct <= 0.25) return 'Ooh, getting warmed up! Things are heating up 🔥';
  if (pct <= 0.4) return 'Already spilling your secrets... we see you 👀';
  if (pct <= 0.5)
    return "Halfway! You're basically a personality scientist now 🧪";
  if (pct <= 0.65) return "More than halfway — you're on a ROLL ⭐";
  if (pct <= 0.75) return 'Your true self is starting to show... 🎨';
  if (pct <= 0.85) return 'Almost done! The suspense is absolutely REAL 😤';
  if (pct <= 0.95) return "One more push! You've totally got this 💥";
  return 'Last one! No pressure... okay maybe just a little 🎭';
}

export default function TestProgress({ current, total }: Readonly<Props>) {
  const fillPct = Math.round((current / total) * 100);
  const message = getFunnyMessage(current, total);

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Title + counter */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
          Play Personality Assessment
        </p>
        <span className="text-xs font-semibold text-gray-500">
          {current} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${fillPct}%`,
            background:
              'linear-gradient(to right, var(--color-teal-deep, #0d9488), #2dd4bf)',
          }}
        />
      </div>

      {/* Funny message */}
      <div className="h-5 flex items-center">
        <span className="text-xs font-semibold text-teal-deep bg-gray-100 px-3 py-0.5 rounded-full">
          {message}
        </span>
      </div>
    </div>
  );
}
