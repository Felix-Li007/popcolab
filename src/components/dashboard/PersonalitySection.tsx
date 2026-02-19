import Link from 'next/link';
import PersonalityCard, { PersonalityCardProps } from './PersonalityCard';

const personalities: PersonalityCardProps[] = [
  {
    type: 'JOKER',
    name: 'The Joker',
    description: 'Joy through humour, wit, and lightness.',
    emoji: '🃏',
    stars: 4,
  },
  {
    type: 'KINESTHETE',
    name: 'The Kinesthete',
    description: 'Alive through movement, dance, and adventure.',
    emoji: '💃',
    stars: 5,
  },
  {
    type: 'EXPLORER',
    name: 'The Explorer',
    description: 'Thrives discovering new places and ideas.',
    emoji: '🧭',
    stars: 4,
  },
  {
    type: 'COMPETITOR',
    name: 'The Competitor',
    description: 'Fueled by challenge and the rush of competition.',
    emoji: '🏆',
    stars: 3,
  },
];

export default function PersonalitySection() {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎭</span>
          <h2 className="text-sm font-bold text-gray-800">Personalities</h2>
        </div>
        <Link
          href="/admin/personalities"
          className="text-xs text-magenta hover:text-teal-deep hover:underline font-semibold transition-colors"
        >
          View all →
        </Link>
      </div>
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gridAutoRows: '256px',
        }}
      >
        {personalities.map(p => (
          <PersonalityCard key={p.type} {...p} />
        ))}
      </div>
    </section>
  );
}
