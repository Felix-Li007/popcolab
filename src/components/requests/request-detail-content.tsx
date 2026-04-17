'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { UserRequestDetail } from '@/services/request-service';
import type { RequestAttendeesSummary } from '@/services/request-attendee-service';
import { Badge, Button } from '@/ui';
import AttendeePersonalityPanel from './attendee-personality-panel';
import { cancelRequestAction } from '@/actions/request-actions';

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatBudget(min: number | null, max: number | null): string {
  if (min === null && max === null) return '—';
  if (min !== null && max !== null) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
  }
  return `$${(min ?? max ?? 0).toLocaleString()}`;
}

function formatScheduleChip(value: {
  date: Date;
  startTime: Date | null;
  endTime: Date | null;
}): string {
  const dateText = formatDate(value.date);

  if (!value.startTime || !value.endTime) {
    return dateText;
  }

  const startText = new Date(value.startTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
  const endText = new Date(value.endTime).toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  return `${dateText} ${startText} - ${endText}`;
}

function renderText(value: string | null | undefined): string {
  if (!value) return '—';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '—';
}

function sanitizeAdditionalDetails(value: string | null | undefined): string {
  if (!value) return '—';

  const cleaned = value
    .split('\n')
    .map(line => line.trim())
    .filter(
      line =>
        line.length > 0 &&
        !line.toLowerCase().startsWith('proposal deadline:') &&
        !line.toLowerCase().startsWith('location:') &&
        !line.toLowerCase().startsWith('preferred date(s)')
    )
    .join('\n');

  return renderText(cleaned);
}

type Props = {
  request: UserRequestDetail;
  attendeeSummary: RequestAttendeesSummary;
};

const STATUS_BADGE_VARIANTS: Record<
  UserRequestDetail['status'],
  React.ComponentProps<typeof Badge>['variant']
> = {
  OPENED: 'secondary',
  PENDING: 'warning',
  MATCHED: 'info',
  CLOSED: 'default',
};

function DetailField({
  label,
  value,
}: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="rounded-[1.35rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,250,252,0.78))] px-4 py-3 shadow-[0_14px_34px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.9)]">
      <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <p className="mt-2 text-sm font-semibold leading-snug text-slate-800 [font-family:var(--font-museo),var(--font-nunito),sans-serif]">
        {value}
      </p>
    </div>
  );
}

export default function RequestDetailContent({
  request,
  attendeeSummary,
}: Props) {
  const [cancelling, startCancel] = useTransition();
  const router = useRouter();
  const [preferencesCollapsed, setPreferencesCollapsed] = useState(false);
  const groupedPreferences = request.requestPreferences.reduce<
    Array<{
      categoryName: string;
      items: typeof request.requestPreferences;
    }>
  >((groups, preference) => {
    const categoryName = preference.categoryName?.trim() || 'Other';
    const existingGroup = groups.find(
      group => group.categoryName === categoryName
    );

    if (existingGroup) {
      existingGroup.items.push(preference);
    } else {
      groups.push({ categoryName, items: [preference] });
    }

    return groups;
  }, []);
  const [activePreferenceCategory, setActivePreferenceCategory] = useState(
    groupedPreferences[0]?.categoryName ?? ''
  );
  const resolvedActivePreferenceCategory = groupedPreferences.some(
    group => group.categoryName === activePreferenceCategory
  )
    ? activePreferenceCategory
    : (groupedPreferences[0]?.categoryName ?? '');
  const activePreferenceGroup = groupedPreferences.find(
    group => group.categoryName === resolvedActivePreferenceCategory
  );

  return (
    <>
      {/* Back link */}
      <Link
        href="/dashboard/requests"
        className="mb-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-[0_10px_24px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:text-slate-800"
      >
        ← Back to Requests
      </Link>

      {/* Request details */}
      <div className="dashboard-glass-panel mb-5 px-5 py-5 sm:px-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dashboard-section-eyebrow">Request Details</p>
            <h2 className="dashboard-section-title mt-2">
              {renderText(request.objectiveCategory)}
            </h2>
            <p className="mt-1 text-[11px] text-slate-400">
              A complete snapshot of the request you submitted.
            </p>
          </div>
          <Badge
            size="xs"
            variant={STATUS_BADGE_VARIANTS[request.status] ?? 'default'}
            className="shadow-[0_10px_20px_rgba(15,23,42,0.06)]"
          >
            {request.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <DetailField label="Request ID" value={request.id} />
          <DetailField label="User ID" value={request.userId} />
          <DetailField
            label="Budget"
            value={formatBudget(request.budgetMin, request.budgetMax)}
          />
          <DetailField
            label="Participants"
            value={
              request.participantCount
                ? `${request.participantCount} people`
                : '—'
            }
          />
          <DetailField
            label="Delivery Method"
            value={renderText(request.deliveryMethod)}
          />
          <DetailField
            label="Duration Max"
            value={request.durationMax ? `${request.durationMax} hours` : '—'}
          />
          <DetailField label="Constraint Mode" value={request.constraintMode} />
          <DetailField label="Capacity Max" value={request.capacityMax} />
          <DetailField
            label="Deadline"
            value={formatDateTime(request.deadlineDate)}
          />
          <DetailField
            label="Expires At"
            value={formatDateTime(request.expiredAt)}
          />
          <DetailField
            label="Created At"
            value={formatDateTime(request.createdAt)}
          />
          <DetailField
            label="Updated At"
            value={formatDateTime(request.updatedAt)}
          />
        </div>

        <div className="mt-5 rounded-[1.5rem] border border-white/65 bg-white/45 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
            Preferred Date Options
          </span>
          {request.preferredDateTimes.length === 0 ? (
            <p className="mt-3 text-sm font-medium text-slate-700">—</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2.5">
              {request.preferredDateTimes.map((item, index) => (
                <span
                  key={`${item.date.toISOString()}-${item.startTime?.toISOString() ?? 'start'}-${index}`}
                  className="inline-flex items-center rounded-full border border-teal-200/80 bg-[linear-gradient(180deg,rgba(236,254,255,0.98),rgba(204,251,241,0.88))] px-3.5 py-1.5 text-[11px] font-semibold text-teal-700 shadow-[0_8px_16px_rgba(13,148,136,0.09)]"
                >
                  {formatScheduleChip(item)}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 rounded-[1.5rem] border border-white/65 bg-white/45 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
          <span className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-slate-400">
            Additional Details
          </span>
          <p className="mt-3 text-sm leading-7 text-slate-700 whitespace-pre-wrap">
            {sanitizeAdditionalDetails(request.notesForAdmin)}
          </p>
        </div>

        {/* Status message */}
        <div className="mt-4 rounded-[1.4rem] border border-white/65 bg-white/50 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
          {request.status === 'OPENED' && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-slate-500">
                ⏳ Waiting for admin to review your request
              </p>
              <Button
                disabled={cancelling}
                onClick={() =>
                  startCancel(async () => {
                    await cancelRequestAction(request.id);
                    router.push('/dashboard/requests');
                  })
                }
                variant="secondary"
                size="sm"
                className="shrink-0 !rounded-full border-red-200 bg-white/90 text-[11px] font-semibold text-red-500 transition hover:-translate-y-0.5 hover:bg-red-50 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling…' : 'Cancel Request'}
              </Button>
            </div>
          )}
          {(request.status === 'PENDING' || request.status === 'MATCHED') && (
            <p className="text-[11px] font-medium text-amber-600">
              🔍 Admin is currently reviewing this request
            </p>
          )}
          {request.status === 'CLOSED' && (
            <p className="text-[11px] font-medium text-slate-500">
              This request has been closed.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="dashboard-glass-panel px-5 py-5 sm:px-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="dashboard-section-eyebrow">Request Preferences</p>
            </div>
            <button
              type="button"
              onClick={() => setPreferencesCollapsed(prev => !prev)}
              aria-expanded={!preferencesCollapsed}
              aria-label={
                preferencesCollapsed
                  ? 'Expand request preferences'
                  : 'Collapse request preferences'
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-base text-slate-500 shadow-[0_10px_20px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-pink-200 hover:text-pink-700"
            >
              {preferencesCollapsed ? '+' : '−'}
            </button>
          </div>
          {!preferencesCollapsed &&
            (groupedPreferences.length === 0 ? (
              <p className="text-[11px] text-gray-400 italic">
                No request preferences captured.
              </p>
            ) : (
              <div className="space-y-4">
                <div
                  className="flex flex-wrap gap-2"
                  role="tablist"
                  aria-label="Request preference categories"
                >
                  {groupedPreferences.map(group => {
                    const isActive =
                      group.categoryName === resolvedActivePreferenceCategory;

                    return (
                      <button
                        key={group.categoryName}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() =>
                          setActivePreferenceCategory(group.categoryName)
                        }
                        className={
                          isActive
                            ? 'inline-flex items-center rounded-full border border-pink-200 bg-pink-50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-pink-700 shadow-[0_8px_18px_rgba(190,24,93,0.08)]'
                            : 'inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 transition hover:-translate-y-0.5 hover:border-pink-200 hover:text-pink-700'
                        }
                      >
                        {group.categoryName}
                      </button>
                    );
                  })}
                </div>

                {activePreferenceGroup ? (
                  <div className="max-h-[44rem] space-y-2.5 overflow-y-auto pr-1">
                    {activePreferenceGroup.items.map(item => (
                      <div
                        key={item.id}
                        className="rounded-[1.35rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.76))] px-4 py-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.05),inset_0_1px_0_rgba(255,255,255,0.86)]"
                      >
                        <p className="text-sm font-semibold leading-6 text-slate-800 [font-family:var(--font-museo),var(--font-nunito),sans-serif]">
                          {renderText(item.questionText)}
                        </p>
                        <p className="mt-2 text-[12px] leading-6 text-slate-600">
                          {renderText(item.answerText)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
        </div>

        {/* Attendees & Collective Personality Analysis */}
        <div className="dashboard-glass-panel px-5 py-5 sm:px-6">
          <p className="dashboard-section-eyebrow mb-1">
            Collective Personality Analysis
          </p>

          {attendeeSummary.attendees.length === 0 ? (
            <p className="rounded-[1.35rem] border border-dashed border-slate-200 bg-white/55 px-4 py-4 text-[12px] italic text-slate-400">
              No attendees invited yet.
            </p>
          ) : (
            <div className="max-h-[52rem] overflow-y-auto pr-1">
              <AttendeePersonalityPanel summary={attendeeSummary} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
