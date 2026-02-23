import Link from 'next/link';
import type { Personality } from '@/types/personality-type';
import { cssVarStyle } from '@/utils/css-helper';

type Props = {
  personality: Personality;
  totalScore: number;
};

export default function TestResult({ personality, totalScore }: Props) {
  const glowStyle = personality.accentColor
    ? cssVarStyle({ '--glow-color': personality.accentColor })
    : undefined;

  return (
    <div className="flex flex-col items-center gap-6 text-center max-w-sm mx-auto">
      <p className="text-sm text-gray-500">Your play personality is</p>

      {/* Result card */}
      <div
        className="w-full rounded-2xl border border-gray-100 bg-white shadow-lg p-6 flex flex-col items-center gap-3"
        style={glowStyle}
      >
        <div className="text-5xl">{personality.emoji}</div>

        <div
          className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: personality.accentColor ?? '#0d9488' }}
        >
          {personality.type}
        </div>

        <h1 className="text-2xl font-bold text-gray-800">{personality.name}</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          {personality.description}
        </p>

        {/* Stars */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${i < personality.stars ? 'text-yellow-400' : 'text-gray-200'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        <p className="text-xs text-gray-400">Score: {totalScore}</p>
      </div>

      <Link
        href="/test"
        className="text-sm text-teal-deep underline underline-offset-4 hover:opacity-75"
      >
        Retake the test
      </Link>
    </div>
  );
}
