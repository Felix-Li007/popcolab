'use client';

import { useState, useEffect, useTransition } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PersonalityCard from '@/components/dashboard/PersonalityCard';
import StatsCard from '@/components/dashboard/StatsCard';
import PersonalityFormModal from '@/components/dashboard/PersonalityFormModal';
import PersonalityViewModal from '@/components/dashboard/PersonalityViewModal';
import AdminFooter from '@/components/Footer';
import { Button, Badge } from '@/components/ui';
import { type PersonalityData } from '@/actions/personality-actions';
import {
  createPersonalityAction,
  updatePersonalityAction,
  deletePersonalityAction,
} from '@/actions/personality-actions';

const filterTabs = ['All', 'Active', 'Draft'] as const;
type FilterTab = (typeof filterTabs)[number];

type Props = {
  initialData: PersonalityData[];
  personalitiesCount?: number;
};

export default function PersonalitiesClient({
  initialData,
  personalitiesCount,
}: Props) {
  const [isPendingDelete, startDeleteTransition] = useTransition();
  const [personalities, setPersonalities] =
    useState<PersonalityData[]>(initialData);
  const [filter, setFilter] = useState<FilterTab>('All');
  const [formModal, setFormModal] = useState<{ open: boolean; id?: number }>({
    open: false,
  });
  const [viewModal, setViewModal] = useState<{ open: boolean; id?: number }>({
    open: false,
  });

  // 当 Server Component 重新获取数据后同步到本地状态
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

  function openCreate() {
    setFormModal({ open: true });
  }

  function openEdit(id: number) {
    setViewModal({ open: false });
    setFormModal({ open: true, id });
  }

  function openView(id: number) {
    setViewModal({ open: true, id });
  }

  function handleDelete(id: number, name: string) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`
      )
    )
      return;
    startDeleteTransition(async () => {
      try {
        await deletePersonalityAction(id);
        setViewModal({ open: false });
      } catch {
        alert('Failed to delete personality. Please try again.');
      }
    });
  }

  // Derive the correct server action for the modal
  const formAction =
    formModal.id !== undefined
      ? updatePersonalityAction.bind(null, formModal.id)
      : createPersonalityAction;

  return (
    <AdminLayout personalitiesCount={personalitiesCount}>
      <div className="flex flex-col min-h-full">
        <div className="flex-1 p-4 flex flex-col gap-5 min-h-0">
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
              <Button
                onClick={openCreate}
                variant="primary"
                size="md"
                icon={<span>+</span>}
              >
                New Personality
              </Button>
            </div>
          </div>

          {/* Stats row */}
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

          {/* Filter tabs */}
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

          {/* Personalities grid */}
          <div
            className="grid gap-4 flex-1 min-h-0 overflow-y-auto content-start"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gridAutoRows: '256px',
            }}
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
                <PersonalityCard
                  type={p.type}
                  name={p.name}
                  description={p.description}
                  emoji={p.emoji}
                  stars={p.stars}
                  threshold={p.threshold}
                  onEdit={() => openEdit(p.id!)}
                  onView={() => openView(p.id!)}
                  onDelete={() => handleDelete(p.id!, p.name)}
                />
              </div>
            ))}
          </div>
        </div>

        <AdminFooter />
      </div>

      {/* Create / Edit modal — key forces re-mount when switching targets */}
      <PersonalityFormModal
        key={formModal.id ?? 'create'}
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false })}
        action={formAction}
        isEdit={formModal.id !== undefined}
        initial={
          formModal.id !== undefined
            ? personalities.find(p => p.id === formModal.id)
            : undefined
        }
      />

      {/* View modal */}
      {viewModal.id !== undefined && (
        <PersonalityViewModal
          isOpen={viewModal.open}
          onClose={() => setViewModal({ open: false })}
          onEdit={() => openEdit(viewModal.id!)}
          personality={personalities.find(p => p.id === viewModal.id)!}
        />
      )}
    </AdminLayout>
  );
}
