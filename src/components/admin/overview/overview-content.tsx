'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import EventsTable from '@/components/admin/event-table';
import RequestStatusChart from '@/components/admin/overview/request-status-chart';
import RequestStatusTrendChart from '@/components/admin/overview/request-trend-chart';
import PlatformGrowthChart from '@/components/admin/overview/user-growth-chart';
import QuickActions from '@/components/admin/quick-actions';
import QuizChart from '@/components/admin/quiz-chart';
import EventView from '@/components/admin/event/event-view';
import { getOverviewEventByIdAction } from '@/actions/overview-actions';
import type { Event } from '@/types/event-type';
import type {
  OverviewBreakdownItem,
  OverviewGrowthMetrics,
} from '@/types/overview-type';

type OverviewContentProps = {
  growthMetrics: OverviewGrowthMetrics;
};

function renderBreakdownList(
  items: OverviewGrowthMetrics['experienceMetrics']['deliveryMethodBreakdown'],
  emptyLabel: string
) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white/80">
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
          <div className="h-2 rounded-full bg-gradient-to-b from-white to-gray-100 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),inset_0_-1px_2px_rgba(15,23,42,0.08)]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-teal-500 via-teal-deep to-emerald-500 shadow-[0_6px_16px_rgba(15,118,110,0.22)]"
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

function getProposalStatusTone(label: string) {
  switch (label.toLowerCase()) {
    case 'accepted':
      return {
        ring: 'border-emerald-200',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        dot: '#10b981',
      };
    case 'approved':
      return {
        ring: 'border-sky-200',
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        dot: '#38bdf8',
      };
    case 'pending':
      return {
        ring: 'border-amber-200',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        dot: '#f59e0b',
      };
    case 'rejected':
      return {
        ring: 'border-rose-200',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        dot: '#fb7185',
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
  items: OverviewBreakdownItem[],
  getTone: (label: string) => { dot: string }
) {
  const palette = items.map(item => getTone(item.label).dot);
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
      <div className="flex h-44 items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white/80">
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
          <div className="flex h-32 w-full items-end rounded-full bg-gradient-to-b from-white via-gray-50 to-gray-100/90 px-1.5 py-1.5 shadow-[inset_0_2px_6px_rgba(255,255,255,0.9),inset_0_-2px_8px_rgba(15,23,42,0.08),0_10px_24px_rgba(15,23,42,0.06)]">
            <div
              className="relative w-full overflow-hidden rounded-full bg-gradient-to-t from-coral-vibe via-coral-red to-orange-300 shadow-[0_14px_28px_rgba(239,68,68,0.26)]"
              style={{
                height: `${Math.max((item.value / maxValue) * 100, item.value > 0 ? 12 : 0)}%`,
              }}
            >
              <div className="absolute inset-x-[18%] top-1 h-2 rounded-full bg-white/45 blur-[2px]" />
            </div>
          </div>
          <span className="text-[10px] font-medium text-gray-500">
            {item.periodLabel}
          </span>
        </div>
      ))}
    </div>
  );
}

function renderTrendLine(
  items: OverviewGrowthMetrics['experienceMetrics']['newExperienceTrend']
) {
  if (items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white/80">
        <p className="text-sm text-gray-400">No weekly trend available.</p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const paddingX = 24;
  const paddingTop = 18;
  const paddingBottom = 44;
  const maxValue = Math.max(...items.map(item => item.value), 1);
  const stepX =
    items.length === 1
      ? 0
      : (width - paddingX * 2) / Math.max(items.length - 1, 1);

  const points = items.map((item, index) => {
    const x = paddingX + stepX * index;
    const chartHeight = height - paddingTop - paddingBottom;
    const y = paddingTop + chartHeight - (item.value / maxValue) * chartHeight;

    return { ...item, x, y };
  });

  const linePath = points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? paddingX} ${
    height - paddingBottom
  } L ${points[0]?.x ?? paddingX} ${height - paddingBottom} Z`;

  return (
    <div className="rounded-[14px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(247,250,252,0.64))] px-3 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.86)]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full overflow-visible"
        aria-hidden="true"
      >
        {[0, 0.25, 0.5, 0.75, 1].map(step => {
          const y = paddingTop + (height - paddingTop - paddingBottom) * step;
          return (
            <line
              key={step}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="rgba(148,163,184,0.16)"
              strokeDasharray="4 6"
            />
          );
        })}
        <path d={areaPath} fill="url(#proposalTrendFill)" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#proposalTrendStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map(point => (
          <g key={point.periodKey}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5.5"
              fill="white"
              stroke="#0f766e"
              strokeWidth="2"
            />
            <circle cx={point.x} cy={point.y} r="2.5" fill="#14b8a6" />
            <text
              x={point.x}
              y={point.y - 12}
              textAnchor="middle"
              className="fill-slate-400 text-[10px] font-bold"
            >
              {point.value}
            </text>
            <text
              x={point.x}
              y={height - 14}
              textAnchor="middle"
              className="fill-slate-500 text-[10px] font-medium"
            >
              {point.periodLabel}
            </text>
          </g>
        ))}
        <defs>
          <linearGradient id="proposalTrendStroke" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient
            id="proposalTrendFill"
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(45,212,191,0.28)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.04)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

function renderTopCategoryBars(
  items: OverviewGrowthMetrics['experienceMetrics']['topCategories']
) {
  if (items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white/80">
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
          className="rounded-[14px] border border-gray-100 bg-white/85 px-3 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
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
          <div className="h-2.5 rounded-full bg-gradient-to-b from-white to-gray-100 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),inset_0_-1px_2px_rgba(15,23,42,0.08)]">
            <div
              className="relative h-2.5 rounded-full bg-gradient-to-r from-coral-vibe via-coral-red to-amber-400 shadow-[0_10px_24px_rgba(239,68,68,0.22)]"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            >
              <div className="absolute inset-y-[1px] left-2 right-4 rounded-full bg-white/35 blur-[2px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function renderRankedBars(items: OverviewBreakdownItem[], emptyLabel: string) {
  if (items.length === 0) {
    return (
      <div className="flex h-44 items-center justify-center rounded-[16px] border border-dashed border-gray-200 bg-white/80">
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
          className="rounded-[14px] border border-gray-100 bg-white/85 px-3 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.06)]"
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
          <div className="h-2.5 rounded-full bg-gradient-to-b from-white to-gray-100 shadow-[inset_0_1px_2px_rgba(255,255,255,0.85),inset_0_-1px_2px_rgba(15,23,42,0.08)]">
            <div
              className="relative h-2.5 rounded-full bg-gradient-to-r from-coral-vibe via-coral-red to-amber-400 shadow-[0_10px_24px_rgba(239,68,68,0.22)]"
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            >
              <div className="absolute inset-y-[1px] left-2 right-4 rounded-full bg-white/35 blur-[2px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewContent({
  growthMetrics,
}: Readonly<OverviewContentProps>) {
  const [selectedOverviewEvent, setSelectedOverviewEvent] = useState<
    Event | undefined
  >(undefined);
  const [, startEventTransition] = useTransition();
  const latestOverviewEventRequestIdRef = useRef(0);

  const statusDonut = buildStatusDonut(
    growthMetrics.experienceMetrics.statusBreakdown,
    getStatusTone
  );
  const proposalStatusDonut = buildStatusDonut(
    growthMetrics.proposalMetrics.statusBreakdown,
    getProposalStatusTone
  );
  const sectionShellClass =
    'relative overflow-hidden rounded-[14px] border border-white/75 bg-[linear-gradient(145deg,rgba(255,255,255,0.96),rgba(248,252,255,0.84)_52%,rgba(255,247,242,0.78))] p-4 shadow-[0_34px_90px_rgba(15,23,42,0.1),0_14px_36px_rgba(15,23,42,0.07),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(148,163,184,0.08)] backdrop-blur-xl';
  const sectionTitleClass =
    'text-[1.02rem] font-bold tracking-[-0.02em] text-slate-900';
  const sectionCopyClass = 'mt-1.5 text-sm leading-6 text-slate-500/90';
  const sectionLinkClass =
    'text-xs font-semibold text-magenta transition-colors hover:text-teal-deep hover:underline';
  const sectionPanelClass =
    'rounded-[14px] border border-white/82 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(247,250,252,0.8))] p-4 shadow-[0_22px_44px_rgba(15,23,42,0.08),0_8px_20px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-1px_0_rgba(148,163,184,0.06)] backdrop-blur-xl';
  const statCardClass =
    'relative overflow-hidden rounded-[14px] border border-white/85 px-5 py-4 shadow-[0_18px_34px_rgba(15,23,42,0.08),0_6px_16px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.94),inset_0_-1px_0_rgba(148,163,184,0.06)] backdrop-blur-xl';

  const renderStatAccent = (className: string) => (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -left-px bottom-3 top-3 w-[5px] rounded-r-full ${className}`}
    />
  );

  return (
    <>
      <div className="relative flex flex-1 gap-0">
        <div className="flex-1 min-w-0 p-4 space-y-5">
          <EventsTable
            events={growthMetrics.eventMetrics.highlightedEvents}
            onView={id => {
              setSelectedOverviewEvent(undefined);
              const requestId = latestOverviewEventRequestIdRef.current + 1;
              latestOverviewEventRequestIdRef.current = requestId;
              startEventTransition(async () => {
                const event = await getOverviewEventByIdAction(id);
                if (latestOverviewEventRequestIdRef.current !== requestId) {
                  return;
                }
                setSelectedOverviewEvent(event ?? undefined);
              });
            }}
          />

          <section className={sectionShellClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h2 className={sectionTitleClass}>User & team overview</h2>
                <p className={sectionCopyClass}>
                  Growth, adoption, and collaboration signals across the
                  platform.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href="/admin/users" className={sectionLinkClass}>
                  Manage users & teams →
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(226,255,251,0.94),rgba(239,252,249,0.76))]`}
                >
                  {renderStatAccent('bg-teal-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    Total Users
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.totalUsers}
                  </p>
                  <p className="mt-1 text-xs text-teal-deep/70">
                    +{growthMetrics.usersLast14Days} in the last 14 days
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,240,241,0.94),rgba(255,246,246,0.78))]`}
                >
                  {renderStatAccent('bg-rose-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                    Total Teams
                  </p>
                  <p className="mt-2 text-2xl font-bold text-coral-red">
                    {growthMetrics.totalTeams}
                  </p>
                  <p className="mt-1 text-xs text-coral-red/75">
                    +{growthMetrics.teamsLast14Days} in the last 14 days
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,248,225,0.96),rgba(255,251,239,0.8))]`}
                >
                  {renderStatAccent('bg-amber-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Onboarding Complete
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.userTeamMetrics.onboardingCompletionRate.toFixed(
                      1
                    )}
                    %
                  </p>
                  <p className="mt-1 text-xs text-amber-800/75">
                    {growthMetrics.userTeamMetrics.onboardingCompletedUsers}{' '}
                    users finished intake + personality
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(237,248,255,0.96),rgba(244,250,255,0.8))]`}
                >
                  {renderStatAccent('bg-sky-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700/80">
                    Invite Acceptance
                  </p>
                  <p className="mt-2 text-2xl font-bold text-sky-700">
                    {growthMetrics.userTeamMetrics.inviteAcceptanceRate.toFixed(
                      1
                    )}
                    %
                  </p>
                  <p className="mt-1 text-xs text-sky-800/75">
                    {growthMetrics.userTeamMetrics.acceptedInvites} accepted of{' '}
                    {growthMetrics.userTeamMetrics.totalInvites} total invites
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                <div className={sectionPanelClass}>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      User & Team Growth
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      New users and teams created over the last 14 days.
                    </p>
                  </div>
                  <PlatformGrowthChart data={growthMetrics.growth} />
                </div>

                <div className={sectionPanelClass}>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Collaboration Health
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Team participation and invite flow across the workspace.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-[14px] border border-white/82 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.78))] px-3 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.08),0_6px_14px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Users In Teams
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {growthMetrics.userTeamMetrics.usersInTeams}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {growthMetrics.userTeamMetrics.soloUsers} users are
                        still solo
                      </p>
                    </div>

                    <div className="rounded-[14px] border border-white/82 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.78))] px-3 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.08),0_6px_14px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Avg Team Size
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {growthMetrics.userTeamMetrics.averageTeamSize}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {growthMetrics.userTeamMetrics.teamsWithMultipleMembers}{' '}
                        teams have 2+ members
                      </p>
                    </div>

                    <div className="rounded-[14px] border border-white/82 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.78))] px-3 py-3 shadow-[0_16px_30px_rgba(15,23,42,0.08),0_6px_14px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.95)]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                        Pending Invites
                      </p>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {growthMetrics.userTeamMetrics.pendingInvites}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {growthMetrics.userTeamMetrics.rejectedInvites} rejected
                        so far
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className={sectionShellClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h2 className={sectionTitleClass}>
                  Experience library overview
                </h2>
                <p className={sectionCopyClass}>
                  Inventory health and content coverage across the current
                  experience library.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href="/admin/experiences" className={sectionLinkClass}>
                  Manage experiences →
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,240,241,0.94),rgba(255,246,246,0.78))]`}
                >
                  {renderStatAccent('bg-rose-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                    Total Experiences
                  </p>
                  <p className="mt-2 text-2xl font-bold text-coral-red">
                    {growthMetrics.experienceMetrics.totalExperiences}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(230,251,240,0.95),rgba(241,253,246,0.78))]`}
                >
                  {renderStatAccent('bg-emerald-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">
                    Active
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {growthMetrics.experienceMetrics.activeExperiences}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,248,225,0.96),rgba(255,251,239,0.8))]`}
                >
                  {renderStatAccent('bg-amber-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Draft
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.experienceMetrics.draftExperiences}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(247,248,250,0.95),rgba(251,252,253,0.82))]`}
                >
                  {renderStatAccent('bg-slate-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Inactive
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-700">
                    {growthMetrics.experienceMetrics.inactiveExperiences}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(226,255,251,0.94),rgba(239,252,249,0.76))]`}
                >
                  {renderStatAccent('bg-teal-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    New This Week
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.experienceMetrics.newExperiencesThisWeek}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className={sectionPanelClass}>
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
                        className="h-40 w-40 rounded-full border border-white shadow-[0_18px_40px_rgba(15,23,42,0.14),inset_0_2px_8px_rgba(255,255,255,0.5)]"
                        style={{ background: statusDonut.background }}
                      />
                      <div className="pointer-events-none absolute inset-2 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.38),transparent_42%)]" />
                      <div className="absolute inset-[1.35rem] flex flex-col items-center justify-center rounded-full bg-white shadow-[inset_0_2px_8px_rgba(255,255,255,0.85),0_10px_24px_rgba(15,23,42,0.08)]">
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
                              className={`flex items-center justify-between gap-3 rounded-[14px] border px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.07)] ${tone.ring} ${tone.bg}`}
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

                <div className={sectionPanelClass}>
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

                <div className={sectionPanelClass}>
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

                <div className={sectionPanelClass}>
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
            </div>
          </section>

          <section className={sectionShellClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h2 className={sectionTitleClass}>Request matching overview</h2>
                <p className={sectionCopyClass}>
                  Match volume, conversion, and content demand across the full
                  request pipeline.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href="/admin/requests" className={sectionLinkClass}>
                  Manage requests →
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,248,225,0.96),rgba(255,251,239,0.8))]`}
                >
                  {renderStatAccent('bg-amber-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800/70">
                    Total Requests
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.totalRequests}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(226,255,251,0.94),rgba(239,252,249,0.76))]`}
                >
                  {renderStatAccent('bg-teal-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    Match Rate
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.requestMetrics.matchRate.toFixed(1)}%
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,240,241,0.94),rgba(255,246,246,0.78))]`}
                >
                  {renderStatAccent('bg-rose-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                    Avg Time To Match
                  </p>
                  <p className="mt-2 text-2xl font-bold text-coral-red">
                    {growthMetrics.requestMetrics.averageMatchTimeHours}h
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(247,248,250,0.95),rgba(251,252,253,0.82))]`}
                >
                  {renderStatAccent('bg-slate-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                    Backlog
                  </p>
                  <p className="mt-2 text-2xl font-bold text-gray-700">
                    {growthMetrics.requestMetrics.backlogRequests}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
                <div className={`${sectionPanelClass} min-w-0 p-3`}>
                  <div className="mb-2 px-1">
                    <h3 className="text-sm font-bold text-gray-800">
                      Request Status Mix
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Current request pipeline distribution.
                    </p>
                  </div>
                  {growthMetrics.requestStatus.length === 0 ? (
                    <div className="flex h-[280px] items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white/80">
                      <p className="text-sm text-gray-400">
                        No requests available yet.
                      </p>
                    </div>
                  ) : (
                    <RequestStatusChart data={growthMetrics.requestStatus} />
                  )}
                </div>

                <div className={`${sectionPanelClass} min-w-0 p-3`}>
                  <div className="mb-2 px-1">
                    <h3 className="text-sm font-bold text-gray-800">
                      Request Trend
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Monthly request flow by workflow status.
                    </p>
                  </div>
                  {growthMetrics.requestTrend.length === 0 ? (
                    <div className="flex h-[280px] items-center justify-center rounded-[14px] border border-dashed border-gray-200 bg-white/80">
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
                <div className={sectionPanelClass}>
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

                <div className={sectionPanelClass}>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Top Matched Experiences
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Experiences attached most often to matched or closed
                      requests.
                    </p>
                  </div>
                  {renderRankedBars(
                    growthMetrics.requestMetrics.topMatchedExperiences,
                    'No matched experience data available.'
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={sectionShellClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h2 className={sectionTitleClass}>Proposal overview</h2>
                <p className={sectionCopyClass}>
                  Proposal throughput, acceptance, and experience packaging
                  across the recommendation pipeline.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href="/admin/proposals" className={sectionLinkClass}>
                  Manage proposals →
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(238,248,255,0.96),rgba(245,250,255,0.82))]`}
                >
                  {renderStatAccent('bg-sky-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-700/80">
                    Total Proposals
                  </p>
                  <p className="mt-2 text-2xl font-bold text-sky-700">
                    {growthMetrics.proposalMetrics.totalProposals}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,248,225,0.96),rgba(255,251,239,0.8))]`}
                >
                  {renderStatAccent('bg-amber-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Pending
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.proposalMetrics.pendingProposals}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(230,251,240,0.95),rgba(241,253,246,0.78))]`}
                >
                  {renderStatAccent('bg-emerald-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">
                    Accepted
                  </p>
                  <p className="mt-2 text-2xl font-bold text-emerald-700">
                    {growthMetrics.proposalMetrics.acceptedProposals}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,240,241,0.94),rgba(255,246,246,0.78))]`}
                >
                  {renderStatAccent('bg-rose-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-coral-red/80">
                    Rejected
                  </p>
                  <p className="mt-2 text-2xl font-bold text-coral-red">
                    {growthMetrics.proposalMetrics.rejectedProposals}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(226,255,251,0.94),rgba(239,252,249,0.76))]`}
                >
                  {renderStatAccent('bg-teal-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    Acceptance Rate
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.proposalMetrics.acceptanceRate.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-xs text-teal-deep/70">
                    {
                      growthMetrics.proposalMetrics
                        .averageExperiencesPerProposal
                    }{' '}
                    experiences per proposal
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className={sectionPanelClass}>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Status Mix
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Current proposal distribution by workflow outcome.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
                    <div className="relative mx-auto h-40 w-40">
                      <div
                        className="h-40 w-40 rounded-full border border-white shadow-[0_18px_40px_rgba(15,23,42,0.14),inset_0_2px_8px_rgba(255,255,255,0.5)]"
                        style={{ background: proposalStatusDonut.background }}
                      />
                      <div className="pointer-events-none absolute inset-2 rounded-full bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.38),transparent_42%)]" />
                      <div className="absolute inset-[1.35rem] flex flex-col items-center justify-center rounded-full bg-white shadow-[inset_0_2px_8px_rgba(255,255,255,0.85),0_10px_24px_rgba(15,23,42,0.08)]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                          Total
                        </span>
                        <span className="mt-1 text-3xl font-bold text-gray-900">
                          {proposalStatusDonut.total}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {growthMetrics.proposalMetrics.statusBreakdown.map(
                        item => {
                          const tone = getProposalStatusTone(item.label);
                          return (
                            <div
                              key={item.label}
                              className={`flex items-center justify-between gap-3 rounded-[14px] border px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.07)] ${tone.ring} ${tone.bg}`}
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

                <div className={sectionPanelClass}>
                  <div className="mb-4">
                    <h3 className="text-sm font-bold text-gray-800">
                      Weekly Proposal Trend
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      Proposal volume over the last 8 weeks.
                    </p>
                  </div>
                  {renderTrendLine(growthMetrics.proposalMetrics.trend)}
                </div>
              </div>
            </div>
          </section>

          <section className={sectionShellClass}>
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <h2 className={sectionTitleClass}>Question health overview</h2>
                <p className={sectionCopyClass}>
                  Coverage, readiness, and quality signals across the question
                  library.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Link href="/admin/questions" className={sectionLinkClass}>
                  Manage questions →
                </Link>
              </div>
            </div>
            <div className="mt-4">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(245,243,255,0.96),rgba(250,248,255,0.82))]`}
                >
                  {renderStatAccent('bg-violet-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-purple-700/80">
                    Total Questions
                  </p>
                  <p className="mt-2 text-2xl font-bold text-purple-700">
                    {growthMetrics.questionMetrics.totalQuestions}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(226,255,251,0.94),rgba(239,252,249,0.76))]`}
                >
                  {renderStatAccent('bg-teal-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-deep/70">
                    Mapped To Dimensions
                  </p>
                  <p className="mt-2 text-2xl font-bold text-teal-deep">
                    {growthMetrics.questionMetrics.mappedQuestions}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,248,225,0.96),rgba(255,251,239,0.8))]`}
                >
                  {renderStatAccent('bg-amber-300/95')}
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700/80">
                    Unmapped
                  </p>
                  <p className="mt-2 text-2xl font-bold text-amber-700">
                    {growthMetrics.questionMetrics.unmappedQuestions}
                  </p>
                </div>
                <div
                  className={`${statCardClass} bg-[linear-gradient(180deg,rgba(255,240,241,0.94),rgba(255,246,246,0.78))]`}
                >
                  {renderStatAccent('bg-rose-300/95')}
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
                <div className={sectionPanelClass}>
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

                <div className={sectionPanelClass}>
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

                <div className={sectionPanelClass}>
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
                    <div className="rounded-[14px] border border-amber-100 bg-amber-50 px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
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
                    <div className="rounded-[14px] border border-rose-100 bg-rose-50 px-3 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
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
            </div>
          </section>
        </div>

        <aside className="relative hidden w-56 shrink-0 p-4 pl-6 lg:block">
          <div className="space-y-2">
            <QuickActions />
            <QuizChart metrics={growthMetrics.quizMetrics} />
          </div>
        </aside>
      </div>

      <EventView
        isOpen={Boolean(selectedOverviewEvent)}
        onClose={() => {
          latestOverviewEventRequestIdRef.current += 1;
          setSelectedOverviewEvent(undefined);
        }}
        event={selectedOverviewEvent}
      />
    </>
  );
}
