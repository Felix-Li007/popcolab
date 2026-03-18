'use client';

import { useState, useEffect } from 'react';
import PersonalityCard from '@/components/admin/personality/personality-card';
import PersonalityForm from '@/components/admin/personality/personality-edit';
import PersonalityView from '@/components/admin/personality/personality-view';
import { Button, Badge } from '@/ui';
import type {
  Personality,
  PersonalityActionHandlers,
} from '@/types/personality-type';
import { usePersonality } from '@/hooks/usePersonality';
import contentStyles from '@/styles/admin/personalities/personality-content.module.css';

const filterTabs = ['All', 'Active', 'Draft'] as const;
type FilterTab = (typeof filterTabs)[number];

type Props = {
  initialData: Personality[];
  personalityActions: PersonalityActionHandlers;
};

export default function PersonalityContent({
  initialData,
  personalityActions,
}: Props) {
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
  } = usePersonality(personalities, personalityActions);

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
                Add
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
