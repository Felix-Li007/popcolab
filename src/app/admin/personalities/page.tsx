'use client';

import { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PersonalityCard from '@/components/dashboard/PersonalityCard';
import StatsCard from '@/components/dashboard/StatsCard';
import PersonalityFormModal, {
  type PersonalityData,
} from '@/components/dashboard/PersonalityFormModal';
import PersonalityViewModal from '@/components/dashboard/PersonalityViewModal';
import AdminFooter from '@/components/Footer';

const INITIAL_PERSONALITIES: PersonalityData[] = [
  {
    type: 'JOKER',
    name: 'The Joker',
    description:
      'Joy through humour, wit, and lightness. Brings laughter and levity to every experience.',
    emoji: '🃏',
    stars: 4,
    status: 'active',
  },
  {
    type: 'KINESTHETE',
    name: 'The Kinesthete',
    description:
      'Alive through movement, dance, and physical adventure. Learns best by doing.',
    emoji: '💃',
    stars: 5,
    status: 'active',
  },
  {
    type: 'EXPLORER',
    name: 'The Explorer',
    description:
      'Thrives on discovering new places, ideas, and perspectives. Curiosity-driven.',
    emoji: '🧭',
    stars: 4,
    status: 'active',
  },
  {
    type: 'COMPETITOR',
    name: 'The Competitor',
    description:
      'Fueled by challenge, rivalry, and the rush of competition. Loves to win.',
    emoji: '🏆',
    stars: 3,
    status: 'active',
  },
  {
    type: 'COLLECTOR',
    name: 'The Collector',
    description:
      'Finds joy in gathering, cataloguing, and mastering a domain of interest.',
    emoji: '🏅',
    stars: 4,
    status: 'active',
  },
  {
    type: 'CREATOR',
    name: 'The Creator',
    description:
      'Expresses through making — art, music, building, crafting imaginative worlds.',
    emoji: '🎨',
    stars: 5,
    status: 'active',
  },
  {
    type: 'DIRECTOR',
    name: 'The Director',
    description:
      'Loves to organize, lead, and design the experience for others to enjoy.',
    emoji: '🎬',
    stars: 3,
    status: 'draft',
  },
  {
    type: 'STORYTELLER',
    name: 'The Storyteller',
    description:
      'Captivates through narrative, roleplay, and imaginative world-building.',
    emoji: '📖',
    stars: 4,
    status: 'draft',
  },
];

const filterTabs = ['All', 'Active', 'Draft'] as const;
type FilterTab = (typeof filterTabs)[number];

export default function PersonalitiesPage() {
  const [personalities, setPersonalities] = useState<PersonalityData[]>(
    INITIAL_PERSONALITIES
  );
  const [filter, setFilter] = useState<FilterTab>('All');
  const [formModal, setFormModal] = useState<{ open: boolean; index?: number }>(
    { open: false }
  );
  const [viewModal, setViewModal] = useState<{ open: boolean; index?: number }>(
    { open: false }
  );

  const filtered = personalities.filter(p => {
    if (filter === 'All') return true;
    return p.status === filter.toLowerCase();
  });

  const counts = {
    All: personalities.length,
    Active: personalities.filter(p => p.status === 'active').length,
    Draft: personalities.filter(p => p.status === 'draft').length,
  };

  function openCreate() {
    setFormModal({ open: true });
  }

  function openEdit(globalIndex: number) {
    setViewModal({ open: false });
    setFormModal({ open: true, index: globalIndex });
  }

  function openView(globalIndex: number) {
    setViewModal({ open: true, index: globalIndex });
  }

  function handleSave(data: PersonalityData) {
    if (formModal.index !== undefined) {
      setPersonalities(prev =>
        prev.map((p, i) => (i === formModal.index ? data : p))
      );
    } else {
      setPersonalities(prev => [...prev, data]);
    }
    setFormModal({ open: false });
  }

  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        <div className="flex-1 p-4 space-y-5">
          {/* Page header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-lavender via-white to-coral-light rounded-2xl p-4 border border-pink-light/50 shadow-sm">
            <div>
              <h1 className="text-lg font-bold text-gray-800">
                🎭 Play <span className="text-magenta">Personalities</span>
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {counts.All} types · {counts.Active} active · last updated 2
                hours ago
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-2 py-3.5 rounded-full text-xs font-bold text-white bg-magenta hover:bg-teal-deep transition-colors"
              >
                <span>+</span> New Personality
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              bgColor="bg-pink-light"
              icon={<span className="text-lg">🌸</span>}
              value={counts.All}
              label="Total Types"
              trendLabel="personality types"
            />
            <StatsCard
              bgColor="bg-green-100"
              icon={<span className="text-lg">✅</span>}
              value={counts.Active}
              label="Active"
              trend={`${Math.round((counts.Active / counts.All) * 100)}%`}
              trendLabel="of total"
            />
            <StatsCard
              bgColor="bg-brand-yellow/40"
              icon={<span className="text-lg">🎯</span>}
              value="2.4k"
              label="Quiz Results"
              trend="18%"
              trendLabel="this month"
            />
            <StatsCard
              bgColor="bg-lavender"
              icon={<span className="text-lg">⭐</span>}
              value="91%"
              label="Top: Collector"
              trendLabel="match rate"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 border-b border-gray-100 pb-1">
            {filterTabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === tab
                    ? 'bg-teal-deep text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    filter === tab
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {counts[tab]}
                </span>
              </button>
            ))}
          </div>

          {/* Personalities grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map(p => {
              const globalIndex = personalities.indexOf(p);
              return (
                <div key={`${p.type}-${globalIndex}`} className="relative">
                  {p.status === 'draft' && (
                    <span className="absolute top-2 right-2 z-10 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-grey-light text-gray-500">
                      DRAFT
                    </span>
                  )}
                  <PersonalityCard
                    type={p.type}
                    name={p.name}
                    description={p.description}
                    emoji={p.emoji}
                    stars={p.stars}
                    onEdit={() => openEdit(globalIndex)}
                    onView={() => openView(globalIndex)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <AdminFooter />
      </div>

      {/* Create / Edit modal */}
      <PersonalityFormModal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false })}
        onSave={handleSave}
        initial={
          formModal.index !== undefined
            ? personalities[formModal.index]
            : undefined
        }
      />

      {/* View modal */}
      {viewModal.index !== undefined && (
        <PersonalityViewModal
          isOpen={viewModal.open}
          onClose={() => setViewModal({ open: false })}
          onEdit={() => openEdit(viewModal.index!)}
          personality={personalities[viewModal.index]}
        />
      )}
    </AdminLayout>
  );
}
