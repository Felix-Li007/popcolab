'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EventsTable from '@/components/admin/event-table';
import PlatformGrowthChart from '@/components/admin/overview/user-growth-chart';
import RequestStatusChart from '@/components/admin/overview/request-status-chart';
import RequestStatusTrendChart from '@/components/admin/overview/request-trend-chart';
import QuickActions from '@/components/admin/quick-actions';
import RecentActivity from '@/components/admin/recent-activity';
import QuizChart from '@/components/admin/quiz-chart';
import PersonalityGrid from '@/components/admin/personality/personality-grid';
import PersonalityForm from '@/components/admin/personality/personality-edit';
import PersonalityView from '@/components/admin/personality/personality-view';
import { QUESTION_TYPE_META } from '@/components/admin/question/question-card';
import type { OverviewGrowthMetrics } from '@/types/overview-type';
import { type Personality } from '@/types/personality-type';
import { type Question } from '@/types/question-type';
import { usePersonality } from '@/hooks/usePersonality';
import QuestionStyles from '@/styles/question-content.module.css';

type OverviewContentProps = {
  initialPersonalities: Personality[];
  personalitiesCount?: number;
  personalitiesActiveCount?: number;
  initialQuestions?: Question[];
  growthMetrics: OverviewGrowthMetrics;
};

function formatUpdatedAt(value: Date | string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  const minute = String(date.getUTCMinutes()).padStart(2, '0');

  return `${month}/${day} ${hour}:${minute} UTC`;
}

export default function OverviewContent({
  initialPersonalities,
  personalitiesCount,
  personalitiesActiveCount,
  initialQuestions = [],
  growthMetrics,
}: OverviewContentProps) {
  const [personalities, setPersonalities] =
    useState<Personality[]>(initialPersonalities);

  const {
    formModal,
    viewModal,
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
    setPersonalities(initialPersonalities);
  }, [initialPersonalities]);

  return (
    <>
      <div className="flex flex-col">
        <div className="flex flex-1 gap-0">
          <div className="flex-1 min-w-0 p-4 space-y-5">
            {/* <StatsGrid
              personalitiesCount={personalitiesCount}
              personalitiesActiveCount={personalitiesActiveCount}
            /> */}

            <section className="rounded-[28px] border border-gray-200 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Request status distribution
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    How submitted activity requests are currently distributed by
                    workflow status.
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <Link
                    href="/admin/requests"
                    className="block min-w-[128px] rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 transition-colors hover:border-amber-200 hover:bg-amber-100/70"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/70">
                      Total Requests
                    </p>
                    <p className="mt-1 text-2xl font-bold text-amber-700 underline decoration-amber-700/35 underline-offset-4">
                      {growthMetrics.totalRequests}
                    </p>
                    <p className="text-xs text-amber-800/70">
                      {growthMetrics.requestStatus.length} status buckets
                    </p>
                  </Link>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div className="min-w-0 rounded-[24px] border border-gray-100 bg-linear-to-br from-amber-50/60 via-white to-white p-3">
                  {growthMetrics.requestStatus.length === 0 ? (
                    <div className="flex h-[280px] items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white/80">
                      <p className="text-sm text-gray-400">
                        No requests available yet.
                      </p>
                    </div>
                  ) : (
                    <RequestStatusChart data={growthMetrics.requestStatus} />
                  )}
                </div>

                <div className="min-w-0 rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-amber-50/35 p-3">
                  {growthMetrics.requestTrend.length === 0 ? (
                    <div className="flex h-[280px] items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white/80">
                      <p className="text-sm text-gray-400">
                        No monthly request trend available.
                      </p>
                    </div>
                  ) : (
                    <RequestStatusTrendChart
                      data={growthMetrics.requestTrend}
                    />
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Users and teams over the last 6 months
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Monthly creation trend for core admin entities.
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:items-end">
                  <div className="flex gap-2">
                    <Link
                      href="/admin/users"
                      className="block min-w-[128px] rounded-2xl border border-teal-100 bg-teal-50 px-3 py-2 transition-colors hover:border-teal-200 hover:bg-teal-100/70"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                        Total Users
                      </p>
                      <p className="mt-1 text-2xl font-bold text-teal-deep underline decoration-teal-deep/35 underline-offset-4">
                        {growthMetrics.totalUsers}
                      </p>
                      <p className="text-xs text-teal-deep/70">
                        {growthMetrics.usersThisMonth} this month
                      </p>
                    </Link>
                    <Link
                      href="/admin/users/teams"
                      className="block min-w-[128px] rounded-2xl border border-coral-soft bg-rose-50 px-3 py-2 transition-colors hover:border-rose-200 hover:bg-rose-100/70"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                        Total Teams
                      </p>
                      <p className="mt-1 text-2xl font-bold text-coral-red underline decoration-coral-red/35 underline-offset-4">
                        {growthMetrics.totalTeams}
                      </p>
                      <p className="text-xs text-coral-red/80">
                        {growthMetrics.teamsThisMonth} this month
                      </p>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-[24px] border border-gray-100 bg-linear-to-br from-slate-50 via-white to-rose-50/40 p-3">
                <PlatformGrowthChart data={growthMetrics.growth} />
              </div>
            </section>

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
              <PersonalityGrid
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
                  <h2 className="text-sm font-bold text-gray-800">Questions</h2>
                </div>
                <Link
                  href="/admin/questions"
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
                <div className={QuestionStyles.previewGrid}>
                  {initialQuestions.map(q => {
                    const meta = QUESTION_TYPE_META[q.type];
                    return (
                      <Link
                        key={q.id}
                        href={`/admin/questions?id=${q.id}`}
                        className="block h-full"
                      >
                        <div className={QuestionStyles.previewCard}>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-base leading-none">
                              {meta.icon}
                            </span>
                            <span
                              className={` text-badge font-bold px-2 py-0.5 rounded-full ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                            {q.orderIndex != null && (
                              <span className="text-[10px] text-gray-400">
                                #{q.orderIndex}
                              </span>
                            )}
                          </div>
                          <div className={QuestionStyles.previewCardBody}>
                            <p className="font-semibold text-gray-800 line-clamp-2 leading-snug">
                              {q.text}
                            </p>
                            {q.description && (
                              <p className="text-gray-400 line-clamp-1">
                                {q.description}
                              </p>
                            )}
                            {q.dimensions.length > 0 && (
                              <div
                                className={QuestionStyles.previewCardDimensions}
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
                                🕐 {formatUpdatedAt(q.updatedAt)}
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
