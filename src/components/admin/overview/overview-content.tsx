'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import EventsTable from '@/components/admin/event-table';
import RequestStatusChart from '@/components/admin/overview/request-status-chart';
import RequestStatusTrendChart from '@/components/admin/overview/request-trend-chart';
import QuickActions from '@/components/admin/quick-actions';
import QuizChart from '@/components/admin/quiz-chart';
import PersonalityGrid from '@/components/admin/personality/personality-grid';
import PersonalityForm from '@/components/admin/personality/personality-edit';
import PersonalityView from '@/components/admin/personality/personality-view';
import type { OverviewGrowthMetrics } from '@/types/overview-type';
import type {
  Personality,
  PersonalityActionHandlers,
} from '@/types/personality-type';
import { usePersonality } from '@/hooks/usePersonality';

type OverviewContentProps = {
  initialPersonalities: Personality[];
  personalitiesCount?: number;
  personalitiesActiveCount?: number;
  growthMetrics: OverviewGrowthMetrics;
  personalityActions: PersonalityActionHandlers;
};

function renderBreakdownList(
  items: OverviewGrowthMetrics['experienceMetrics']['deliveryMethodBreakdown'],
  emptyLabel: string
) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white/80">
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map(item => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map(item => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-gray-700">{item.label}</span>
            <span className="font-bold text-gray-500">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-teal-deep"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function getStatusTone(label: string) {
  switch (label.toLowerCase()) {
    case 'active':
      return {
        ring: 'border-emerald-200',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: '#15803d',
      };
    case 'draft':
      return {
        ring: 'border-amber-200',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: '#d97706',
      };
    default:
      return {
        ring: 'border-gray-200',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        dot: '#6b7280',
      };
  }
}

function buildStatusDonut(
  items: OverviewGrowthMetrics['experienceMetrics']['statusBreakdown']
) {
  const palette = items.map(item => getStatusTone(item.label).dot);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return {
      total,
      background: 'conic-gradient(rgb(229 231 235) 0deg 360deg)',
    };
  }

  let current = 0;
  const stops = items.map((item, index) => {
    const slice = (item.value / total) * 360;
    const start = current;
    const end = current + slice;
    current = end;
    return `${palette[index]} ${start}deg ${end}deg`;
  });

  return {
    total,
    background: `conic-gradient(${stops.join(', ')})`,
  };
}

function renderTrendBars(
  items: OverviewGrowthMetrics['experienceMetrics']['newExperienceTrend']
) {
  if (items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white/80">
        <p className="text-sm text-gray-400">No weekly trend available.</p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map(item => item.value), 1);

  return (
    <div className="flex h-44 items-end gap-2">
      {items.map(item => (
        <div
          key={item.periodKey}
          className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
        >
          <span className="text-[10px] font-bold text-gray-400">
            {item.value}
          </span>
          <div className="flex h-32 w-full items-end rounded-full bg-gray-100/80 px-1.5 py-1.5">
            <div
              className="w-full rounded-full bg-gradient-to-t from-coral-vibe via-coral-vibe to-coral-red shadow-[0_8px_20px_rgba(239,68,68,0.18)]"
              style={{
                height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0)}%`,
              }}
            />
          </div>
          <span className="text-[10px] font-medium text-gray-500">
            {item.periodLabel}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderTopCategoryBars(
  items: OverviewGrowthMetrics['experienceMetrics']['topCategories']
) {
  if (items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white/80">
        <p className="text-sm text-gray-400">
          No category distribution available.
        </p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map(item => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.label}
          className="rounded-[18px] border border-gray-100 bg-white/85 px-3 py-3 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-soft text-[10px] font-bold text-coral-vibe">
                #{index + 1}
              </span>
              <span className="truncate text-sm font-semibold text-gray-700">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-bold text-coral-vibe">
              {item.value}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-coral-vibe via-coral-red to-amber-400 shadow-[0_8px_20px_rgba(239,68,68,0.16)]"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function renderRankedBars(
  items: OverviewGrowthMetrics['requestMetrics']['topRequestedCategories'],
  emptyLabel: string
) {
  if (items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[20px] border border-dashed border-gray-200 bg-white/80">
        <p className="text-sm text-gray-400">{emptyLabel}</p>
      </div>
    );
  }

  const maxValue = Math.max(...items.map(item => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={item.label}
          className="rounded-[18px] border border-gray-100 bg-white/85 px-3 py-3 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral-soft text-[10px] font-bold text-coral-vibe">
                #{index + 1}
              </span>
              <span className="truncate text-sm font-semibold text-gray-700">
                {item.label}
              </span>
            </div>
            <span className="text-xs font-bold text-coral-vibe">
              {item.value}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100">
            <div
              className="h-2.5 rounded-full bg-gradient-to-r from-coral-vibe via-coral-red to-amber-400 shadow-[0_8px_20px_rgba(239,68,68,0.16)]"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewContent({
  initialPersonalities,
  growthMetrics,
  personalityActions,
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
  } = usePersonality(personalities, personalityActions);

  useEffect(() => {
    setPersonalities(initialPersonalities);
  }, [initialPersonalities]);

  const statusDonut = buildStatusDonut(
    growthMetrics.experienceMetrics.statusBreakdown
  );

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
                    Experience library overview
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Inventory health and content coverage across the current
                    experience library.
                  </p>
                </div>
                <Link
                  href="/admin/experiences"
                  className="text-xs text-magenta hover:text-teal-deep hover:underline font-semibold transition-colors"
                >
                  Manage experiences →
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div className="rounded-[22px] border border-coral-soft bg-rose-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                    Total Experiences
                  </p>
                  <p className="mt-2 text-2xl font-bold text-coral-red">
                    {growthMetrics.experienceMetrics.totalExperiences}
                  </p>
                </div>
                <div className="rounded-[22px] border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">
                    Active
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {growthMetrics.experienceMetrics.activeExperiences}
                  </p>
                </div>
                <div className="rounded-[22px] border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Draft
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.experienceMetrics.draftExperiences}
                  </p>
                </div>
                <div className="rounded-[22px] border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Inactive
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-700">
                    {growthMetrics.experienceMetrics.inactiveExperiences}
                  </p>
                </div>
                <div className="rounded-[22px] border border-teal-100 bg-teal-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    New This Week
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.experienceMetrics.newExperiencesThisWeek}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-emerald-50/35 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Status Mix
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Active, draft, and inactive share across the library.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                    <div className="relative mx-auto h-40 w-40">
                      <div
                        className="h-40 w-40 rounded-full border border-white shadow-[0_10px_35px_rgba(15,23,42,0.08)]"
                        style={{ background: statusDonut.background }}
                      />
                      <div className="absolute inset-[1.35rem] flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                          Total
                        </span>
                        <span className="mt-1 text-3xl font-bold text-gray-900">
                          {statusDonut.total}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {growthMetrics.experienceMetrics.statusBreakdown.map(
                        item => {
                          const tone = getStatusTone(item.label);
                          return (
                            <div
                              key={item.label}
                              className={`flex items-center justify-between gap-3 rounded-[18px] border px-3 py-3 ${tone.ring} ${tone.bg}`}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="h-3.5 w-3.5 rounded-full"
                                  style={{ backgroundColor: tone.dot }}
                                />
                                <span
                                  className={`text-sm font-semibold ${tone.text}`}
                                >
                                  {item.label}
                                </span>
                              </div>
                              <span
                                className={`text-lg font-bold ${tone.text}`}
                              >
                                {item.value}
                              </span>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-coral-soft/35 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      New Experiences Trend
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Weekly publishing pace over the last 8 weeks.
                    </p>
                  </div>
                  {renderTrendBars(
                    growthMetrics.experienceMetrics.newExperienceTrend
                  )}
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-teal-50/30 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Delivery Methods
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Coverage by delivery method across the library.
                    </p>
                  </div>
                  {renderBreakdownList(
                    growthMetrics.experienceMetrics.deliveryMethodBreakdown,
                    'No delivery method data available.'
                  )}
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-rose-50/30 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Top Categories
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Categories with the most experiences right now.
                    </p>
                  </div>
                  {renderTopCategoryBars(
                    growthMetrics.experienceMetrics.topCategories
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Request matching overview
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Match volume, conversion, and content demand across active
                    requests.
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

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/70">
                    Total Requests
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.totalRequests}
                  </p>
                </div>
                <div className="rounded-[22px] border border-teal-100 bg-teal-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    Match Rate
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.requestMetrics.matchRate.toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-[22px] border border-coral-soft bg-rose-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                    Avg Time To Match
                  </p>
                  <p className="mt-2 text-2xl font-bold text-coral-red">
                    {growthMetrics.requestMetrics.averageMatchTimeHours}h
                  </p>
                </div>
                <div className="rounded-[22px] border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Backlog
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-700">
                    {growthMetrics.requestMetrics.backlogRequests}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div className="min-w-0 rounded-[24px] border border-gray-100 bg-linear-to-br from-amber-50/60 via-white to-white p-3">
                  <div className="mb-2 px-1">
                    <h3 className="text-sm font-bold text-gray-800">
                      Request Status Mix
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Current request pipeline distribution.
                    </p>
                  </div>
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
                  <div className="mb-2 px-1">
                    <h3 className="text-sm font-bold text-gray-800">
                      Request Trend
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Monthly request flow by workflow status.
                    </p>
                  </div>
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

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-teal-50/30 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Top Requested Categories
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      What users are asking for most often.
                    </p>
                  </div>
                  {renderRankedBars(
                    growthMetrics.requestMetrics.topRequestedCategories,
                    'No request category data available.'
                  )}
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-rose-50/30 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Top Matched Experiences
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Experiences selected most often by the matching engine.
                    </p>
                  </div>
                  {renderRankedBars(
                    growthMetrics.requestMetrics.topMatchedExperiences,
                    'No matched experience data available.'
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-200 bg-white/90 p-4 shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Question health overview
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Coverage, readiness, and quality signals across the question
                    library.
                  </p>
                </div>
                <Link
                  href="/admin/questions"
                  className="text-xs text-magenta hover:text-teal-deep hover:underline font-semibold transition-colors"
                >
                  Manage questions →
                </Link>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[22px] border border-purple-100 bg-purple-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700/80">
                    Total Questions
                  </p>
                  <p className="mt-2 text-2xl font-bold text-purple-700">
                    {growthMetrics.questionMetrics.totalQuestions}
                  </p>
                </div>
                <div className="rounded-[22px] border border-teal-100 bg-teal-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    Mapped To Dimensions
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.questionMetrics.mappedQuestions}
                  </p>
                </div>
                <div className="rounded-[22px] border border-amber-100 bg-amber-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Unmapped
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.questionMetrics.unmappedQuestions}
                  </p>
                </div>
                <div className="rounded-[22px] border border-coral-soft bg-rose-50 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                    Missing Options
                  </p>
                  <p className="mt-2 text-2xl font-bold text-coral-red">
                    {
                      growthMetrics.questionMetrics
                        .choiceQuestionsWithoutOptions
                    }
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-3">
                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-purple-50/35 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      By Form Usage
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Which workflows each question set currently supports.
                    </p>
                  </div>
                  {renderBreakdownList(
                    growthMetrics.questionMetrics.byForm,
                    'No form usage data available.'
                  )}
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-sky-50/35 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      By Question Type
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Balance across single choice, multi choice, scale, and
                      text.
                    </p>
                  </div>
                  {renderBreakdownList(
                    growthMetrics.questionMetrics.byType,
                    'No question type data available.'
                  )}
                </div>

                <div className="rounded-[24px] border border-gray-100 bg-linear-to-br from-white via-white to-amber-50/35 p-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Needs Attention
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Gaps that can weaken assessment quality or matching
                      coverage.
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-[18px] border border-amber-100 bg-amber-50 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                        Unmapped Questions
                      </p>
                      <p className="mt-1 text-2xl font-bold text-amber-700">
                        {growthMetrics.questionMetrics.unmappedQuestions}
                      </p>
                      <p className="mt-1 text-xs text-amber-800/70">
                        Questions not linked to any dimension yet.
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-rose-100 bg-rose-50 px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                        Choice Questions Missing Options
                      </p>
                      <p className="mt-1 text-2xl font-bold text-coral-red">
                        {
                          growthMetrics.questionMetrics
                            .choiceQuestionsWithoutOptions
                        }
                      </p>
                      <p className="mt-1 text-xs text-coral-red/75">
                        Single and multi choice items that still need answer
                        options.
                      </p>
                    </div>
                  </div>
                </div>
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

            <EventsTable />
          </div>

          <aside className="w-56 shrink-0 p-4 space-y-4 border-l border-gray-100 hidden lg:block">
            <QuickActions />
            <QuizChart metrics={growthMetrics.quizMetrics} />
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
