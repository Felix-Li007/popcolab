'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DatePicker from '@/components/shared/date-picker';
import PaginationBar from '@/components/shared/pagination-bar';
import { Button, Search } from '@/ui';
import type {
  UserProposalsPageData,
  UserProposalStatusFilter,
} from '@/services/proposal-service';
import UserProposalCard from './user-proposal-card';

type Props = {
  pageData: UserProposalsPageData;
  query: {
    status: UserProposalStatusFilter;
    requestId: number | null;
    createdFrom: string;
    createdTo: string;
    page: number;
  };
};

const TABS: Array<{
  key: UserProposalStatusFilter;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'APPROVED', label: 'APPROVED' },
  { key: 'PENDING', label: 'PENDING' },
  { key: 'ACCEPTED', label: 'ACCEPTED' },
  { key: 'REJECTED', label: 'REJECTED' },
];

function buildProposalsHref(params: {
  status: UserProposalStatusFilter;
  requestId: number | null;
  createdFrom: string;
  createdTo: string;
  page: number;
}): string {
  const searchParams = new URLSearchParams();

  if (params.status !== 'all') {
    searchParams.set('status', params.status);
  }
  if (params.requestId !== null) {
    searchParams.set('request_id', String(params.requestId));
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
    ? `/dashboard/proposals?${queryString}`
    : '/dashboard/proposals';
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

export default function UserProposalsContent({
  pageData,
  query,
}: Readonly<Props>) {
  const router = useRouter();
  const totalCount =
    pageData.statusCounts.APPROVED +
    pageData.statusCounts.PENDING +
    pageData.statusCounts.ACCEPTED +
    pageData.statusCounts.REJECTED;
  const [createdFromValue, setCreatedFromValue] = useState(() =>
    toPickerDateTime(query.createdFrom, false)
  );
  const [createdToValue, setCreatedToValue] = useState(() =>
    toPickerDateTime(query.createdTo, true)
  );

  const createdFromDateParam = toDateParam(createdFromValue);
  const createdToDateParam = toDateParam(createdToValue);

  const prevHref =
    pageData.currentPage > 1
      ? buildProposalsHref({
          status: query.status,
          requestId: query.requestId,
          createdFrom: query.createdFrom,
          createdTo: query.createdTo,
          page: pageData.currentPage - 1,
        })
      : undefined;

  const nextHref =
    pageData.currentPage < pageData.totalPages
      ? buildProposalsHref({
          status: query.status,
          requestId: query.requestId,
          createdFrom: query.createdFrom,
          createdTo: query.createdTo,
          page: pageData.currentPage + 1,
        })
      : undefined;

  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="dashboard-section-eyebrow">Proposals workspace</p>
          <h1 className="mt-2 text-xl font-bold text-gray-800">Proposals</h1>
          <p className="mt-1 text-xs text-[#E91E8C]">
            Review experience proposals prepared for your requests
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/80 bg-white/58 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <form
          action="/dashboard/proposals"
          method="GET"
          className="grid items-end gap-3 rounded-[1.4rem] border border-white/75 bg-white/80 p-3 xl:grid-cols-[220px_220px_minmax(340px,1fr)_auto]"
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
            <input type="hidden" name="created_to" value={createdToDateParam} />
          ) : null}

          <DatePicker
            id="proposal-created-from"
            ariaLabel="Created from"
            value={createdFromValue}
            onChange={setCreatedFromValue}
            placeholder="Created from"
            defaultTime="00:00"
            triggerIcon="calendar"
            inputClassName="h-10 rounded-full border border-[rgba(15,23,42,0.08)] bg-white px-4 text-sm text-slate-700"
          />

          <DatePicker
            id="proposal-created-to"
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
              name="request_id"
              defaultValue={query.requestId ?? ''}
              placeholder="Request ID"
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
              onClick={() => router.push('/dashboard/proposals')}
            >
              Clear
            </Button>
          </div>
        </form>

        <div className="mt-1 rounded-[1.4rem] border border-white/70 bg-white/74 px-2.5 py-2">
          <div className="flex flex-wrap gap-2">
            {TABS.map(tab => {
              const count =
                tab.key === 'all' ? totalCount : pageData.statusCounts[tab.key];

              return (
                <Link
                  key={tab.key}
                  href={buildProposalsHref({
                    status: tab.key,
                    requestId: query.requestId,
                    createdFrom: query.createdFrom,
                    createdTo: query.createdTo,
                    page: 1,
                  })}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    query.status === tab.key
                      ? 'bg-[#E91E8C] text-white shadow-[0_12px_22px_rgba(233,30,140,0.24)]'
                      : 'bg-white/82 text-gray-500 hover:bg-white hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({count})
                </Link>
              );
            })}
          </div>
        </div>

        <div className="mt-3 rounded-[1.7rem] border border-white/70 bg-white/55 p-3">
          <div className="rounded-[1.5rem] border border-white/70 bg-white/40 p-3">
            {pageData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-gray-200/90 bg-white/55 py-16 text-center backdrop-blur-xl">
                <p className="text-sm font-semibold text-gray-500">
                  No proposals found.
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Try another status, date range, or request ID.
                </p>
              </div>
            ) : (
              <div
                className={`grid gap-4 ${
                  pageData.items.length > 1 ? 'xl:grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {pageData.items.map(proposal => (
                  <UserProposalCard key={proposal.id} proposal={proposal} />
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
    </>
  );
}
