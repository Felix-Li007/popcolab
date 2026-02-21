'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/admin-layout';
import PersonalityCardGrid from '@/components/admin/personality/personality-grid';
import StatsCard from '@/components/admin/stats-card';
import PersonalityForm from '@/components/admin/personality/personality-form';
import PersonalityView from '@/components/admin/personality/personality-view';
import PageFooter from '@/components/layout/page-footer';
import ContentHeader from '@/components/admin/content-header';
import { Button, Badge } from '@/ui';
import { PersonalityType } from '@/types/personality-type';
import { usePersonality } from '@/hooks/usePersonality';
import cardStyles from '@/styles/personality-card.module.css';

const filterTabs = ['All', 'Active', 'Draft'] as const;
type FilterTab = (typeof filterTabs)[number];

type Props = {
  initialData: PersonalityType[];
  personalitiesCount?: number;
};

export default function PersonalityContent({
  initialData,
  personalitiesCount,
}: Props) {
  const [personalities, setPersonalities] =
    useState<PersonalityType[]>(initialData);
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
      <div className="flex flex-col min-h-full">
        <div className="flex-1 p-4 flex flex-col gap-5 min-h-0">
          <ContentHeader
            emoji="🎭"
            title={
              <>
                Play <span className="text-magenta">Personalities</span>
              </>
            }
            subtitle={`${counts.All} types · ${counts.Active} active · last updated 2 hours ago`}
            actions={
              <Button
                onClick={openCreate}
                variant="primary"
                size="md"
                icon={<span>+</span>}
              >
                New Personality
              </Button>
            }
          />

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

          <div className="flex items-center gap-1 border-b border-gray-100 pb-1">
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
                  textColor={filter === tab ? 'text-white' : 'text-gray-500'}
                >
                  {counts[tab]}
                </Badge>
              </Button>
            ))}
          </div>

          <div
            className={`flex-1 min-h-0 overflow-y-auto ${cardStyles.cardGrid}`}
          >
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
                <PersonalityCardGrid
                  personalities={[p]}
                  onEdit={openEdit}
                  onView={openView}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        </div>

        <PageFooter />
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
