'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import EventsTable from '@/components/dashboard/EventsTable';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuizChart from '@/components/dashboard/QuizChart';
import AdminFooter from '@/components/Footer';
import PersonalityCard from '@/components/dashboard/PersonalityCard';
import PersonalityFormModal from '@/components/dashboard/PersonalityFormModal';
import PersonalityViewModal from '@/components/dashboard/PersonalityViewModal';
import { type PersonalityData } from '@/actions/personality-actions';
import {
  createPersonalityAction,
  updatePersonalityAction,
  deletePersonalityAction,
} from '@/actions/personality-actions';

type Props = {
  initialPersonalities: PersonalityData[];
  personalitiesCount?: number;
  personalitiesActiveCount?: number;
};

export default function AdminClient({
  initialPersonalities,
  personalitiesCount,
  personalitiesActiveCount,
}: Props) {
  const [, startDeleteTransition] = useTransition();
  const [personalities, setPersonalities] =
    useState<PersonalityData[]>(initialPersonalities);
  const [formModal, setFormModal] = useState<{ open: boolean; id?: number }>({
    open: false,
  });
  const [viewModal, setViewModal] = useState<{ open: boolean; id?: number }>({
    open: false,
  });

  useEffect(() => {
    setPersonalities(initialPersonalities);
  }, [initialPersonalities]);

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

  const formAction =
    formModal.id !== undefined
      ? updatePersonalityAction.bind(null, formModal.id)
      : createPersonalityAction;

  return (
    <AdminLayout
      personalitiesCount={personalitiesCount ?? personalities.length}
    >
      <div className="flex flex-col min-h-full">
        {/* Main content area */}
        <div className="flex flex-1 gap-0">
          {/* Left: main dashboard */}
          <div className="flex-1 min-w-0 p-4 space-y-5">
            <DashboardHeader onNewPersonality={openCreate} />
            <StatsGrid
              personalitiesCount={personalitiesCount}
              personalitiesActiveCount={personalitiesActiveCount}
            />

            {/* Personalities Section */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎭</span>
                  <h2 className="text-sm font-bold text-gray-800">
                    Personalities
                  </h2>
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
                {personalities.slice(0, 4).map(p => (
                  <PersonalityCard
                    key={p.id}
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
                ))}
              </div>
            </section>

            <EventsTable />
          </div>

          {/* Right: sidebar panel */}
          <aside className="w-56 shrink-0 p-4 space-y-4 border-l border-gray-100 hidden lg:block">
            <QuickActions />
            <RecentActivity />
            <QuizChart />
          </aside>
        </div>

        {/* Footer */}
        <AdminFooter />
      </div>

      {/* Create / Edit modal */}
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
