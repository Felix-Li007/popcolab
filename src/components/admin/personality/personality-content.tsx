'use client';

import { useState, useEffect } from 'react';
import PersonalityCard from '@/components/admin/personality/personality-card';
import StatsCard from '@/components/admin/stats-card';
import PersonalityForm from '@/components/admin/personality/personality-edit';
import PersonalityView from '@/components/admin/personality/personality-view';
import { Button, Badge } from '@/ui';
import { Personality } from '@/types/personality-type';
import { usePersonality } from '@/hooks/usePersonality';
import contentStyles from '@/styles/personality-content.module.css';

const filterTabs = ['All', 'Active', 'Draft'] as const;
type FilterTab = (typeof filterTabs)[number];

type Props = {
  initialData: Personality[];
};

export default function PersonalityContent({ initialData }: Props) {
  const [personalities, setPersonalities] =
    useState<Personality[]>(initialData);
  const [filter, setFilter] = useState<FilterTab>('All');

  const {
    formModal,
    viewModal,
    openCreate,
    openEdit,
    openView,
    closeForm,
    closeView,
    handleDelete,
    formAction,
    selectedPersonality,
    viewedPersonality,
  } = usePersonality(personalities);

  useEffect(() => {
    setPersonalities(initialData);
  }, [initialData]);

  const filtered = personalities.filter(p => {
    if (filter === 'All') return true;
    return p.status === filter.toLowerCase();
  });

  const counts = {
    All: personalities.length,
    Active: personalities.filter(p => p.status === 'active').length,
    Draft: personalities.filter(p => p.status === 'draft').length,
  };

  return (
    <>
      <div className={contentStyles.root}>
        <div className={contentStyles.content}>
          <div className={contentStyles.statsGrid}>
            <StatsCard
              bgColor="bg-pink-light"
              glowColor="rgba(255, 187, 240, 0.5)"
              icon={<span className="text-lg">🎭</span>}
              value={counts.All}
              label="Personalities"
              trendLabel="personality types"
            />
            <StatsCard
              bgColor="bg-green-100"
              glowColor="rgba(134, 239, 172, 0.5)"
              icon={<span className="text-lg">✅</span>}
              value={counts.Active}
              label="Active"
              trend={`${Math.round((counts.Active / (counts.All || 1)) * 100)}%`}
              trendLabel="of total"
            />
            <StatsCard
              bgColor="bg-brand-yellow/40"
              glowColor="rgba(245, 221, 66, 0.45)"
              icon={<span className="text-lg">🎯</span>}
              value="2.4k"
              label="Quiz Results"
              trend="18%"
              trendLabel="this month"
            />
            <StatsCard
              bgColor="bg-lavender"
              glowColor="rgba(196, 181, 253, 0.45)"
              icon={<span className="text-lg">⭐</span>}
              value="91%"
              label="Top: Collector"
              trendLabel="match rate"
            />
          </div>

          <div className={contentStyles.listPanel}>
            <div className={contentStyles.filterBar}>
              <div className={contentStyles.filterTabs}>
                {filterTabs.map(tab => (
                  <Button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    variant="tab"
                    size="sm"
                    isActive={filter === tab}
                  >
                    {tab}
                    <Badge
                      variant="default"
                      size="xs"
                      bgColor={filter === tab ? 'bg-white/20' : 'bg-gray-100'}
                      textColor={
                        filter === tab ? 'text-white' : 'text-gray-500'
                      }
                    >
                      {counts[tab]}
                    </Badge>
                  </Button>
                ))}
              </div>
              <Button
                onClick={openCreate}
                variant="primary"
                size="sm"
                icon={<span>+</span>}
                className="shrink-0"
              >
                New
              </Button>
            </div>

            <div className={contentStyles.listArea}>
              <div className={contentStyles.personalityGrid}>
                {filtered.map(p => (
                  <div key={p.id} className="relative h-full">
                    {p.status === 'draft' && (
                      <Badge
                        variant="default"
                        size="xs"
                        className="absolute top-2 right-2 z-10"
                      >
                        DRAFT
                      </Badge>
                    )}
                    <PersonalityCard
                      type={p.type}
                      name={p.name}
                      description={p.description}
                      emoji={p.emoji}
                      threshold={p.threshold}
                      accentColor={p.accentColor}
                      onEdit={() => openEdit(p.id!)}
                      onView={() => openView(p.id!)}
                      onDelete={() => handleDelete(p.id!, p.name)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PersonalityForm
        key={formModal.id ?? 'create'}
        isOpen={formModal.open}
        onClose={closeForm}
        action={formAction}
        isEdit={formModal.id !== undefined}
        initial={selectedPersonality}
      />

      {viewedPersonality && (
        <PersonalityView
          isOpen={viewModal.open}
          onClose={closeView}
          onEdit={() => openEdit(viewModal.id!)}
          personality={viewedPersonality}
        />
      )}
    </>
  );
}
