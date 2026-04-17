'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/shared/date-picker';
import PaginationBar from '@/components/shared/pagination-bar';
import type {
  UserRequestsPageData,
  UserRequestStatusFilter,
} from '@/services/request-service';
import type { Question } from '@/types/question-type';
import type { UserTeamItem } from '@/services/user-team-service';
import type { RequestAttendeesSummary } from '@/services/request-attendee-service';
import { REQUEST_STATUS, type RequestStatus } from '@/constants/request-status';
import { Button, Search } from '@/ui';
import RequestCard from './request-card';
import NewRequestModal from './new-request-modal';

type Tab = 'all' | RequestStatus;

const TABS: {
  key: Tab;
  label: string;
  statKey: keyof UserRequestsPageData['statusCounts'];
}[] = [
  { key: 'all', label: 'All', statKey: 'total' },
  { key: REQUEST_STATUS.OPENED, label: 'OPENED', statKey: 'opened' },
  { key: REQUEST_STATUS.PENDING, label: 'PENDING', statKey: 'pending' },
  { key: REQUEST_STATUS.MATCHED, label: 'MATCHED', statKey: 'matched' },
  { key: REQUEST_STATUS.CLOSED, label: 'CLOSED', statKey: 'closed' },
];

type Props = Readonly<{
  pageData: UserRequestsPageData;
  query: {
    status: UserRequestStatusFilter;
    userEmail: string;
    createdFrom: string;
    createdTo: string;
    page: number;
  };
  leaderQuestions: Question[];
  userTeams: UserTeamItem[];
  attendeeMap: Record<number, RequestAttendeesSummary>;
}>;

function buildRequestsHref(params: {
  status: UserRequestStatusFilter;
  userEmail: string;
  createdFrom: string;
  createdTo: string;
  page: number;
}): string {
  const searchParams = new URLSearchParams();

  if (params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.userEmail.trim()) {
    searchParams.set('user_email', params.userEmail.trim());
  }
  if (params.createdFrom) {
    searchParams.set('created_from', params.createdFrom);
  }
  if (params.createdTo) {
    searchParams.set('created_to', params.createdTo);
  }
  if (params.page > 1) {
    searchParams.set('page', String(params.page));
  }

  const queryString = searchParams.toString();
  return queryString
    ? `/dashboard/requests?${queryString}`
    : '/dashboard/requests';
}

function toPickerDateTime(value: string, isEndOfDay: boolean): string {
  if (!value) return '';
  return `${value}T${isEndOfDay ? '23:59' : '00:00'}`;
}

function toDateParam(value: string): string {
  if (!value) return '';
  const [datePart = ''] = value.split('T');
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '';
}

export default function RequestsContent({
  pageData,
  query,
  leaderQuestions,
  userTeams,
  attendeeMap,
}: Props) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [createdFromValue, setCreatedFromValue] = useState(() =>
    toPickerDateTime(query.createdFrom, false)
  );
  const [createdToValue, setCreatedToValue] = useState(() =>
    toPickerDateTime(query.createdTo, true)
  );

  function handleModalClose() {
    setModalKey(k => k + 1);
    setModalOpen(false);
    window.location.href = '/dashboard/requests';
  }

  const createdFromDateParam = toDateParam(createdFromValue);
  const createdToDateParam = toDateParam(createdToValue);

  const prevHref =
    pageData.currentPage > 1
      ? buildRequestsHref({
          status: query.status,
          userEmail: query.userEmail,
          createdFrom: query.createdFrom,
          createdTo: query.createdTo,
          page: pageData.currentPage - 1,
        })
      : undefined;

  const nextHref =
    pageData.currentPage < pageData.totalPages
      ? buildRequestsHref({
          status: query.status,
          userEmail: query.userEmail,
          createdFrom: query.createdFrom,
          createdTo: query.createdTo,
          page: pageData.currentPage + 1,
        })
      : undefined;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-section-eyebrow">Requests workspace</p>
          <h1 className="mt-2 text-xl font-bold text-gray-800">Requests</h1>
          <p className="mt-1 text-xs text-[#E91E8C]">
            Submit an experience request — admin will review and respond
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="dashboard-pill-button dashboard-pill-button--primary"
        >
          + New Request
        </button>
      </div>

      <div className="overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(248,250,252,0.74))] shadow-[0_18px_40px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.86)] backdrop-blur-xl">
        <div className="p-3 sm:p-4">
          <form
            action="/dashboard/requests"
            method="GET"
            className="grid items-end gap-3 rounded-[1.1rem] border border-white/75 bg-white/80 p-3 xl:grid-cols-[220px_220px_minmax(340px,1fr)_auto]"
          >
            {query.status !== 'all' ? (
              <input type="hidden" name="status" value={query.status} />
            ) : null}
            {createdFromDateParam ? (
              <input
                type="hidden"
                name="created_from"
                value={createdFromDateParam}
              />
            ) : null}
            {createdToDateParam ? (
              <input
                type="hidden"
                name="created_to"
                value={createdToDateParam}
              />
            ) : null}

            <DatePicker
              id="request-created-from"
              ariaLabel="Created from"
              value={createdFromValue}
              onChange={setCreatedFromValue}
              placeholder="Created from"
              defaultTime="00:00"
              triggerIcon="calendar"
              inputClassName="h-10 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-4 text-sm text-slate-700"
            />

            <DatePicker
              id="request-created-to"
              ariaLabel="Created to"
              value={createdToValue}
              onChange={setCreatedToValue}
              placeholder="Created to"
              defaultTime="23:59"
              triggerIcon="calendar"
              inputClassName="h-10 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-4 text-sm text-slate-700"
            />

            <div className="flex flex-col">
              <Search
                name="user_email"
                defaultValue={query.userEmail}
                placeholder="User Email"
                buttonLabel="Search"
                wrapperClassName="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-0 overflow-hidden rounded-full border border-[rgba(15,23,42,0.08)] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.04)]"
                iconClassName="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                inputClassName="h-10 w-full border-0 bg-transparent pl-11 pr-3 text-sm text-slate-700 outline-none focus:ring-0"
                buttonClassName="h-10 min-w-[110px] rounded-full rounded-l-none border-0 bg-[#E91E8C] px-5 text-sm font-semibold text-white shadow-none hover:bg-[#d61b80]"
              />
            </div>

            <div className="flex items-end justify-start xl:justify-end">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-10 min-w-[80px] px-5"
                onClick={() => router.push('/dashboard/requests')}
              >
                Clear
              </Button>
            </div>
          </form>

          <div className="mt-1 rounded-[1.1rem] border border-white/70 bg-white/74 px-2.5 py-2">
            <div className="flex flex-wrap gap-2">
              {TABS.map(t => {
                const count = pageData.statusCounts[t.statKey];
                return (
                  <Link
                    key={t.key}
                    href={buildRequestsHref({
                      status: t.key,
                      userEmail: query.userEmail,
                      createdFrom: query.createdFrom,
                      createdTo: query.createdTo,
                      page: 1,
                    })}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                      query.status === t.key
                        ? 'bg-[#E91E8C] text-white shadow-[0_12px_22px_rgba(233,30,140,0.24)]'
                        : 'bg-white/82 text-gray-500 hover:bg-white hover:text-gray-700'
                    }`}
                  >
                    {t.label} ({count})
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-3">
            {pageData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
                <p className="text-sm font-semibold text-gray-500">
                  No requests found.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Try another status, date range, or user email.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-4">
                {pageData.items.map(req => (
                  <RequestCard
                    key={req.id}
                    request={req}
                    attendeeSummary={
                      attendeeMap[req.id] ?? {
                        attendees: [],
                        dominantPersonality: null,
                      }
                    }
                    onResubmit={() => setModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="mt-3">
            <PaginationBar
              page={pageData.currentPage}
              totalPages={pageData.totalPages}
              prevHref={prevHref}
              nextHref={nextHref}
              variant="dashboard"
            />
          </div>
        </div>
      </div>

      <NewRequestModal
        key={modalKey}
        open={modalOpen}
        onClose={handleModalClose}
        leaderQuestions={leaderQuestions}
        userTeams={userTeams}
      />
    </>
  );
}
