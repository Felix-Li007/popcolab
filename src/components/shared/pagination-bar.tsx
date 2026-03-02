'use client';

import Link from 'next/link';

type Props = {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  prevHref?: string;
  nextHref?: string;
  variant?: 'default' | 'circle';
};

export default function PaginationBar({
  page,
  totalPages,
  onPageChange,
  prevHref,
  nextHref,
  variant = 'default',
}: Props) {
  if (totalPages <= 1) return null;

  const isCircle = variant === 'circle';
  const wrapClass = isCircle
    ? 'px-3 py-2 border-t border-gray-100 flex items-center justify-between shrink-0'
    : 'px-3 py-2 border-t border-gray-100 flex items-center justify-between shrink-0';
  const buttonClass = isCircle
    ? 'w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors'
    : 'w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors';
  const iconClass = isCircle ? 'w-5 h-5' : 'w-5 h-5';
  const labelClass = isCircle
    ? 'text-badge font-semibold text-foreground/65'
    : 'text-badge font-semibold text-foreground/65';
  const handlePageChange = onPageChange;
  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  function PrevIcon() {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  function NextIcon() {
    return (
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        className={iconClass}
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  function renderPrev() {
    if (handlePageChange) {
      return (
        <button
          type="button"
          onClick={() => handlePageChange(Math.max(1, page - 1))}
          disabled={prevDisabled}
          title="Previous page"
          className={`${buttonClass} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <PrevIcon />
        </button>
      );
    }

    if (!prevDisabled && prevHref) {
      return (
        <Link href={prevHref} title="Previous page" className={buttonClass}>
          <PrevIcon />
        </Link>
      );
    }

    return (
      <span
        className={`${buttonClass} opacity-30 pointer-events-none`}
        aria-hidden="true"
      >
        <PrevIcon />
      </span>
    );
  }

  function renderNext() {
    if (handlePageChange) {
      return (
        <button
          type="button"
          onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
          disabled={nextDisabled}
          title="Next page"
          className={`${buttonClass} disabled:opacity-30 disabled:cursor-not-allowed`}
        >
          <NextIcon />
        </button>
      );
    }

    if (!nextDisabled && nextHref) {
      return (
        <Link href={nextHref} title="Next page" className={buttonClass}>
          <NextIcon />
        </Link>
      );
    }

    return (
      <span
        className={`${buttonClass} opacity-30 pointer-events-none`}
        aria-hidden="true"
      >
        <NextIcon />
      </span>
    );
  }

  return (
    <div className={wrapClass}>
      {renderPrev()}

      <span className={labelClass}>
        {page} / {totalPages}
      </span>

      {renderNext()}
    </div>
  );
}
