'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import EventsTable from '@/components/dashboard/EventsTable';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuizChart from '@/components/dashboard/QuizChart';
import AdminFooter from '@/components/Footer';
import PersonalityCardGrid from '@/components/dashboard/PersonalityCardGrid';
import PersonalityFormModal from '@/components/dashboard/PersonalityFormModal';
import PersonalityViewModal from '@/components/dashboard/PersonalityViewModal';
import { QUESTION_TYPE_META } from '@/components/dashboard/QuestionCard';
import { type PersonalityData } from '@/types/personality';
import { type QuestionData } from '@/types/question';
import { usePersonalityModals } from '@/hooks/usePersonalityModals';
import surveysStyles from '@/styles/surveys.module.css';

type Props = {
  initialPersonalities: PersonalityData[];
  personalitiesCount?: number;
  personalitiesActiveCount?: number;
  initialQuestions?: QuestionData[];
};

export default function AdminClient({
  initialPersonalities,
  personalitiesCount,
  personalitiesActiveCount,
  initialQuestions = [],
}: Props) {
  const [personalities, setPersonalities] =
    useState<PersonalityData[]>(initialPersonalities);

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
  } = usePersonalityModals(personalities);

  useEffect(() => {
    setPersonalities(initialPersonalities);
  }, [initialPersonalities]);

  return (
    <AdminLayout
      personalitiesCount={personalitiesCount ?? personalities.length}
    >
      <div className="flex flex-col min-h-full">
        <div className="flex flex-1 gap-0">
          <div className="flex-1 min-w-0 p-4 space-y-5">
            <DashboardHeader onNewPersonality={openCreate} />
            <StatsGrid
              personalitiesCount={personalitiesCount}
              personalitiesActiveCount={personalitiesActiveCount}
            />

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
              <PersonalityCardGrid
                personalities={personalities.slice(0, 4)}
                onEdit={openEdit}
                onView={openView}
                onDelete={handleDelete}
              />
            </section>

            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <h2 className="text-sm font-bold text-gray-800">Surveys</h2>
                </div>
                <Link
                  href="/admin/surveys"
                  className="text-xs text-magenta hover:text-teal-deep hover:underline font-semibold transition-colors"
                >
                  View all →
                </Link>
              </div>
              {initialQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-3xl">📋</span>
                  <p className="text-xs text-gray-400">No questions yet.</p>
                </div>
              ) : (
                <div className={surveysStyles.previewGrid}>
                  {initialQuestions.map(q => {
                    const meta = QUESTION_TYPE_META[q.type];
                    return (
                      <Link
                        key={q.id}
                        href={`/admin/surveys?id=${q.id}`}
                        className="block h-full"
                      >
                        <div className={surveysStyles.previewCard}>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base leading-none">
                              {meta.icon}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                            {q.orderIndex != null && (
                              <span className="text-[10px] text-gray-400">
                                #{q.orderIndex}
                              </span>
                            )}
                          </div>
                          <div className={surveysStyles.previewCardBody}>
                            <p className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">
                              {q.text}
                            </p>
                            {q.description && (
                              <p className="text-xs text-gray-400 line-clamp-1">
                                {q.description}
                              </p>
                            )}
                            {q.dimensions.length > 0 && (
                              <div
                                className={surveysStyles.previewCardDimensions}
                              >
                                {q.dimensions.map((d, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100 whitespace-nowrap"
                                  >
                                    {d.dimensionName}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-50 text-[10px] text-gray-400 font-medium">
                            {q.options.length > 0 && (
                              <span>
                                🎯 {q.options.length} option
                                {q.options.length !== 1 ? 's' : ''}
                              </span>
                            )}
                            {q.dimensions.length > 0 && (
                              <span>🔗 {q.dimensions.length}</span>
                            )}
                            {q.updatedAt && (
                              <span className="ml-auto">
                                🕐{' '}
                                {new Date(q.updatedAt).toLocaleDateString(
                                  'zh-CN',
                                  {
                                    month: '2-digit',
                                    day: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            <EventsTable />
          </div>

          <aside className="w-56 shrink-0 p-4 space-y-4 border-l border-gray-100 hidden lg:block">
            <QuickActions />
            <RecentActivity />
            <QuizChart />
          </aside>
        </div>

        <AdminFooter />
      </div>

      <PersonalityFormModal
        key={formModal.id ?? 'create'}
        isOpen={formModal.open}
        onClose={closeForm}
        action={formAction}
        isEdit={formModal.id !== undefined}
        initial={selectedPersonality}
      />

      {viewedPersonality && (
        <PersonalityViewModal
          isOpen={viewModal.open}
          onClose={closeView}
          onEdit={() => openEdit(viewModal.id!)}
          personality={viewedPersonality}
        />
      )}
    </AdminLayout>
  );
}
